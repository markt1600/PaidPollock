
/* =========================================================
   the AI art director — Claude looks, judges, commissions
   ========================================================= */
let aiAvailable=true;   // flips off for the session on the first failure

function snapshotForAI(){
  const L2=768, ar=hi.width/hi.height;
  const t=document.createElement("canvas");
  t.width=ar>=1?L2:Math.round(L2*ar);
  t.height=ar>=1?Math.round(L2/ar):L2;
  const c=t.getContext("2d");
  c.imageSmoothingQuality="high";
  c.drawImage(hi,0,0,t.width,t.height);
  return t.toDataURL("image/jpeg",.78).split(",")[1];
}

/* two routes to Claude: the artifact host answers api.anthropic.com
   directly (no key); elsewhere the bundled /api/director proxy carries
   the request with the server-side key. First success is remembered. */
let AI_ROUTE=null;   // "direct" | "proxy"
let AI_MODEL=null;   // remembered after the first success
const AI_MODELS=["claude-sonnet-4-6","claude-sonnet-4-5-20250929","claude-sonnet-4-20250514"];
async function askClaude(content,maxTokens){
  const routes=AI_ROUTE?[AI_ROUTE]:["direct","proxy"];
  let lastErr=new Error("ai unavailable");
  for(const route of routes){
    /* the proxy pins and falls back across models server-side, so it
       needs one attempt; the direct route walks the list itself */
    const models=route==="proxy"?[AI_MODELS[0]]
                :AI_MODEL?[AI_MODEL]:AI_MODELS;
    for(const model of models){
      try{
        const r=await fetch(
          route==="direct"?"https://api.anthropic.com/v1/messages":"/api/director",
          {method:"POST",headers:{"Content-Type":"application/json"},
           body:JSON.stringify({model,max_tokens:maxTokens,messages:[{role:"user",content}]})});
        if(!r.ok)throw new Error(route+" "+r.status);
        const data=await r.json();
        AI_ROUTE=route; AI_MODEL=model;
        return (data.content||[]).map(b=>b.type==="text"?b.text:"").join("");
      }catch(e){lastErr=e;}
    }
  }
  throw lastErr;
}

/* the director steps back, looks, and either approves or commissions
   up to five targeted touch-ups — judging balance AND realism */
async function askDirector(pal,round,prevNote){
  if(state.mode==="miro"){
    const marks=pal.marks.join(", ");
    const txtM=`You are Joan Miró's inner eye in 1949, examining a dream painting in progress (image attached). Judge: (1) poetic balance — the rhythm of floating forms, breathing space, dead or crowded zones; (2) whether it reads as hand-painted — lines that wander with intent, forms that float rather than sit. Reply with ONLY minified JSON, no prose, no fences:
{"satisfied":true|false,"note":"<=110 chars","actions":[{"type":"star"|"disc"|"blob"|"moon"|"line"|"dots","x":<0-1>,"y":<0-1>,"r":<0.02-0.15>,"color":"red"|"blue"|"yellow"|"green"|"black"|"white"}]}
Up to 4 actions placed where the composition wants them. Available mark colours: ${marks}, black, white. Use satisfied:true with empty actions when the dream is complete. Round ${round+1} of 2.${prevNote?" Your previous note: "+prevNote:""}`;
    const outM=await askClaude([
      {type:"image",source:{type:"base64",media_type:"image/jpeg",data:snapshotForAI()}},
      {type:"text",text:txtM}
    ],600);
    return parseLooseJSON(outM);
  }
  const layers=pal.layers.map((L,i)=>`${i}:${L.c} ${L.kind}${L.metal?" aluminium":""}`).join("; ");
  const txt=`You are the inner critic of a drip painter in 1952, examining a work in progress (image attached). Judge two things: (1) all-over compositional balance — sparse corners, colour clumping, dead zones; (2) realism — anything reading as computer-generated rather than photographed paint (too-regular marks, missing splatter, unconvincing density).
Reply with ONLY minified JSON, no prose, no code fences:
{"satisfied":true|false,"note":"<=110 chars on what you'd change","actions":[{"type":"pour"|"wash"|"web"|"splash","layer":<int>,"x":<0-1>,"y":<0-1>,"r":<0.05-0.5>}]}
Up to 5 actions aimed at the weak regions (x,y = centre of the region, r = its reach as a fraction of the canvas). Use satisfied:true with empty actions when the work needs nothing more. Palette layers: ${layers}. Round ${round+1} of 3.${prevNote?" Your previous note: "+prevNote:""}`;
  const out=await askClaude([
    {type:"image",source:{type:"base64",media_type:"image/jpeg",data:snapshotForAI()}},
    {type:"text",text:txt}
  ],700);
  const v=parseLooseJSON(out);
  const acts=Array.isArray(v.actions)?v.actions.slice(0,5).map(a=>({
    type:["pour","wash","web","splash"].includes(a.type)?a.type:"pour",
    layer:Math.max(0,a.layer|0),
    x:clamp(+a.x||.5,0,1), y:clamp(+a.y||.5,0,1),
    r:clamp(+a.r||.2,.05,.5)
  })):[];
  return {satisfied:!!v.satisfied,note:String(v.note||"").slice(0,140),actions:acts};
}

