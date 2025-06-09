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
                parts.forEach(function(value) {
                    var td = document.createElement('td');
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        });
}

document.addEventListener('DOMContentLoaded', loadStats);
