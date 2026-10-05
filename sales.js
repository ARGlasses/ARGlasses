const SALES_REGIONS=[
{name:"North America",lat:39,lon:-100,normal:320,smart:3.8,ai:4.1,ar:.24,color:"#5db7cc",note:"Early AI-glasses adoption and strong premium eyewear economics."},
{name:"Europe",lat:51,lon:15,normal:285,smart:3.1,ai:2.7,ar:.18,color:"#a66cf0",note:"Large optical base; regulation and privacy shape intelligent eyewear adoption."},
{name:"China / East Asia",lat:32,lon:115,normal:410,smart:3.7,ai:4.2,ar:.38,color:"#35d6a0",note:"The strongest AR supply-chain position and rapidly expanding AI-glasses competition."},
{name:"India / South Asia",lat:21,lon:78,normal:210,smart:1.2,ai:1.0,ar:.06,color:"#f2a65a",note:"Huge optical growth runway; connected eyewear remains early but fast-forming."},
{name:"Latin America",lat:-15,lon:-60,normal:75,smart:.8,ai:.6,ar:.03,color:"#ef7185",note:"Conventional eyewear dominates while connected products remain concentrated in major cities."},
{name:"Middle East / Africa",lat:12,lon:30,normal:70,smart:.7,ai:.5,ar:.02,color:"#7dceaa",note:"Young digital consumers and premium urban markets create selective smart-glasses demand."},
{name:"Oceania",lat:-25,lon:135,normal:22,smart:.3,ai:.25,ar:.02,color:"#72a6e6",note:"Small volume, high premium-device penetration and strong early-adopter behaviour."}
];
const YEARS={
2024:{normal:1300,smart:8.1,ai:2.1,ar:.7},2025:{normal:1330,smart:9.8,ai:8.7,ar:.6},
2026:{normal:1360,smart:13.6,ai:15.0,ar:.95},2027:{normal:1390,smart:16.5,ai:18.0,ar:3.8},
2028:{normal:1420,smart:20.0,ai:21.5,ar:10.2},2029:{normal:1450,smart:23.5,ai:25.0,ar:19.8},
2030:{normal:1480,smart:27.3,ai:29.5,ar:32.1}
};
const $=s=>document.querySelector(s);
let metric="all",year=2026,selected=SALES_REGIONS[0],hovered=null;
const canvas=$("#salesGlobe"),ctx=canvas.getContext("2d"),tip=$("#globeTip");

