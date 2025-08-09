(function () {
  if (window.__headerInit) return;
  window.__headerInit = true;

  // Helper: open/close drawer
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

  // Robust click handling via delegation
  function bindDelegatedClicks(){
    document.addEventListener('click', function(e){
      const mq = window.matchMedia('(max-width: 768px)');
      const menu     = document.getElementById('primary-nav');
      const toggle   = document.getElementById('menu-toggle');
      const backdrop = document.getElementById('backdrop');
      if (!menu || !backdrop) return;

      // Hamburger toggle
      const hitToggle = e.target.closest('#menu-toggle');
      if (hitToggle){
        if (!mq.matches) return;
        e.preventDefault();
        menu.classList.contains('open') ? closeDrawer(menu, backdrop, toggle) : openDrawer(menu, backdrop, toggle);
        return;
      }

      // Backdrop click
      if (e.target === backdrop){
        if (!mq.matches) return;
        closeDrawer(menu, backdrop, toggle);
        return;
      }

      // Drawer close “X”
      const hitClose = e.target.closest('.drawer-close');
      if (hitClose){
        if (!mq.matches) return;
        e.preventDefault();
        closeDrawer(menu, backdrop, toggle);
        return;
      }

      // Submenu toggle (Explore)
      const trigger = e.target.closest('.has-submenu, .submenu-toggle');
      if (trigger){
        if (!mq.matches) return; // desktop uses hover
        e.preventDefault();
        const li = trigger.closest('.dropdown');
        if (!li) return;
        const submenu = li.querySelector('.dropdown-menu');
        const isOpen = li.classList.contains('open');
        li.classList.toggle('open', !isOpen);
        const chev = li.querySelector('.submenu-toggle');
        if (chev) chev.setAttribute('aria-expanded', (!isOpen).toString());
        if (submenu) submenu.style.display = !isOpen ? 'block' : 'none';
      }
    });

    // ESC key
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const mq = window.matchMedia('(max-width: 768px)');
      const menu     = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle   = document.getElementById('menu-toggle');
      if (!mq.matches || !menu || !backdrop) return;
      if (menu.classList.contains('open')) closeDrawer(menu, backdrop, toggle);
    });

    // Resize closes drawer
    window.addEventListener('resize', () => {
      const mq = window.matchMedia('(max-width: 768px)');
      const menu     = document.getElementById('primary-nav');
      const backdrop = document.getElementById('backdrop');
      const toggle   = document.getElementById('menu-toggle');
      if (!menu || !backdrop) return;
      if (!mq.matches) closeDrawer(menu, backdrop, toggle);
    });
  }

  // Optional: light/dark swap when a .hero exists on the page
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

  // Try to init right now (safe if header already present)
  init();
})();
