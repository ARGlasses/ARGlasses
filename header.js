// header.js (v4)
(function () {
  if (window.__headerInit) return;
  window.__headerInit = true;

  // Helpers
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
    // collapse submenus
    menu.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    menu.querySelectorAll('.submenu-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
    menu.querySelectorAll('.dropdown-menu').forEach(ul => ul.style.display = '');
  }

  // Delegated clicks: hamburger, backdrop, close, submenu
  function bindDelegatedClicks(){
    document.addEventListener('click', function(e){
      const menu     = document.getElementById('primary-nav');
      const toggle   = document.getElementById('menu-toggle');
      const backdrop = document.getElementById('backdrop');
      if (!menu || !backdrop) return;

      // Hamburger (works regardless of width; CSS hides it on desktop)
      if (e.target.closest('#menu-toggle')){
        e.preventDefault();
        menu.classList.contains('open') ? closeDrawer(menu, backdrop, toggle) : openDrawer(menu, backdrop, toggle);
        return;
      }

      // Backdrop
      if (e.target === backdrop){
        closeDrawer(menu, backdrop, toggle);
        return;
      }

      // Drawer close “×”
      if (e.target.closest('.drawer-close')){
        e.preventDefault();
        closeDrawer(menu, backdrop, toggle);
        return;
      }

      // Submenu (Explore) — only behave like accordion on mobile widths
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

    // ESC to close drawer
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const menu     = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle   = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (menu.classList.contains('open')) closeDrawer(menu, backdrop, toggle);
    });

    // Close drawer when leaving mobile width
    window.addEventListener('resize', () => {
      const menu     = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle   = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (!window.matchMedia('(max-width: 768px)').matches) closeDrawer(menu, backdrop, toggle);
    });
  }

  // Optional: dark/light flip over hero
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

  function init(){
    bindDelegatedClicks();
    initNavbarScrollTheme();
    highlightActiveLink();
  }

  // Public init for after-injection calls
  window.__initHeader = function(){ init(); };

  // Try to init immediately (safe if header is already present)
  init();
})();
