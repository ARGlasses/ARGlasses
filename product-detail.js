/* Cinematic product detail view. Reads the existing card and ARG_PRODUCTS data. */
(() => {
  "use strict";

  const start = () => {
    const gallery = document.querySelector(".product-viewport");
    const rail = gallery && gallery.querySelector(".rail");
    if (!gallery || !rail) return;

    const products = Array.isArray(window.ARG_PRODUCTS) ? window.ARG_PRODUCTS : [];
    const productsById = new Map(products.map(product => [product.id, product]));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = () => window.matchMedia("(max-width: 700px)").matches;
    const motionTime = () => reducedMotion.matches ? 40 : 980;
    const known = value => {
      if (value == null) return false;
      const text = String(value).trim();
      return Boolean(text) && !/^(—|–|-|n\/a|na|unknown|not stated(?: in source checked)?|not disclosed(?: in source checked)?|not published(?: in the official specification reviewed)?|not confirmed)$/i.test(text);
    };
    const categoryLabels = {
      display: "Display glasses",
      ai: "AI smart glasses",
      spatial: "Spatial / true AR",
      enterprise: "Enterprise AR"
    };
    const sections = [
      { title: "Overview", fields: [["Price / availability", "priceText"]] },
      { title: "Display & optics", fields: [["Display technology", "display"], ["Resolution", "resolution"], ["Field of view", "fov"], ["Refresh rate", "refresh"], ["Brightness", "brightness"]] },
      { title: "Tracking & sensors", fields: [["Tracking", "tracking"]] },
      { title: "Cameras & audio", fields: [["Camera", "camera"], ["Audio", "audio"]] },
      { title: "Connectivity & compatibility", fields: [["Compatibility", "compatibility"]] },
      { title: "Battery & power", fields: [["Power / battery", "power"]] },
      { title: "Physical design & comfort", fields: [["Weight", "weight"], ["Prescription support", "prescription"]] }
    ];

    const layer = document.createElement("div");
    layer.className = "product-detail-layer";
    layer.id = "product-detail-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-hidden", "true");
    layer.setAttribute("aria-label", "Product details");
    layer.innerHTML = [
      '<div class="product-detail-backdrop"></div>',
      '<div class="product-detail-visual" aria-hidden="true"></div>',
      '<button class="product-detail-close" type="button" aria-label="Close product details">×</button>',
      '<div class="product-detail-content" tabindex="-1">',
      '  <p class="product-detail-eyebrow">AR GLASSES / PRODUCT DETAIL</p>',
      '  <h1 class="product-detail-heading"></h1>',
      '  <p class="product-detail-brand"></p>',
      '  <p class="product-detail-summary"></p>',
      '  <div class="product-detail-specs"></div>',
      '</div>'
    ].join("");
    document.body.appendChild(layer);

    const closeButton = layer.querySelector(".product-detail-close");
    const content = layer.querySelector(".product-detail-content");
    const heading = layer.querySelector(".product-detail-heading");
    const brand = layer.querySelector(".product-detail-brand");
    const summary = layer.querySelector(".product-detail-summary");
    const specs = layer.querySelector(".product-detail-specs");
    const visual = layer.querySelector(".product-detail-visual");
    let selectedCard = null;
    let selectedImage = null;
    let morphImage = null;
    let zoomLens = null;
    let closing = false;
    let closeTimer = 0;
    let originImageRect = null;
    let previousBodyOverflow = "";
    let suppressCardHoverUntilInput = false;

    function releaseSuppressedCardHover() {
      if (!suppressCardHoverUntilInput) return;
      suppressCardHoverUntilInput = false;
      gallery.classList.remove("suppress-card-hover");
    }
    document.addEventListener("pointermove", releaseSuppressedCardHover, { passive: true });
    document.addEventListener("keydown", releaseSuppressedCardHover, true);

    function addSpecSection(section, product) {
      const rows = section.fields.filter(([, key]) => known(product[key]));
      if (!rows.length) return;
      const sectionElement = document.createElement("section");
      sectionElement.className = "product-detail-spec-section";
      const title = document.createElement("h2");
      title.className = "product-detail-section-title";
      title.textContent = section.title;
      sectionElement.appendChild(title);
      rows.forEach(([label, key]) => {
        const row = document.createElement("div");
        row.className = "product-detail-spec-row";
        const name = document.createElement("span");
        name.className = "product-detail-spec-label";
        name.textContent = label;
        const value = document.createElement("span");
        value.className = "product-detail-spec-value";
        value.textContent = String(product[key]).trim();
        row.append(name, value);
        sectionElement.appendChild(row);
      });
      specs.appendChild(sectionElement);
    }

    function renderDetails(card) {
      // Each product opens from the top, even when the previous product's
      // specification panel was left part-way down.
      content.scrollTop = 0;
      content.scrollLeft = 0;
      const id = card.dataset.productId;
      const product = productsById.get(id) || {};
      const cardTitle = card.querySelector(".story-title");
      const cardKicker = card.querySelector(".story-kicker");
      const cardTeaser = card.querySelector(".story-teaser");
      const titleText = product.name || card.dataset.productName || (cardTitle && cardTitle.textContent.trim()) || "Product";
      const brandText = product.brand || card.dataset.brand || (cardKicker && cardKicker.childNodes[0] && cardKicker.childNodes[0].textContent.trim()) || "";
      // Put the manufacturer in the main heading unless the model name
      // already contains every meaningful part of the manufacturer name.
      const manufacturerTokens = String(brandText || "").toLocaleLowerCase().match(/[a-z0-9]+/g) || [];
      const modelTokens = String(titleText || "").toLocaleLowerCase().match(/[a-z0-9]+/g) || [];
      const modelTokenSet = new Set(modelTokens);
      const manufacturerAlreadyInName = manufacturerTokens.length > 0 &&
        manufacturerTokens.every(token => modelTokenSet.has(token));
      heading.textContent = brandText && !manufacturerAlreadyInName
        ? brandText + " " + titleText
        : titleText;
      const categoryText = categoryLabels[product.category || card.dataset.category] || "";
      brand.textContent = categoryText;
      const summaryText = product.summary || (cardTeaser && cardTeaser.textContent.trim()) || "";
      // Include the manufacturer in the expanded description itself, not only
      // in the separate brand line. Avoid repeating it when the summary already names it.
      const manufacturerInSummary = brandText && summaryText.toLocaleLowerCase().includes(brandText.toLocaleLowerCase());
      summary.textContent = brandText && !manufacturerInSummary
        ? "Manufacturer: " + brandText + ". " + summaryText
        : summaryText;
      specs.replaceChildren();
      sections.forEach(section => addSpecSection(section, product));
      const meta = document.createElement("p");
      meta.className = "product-detail-year";
      meta.textContent = known(product.year) ? "Introduced " + String(product.year) : "";
      if (meta.textContent) specs.prepend(meta);
      content.scrollTop = 0;
      content.scrollLeft = 0;
    }

    function imageRect(image) {
      const rect = image.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }

    function setImageRect(image, rect) {
      image.style.left = rect.left + "px";
      image.style.top = rect.top + "px";
      image.style.width = rect.width + "px";
      image.style.height = rect.height + "px";
    }

    function hideImageZoom() {
      if (zoomLens) zoomLens.classList.remove("is-visible");
    }

    function updateImageZoom(event) {
      // The magnifier is deliberately desktop-only; touch and coarse pointers
      // keep the existing image/detail interaction unchanged.
      if (!zoomLens || !morphImage ||
          !window.matchMedia("(min-width: 901px) and (hover: hover) and (pointer: fine)").matches ||
          event.pointerType === "touch") return;

      const rect = morphImage.getBoundingClientRect();
      const sourceWidth = morphImage.naturalWidth || (selectedImage && selectedImage.naturalWidth);
      const sourceHeight = morphImage.naturalHeight || (selectedImage && selectedImage.naturalHeight);
      if (!sourceWidth || !sourceHeight) return;

      // Match the image's actual object-fit: contain drawing area, not the
      // potentially taller rectangular element surrounding it.
      const fitScale = Math.min(rect.width / sourceWidth, rect.height / sourceHeight);
      const drawnWidth = sourceWidth * fitScale;
      const drawnHeight = sourceHeight * fitScale;
      const drawnLeft = rect.left + (rect.width - drawnWidth) / 2;
      const drawnTop = rect.top + (rect.height - drawnHeight) / 2;
      const pointerX = event.clientX;
      const pointerY = event.clientY;

      if (pointerX < drawnLeft || pointerX > drawnLeft + drawnWidth ||
          pointerY < drawnTop || pointerY > drawnTop + drawnHeight) {
        hideImageZoom();
        return;
      }

      const lensSize = 220;
      const zoom = 2;
      const panelWidth = window.innerWidth * .46;
      const maxLeft = Math.max(12, panelWidth - lensSize - 12);
      const maxTop = Math.max(84, window.innerHeight - lensSize - 12);
      const lensLeft = Math.min(maxLeft, Math.max(12, pointerX - lensSize / 2));
      const lensTop = Math.min(maxTop, Math.max(84, pointerY - lensSize / 2));

      zoomLens.style.left = lensLeft + "px";
      zoomLens.style.top = lensTop + "px";
      zoomLens.style.backgroundImage = 'url("' + (morphImage.currentSrc || morphImage.src) + '")';
      zoomLens.style.backgroundSize = (drawnWidth * zoom) + "px " + (drawnHeight * zoom) + "px";
      zoomLens.style.backgroundPosition =
        (lensSize / 2 - (pointerX - drawnLeft) * zoom) + "px " +
        (lensSize / 2 - (pointerY - drawnTop) * zoom) + "px";
      zoomLens.classList.add("is-visible");
    }

    function targetImageRect() {
      if (window.matchMedia("(max-width: 700px)").matches) {
        return {
          left: window.innerWidth * .08,
          top: window.innerHeight * .045,
          width: window.innerWidth * .84,
          height: window.innerHeight * .31
        };
      }
      const left = window.innerWidth >= 1100 ? window.innerWidth * .045 : window.innerWidth * .025;
      const top = window.innerHeight * .14;
      const width = window.innerWidth >= 1100 ? window.innerWidth * .38 : window.innerWidth * .34;
      return { left, top: window.innerHeight * .16, width, height: window.innerHeight * .66 };
    }

    function openDetails(card) {
      if (closing || layer.classList.contains("is-active")) return;
      const image = card.querySelector("img.bg");
      if (!image) return;
      selectedCard = card;
      selectedImage = image;
      renderDetails(card);

      morphImage = document.createElement("img");
      morphImage.className = "product-detail-morph-image";
      morphImage.alt = image.alt || heading.textContent + " product image";
      morphImage.src = image.currentSrc || image.src;
      const startRect = imageRect(image);
      originImageRect = startRect;
      setImageRect(morphImage, startRect);
      layer.appendChild(morphImage);

      if (zoomLens) zoomLens.remove();
      zoomLens = document.createElement("div");
      zoomLens.className = "product-detail-zoom-lens";
      zoomLens.setAttribute("aria-hidden", "true");
      layer.appendChild(zoomLens);
      morphImage.addEventListener("pointerenter", updateImageZoom);
      morphImage.addEventListener("pointermove", updateImageZoom);
      morphImage.addEventListener("pointerleave", hideImageZoom);

      gallery.classList.add("product-detail-open");
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      layer.setAttribute("aria-hidden", "false");
      layer.classList.add("is-active");
      content.scrollTop = 0;
      content.scrollLeft = 0;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Reassert the top position after the new product's layout has
          // been painted, avoiding restoration of the previous product's scroll.
          content.scrollTop = 0;
          content.scrollLeft = 0;
          if (morphImage) setImageRect(morphImage, targetImageRect());
          window.setTimeout(() => closeButton.focus({ preventScroll: true }), motionTime() * .55);
        });
      });
    }

    function finishClose() {
      layer.classList.remove("is-active", "is-closing");
      layer.setAttribute("aria-hidden", "true");
      if (morphImage) morphImage.remove();
      morphImage = null;
      if (zoomLens) zoomLens.remove();
      zoomLens = null;
      gallery.classList.add("suppress-card-hover");
      suppressCardHoverUntilInput = true;
      gallery.classList.remove("product-detail-open");
      document.body.style.overflow = previousBodyOverflow;
      closing = false;
      if (selectedImage && selectedImage.isConnected) selectedImage.focus({ preventScroll: true });
      selectedCard = null;
      selectedImage = null;
      originImageRect = null;
    }

    function closeDetails() {
      if (!layer.classList.contains("is-active") || closing) return;
      closing = true;
      hideImageZoom();
      if (closeTimer) window.clearTimeout(closeTimer);
      layer.classList.add("is-closing");

      // Restore the page's original viewport width first. The source card can
      // move slightly when the scrollbar returns, so measure its live rectangle
      // after layout settles rather than reusing the (possibly hovered/scaled)
      // rectangle captured when the image was first clicked.
      document.body.style.overflow = previousBodyOverflow;
      gallery.classList.remove("product-detail-open");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (morphImage && selectedImage && selectedImage.isConnected) {
            originImageRect = imageRect(selectedImage);
            setImageRect(morphImage, originImageRect);
          }
        });
      });

      // The catalogue fades back in beneath the returning image. The image's
      // final fade reveals the same-sized card artwork instead of a late jump.
      closeTimer = window.setTimeout(finishClose, reducedMotion.matches ? 60 : 980);
    }

    rail.addEventListener("click", event => {
      // Desktop-only expanded detail interaction; mobile retains its original gallery behavior.
      if (isMobile() || event.defaultPrevented) return;
      const interactive = event.target.closest("a, button, input, select, textarea, [role='button']");
      if (interactive && !interactive.matches(".story img.bg")) return;
      const card = event.target.closest(".story");
      if (!card || !rail.contains(card)) return;
      openDetails(card);
    });

    function syncImageAccessibility() {
      rail.querySelectorAll(".story img.bg").forEach(image => {
        const card = image.closest(".story");
        if (isMobile()) {
          image.removeAttribute("tabindex");
          image.removeAttribute("role");
          image.removeAttribute("aria-haspopup");
          image.removeAttribute("aria-label");
          return;
        }
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-haspopup", "dialog");
        const name = card && (card.dataset.productName || card.querySelector(".story-title")?.textContent.trim());
        image.setAttribute("aria-label", "View details for " + (name || "product"));
      });
    }
    syncImageAccessibility();

    // Delegate keyboard handling so rebuilt carousel cards remain interactive.
    rail.addEventListener("keydown", event => {
      const image = event.target.closest && event.target.closest(".story img.bg");
      if (isMobile() || !image || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      openDetails(image.closest(".story"));
    });

    closeButton.addEventListener("click", closeDetails);
    layer.addEventListener("click", event => {
      if (event.target === layer || event.target === visual || event.target === content || event.target.classList.contains("product-detail-backdrop")) closeDetails();
    });
    document.addEventListener("keydown", event => {
      if (!layer.classList.contains("is-active")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetails();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton.focus();
      }
    });

    window.addEventListener("resize", () => {
      hideImageZoom();
      syncImageAccessibility();
      if (morphImage && layer.classList.contains("is-active")) setImageRect(morphImage, targetImageRect());
    });
    window.addEventListener("pagehide", () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      document.body.style.overflow = "";
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
