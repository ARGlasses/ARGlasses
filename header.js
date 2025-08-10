// header.js — mobile-friendly dropdowns + off-canvas
(function () {
  if (window.__headerInit) return;
  window.__headerInit = true;

  // ---------- Helpers ----------
  const mqMobile = '(max-width: 768px)';
  const isMobile = () => window.matchMedia(mqMobile).matches;

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function openDrawer() {
    const menu = qs('#primary-nav');
    const backdrop = qs('#backdrop');
    const toggle = qs('#menu-toggle');
    if (!menu || !backdrop) return;
    menu.classList.add('open');
    backdrop.classList.add('show');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const menu = qs('#primary-nav');
    const backdrop = qs('#backdrop');
    const toggle = qs('#menu-toggle');
    if (!menu || !backdrop) return;
    menu.classList.remove('open');
    backdrop.classList.remove('show');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // collapse any open submenus
    qsa('#primary-nav .dropdown.open').forEach(li => li.classList.remove('open'));
    qsa('#primary-nav .submenu-toggle[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  }

  function toggleSubmenuFrom(el) {
    const li = el.closest('.dropdown');
    if (!li) return;
    const btn = li.querySelector('.submenu-toggle');
    const isOpen = li.classList.toggle('open');
    if (btn) btn.setAttribute('aria-expanded', String(isOpen));
  }

  // ---------- Populate dynamic submenus (Products/News) ----------
  function populateDynamicLists() {
    qsa('#primary-nav .dropdown-menu[data-page]').forEach(listEl => {
      const pageHref = new URL(listEl.getAttribute('data-page'), location.href).toString();
      const articleSel = listEl.getAttribute('data-article-selector') || 'article';
      const titleSel = listEl.getAttribute('data-title-selector') || 'h1';

      fetch(pageHref, { credentials: 'same-origin' })
        .then(r => r.text())
        .then(html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const nodes = Array.from(doc.querySelectorAll(articleSel)).slice(0, 5);
          const items = nodes.map((el, i) => {
            const id = el.getAttribute('id') || `item-${i+1}`;
            const t = el.querySelector(titleSel) || el.querySelector('h1, h2, [role="heading"]');
            const title = (t ? t.textContent : `Item ${i+1}`).trim();
            return { href: `${pageHref}#${id}`, title };
          });

          // “View all” always present
          let htmlList = `<li><a href="${pageHref}"><strong>View all →</strong></a></li>`;
          htmlList += items.map(it => `<li><a href="${it.href}">${it.title}</a></li>`).join('');
          listEl.innerHTML = htmlList;
        })
        .catch(() => {
          listEl.innerHTML = `<li><a href="${pageHref}"><strong>View all →</strong></a></li>`;
        });
    });
  }

  // ---------- Event wiring (click + touch) ----------
  function bindEvents() {
    const backdrop = qs('#backdrop');
    const menu = qs('#primary-nav');

    // Open/close drawer
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('#menu-toggle');
      if (toggle) {
        e.preventDefault();
        if (menu && menu.classList.contains('open')) closeDrawer(); else openDrawer();
        return;
      }

      if (backdrop && e.target === backdrop) {
        closeDrawer();
        return;
      }

      // Submenu handling on mobile
      const submenuTrigger = e.target.closest('.has-submenu, .submenu-toggle');
      if (submenuTrigger && isMobile()) {
        e.preventDefault();
        e.stopPropagation();
        toggleSubmenuFrom(submenuTrigger);
        return;
      }

      // Clicking a link inside the open drawer: let navigation proceed
      if (isMobile() && e.target.closest('#primary-nav a')) {
        return;
      }
    }, { passive: false });

    // Touch support (some devices are finicky with click)
    document.addEventListener('touchend', (e) => {
      const submenuTrigger = e.target.closest('.has-submenu, .submenu-toggle');
      if (submenuTrigger && isMobile()) {
        e.preventDefault();
        toggleSubmenuFrom(submenuTrigger);
      }
    }, { passive: false });

    // Keyboard + resize
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu && menu.classList.contains('open')) closeDrawer();
    });
    window.addEventListener('resize', () => { if (!isMobile()) closeDrawer(); });
  }

  // ---------- Theme switch (optional) ----------
  function initNavbarScrollTheme() {
    const navbar = document.getElementById('navbar');
    const heroSection = document.querySelector('.hero');
    if (!navbar || !heroSection) return;
    function updateNavbarTheme() {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if (heroBottom <= 0) {
        navbar.classList.remove('dark-nav');
        navbar.classList.add('light-nav');
      } else {
        navbar.classList.remove('light-nav');
        navbar.classList.add('dark-nav');
      }
    }
    window.addEventListener('scroll', updateNavbarTheme);
    window.addEventListener('DOMContentLoaded', updateNavbarTheme);
  }

  function init() {
    if (!document.getElementById('primary-nav')) return;
    populateDynamicLists();
    bindEvents();
    initNavbarScrollTheme();
  }

  // Run when header is injected or DOM is ready
  window.__initHeader = init;
  window.addEventListener('header:ready', init);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }
})();
