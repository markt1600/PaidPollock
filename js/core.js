"use strict";
/* =========================================================
   The Drip Atelier — generative drip-painting engine
   ========================================================= */

/* ---------- seeded RNG ---------- */
function mulberry32(a){
  return function(){
    a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
let rnd=Math.random;
const R=(a,b)=>a+rnd()*(b-a);
const RI=(a,b)=>Math.floor(R(a,b+1));
const pick=arr=>arr[Math.floor(rnd()*arr.length)];
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);

/* ---------- color helpers ---------- */
function hexToRgb(h){
  const n=parseInt(h.slice(1),16);
  return [n>>16&255,n>>8&255,n&255];
}
function rgbStr(r,g,b,a=1){return `rgba(${r|0},${g|0},${b|0},${a})`;}
function jitterColor(hex,amt){
  let [r,g,b]=hexToRgb(hex);
  const j=()=>R(-amt,amt);
  return [clamp(r+j(),0,255),clamp(g+j(),0,255),clamp(b+j(),0,255)];
}

/* ---------- paint relief ----------
   A half-resolution height field accumulates wherever paint lands.
   The varnish pass lights it from the upper left: ridges catch light,
   valleys shade, enamel gets specular gloss, and the canvas weave
   (baked in as the base of the field) shows through thin passages. */
let REL=null, RELU=0;
let LIGHT_ANG=-2.356;              // key light from the upper left (varies per painting)
function hstamp(x,y,r,a){
  if(!REL)return;
  REL.fillStyle=`rgba(255,255,255,${a})`;
  REL.beginPath();
  REL.arc(x,y,r,0,6.2832);
  REL.fill();
}

/* ---------- configuration ---------- */
const LONG_EDGE=4400;            // hi-res long edge in px
const DENSITY=8.4;               // all-over coverage multiplier

const FORMATS={
  square :{w:1,  h:1,  label:"Square",        dims:"170 × 170 cm", m:1.7},
  classic:{w:3,  h:2,  label:"Classic 3 : 2", dims:"210 × 140 cm", m:2.1},
  pano   :{w:21, h:9,  label:"Panorama",      dims:"300 × 129 cm", m:3.0},
  portrait:{w:2, h:3,  label:"Portrait",      dims:"140 × 210 cm", m:2.1}
};
const DURATION=3000;             // a fresh pour unfolds over ~3 s

/* layer kinds: stroke width range (in u), steps, drain, alpha */
/* stroke classes are paint loads: width range (u), sim steps, paint
   capacity, opacity, breakup speed (m/s — viscosity proxy: thick house
   enamel holds a filament at speed, thin paint tears early), pool cap */
const KINDS={
  fine:{w:[.7,2.6],  steps:[230,560], drain:8200, a:1, vBreak:1.1, poolMax:5},
  mid :{w:[2.6,6.8], steps:[170,430], drain:6400, a:1, vBreak:1.5, poolMax:7},
  bold:{w:[4.2,9.2], steps:[110,300], drain:5200, a:1,   vBreak:2.2, poolMax:9, shadow:true}
};

const PALETTES={
  convergence:{
    name:"Convergence", note:"cadmium · cobalt · chrome yellow",
    ground:"#e4d5b8", medium:"Oil and enamel on canvas",
    swatches:["#e3b81e","#c63a1a","#44589e","#15110c"],
    layers:[
      {c:"#15110c",kind:"fine",n:68,web:.3},
      {c:"#e3b81e",kind:"mid", n:44,wash:.5,splash:.08},
      {c:"#c63a1a",kind:"mid", n:38,wash:.52,splash:.1},
      {c:"#44589e",kind:"mid", n:30,wash:.58},
      {c:"#15110c",kind:"bold",n:44,web:.12,splash:.12},
      {c:"#f5f0e2",kind:"mid", n:16,wash:.14,splash:.1},
      {c:"#f5f0e2",kind:"fine",n:12,web:.2},
      {c:"#e3b81e",kind:"mid", n:14,wash:.5},
      {c:"#c63a1a",kind:"mid", n:12,wash:.5,splash:.1},
      {c:"#15110c",kind:"fine",n:36,web:.38}
    ]
  },
  number31:{
    name:"One: No. 31", note:"umber · slate · ivory · onyx",
    ground:"#e7e0cd", medium:"Enamel on raw canvas",
    swatches:["#b08d57","#8b8273","#efe9da","#1a150f"],
    layers:[
      {c:"#b08d57",kind:"fine",n:62,wash:.16,web:.14},
      {c:"#8b8273",kind:"fine",n:48,wash:.18,web:.16},
      {c:"#efe9da",kind:"mid", n:40,wash:.15,splash:.10},
      {c:"#46585c",kind:"fine",n:22,web:.2},
      {c:"#1a150f",kind:"bold",n:46,splash:.16},
      {c:"#f4efe3",kind:"mid", n:22,wash:.14,splash:.12}
    ]
  },
  lavender:{
    name:"Lavender Mist", note:"rose · aluminium · bone",
    ground:"#e4dcd0", medium:"Oil, enamel and aluminium paint on canvas",
    swatches:["#c9a8a0","#9aa0a8","#ece6da","#6e5743"],
    layers:[
      {c:"#c9a8a0",kind:"fine",n:64,wash:.42},
      {c:"#a7a8ad",kind:"fine",n:54,metal:true,wash:.18},
      {c:"#ece6da",kind:"mid", n:46,wash:.28,splash:.07},
      {c:"#6e5743",kind:"fine",n:30,wash:.22},
      {c:"#262019",kind:"fine",n:34,web:.3},
      {c:"#f4efe4",kind:"mid", n:24,wash:.18,splash:.08}
    ]
  },
  bluepoles:{
    name:"Blue Poles", note:"prussian · orange · aluminium",
    ground:"#cfc4ab", medium:"Enamel and aluminium paint on canvas",
    swatches:["#c96a1f","#d8b13c","#1d2d52","#15110c"],
    layers:[
      {c:"#c96a1f",kind:"mid", n:36,wash:.35,splash:.10},
      {c:"#d8b13c",kind:"mid", n:32,wash:.3,splash:.08},
      {c:"#efe7d2",kind:"fine",n:40,web:.25},
      {c:"#a6a6aa",kind:"fine",n:30,metal:true},
      {c:"#15110c",kind:"bold",n:34,web:.15,splash:.13},
      {c:"#1d2d52",kind:"bold",n:30,wash:.28,splash:.12}
    ]
  },
  onyx:{
    name:"Number 32", note:"black enamel on cream",
    ground:"#eae4d4", medium:"Enamel on canvas",
    swatches:["#15110c","#15110c","#8f897b","#15110c"],
    layers:[
      {c:"#8f897b",kind:"fine",n:28,wash:.16},
      {c:"#15110c",kind:"mid", n:58,web:.32,splash:.12},
      {c:"#15110c",kind:"bold",n:44,web:.18,splash:.18},
      {c:"#15110c",kind:"fine",n:36,web:.4}
    ]
  }
};

const FRAMES={
  none :{label:"Naked canvas", sub:"unframed"},
  black:{label:"Gallery black",sub:"linen liner"},
  white:{label:"Gallery white",sub:"linen liner"},
  oak  :{label:"Natural oak",  sub:"linen liner"},
  gold :{label:"Museum gold",  sub:"linen liner"}
};

/* ---------- state ---------- */
const state={mode:"pollock",format:"classic",palette:"convergence",scarfPalette:"flamme",miroPalette:"reve",motif:"chaine",subject:"visage",frame:"none",seed:0,frameSeed:1,dyn:.6,title:"",activeId:null,done:false,
  ai:(()=>{try{return localStorage.getItem("drip-atelier-ai")==="1";}catch(e){return false;}})(),
  directives:[],story:""};
let genId=0;

/* ---------- the ledge: last five works, stored as tiny recipes ----------
   A work is fully reproducible from {seed, format, palette, dyn}, so we
   persist recipes + thumbnails, never pixels. localStorage is guarded:
   where it's unavailable the ledge still works for the current session. */
const LS_KEY="drip-atelier-ledge-v10";
/* The ledge can be communal. Storage adapter, in order of preference:
     1. window.storage  — shared artifact storage (e.g. claude.ai)
     2. /api/ledge      — Vercel serverless function backed by KV (README)
     3. localStorage    — this browser only
   The app probes 1 then 2 at boot and falls back gracefully, so the same
   file works as an artifact, on a KV-equipped Vercel deploy, and on any
   plain static host. */
const HAS_ARTIFACT=!!(typeof window!=="undefined"&&window.storage&&window.storage.get&&window.storage.set);
let LEDGE_MODE=HAS_ARTIFACT?"artifact":"local";
let gallery=[];
try{const raw=window.localStorage&&localStorage.getItem(LS_KEY);
    const g=raw?JSON.parse(raw):[];
    gallery=Array.isArray(g)?g.slice(0,5):[];}
catch(e){gallery=[];}

async function apiFetch(method,body){
  const ctrl=new AbortController();
  const tm=setTimeout(()=>ctrl.abort(),3500);
  try{
    const r=await fetch("/api/ledge",{
      method,
      headers:body?{"Content-Type":"application/json"}:undefined,
      body:body?JSON.stringify(body):undefined,
      signal:ctrl.signal
    });
    if(!r.ok)throw new Error("api "+r.status);
    return await r.json();
  }finally{clearTimeout(tm);}
}
async function fetchLedge(){
  if(LEDGE_MODE==="artifact"){
    try{
      const r=await window.storage.get(LS_KEY,true);
      const g=r&&r.value?JSON.parse(r.value):[];
      return Array.isArray(g)?g.slice(0,5):[];
    }catch(e){return [];}
  }
  if(LEDGE_MODE==="remote"){
    try{const g=await apiFetch("GET");return Array.isArray(g)?g.slice(0,5):[];}
    catch(e){return gallery;}
  }
  return gallery;
}
function persistLocal(){
  try{window.localStorage&&localStorage.setItem(LS_KEY,JSON.stringify(gallery));}catch(e){}
}

/* hi-res painting canvas */
const hi=document.createElement("canvas");
const hctx=hi.getContext("2d");
const view=document.getElementById("view");
const vctx=view.getContext("2d");

