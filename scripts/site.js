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
