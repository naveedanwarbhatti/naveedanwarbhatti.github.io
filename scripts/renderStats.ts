interface MetricRow {
    Metric: string;
    All: string;
    Since2020: string;
}

function loadStats() {
    fetch('publications_stats.csv')
        .then(res => res.text())
        .then(text => {
            const lines = text.trim().split(/\r?\n/);
            lines.shift(); // remove header
            const tbody = document.getElementById('stats-table-body');
            if (!tbody) return;
            lines.forEach(line => {
                const [metric, all, since] = line.split(',');
                const tr = document.createElement('tr');
                [metric, all, since].forEach((value, idx) => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.className = idx === 0 ? 'gsc_rsb_sth' : 'gsc_rsb_std';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        });
}

function loadCitationHistory() {
    fetch('citation_history.html')
        .then(res => res.text())
        .then(html => {
            const container = document.getElementById('citation-history');
            if (container) {
                container.innerHTML = html;
            }
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadCitationHistory();
});