/* a forgiving JSON reader: language models sometimes run out of breath
   mid-array — trim back to the last complete value and close the
   brackets that remain open */
function parseLooseJSON(raw){
  let str=raw.replace(/```json|```/g,"").trim();
  const a=str.indexOf("{");
  if(a>0)str=str.slice(a);
  str=str.replace(/:\s*\./g,":0.")          // tolerate .5 for 0.5
       .replace(/:\s*-\./g,":-0.")          // and -.25 for -0.25
       .replace(/,\s*([}\]])/g,"$1");       // and trailing commas
  try{return JSON.parse(str);}catch(e){}
  for(let attempt=0;attempt<3;attempt++){
    const cut=Math.max(str.lastIndexOf("}"),str.lastIndexOf("]"));
    if(cut<0)break;
    str=str.slice(0,cut+1);
    /* close whatever is still open, ignoring brackets inside strings */
    let inStr=false, esc2=false; const stack=[];
    for(const ch of str){
      if(esc2){esc2=false;continue;}
      if(ch==="\\"){esc2=true;continue;}
      if(ch==='"'){inStr=!inStr;continue;}
      if(inStr)continue;
      if(ch==="{"||ch==="[")stack.push(ch);
      else if(ch==="}"||ch==="]")stack.pop();
    }
    const closed=str+stack.reverse().map(c=>c==="{"?"}":"]").join("");
    try{return JSON.parse(closed);}catch(e){}
    str=str.slice(0,-1);
  }
  throw new Error("unparseable design");
}

/* the Basquiat director: it looks at the finished canvas and sets ONLY the
   colour scheme and the hand-coloured background fields — never the mask,
   the geometry or the words. It picks from named house colours. */
async function askBasquiatDirector(){
  const colours="red, yellow, blue, green, ochre, teal, gold, oxblood";
  const txt=`You are a contemporary curator-director shaping a Basquiat-style canvas already drawn (image attached). The dense hand-lettered words, the crowned skull and all the marks are FIXED \u2014 you never change, move or add words or figures. You decide only the COLOUR SCHEME and the hand-coloured BACKGROUND FIELDS behind the text. Read the canvas for a through-line, then reply with ONLY minified JSON, no prose, no code fences:
{"concept":"<=70 chars: the idea you read","dominant":"<colour>","accent":"<colour>","restraint":<0-1>,"regions":[{"x":<0-1>,"y":<0-1>,"w":<0.1-0.6>,"h":<0.1-0.5>,"color":"<colour>","style":"scribble"|"pencil"}]}
Choose dominant and accent from: ${colours}. restraint = how strictly to suppress other accents (1 = two colours only). Place 1 to 3 fields where the composition wants colour and weight (x,y = top-left as fractions). Keep it muted and disciplined: oilstick on paper, never neon.`;
  const out=await askClaude([
    {type:"image",source:{type:"base64",media_type:"image/jpeg",data:snapshotForAI()}},
    {type:"text",text:txt}
  ],500);
  return sanitizeBqDirectives(parseLooseJSON(out));
}
function sanitizeBqDirectives(v){
  const NAMES=["red","yellow","blue","green","ochre","teal","gold","oxblood"];
  const nm=(c,d)=>NAMES.includes(c)?c:d;
  const regions=Array.isArray(v.regions)?v.regions.slice(0,4).map(r=>({
    x:clamp(+(r&&r.x)||0,0,.95), y:clamp(+(r&&r.y)||0,0,.95),
    w:clamp(+(r&&r.w)||.25,.08,.6), h:clamp(+(r&&r.h)||.2,.08,.5),
    color:nm(r&&r.color,"blue"), style:(r&&r.style)==="pencil"?"pencil":"scribble"
  })):[];
  return { concept:String(v.concept||"").slice(0,90),
    dominant:nm(v.dominant,"red"), accent:nm(v.accent,"blue"),
    restraint:clamp(+v.restraint,0,1)||.6, regions };
}

