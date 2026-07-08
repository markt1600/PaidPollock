/* =========================================================
   full painting generator
   ========================================================= */
function* paintPhase(seed,fmtKey,palKey,dyn,statusCb,prog){
  rnd=mulberry32(seed);
  const fmt=FORMATS[fmtKey];
  const long=LONG_EDGE;
  const W=fmt.w>=fmt.h?long:Math.round(long*fmt.w/fmt.h);
  const H=fmt.w>=fmt.h?Math.round(long*fmt.h/fmt.w):long;
  hi.width=W;hi.height=H;
  const u=Math.max(W,H)/1000;
  const ppm=Math.max(W,H)/fmt.m;      // pixels per metre of real canvas
  const pal=PALETTES[palKey]||PALETTES.convergence;

  paintGround(hctx,W,H,pal.ground);
  yield;

  const areaFactor=(W*H)/(4400*2933);
  const wet=[];                       // still-wet paint for marbling

  /* the height field starts as the canvas weave itself: thin paint will
     let it show through, heavy enamel will bury it */
  const hm=document.createElement("canvas");
  hm.width=Math.max(2,Math.ceil(W/2));
  hm.height=Math.max(2,Math.ceil(H/2));
  const hmx=hm.getContext("2d");
  hmx.fillStyle="#000";
  hmx.fillRect(0,0,hm.width,hm.height);
  hmx.globalCompositeOperation="lighter";
  const hp=Math.max(2,Math.round(1.7*u));
  hmx.fillStyle="rgba(255,255,255,0.035)";
  for(let y=0;y<hm.height;y+=hp)hmx.fillRect(0,y,hm.width,1);
  hmx.fillStyle="rgba(255,255,255,0.028)";
  for(let x=0;x<hm.width;x+=hp)hmx.fillRect(x,0,1,hm.height);
  hmx.fillStyle="rgba(255,255,255,0.07)";
  const nubs=Math.round(hm.width*hm.height*.004);
  for(let i=0;i<nubs;i++)hmx.fillRect((rnd()*hm.width)|0,(rnd()*hm.height)|0,1,1);
  hmx.setTransform(.5,0,0,.5,0,0);    // accept full-resolution coordinates
  REL=hmx; RELU=u;
  LIGHT_ANG=-2.356+R(-.3,.3);         // this painting's key light

  /* plan the whole session first so total progress is known (pacing).
     The painter circles the canvas returning to every can all session
     long: each action is stamped with a time — its layer's centre in
     the session plus a wide spread, with occasional returns to any can
     at any moment — and the plan is sorted by that clock. Broad
     tendencies survive (grounds early, accents late) but no colour
     ever arrives as a single stratum. */
  const plan=[];
  const Lcount=pal.layers.length;
  for(let li=0;li<Lcount;li++){
    const L=pal.layers[li];
    const n=Math.max(10,Math.round(L.n*DENSITY*(.82+.55*dyn)*areaFactor*R(.85,1.2)));
    const centre=(li+.5)/Lcount;
    for(let i=0;i<n;i++){
      const roll=rnd();
      const pSpray=.05+.22*dyn;
      const pWash=L.wash||0;
      const pWeb=L.web||0;
      const pSplash=L.splash?L.splash*(.5+dyn):0;
      let type="pour";
      if(roll<pSpray)type="spray";
      else if(roll<pSpray+pWash)type="wash";
      else if(roll<pSpray+pWash+pWeb)type="web";
      else if(roll<pSpray+pWash+pWeb+pSplash)type="splash";
      const t=rnd()<.12
        ?rnd()                                   // back to an old can
        :clamp(centre+(rnd()+rnd()-1)*.5,0,1);   // near its phase
      plan.push({li,L,type,t});
    }
  }
  plan.sort((a,b)=>a.t-b.t);
  prog.total=plan.reduce((t,a)=>t+(a.type==="pour"?3:(a.type==="wash"||a.type==="web")?2:1),0)
             +Math.ceil(hm.height/64)
             +3*(Math.ceil(hm.height/128)+Math.ceil(hm.width/128))+2;
  prog.done=0;

  let lastLi=-1;
  for(const act of plan){
    const L=act.L;
    if(act.li!==lastLi){lastLi=act.li;statusCb(0,0,L);}
    const [r,g,b]=jitterColor(L.c,10);
    const alpha=KINDS[L.kind].a;
    if(act.type==="spray"){
      spray(hctx,u,W,H,rgbStr(r,g,b,alpha));
      yield;
    }else if(act.type==="wash"){
      yield* wash(hctx,{W,H,u,rgb:[r,g,b],kind:L.kind,wet});
    }else if(act.type==="web"){
      yield* web(hctx,{W,H,u,rgb:[r,g,b],alpha});
    }else if(act.type==="splash"){
      const dark=hexToRgb(L.c).reduce((t,v)=>t+v,0)<360;
      splash(hctx,u,W,H,rgbStr(r,g,b,alpha),dark?null:"rgba(70,52,28,0.09)");
      yield;
    }else{
      yield* pour(hctx,{W,H,u,kind:L.kind,rgb:[r,g,b],alpha,dyn,ppm,wet,metal:!!L.metal});
    }
    prog.done+=act.type==="pour"?3:(act.type==="wash"||act.type==="web")?2:1;
  }
  return {hm,W,H,u,ppm,wet,pal,dyn};
}

