import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { feature as topoFeature } from "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm";

const GLOBAL={2024:{s:2.7,a:2.1,r:.55},2025:{s:9.6,a:8.7,r:.6},2026:{s:13.6,a:15,r:.95},2027:{s:17.0,a:20,r:3.8},2028:{s:20.1,a:25,r:10.0},2029:{s:23.6,a:30,r:19.8},2030:{s:27.3,a:35,r:32.11}};
const COLORS={n:"#ffd166",s:"#20d9ff",a:"#c66cff",r:"#42f5a7",all:"#ff4fb3"};
const NAMES={all:"SMART GLASSES",s:"SMART GLASSES",a:"AI GLASSES",r:"AR GLASSES"};
const BASE={Asia:7.2,Europe:5.4,"North America":6.1,"South America":2.4,Africa:2.1,Oceania:1.1};
const MAJOR={"China":34,"India":27,"United States of America":25,"Indonesia":11,"Brazil":10,"Russia":9,"Japan":8.5,"Mexico":7.5,"Germany":7,"United Kingdom":6.5,"France":6.2,"Italy":5.8,"Canada":5.5,"South Korea":5.2,"Spain":5,"Australia":4.8,"Türkiye":4.7,"Vietnam":4.5,"Iran":4.4,"Thailand":4.2,"Egypt":4.1,"Philippines":4,"Nigeria":3.9,"Pakistan":3.8,"Bangladesh":3.7,"Poland":3.5,"Saudi Arabia":3.3,"Argentina":3.2,"South Africa":3.1};
let year=2026,mode="all",features=[],selected=null,lakes=[],rivers=[],ice=[];
const $=s=>document.querySelector(s);
const fmt=v=>v==null?"—":v>=1000?(v/1000).toFixed(2)+"B":v>=1?v.toFixed(v>=10?0:1)+"M":Math.round(v*1000)+"K";
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967295};
const weight=f=>{const p=f.properties||{},n=p.name||"Unknown";return MAJOR[n]||((BASE[p.continent]||2)*(.55+hash(n)*1.15))};

