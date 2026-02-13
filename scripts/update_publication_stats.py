#!/usr/bin/env python3
"""Update Google Scholar metrics + citation history (exactly as shown on your public profile).

Google Scholar has no official public API for author metrics. This script fetches the public
profile HTML and parses the exact numbers shown there (metrics table + citation chart).

Outputs (written to --out-dir, default: data/):
- data/publications_stats.csv   (metrics: citations, h-index, i10-index; All + Since X)
- data/citation_history.csv     (citations per year from the Scholar bar chart)
- data/publications.csv         (title/authors/venue/year/citations; best-effort via pagination)

Reliability notes:
- Scholar may intermittently block automated requests (CAPTCHA / "not a robot").
- Default behavior is non-strict: if blocked, the script exits 0 and leaves existing CSVs unchanged.
  Use --strict to fail the run when blocked.
"""

from __future__ import annotations

import argparse
import csv
import random
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional, Tuple
from urllib.parse import parse_qs, urlparse

import requests
from bs4 import BeautifulSoup


DEFAULT_PROFILE_URL = "https://scholar.google.com.pk/citations?hl=en&user=6ZB86uYAAAAJ"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]

BLOCK_PATTERNS = [
    r"Please show you're not a robot",
    r"Our systems have detected unusual traffic",
    r"unusual traffic from your computer network",
    r"detected unusual traffic",
    r"enable JavaScript",
    r"Sorry, we can't verify that you're not a robot",
]


@dataclass
class ScholarMetrics:
    headers: Tuple[str, str, str]
    rows: Tuple[Tuple[str, str, str], ...]


def extract_user_id(profile_url: str) -> str:
    parsed = urlparse(profile_url)
    q = parse_qs(parsed.query)
    return (q.get("user") or [""])[0]


def make_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
        "DNT": "1",
        "Upgrade-Insecure-Requests": "1",
    }


def is_blocked_html(html: str) -> bool:
    for pat in BLOCK_PATTERNS:
        if re.search(pat, html or "", flags=re.IGNORECASE):
            return True
    return False


def fetch_soup(
    session: requests.Session,
    url: str,
    *,
    timeout: int = 30,
    max_retries: int = 3,
    backoff_seconds: int = 5,
    sleep_jitter: float = 0.7,
) -> BeautifulSoup:
    last_exc: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = session.get(url, headers=make_headers(), timeout=timeout)
            resp.raise_for_status()
            if is_blocked_html(resp.text):
                raise RuntimeError("Blocked by Google Scholar (CAPTCHA / robot check).")
            return BeautifulSoup(resp.text, "html.parser")
        except Exception as exc:
            last_exc = exc
            if attempt < max_retries:
                wait = backoff_seconds * (2 ** (attempt - 1))
                wait = wait + random.random() * sleep_jitter
                print(f"[warn] Fetch failed (attempt {attempt}/{max_retries}): {exc}. Sleeping {wait:.1f}s...")
                time.sleep(wait)
            else:
                break
    raise RuntimeError(f"Failed to fetch {url}: {last_exc}") from last_exc


def load_local_snapshot(path: Path) -> BeautifulSoup:
    html = path.read_text(encoding="utf-8", errors="ignore")
    return BeautifulSoup(html, "html.parser")


def parse_metrics(soup: BeautifulSoup) -> ScholarMetrics:
    table = soup.find("table", id="gsc_rsb_st")
    if not table:
        raise ValueError("Could not find metrics table (#gsc_rsb_st).")

    ths = [th.get_text(strip=True) for th in table.find_all("th")]
    if len(ths) >= 3:
        headers = (ths[0] or "Metric", ths[1] or "All", ths[2] or "Since")
    else:
        headers = ("Metric", "All", "Since")

    rows = []
    for tr in table.find_all("tr"):
        tds = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(tds) == 3:
            rows.append((tds[0], tds[1], tds[2]))

    if not rows:
        raise ValueError("Metrics table found, but no metrics rows parsed.")
    return ScholarMetrics(headers=headers, rows=tuple(rows))


def parse_citation_history(soup: BeautifulSoup) -> Tuple[Tuple[str, str], ...]:
    # Scholar citation graph: year labels (.gsc_g_t) and counts (.gsc_g_al)
    years = [s.get_text(strip=True) for s in soup.select("span.gsc_g_t")]
    cites = [s.get_text(strip=True) for s in soup.select("span.gsc_g_al")]

    if not years or not cites or len(years) != len(cites):
        container = soup.find("div", class_="gsc_md_hist_b") or soup
        years = [s.get_text(strip=True) for s in container.select(".gsc_g_t")]
        cites = [s.get_text(strip=True) for s in container.select(".gsc_g_al")]

    pairs = []
    for y, c in zip(years, cites):
        if not y:
            continue
        pairs.append((y, c or "0"))

    def to_int(x: str) -> int:
        try:
            return int(re.sub(r"[^\d]", "", x))
        except Exception:
            return 0

    pairs.sort(key=lambda p: to_int(p[0]))
    return tuple(pairs)


