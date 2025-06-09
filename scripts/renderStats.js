/**
 * Renders the citation metrics table from CSV data.
 * @param {string} text - The CSV data as a string.
 */
function renderStatsTable(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;

    const headerLine = lines.shift();
    const headers = headerLine.split(',');

    // Update table header
    const thead_tr = document.querySelector('#stats-table thead tr');
    if (thead_tr) {
        thead_tr.innerHTML = ''; // Clear existing headers
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.className = 'gsc_rsb_sth';
            th.textContent = headerText || ''; // Handle empty header for the first column
            thead_tr.appendChild(th);
        });
    }

    // Update table body
    const tbody = document.getElementById('stats-table-body');
    if (!tbody) return;
    tbody.innerHTML = ''; // Clear existing rows
    lines.forEach(line => {
        const parts = line.split(',');
        const tr = document.createElement('tr');
        
        // Create link for the metric name (e.g., Citations)
        const metricTd = document.createElement('td');
        const metricLink = document.createElement('a');
        metricLink.href = 'https://scholar.google.com.pk/citations?user=6ZB86uYAAAAJ&hl=en'; // Link to profile
        metricLink.target = '_blank';
        metricLink.textContent = parts[0];
        metricTd.appendChild(metricLink);
        tr.appendChild(metricTd);

        // Add the other cells (All, Since YYYY)
        for (let i = 1; i < parts.length; i++) {
            const td = document.createElement('td');
            td.textContent = parts[i];
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

/**
 * Renders the citation history graph from CSV data.
 * @param {string} text - The CSV data as a string.
 */
function renderCitationGraph(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;
    lines.shift(); // remove header

    const graphContainer = document.getElementById('citation-graph');
    if (!graphContainer) return;
    graphContainer.innerHTML = ''; // Clear previous content

    const historyData = lines.map(line => {
        const [year, citations] = line.split(',');
        return { year, citations: parseInt(citations, 10) || 0 };
    });

    if (historyData.length === 0) return;

    const maxCitations = Math.max(...historyData.map(d => d.citations));
    const graphHeight = 140; // Max height of a bar in pixels

    historyData.forEach(data => {
        const barItem = document.createElement('div');
        barItem.className = 'graph-bar-item';

        const bar = document.createElement('div');
        bar.className = 'graph-bar';
        const barHeight = maxCitations > 0 ? (data.citations / maxCitations) * graphHeight : 0;
        bar.style.height = `${barHeight}px`;

        const barLabel = document.createElement('span');
        barLabel.className = 'bar-label';
        barLabel.textContent = data.citations;
        
        const yearLabel = document.createElement('div');
        yearLabel.className = 'year-label';
        yearLabel.textContent = data.year;

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
    // Fetch and render the stats table
    fetch('publications_stats.csv')
        .then(res => {
            if (!res.ok) throw new Error(`Failed to load publications_stats.csv: ${res.statusText}`);
            return res.text();
        })
        .then(text => renderStatsTable(text))
        .catch(e => console.error(e));

    // Fetch and render the citation graph
    fetch('citation_history.csv')
        .then(res => {
            if (res.status === 404) {
                console.log('citation_history.csv not found, skipping graph.');
                return null;
            }
            if (!res.ok) throw new Error(`Failed to load citation_history.csv: ${res.statusText}`);
            return res.text();
        })
        .then(text => {
            if (text) {
                renderCitationGraph(text);
            }
        })
        .catch(e => console.error(e));
}

// Run the function after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadScholarData);