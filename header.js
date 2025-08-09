<script>
(function () {
  // Prevent double-initialization
  if (window.__headerInit) return;
  window.__headerInit = true;

  function initNavbarScrollTheme() {
    const navbar = document.getElementById('navbar');
    const heroSection = document.querySelector('.hero'); // may not exist on every page
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

  function initMobileDrawer() {
    const toggle   = document.getElementById('menu-toggle');
    const menu     = document.getElementById('primary-nav');
    const backdrop = document.getElementById('backdrop');
    if (!toggle || !menu || !backdrop) return;

    const mq = window.matchMedia('(max-width: 768px)');

    function openDrawer() {
      menu.classList.add('open');
      backdrop.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      menu.classList.remove('open');
      backdrop.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      // collapse open submenus
      menu.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
      menu.querySelectorAll('.submenu-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      menu.querySelectorAll('.dropdown-menu').forEach(ul => ul.style.display = '');
    }

    // Drawer toggle
    toggle.addEventListener('click', () => {
      if (!mq.matches) return;
      menu.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    // Backdrop click closes
    backdrop.addEventListener('click', () => { if (mq.matches) closeDrawer(); });

    // Drawer "X" button
    const closeBtn = menu.querySelector('.drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', () => { if (mq.matches) closeDrawer(); });

    // Submenu toggle (works for any .dropdown items)
    menu.addEventListener('click', (e) => {
      const trigger = e.target.closest('.has-submenu, .submenu-toggle');
      if (!trigger) return;
      if (!mq.matches) return; // desktop uses hover
      e.preventDefault();
      e.stopPropagation();

      const li = trigger.closest('.dropdown');
      const submenu = li.querySelector('.dropdown-menu');
      const open = li.classList.contains('open');
      li.classList.toggle('open', !open);

      const chevron = li.querySelector('.submenu-toggle');
      if (chevron) chevron.setAttribute('aria-expanded', (!open).toString());

      // ensure visible on mobile
      submenu.style.display = !open ? 'block' : 'none';
    });

    // ESC + resize behavior
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mq.matches && menu.classList.contains('open')) closeDrawer();
    });
    window.addEventListener('resize', () => { if (!mq.matches) closeDrawer(); });
  }

  function highlightActiveLink() {
    // Adds .active to the current page link
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#primary-nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (href === here) a.classList.add('active');
    });
  }

  function init() {
    initNavbarScrollTheme();
    initMobileDrawer();
    highlightActiveLink();
  }

  // If header is present now, init; otherwise wait for injection signal
  if (document.getElementById('primary-nav')) init();
  window.addEventListener('header:ready', init);
})();
</script>