function fmt(v){if(v>=1000)return (v/1000).toFixed(v>=10000?0:2)+"B";return v>=1?v.toFixed(v>=100?0:1)+"M":Math.round(v*1000)+"K"}
function project(lat,lon,w,h,rot=0){const p=Math.PI/180,phi=lat*p,lam=(lon+rot)*p;const x=Math.cos(phi)*Math.sin(lam),z=Math.cos(phi)*Math.cos(lam),y=Math.sin(phi);return{x:w/2+x*w*.36,y:h/2-y*h*.36,z};}
function resize(){const d=devicePixelRatio||1,r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw();}
let rotation=-35;
function draw(){
 const w=canvas.clientWidth,h=canvas.clientHeight,cx=w/2,cy=h/2,R=Math.min(w,h)*.36;
 ctx.clearRect(0,0,w,h);
 const g=ctx.createRadialGradient(cx-R*.25,cy-R*.35,R*.05,cx,cy,R*1.1);g.addColorStop(0,"#164958");g.addColorStop(.55,"#0b2a35");g.addColorStop(1,"#041015");ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
 for(let lat=-60;lat<=60;lat+=20){ctx.beginPath();for(let lon=-180;lon<=180;lon+=4){const q=project(lat,lon,w,h,rotation);if(lon===-180)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y)}ctx.strokeStyle="#67c8d31c";ctx.lineWidth=1;ctx.stroke();}
 for(let lon=-160;lon<=160;lon+=20){ctx.beginPath();for(let lat=-90;lat<=90;lat+=4){const q=project(lat,lon,w,h,rotation);if(lat===-90)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y)}ctx.strokeStyle="#67c8d31c";ctx.stroke();}
 SALES_REGIONS.forEach((r,i)=>{const q=project(r.lat,r.lon,w,h,rotation);if(q.z<-.05)return;const value=metric==="normal"?r.normal:metric==="smart"?r.smart:metric==="ai"?r.ai:metric==="ar"?r.ar:(r.smart+r.ai+r.ar);const rad=5+Math.sqrt(value)*2.1;ctx.beginPath();ctx.arc(q.x,q.y,rad,0,Math.PI*2);ctx.fillStyle=r.color+"35";ctx.fill();ctx.beginPath();ctx.arc(q.x,q.y,3.2,0,Math.PI*2);ctx.fillStyle=r.color;ctx.shadowColor=r.color;ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;if(r===selected){ctx.beginPath();ctx.arc(q.x,q.y,rad+9,0,Math.PI*2);ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.stroke();}});
 ctx.restore();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle="#69cfe033";ctx.stroke();
 rotation+=.035; requestAnimationFrame(draw);
}
function updatePanel(){
 const d=YEARS[year];$("#yearReadout").textContent=year;$("#mixYear").textContent=year;$("#coreValue").textContent=year;$("#globeMode").textContent=year+" · "+(year<=2026?"REPORTED + ESTIMATE":"FORECAST MODEL");
 $("#heroYear").textContent=year;$("#heroSignal").textContent=fmt(d.smart)+"+";$("#heroAr").textContent="~"+fmt(d.ar);
 const mix={normal:Math.min(100,d.normal/15),smart:Math.min(100,d.smart/35*100),ai:Math.min(100,d.ai/35*100),ar:Math.min(100,d.ar/35*100)};
 const total=Math.max(d.smart,d.ai,d.ar);$("#mixBars").innerHTML=[["normal","NORMAL",mix.normal],["smart","SMART",mix.smart],["ai","AI",mix.ai],["ar","AR",mix.ar]].map(x=>'<div class="mix-row '+x[0]+'"><div><span>'+x[1]+'</span><b>'+x[2].toFixed(0)+'%</b></div><i><b style="width:'+x[2]+'%"></b></i></div>').join("");
 $("#mixMessage").textContent=year>=2029?"AR becomes a visibly material part of connected eyewear.":year>=2027?"AI glasses are widening the bridge toward display eyewear.":"AI is pulling the market forward.";
 updateRegion();
 drawChart();
}
function updateRegion(){
 const r=selected;$("#regionName").textContent=r.name.toUpperCase();const mult=year/2026;const n=r.normal*mult,s=r.smart*(YEARS[year].smart/YEARS[2026].smart),a=r.ai*(YEARS[year].ai/YEARS[2026].ai),ar=r.ar*(YEARS[year].ar/YEARS[2026].ar);const v=metric==="normal"?n:metric==="smart"?s:metric==="ai"?a:metric==="ar"?ar:n;
 $("#regionTotal").textContent=fmt(v);$("#regionSub").textContent=(metric==="all"?"annual eyewear units · modelled":metric.toUpperCase()+" units · modelled");$("#regionNote").textContent=r.note;
 const vals=[["N",n,"normal"],["S",s,"smart"],["AI",a,"ai"],["AR",ar,"ar"]];$("#regionBars").innerHTML=vals.map(x=>'<div><span>'+x[0]+'</span><i><b style="width:'+Math.min(100,x[1]/Math.max(n,s,a,ar)*100)+'%;background:'+({normal:"#9aaab0",smart:"#5db7cc",ai:"#a66cf0",ar:"#35d6a0"}[x[2]])+'"></b></i><span>'+fmt(x[1])+'</span></div>').join("");
}
function drawChart(){
 const svg=$("#shiftSvg");const W=900,H=430;const max=1500;const years=Object.keys(YEARS).map(Number);const path=(key,color,scale=1)=>{let d="";years.forEach((y,i)=>{const x=(i/(years.length-1))*W,yv=H-(YEARS[y][key]/max)*H*.9-10;d+=(i?"L":"M")+x+" "+yv+" ";});return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+(key==="ar"?5:2.5)+'" stroke-linecap="round"/>'};
 svg.innerHTML=path("normal","#87979c")+path("smart","#5db7cc")+path("ai","#a66cf0")+path("ar","#35d6a0");
}
function showTip(r,x,y){const d=YEARS[year];tip.hidden=false;tip.style.left=Math.min(x+18,canvas.clientWidth-205)+"px";tip.style.top=Math.max(45,y-15)+"px";const v=metric==="normal"?r.normal:metric==="smart"?r.smart:metric==="ai"?r.ai:metric==="ar"?r.ar:r.smart+r.ai+r.ar;tip.innerHTML='<strong>'+r.name+'</strong><span>'+fmt(v)+' '+(metric==="all"?"connected":"")+ ' signal</span><small>2026 regional model · hover another region</small>'}
canvas.addEventListener("pointermove",e=>{const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let best=null,bd=999;SALES_REGIONS.forEach(r=>{const q=project(r.lat,r.lon,canvas.clientWidth,canvas.clientHeight,rotation);const dist=Math.hypot(q.x-x,q.y-y);if(q.z>0&&dist<bd){best=r;bd=dist}});if(best&&bd<45){selected=best;showTip(best,x,y);updateRegion()}else tip.hidden=true});
canvas.addEventListener("pointerleave",()=>tip.hidden=true);
document.querySelectorAll(".sales-tabs button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".sales-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");metric=b.dataset.metric;updatePanel()}));
$("#yearSlider").addEventListener("input",e=>{year=+e.target.value;updatePanel()});
SALES_REGIONS.forEach((r,i)=>{const el=document.createElement("article");el.className="region-tile";el.innerHTML='<span class="sales-kicker">'+String(i+1).padStart(2,"0")+'</span><h3>'+r.name+'</h3><strong>'+fmt(r.normal)+'</strong><small>million conventional eyewear units · 2026 model</small><p>'+r.note+'</p><div class="mini"><i></i><i></i><i></i></div>';el.addEventListener("mouseenter",()=>{selected=r;updateRegion()});$("#regionGrid").appendChild(el)});
window.addEventListener("resize",resize);resize();updatePanel();
