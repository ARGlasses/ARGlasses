// header.js (v6.2 - a11y & Products/News builders)
(function () {
  if (window.__headerInit) return;
  window.__headerInit = true;

  let prevBodyOverflow = '';
  let lastFocus = null;

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), select, textarea, input:not([type="hidden"])'
    )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  }

  function trapFocus(e, container) {
    if (e.key !== 'Tab') return;
    const focusables = getFocusable(container);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openDrawer(menu, backdrop, toggle){
    lastFocus = document.activeElement;
    menu.classList.add('open');
    backdrop.classList.add('show');
    document.body.classList.add('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded','true');

    // preserve/lock scroll
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // move focus into the drawer
    const first = getFocusable(menu)[0] || menu;
    first.focus();

    // enable focus trap
    menu.addEventListener('keydown', focusTrapHandler);
  }

  function closeDrawer(menu, backdrop, toggle){
    menu.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded','false');

    // restore scroll
    document.body.style.overflow = prevBodyOverflow || '';

    // reset submenu states (CSS-driven; no inline styles)
    menu.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    menu.querySelectorAll('.submenu-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));

    // remove focus trap and restore focus
    menu.removeEventListener('keydown', focusTrapHandler);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function focusTrapHandler(e){
    const menu = document.getElementById('primary-nav');
    if (menu && menu.classList.contains('open')) trapFocus(e, menu);
  }

  function bindDelegatedClicks(){
    document.addEventListener('click', function(e){
      const menu     = document.getElementById('primary-nav');
      const toggle   = document.getElementById('menu-toggle');
      const backdrop = document.getElementById('backdrop');
      if (!menu || !backdrop) return;

      if (e.target.closest('#menu-toggle')){
        e.preventDefault();
        menu.classList.contains('open') ? closeDrawer(menu, backdrop, toggle) : openDrawer(menu, backdrop, toggle);
        return;
      }
      if (e.target === backdrop){
        closeDrawer(menu, backdrop, toggle);
        return;
      }
      if (e.target.closest('.drawer-close')){
        e.preventDefault();
        closeDrawer(menu, backdrop, toggle);
        return;
      }

      const submenuTrigger = e.target.closest('.has-submenu, .submenu-toggle');
      if (submenuTrigger){
        if (window.matchMedia('(max-width: 768px)').matches){
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
      const menu     = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle   = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (menu.classList.contains('open')) closeDrawer(menu, backdrop, toggle);
    });

    window.addEventListener('resize', () => {
      const menu     = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle   = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (!window.matchMedia('(max-width: 768px)').matches) closeDrawer(menu, backdrop, toggle);
      // also update theme position on resize (hero height can change)
      updateNavbarTheme && updateNavbarTheme();
    });
  }

  let updateNavbarTheme = null;
  function initNavbarScrollTheme() {
    const navbar = document.getElementById('navbar');
    const heroSection = document.querySelector('.hero');
    if (!navbar || !heroSection) return;
    updateNavbarTheme = function() {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if (heroBottom <= 0) {
        navbar.classList.remove('dark-nav');
        navbar.classList.add('light-nav');
      } else {
        navbar.classList.remove('light-nav');
        navbar.classList.add('dark-nav');
      }
    };
    window.addEventListener('scroll', updateNavbarTheme, { passive: true });
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

  // ---------- Builders ----------
  // Build News submenu from news.html (single page with multiple stories)
  function buildNewsSubmenuFromSinglePage() {
    const list = document.getElementById('news-submenu');
    if (!list) return;

    const rawHref    = list.getAttribute('data-news-single') || './news.html';
    const pageHref   = new URL(rawHref, location.href).toString();
    const titleSel   = list.getAttribute('data-news-title-selector') || '.story-title';
    const articleSel = list.getAttribute('data-news-article-selector') || '.story';

    console.info('[header] Building News submenu from', pageHref);

    fetch(pageHref, { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' fetching ' + pageHref);
        return r.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const articles = Array.from(doc.querySelectorAll(articleSel));
        if (!articles.length) console.warn('[header] No articles found with selector:', articleSel);

        const items = articles.slice(0, 5).map((article, i) => {
          const id = article.getAttribute('id') || `story-${i+1}`;
          const titleEl = article.querySelector(titleSel) || article.querySelector('h1, h2');
          const rawTitle = titleEl ? titleEl.textContent : `Story ${i+1}`;
          const title = String(rawTitle).trim();
          return { href: `${pageHref}#${id}`, title };
        });

        list.innerHTML = items.length
          ? items.map(({ href, title }) => `<li><a href="${href}">${escapeHtml(title)}</a></li>`).join('')
          : `<li><a href="news.html">All stories →</a></li>`;
      })
      .catch(err => {
        console.error('[header] News submenu error:', err);
        list.innerHTML = `<li><a href="news.html">All stories →</a></li>`;
      });

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  }

  // Build Products submenu from products.html (single page with multiple items)
  function buildProductsSubmenuFromSinglePage() {
    const list = document.getElementById('products-submenu');
    if (!list) return;

    const rawHref    = list.getAttribute('data-products-single') || './products.html';
    const pageHref   = new URL(rawHref, location.href).toString();
    const titleSel   = list.getAttribute('data-products-title-selector') || '.product-title';
    const articleSel = list.getAttribute('data-products-article-selector') || '.product';

    console.info('[header] Building Products submenu from', pageHref);

    fetch(pageHref, { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' fetching ' + pageHref);
        return r.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const cards = Array.from(doc.querySelectorAll(articleSel));
        if (!cards.length) console.warn('[header] No products found with selector:', articleSel);

        const items = cards.slice(0, 5).map((card, i) => {
          const id = card.getAttribute('id') || `product-${i+1}`;
          const titleEl = card.querySelector(titleSel) || card.querySelector('h2, h3, .title');
          const rawTitle = titleEl ? titleEl.textContent : `Product ${i+1}`;
          const title = String(rawTitle).trim();
          return { href: `${pageHref}#${id}`, title };
        });

        list.innerHTML = items.length
          ? items.map(({ href, title }) => `<li><a href="${href}">${escapeHtml(title)}</a></li>`).join('')
          : `<li><a href="products.html">All products →</a></li>`;
      })
      .catch(err => {
        console.error('[header] Products submenu error:', err);
        list.innerHTML = `<li><a href="products.html">All products →</a></li>`;
      });

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  }
  // ---------- /Builders ----------

  function init(){
    bindDelegatedClicks();
    initNavbarScrollTheme();
    highlightActiveLink();
    buildNewsSubmenuFromSinglePage();
    buildProductsSubmenuFromSinglePage();
  }

  window.__initHeader = function(){ init(); };
  init();
})();