function allocate(){
 const ws=features.map(weight),sum=ws.reduce((a,b)=>a+b,0);
 features.forEach((f,i)=>{const q=ws[i]/sum;f.sales={n:0,s:q*GLOBAL[year].s,a:GLOBAL[year].a==null?null:q*GLOBAL[year].a,r:GLOBAL[year].r==null?null:q*GLOBAL[year].r}});
}
function terrainClass(f){
 const p=f.properties||{},name=p.name||"",c=p.continent||"";
 const deserts=new Set(["Algeria","Egypt","Libya","Morocco","Mauritania","Mali","Niger","Chad","Sudan","Saudi Arabia","Yemen","Oman","United Arab Emirates","Jordan","Iraq","Iran","Afghanistan","Namibia","Botswana","Australia","Mongolia","Turkmenistan","Uzbekistan","Kazakhstan","Pakistan"]);
 const tropical=new Set(["Indonesia","Malaysia","Philippines","Papua New Guinea","Brazil","Colombia","Ecuador","Peru","Venezuela","Guyana","Suriname","Bolivia","Congo","Democratic Republic of the Congo","Uganda","Gabon","Cameroon","Ghana","Nigeria","Ivory Coast","Liberia","Sierra Leone","Sri Lanka","Thailand","Vietnam","Cambodia"]);
 const highlands=new Set(["Nepal","Bhutan","Afghanistan","Tajikistan","Kyrgyzstan","Armenia","Georgia","Switzerland","Austria","Ecuador","Peru","Chile","Bolivia","Ethiopia","Lesotho"]);
 const polar=new Set(["Greenland","Iceland","Norway","Sweden","Finland","Canada","Russia"]);
 if(name==="Antarctica"||name==="Greenland") return "ice";
 if(deserts.has(name)) return "desert";
 if(highlands.has(name)) return "highland";
 if(tropical.has(name)) return "tropical";
 const lat=Math.abs(d3.geoCentroid(f)[1]);
 if(lat>65) return "tundra";
 if(lat>52) return "boreal";
 if(c==="Africa") return "savanna";
 if(c==="Asia"&&lat>30) return "steppe";
 if(c==="Oceania") return "dry";
 if(polar.has(name)) return "boreal";
 return "temperate";
}
function terrainPalette(cls){
 return {
  tropical:["#79a85d","#315f3b"], temperate:["#9caf72","#4e7048"], boreal:["#819b68","#405f4a"], tundra:["#a7b69b","#6e8272"],
  savanna:["#b6ad72","#6f7e4c"], steppe:["#b4aa72","#7d784c"], desert:["#d9c28b","#a97b4f"], dry:["#b9ad76","#806e4e"],
  highland:["#9b9a69","#665b4b"], ice:["#e6ece5","#a8bbc0"]
 }[cls]||["#9caf72","#4e7048"];
}
function addTerrainGradient(defs,id,colors){
 const g=defs.append("linearGradient").attr("id",id).attr("x1","0%").attr("y1","0%").attr("x2","100%").attr("y2","100%");
 g.append("stop").attr("offset","0%").attr("stop-color",colors[0]);
 g.append("stop").attr("offset","48%").attr("stop-color",colors[0]);
 g.append("stop").attr("offset","100%").attr("stop-color",colors[1]);
}
function select(f){
 selected=f;
 const p=f.properties||{},name=p.name||"World",s=f.sales,total=s.s;
 $("#regionName").textContent=name.toUpperCase();
 $("#regionValue").textContent=fmt(mode==="all"?total:s[mode]);
 $("#regionLabel").textContent=(mode==="all"?"SMART GLASSES SHIPMENTS / YEAR":NAMES[mode]+" REFERENCE / YEAR");
 const rows=[["SMART",s.s,"#20d9ff"],["AI",s.a,"#c66cff"],["AR",s.r,"#42f5a7"]],mx=Math.max(...rows.map(x=>x[1]));
 $("#regionBars").innerHTML=rows.map(x=>'<div class="bar-row"><span>'+x[0]+'</span><i><b style="width:'+Math.max(3,x[1]/mx*100)+'%;background:'+x[2]+'"></b></i><b>'+fmt(x[1])+'</b></div>').join("");
 $("#insight").textContent=name==="World"?"Smart glasses use IDC shipment anchors. AI and AR figures are shown only where published benchmarks are available; categories overlap and are not additive.":"Country value is a modelled allocation of the published smart-glasses anchor. It is directional market intelligence, not audited country shipment data.";
}
function tip(e,f){
 const p=f.properties||{},s=f.sales,total=s.s,t=$("#mapTip");
 t.innerHTML="<strong>"+p.name+"</strong><div><span>Smart</span><b>"+fmt(total)+"</b></div><div><span>AI</span><b>"+fmt(s.a)+"</b></div><div><span>AR</span><b>"+fmt(s.r)+"</b></div>";
 t.hidden=false;const r=$(".sales-map-panel").getBoundingClientRect();t.style.left=Math.min(Math.max(8,e.clientX-r.left+10),r.width-190)+"px";t.style.top=Math.min(Math.max(35,e.clientY-r.top+10),r.height-150)+"px";
}
function draw(){
 const root=d3.select("#worldMap"),w=root.node().clientWidth,h=root.node().clientHeight;
 root.selectAll("*").remove();
 const svg=root.append("svg").attr("viewBox","0 0 "+w+" "+h);
 const defs=svg.append("defs");
 const fc={type:"FeatureCollection",features};
 const projection=d3.geoNaturalEarth1().fitExtent([[3,8],[w-3,h-5]],fc),path=d3.geoPath(projection);
 features.forEach((f,i)=>addTerrainGradient(defs,"terrain-"+i,terrainPalette(terrainClass(f))));
 svg.append("g").attr("class","terrain").selectAll("path").data(features).join("path").attr("class",f=>"country"+(selected&&selected.properties&&selected.properties.name===f.properties.name?" selected":"")).attr("data-country",f=>f.properties.name).attr("d",path).attr("fill",(f,i)=>"url(#terrain-"+i+")");
 svg.append("g").attr("class","lakes").selectAll("path").data(lakes).join("path").attr("d",path).attr("fill","#78a9bd").attr("stroke","#5c8da2").attr("stroke-width",".35").attr("vector-effect","non-scaling-stroke").attr("pointer-events","none");
 svg.append("g").attr("class","ice").selectAll("path").data(ice).join("path").attr("d",path).attr("fill","#dfe9e7").attr("stroke","#b7cbd0").attr("stroke-width",".3").attr("opacity",".9").attr("vector-effect","non-scaling-stroke").attr("pointer-events","none");
 svg.append("g").attr("class","rivers").selectAll("path").data(rivers).join("path").attr("d",path).attr("fill","none").attr("stroke","#6fa9b7").attr("stroke-width",".65").attr("stroke-linecap","round").attr("opacity",".72").attr("vector-effect","non-scaling-stroke").attr("pointer-events","none");
 svg.selectAll(".country").attr("stroke","#687968").attr("stroke-width",".5").attr("vector-effect","non-scaling-stroke").attr("cursor","pointer")
  .on("mouseenter",(e,f)=>{tip(e,f)}).on("mousemove",e=>{const f=features.find(x=>x.properties.name===e.target.dataset.country);if(f)tip(e,f)}).on("mouseleave",()=>{$("#mapTip").hidden=true})
  .on("click",(e,f)=>{e.stopPropagation();select(f)});
 svg.append("path").datum(d3.geoGraticule().step([30,30])()).attr("fill","none").attr("stroke","rgba(255,255,255,.16)").attr("stroke-width",".35").attr("vector-effect","non-scaling-stroke").attr("d",path).attr("pointer-events","none");
 $("#mapStatus").textContent=features.length+" COUNTRIES / TERRITORIES";
}
function update(){
 const d=GLOBAL[year];$("#yearText").textContent=year;$("#metricTitle").textContent=NAMES[mode]+" / COUNTRY VIEW";
 allocate();draw();
 if(selected&&selected.properties&&selected.properties.name&&selected.properties.name!=="World"){const fresh=features.find(f=>f.properties.name===selected.properties.name);if(fresh)select(fresh);else select({properties:{name:"World"},sales:d})}else select({properties:{name:"World"},sales:d});
}
$("#yearSlider").addEventListener("input",e=>{year=+e.target.value;update()});
window.addEventListener("resize",()=>features.length&&draw());
(async()=>{try{
 const [worldRes,lakeRes,riverRes,iceRes]=await Promise.all([
  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json"),
  fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_lakes.geojson"),
  fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_rivers_lake_centerlines.geojson"),
  fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_glaciated_areas.geojson")
 ]);
 if(!worldRes.ok) throw Error("World boundary request failed: "+worldRes.status);
 const topo=await worldRes.json();
 const collection=topoFeature(topo,topo.objects.countries);
 features=(collection.features||[]).map(f=>({type:"Feature",id:f.id,properties:{...(f.properties||{}),name:f.properties?.name||"Unknown"},geometry:f.geometry}));
 if(lakeRes.ok){const data=await lakeRes.json();lakes=data.features||[]}
 if(riverRes.ok){const data=await riverRes.json();rivers=(data.features||[]).filter(f=>(f.properties?.scalerank??0)<=3)}
 if(iceRes.ok){const data=await iceRes.json();ice=data.features||[]}
 if(!features.length) throw Error("No country features returned");
 update();
}catch(e){
 console.error("Sales map failed to load:",e);
 $("#mapStatus").textContent="MAP DATA UNAVAILABLE";
 $("#insight").textContent="The world map could not be loaded. Refresh to retry.";
}})();
