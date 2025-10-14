document.addEventListener('DOMContentLoaded', () => {
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

  if (!nameNodes.length) {
    return;
  }

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
});
