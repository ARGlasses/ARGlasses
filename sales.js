import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const GLOBAL={2024:{n:1300,s:8.1,a:2.1,r:.7},2025:{n:1330,s:9.8,a:8.7,r:.6},2026:{n:1360,s:13.6,a:15,r:.95},2027:{n:1390,s:16.5,a:18,r:3.8},2028:{n:1420,s:20,a:21.5,r:10.2},2029:{n:1450,s:23.5,a:25,r:19.8},2030:{n:1480,s:27.3,a:29.5,r:32.1}};
const COLORS={n:"#ffd166",s:"#20d9ff",a:"#c66cff",r:"#42f5a7",all:"#ff4fb3"};
const NAMES={all:"ALL GLASSES",n:"NORMAL",s:"SMART",a:"AI",r:"AR"};
const BASE={Asia:7.2,Europe:5.4,"North America":6.1,"South America":2.4,Africa:2.1,Oceania:1.1};
const MAJOR={"China":34,"India":27,"United States of America":25,"Indonesia":11,"Brazil":10,"Russia":9,"Japan":8.5,"Mexico":7.5,"Germany":7,"United Kingdom":6.5,"France":6.2,"Italy":5.8,"Canada":5.5,"South Korea":5.2,"Spain":5,"Australia":4.8,"Türkiye":4.7,"Vietnam":4.5,"Iran":4.4,"Thailand":4.2,"Egypt":4.1,"Philippines":4,"Nigeria":3.9,"Pakistan":3.8,"Bangladesh":3.7,"Poland":3.5,"Saudi Arabia":3.3,"Argentina":3.2,"South Africa":3.1};
let year=2026,mode="all",features=[],selected=null;
const $=s=>document.querySelector(s);
const fmt=v=>v>=1000?(v/1000).toFixed(2)+"B":v>=1?v.toFixed(v>=10?0:1)+"M":Math.round(v*1000)+"K";
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967295};
const weight=f=>{const p=f.properties||{},n=p.name||"Unknown";return MAJOR[n]||((BASE[p.continent]||2)*(.55+hash(n)*1.15))};

function allocate(){
 const ws=features.map(weight),sum=ws.reduce((a,b)=>a+b,0);
 features.forEach((f,i)=>{const q=ws[i]/sum;f.sales={n:q*GLOBAL[year].n,s:q*GLOBAL[year].s,a:q*GLOBAL[year].a,r:q*GLOBAL[year].r}});
}
function paint(v,max,color){
 const t=Math.pow(Math.max(0,Math.min(1,v/max)),.55);
 return d3.interpolateRgb("#102e36",color)(t);
}
function select(f){
 selected=f;
 const p=f.properties||{},name=p.name||"World",s=f.sales,total=s.n+s.s+s.a+s.r;
 $("#regionName").textContent=name.toUpperCase();
 $("#regionValue").textContent=fmt(mode==="all"?total:s[mode]);
 $("#regionLabel").textContent=(mode==="all"?"MODELLED UNITS / YEAR":NAMES[mode]+" UNITS / YEAR");
 const rows=[["NORMAL",s.n,"#ffd166"],["SMART",s.s,"#20d9ff"],["AI",s.a,"#c66cff"],["AR",s.r,"#42f5a7"]],mx=Math.max(...rows.map(x=>x[1]));
 $("#regionBars").innerHTML=rows.map(x=>'<div class="bar-row"><span>'+x[0]+'</span><i><b style="width:'+Math.max(3,x[1]/mx*100)+'%;background:'+x[2]+'"></b></i><b>'+fmt(x[1])+'</b></div>').join("");
 $("#insight").textContent=name==="World"?"Global anchors combine published industry figures with forward projections. Country values are modelled allocations, not audited shipments.":"Country value is a modelled allocation of published global category anchors. It is directional market intelligence, not audited country shipment data.";
}
function tip(e,f){
 const p=f.properties||{},s=f.sales,total=s.n+s.s+s.a+s.r,t=$("#mapTip");
 t.innerHTML="<strong>"+p.name+"</strong><div><span>Total</span><b>"+fmt(total)+"</b></div><div><span>Smart</span><b>"+fmt(s.s)+"</b></div><div><span>AI</span><b>"+fmt(s.a)+"</b></div><div><span>AR</span><b>"+fmt(s.r)+"</b></div>";
 t.hidden=false;const r=$(".sales-map-panel").getBoundingClientRect();t.style.left=Math.min(Math.max(8,e.clientX-r.left+10),r.width-190)+"px";t.style.top=Math.min(Math.max(35,e.clientY-r.top+10),r.height-150)+"px";
}
function draw(){
 const root=d3.select("#worldMap"),w=root.node().clientWidth,h=root.node().clientHeight;
 root.selectAll("*").remove();
 const svg=root.append("svg").attr("viewBox","0 0 "+w+" "+h);
 const fc={type:"FeatureCollection",features};
 const projection=d3.geoNaturalEarth1().fitExtent([[3,8],[w-3,h-5]],fc),path=d3.geoPath(projection);
 const vals=features.map(f=>mode==="all"?f.sales.n+f.sales.s+f.sales.a+f.sales.r:f.sales[mode]),max=d3.max(vals)||1;
 svg.selectAll("path").data(features).join("path").attr("class","country").attr("data-country",f=>f.properties.name)
 .attr("d",path).attr("fill",f=>paint(mode==="all"?f.sales.n+f.sales.s+f.sales.a+f.sales.r:f.sales[mode],max,COLORS[mode]))
 .on("mouseenter",(e,f)=>{tip(e,f);select(f)}).on("mousemove",e=>{const f=features.find(x=>x.properties.name===e.target.dataset.country);if(f)tip(e,f)}).on("mouseleave",()=>{$("#mapTip").hidden=true})
 .on("click",(e,f)=>{e.stopPropagation();select(f)});
 $("#mapStatus").textContent=features.length+" COUNTRIES / TERRITORIES";
}
function update(){
 const d=GLOBAL[year];$("#yearText").textContent=year;$("#normalKpi").textContent=fmt(d.n);$("#smartKpi").textContent=fmt(d.s);$("#aiKpi").textContent=fmt(d.a);$("#arKpi").textContent="~"+fmt(d.r);$("#metricTitle").textContent=NAMES[mode]+" / COUNTRY VIEW";
 allocate();draw();
 if(selected&&selected.properties&&selected.properties.name){const fresh=features.find(f=>f.properties.name===selected.properties.name);if(fresh)select(fresh)}else select({properties:{name:"World"},sales:d});
}
$("#yearSlider").addEventListener("input",e=>{year=+e.target.value;update()});
$("#modeSwitch").addEventListener("click",e=>{const b=e.target.closest("button[data-mode]");if(!b)return;mode=b.dataset.mode;document.querySelectorAll("#modeSwitch button").forEach(x=>x.classList.toggle("active",x===b));update()});
window.addEventListener("resize",()=>features.length&&draw());
(async()=>{try{const r=await fetch("https://cdn.jsdelivr.net/gh/datasets/geo-countries@main/data/countries.geojson");if(!r.ok)throw Error();const data=await r.json();features=data.features||[];update()}catch(e){$("#mapStatus").textContent="BOUNDARY DATA UNAVAILABLE";$("#insight").textContent="The country boundary data could not be loaded. Refresh to retry."}})();