/* the illustrator: Claude composes a figurative centrepiece as strokes,
   and the atelier embroiders whatever it draws */
function sanitizeDesign(v){
  if(!v||typeof v!=="object")return null;
  const cl=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
  const out={subject:String(v.subject||"").slice(0,48),mirror:!!v.mirror};
  if(v.composition==="garden"||v.composition==="medallion")out.composition=v.composition;
  if(v.density!==undefined)out.density=cl(v.density,0,1);
  if(Array.isArray(v.accents)){
    const acc=v.accents.slice(0,4)
      .filter(a=>a&&typeof a==="object")
      .map(a=>({x:cl(a.x,.05,.95),y:cl(a.y,.05,.95),r:cl(a.r,.05,.25)}));
    if(acc.length)out.accents=acc;
  }
  const readStrokes=(arr,cap)=>{
    const strokes=[];
    if(!Array.isArray(arr))return strokes;
    for(const st of arr.slice(0,cap)){
      if(!st||typeof st!=="object")continue;
      const c=Math.min(3,Math.max(0,st.c|0));
      const w=cl(st.w,1,3);
      if(st.t==="line"&&Array.isArray(st.pts)){
        const pts=st.pts.slice(0,32)
          .filter(p=>Array.isArray(p)&&p.length>=2)
          .map(p=>[cl(p[0],-1,1),cl(p[1],-1,1)]);
        if(pts.length>1)strokes.push({t:"line",c,w,pts});
      }else if(st.t==="arc"){
        strokes.push({t:"arc",c,w,x:cl(st.x,-1,1),y:cl(st.y,-1,1),
          rx:cl(st.rx,.01,1),ry:cl(st.ry,.01,1),
          a0:cl(st.a0,-360,360),a1:cl(st.a1,-360,360),rot:cl(st.rot,-360,360)});
      }else if(st.t==="satin"){
        strokes.push({t:"satin",c,x:cl(st.x,-1,1),y:cl(st.y,-1,1),
          ang:cl(st.ang,-360,360),len:cl(st.len,.02,.7),wid:cl(st.wid,.01,.4)});
      }else if(st.t==="knot"){
        strokes.push({t:"knot",c,x:cl(st.x,-1,1),y:cl(st.y,-1,1),r:cl(st.r,.005,.08)});
      }
    }
    return strokes;
  };
  const sat=readStrokes(v.satellite,36);
  if(sat.length)out.satellite=sat;
  if(!Array.isArray(v.strokes)){
    return (out.composition||out.accents||out.satellite)?out:null;
  }
  const strokes=[];
  for(const st of v.strokes.slice(0,140)){
    if(!st||typeof st!=="object")continue;
    const c=Math.min(3,Math.max(0,st.c|0));
    const w=cl(st.w,1,3);
    if(st.t==="line"&&Array.isArray(st.pts)){
      const pts=st.pts.slice(0,32)
        .filter(p=>Array.isArray(p)&&p.length>=2)
        .map(p=>[cl(p[0],-1,1),cl(p[1],-1,1)]);
      if(pts.length>1)strokes.push({t:"line",c,w,pts});
    }else if(st.t==="arc"){
      strokes.push({t:"arc",c,w,x:cl(st.x,-1,1),y:cl(st.y,-1,1),
        rx:cl(st.rx,.01,1),ry:cl(st.ry,.01,1),
        a0:cl(st.a0,-360,360),a1:cl(st.a1,-360,360),rot:cl(st.rot,-360,360)});
    }else if(st.t==="satin"){
      strokes.push({t:"satin",c,x:cl(st.x,-1,1),y:cl(st.y,-1,1),
        ang:cl(st.ang,-360,360),len:cl(st.len,.02,.7),wid:cl(st.wid,.01,.4)});
    }else if(st.t==="knot"){
      strokes.push({t:"knot",c,x:cl(st.x,-1,1),y:cl(st.y,-1,1),r:cl(st.r,.005,.08)});
    }
  }
  if(strokes.length)out.strokes=strokes;
  if(!out.strokes&&!out.composition&&!out.accents&&!out.satellite)return null;
  return out;
}

