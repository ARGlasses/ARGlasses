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
    let closing = false;
    let closeTimer = 0;
    let originImageRect = null;
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
      const id = card.dataset.productId;
      const product = productsById.get(id) || {};
      const cardTitle = card.querySelector(".story-title");
      const cardKicker = card.querySelector(".story-kicker");
      const cardTeaser = card.querySelector(".story-teaser");
      const titleText = product.name || card.dataset.productName || (cardTitle && cardTitle.textContent.trim()) || "Product";
      const brandText = product.brand || card.dataset.brand || (cardKicker && cardKicker.childNodes[0] && cardKicker.childNodes[0].textContent.trim()) || "";
      const categoryText = categoryLabels[product.category || card.dataset.category] || "";
      heading.textContent = titleText;
      brand.textContent = [brandText, categoryText].filter(Boolean).join("  /  ");
      summary.textContent = product.summary || (cardTeaser && cardTeaser.textContent.trim()) || "";
      specs.replaceChildren();
      sections.forEach(section => addSpecSection(section, product));
      const meta = document.createElement("p");
      meta.className = "product-detail-year";
      meta.textContent = known(product.year) ? "Introduced " + String(product.year) : "";
      if (meta.textContent) specs.prepend(meta);
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

      gallery.classList.add("product-detail-open");
      document.body.style.overflow = "hidden";
      layer.setAttribute("aria-hidden", "false");
      layer.classList.add("is-active");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
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
      gallery.classList.add("suppress-card-hover");
      suppressCardHoverUntilInput = true;
      gallery.classList.remove("product-detail-open");
      document.body.style.overflow = "";
      closing = false;
      if (selectedImage && selectedImage.isConnected) selectedImage.focus({ preventScroll: true });
      selectedCard = null;
      selectedImage = null;
      originImageRect = null;
    }

    function closeDetails() {
      if (!layer.classList.contains("is-active") || closing) return;
      closing = true;
      if (closeTimer) window.clearTimeout(closeTimer);
      layer.classList.add("is-closing");
      // Return the exact same image element to the exact screen rectangle it
      // occupied before opening. The card stays hidden until the morph ends.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (morphImage && originImageRect) setImageRect(morphImage, originImageRect);
        });
      });
      closeTimer = window.setTimeout(finishClose, reducedMotion.matches ? 60 : 980);
    }

    rail.addEventListener("click", event => {
      if (event.defaultPrevented) return;
      const interactive = event.target.closest("a, button, input, select, textarea, [role='button']");
      if (interactive && !interactive.matches(".story img.bg")) return;
      const card = event.target.closest(".story");
      if (!card || !rail.contains(card)) return;
      openDetails(card);
    });

    function syncImageAccessibility() {
      rail.querySelectorAll(".story img.bg").forEach(image => {
        const card = image.closest(".story");
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
      if (!image || (event.key !== "Enter" && event.key !== " ")) return;
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
