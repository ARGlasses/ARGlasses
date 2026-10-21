/* Comparison engine: URL-shareable state, explainable use-case matching, and accessible side-by-side differences. */
(() => {
  "use strict";
  const PRODUCTS = Array.isArray(window.ARG_PRODUCTS) ? window.ARG_PRODUCTS : [];
  const $ = id => document.getElementById(id);
  const selected = new Set();
  const fields = [
    ["Price / availability", "priceText"], ["Weight", "weight"], ["Display technology", "display"],
    ["Resolution", "resolution"], ["Field of view", "fov"], ["Refresh rate", "refresh"],
    ["Brightness", "brightness"], ["Tracking", "tracking"], ["Power / battery", "power"],
    ["Camera", "camera"], ["Audio", "audio"], ["Compatibility", "compatibility"],
    ["Prescription support", "prescription"], ["Overview", "summary"]
  ];
  const categoryNames = {display:"Display glasses", ai:"AI smart glasses", spatial:"Spatial / true AR", enterprise:"Enterprise AR"};
  const useCases = {
    everyday: {label:"Everyday wear", categories:["ai"], terms:["lightweight","camera-free","everyday","notifications","translation","open-ear"]},
    gaming: {label:"Gaming & entertainment", categories:["display"], terms:["micro-oled","120 hz","120hz","refresh","gaming","console","bose","harman","hdr"]},
    productivity: {label:"Work & virtual monitors", categories:["display","ai"], terms:["productivity","virtual-screen","virtual screen","teleprompter","notes","usb-c","ultrawide","notifications"]},
    filming: {label:"Photo & video capture", categories:["ai"], terms:["camera-equipped","camera-equipped;","12 mp","3k video","video at","capture specification"]},
    spatial: {label:"Spatial / room-anchored AR", categories:["spatial"], terms:["6dof","6-dof","slam","spatial mapping","hand tracking","spatial positioning"]},
    enterprise: {label:"Enterprise & field work", categories:["enterprise"], terms:["enterprise","industrial","workflow","rugged","sdk","field"]},
    prescription: {label:"Prescription-friendly", categories:[], terms:["prescription","diopter","optical insert","lens options"]}
  };
  let state = {q:"", category:"all", brand:"all", sort:"brand", use:"all", budget:"all", differences:false};

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const textOf = p => [p.name,p.brand,p.category,p.summary,...fields.map(([,key])=>p[key])].join(" ").toLowerCase();
  const known = value => {
    const v = String(value ?? "").trim();
    return v && !/^(—|–|-|n\/a|na|unknown|not stated(?: in source checked)?|not disclosed(?: in source checked)?|not published|not confirmed)$/i.test(v);
  };
  function numericWeight(value) {
    const match = String(value ?? "").match(/^\s*(\d+(?:\.\d+)?)\s*g\b/i);
    return match ? Number(match[1]) : Infinity;
  }
  function numericPrice(p) { return Number.isFinite(p.price) && p.price >= 0 ? p.price : null; }
  function useScore(p, use) {
    if (use === "all" || !useCases[use]) return 0;
    const rule = useCases[use], haystack = textOf(p);
    if (use === "filming" && /^(no|none|not stated|not disclosed)/i.test(String(p.camera || "").trim())) return 0;
    let score = rule.categories.includes(p.category) ? 3 : 0;
    for (const term of rule.terms) if (haystack.includes(term)) score += 1;
    return score;
  }
  function useLabel(p) {
    if (state.use === "all") return "";
    const score = useScore(p,state.use);
    return score >= 4 ? "Good match" : score >= 2 ? "Possible match" : "Check suitability";
  }
  function updateUrl() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const values = {q:state.q, category:state.category, brand:state.brand, sort:state.sort, use:state.use, budget:state.budget};
    for (const [key,value] of Object.entries(values)) {
      // Keep default state out of the URL so the homepage stays canonical and clean.
      const isDefault = !value || value === "all" || (key === "sort" && value === "brand");
      if (isDefault) params.delete(key);
      else params.set(key,value);
    }
    selected.size ? params.set("compare",[...selected].join(",")) : params.delete("compare");
    state.differences ? params.set("diff","1") : params.delete("diff");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    state.q = params.get("q") || "";

    const sort = params.get("sort") || "brand";
    state.sort = ["brand","price-low","price-high","weight","newest"].includes(sort) ? sort : "brand";

    const category = params.get("category") || "all";
    state.category = ["all","display","ai","spatial","enterprise"].includes(category) ? category : "all";

    const brand = params.get("brand") || "all";
    const validBrands = new Set(PRODUCTS.map(product => product.brand).filter(Boolean));
    state.brand = brand === "all" || validBrands.has(brand) ? brand : "all";

    const use = params.get("use") || "all";
    state.use = ["all", ...Object.keys(useCases)].includes(use) ? use : "all";

    const budget = params.get("budget") || "all";
    state.budget = ["all","250","350","500","750","1000","1500"].includes(budget) ? budget : "all";

    state.differences = params.get("diff") === "1";
    (params.get("compare") || "").split(",").filter(Boolean).slice(0,3).forEach(id => {
      if (PRODUCTS.some(p => p.id === id)) selected.add(id);
    });
  }
  function populateBrands() {
    const select = $("brand-filter");
    if (!select) return;
    const brands = [...new Set(PRODUCTS.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    select.innerHTML = '<option value="all">All manufacturers</option>' + brands.map(b=>'<option value="'+esc(b)+'">'+esc(b)+'</option>').join("");
  }
  function syncControls() {
    const validBrands = ["all", ...PRODUCTS.map(p=>p.brand)];
    if (!validBrands.includes(state.brand)) state.brand = "all";
    const map = {"category-filter":"category","brand-filter":"brand","sort-filter":"sort","use-case-filter":"use","budget-filter":"budget","differences-only":"differences"};
    for (const [id,key] of Object.entries(map)) {
      const el = $(id);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = Boolean(state[key]);
      else if ([...el.options].some(o=>o.value===state[key])) el.value = state[key];
    }
  }
  function filteredProducts() {
    let list = PRODUCTS.filter(p =>
      (state.category==="all" || p.category===state.category) &&
      (state.brand==="all" || p.brand===state.brand) &&
      (!state.q || textOf(p).includes(state.q.toLowerCase())) &&
      (state.budget==="all" || numericPrice(p)===null || numericPrice(p)<=Number(state.budget))
    );
    list.sort((a,b) => {
      if (state.use!=="all") {
        const relevance = useScore(b,state.use)-useScore(a,state.use);
        if (relevance) return relevance;
      }
      if (state.sort==="price-low" || state.sort==="price-high") {
        const ap=numericPrice(a), bp=numericPrice(b);
        if(ap===null&&bp!==null)return 1;if(bp===null&&ap!==null)return -1;
        if(ap!==null&&bp!==null&&ap!==bp)return state.sort==="price-high"?bp-ap:ap-bp;
      } else if(state.sort==="weight") {
        const aw=numericWeight(a.weight), bw=numericWeight(b.weight); if(aw!==bw)return aw<bw?-1:1;
      } else if(state.sort==="newest") {
        const result=(Number(b.year)||0)-(Number(a.year)||0);if(result)return result;
      }
      return String(a.brand||"").localeCompare(String(b.brand||""))||String(a.name||"").localeCompare(String(b.name||""));
    });
    return list;
  }
  function render() {
    const list=filteredProducts();
    if($("catalogue-count")) $("catalogue-count").textContent=PRODUCTS.length ? list.length+" of "+PRODUCTS.length+" products" : "Catalogue unavailable — refresh to retry";
    if($("selected-count")) $("selected-count").textContent=selected.size+" selected";
    if($("clear-picker-selection")) $("clear-picker-selection").disabled=selected.size===0;
    if($("selection-hint")) $("selection-hint").textContent=selected.size===0 ? "Select 2 or 3 glasses from the list to compare them side by side." : selected.size===1 ? "Choose one more product to start your comparison." : selected.size===2 ? "One more product can be added, or compare these two now." : "You’ve reached the 3-product limit. Clear a selection to swap models.";
    renderProductPicker();
    if($("compare-selected")) $("compare-selected").disabled=selected.size<2;
    if($("no-results")) $("no-results").hidden=list.length>0;
    const options=$("product-picker-options");
    if(options && !PRODUCTS.length) options.innerHTML='<p class="catalogue-error" role="alert">The product data could not be loaded. Please refresh the page; if this continues, contact us so we can fix the catalogue.</p>';
    renderComparison();
    updateUrl();
  }
  function briefDescription(value) {
    const description = String(value || "Description not yet published.").replace(/\s+/g, " ").trim();
    if (description.length <= 105) return description;
    const firstSentence = description.match(/^.{35,105}?[.!?](?=\s|$)/);
    if (firstSentence) return firstSentence[0];
    return description.slice(0, 102).replace(/\s+\S*$/, "") + "…";
  }

  let hoverCard;
  let hoverTarget = null;
  function ensureHoverCard() {
    if (hoverCard) return hoverCard;
    hoverCard = document.createElement("aside");
    hoverCard.id = "product-hover-card";
    hoverCard.className = "product-hover-card";
    hoverCard.setAttribute("role", "tooltip");
    hoverCard.hidden = true;
    document.body.appendChild(hoverCard);
    return hoverCard;
  }
  function hoverFact(label, value) {
    if (!known(value)) return "";
    return '<div class="product-hover-fact"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }
  function showProductDetails(nameEl) {
    const row = nameEl.closest(".product-picker-option");
    const input = row && row.querySelector("[data-picker-select]");
    const product = input && PRODUCTS.find(p => p.id === input.dataset.pickerSelect);
    if (!product) return;
    const card = ensureHoverCard();
    hoverTarget = nameEl;
    const category = categoryNames[product.category] || "AR / smart glasses";
    card.innerHTML =
      '<div class="product-hover-topline">' + esc(product.brand) + ' · ' + esc(category) + '</div>' +
      '<strong class="product-hover-title">' + esc(product.brand + " " + product.name) + '</strong>' +
      '<p class="product-hover-summary">' + esc(product.summary || "A detailed product overview has not yet been published.") + '</p>' +
      '<div class="product-hover-facts">' +
        hoverFact("Price", product.priceText) +
        hoverFact("Weight", product.weight) +
        hoverFact("Display", product.display) +
        hoverFact("Resolution", product.resolution) +
        hoverFact("Tracking", product.tracking) +
        hoverFact("Compatibility", product.compatibility) +
      '</div>';
    card.hidden = false;
    const rect = nameEl.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(360, window.innerWidth - margin * 2);
    card.style.width = width + "px";
    let left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
    let top = rect.bottom + 8;
    card.style.left = left + "px";
    card.style.top = top + "px";
    const cardRect = card.getBoundingClientRect();
    if (cardRect.bottom > window.innerHeight - margin) {
      top = rect.top - cardRect.height - 8;
      if (top < margin) top = Math.max(margin, window.innerHeight - cardRect.height - margin);
      card.style.top = top + "px";
    }
  }
  function hideProductDetails(nameEl) {
    if (nameEl && hoverTarget !== nameEl) return;
    if (hoverCard) hoverCard.hidden = true;
    hoverTarget = null;
  }

  function renderProductPicker() {
    const options=$("product-picker-options");
    if(!options) return;
    const summary=$("picker-selection-summary");
    if(summary) summary.textContent=selected.size ? selected.size+" of 3 selected" : "Choose up to 3 glasses";
    const list=filteredProducts();
    options.innerHTML=list.map(p=>{
      const checked=selected.has(p.id);
      const disabled=!checked&&selected.size>=3;
      const brief = briefDescription(p.summary);
      const match=state.use!=="all" ? '<span class="picker-option-match">'+esc(useLabel(p))+'</span>' : "";
      return '<label class="product-picker-option'+(checked?' is-selected':'')+(disabled?' is-disabled':'')+'">'+
        '<span class="picker-option-copy"><span class="picker-option-name" tabindex="0" aria-describedby="product-hover-card">'+esc(p.brand)+' '+esc(p.name)+'</span>'+
        '<span class="picker-option-description">'+esc(brief)+'</span>'+match+'</span>'+
        '<input type="checkbox" data-picker-select="'+esc(p.id)+'" '+(checked?'checked ':'')+(disabled?'disabled ':'')+' aria-label="Select '+esc(p.brand+" "+p.name)+' for comparison"></label>';
    }).join("");
  }
  function renderComparison() {
    const products=[...selected].map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean);
    const section=$("comparison");
    if(!section)return;
    if(products.length<2){section.hidden=true;return;}
    section.hidden=false;
    const rows=fields.map(([label,key])=>({label,values:products.map(p=>known(p[key])?String(p[key]).trim():"Not disclosed")}));
    const visible=state.differences ? rows.filter(row=>new Set(row.values.map(v=>v.toLowerCase())).size>1) : rows;
    const differenceNote=state.differences ? '<p class="difference-summary">'+visible.length+' differing specification'+(visible.length===1?"":"s")+' shown. Identical and unavailable values are hidden only when they are identical across all selected products.</p>' : "";
    const header='<thead><tr><th scope="col">Specification</th>'+products.map(p=>'<th scope="col"><span class="compare-product-brand">'+esc(p.brand)+'</span><strong>'+esc(p.name)+'</strong><a href="'+esc(p.source)+'" target="_blank" rel="noopener noreferrer">Manufacturer source ↗</a></th>').join("")+'</tr></thead>';
    const body=visible.map(row=>'<tr><th scope="row">'+esc(row.label)+'</th>'+row.values.map(v=>'<td>'+esc(v)+'</td>').join("")+'</tr>').join("");
    $("comparison-table-wrap").innerHTML=differenceNote+'<table class="comparison-table">'+header+'<tbody>'+(body||'<tr><td colspan="'+(products.length+1)+'" class="empty-differences">No differences found for the available fields. Turn off “Differences only” to see all specifications.</td></tr>')+'</tbody></table>';
  }
  function setValue(id,key) { const el=$(id); if(el) state[key]=el.value; }
  document.addEventListener("pointerover", e => {
    const name = e.target.closest && e.target.closest(".picker-option-name");
    if (name && !name.contains(e.relatedTarget)) showProductDetails(name);
  });
  document.addEventListener("pointerout", e => {
    const name = e.target.closest && e.target.closest(".picker-option-name");
    if (name && !name.contains(e.relatedTarget)) hideProductDetails(name);
  });
  document.addEventListener("focusin", e => {
    const name = e.target.closest && e.target.closest(".picker-option-name");
    if (name) showProductDetails(name);
  });
  document.addEventListener("focusout", e => {
    const name = e.target.closest && e.target.closest(".picker-option-name");
    if (name) hideProductDetails(name);
  });
  window.addEventListener("scroll", () => hideProductDetails(), {passive:true});
  window.addEventListener("resize", () => hideProductDetails());
  document.addEventListener("change",e=>{
    const target=e.target;
    if(target.matches("[data-picker-select]")) {
      const id = target.dataset.pickerSelect;
      if (target.checked) {
        if (selected.size < 3) selected.add(id);
        else target.checked = false;
      } else {
        selected.delete(id);
      }
      render();
      return;
    }
    const controls={"category-filter":"category","brand-filter":"brand","sort-filter":"sort","use-case-filter":"use","budget-filter":"budget"};
    if(controls[target.id]){setValue(target.id,controls[target.id]);render();}
    if(target.id==="differences-only"){state.differences=target.checked;render();}
  });

  if($("compare-selected")) $("compare-selected").addEventListener("click",()=>{$("comparison").hidden=false;$("comparison").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});});
  if($("clear-comparison")) $("clear-comparison").addEventListener("click",()=>{selected.clear();render();});
  if($("clear-picker-selection")) $("clear-picker-selection").addEventListener("click",()=>{selected.clear();render();});
  if($("copy-comparison-link")) $("copy-comparison-link").addEventListener("click",async()=>{
    updateUrl();
    const url=window.location.href,button=$("copy-comparison-link");
    try { await navigator.clipboard.writeText(url); button.textContent="Link copied"; }
    catch { window.prompt("Copy your comparison link:",url); }
    window.setTimeout(()=>{button.textContent="Copy comparison link";},1800);
  });
  if($("print-comparison")) $("print-comparison").addEventListener("click",()=>window.print());
  readUrl();populateBrands();syncControls();render();
})();