def parse_publications_from_soup(soup: BeautifulSoup) -> Tuple[Tuple[str, str, str, str, str], ...]:
    pubs = []
    for row in soup.select("#gsc_a_b .gsc_a_tr"):
        title_el = row.select_one(".gsc_a_t a")
        title = title_el.get_text(strip=True) if title_el else ""

        gray = row.select(".gsc_a_t .gs_gray")
        authors = gray[0].get_text(strip=True) if len(gray) > 0 else ""
        venue = gray[1].get_text(strip=True) if len(gray) > 1 else ""

        cites_el = row.select_one(".gsc_a_c a") or row.select_one(".gsc_a_c")
        citations = cites_el.get_text(strip=True) if cites_el else ""

        year_el = row.select_one(".gsc_a_y span") or row.select_one(".gsc_a_y")
        year = year_el.get_text(strip=True) if year_el else ""

        pubs.append((title, authors, venue, year, citations))
    return tuple(pubs)


def fetch_all_publications(
    session: requests.Session,
    profile_url: str,
    *,
    pagesize: int = 100,
    max_pages: int = 20,
    sleep_seconds: float = 1.5,
) -> Tuple[Tuple[str, str, str, str, str], ...]:
    """Best-effort pagination of publications using cstart/pagesize."""
    user_id = extract_user_id(profile_url)
    if not user_id:
        return tuple()

    parsed = urlparse(profile_url)
    base = f"{parsed.scheme}://{parsed.netloc}/citations"
    hl = (parse_qs(parsed.query).get("hl") or ["en"])[0]

    all_rows = []
    seen_titles = set()

    for page_idx in range(max_pages):
        cstart = page_idx * pagesize
        urls = [
            f"{base}?user={user_id}&hl={hl}&cstart={cstart}&pagesize={pagesize}",
            f"{base}?user={user_id}&hl={hl}&cstart={cstart}&pagesize={pagesize}&view_op=list_works",
        ]

        page_rows = []
        last_error = None
        for u in urls:
            try:
                soup = fetch_soup(session, u, max_retries=2, backoff_seconds=3)
                page_rows = list(parse_publications_from_soup(soup))
                if page_rows:
                    break
            except Exception as exc:
                last_error = exc

        if not page_rows:
            if last_error:
                print(f"[warn] Publications fetch page {page_idx+1} failed: {last_error}")
            break

        new_count = 0
        for r in page_rows:
            if r[0] and r[0] not in seen_titles:
                seen_titles.add(r[0])
                all_rows.append(r)
                new_count += 1

        print(f"[info] Publications page {page_idx+1}: +{new_count} new rows")
        if len(page_rows) < pagesize:
            break

        time.sleep(sleep_seconds + random.random() * 0.7)

    return tuple(all_rows)


def write_csv(path: Path, headers: Iterable[str], rows: Iterable[Iterable[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(list(headers))
        for r in rows:
            w.writerow(list(r))


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch exact Google Scholar author stats and write CSV outputs.")
    ap.add_argument("--profile-url", default=DEFAULT_PROFILE_URL, help="Public Google Scholar profile URL.")
    ap.add_argument("--out-dir", default="data", help="Output directory (default: data).")

    ap.add_argument("--html-file", type=Path, help="Optional: local HTML snapshot (used if provided).")
    ap.add_argument("--prefer-html", action="store_true", help="Prefer local snapshot over network.")
    ap.add_argument("--strict", action="store_true", help="Fail when Scholar blocks or parsing fails.")

    ap.add_argument("--pagesize", type=int, default=100, help="Publications pagesize (default: 100).")
    ap.add_argument("--max-pages", type=int, default=20, help="Max pages to paginate publications (default: 20).")
    ap.add_argument("--sleep", type=float, default=1.5, help="Sleep seconds between pages (default: 1.5).")

    args = ap.parse_args()

    out_dir = Path(args.out_dir)
    stats_csv = out_dir / "publications_stats.csv"
    history_csv = out_dir / "citation_history.csv"
    pubs_csv = out_dir / "publications.csv"

    session = requests.Session()

    try:
        if args.html_file and args.prefer_html:
            print(f"[info] Loading local snapshot: {args.html_file}")
            soup = load_local_snapshot(args.html_file)
        else:
            print(f"[info] Fetching profile: {args.profile_url}")
            soup = fetch_soup(session, args.profile_url)

        metrics = parse_metrics(soup)
        history = parse_citation_history(soup)

        pubs = ()
        try:
            pubs = fetch_all_publications(
                session,
                args.profile_url,
                pagesize=args.pagesize,
                max_pages=args.max_pages,
                sleep_seconds=args.sleep,
            )
            if not pubs:
                pubs = parse_publications_from_soup(soup)
        except Exception as exc:
            print(f"[warn] Could not fetch full publication list: {exc}. Falling back to main page rows.")
            pubs = parse_publications_from_soup(soup)

        write_csv(stats_csv, metrics.headers, metrics.rows)
        write_csv(history_csv, ["Year", "Citations"], history)
        write_csv(pubs_csv, ["Title", "Authors", "Venue", "Year", "Citations"], pubs)

        print(f"[ok] Wrote: {stats_csv}")
        print(f"[ok] Wrote: {history_csv}")
        print(f"[ok] Wrote: {pubs_csv}")
        return 0

    except Exception as exc:
        print(f"[error] {exc}")
        if args.strict:
            return 1
        print("[warn] Non-strict mode: leaving existing CSVs unchanged.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
