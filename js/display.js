/* =========================================================
   display, animation driver
   ========================================================= */
function layoutView(){
  if(!hi.width)return;
  const wrap=document.getElementById("framewrap");
  const stage=document.querySelector("main");
  const placardEl=document.getElementById("placard");
  /* measure what actually needs clearing: placard, its gap, and the
     ledge itself — so portrait and square canvases never overlap it */
  const storyEl2=document.getElementById("story");
  const hangGap=placardEl.offsetHeight+railEl.offsetHeight
               +(storyEl2&&!storyEl2.hidden?storyEl2.offsetHeight+14:0)+64;
  const padX=wrap.clientWidth-view.clientWidth;
  const padY=wrap.clientHeight-view.clientHeight;
  const frac=stage.clientWidth<700?.94:.86;   // phones get the width
  const maxW=stage.clientWidth*frac-padX;
  const maxH=stage.clientHeight-hangGap-padY;
  const ar=hi.width/hi.height;
  let w=maxW,h=w/ar;
  if(h>maxH){h=maxH;w=h*ar;}
  w=Math.max(180,w);h=Math.max(120,h);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  view.style.width=w+"px";view.style.height=h+"px";
  view.width=Math.round(w*dpr);view.height=Math.round(h*dpr);
  blit();
  updateFramePreview();
}
/* the on-screen frame is painted by the same code as the download,
   with the same per-piece seed — what you see is what you save */
function updateFramePreview(){
  const wrap=document.getElementById("framewrap");
  if(state.frame==="none"){
    wrap.style.backgroundImage="";
    return;
  }
  const w=Math.round(wrap.offsetWidth), h=Math.round(wrap.offsetHeight);
  if(!w||!h)return;
  const cs=getComputedStyle(wrap);
  const fw=Math.max(6,parseFloat(cs.paddingLeft)||16);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const c2=document.createElement("canvas");
  c2.width=Math.round(w*dpr); c2.height=Math.round(h*dpr);
  const x2=c2.getContext("2d");
  x2.scale(dpr,dpr);
  paintFrameMaterial(x2,w,h,fw,state.frame,mulberry32(state.frameSeed));
  wrap.style.backgroundImage=`url(${c2.toDataURL()})`;
  wrap.style.backgroundSize="100% 100%";
}

function blit(){
  vctx.imageSmoothingEnabled=true;
  vctx.imageSmoothingQuality="high";
  vctx.clearRect(0,0,view.width,view.height);
  vctx.drawImage(hi,0,0,view.width,view.height);
}

const statusEl=document.getElementById("status");
const dlBtn=document.getElementById("download");

function colorName(L){
  const names={fine:"thread",mid:"skein",bold:"rope"};
  return names[L.kind];
}
const titleInput=document.getElementById("pTitle");

