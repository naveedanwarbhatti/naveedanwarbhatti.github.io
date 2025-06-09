import requests
from bs4 import BeautifulSoup
import csv

PROFILE_URL = "https://scholar.google.com.pk/citations?hl=en&user=6ZB86uYAAAAJ"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100 Safari/537.36"
}

def fetch_page(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def parse_metrics(soup: BeautifulSoup):
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


def parse_citation_history(soup: BeautifulSoup) -> str:
    hist = soup.find("div", class_="gsc_md_hist_w")
    return str(hist) if hist else ""


def main():
    soup = fetch_page(PROFILE_URL)
    metrics = parse_metrics(soup)
    pubs = parse_publications(soup)
    hist_html = parse_citation_history(soup)

    with open("publications_stats.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Metric", "All", "Since2020"])
        writer.writerows(metrics)

    with open("publications.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Title", "Authors", "Venue", "Year", "Citations"])
        writer.writerows(pubs)

    if hist_html:
        with open("citation_history.html", "w", encoding="utf-8") as f:
            f.write(hist_html)


if __name__ == "__main__":
    main()