function* varnishPhase(C,statusCb,prog){
  statusCb(0,0,null);                 // varnishing
  yield* finishRelief(hctx,C.hm,C.W,C.H,C.u,prog);
  REL=null;
}

/* one director round: a short list of targeted touch-ups, painted with
   the same marks, the same physics, the same continuing random stream —
   so a recorded round replays pixel-identically without the API. */
function* directorRound(C,acts,prog){
  prog.total+=acts.length*2;
  for(const a of acts){
    const L=C.pal.layers[clamp(a.layer|0,0,C.pal.layers.length-1)];
    const rgb0=hexToRgb(L.c);
    const r=clamp(rgb0[0]+R(-12,12),0,255),
          g=clamp(rgb0[1]+R(-12,12),0,255),
          b=clamp(rgb0[2]+R(-12,12),0,255);
    const cx=clamp(+a.x||.5,0,1)*C.W, cy=clamp(+a.y||.5,0,1)*C.H;
    const cr=clamp(+a.r||.2,.05,.6)*Math.max(C.W,C.H);
    if(a.type==="wash")
      yield* wash(hctx,{W:C.W,H:C.H,u:C.u,rgb:[r,g,b],kind:L.kind,wet:C.wet,_cx:cx,_cy:cy});
    else if(a.type==="web")
      yield* web(hctx,{W:C.W,H:C.H,u:C.u,rgb:[r,g,b],alpha:1,_cx:cx,_cy:cy,_cr:cr});
    else if(a.type==="splash"){
      splash(hctx,C.u,C.W,C.H,rgbStr(r,g,b,1),null,cx,cy);
      yield;
    }else
      yield* pour(hctx,{W:C.W,H:C.H,u:C.u,kind:L.kind,rgb:[r,g,b],alpha:1,
                        dyn:C.dyn,ppm:C.ppm,wet:C.wet,metal:!!L.metal,_cx:cx,_cy:cy});
    prog.done+=2;
    yield;
  }
}

/* the whole painting in one generator — used by rehang, tests and the
   non-AI path. Recorded director rounds replay here deterministically. */
function* generate(seed,fmtKey,palKey,dyn,statusCb,prog={},directives){
  if(prog.total===undefined){prog.total=1;prog.done=0;}
  const C=yield* paintPhase(seed,fmtKey,palKey,dyn,statusCb,prog);
  if(directives&&directives.length)
    for(const round of directives)yield* directorRound(C,round,prog);
  yield* varnishPhase(C,statusCb,prog);
}

