function loadStats() {
    fetch('publications_stats.csv')
        .then(function(res) { return res.text(); })
        .then(function(text) {
            var lines = text.trim().split(/\r?\n/);
            lines.shift();
            var tbody = document.getElementById('stats-table-body');
            if (!tbody) return;
            lines.forEach(function(line) {
                var parts = line.split(',');
                var tr = document.createElement('tr');
                parts.forEach(function(value, idx) {
                    var td = document.createElement('td');
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
        .then(function(res) { return res.text(); })
        .then(function(html) {
            var container = document.getElementById('citation-history');
            if (container) {
                container.innerHTML = html;
            }
        });
}

document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadCitationHistory();
});
