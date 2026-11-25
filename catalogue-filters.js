/* Desktop-only catalogue facets. Filters the existing comparison picker without changing its selection or comparison logic. */
(() => {
  "use strict";
  const products = Array.isArray(window.ARG_PRODUCTS) ? window.ARG_PRODUCTS : [];
  const sidebar = document.querySelector(".catalogue-sidebar");
  const list = document.getElementById("product-picker-options");
  if (!sidebar || !list || !products.length) return;
  const facets = [
    ["manufacturer","Manufacturer",p=>p.brand],
    ["type","Glasses type",p=>({display:"Display glasses",ai:"AI smart glasses",spatial:"Spatial / true AR",enterprise:"Enterprise AR"}[p.category]||"Other")],
    ["display","Display technology",p=>/micro-?oled/i.test(p.display||"")?"Micro-OLED":/microled/i.test(p.display||"")?"MicroLED":/waveguide/i.test(p.display||"")?"Waveguide":/lcos|liquid-crystal/i.test(p.display||"")?"LCoS":/no display/i.test(p.display||"")?"No display":p.display?"Other / specified":"Not stated"],
    ["os","Operating system",p=>/standalone|android-based|aios|snap os/i.test([p.summary,p.compatibility,p.power].join(" "))?"Standalone OS":/ios|android/i.test(p.compatibility||"")?"Phone companion (iOS / Android)":"Not specified"],
    ["connectivity","Connectivity",p=>/usb-c|dp alt/i.test([p.power,p.compatibility].join(" "))?"USB-C":/wi-?fi|bluetooth/i.test([p.power,p.compatibility].join(" "))?"Wireless (Bluetooth / Wi-Fi)": "Other / not stated"],
    ["compatibility","Compatibility",p=>/iphone|ios/i.test(p.compatibility||"")&&/android/i.test(p.compatibility||"")?"iPhone & Android":/iphone|ios/i.test(p.compatibility||"")?"iPhone / iOS":/android/i.test(p.compatibility||"")?"Android":/pc|windows|laptop/i.test(p.compatibility||"")?"PC / laptop":"Check manufacturer"],
    ["features","Features",p=>{const s=[p.summary,p.tracking,p.camera,p.audio].join(" ").toLowerCase();return /6dof|slam|spatial mapping/.test(s)?"6DoF / spatial tracking":/camera|12 mp|video/.test(s)?"Camera":/translation|live captions/.test(s)?"Translation / captions":/prescription|diopter/.test([s,p.prescription].join(" "))?"Prescription options":/microphone|speaker|audio/.test(s)?"Audio": "Other / not stated";}],
    ["price","Price",p=>{const n=Number(p.price);return Number.isFinite(n)?(n<300?"Under £300":n<500?"£300–£499":n<750?"£500–£749":"£750+"):"Price not confirmed";}],
    ["availability","Availability",p=>/out of stock|register for stock|stock notification|legacy|no longer lists/i.test(p.priceText||"")?"Limited / check stock":/check (uk )?store|check regional|availability varies|not announced/i.test([p.priceText,p.compatibility].join(" "))?"Check availability":"Listed / see retailer"]
  ];
  const panel=document.createElement("section");
  panel.className="desktop-catalogue-filters";
  panel.setAttribute("aria-label","Filter products");
  panel.innerHTML='<div class="desktop-filter-heading"><strong>Filter products</strong><button type="button" class="desktop-filter-reset">Clear filters</button></div><label class="desktop-filter-search">Search products<input type="search" placeholder="Name, brand or feature" aria-label="Search products"></label>';
  facets.forEach(([key,label,get])=>{
    const values=[...new Set(products.map(get).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const wrap=document.createElement("label"); wrap.className="desktop-filter-field";
    const select=document.createElement("select"); select.dataset.facet=key;
    select.add(new Option("All "+label.toLowerCase(), ""));
    values.forEach(v=>select.add(new Option(v,v)));
    const caption=document.createElement("span"); caption.textContent=label;
    wrap.append(caption,select); panel.append(wrap);
  });
  const controls=sidebar.querySelector(".compare-controls");
  sidebar.insertBefore(panel,controls||sidebar.firstChild);
  const search=panel.querySelector("input");
  const selects=[...panel.querySelectorAll("select")];
  const reset=panel.querySelector(".desktop-filter-reset");
  function apply(){
    const chosen=Object.fromEntries(selects.map(s=>[s.dataset.facet,s.value]));
    const q=search.value.trim().toLowerCase();
    let visible=0;
    list.querySelectorAll("[data-picker-select]").forEach(input=>{
      const p=products.find(item=>item.id===input.dataset.pickerSelect);
      const row=input.closest(".product-picker-option");
      if(!p||!row)return;
      const matches=facets.every(([key,,get])=>!chosen[key]||get(p)===chosen[key]) &&
        (!q||[p.brand,p.name,p.summary,p.display,p.compatibility,p.features].join(" ").toLowerCase().includes(q));
      row.hidden=!matches;
      if(matches)visible++;
    });
    let note=panel.querySelector(".desktop-filter-count");
    if(!note){note=document.createElement("p");note.className="desktop-filter-count";note.setAttribute("aria-live","polite");panel.append(note);}
    note.textContent=visible+" matching products";
  }
  selects.forEach(s=>s.addEventListener("change",apply));
  search.addEventListener("input",apply);
  reset.addEventListener("click",()=>{selects.forEach(s=>s.value="");search.value="";apply();});
  new MutationObserver(apply).observe(list,{childList:true,subtree:true});
  apply();
})();