const ILLUSTRATOR_THEMES={
  chaine:"a nautical subject — a square-rigged ship, a compass rose, a knotted anchor and rope",
  cavalcade:"an equestrian subject — a rearing or galloping horse in profile, a carriage, a mounted rider",
  jardin:"a botanical subject — a bird among flowering branches, a butterfly over a bouquet, a fruit-laden bough"
};
async function askIllustrator(palKey,motifKey){
  const pal=SCARF_PALETTES[palKey]||SCARF_PALETTES.flamme;
  const threads=[pal.gold,...pal.threads].map((c,i)=>i+"="+c).join(" ");
  const txt=`You are the head designer of a great French maison, composing a hand-embroidered silk carré. First choose the composition:
"garden" — an all-over botanical jungle (layered fronds, palms, flower bursts), balanced but asymmetric, like the maison's famous garden scarves. You place the colour story: give "accents": up to 3 regions {"x","y","r"} in unit coordinates of the full square (0,0 top-left) where accent-coloured flower bursts cluster, and a "density" 0..1. No strokes needed.
"medallion" — the classic architecture (border, rings, ornaments) with YOUR illustrated centrepiece as strokes, and optionally a "satellite": a second, smaller stroke group (its own [-1,1] space, up to 30 strokes) repeated four times around the field like companion scenes — the great equestrian carrés surround the centre this way.
Reply with ONLY minified JSON, no prose, no fences:
{"subject":"<=40 chars","composition":"garden"|"medallion","density":0-1,"accents":[...],"mirror":true|false,"strokes":[...]}
For a medallion centrepiece, the stroke field is a circle: coordinates x,y in [-1,1], centre 0,0, keep within radius 0.92.`+` Theme: ${ILLUSTRATOR_THEMES[motifKey]||ILLUSTRATOR_THEMES.chaine}.`;
  const txt2=` Make it stylised single-subject embroidery, recognisable in silhouette, generous in scale (fill most of the circle).
Threads (index=colour): ${threads}. 0 is gold — use it for highlights and details.
Stroke types:
{"t":"line","c":0-3,"w":1-3,"pts":[[x,y],...]} — a stitched polyline, up to 24 points; use many points for smooth curves; this is your main outline tool.
{"t":"arc","c":0-3,"w":1-3,"x":..,"y":..,"rx":..,"ry":..,"a0":deg,"a1":deg,"rot":deg} — a stitched elliptical arc.
{"t":"satin","c":0-3,"x":..,"y":..,"ang":deg,"len":..,"wid":..} — a filled satin-stitch leaf/petal/patch from (x,y) along ang.
{"t":"knot","c":0-3,"x":..,"y":..,"r":..} — a french knot (eyes, studs, buds).
CALM AND FLOWING above all: a carré is a thing of serenity. Build the subject from a FEW LONG CONTINUOUS curves — each line stroke one graceful path of 10–28 points tracing a gentle arc (no zigzags, no sharp corners; the atelier smooths every polyline into a single unbroken thread). Every stroke must touch or overlap the main silhouette so the design reads as ONE connected figure — never a scatter of floating fragments. Satin patches stay small (len<=0.3) and lie along the silhouette like feathers or petals, never as large slabs and never adrift. Use 30–70 well-joined strokes for a richly worked but tranquil subject (a full-rigged ship, a standing horse with bridle, a composed bouquet), plus up to 24 for the satellite group, in the same connected manner. If the subject is left-right symmetric, set mirror:true and draw ONLY the right half (x>=0) plus the centreline. Compose with care: clean overlapping outlines, satin masses for body/foliage, knots for detail.`;
  const out=await askClaude([{type:"text",text:txt+txt2}],4800);
  return sanitizeDesign(parseLooseJSON(out));
}

/* a sanitiser for the draughtsman's drawing: a monochrome subset of the
   carré's stroke schema, capped to a drawing's economy */
