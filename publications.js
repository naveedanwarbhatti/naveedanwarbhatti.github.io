var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', () => {
    loadAndRender();
});
function loadAndRender() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield loadCSV('publications.csv');
        renderTable(data);
    });
}
function loadCSV(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield fetch(path);
        const text = yield resp.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        return lines.slice(1).filter(Boolean).map(line => {
            const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
            const record = {};
            headers.forEach((h, i) => {
                var _a;
                record[h] = ((_a = values[i]) === null || _a === void 0 ? void 0 : _a.replace(/^"|"$/g, '')) || '';
            });
            return record;
        });
    });
}
function renderTable(data) {
    const container = document.getElementById('publications');
    if (!container)
        return;
    const table = document.createElement('table');
    table.className = 'pub-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Title', 'Authors', 'Venue', 'Year', 'Citations'].forEach(col => {
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
        ['Title', 'Authors', 'Venue', 'Year', 'Citations'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = pub[key];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}
function sortTable(table, column) {
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const idx = ['Title', 'Authors', 'Venue', 'Year', 'Citations'].indexOf(column);
    const numeric = column === 'Year' || column === 'Citations';
    rows.sort((a, b) => {
        const av = a.children[idx].textContent || '';
        const bv = b.children[idx].textContent || '';
        if (numeric)
            return parseInt(bv) - parseInt(av);
        return av.localeCompare(bv);
    });
    rows.forEach(r => tbody.appendChild(r));
}
