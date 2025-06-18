import requests
from bs4 import BeautifulSoup
import csv
import re

PROFILE_URL = "https://scholar.google.com.pk/citations?user=6ZB86uYAAAAJ"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100 Safari/537.36"
}

def fetch_page(url: str) -> BeautifulSoup:
    """Fetches and parses a URL, returning a BeautifulSoup object."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


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
    on the main profile page. This is more reliable than a second request.
    """
    history = []
    graph_container = soup.find("div", class_="gsc_md_hist_b")
    if not graph_container:
        return history

    # Get the years and the citation counts
    years = [y.get_text(strip=True) for y in graph_container.select(".gsc_g_t")]
    counts = [c.get_text(strip=True) for c in graph_container.select(".gsc_g_al")]
    
    # Combine them into a list of [year, count]
    # We zip them together and reverse the list to have the most recent year first
    history = list(zip(years, counts))
    history.reverse()

    return history


def main():
    """Main function to scrape all data and write to CSV files."""
    print("Fetching data from Google Scholar...")
    
    # Scrape the main profile page just once
    profile_soup = fetch_page(PROFILE_URL)
    
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

    # --- Parse Citation History (New Method) ---
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

if __name__ == "__main__":
    main()