function startGeneration(opts={}){
  genId++;
  const myId=genId;
  const entry=opts.entry||null;

  state.frameSeed=(Math.random()*0x7fffffff)|0;
  if(entry){ /* rehang a work from the ledge */
    state.seed=entry.seed;
    state.mode=entry.mode==="scarf"?"scarf":entry.mode==="miro"?"miro"
              :entry.mode==="matisse"?"matisse"
              :entry.mode==="keita"?"keita"
              :entry.mode==="basquiat"?"basquiat":"pollock";
    if(state.mode==="scarf"){
      state.format="square";
      state.scarfPalette=entry.palette in SCARF_PALETTES?entry.palette:"flamme";
      state.motif=entry.motif in SCARF_MOTIFS?entry.motif:"chaine";
    }else if(state.mode==="miro"){
      state.format=entry.format;
      state.miroPalette=entry.palette in MIRO_PALETTES?entry.palette:"reve";
    }else if(state.mode==="matisse"){
      state.format=entry.format in FORMATS?entry.format:"classic";
      state.subject=entry.subject in MATISSE_SUBJECTS?entry.subject:"visage";
    }else if(state.mode==="keita"){
      state.format=entry.format in FORMATS?entry.format:"classic";
      state.subject=entry.subject in KEITA_SCENES?entry.subject:"jihanki";
    }else if(state.mode==="basquiat"){
      state.format=entry.format in FORMATS?entry.format:"classic";
    }else{
      state.format=entry.format;
      state.palette=entry.palette;
    }
    state.dyn=entry.dyn;
    state.title=entry.title;
    state.activeId=entry.id;
    syncModeUI();
    syncControls();
  }else{
    state.seed=(Math.random()*2**31)|0;
    state.activeId="w"+Date.now().toString(36)+state.seed.toString(36);
    const pseed=mulberry32(state.seed);
    if(state.mode==="matisse"){
      const pool=MATISSE_TITLES[state.subject]||MATISSE_TITLES.visage;
      const base=pool[Math.floor(pseed()*pool.length)];
      state.title=pseed()<.5?base:base+" "+["I","II","III","IV","V"][Math.floor(pseed()*5)];
    }else if(state.mode==="keita"){
      const pool=KEITA_TITLES[state.subject]||KEITA_TITLES.jihanki;
      const base=pool[Math.floor(pseed()*pool.length)];
      state.title=pseed()<.6?base:base+" "+["I","II","III"][Math.floor(pseed()*3)];
    }else
    state.title=`No. ${1+Math.floor(pseed()*34)}, 2026`;
  }
  state.done=false;
  dlBtn.disabled=true;

  titleInput.value=state.title;
  const SC=state.mode==="scarf", MI=state.mode==="miro", MA=state.mode==="matisse",
        KE=state.mode==="keita", BA=state.mode==="basquiat";
  if(SC)state.format="square";
  document.getElementById("pMedium").textContent=
    SC?"Silk twill carré, hand-embroidered"
    :MI?(MIRO_PALETTES[state.miroPalette]||MIRO_PALETTES.reve).medium
    :MA?MATISSE_MEDIA[matisseMediumFor(state.seed,state.subject)].medium
    :KE?"Oil on linen"
    :BA?"Oilstick & crayon on paper"
    :PALETTES[state.palette].medium;
  document.getElementById("pDims").textContent=
    SC?"90 × 90 cm, hand-rolled hem"
    :MA?MATISSE_DIMS[state.format]||MATISSE_DIMS.classic
    :FORMATS[state.format].dims;
  markActiveThumb();

  setStory(entry?entry.story||"":"");
  state.directives=entry?(entry.directives||[]):[];
  state.story=entry?(entry.story||""):"";
  state.aiVerdicts=0;
  state.aiError="";
  if(!entry){state.design=null;state.touches=null;state.touchNote="";}
  setAIThinking(false);

  const prog={total:1,done:0};
  let lastStatus=0;
  const statusCb=(li,total,L)=>{
    const now=performance.now();
    if(L&&now-lastStatus<300)return;
    lastStatus=now;
    statusEl.innerHTML=entry
      ?`<span class="dot"></span>Rehanging <b>${esc(state.title)}</b>…`
      :L?(L.scarf
          ?`<span class="dot"></span>Embroidering — ${L.scarf} in <b>${L.c}</b>`
          :L.miro
          ?`<span class="dot"></span>Painting — ${L.miro} in <b>${L.c}</b>`
          :L.matisse
          ?`<span class="dot"></span>Drawing — ${L.matisse} in <b>${L.c}</b>`
          :L.keita
          ?`<span class="dot"></span>Painting the night — ${L.keita}`
          :L.basquiat
          ?`<span class="dot"></span>Working the surface — ${L.basquiat}`
          :`<span class="dot"></span>Pouring — ${colorName(L)} in <b>${L.c}</b>`)
        :SC?`<span class="dot"></span>Pressing the silk, raking the light…`
        :MA?`<span class="dot"></span>Letting the ink dry on the sheet…`
        :KE?`<span class="dot"></span>Waiting for the last train to pass…`
        :BA?`<span class="dot"></span>Letting the oilstick dry on the paper…`
           :`<span class="dot"></span>Raking light over the wet ${MI?"oil":"enamel"}…`;
  };

  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fast=!!entry||opts.fast||reduce;

  /* run a generator on the frame clock. paced=true spreads it over
     DURATION; otherwise it runs flat-out in 13 ms slices, still visibly
     progressive. Resolves with the generator's return value. */
  const runGen=(it,paced)=>new Promise(res=>{
    const born=performance.now();
    function frame(){
      if(myId!==genId){res(null);return;}
      const fStart=performance.now();
      const elapsed=fStart-born;
      const target=(!paced||elapsed>=DURATION)?Infinity:prog.total*elapsed/DURATION;
      let done=false,ret;
      while((!paced||prog.done<target||target===Infinity)&&performance.now()-fStart<(fast?45:13)){
        const r=it.next();
        if(r.done){done=true;ret=r.value;break;}
      }
      blit();
      if(done)res(ret);
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  (async()=>{
    const aiLive=state.ai&&aiAvailable&&!entry&&!reduce&&!SC&&!MA&&!KE&&!BA;
    state.aiNoteMode=MI?"miro":"pollock";
    if(MI){
      if(aiLive){
        /* paced paint, then up to 2 director rounds, then varnish */
        const Cit=miroPhase(state.seed,state.format,state.miroPalette,statusCb,prog);
        let C=null;
        {const r=Cit.next(); if(!r.done)layoutView();
         C=await runGen(Cit,!fast);}
        if(myId!==genId||!C)return;
        const rounds=[];
        let prevNote="";
        for(let round=0;round<2&&aiAvailable;round++){
          statusEl.innerHTML=`<span class="dot"></span>Miró's inner eye considers the dream…`;
          setAIThinking(true);
          let verdict=null;
          try{verdict=await askDirector(C.pal,round,prevNote);}
          catch(e){
            state.aiError=(e&&e.message)||"unreachable";
            if(aiHardFail(e))aiAvailable=false;
          }
          finally{setAIThinking(false);}
          if(myId!==genId)return;
          if(!verdict)break;
          state.aiVerdicts++;
          prevNote=verdict.note||"";
          if(verdict.satisfied||!verdict.actions||!verdict.actions.length)break;
          rounds.push(verdict.actions);
          await runGen(miroRound(C,verdict.actions,prog),false);
          if(myId!==genId)return;
        }
        state.directives=rounds;
        await runGen(varnishPhase(C,statusCb,prog),false);
      }else{
        const it=miroGenerate(state.seed,state.format,
          entry?entry.palette:state.miroPalette,
          statusCb,prog,state.directives);
        it.next(); layoutView();
        await runGen(it,!fast);
      }
    }else
    if(MA){
      /* the drawing wing: with the AI on, Claude takes the pen itself
         for the flowers (the design is recorded for exact replay); for
         the faces the geometry never leaves the house — Claude is the
         INK MASTER instead, re-inking chosen strokes (its touches are
         recorded for exact replay) */
      /* the geometry NEVER leaves the house — for faces and flowers
         alike. Claude is only ever the INK MASTER: it may re-ink chosen
         strokes (press, dip, drain) but never draw or move a line.
         Designs recorded in old recipes still replay exactly. */
      const design=entry?(entry.design||null):null;
      const subj=entry?entry.subject:state.subject;
      state.design=design;
      state.touches=entry?(entry.touches||null):null;
      const it=matisseGenerate(state.seed,state.format,subj,
        statusCb,prog,design,state.touches);
      it.next(); layoutView();
      const C=await runGen(it,!fast);
      if(myId!==genId)return;
      if(!entry&&state.ai&&aiAvailable&&!reduce
         &&C&&C.strokes&&C.strokes.length){
        statusEl.innerHTML=`<span class="dot"></span>The ink master studies the hand…`;
        setAIThinking(true);
        let verdict=null;
        try{verdict=await askInkMaster(C.strokes);}
        catch(e){
          state.aiError=(e&&e.message)||"unreachable";
          if(aiHardFail(e))aiAvailable=false;
        }
        finally{setAIThinking(false);}
        if(myId!==genId)return;
        if(verdict&&verdict.touches&&verdict.touches.length){
          state.touches=verdict.touches;
          state.touchNote=verdict.note||"";
          statusEl.innerHTML=`<span class="dot"></span>Re-inking — <b>${esc(state.touchNote||"the hand grows bolder")}</b>`;
          const it2=matisseGenerate(state.seed,state.format,subj,
            statusCb,prog,null,state.touches);
          it2.next();
          await runGen(it2,false);
          if(myId!==genId)return;
        }else if(verdict){
          state.aiVerdicts=(state.aiVerdicts||0)+1;
        }
      }
    }else
    if(KE){
      /* the nocturne wing: the night is painted by the house alone */
      const scene=entry?entry.subject:state.subject;
      const it=keitaGenerate(state.seed,state.format,scene,statusCb,prog);
      it.next(); layoutView();
      await runGen(it,!fast);
    }else
    if(BA){
      /* the canvas wing: the house paints it; if the AI is on, the director
         then sets a colour scheme + the background fields, and it is repainted */
      const dir0=entry?((entry.directives&&entry.directives[0])||null):null;
      const it=basquiatGenerate(state.seed,state.format,"studio",statusCb,prog,dir0);
      it.next(); layoutView();
      const C=await runGen(it,!fast);
      if(myId!==genId)return;
      if(!entry&&state.ai&&aiAvailable&&!reduce&&C){
        statusEl.innerHTML=`<span class="dot"></span>The director considers the colour…`;
        setAIThinking(true);
        let dirv=null;
        try{dirv=await askBasquiatDirector();}
        catch(e){state.aiError=(e&&e.message)||"unreachable";if(aiHardFail(e))aiAvailable=false;}
        finally{setAIThinking(false);}
        if(myId!==genId)return;
        if(dirv){
          state.directives=[dirv];
          state.touchNote=dirv.concept||"";
          statusEl.innerHTML=`<span class="dot"></span>Reworking the colour — <b>${esc(dirv.concept||"a sharper scheme")}</b>`;
          const it2=basquiatGenerate(state.seed,state.format,"studio",statusCb,prog,dirv);
          it2.next();
          await runGen(it2,false);
          if(myId!==genId)return;
        }
      }
    }else
    if(SC){
      /* the silk wing: when the AI is on, Claude illustrates the
         centrepiece first; the design is recorded for exact replay */
      let design=entry?(entry.design||null):null;
      if(!entry&&state.ai&&aiAvailable&&!reduce){
        statusEl.innerHTML=`<span class="dot"></span>The illustrator sketches a centrepiece…`;
        setAIThinking(true);
        try{design=await askIllustrator(state.scarfPalette,state.motif);}
        catch(e){
          state.aiError=(e&&e.message)||"unreachable";
          if(aiHardFail(e))aiAvailable=false;
        }
        finally{setAIThinking(false);}
        if(myId!==genId)return;
      }
      state.design=design;
      const it=scarfGenerate(state.seed,
        entry?entry.palette:state.scarfPalette,
        entry?entry.motif:state.motif,
        statusCb,prog,design);
      it.next(); layoutView();
      await runGen(it,!fast);
    }else if(entry||!state.ai){
      /* one deterministic run: paint, replayed director rounds, varnish */
      const it=generate(state.seed,state.format,state.palette,state.dyn,
                        statusCb,prog,state.directives);
      it.next(); layoutView();
      await runGen(it,!fast);
    }else{
      /* the live session: paint, then the director steps in */
      const itP=paintPhase(state.seed,state.format,state.palette,state.dyn,statusCb,prog);
      itP.next(); layoutView();
      const C=await runGen(itP,!fast);
      if(myId!==genId)return;
      if(C&&aiLive){
        let prevNote="";
        for(let round=0;round<3;round++){
          statusEl.innerHTML=`<span class="dot"></span>The director steps back to consider the canvas…`;
          setAIThinking(true);
          let verdict=null;
          try{verdict=await askDirector(C.pal,round,prevNote);}
          catch(e){
            state.aiError=(e&&e.message)||"unreachable";
            if(aiHardFail(e))aiAvailable=false;
          }
          finally{setAIThinking(false);}
          if(myId!==genId)return;
          if(verdict)state.aiVerdicts=(state.aiVerdicts||0)+1;
          if(!verdict||verdict.satisfied||!verdict.actions.length)break;
          prevNote=verdict.note;
          state.directives.push(verdict.actions);
          statusEl.innerHTML=`<span class="dot"></span>Director, round ${round+1}: <b>${esc(verdict.note||"reworking weak passages")}</b>`;
          await runGen(directorRound(C,verdict.actions,prog),false);
          if(myId!==genId)return;
        }
      }
      if(C)await runGen(varnishPhase(C,statusCb,prog),false);
    }
    if(myId!==genId)return;

    state.done=true;
    dlBtn.disabled=false;
    /* say plainly whether the director was really in the room */
    let aiNote="";
    if(SC&&state.ai&&!entry){
      if(state.aiError)
        aiNote=` <span style="color:#c97f63">Illustrator unavailable this time (${esc(state.aiError)}) — a house design served instead.</span>`;
      else if(state.design)
        aiNote=` Centrepiece illustrated by Claude${state.design.subject?` — “${esc(state.design.subject)}”`:""}.`;
    }
    if(MA&&state.ai&&!entry){
      if(state.aiError)
        aiNote=` <span style="color:#c97f63">The atelier's AI was unavailable this time (${esc(state.aiError)}) — the house hand served alone.</span>`;
      else if(state.design)
        aiNote=` Drawn by Claude${state.design.subject?` — “${esc(state.design.subject)}”`:""}.`;
      else if(state.touches&&state.touches.length)
        aiNote=` Re-inked by Claude — ${state.touches.length} stroke${state.touches.length>1?"s":""}${state.touchNote?` (“${esc(state.touchNote)}”)`:""}.`;
      else if(state.aiVerdicts)
        aiNote=` The ink master let the house hand stand.`;
    }
    if(aiLive){
      if(!aiAvailable&&state.aiError){
        const hint=/404/.test(state.aiError)
          ?"Endpoint or model not found — deploy the latest build (it falls back across model versions)."
          :/503/.test(state.aiError)
          ?"Set ANTHROPIC_API_KEY in the project's environment variables and redeploy."
          :/401/.test(state.aiError)
          ?"The API key is invalid — check it copied completely."
          :/429/.test(state.aiError)
          ?"The API key works but the account is rate-limited or out of credits."
          :"Check the network and the deployment.";
        aiNote=` <span style="color:#c97f63">AI director unreachable (${esc(state.aiError)}) — poured procedurally. ${hint}</span>`;
      }
      else if(state.directives.length)
        aiNote=` Directed by Claude — ${state.directives.length} round${state.directives.length>1?"s":""} of touch-ups.`;
      else if(state.aiVerdicts)
        aiNote=` The director approved the pour on first look.`;
    }
    statusEl.innerHTML=`<b>${esc(state.title)}</b> is dry. ${hi.width.toLocaleString()} × ${hi.height.toLocaleString()} px ready to download.${aiNote}`;

    /* the curator writes the wall label (both wings) */
    if(state.ai&&aiAvailable&&!entry&&!reduce&&!state.story){
      try{
        statusEl.innerHTML+=` <span style="opacity:.7">The curator is writing the label…</span>`;
        setAIThinking(true);
        state.story=await askStory(state.title);
        if(myId!==genId)return;
        setStory(state.story);
        statusEl.innerHTML=`<b>${esc(state.title)}</b> is dry. ${hi.width.toLocaleString()} × ${hi.height.toLocaleString()} px ready to download.`;
      }catch(e){
        if(aiHardFail(e))aiAvailable=false;
        statusEl.innerHTML=`<b>${esc(state.title)}</b> is dry. ${hi.width.toLocaleString()} × ${hi.height.toLocaleString()} px ready to download. <span style="color:#c97f63">(curator's label unavailable: ${esc((e&&e.message)||"unreachable")})</span>`;
      }finally{setAIThinking(false);}
    }
    if(!entry)addToGallery();
  })();
}

/* ---------- ledge UI ---------- */
const railEl=document.getElementById("rail");
function esc(t){return t.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function makeThumb(){
  const L2=300, ar=hi.width/hi.height;
  const t=document.createElement("canvas");
  t.width=ar>=1?L2:Math.round(L2*ar);
  t.height=ar>=1?Math.round(L2/ar):L2;
  const c=t.getContext("2d");
  c.imageSmoothingQuality="high";
  c.drawImage(hi,0,0,t.width,t.height);
  try{return t.toDataURL("image/jpeg",.72);}catch(e){return "";}
}
async function addToGallery(){
  const entry={
    id:state.activeId, seed:state.seed, format:state.format,
    palette:state.mode==="scarf"?state.scarfPalette:
            state.mode==="miro"?state.miroPalette:state.palette,
    dyn:state.dyn, title:state.title, mode:state.mode,
    thumb:makeThumb()
  };
  if(state.mode==="scarf"){
    entry.motif=state.motif;
    if(state.design)entry.design=state.design;
  }
  if(state.mode==="matisse"){
    entry.subject=state.subject;
    if(state.design)entry.design=state.design;
    if(state.touches&&state.touches.length)entry.touches=state.touches;
  }
  if(state.mode==="keita")entry.subject=state.subject;
  if(state.directives.length)entry.directives=state.directives;
  if(state.story)entry.story=state.story;
  if(LEDGE_MODE==="artifact"){
    /* refresh first so we never clobber another visitor's fresh pour */
    const latest=await fetchLedge();
    gallery=[entry,...latest.filter(e=>e.id!==entry.id)].slice(0,5);
    try{await window.storage.set(LS_KEY,JSON.stringify(gallery),true);}catch(e){}
  }else if(LEDGE_MODE==="remote"){
    try{
      const list=await apiFetch("POST",{entry});   // the server merges
      gallery=Array.isArray(list)?list.slice(0,5):gallery;
    }catch(e){ /* offline blip: keep the pour for this session */
      gallery=[entry,...gallery.filter(x=>x.id!==entry.id)].slice(0,5);
    }
  }else{
    gallery=[entry,...gallery.filter(x=>x.id!==entry.id)].slice(0,5);
    persistLocal();
  }
  renderRail();
}

async function persistRename(id,title){
  const e=gallery.find(g=>g.id===id);
  if(e)e.title=title;
  if(LEDGE_MODE==="artifact"){
    try{await window.storage.set(LS_KEY,JSON.stringify(gallery),true);}catch(e2){}
  }else if(LEDGE_MODE==="remote"){
    try{
      const list=await apiFetch("POST",{id,title});
      gallery=Array.isArray(list)?list.slice(0,5):gallery;
    }catch(e2){}
  }else{
    persistLocal();
  }
  renderRail();
}
function renderRail(){
  railEl.innerHTML="";
  if(!gallery.length){
    const d=document.createElement("div");
    d.className="empty";
    d.textContent=LEDGE_MODE!=="local"
      ?"The five most recent pours by anyone in the atelier will rest here."
      :"Finished works will rest on this ledge.";
    railEl.appendChild(d);
    return;
  }
  for(const e of gallery){
    const b=document.createElement("button");
    b.type="button";
    b.dataset.id=e.id;
    b.setAttribute("aria-label","Rehang "+e.title);
    const img=document.createElement("img");
    img.src=e.thumb; img.alt="";
    const t=document.createElement("span");
    t.className="t"; t.textContent=e.title;
    b.appendChild(img); b.appendChild(t);
    b.addEventListener("click",()=>{
      if(e.id===state.activeId&&state.done)return;
      startGeneration({entry:e});
    });
    railEl.appendChild(b);
  }
  markActiveThumb();
  layoutView();   // the rail's height may have changed
}
function markActiveThumb(){
  railEl.querySelectorAll("button").forEach(b=>
    b.setAttribute("aria-pressed",b.dataset.id===state.activeId));
}

/* renaming the piece */
function commitTitle(){
  const v=titleInput.value.trim().slice(0,48);
  if(!v){titleInput.value=state.title;return;}
  state.title=v;
  titleInput.value=v;
  const e=gallery.find(g=>g.id===state.activeId);
  if(e&&e.title!==v)persistRename(state.activeId,v);
  if(state.done)statusEl.innerHTML=`Renamed to <b>${esc(v)}</b>.`;
}
titleInput.addEventListener("change",commitTitle);
titleInput.addEventListener("keydown",e=>{if(e.key==="Enter")titleInput.blur();});

function syncControls(){
  setChoice("format",state.format,document.getElementById("formatChips"));
  setChoice("__noop",
    state.mode==="scarf"?state.scarfPalette:
    state.mode==="miro"?state.miroPalette:state.palette,
    document.getElementById("paletteChips"));
  setChoice("motif",state.motif,document.getElementById("motifChips"));
  setChoice("subject",state.subject,document.getElementById("subjectChips"));
}

/* the subject row serves two wings: the drawings' subjects and the
   nocturnes' scenes */
function fillSubjectChips(){
  const sWrap=document.getElementById("subjectChips");
  if(!sWrap)return;
  const KE=state.mode==="keita";
  const src=KE?KEITA_SCENES:MATISSE_SUBJECTS;
  if(!(state.subject in src))state.subject=KE?"jihanki":"visage";
  sWrap.innerHTML="";
  for(const [k,m] of Object.entries(src)){
    const b=document.createElement("button");
    b.className="chip";b.type="button";b.dataset.k=k;
    b.innerHTML=`<span>${m.name}<small>${m.note}</small></span>`;
    b.addEventListener("click",()=>{setChoice("subject",k,sWrap);startGeneration();});
    sWrap.appendChild(b);
  }
  setChoice("subject",state.subject,sWrap);
}

/* the two wings of the atelier share one set of controls */
function syncModeUI(){
  const SC=state.mode==="scarf", MI=state.mode==="miro", MA=state.mode==="matisse",
        KE=state.mode==="keita", BA=state.mode==="basquiat";
  {const fwEl=document.getElementById("framewrap");
   if(fwEl&&fwEl.classList){fwEl.classList.toggle("silkliner",SC);
    fwEl.classList.toggle("matliner",MA);}}
  document.getElementById("fieldFormat").hidden=SC;
  document.getElementById("fieldMotif").hidden=!SC;
  document.getElementById("fieldPalette").hidden=MA||KE||BA;
  document.getElementById("fieldSubject").hidden=!(MA||KE);
  document.getElementById("lab-subject").textContent=KE?"Scene":"Subject";
  document.getElementById("lab-palette").textContent=SC?"Colourway":MI?"Palette":"Enamel palette";
  document.getElementById("regen").textContent=
    SC?"Commission a new carré":MI?"Paint a new dream":MA?"Draw a new study"
    :KE?"Paint a new nocturne":BA?"Paint a new canvas":"Pour a new painting";
  fillSubjectChips();
  document.querySelectorAll("#collChips .chip").forEach(b=>
    b.setAttribute("aria-pressed",String(b.dataset.k===state.mode)));
  buildPaletteChips();
}

function buildPaletteChips(){
  const pWrap=document.getElementById("paletteChips");
  pWrap.innerHTML="";
  const src=state.mode==="scarf"?SCARF_PALETTES:state.mode==="miro"?MIRO_PALETTES:PALETTES;
  for(const [k,p] of Object.entries(src)){
    const b=document.createElement("button");
    b.className="chip";b.type="button";b.dataset.k=k;
    const sw=p.swatches.map(c=>`<i style="background:${c}"></i>`).join("");
    b.innerHTML=`<span class="sw">${sw}</span><span>${p.name}<small>${p.note}</small></span>`;
    b.addEventListener("click",()=>{
      if(state.mode==="scarf")state.scarfPalette=k;
      else if(state.mode==="miro")state.miroPalette=k;
      else state.palette=k;
      setChoice("__noop",k,pWrap);
      startGeneration();
    });
    pWrap.appendChild(b);
  }
  setChoice("__noop",
    state.mode==="scarf"?state.scarfPalette:
    state.mode==="miro"?state.miroPalette:state.palette,pWrap);
}

