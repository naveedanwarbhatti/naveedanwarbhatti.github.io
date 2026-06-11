const currentScriptUrl = document.currentScript instanceof HTMLScriptElement && document.currentScript.src
  ? document.currentScript.src
  : null;

const resolveSiteUrl = (path) => {
  const normalizedPath = path.replace(/^\/+/, '');

  if (currentScriptUrl) {
    return new URL(`../${normalizedPath}`, currentScriptUrl).toString();
  }

  const fallbackPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
  return new URL(`${fallbackPrefix}${normalizedPath}`, document.baseURI).toString();
};

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const bindClickablePanel = (panel, options = {}) => {
    const {
      url,
      target = '_self',
      rel = '',
      blockedSelector = 'a',
    } = options;

    if (!url) {
      return;
    }

    const openLink = (forcedTarget) => {
      const finalTarget = forcedTarget ?? target;

      if (!finalTarget || finalTarget === '_self') {
        window.location.assign(url);
        return;
      }

      const newWindow = window.open(url, finalTarget);
      if (newWindow && rel.includes('noopener')) {
        newWindow.opener = null;
      }
    };

    panel.addEventListener('click', (event) => {
      const targetElement = event.target;
      if (targetElement instanceof Element && targetElement.closest(blockedSelector)) {
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        openLink('_blank');
        return;
      }
      openLink();
    });

    panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      openLink();
    });

    panel.addEventListener('auxclick', (event) => {
      if (event.button !== 1) {
        return;
      }
      event.preventDefault();
      openLink('_blank');
    });
  };

  const loadedScripts = new Map();

  const loadScriptOnce = (src) => {
    if (loadedScripts.has(src)) {
      return loadedScripts.get(src);
    }

    const existing = Array.from(document.scripts).find((script) => script.src === src);
    if (existing) {
      const promise = Promise.resolve(existing);
      loadedScripts.set(src, promise);
      return promise;
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = reject;
      document.body.appendChild(script);
    });

    loadedScripts.set(src, promise);
    return promise;
  };

  const loadedStylesheets = new Map();

  const loadStylesheetOnce = (href) => {
    if (loadedStylesheets.has(href)) {
      return loadedStylesheets.get(href);
    }

    const existing = Array.from(document.styleSheets).find((sheet) => sheet.href === href);
    if (existing) {
      const promise = Promise.resolve(existing);
      loadedStylesheets.set(href, promise);
      return promise;
    }

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve(link);
      link.onerror = reject;
      document.head.appendChild(link);
    });

    loadedStylesheets.set(href, promise);
    return promise;
  };

  const whenNearViewport = (target, callback, rootMargin = '700px 0px') => {
    if (!target) {
      return;
    }

    let hasRun = false;
    const run = () => {
      if (hasRun) {
        return;
      }
      hasRun = true;
      callback();
    };

    if (!('IntersectionObserver' in window)) {
      run();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }
      observer.disconnect();
      run();
    }, { rootMargin });

    observer.observe(target);
  };

  const loadDeferredIframes = () => {
    document.querySelectorAll('iframe[data-src]').forEach((frame) => {
      const host = frame.closest('.embed-wrapper, .contact-panel--map') || frame;
      whenNearViewport(host, () => {
        if (!frame.dataset.src) {
          return;
        }
        frame.src = frame.dataset.src;
        frame.removeAttribute('data-src');
      });
    });
  };

  const titleInstagramIframes = () => {
    document.querySelectorAll('.instagram-grid iframe').forEach((frame, index) => {
      if (!frame.title) {
        frame.title = `Instagram photography embed ${index + 1}`;
      }
    });
  };

  const loadInstagramEmbeds = () => {
    const grid = document.querySelector('.instagram-grid');
    if (!grid) {
      return;
    }

    if (!grid.querySelector('.instagram-media')) {
      return;
    }

    titleInstagramIframes();
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(titleInstagramIframes);
      observer.observe(grid, { childList: true, subtree: true });
    }

    whenNearViewport(grid, () => {
      loadScriptOnce('https://www.instagram.com/embed.js')
        .then(() => {
          window.instgrm?.Embeds?.process?.();
          window.setTimeout(titleInstagramIframes, 600);
        })
        .catch(() => {});
    }, '900px 0px');
  };

  const loadVisitedMap = () => {
    const mapNode = document.getElementById('chartdiv');
    if (!mapNode) {
      return;
    }

    const initMap = () => {
      if (mapNode.dataset.mapReady === 'true' || !window.am5 || !window.am5map || !window.am5geodata_worldLow) {
        return;
      }

      mapNode.dataset.mapReady = 'true';
      window.am5.ready(() => {
        const root = window.am5.Root.new('chartdiv');

        if (window.am5themes_Animated) {
          root.setThemes([
            window.am5themes_Animated.new(root),
          ]);
        }

        const chart = root.container.children.push(
          window.am5map.MapChart.new(root, {
            panX: 'none',
            panY: 'none',
            wheelX: 'none',
            wheelY: 'none',
            projection: window.am5map.geoMercator(),
          }),
        );

        const polygonSeries = chart.series.push(
          window.am5map.MapPolygonSeries.new(root, {
            geoJSON: {
              type: 'FeatureCollection',
              features: window.am5geodata_worldLow.features.filter((feature) => feature.id !== 'AQ'),
            },
          }),
        );

        const visitedCountries = ['AT', 'DK', 'FI', 'FR', 'DE', 'IT', 'PK', 'PT', 'SE', 'TR', 'AE', 'US'];

        polygonSeries.mapPolygons.template.adapters.add('fill', (fill, target) => {
          if (visitedCountries.includes(target.dataItem.get('id'))) {
            return window.am5.color(0xf39c12);
          }
          return window.am5.color(0xcccccc);
        });

        polygonSeries.mapPolygons.template.setAll({
          tooltipText: '{name}',
          strokeOpacity: 0.2,
        });
      });
    };

    whenNearViewport(mapNode, () => {
      loadScriptOnce('https://cdn.amcharts.com/lib/5/index.js')
        .then(() => loadScriptOnce('https://cdn.amcharts.com/lib/5/map.js'))
        .then(() => loadScriptOnce('https://cdn.amcharts.com/lib/5/geodata/worldLow.js'))
        .then(() => loadScriptOnce('https://cdn.amcharts.com/lib/5/themes/Animated.js'))
        .then(initMap)
        .catch(() => {});
    }, '900px 0px');
  };

  const loadDeferredStatCounter = () => {
    if (!window.sc_project || !window.sc_security) {
      return;
    }

    const schedule = () => {
      let hasLoaded = false;
      const load = () => {
        if (hasLoaded) {
          return;
        }
        hasLoaded = true;
        loadScriptOnce('https://www.statcounter.com/counter/counter.js').catch(() => {});
      };

      const loadWhenIdle = () => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(load, { timeout: 8000 });
        } else {
          load();
        }
      };

      ['pointerdown', 'keydown', 'scroll'].forEach((eventName) => {
        window.addEventListener(eventName, loadWhenIdle, { once: true, passive: true });
      });

      window.setTimeout(loadWhenIdle, 12000);
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }
  };

  const loadDeferredFontAwesome = () => {
    let hasLoaded = false;
    const load = () => {
      if (hasLoaded) {
        return;
      }
      hasLoaded = true;
      loadStylesheetOnce('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css').catch(() => {});
    };

    ['pointerdown', 'keydown', 'scroll'].forEach((eventName) => {
      window.addEventListener(eventName, load, { once: true, passive: true });
    });

    window.setTimeout(load, 10000);
  };

  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('.js-current-year').forEach((node) => {
    node.textContent = currentYear;
  });

  const runWhenIdle = (callback, timeout = 1800) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      window.setTimeout(callback, 0);
    }
  };

  runWhenIdle(() => {
    const timelineRoots = document.querySelectorAll('.career-timeline');
    timelineRoots.forEach((timeline) => {
      const startYear = Number.parseFloat(timeline.dataset.startYear || '');
      if (Number.isNaN(startYear)) {
        return;
      }

      const nowYear = Number.parseInt(currentYear, 10);
      const totalSpan = Math.max(nowYear - startYear, 1);
      const toPercent = (yearValue) => `${((yearValue - startYear) / totalSpan) * 100}%`;

      const educationStart = Number.parseFloat(timeline.dataset.educationStart || String(startYear));
      const educationEnd = Number.parseFloat(timeline.dataset.educationEnd || String(startYear));
      const professionalStart = Number.parseFloat(timeline.dataset.professionalStart || String(educationEnd));

      timeline.style.setProperty('--education-start', toPercent(educationStart));
      timeline.style.setProperty('--education-end', toPercent(Math.min(educationEnd, nowYear)));
      timeline.style.setProperty('--professional-start', toPercent(Math.min(professionalStart, nowYear)));
      timeline.style.setProperty('--professional-end', '100%');

      timeline.querySelectorAll('.career-event').forEach((eventNode) => {
        const start = Number.parseFloat(eventNode.dataset.start || '');
        const endValue = eventNode.dataset.end === 'current'
          ? nowYear
          : Number.parseFloat(eventNode.dataset.end || '');

        if (Number.isNaN(start) || Number.isNaN(endValue)) {
          return;
        }

        const midpoint = start + ((endValue - start) / 2);
        eventNode.style.setProperty('--midpoint', toPercent(midpoint));
      });

      const yearContainer = timeline.querySelector('.career-timeline-years');
      if (!yearContainer) {
        return;
      }

      yearContainer.textContent = '';

      const step = totalSpan > 20 ? 4 : 3;
      const labels = [startYear];
      for (let year = startYear + step; year < nowYear; year += step) {
        labels.push(year);
      }
      if (labels[labels.length - 1] !== nowYear) {
        labels.push(nowYear);
      }

      labels.forEach((year) => {
        const labelNode = document.createElement('span');
        labelNode.textContent = String(year);
        labelNode.style.setProperty('--year-position', toPercent(year));
        yearContainer.appendChild(labelNode);
      });
    });

    const revealNodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (revealNodes.length) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
      } else {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        }, {
          threshold: 0.18,
          rootMargin: '0px 0px -48px 0px',
        });

        revealNodes.forEach((node) => observer.observe(node));
      }
    }
  });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-navigation');

  if (toggle && nav) {
    const toggleMenu = () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      nav.classList.toggle('is-open');
    };

    toggle.addEventListener('click', toggleMenu);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMenu();
      }
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 960) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  runWhenIdle(() => {
    loadDeferredFontAwesome();
    loadDeferredIframes();
    loadInstagramEmbeds();
    loadVisitedMap();
    loadDeferredStatCounter();
  }, 2200);

  const parseSimpleCsv = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    if (lines.length < 2) {
      return { headers: [], rows: [] };
    }

    const headers = lines[0].split(',').map((header) => header.trim());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',').map((part) => part.trim());
      return headers.reduce((row, header, index) => {
        row[header] = parts[index] ?? '';
        return row;
      }, {});
    });

    return { headers, rows };
  };

  const loadHomeMetrics = () => {
    const citationsTotalNode = document.getElementById('home-citations-total');
    const citationsSinceNode = document.getElementById('home-citations-since');
    const hIndexNode = document.getElementById('home-h-index');
    const conferenceQualityNode = document.getElementById('home-conference-quality');
    const journalQualityNode = document.getElementById('home-journal-quality');

    if (!citationsTotalNode && !citationsSinceNode && !hIndexNode && !conferenceQualityNode && !journalQualityNode) {
      return;
    }

    fetch(resolveSiteUrl('data/publications_stats.csv'))
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error('Failed to load publications_stats.csv'))))
      .then((text) => {
        const { headers, rows } = parseSimpleCsv(text);
        const getMetricRow = (name) => rows.find((row) => (row.Metric || '').trim().toLowerCase() === name);
        const citationsRow = getMetricRow('citations');
        const hIndexRow = getMetricRow('h-index');
        const sinceHeader = headers.find((header) => !['metric', 'all'].includes(header.toLowerCase()));

        if (citationsRow?.All && citationsTotalNode) {
          citationsTotalNode.textContent = citationsRow.All;
        }

        if (citationsRow && sinceHeader && citationsRow[sinceHeader] && citationsSinceNode) {
          citationsSinceNode.textContent = `${citationsRow[sinceHeader]} ${sinceHeader.toLowerCase()}`;
        }

        if (hIndexRow?.All && hIndexNode) {
          hIndexNode.textContent = hIndexRow.All;
        }
      })
      .catch((error) => {
        console.error(error);
      });

    fetch(resolveSiteUrl('data/ranking_summary.csv'))
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error('Failed to load ranking_summary.csv'))))
      .then((text) => {
        const { rows } = parseSimpleCsv(text);
        const getRankingCount = (type, rank) => {
          const match = rows.find((row) => (
            (row.type || '').trim().toLowerCase() === type &&
            (row.rank || '').trim().toUpperCase() === rank
          ));
          return match?.count || '';
        };

        const conferenceAStar = getRankingCount('conference', 'A*');
        const journalQ1 = getRankingCount('journal', 'Q1');

        if (conferenceAStar && conferenceQualityNode) {
          conferenceQualityNode.textContent = `${conferenceAStar} A*`;
        }

        if (journalQ1 && journalQualityNode) {
          journalQualityNode.textContent = `${journalQ1} Q1`;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  runWhenIdle(() => {
    loadHomeMetrics();

    const paperPanels = document.querySelectorAll('.paper-panel[data-url]');

    paperPanels.forEach((panel) => {
      const { url, target = '_self', rel = '' } = panel.dataset;
      if (!url || url.trim() === '#' || panel.querySelector('.paper-panel-cover')) {
        return;
      }
      bindClickablePanel(panel, { url, target, rel, blockedSelector: 'a' });
    });

    const mentoringPanels = document.querySelectorAll('#mentoring .student-list li');

    mentoringPanels.forEach((panel) => {
      const primaryLink = panel.querySelector('a:not(.resource-tag)');
      const href = primaryLink?.getAttribute('href') ?? '';

      if (!href || href.trim() === '' || href.trim() === '#') {
        return;
      }

      panel.classList.add('is-clickable-panel');
      panel.setAttribute('tabindex', '0');

      const target = primaryLink.getAttribute('target') || '_self';
      const rel = primaryLink.getAttribute('rel') || '';

      bindClickablePanel(panel, {
        url: href,
        target,
        rel,
        blockedSelector: 'a',
      });
    });
  }, 2200);
});
