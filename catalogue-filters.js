/* Desktop-only filters for the primary product gallery. */
(() => {
  "use strict";
  const products = Array.isArray(window.ARG_PRODUCTS) ? window.ARG_PRODUCTS : [];
  const gallery = document.getElementById("products");
  if (!gallery || !products.length || typeof window.__setGalleryComparisonFilter !== "function") return;

  const facets = [
    ["manufacturer","Manufacturer",p=>p.brand],
    ["type","Glasses type",p=>({display:"Display glasses",ai:"AI smart glasses",spatial:"Spatial / true AR",enterprise:"Enterprise AR"}[p.category]||"Other")],
    ["display","Display technology",p=>/micro-?oled/i.test(p.display||"")?"Micro-OLED":/microled/i.test(p.display||"")?"MicroLED":/waveguide/i.test(p.display||"")?"Waveguide":/lcos|liquid-crystal/i.test(p.display||"")?"LCoS":/no display/i.test(p.display||"")?"No display":p.display?"Other / specified":"Not stated"],
    ["os","Operating system",p=>/standalone|android-based|aios|snap os/i.test([p.summary,p.compatibility,p.power].join(" "))?"Standalone OS":/ios|android/i.test(p.compatibility||"")?"Phone companion (iOS / Android)":"Not specified"],
    ["connectivity","Connectivity",p=>/usb-c|dp alt/i.test([p.power,p.compatibility].join(" "))?"USB-C":/wi-?fi|bluetooth/i.test([p.power,p.compatibility].join(" "))?"Wireless (Bluetooth / Wi-Fi)":"Other / not stated"],
    ["compatibility","Compatibility",p=>/iphone|ios/i.test(p.compatibility||"")&&/android/i.test(p.compatibility||"")?"iPhone & Android":/iphone|ios/i.test(p.compatibility||"")?"iPhone / iOS":/android/i.test(p.compatibility||"")?"Android":/pc|windows|laptop/i.test(p.compatibility||"")?"PC / laptop":"Check manufacturer"],
  ];

  const layout=document.createElement("div");
  layout.className="desktop-gallery-layout";
  const sidebar=document.createElement("aside");
  sidebar.className="desktop-catalogue-filters";
  sidebar.setAttribute("aria-label","Filter products");
  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.className="desktop-filter-toggle";
  toggle.textContent="Filters";
  toggle.setAttribute("aria-expanded","true");
  toggle.setAttribute("aria-controls","desktop-filter-content");
  const content=document.createElement("div");
  content.className="desktop-filter-content";
  content.id="desktop-filter-content";
  gallery.parentNode.insertBefore(layout,gallery);
  layout.append(sidebar,gallery);
  sidebar.append(toggle,content);

  content.innerHTML='<div class="desktop-filter-heading"><strong>Filter products</strong><button type="button" class="desktop-filter-reset">Clear</button></div>';
  facets.forEach(([key,label,get])=>{
    const values=[...new Set(products.map(get).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const wrap=document.createElement("label"); wrap.className="desktop-filter-field";
    const select=document.createElement("select"); select.dataset.facet=key;
    select.add(new Option("All "+label.toLowerCase(),""));
    values.forEach(v=>select.add(new Option(v,v)));
    const caption=document.createElement("span"); caption.textContent=label;
    wrap.append(caption,select); content.append(wrap);
  });
  const selects=[...content.querySelectorAll("select")];
  const reset=content.querySelector(".desktop-filter-reset");
  const count=document.createElement("p"); count.className="desktop-filter-count"; count.setAttribute("aria-live","polite"); content.append(count);

  function apply(){
    const chosen=Object.fromEntries(selects.map(s=>[s.dataset.facet,s.value]));
    const matching=products.filter(p=>facets.every(([key,,get])=>!chosen[key]||get(p)===chosen[key]));
    window.__setGalleryComparisonFilter(matching.map(p=>p.id));
    count.textContent=matching.length+" matching products";
  }
  toggle.addEventListener("click",()=>{
    const collapsed=layout.classList.toggle("filters-collapsed");
    toggle.setAttribute("aria-expanded",String(!collapsed));
    toggle.setAttribute("aria-label",collapsed?"Open filters":"Hide filters");
    content.hidden=collapsed;
  });
  selects.forEach(s=>s.addEventListener("change",apply));
  reset.addEventListener("click",()=>{selects.forEach(s=>s.value="");apply();});
  apply();
})();