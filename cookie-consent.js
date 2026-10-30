/* Site-wide privacy preferences dialog.
   The current site does not load analytics or advertising trackers.
   The visitor's choice is stored in localStorage, not in a cookie. */
(function () {
  'use strict';

  const STORAGE_KEY = 'cookieConsent';
  const scriptUrl = document.currentScript && document.currentScript.src;
  const policyUrl = scriptUrl
    ? new URL('cookie-policy.html', scriptUrl).href
    : 'cookie-policy.html';

  function initCookieConsent() {
    if (document.getElementById('cookie-banner')) return;

    let consent = null;
    try { consent = window.localStorage.getItem(STORAGE_KEY); } catch (error) {}
    if (consent === 'accepted' || consent === 'essential') {
      // Older versions could record optional categories as enabled. The current site
      // has no optional trackers, so keep the stored compatibility record accurate.
      try {
        window.localStorage.setItem('cookiePreferences', JSON.stringify({ analytics: false, advertising: false }));
      } catch (error) {}
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'cookie-overlay';
    overlay.setAttribute('aria-hidden', 'false');
    overlay.innerHTML =
      '<section id="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description">' +
        '<div class="cookie-dialog-top">' +
          '<span class="cookie-language-label">Language</span>' +
          '<label class="cookie-language-select"><span class="sr-only">Language</span>' +
            '<select id="cookie-language" aria-label="Language"><option value="en" selected>English (UK)</option></select>' +
          '</label>' +
        '</div>' +
        '<div class="cookie-dialog-content">' +
          '<h2 id="cookie-title">Cookies &amp; privacy</h2>' +
          '<p id="cookie-description" class="cookie-list-heading">We use browser storage and third-party services to:</p>' +
          '<ul class="cookie-benefits">' +
            '<li>Remember your privacy preference on this device.</li>' +
            '<li>Support the core features of this website.</li>' +
            '<li>Load external resources such as fonts and map data.</li>' +
            '<li>Receive messages submitted through our contact form.</li>' +
          '</ul>' +
          '<p class="cookie-choice-hint">We do not currently use analytics or advertising trackers on this website.</p>' +
          '<div id="cookie-settings" hidden>' +
            '<div class="cookie-category"><div><strong>Privacy preference</strong><p>Your choice is saved in this browser using local storage. It is not an analytics or advertising cookie.</p></div><span class="cookie-always-on">Essential</span></div>' +
            '<div class="cookie-category"><div><strong>Optional tracking</strong><p>No analytics or advertising tracking tools are currently loaded by the site.</p></div><span class="cookie-always-on">Not in use</span></div>' +
          '</div>' +
          '<p class="cookie-policy-link">Interested in the details? Read our <a href="' + policyUrl + '">Cookie Policy</a>.</p>' +
          '<div class="cookie-actions">' +
            '<button type="button" class="cookie-button cookie-button-outline" id="cookie-menu">Cookie details</button>' +
            '<button type="button" class="cookie-button cookie-button-primary" id="continue-cookies">Continue</button>' +
          '</div>' +
        '</div>' +
      '</section>';
    document.body.appendChild(overlay);

    const settings = overlay.querySelector('#cookie-settings');
    const menuButton = overlay.querySelector('#cookie-menu');
    const continueButton = overlay.querySelector('#continue-cookies');

    function closeDialog() {
      const preferences = { analytics: false, advertising: false };
      try {
        window.localStorage.setItem(STORAGE_KEY, 'essential');
        window.localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
      } catch (error) {}
      overlay.remove();
      document.dispatchEvent(new CustomEvent('cookieconsentchange', {
        detail: { consent: 'essential', preferences: preferences }
      }));
      window.dispatchEvent(new CustomEvent('cookieconsentchange', {
        detail: { consent: 'essential', preferences: preferences }
      }));
    }

    menuButton.addEventListener('click', function () {
      const opening = settings.hidden;
      settings.hidden = !opening;
      menuButton.textContent = opening ? 'Hide details' : 'Cookie details';
    });
    continueButton.addEventListener('click', closeDialog);

    overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        // Do not treat dismissing the dialog as a choice.
        event.preventDefault();
      }
    });
    continueButton.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent, { once: true });
  } else {
    initCookieConsent();
  }
})();