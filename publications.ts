interface Publication {
    Title: string;
    Authors: string;
    Venue: string;
    Year: string;
    Citations: string;
}

document.addEventListener('DOMContentLoaded', () => {
    loadAndRender();
});

async function loadAndRender() {
    const data = await loadCSV('publications.csv');
    renderTable(data);
}

async function loadCSV(path: string): Promise<Publication[]> {
    const resp = await fetch(path);
    const text = await resp.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).filter(Boolean).map(line => {
        const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        const record: any = {};
        headers.forEach((h, i) => {
            record[h] = values[i]?.replace(/^"|"$/g, '') || '';
        });
        return record as Publication;
    });
}

function renderTable(data: Publication[]) {
    const container = document.getElementById('publications');
    if (!container) return;

    const table = document.createElement('table');
    table.className = 'pub-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Title','Authors','Venue','Year','Citations'].forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        if (col === 'Year' || col === 'Citations') {
            th.style.cursor = 'pointer';
            th.onclick = () => sortTable(table, col);
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    data.forEach(pub => {
        const tr = document.createElement('tr');
        ['Title','Authors','Venue','Year','Citations'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = (pub as any)[key];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

function sortTable(table: HTMLTableElement, column: 'Year'|'Citations') {
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const idx = ['Title','Authors','Venue','Year','Citations'].indexOf(column);
    const numeric = column === 'Year' || column === 'Citations';
    rows.sort((a, b) => {
        const av = a.children[idx].textContent || '';
        const bv = b.children[idx].textContent || '';
        if (numeric) return parseInt(bv) - parseInt(av);
        return av.localeCompare(bv);
    });
    rows.forEach(r => tbody.appendChild(r));
}
