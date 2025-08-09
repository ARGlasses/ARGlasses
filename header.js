// header.js (v6.1 - debug friendly)
(function () {
  if (window.__headerInit) return;
  window.__headerInit = true;

  function openDrawer(menu, backdrop, toggle){
    menu.classList.add('open');
    backdrop.classList.add('show');
    if (toggle) toggle.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(menu, backdrop, toggle){
    menu.classList.remove('open');
    backdrop.classList.remove('show');
    if (toggle) toggle.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    menu.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    menu.querySelectorAll('.submenu-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
    menu.querySelectorAll('.dropdown-menu').forEach(ul => ul.style.display = '');
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
          const submenu = li.querySelector('.dropdown-menu');
          const isOpen = li.classList.contains('open');
          li.classList.toggle('open', !isOpen);
          const chev = li.querySelector('.submenu-toggle');
          if (chev) chev.setAttribute('aria-expanded', (!isOpen).toString());
          if (submenu) submenu.style.display = !isOpen ? 'block' : 'none';
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
    });
  }

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

  // Build News submenu from news.html (single page with multiple stories)
  function buildNewsSubmenuFromSinglePage() {
    const list = document.getElementById('news-submenu');
    if (!list) return;

    // Use a robust, absolute URL based on the current page
    const rawHref   = list.getAttribute('data-news-single') || './news.html';
    const pageHref  = new URL(rawHref, location.href).toString();
    const titleSel  = list.getAttribute('data-news-title-selector') || '.story-title';
    const articleSel= list.getAttribute('data-news-article-selector') || '.story';

    // Disable cache while debugging
    // localStorage.removeItem('newsSubmenu:single:v1');

    console.info('[header] Building News submenu from', pageHref);

    fetch(pageHref, { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' fetching ' + pageHref);
        return r.text();
      })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const articles = Array.from(doc.querySelectorAll(articleSel));
        if (!articles.length) {
          console.warn('[header] No articles found with selector:', articleSel);
        }
        const items = articles.slice(0, 5).map((article, i) => {
          let id = article.getAttribute('id') || `story-${i+1}`;
          const titleEl = article.querySelector(titleSel) || article.querySelector('h1');
          const rawTitle = titleEl ? titleEl.textContent : `Story ${i+1}`;
          const title = String(rawTitle).trim();
          return { href: `${pageHref}#${id}`, title };
        });

        if (!items.length) {
          // Fallback: at least show the News page
          list.innerHTML = `<li><a href="news.html">All stories →</a></li>`;
          console.warn('[header] No items built; using fallback link.');
          return;
        }

        list.innerHTML = items.map(({ href, title }) =>
          `<li><a href="${href}">${escapeHtml(title)}</a></li>`
        ).join('');
        console.info('[header] News submenu items:', items);
      })
      .catch(err => {
        console.error('[header] News submenu error:', err);
        // Fallback
        list.innerHTML = `<li><a href="news.html">All stories →</a></li>`;
      });

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  }

  function init(){
    bindDelegatedClicks();
    initNavbarScrollTheme();
    highlightActiveLink();
    buildNewsSubmenuFromSinglePage();
  }

  window.__initHeader = function(){ init(); };
  init();
})();
