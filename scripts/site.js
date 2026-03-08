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

  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('.js-current-year').forEach((node) => {
    node.textContent = currentYear;
  });

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

  const paperPanels = document.querySelectorAll('.paper-panel[data-url]');

  paperPanels.forEach((panel) => {
    const { url, target = '_self', rel = '' } = panel.dataset;
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
    panel.setAttribute('role', 'link');

    const target = primaryLink.getAttribute('target') || '_self';
    const rel = primaryLink.getAttribute('rel') || '';

    bindClickablePanel(panel, {
      url: href,
      target,
      rel,
      blockedSelector: 'a',
    });
  });

  const NAME_FULL = 'Naveed Anwar Bhatti';
  const NAME_SHORT = 'Naveed Bhatti';
  const nameNodes = [];

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!node.nodeValue || (parent && (parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE'))) {
          return NodeFilter.FILTER_REJECT;
        }

        return node.nodeValue.includes(NAME_FULL)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    },
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    nameNodes.push({ node, original: node.nodeValue });
  }

  if (nameNodes.length) {
    const applyNameVariant = () => {
      const useShort = window.innerWidth <= 640;
      nameNodes.forEach(({ node, original }) => {
        node.nodeValue = useShort
          ? original.replaceAll(NAME_FULL, NAME_SHORT)
          : original;
      });
    };

    applyNameVariant();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(applyNameVariant, 150);
    };

    window.addEventListener('resize', handleResize);
  }
});
