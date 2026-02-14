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
    if (!parts.length) return;

    const tr = document.createElement('tr');

    const metricTd = document.createElement('td');
    const metricLink = document.createElement('a');
    metricLink.href = 'https://scholar.google.com.pk/citations?user=6ZB86uYAAAAJ&hl=en';
    metricLink.target = '_blank';
    metricLink.rel = 'noopener';
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
  const containerHeight = graphContainer.clientHeight || 112;
  // Reserve vertical space for value + year labels and small gaps.
  const graphHeight = Math.max(46, containerHeight - 34);

  recentHistory.forEach(data => {
    const barItem = document.createElement('div');
    barItem.className = 'graph-bar-item';
    barItem.style.flex = '1 1 0';
    barItem.style.minWidth = '0';

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

  syncStatisticsPanelHeight();
}

/**
 * Shrinks the citation graph (if needed) so the Statistics panel ends where
 * the Ranking Summary panel ends.
 */
function syncStatisticsPanelHeight() {
  const scholarsPanel = document.querySelector('.panel-scholars');
  const rankingPanel = document.querySelector('.panel-ranking');
  const graphContainer = document.getElementById('citation-graph');

  if (!scholarsPanel || !rankingPanel || !graphContainer) return;

  // Reset any previous inline height before measuring.
  graphContainer.style.height = '';

  const overflow = Math.ceil(scholarsPanel.getBoundingClientRect().height - rankingPanel.getBoundingClientRect().height);
  if (overflow <= 0) return;

  const currentGraphHeight = graphContainer.getBoundingClientRect().height;
  const minGraphHeight = 72;
  const targetHeight = Math.max(minGraphHeight, Math.floor(currentGraphHeight - overflow));

  graphContainer.style.height = `${targetHeight}px`;
}

/**
 * Small CSV parser for simple (comma-separated) files.
 * - Ignores blank lines and lines starting with #.
 * - Expects no quoted commas.
 */
function parseSimpleCSV(text) {
  const lines = text.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
  if (!lines.length) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const parts = line.split(',').map(p => p.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = parts[i] ?? ''; });
    return obj;
  });

  return { headers, rows };
}

function pluralizePapers(n) {
  return `${n} ${n === 1 ? 'paper' : 'papers'}`;
}

function rankToClass(rankRaw) {
  const rank = (rankRaw || '').trim().toUpperCase();
  if (rank === 'A*') return 'a_star';
  if (rank === 'A') return 'a';
  if (rank === 'B') return 'b';
  if (rank === 'C') return 'c';
  if (rank === 'Q1') return 'q1';
  if (rank === 'Q2') return 'q2';
  if (rank === 'Q3') return 'q3';
  if (rank === 'Q4') return 'q4';
  return 'a'; // safe default
}

/**
 * Renders Ranking Summary bars from /data/ranking_summary.csv
 * Expected CSV:
 *   type,rank,count
 *   conference,A*,5
 *   journal,Q1,5
 */
function renderRankingSummary(text) {
  const host = document.getElementById('rank-summary');
  if (!host) return;

  const { rows } = parseSimpleCSV(text);
  if (!rows.length) {
    host.innerHTML = '<div class="rank-loading">No ranking data found.</div>';
    return;
  }

  const conferenceOrder = ['A*', 'A', 'B', 'C'];
  const journalOrder = ['Q1', 'Q2', 'Q3', 'Q4'];

  const normalizeType = (t) => (t || '').trim().toLowerCase();
  const toInt = (v) => {
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const confCounts = new Map();
  const jourCounts = new Map();

  rows.forEach(r => {
    const type = normalizeType(r.type);
    const rank = (r.rank || '').trim();
    const count = toInt(r.count);

    if (type === 'conference') confCounts.set(rank, count);
    if (type === 'journal') jourCounts.set(rank, count);
  });

  const confMax = Math.max(0, ...conferenceOrder.map(k => confCounts.get(k) ?? 0));
  const jourMax = Math.max(0, ...journalOrder.map(k => jourCounts.get(k) ?? 0));

  const makeSection = (title, order, countsMap, maxVal) => {
    const section = document.createElement('div');
    section.className = 'rank-section';

    const h4 = document.createElement('h4');
    h4.textContent = title;
    section.appendChild(h4);

    order.forEach(rank => {
      const count = countsMap.get(rank) ?? 0;
      const cls = rankToClass(rank);

      const row = document.createElement('div');
      row.className = 'rank-row';

      const badge = document.createElement('div');
      badge.className = `rank-badge ${cls}`;
      badge.textContent = rank;

      const track = document.createElement('div');
      track.className = 'rank-bar-track';

      const fill = document.createElement('div');
      fill.className = `rank-bar-fill ${cls}`;

      const widthPct = maxVal > 0 ? Math.round((count / maxVal) * 100) : 0;
      fill.style.width = `${widthPct}%`;

      track.appendChild(fill);

      const countEl = document.createElement('div');
      countEl.className = 'rank-count';
      countEl.textContent = pluralizePapers(count);

      row.appendChild(badge);
      row.appendChild(track);
      row.appendChild(countEl);

      section.appendChild(row);
    });

    return section;
  };

  host.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'rank-sections';

  wrap.appendChild(makeSection('Conference Ranking (CORE)', conferenceOrder, confCounts, confMax));
  wrap.appendChild(makeSection('Journal Ranking (SJR)', journalOrder, jourCounts, jourMax));

  host.appendChild(wrap);
}

function loadRankingSummary() {
  const host = document.getElementById('rank-summary');
  if (!host) return;

  fetch('/data/ranking_summary.csv')
    .then(res => res.ok ? res.text() : Promise.reject('Failed to load /data/ranking_summary.csv'))
    .then(text => {
      renderRankingSummary(text);
      syncStatisticsPanelHeight();
    })
    .catch(() => {
      // Keep the placeholder text already in the HTML if fetch fails.
    });
}

/**
 * Main function to load all scholar-related data.
 */
function loadScholarData() {
  fetch('/data/publications_stats.csv')
    .then(res => res.ok ? res.text() : Promise.reject('Failed to load publications_stats.csv'))
    .then(text => renderStatsTable(text))
    .catch(e => console.error(e));

  fetch('/data/citation_history.csv')
    .then(res => {
      if (res.status === 404) return null;
      if (!res.ok) return Promise.reject('Failed to load citation_history.csv');
      return res.text();
    })
    .then(text => {
      if (text) renderCitationGraph(text);
      else syncStatisticsPanelHeight();
    })
    .catch(e => console.error(e));

  loadRankingSummary();
}

document.addEventListener('DOMContentLoaded', loadScholarData);
window.addEventListener('resize', syncStatisticsPanelHeight);
