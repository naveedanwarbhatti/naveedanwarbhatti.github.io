/**
 * Renders the citation metrics table from CSV data.
 * @param {string} text - The CSV data as a string.
 */
function renderStatsTable(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;

    const headerLine = lines.shift();
    const headers = headerLine.split(',');

    const thead_tr = document.querySelector('#stats-table thead tr');
    if (thead_tr) {
        thead_tr.innerHTML = '';
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.className = 'gsc_rsb_sth';
            th.textContent = headerText || '';
            thead_tr.appendChild(th);
        });
    }

    const tbody = document.getElementById('stats-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    lines.forEach(line => {
        const parts = line.split(',');
        const tr = document.createElement('tr');
        
        const metricTd = document.createElement('td');
        const metricLink = document.createElement('a');
        metricLink.href = 'https://scholar.google.com.pk/citations?user=6ZB86uYAAAAJ&hl=en';
        metricLink.target = '_blank';
        metricLink.textContent = parts[0];
        metricTd.appendChild(metricLink);
        tr.appendChild(metricTd);

        for (let i = 1; i < parts.length; i++) {
            const td = document.createElement('td');
            td.textContent = parts[i];
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

/**
 * Renders the citation history graph from CSV data for the last 8 years.
 * @param {string} text - The CSV data as a string.
 */
function renderCitationGraph(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;
    lines.shift(); 

    const graphContainer = document.getElementById('citation-graph');
    if (!graphContainer) return;
    graphContainer.innerHTML = '';

    const parsedHistory = lines
        .map(line => {
            const [year, citations] = line.split(',');
            const yearNum = parseInt(year, 10);
            const citationNum = parseInt(citations, 10);
            return { year: yearNum, citations: Number.isFinite(citationNum) ? citationNum : 0 };
        })
        .filter(entry => Number.isFinite(entry.year));

    if (!parsedHistory.length) return;

    const dedupedHistory = new Map();
    parsedHistory.forEach(({ year, citations }) => {
        const existing = dedupedHistory.get(year);
        dedupedHistory.set(year, Math.max(existing ?? 0, citations));
    });

    const sortedHistory = Array.from(dedupedHistory.entries())
        .map(([year, citations]) => ({ year, citations }))
        .sort((a, b) => a.year - b.year);

    const recentHistory = sortedHistory.slice(-8);
    if (!recentHistory.length) return;

    const maxCitations = Math.max(...recentHistory.map(d => d.citations));
    const graphHeight = 135; 

    recentHistory.forEach(data => {
        const barItem = document.createElement('div');
        barItem.className = 'graph-bar-item';

        const bar = document.createElement('div');
        bar.className = 'graph-bar';
        const barHeight = maxCitations > 0 ? (data.citations / maxCitations) * graphHeight : 0;
        bar.style.height = `${barHeight}px`;

        const barLabel = document.createElement('span');
        barLabel.className = 'bar-label';
        barLabel.textContent = data.citations.toString();
        
        const yearLabel = document.createElement('div');
        yearLabel.className = 'year-label';
        yearLabel.textContent = data.year.toString();

        barItem.appendChild(barLabel);
        barItem.appendChild(bar);
        barItem.appendChild(yearLabel);
        graphContainer.appendChild(barItem);
    });
}

/**
 * Main function to load all scholar-related data.
 */
function loadScholarData() {
    fetch('/data/publications_stats.csv')
        .then(res => res.ok ? res.text() : Promise.reject(`Failed to load publications_stats.csv`))
        .then(text => renderStatsTable(text))
        .catch(e => console.error(e));

    fetch('/data/citation_history.csv')
        .then(res => {
            if (res.status === 404) return null;
            if (!res.ok) return Promise.reject(`Failed to load citation_history.csv`);
            return res.text();
        })
        .then(text => {
            if (text) {
                renderCitationGraph(text);
            }
        })
        .catch(e => console.error(e));
}

document.addEventListener('DOMContentLoaded', loadScholarData);