function sanitizeDrawing(v){
  if(!v||typeof v!=="object")return null;
  const cl=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
  const out={subject:String(v.subject||"").slice(0,48),mirror:!!v.mirror};
  const strokes=[];
  for(const st of (Array.isArray(v.strokes)?v.strokes:[]).slice(0,48)){
    if(!st||typeof st!=="object")continue;
    const w=cl(st.w,1,3);
    if(st.t==="line"&&Array.isArray(st.pts)){
      const pts=st.pts.slice(0,32)
        .filter(p=>Array.isArray(p)&&p.length>=2)
        .map(p=>[cl(p[0],-1,1),cl(p[1],-1,1)]);
      if(pts.length>1)strokes.push({t:"line",c:0,w,pts});
    }else if(st.t==="arc"){
      strokes.push({t:"arc",c:0,w,x:cl(st.x,-1,1),y:cl(st.y,-1,1),
        rx:cl(st.rx,.01,1),ry:cl(st.ry,.01,1),
        a0:cl(st.a0,-360,360),a1:cl(st.a1,-360,360),rot:cl(st.rot,-360,360)});
    }else if(st.t==="knot"){
      strokes.push({t:"knot",c:0,x:cl(st.x,-1,1),y:cl(st.y,-1,1),r:cl(st.r,.005,.06)});
    }
  }
  if(!strokes.length)return null;
  out.strokes=strokes;
  return out;
}

const DRAUGHTSMAN_THEMES={
  fleurs:"a vase of flowers — a few stems fanning into blossoms of FAT ROUNDED LOBES: each petal one flowing loop that swells out from the bloom's heart, around a broad tip, and home again (NEVER a pointed arc, NEVER a spike, NEVER a star-burst or radiating spokes; every line rounded and connected, as Matisse drew apricot blossoms), plus a loose rose spiral or a closed bud, one broad lobed leaf with a midrib, the vase closed by its own small base curve; NO table line, NO ground line, NO solid or filled shapes — outlines only"
};
async function askDraughtsman(subjKey){
  const txt=`You are a master draughtsman in the school of Matisse, composing a LINE DRAWING in pen and Indian ink on a single sheet. Subject: ${DRAUGHTSMAN_THEMES[subjKey]||DRAUGHTSMAN_THEMES.fleurs}.
ECONOMY ABOVE ALL: the drawing lives or dies by how few, how long, and how confident its lines are. Build the whole subject from 10–28 strokes, each line ONE long continuous curve of 8–24 points tracing a graceful arc (the atelier smooths every polyline into a single unbroken stroke). Let one line do two jobs where it can — a stem that runs on into a leaf's midrib, a contour that closes the vase. NO hatching, NO shading, NO scribble, NO double-tracing, NO filled or solid shapes, nothing drawn twice. Every stroke must belong to the one drawing — never a scatter of fragments. Leave generous breathing space around the subject.
Reply with ONLY minified JSON, no prose, no fences:
{"subject":"<=40 chars","mirror":true|false,"strokes":[...]}
Stroke types (all drawn in the same ink, ALL as open line work — nothing is filled):
{"t":"line","w":1-3,"pts":[[x,y],...]} — your main tool; w is nib pressure.
{"t":"arc","w":1-3,"x":..,"y":..,"rx":..,"ry":..,"a0":deg,"a1":deg,"rot":deg} — an elliptical arc.
{"t":"knot","x":..,"y":..,"r":..} — a small ink dot (a bloom's centre, a bud).
Coordinates x,y in [-1,1], centre 0,0, x to the right, y DOWN; keep the drawing within ±0.85. If the subject is left-right symmetric you may set mirror:true and draw only the right half (x>=0) plus the centreline — otherwise mirror:false.`;
  const out=await askClaude([{type:"text",text:txt}],3600);
  return sanitizeDrawing(parseLooseJSON(out));
}

/* the ink master: the geometry is the house's; Claude may only change
   how each stroke is INKED — the weight of the hand, the load of the
   dip, how fast the line dries */
