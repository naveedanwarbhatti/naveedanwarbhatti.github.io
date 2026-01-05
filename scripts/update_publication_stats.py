import argparse
import csv
import random
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

PROFILE_URL = "https://scholar.google.com.pk/citations?hl=en&user=6ZB86uYAAAAJ"

# A list of common user agents to rotate through for each request
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
]

def get_headers() -> dict:
    """
    Returns a dictionary of headers to mimic a real browser.
    A random User-Agent is chosen for each request.
    """
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "DNT": "1",  # Do Not Track
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

class ProxyBlockedError(requests.exceptions.HTTPError):
    """Raised when Google Scholar blocks the request (HTTP 403 or CAPTCHA page)."""


def fetch_page(url: str, max_retries: int = 3, delay: int = 5) -> BeautifulSoup:
    """
    Fetches and parses a URL, returning a BeautifulSoup object.
    Includes retries with exponential backoff to handle temporary blocks.
    """
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1} of {max_retries} to fetch {url}...")
            resp = requests.get(url, headers=get_headers(), timeout=30)

            # Check for block pages that might return a 200 OK status
            if "Our systems have detected unusual traffic" in resp.text:
                raise ProxyBlockedError("Blocked by Google Scholar (CAPTCHA or error page)")

            if resp.status_code == 403:
                raise ProxyBlockedError("Received HTTP 403 from Google Scholar")

            resp.raise_for_status()  # Raises HTTPError for bad responses (4xx or 5xx)
            return BeautifulSoup(resp.text, "html.parser")

        except ProxyBlockedError:
            raise
        except requests.exceptions.RequestException as e:
            print(f"Error fetching page: {e}")
            if attempt < max_retries - 1:
                wait_time = delay * (2 ** attempt)  # Exponential backoff: 5s, 10s, 20s
                print(f"Waiting {wait_time} seconds before retrying...")
                time.sleep(wait_time)
            else:
                print("Max retries reached. Failing.")
                raise  # Re-raise the last exception if all retries fail
    return None

def parse_metrics(soup: BeautifulSoup):
    """Parses the main citation metrics (Citations, h-index, i10-index)."""
    table = soup.find("table", id="gsc_rsb_st")
    metrics = []
    if not table:
        return metrics
    for row in table.select("tr"):
        cells = row.find_all("td")
        if len(cells) == 3:
            metric = cells[0].get_text(strip=True)
            all_time = cells[1].get_text(strip=True)
            since = cells[2].get_text(strip=True)
            metrics.append([metric, all_time, since])
    return metrics


def parse_publications(soup: BeautifulSoup):
    """Parses the list of publications."""
    pubs = []
    for row in soup.select("#gsc_a_b .gsc_a_tr"):
        title_el = row.select_one(".gsc_a_t a")
        title = title_el.get_text(strip=True) if title_el else ""
        author_el = row.select_one(".gsc_a_t .gs_gray")
        authors = author_el.get_text(strip=True) if author_el else ""
        venue_el = row.select(".gsc_a_t .gs_gray")
        venue = venue_el[1].get_text(strip=True) if len(venue_el) > 1 else ""
        cites_el = row.select_one(".gsc_a_c a")
        citations = cites_el.get_text(strip=True) if cites_el else row.select_one(".gsc_a_c").get_text(strip=True)
        year_el = row.select_one(".gsc_a_y span")
        year = year_el.get_text(strip=True) if year_el else ""
        pubs.append([title, authors, venue, year, citations])
    return pubs


def parse_citation_history_from_main_page(soup: BeautifulSoup):
    """
    Parses the year-by-year citation history directly from the graph
    on the main profile page.
    """
    history = []
    graph_container = soup.find("div", class_="gsc_md_hist_b")
    if not graph_container:
        return history

    years = [y.get_text(strip=True) for y in graph_container.select(".gsc_g_t")]
    counts = [c.get_text(strip=True) for c in graph_container.select(".gsc_g_al")]
    
    history = list(zip(years, counts))
    history.reverse()
    return history


def parse_local_html(path: Path) -> BeautifulSoup:
    """Load a local HTML snapshot of the Scholar profile."""
    with path.open("r", encoding="utf-8") as f:
        return BeautifulSoup(f.read(), "html.parser")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch Google Scholar stats and write CSV outputs.")
    parser.add_argument(
        "--html-file",
        type=Path,
        help=(
            "Path to a locally saved HTML snapshot of the Google Scholar profile. "
            "Useful when the network is blocked."
        ),
    )
    parser.add_argument(
        "--prefer-html",
        action="store_true",
        help="Use the local HTML snapshot first; fall back to the network only if it is missing.",
    )
    return parser


def main():
    """Main function to scrape all data and write to CSV files."""
    parser = build_arg_parser()
    args = parser.parse_args()

    try:
        print("Fetching data from Google Scholar...")
        profile_soup = None

        if args.html_file and args.prefer_html:
            print(f"Loading Scholar data from local snapshot: {args.html_file}")
            profile_soup = parse_local_html(args.html_file)
        else:
            try:
                profile_soup = fetch_page(PROFILE_URL)
            except ProxyBlockedError as e:
                if args.html_file:
                    print(f"Network access blocked ({e}). Falling back to local HTML snapshot: {args.html_file}")
                    profile_soup = parse_local_html(args.html_file)
                else:
                    raise

        if not profile_soup:
            print("Failed to fetch profile page after multiple retries.")
            return

        # --- Parse Metrics ---
        metrics = parse_metrics(profile_soup)
        header_cells = profile_soup.select("#gsc_rsb_st th")
        metric_headers = [h.get_text(strip=True) for h in header_cells]
        if not metric_headers:
            metric_headers = ["Metric", "All", "Since 2020"] # Fallback

        with open("publications_stats.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(metric_headers)
            writer.writerows(metrics)
        print("Successfully wrote publications_stats.csv")

        # --- Parse Publications ---
        pubs = parse_publications(profile_soup)
        with open("publications.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Title", "Authors", "Venue", "Year", "Citations"])
            writer.writerows(pubs)
        print("Successfully wrote publications.csv")

        # --- Parse Citation History ---
        history = parse_citation_history_from_main_page(profile_soup)
        if history:
            with open("citation_history.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["Year", "Citations"])
                writer.writerows(history)
            print("Successfully wrote citation_history.csv")
        else:
            print("Could not find citation history data on the main page.")
            
        print("\nAll tasks completed.")

    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        # Exit with a non-zero status code to indicate failure in the workflow
        exit(1)

if __name__ == "__main__":
    main()
