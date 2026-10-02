// Site-wide search functionality for the shared header search icon.
(function () {
  if (window.__siteSearchLoaded) return;
  window.__siteSearchLoaded = true;

  const CACHE_KEY = 'arglasses-site-search-v1';
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  let indexPromise = null;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function loadCachedIndex() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.time && Date.now() - cached.time < CACHE_TTL && Array.isArray(cached.items)) return cached.items;
    } catch (_) {}
    return null;
  }

  async function buildIndex() {
    const cached = loadCachedIndex();
    if (cached) return cached;
    if (indexPromise) return indexPromise;

    indexPromise = (async () => {
      const sitemapResponse = await fetch('/sitemap.xml', { credentials: 'same-origin' });
      if (!sitemapResponse.ok) throw new Error('Could not load site map');
      const sitemapText = await sitemapResponse.text();
      const xml = new DOMParser().parseFromString(sitemapText, 'application/xml');
      const urls = Array.from(xml.querySelectorAll('loc')).map(n => n.textContent.trim()).filter(Boolean);
      const pageUrls = [...new Set(urls.filter(u => /arglasses\.com/i.test(u) && !/\.(xml|json)$/i.test(u)))];
      const items = [];
      let cursor = 0;

      async function worker() {
        while (cursor < pageUrls.length) {
          const url = pageUrls[cursor++];
          try {
            const response = await fetch(url, { credentials: 'same-origin' });
            if (!response.ok) continue;
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            doc.querySelectorAll('script,style,noscript,svg').forEach(el => el.remove());
            const title = (doc.querySelector('title')?.textContent || doc.querySelector('h1')?.textContent || url).trim();
            const description = (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim();
            const text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
            items.push({ url, title, description, text: text.slice(0, 20000) });
          } catch (_) {}
        }
      }

      await Promise.all(Array.from({ length: Math.min(6, pageUrls.length) }, worker));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), items })); } catch (_) {}
      return items;
    })();

    try { return await indexPromise; } finally { indexPromise = null; }
  }

  function makeOverlay() {
    if (document.getElementById('site-search-overlay')) return document.getElementById('site-search-overlay');
    const overlay = document.createElement('div');
    overlay.id = 'site-search-overlay';
    overlay.innerHTML = `
      <div class="site-search-panel" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
        <button type="button" class="site-search-close" aria-label="Close search">&times;</button>
        <h2 id="site-search-title">Search AR glasses</h2>
        <form class="site-search-form">
          <input class="site-search-input" type="search" placeholder="Search products, news, guides and more…" autocomplete="off" aria-label="Search the site">
          <button type="submit">Search</button>
        </form>
        <div class="site-search-status" aria-live="polite">Type a search and press Search.</div>
        <div class="site-search-results"></div>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `
      #primary-nav a.icon-link[aria-label="Search"] .icon{color:#333!important;stroke:#333!important}
      #primary-nav a.icon-link[aria-label="Search"]{color:#333!important;stroke:#333!important;cursor:pointer!important;pointer-events:auto!important}
      #site-search-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);display:none;align-items:flex-start;justify-content:center;padding:7vh 16px 24px;box-sizing:border-box}
      #site-search-overlay.open{display:flex}
      .site-search-panel{position:relative;width:min(760px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:14px;padding:24px;box-sizing:border-box;box-shadow:0 18px 60px rgba(0,0,0,.25);color:#222}
      .site-search-panel h2{margin:0 44px 16px 0;font-size:1.35rem}
      .site-search-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:30px;line-height:1;cursor:pointer;color:#333}
      .site-search-form{display:flex;gap:8px;margin-bottom:14px}
      .site-search-input{flex:1;min-width:0;padding:12px 14px;border:1px solid #ccc;border-radius:8px;font:inherit;color:#222;background:#fff}
      .site-search-form button{border:0;border-radius:8px;padding:0 18px;background:#222;color:#fff;font:inherit;cursor:pointer}
      .site-search-status{font-size:.9rem;color:#666;margin:8px 0 14px}
      .site-search-result{padding:12px 0;border-top:1px solid #eee}
      .site-search-result a{font-weight:600;color:#1769aa;text-decoration:none}
      .site-search-result p{margin:5px 0 0;color:#555;font-size:.9rem;line-height:1.45}
      @media(max-width:520px){#site-search-overlay{padding:16px}.site-search-panel{padding:20px}.site-search-form{flex-direction:column}.site-search-form button{padding:11px}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    return overlay;
  }

  function runSearch(query, items, results, status) {
    const q = query.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; status.textContent = 'Type a search and press Search.'; return; }
    const terms = q.split(/\s+/).filter(Boolean);
    const matches = items.map(item => {
      const haystack = `${item.title} ${item.description} ${item.text} ${item.url}`.toLowerCase();
      const score = terms.reduce((n, term) => n + (item.title.toLowerCase().includes(term) ? 8 : 0) + (item.description.toLowerCase().includes(term) ? 4 : 0) + (item.text.toLowerCase().includes(term) ? 1 : 0) + (item.url.toLowerCase().includes(term) ? 2 : 0), 0);
      return { item, score, haystack };
    }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, 20);

    status.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'} found.` : 'No results found.';
    results.innerHTML = matches.map(({item}) => {
      const snippetSource = item.description || item.text;
      const snippet = snippetSource.length > 220 ? snippetSource.slice(0, 220) + '…' : snippetSource;
      return `<div class="site-search-result"><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>${snippet ? `<p>${escapeHtml(snippet)}</p>` : ''}</div>`;
    }).join('');
  }

  function ensureSearchStyles() {
    if (document.getElementById('site-search-styles')) return;
    const style = document.createElement('style');
    style.id = 'site-search-styles';
    style.textContent = `
      #primary-nav a.icon-link[aria-label="Search"]{color:#222!important;cursor:pointer!important;pointer-events:auto!important}
      #primary-nav a.icon-link[aria-label="Search"] .icon{color:#222!important;stroke:#222!important;opacity:1!important;visibility:visible!important}
      #site-search-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);display:none;align-items:flex-start;justify-content:center;padding:7vh 16px 24px;box-sizing:border-box}
      #site-search-overlay.open{display:flex}
      .site-search-panel{position:relative;width:min(760px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:14px;padding:24px;box-sizing:border-box;box-shadow:0 18px 60px rgba(0,0,0,.25);color:#222}
      .site-search-panel h2{margin:0 44px 16px 0;font-size:1.35rem}
      .site-search-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:30px;line-height:1;cursor:pointer;color:#333}
      .site-search-form{display:flex;gap:8px;margin-bottom:14px}
      .site-search-input{flex:1;min-width:0;padding:12px 14px;border:1px solid #ccc;border-radius:8px;font:inherit;color:#222;background:#fff}
      .site-search-form button{border:0;border-radius:8px;padding:0 18px;background:#222;color:#fff;font:inherit;cursor:pointer}
      .site-search-status{font-size:.9rem;color:#666;margin:8px 0 14px}
      .site-search-result{padding:12px 0;border-top:1px solid #eee}
      .site-search-result a{font-weight:600;color:#1769aa;text-decoration:none}
      .site-search-result p{margin:5px 0 0;color:#555;font-size:.9rem;line-height:1.45}
      @media(max-width:520px){#site-search-overlay{padding:16px}.site-search-panel{padding:20px}.site-search-form{flex-direction:column}.site-search-form button{padding:11px}}
    `;
    document.head.appendChild(style);
  }

  function getSearchOverlay() {
    ensureSearchStyles();
    return makeOverlay();
  }

  function bindSearchLink(link) {
    if (!link || link.dataset.searchBound === '1') return;
    link.dataset.searchBound = '1';
    link.setAttribute('href', '#');
    link.style.setProperty('color', '#222', 'important');
    link.style.setProperty('cursor', 'pointer', 'important');
    link.style.setProperty('pointer-events', 'auto', 'important');
    const icon = link.querySelector('.icon');
    if (icon) {
      icon.style.setProperty('color', '#222', 'important');
      icon.style.setProperty('stroke', '#222', 'important');
      icon.style.setProperty('opacity', '1', 'important');
      icon.style.setProperty('visibility', 'visible', 'important');
    }

    const open = async (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const overlay = getSearchOverlay();
      const input = overlay.querySelector('.site-search-input');
      const status = overlay.querySelector('.site-search-status');
      overlay.classList.add('open');
      input.focus();
      status.textContent = 'Loading site search…';
      try {
        await buildIndex();
        status.textContent = 'Type a search and press Search.';
      } catch (_) {
        status.textContent = 'Search is temporarily unavailable. Please try again.';
      }
    };

    link.addEventListener('click', open);
    link.addEventListener('touchend', open, { passive:false });
  }

  function init() {
    ensureSearchStyles();
    document.querySelectorAll('#primary-nav a.icon-link[aria-label="Search"]').forEach(bindSearchLink);
  }

  window.__initSiteSearch = init;
  window.addEventListener('header:ready', init);

  // Delegated fallback: works even if the shared header is injected after this script.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#primary-nav a.icon-link[aria-label="Search"]');
