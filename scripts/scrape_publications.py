import csv
import requests
from bs4 import BeautifulSoup
from pathlib import Path

PROFILE_URL = "https://scholar.google.com.pk/citations?hl=en&user=6ZB86uYAAAAJ&pagesize=1000"
OUTPUT_CSV = Path(__file__).resolve().parent.parent / "publications.csv"


def scrape_profile(url: str) -> list[dict]:
    """Scrape publications from the Google Scholar profile."""
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    rows = soup.select("tr.gsc_a_tr")
    publications = []
    for row in rows:
        title = row.select_one("a.gsc_a_at").get_text(strip=True)
        authors, venue = [d.get_text(strip=True) for d in row.select("div.gs_gray")[:2]]
        year = row.select_one("span.gsc_a_h, span.gsc_a_hc, span.gsc_a_y")
        year_text = year.get_text(strip=True) if year else ""
        cites = row.select_one("a.gsc_a_ac")
        citations = cites.get_text(strip=True) if cites else "0"
        publications.append({
            "Title": title,
            "Authors": authors,
            "Venue": venue,
            "Year": year_text,
            "Citations": citations or "0",
        })
    return publications


def write_csv(publications: list[dict], path: Path) -> None:
    fieldnames = ["Title", "Authors", "Venue", "Year", "Citations"]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for pub in publications:
            writer.writerow(pub)


def main() -> None:
    pubs = scrape_profile(PROFILE_URL)
    write_csv(pubs, OUTPUT_CSV)


if __name__ == "__main__":
    main()