function sanitizeTouches(v,maxI){
  if(!v||typeof v!=="object")return null;
  const cl=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
  const seen={},touches=[];
  for(const t of (Array.isArray(v.touches)?v.touches:[]).slice(0,16)){
    if(!t||typeof t!=="object")continue;
    const i=t.i|0;
    if(i<0||i>=maxI||seen[i])continue;
    seen[i]=1;
    const o={i};
    if(t.press!==undefined)o.press=cl(t.press,.6,1.5);
    if(t.dip!==undefined)o.dip=cl(t.dip,.5,1.6);
    if(t.drain!==undefined)o.drain=cl(t.drain,.3,2.4);
    if(o.press!==undefined||o.dip!==undefined||o.drain!==undefined)touches.push(o);
  }
  if(!touches.length)return null;
  return {note:String(v.note||"").slice(0,140),touches};
}
async function askInkMaster(strokes){
  const list=strokes.map((L,i)=>i+": "+L).join("; ");
  const txt=`You are the master's own hand, judging how a finished line drawing in the school of Matisse has been INKED (image attached). The geometry is fixed and may not change — you may only re-ink chosen strokes. These sheets live by contrast: a contour loaded dark in one passage and starving dry in another, a bloom's lobes pressed with conviction while a stem runs light, nothing uniform. Judge the sheet: where is the hand too timid, too even, too heavy?
The strokes, by index: ${list}.
Reply with ONLY minified JSON, no prose, no fences:
{"note":"<=110 chars","touches":[{"i":<index>,"press":0.6-1.5,"dip":0.5-1.6,"drain":0.3-2.4}]}
press = the weight of the hand (1 as drawn); dip = how loaded the brush is when the stroke begins; drain = how fast it dries and fades along its length. Re-ink only the strokes worth changing (up to 8); omit any field you would leave alone; reply {"note":"…","touches":[]} if the inking already sings.`;
  const out=await askClaude([
    {type:"image",source:{type:"base64",media_type:"image/jpeg",data:snapshotForAI()}},
    {type:"text",text:txt}
  ],500);
  return sanitizeTouches(parseLooseJSON(out),strokes.length);
}

/* the curator writes the wall label for the finished work */
async function askStory(title){
  const txt=state.mode==="scarf"
    ?`In one or two short sentences (under 35 words total), give the central meaning of this hand-embroidered silk carré titled "${title}", in the voice of a great French maison. Grounded in what is visible. No preamble — the sentences only.`
    :state.mode==="matisse"
    ?`In one or two short sentences (under 35 words total), give the central meaning of this line drawing titled "${title}", in the voice of a curator of modern French drawing — on the economy of its line. Grounded in what is visible. No preamble — the sentences only.`
    :state.mode==="keita"
    ?`In one or two short sentences (under 35 words total), give the central meaning of this nocturne of the Tokyo night titled "${title}" — one glowing machine against the dark, a city asleep — in the voice of a quiet contemporary curator. Grounded in what is visible. No preamble — the sentences only.`
    :state.mode==="miro"
    ?`In one or two short sentences (under 35 words total), give the central meaning of this surrealist dream painting titled "${title}", in the voice of a poetic mid-century curator of Miró. Grounded in what is visible. No preamble — the sentences only.`
    :state.mode==="basquiat"
    ?`In one or two short sentences (under 35 words total), give the central meaning of this teeming oilstick-and-crayon canvas titled "${title}" — a crowned skull amid hand-lettered words, diagrams and crossed-out text — in the voice of a contemporary curator of Neo-Expressionism. Grounded in what is visible. No preamble — the sentences only.`
    :`In one or two short sentences (under 35 words total), give the central meaning of this drip painting titled "${title}", in the voice of a 1950s abstract-expressionism curator. Grounded in what is visible. No preamble — the sentences only.`;
  const out=await askClaude([
    {type:"image",source:{type:"base64",media_type:"image/jpeg",data:snapshotForAI()}},
    {type:"text",text:txt}
  ],130);
  return out.trim().slice(0,320);
}

/* a single bad reply shouldn't switch the studio's AI off for good:
   only structural failures (no key, bad key, missing endpoint config)
   latch the session; everything else retries on the next commission */
function aiHardFail(e){
  return /\b(401|403|503)\b/.test(String((e&&e.message)||""));
}

function setAIThinking(on){
  const w=document.getElementById("framewrap");
  if(w)w.classList.toggle("ai-thinking",!!on);
}

function setStory(text){
  const el=document.getElementById("story");
  el.hidden=!text;
  el.textContent=text||"";
  layoutView();
}

