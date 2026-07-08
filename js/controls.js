/* =========================================================
   controls
   ========================================================= */
function buildChips(){
  const fWrap=document.getElementById("formatChips");
  for(const [k,f] of Object.entries(FORMATS)){
    const b=document.createElement("button");
    b.className="chip";b.type="button";
    b.textContent=f.label;
    b.dataset.k=k;
    b.addEventListener("click",()=>{setChoice("format",k,fWrap);startGeneration();});
    fWrap.appendChild(b);
  }
  const cWrap=document.getElementById("collChips");
  const colls=[
    ["pollock","Jackson Pollock","enamel pours on canvas"],
    ["miro","Joan Miró","dream paintings in oil"],
    ["matisse","Henri Matisse","line drawings in ink"]
    ,["basquiat","Jean-Michel Basquiat","oilstick & crayon on paper"]
    /* the nocturne wing is dormant — engine, ledge support and scene
       chooser remain intact; uncomment to rehang it:
       ,["keita","Keita-ish","Tokyo nocturnes in oil"] */
    /* the silk wing is dormant: its engine, AI illustrator, framing and
       ledge support remain intact — uncomment to restore it:
    ,["scarf","Hermès Scarves","embroidered silk carrés"] */
  ];
  for(const [k,label,sub] of colls){
    const b=document.createElement("button");
    b.className="chip";b.type="button";b.dataset.k=k;
    b.innerHTML=`<span>${label}<small>${sub}</small></span>`;
    b.addEventListener("click",()=>{
      if(state.mode===k)return;
      state.mode=k;
      syncModeUI();
      startGeneration();
    });
    cWrap.appendChild(b);
  }

  buildPaletteChips();

  const mWrap=document.getElementById("motifChips");
  for(const [k,m] of Object.entries(SCARF_MOTIFS)){
    const b=document.createElement("button");
    b.className="chip";b.type="button";b.dataset.k=k;
    b.innerHTML=`<span>${m.name}<small>${m.note}</small></span>`;
    b.addEventListener("click",()=>{setChoice("motif",k,mWrap);startGeneration();});
    mWrap.appendChild(b);
  }
  setChoice("motif",state.motif,mWrap);

  fillSubjectChips();
  const aWrap=document.getElementById("aiChips");
  const aiDefs=[
    ["off","Off","procedural engine only"],
    ["on","On","Claude critiques & retouches each pour — sends the canvas image to the API"]
  ];
  for(const [k,label,sub] of aiDefs){
    const b=document.createElement("button");
    b.className="chip";b.type="button";b.dataset.k=k;
    b.innerHTML=`<span>${label}<small>${sub}</small></span>`;
    b.addEventListener("click",()=>{
      state.ai=k==="on";
      try{localStorage.setItem("drip-atelier-ai",state.ai?"1":"0");}catch(e){}
      syncAIChips();
    });
    aWrap.appendChild(b);
  }

  const frWrap=document.getElementById("frameChips");
  for(const [k,f] of Object.entries(FRAMES)){
    const b=document.createElement("button");
    b.className="chip";b.type="button";b.dataset.k=k;
    b.innerHTML=`<span class="fr f-${k}"></span><span>${f.label}<small>${f.sub}</small></span>`;
    b.addEventListener("click",()=>{
      setChoice("frame",k,frWrap);
      const wrap=document.getElementById("framewrap");
      wrap.className="framewrap f-"+k;
      wrap.style.backgroundImage="";
      layoutView();
    });
    frWrap.appendChild(b);
  }
}
function syncAIChips(){
  document.querySelectorAll("#aiChips .chip").forEach(b=>
    b.setAttribute("aria-pressed",String((b.dataset.k==="on")===state.ai)));
}

function setChoice(key,val,wrap){
  if(key!=="__noop")state[key]=val;
  wrap.querySelectorAll(".chip").forEach(b=>b.setAttribute("aria-pressed",b.dataset.k===val));
}

document.getElementById("regen").addEventListener("click",startGeneration);
dlBtn.addEventListener("click",download);
window.addEventListener("resize",layoutView);

buildChips();
setChoice("format",state.format,document.getElementById("formatChips"));
setChoice("palette",state.palette,document.getElementById("paletteChips"));
setChoice("frame",state.frame,document.getElementById("frameChips"));
renderRail();
syncAIChips();
syncModeUI();
(async()=>{
  if(LEDGE_MODE!=="artifact"){
    /* probe the API once: present and healthy -> communal remote mode */
    try{
      const g=await apiFetch("GET");
      if(Array.isArray(g)){LEDGE_MODE="remote";gallery=g.slice(0,5);}
    }catch(e){/* no API here — stay with localStorage */}
  }
  if(LEDGE_MODE!=="local"){
    document.querySelector(".fineprint").textContent+=
      " The ledge below is communal: it holds the five most recent pours by anyone visiting this atelier, and titles are visible to everyone.";
    const refresh=async()=>{
      const latest=await fetchLedge();
      if(JSON.stringify(gallery)!==JSON.stringify(latest)&&document.activeElement!==titleInput){
        gallery=latest;
        renderRail();
      }
    };
    refresh();
    setInterval(refresh,30000);
  }
  renderRail();
})();
startGeneration();
