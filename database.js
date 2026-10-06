const DB_PRODUCTS = window.ARG_PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  cat: ({display:"Display glasses",ai:"AI smart glasses",spatial:"Spatial / true AR",enterprise:"Enterprise AR"})[p.category] || p.category,
  year: p.year,
  price: p.priceText,
  weight: p.weight,
  display: p.display,
  resolution: p.resolution,
  fov: p.fov,
  refresh: p.refresh,
  brightness: p.brightness,
  tracking: p.tracking,
  power: p.power,
  camera: p.camera,
  audio: p.audio,
  compat: p.compatibility,
  rx: p.prescription,
  source: p.source
}));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fields=["name","cat","year","price","weight","display","resolution","fov","refresh","brightness","tracking","power","camera","audio","compat","rx"];
const labels=["Product","Category","Year","Price / availability","Weight","Display","Resolution","FOV","Refresh","Brightness","Tracking","Power / battery","Camera","Audio","Compatibility","Prescription"];
function render(){
 const q=document.getElementById("db-search").value.toLowerCase(), cat=document.getElementById("db-category").value, brand=document.getElementById("db-brand").value, sort=document.getElementById("db-sort").value;
 let a=DB_PRODUCTS.filter(p=>(cat==="all"||p.cat===cat)&&(brand==="all"||p.brand===brand)&&JSON.stringify(p).toLowerCase().includes(q));
 const weightOf=value=>{const match=String(value??"").match(/[0-9]+(?:\.[0-9]+)?/);return match?Number(match[0]):Infinity;};
 const compareKnown=(x,y,descending=false)=>{const xv=Number.isFinite(x)?x:null,yv=Number.isFinite(y)?y:null;if(xv===null&&yv===null)return 0;if(xv===null)return 1;if(yv===null)return -1;return descending?yv-xv:xv-yv;};
 a.sort((x,y)=>{const result=sort==="year"?compareKnown(x.year,y.year,true):sort==="weight"?compareKnown(weightOf(x.weight),weightOf(y.weight)):0;return result||String(x.name||"").localeCompare(String(y.name||""));});
 document.getElementById("db-count").textContent=a.length+" of "+DB_PRODUCTS.length+" products in the current reference set";
 document.getElementById("db-body").innerHTML=a.map(p=>"<tr><td><strong>"+esc(p.name)+"</strong><br><a href='"+esc(p.source)+"' target='_blank' rel='noopener noreferrer'>Manufacturer source ↗</a></td>"+fields.slice(1).map(k=>"<td>"+(k==="cat"?"<span class='db-tag'>"+esc(p[k])+"</span>":esc(p[k]||"Not published"))+"</td>").join("")+"</tr>").join("");
}
[...new Set(DB_PRODUCTS.map(p=>p.brand))].sort().forEach(b=>document.getElementById("db-brand").insertAdjacentHTML("beforeend","<option>"+esc(b)+"</option>"));
["db-search","db-category","db-brand","db-sort"].forEach(id=>document.getElementById(id).addEventListener(id==="db-search"?"input":"change",render));
const brandFromUrl=new URLSearchParams(window.location.search).get("brand");
if(brandFromUrl){
  const brandSelect=document.getElementById("db-brand");
  const normalizeBrand=value=>String(value||"").trim().toLowerCase();
  const requested=normalizeBrand(brandFromUrl);
  const option=[...brandSelect.options].find(o=>normalizeBrand(o.value)===requested)
    || [...brandSelect.options].find(o=>normalizeBrand(o.value).startsWith(requested+" /"));
  if(option) brandSelect.value=option.value;
}
render();