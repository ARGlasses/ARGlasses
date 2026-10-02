/* Site-wide cookie preference banner.
   This script records the visitor's choice; it does not load tracking tools. */
(function () {
  'use strict';

  const STORAGE_KEY = 'cookieConsent';
  const scriptUrl = document.currentScript && document.currentScript.src;
  const policyUrl = scriptUrl
    ? new URL('cookie-policy.html', scriptUrl).href
    : 'cookie-policy.html';

  function initCookieConsent() {
    let banner = document.getElementById('cookie-banner');

    if (!banner) {
      banner = document.createElement('aside');
      banner.id = 'cookie-banner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Cookie preferences');
      banner.innerHTML =
        '<div class="container">' +
          '<p>We use browser storage to remember your choice. This banner records your preference; it does not itself load analytics or advertising tools. ' +
          '<a href="' + policyUrl + '">Read our Cookie Policy</a>.</p>' +
          '<div>' +
            '<button class="contrast" id="accept-cookies" type="button">Accept optional cookies</button>' +
            '<button class="secondary" id="decline-cookies" type="button">Reject optional cookies</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(banner);
    }

    const acceptButton = document.getElementById('accept-cookies');
    const declineButton = document.getElementById('decline-cookies');
    if (!acceptButton || !declineButton) return;

    let consent = null;
    try {
      consent = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      // If browser storage is unavailable, show the banner for this visit.
    }

    const hasChoice = consent === 'accepted' || consent === 'declined';
    banner.style.display = hasChoice ? 'none' : 'block';
    banner.setAttribute('aria-hidden', String(hasChoice));

    function saveChoice(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (error) {
        // The choice still applies for this page view if storage is blocked.
      }
      banner.style.display = 'none';
      banner.setAttribute('aria-hidden', 'true');
      window.dispatchEvent(new CustomEvent('cookieconsentchange', {
        detail: { consent: value }
      }));
    }

    acceptButton.addEventListener('click', function () {
      saveChoice('accepted');
    });
    declineButton.addEventListener('click', function () {
      saveChoice('declined');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent, { once: true });
  } else {
    initCookieConsent();
  }
})();
