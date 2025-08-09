// header.js (init-safe; builds dropdowns from H1s in <article> on target pages)
(function () {
  if (window.__headerInit) return;
  window.__headerInit = true;

  // ----- Drawer open/close helpers -----
  function openDrawer(menu, backdrop, toggle) {
    menu.classList.add('open');
    backdrop.classList.add('show');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(menu, backdrop, toggle) {
    menu.classList.remove('open');
    backdrop.classList.remove('show');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menu.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    menu.querySelectorAll('.submenu-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function bindDelegatedClicks() {
    document.addEventListener('click', function (e) {
      const menu = document.getElementById('primary-nav');
      const toggle = document.getElementById('menu-toggle');
      const backdrop = document.getElementById('backdrop');
      if (!menu || !backdrop) return;

      if (e.target.closest('#menu-toggle')) {
        e.preventDefault();
        menu.classList.contains('open') ? closeDrawer(menu, backdrop, toggle) : openDrawer(menu, backdrop, toggle);
        return;
      }
      if (e.target === backdrop) {
        closeDrawer(menu, backdrop, toggle);
        return;
      }
      if (e.target.closest('.drawer-close')) {
        e.preventDefault();
        closeDrawer(menu, backdrop, toggle);
        return;
      }

      const submenuTrigger = e.target.closest('.has-submenu, .submenu-toggle');
      if (submenuTrigger) {
        if (window.matchMedia('(max-width: 768px)').matches) {
          e.preventDefault();
          e.stopPropagation();
          const li = submenuTrigger.closest('.dropdown');
          if (!li) return;
          const isOpen = li.classList.contains('open');
          li.classList.toggle('open', !isOpen);
          const chev = li.querySelector('.submenu-toggle');
          if (chev) chev.setAttribute('aria-expanded', (!isOpen).toString());
        }
        return;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const menu = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (menu.classList.contains('open')) closeDrawer(menu, backdrop, toggle);
    });

    window.addEventListener('resize', () => {
      const menu = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (!window.matchMedia('(max-width: 768px)').matches) closeDrawer(menu, backdrop, toggle);
    });
  }

  // ----- Theme switch on scroll -----
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

  function highlightActiveLink() {
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#primary-nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (href === here) a.classList.add('active');
    });
  }

  // ----- Generic submenu builder: uses H1 in each <article> on a given page -----
  function buildSubmenuFromPage(listEl) {
    if (!listEl) return;

    const pageHref = new URL(listEl.getAttribute('data-page') || '.', location.href).toString();
    const articleSel = listEl.getAttribute('data-article-selector') || 'article';
    const titleSel = listEl.getAttribute('data-title-selector') || 'h1';

    fetch(pageHref, { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' fetching ' + pageHref);
        return r.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const nodes = Array.from(doc.querySelectorAll(articleSel)).slice(0, 5);
        if (!nodes.length) {
          listEl.innerHTML = `<li><a href="${pageHref}">All items →</a></li>`;
          return;
        }
        const items = nodes.map((el, i) => {
          const id = el.getAttribute('id') || `item-${i+1}`;
          const t = el.querySelector(titleSel) || el.querySelector('h1, h2, [role="heading"]');
          const title = (t ? t.textContent : `Item ${i+1}`).trim();
          return { href: `${pageHref}#${id}`, title };
        });
        listEl.innerHTML = items.map(({ href, title }) =>
          `<li><a href="${href}">${escapeHtml(title)}</a></li>`
        ).join('');
      })
      .catch(err => {
        console.error('[header] submenu build failed for', pageHref, err);
        listEl.innerHTML = `<li><a href="${pageHref}">All items →</a></li>`;
      });

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  }

  // ----- Init (safe to call multiple times) -----
  function init() {
    // Only proceed if the header is actually in the DOM
    if (!document.getElementById('primary-nav')) return;

    bindDelegatedClicks();
    initNavbarScrollTheme();
    highlightActiveLink();

    // Build News + Products from their pages using H1s
    buildSubmenuFromPage(document.getElementById('news-submenu'));
    buildSubmenuFromPage(document.getElementById('products-submenu'));
  }

  // Expose for pages that inject header.html then call __initHeader()
  window.__initHeader = init;

  // Also, if someone dispatches a custom event after injecting the header:
  window.addEventListener('header:ready', init);

  // If the header is already on the page at parse time (no injection), run once on DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Slight delay to let any sync injections finish
    setTimeout(init, 0);
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }
})();
