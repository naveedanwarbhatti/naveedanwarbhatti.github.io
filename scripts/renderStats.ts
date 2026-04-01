interface MetricRow {
    Metric: string;
    All: string;
    Since2020: string;
}

const currentScriptUrl = document.currentScript instanceof HTMLScriptElement && document.currentScript.src
    ? document.currentScript.src
    : null;

function resolveSiteUrl(path: string): string {
    const normalizedPath = path.replace(/^\/+/, '');

    if (currentScriptUrl) {
        return new URL(`../${normalizedPath}`, currentScriptUrl).toString();
    }

    const fallbackPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
    return new URL(`${fallbackPrefix}${normalizedPath}`, document.baseURI).toString();
}

function loadStats() {
    fetch(resolveSiteUrl('data/publications_stats.csv'))
        .then(res => res.text())
        .then(text => {
            const lines = text.trim().split(/\r?\n/);
            lines.shift(); // remove header
            const tbody = document.getElementById('stats-table-body');
            if (!tbody) return;
            lines.forEach(line => {
                const [metric, all, since] = line.split(',');
                const tr = document.createElement('tr');
                [metric, all, since].forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        });
}

document.addEventListener('DOMContentLoaded', loadStats);
