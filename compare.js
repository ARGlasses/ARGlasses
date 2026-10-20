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
    everyday: {label:"Everyday wear", categories:["ai"], terms:["lightweight","prescription","camera-free","everyday","notifications","translation","open-ear"]},
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
    for (const [key,value] of Object.entries(values)) value && value !== "all" ? params.set(key,value) : params.delete(key);
    selected.size ? params.set("compare",[...selected].join(",")) : params.delete("compare");
    state.differences ? params.set("diff","1") : params.delete("diff");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    state.q = params.get("q") || "";
    for (const key of ["category","brand","sort","use","budget"]) {
      const val = params.get(key);
      if (val) state[key] = val;
    }
    if (!["all","display","ai","spatial","enterprise"].includes(state.category)) state.category = "all";
    if (!["brand","price-low","price-high","weight","newest"].includes(state.sort)) state.sort = "brand";
    if (!["all",...Object.keys(useCases)].includes(state.use)) state.use = "all";
    if (!["all","250","350","500","750","1000","1500"].includes(state.budget)) state.budget = "all";
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
    const map = {"product-search":"q","category-filter":"category","brand-filter":"brand","sort-filter":"sort","use-case-filter":"use","budget-filter":"budget","differences-only":"differences"};
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
        const result=numericWeight(a.weight)-numericWeight(b.weight); if(Number.isFinite(result)&&result!==0)return result;
      } else if(state.sort==="newest") {
        const result=(Number(b.year)||0)-(Number(a.year)||0);if(result)return result;
      }
      return String(a.brand||"").localeCompare(String(b.brand||""))||String(a.name||"").localeCompare(String(b.name||""));
    });
    return list;
  }
  function render() {
    const list=filteredProducts();
    if($("catalogue-count")) $("catalogue-count").textContent=list.length+" of "+PRODUCTS.length+" products";
    if($("selected-count")) $("selected-count").textContent=selected.size+" selected";
    if($("compare-selected")) $("compare-selected").disabled=selected.size<2;
    if($("no-results")) $("no-results").hidden=list.length>0;
    if($("product-grid")) $("product-grid").innerHTML=list.map(p=>{
      const price = p.priceText || (numericPrice(p)!==null ? "£"+numericPrice(p) : "Price not confirmed");
      const match = state.use!=="all" ? '<span class="match-label">'+esc(useLabel(p))+'</span>' : "";
      return '<article class="product-card '+(selected.has(p.id)?"selected":"")+'">'+
        '<div class="product-card-top"><div><span class="product-category">'+esc(categoryNames[p.category]||"Other")+'</span><h3>'+esc(p.name)+'</h3><div class="product-brand">'+esc(p.brand)+' · '+esc(p.year||"Year not confirmed")+'</div>'+match+'</div><div class="product-price">'+esc(price)+'</div></div>'+
        '<div class="product-card-body"><p class="product-summary">'+esc(p.summary)+'</p><div class="quick-specs"><div class="quick-spec"><b>'+esc(p.resolution||"Not disclosed")+'</b><span>Resolution</span></div><div class="quick-spec"><b>'+esc(p.fov||"Not disclosed")+'</b><span>Field of view</span></div><div class="quick-spec"><b>'+esc(p.weight||"Not disclosed")+'</b><span>Weight</span></div><div class="quick-spec"><b>'+esc(p.tracking||"Not disclosed")+'</b><span>Tracking</span></div></div></div>'+
        '<div class="product-card-actions"><label><input type="checkbox" data-select="'+esc(p.id)+'" '+(selected.has(p.id)?"checked":"")+' '+(!selected.has(p.id)&&selected.size>=3?"disabled":"")+' aria-label="Add '+esc(p.brand+" "+p.name)+' to comparison"> Add to compare</label><a href="'+esc(p.source)+'" target="_blank" rel="noopener noreferrer">Manufacturer source ↗</a></div></article>';
    }).join("");
    renderComparison();
    updateUrl();
  }
  function renderComparison() {
    const products=PRODUCTS.filter(p=>selected.has(p.id));
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
  document.addEventListener("change",e=>{
    const target=e.target;
    if(target.matches("[data-select]")){
      const id=target.dataset.select;
      if(target.checked){if(selected.size<3)selected.add(id);}else selected.delete(id);
      render();return;
    }
    const controls={"category-filter":"category","brand-filter":"brand","sort-filter":"sort","use-case-filter":"use","budget-filter":"budget"};
    if(controls[target.id]){setValue(target.id,controls[target.id]);render();}
    if(target.id==="differences-only"){state.differences=target.checked;render();}
  });
  if($("product-search")) $("product-search").addEventListener("input",e=>{state.q=e.target.value;render();});
  if($("compare-selected")) $("compare-selected").addEventListener("click",()=>{$("comparison").hidden=false;$("comparison").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});});
  if($("clear-comparison")) $("clear-comparison").addEventListener("click",()=>{selected.clear();render();});
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