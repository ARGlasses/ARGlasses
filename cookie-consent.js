/* Site-wide cookie preferences dialog.
   Stores the visitor's choice; this file does not load analytics or advertising tools. */
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
    if (consent === 'accepted' || consent === 'essential') return;

    const overlay = document.createElement('div');
    overlay.id = 'cookie-overlay';
    overlay.setAttribute('aria-hidden', 'false');
    overlay.innerHTML =
      '<section id="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description">' +
        '<div class="cookie-dialog-top">' +
          '<span class="cookie-language-label">Language</span>' +
          '<label class="cookie-language-select"><span class="sr-only">Language</span>' +
            '<select id="cookie-language" aria-label="Language"><option value="en" selected>English (US)</option></select>' +
          '</label>' +
        '</div>' +
        '<div class="cookie-dialog-content">' +
          '<h2 id="cookie-title">Cookies</h2>' +
          '<p id="cookie-description" class="cookie-list-heading">Cookies help us:</p>' +
          '<ul class="cookie-benefits">' +
            '<li>Power this website and monitor its performance.</li>' +
            '<li>Remember your preferences and improve your experience.</li>' +
            '<li>Understand how you use this website.</li>' +
            '<li>Deliver relevant ads and measure their effectiveness.</li>' +
          '</ul>' +
          '<p class="cookie-choice-hint">To continue, select one of the following options:</p>' +
          '<div id="cookie-settings" hidden>' +
            '<div class="cookie-category"><div><strong>Essential</strong><p>Required for core site functionality and saving your cookie choice.</p></div><span class="cookie-always-on">Always on</span></div>' +
            '<label class="cookie-category cookie-category-toggle"><span><strong>Analytics</strong><p>Help us understand site usage so we can improve it.</p></span><input id="cookie-analytics" type="checkbox"></label>' +
            '<label class="cookie-category cookie-category-toggle"><span><strong>Advertising</strong><p>Help measure advertising performance and relevance.</p></span><input id="cookie-advertising" type="checkbox"></label>' +
            '<button type="button" class="cookie-save-settings" id="save-cookie-settings">Save my choices</button>' +
          '</div>' +
          '<p class="cookie-policy-link">Interested in the details? Read our <a href="' + policyUrl + '">Cookie Policy</a>.</p>' +
          '<div class="cookie-actions">' +
            '<button type="button" class="cookie-button cookie-button-outline" id="cookie-menu">Cookie Menu</button>' +
            '<button type="button" class="cookie-button cookie-button-primary" id="accept-cookies">Accept all</button>' +
            '<button type="button" class="cookie-button cookie-button-primary" id="decline-cookies">Essential only</button>' +
          '</div>' +
        '</div>' +
      '</section>';
    document.body.appendChild(overlay);

    const settings = overlay.querySelector('#cookie-settings');
    const menuButton = overlay.querySelector('#cookie-menu');
    const acceptButton = overlay.querySelector('#accept-cookies');
    const essentialButton = overlay.querySelector('#decline-cookies');
    const saveButton = overlay.querySelector('#save-cookie-settings');
    const analytics = overlay.querySelector('#cookie-analytics');
    const advertising = overlay.querySelector('#cookie-advertising');

    function closeDialog(value, preferences) {
      const record = preferences || { analytics: value === 'accepted', advertising: value === 'accepted' };
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
        window.localStorage.setItem('cookiePreferences', JSON.stringify(record));
      } catch (error) {}
      overlay.remove();
      document.dispatchEvent(new CustomEvent('cookieconsentchange', {
        detail: { consent: value, preferences: record }
      }));
      window.dispatchEvent(new CustomEvent('cookieconsentchange', {
        detail: { consent: value, preferences: record }
      }));
    }

    menuButton.addEventListener('click', function () {
      const opening = settings.hidden;
      settings.hidden = !opening;
      menuButton.textContent = opening ? 'Hide settings' : 'Cookie settings';
      if (opening) settings.querySelector('input').focus();
    });
    acceptButton.addEventListener('click', function () {
      closeDialog('accepted', { analytics: true, advertising: true });
    });
    essentialButton.addEventListener('click', function () {
      closeDialog('essential', { analytics: false, advertising: false });
    });
    saveButton.addEventListener('click', function () {
      const preferences = { analytics: analytics.checked, advertising: advertising.checked };
      closeDialog(preferences.analytics || preferences.advertising ? 'accepted' : 'essential', preferences);
    });

    overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        // Do not treat dismissing the dialog as consent; visitors must make a choice.
        event.preventDefault();
      }
    });
    acceptButton.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent, { once: true });
  } else {
    initCookieConsent();
  }
})();
