// News article header controls — isolated from the shared site header behavior.
(function () {
  function initNewsHeader() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('primary-nav');
    const backdrop = document.getElementById('backdrop');
    if (!toggle || !menu || !backdrop || toggle.dataset.newsBound === '1') return;

    const close = () => {
      menu.classList.remove('open');
      backdrop.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      menu.querySelectorAll('.dropdown.open').forEach(li => li.classList.remove('open'));
      menu.querySelectorAll('.submenu-toggle[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
    };

    const open = () => {
      menu.classList.add('open');
      backdrop.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    toggle.dataset.newsBound = '1';
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.contains('open') ? close() : open();
    });

    const closeButton = menu.querySelector('.drawer-close');
    if (closeButton) closeButton.addEventListener('click', function (e) {
      e.preventDefault();
      close();
    });

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    menu.querySelectorAll('.has-submenu, .submenu-toggle').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        e.preventDefault();
        e.stopPropagation();
        const li = trigger.closest('.dropdown');
        if (!li) return;
        const isOpen = li.classList.toggle('open');
        const btn = li.querySelector('.submenu-toggle');
        if (btn) btn.setAttribute('aria-expanded', String(isOpen));
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });

    window.addEventListener('resize', function () {
      if (!window.matchMedia('(max-width: 768px)').matches) close();
    });
  }

  window.__initNewsHeader = initNewsHeader;
  if (!window.__siteSearchScriptRequested) {
    window.__siteSearchScriptRequested = true;
    const searchScript = document.createElement('script');
    searchScript.src = '../search.js?v=2';
    searchScript.defer = true;
    document.head.appendChild(searchScript);
  }
  window.addEventListener('header:ready', initNewsHeader);
})();