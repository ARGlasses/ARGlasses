/* Full-width, responsive product filters for the homepage catalogue. */
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

  const layout=document.createElement("section");
  layout.className="catalogue-filter-shell";
  layout.setAttribute("aria-label","Product filters");
  const toolbar=document.createElement("div"); toolbar.className="catalogue-filter-toolbar";
  const toggle=document.createElement("button"); toggle.type="button"; toggle.className="catalogue-filter-toggle";
  toggle.setAttribute("aria-expanded","false"); toggle.setAttribute("aria-controls","catalogue-filter-panel");
  toggle.innerHTML='<span class="catalogue-filter-icon" aria-hidden="true">☷</span><span>Filter products</span><span class="catalogue-filter-active-count" hidden></span><span class="catalogue-filter-chevron" aria-hidden="true">⌄</span>';
  const summary=document.createElement("span"); summary.className="catalogue-filter-summary"; summary.setAttribute("aria-live","polite");
  toolbar.append(toggle,summary);
  const panel=document.createElement("div"); panel.className="catalogue-filter-panel"; panel.id="catalogue-filter-panel"; panel.hidden=true;
  const panelHead=document.createElement("div"); panelHead.className="catalogue-filter-panel-head";
  panelHead.innerHTML='<div><strong>Refine your search</strong><span>Choose more than one option in a category to broaden your matches.</span></div>';
  const clear=document.createElement("button"); clear.type="button"; clear.className="catalogue-filter-clear"; clear.textContent="Clear all";
  panelHead.append(clear);
  const groups=document.createElement("div"); groups.className="catalogue-filter-groups";
  const results=document.createElement("div"); results.className="catalogue-filter-results"; results.setAttribute("aria-live","polite");
  panel.append(panelHead,groups,results);
  const applied=document.createElement("div"); applied.className="catalogue-filter-applied"; applied.setAttribute("aria-label","Applied filters");
  layout.append(toolbar,applied,panel);
  gallery.parentNode.insertBefore(layout,gallery);

  const selected=new Map(facets.map(([key])=>[key,new Set()]));
  const controls=new Map();
  const allValues=new Map();
  facets.forEach(([key,label,get])=>{
    const values=[...new Set(products.map(get).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    allValues.set(key,values);
    const group=document.createElement("details"); group.className="catalogue-filter-group"; group.open=true;
    const summaryEl=document.createElement("summary"); summaryEl.innerHTML='<span></span><span class="catalogue-filter-group-count"></span>';
    summaryEl.firstElementChild.textContent=label;
    const options=document.createElement("div"); options.className="catalogue-filter-options";
    const entries=[];
    values.forEach(value=>{
      const labelEl=document.createElement("label"); labelEl.className="catalogue-filter-option";
      const input=document.createElement("input"); input.type="checkbox"; input.value=value; input.dataset.facet=key;
      const text=document.createElement("span"); text.textContent=value;
      const count=document.createElement("span"); count.className="catalogue-filter-option-count";
      labelEl.append(input,text,count); options.append(labelEl); entries.push({value,input,count});
      input.addEventListener("change",()=>{
        const set=selected.get(key);
        input.checked?set.add(value):set.delete(value);
        update();
      });
    });
    controls.set(key,{group,summary:summaryEl,entries});
    group.append(summaryEl,options); groups.append(group);
  });

  function matchingProducts(skipKey=null){
    return products.filter(p=>facets.every(([key,,get])=>{
      if(key===skipKey)return true;
      const set=selected.get(key);
      return !set.size||set.has(get(p));
    }));
  }
  function update(){
    const matches=matchingProducts();
    window.__setGalleryComparisonFilter(matches.map(p=>p.id));
    const active=[...selected].reduce((n,[,set])=>n+set.size,0);
    const count=toggle.querySelector(".catalogue-filter-active-count");
    count.hidden=!active; count.textContent=active;
    summary.textContent=matches.length+" of "+products.length+" products";
    results.textContent=matches.length===0?"No products match these filters. Remove an option or clear all filters.":matches.length+" matching "+(matches.length===1?"product":"products");
    applied.replaceChildren();
    if(active){
      const label=document.createElement("span"); label.className="catalogue-filter-applied-label"; label.textContent="Applied:";
      applied.append(label);
      facets.forEach(([key,name])=>selected.get(key).forEach(value=>{
        const chip=document.createElement("button"); chip.type="button"; chip.className="catalogue-filter-chip";
        chip.textContent=name+": "+value+"  ×"; chip.setAttribute("aria-label","Remove "+name+" filter "+value);
        chip.addEventListener("click",()=>{selected.get(key).delete(value);const entry=controls.get(key).entries.find(e=>e.value===value);if(entry)entry.input.checked=false;update();});
        applied.append(chip);
      }));
      const clearChip=document.createElement("button"); clearChip.type="button"; clearChip.className="catalogue-filter-clear-inline"; clearChip.textContent="Clear all";
      clearChip.addEventListener("click",reset); applied.append(clearChip);
    }
    facets.forEach(([key,,get])=>{
      const group=controls.get(key); const set=selected.get(key);
      group.summary.lastElementChild.textContent=set.size?set.size+" selected":"";
      const candidates=matchingProducts(key);
      group.entries.forEach(({value,input,count:countEl})=>{
        const n=candidates.filter(p=>get(p)===value).length;
        countEl.textContent="("+n+")";
        input.disabled=n===0&&!set.has(value);
        input.checked=set.has(value);
      });
    });
  }
  function reset(){
    selected.forEach(set=>set.clear());
    controls.forEach(group=>group.entries.forEach(entry=>entry.input.checked=false));
    update();
  }
  toggle.addEventListener("click",()=>{
    const open=toggle.getAttribute("aria-expanded")!=="true";
    toggle.setAttribute("aria-expanded",String(open)); panel.hidden=!open;
    toggle.querySelector(".catalogue-filter-chevron").textContent=open?"⌃":"⌄";
  });
  clear.addEventListener("click",reset);
  update();
})();