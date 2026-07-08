/* ===== MATISSE WING START ===== */
/* =========================================================
   the drawing wing — line drawings in the manner of Henri Matisse
   ========================================================= */
const MATISSE_SUBJECTS={
  visage:{name:"Faces",  note:"the late mask drawings"},
  fleurs:{name:"Flowers",note:"vase, fronds & blooms"}
};
const MATISSE_DIMS={square:"48 × 48 cm",classic:"56 × 42 cm",pano:"76 × 33 cm",portrait:"42 × 63 cm"};
const MATISSE_TITLES={
  visage:["Grand visage","Visage","Tête de femme","Masque","Étude de visage"],
  fleurs:["Fleurs","Bouquet au vase","Anémones","Vase de fleurs","Feuillage"]
};
const MATISSE_MEDIA={
  ink:   {medium:"Pen and Indian ink on wove paper"},
  brush: {medium:"Brush and Indian ink on wove paper"},
  crayon:{medium:"Crayon on wove paper"}
};
/* the medium is rolled per sheet, deterministically from the seed, so the
   placard (set before the first stroke) and the drawing always agree */
function matisseMediumFor(seed,subj){
  if(subj==="visage")return "brush";   /* the masks are brush drawings  */
  const r=mulberry32((seed^0x51ed)>>>0)();
  return r<.6?"ink":r<.84?"brush":"crayon";
}

/* the tool in hand on the current sheet */
let MAT_MED="ink", MAT_INK="#211b14", MAT_U=1;

/* sample a smooth polyline at a fixed step, with arc-length positions */
function mResample(pts,step){
  const out=[],L=[];let total=0;
  for(let i=1;i<pts.length;i++)total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  if(total<1)return {pts:pts.slice(),along:[0],total:0};
  let run=0,need=0;
  out.push(pts[0].slice());L.push(0);
  for(let i=1;i<pts.length;i++){
    const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
    const d=Math.hypot(x2-x1,y2-y1);
    if(d<1e-6)continue;
    while(need+step<=run+d){
      need+=step;
      const t=(need-run)/d;
      out.push([x1+(x2-x1)*t,y1+(y2-y1)*t]);
      L.push(need/total);
    }
    run+=d;
  }
  out.push(pts[pts.length-1].slice());L.push(1);
  return {pts:out,along:L,total};
}

/* ONE CONFIDENT LINE — the heart of the wing. The raw control points are
   corner-cut into a single flowing curve; the nib's pressure breathes
   slowly along it; the hand trembles barely at all (Matisse's economy is
   confidence); pen lines bite a little harder where the stroke begins. */
function mline(ctx,raw,w0,opt){
  opt=opt||{};
  const u=MAT_U;
  let pts=chaikin(raw.map(p=>[p[0],p[1]]),3);
  if(MAT_MED==="crayon"&&!opt.forcePen){
    /* crayon in the manner of the late charcoal nudes: the pressure
       fades along the stroke, the hand lifts and leaves small gaps,
       long lines end as a whisper */
    const rc=mResample(pts,Math.max(1.4*u,w0*.28));
    if(!rc.total)return;
    const ga=ctx.globalAlpha;
    ctx.fillStyle=MAT_INK;
    const dip=R(.95,1.25)*(opt.dip||1);
    const drain=clamp(clamp(rc.total/(950*u),.12,1.0)*R(.7,1.3)*(opt.drain||1),.04,2.6);
    const w1=Math.max(2.4*u,w0*1.15)*(opt.press||1);
    let gapUntil=-1;
    for(let i=0;i<rc.pts.length;i++){
      const a=rc.along[i];
      const ld=Math.max(.12,dip-a*drain);
      if(a>gapUntil&&rnd()<.018)gapUntil=a+R(.012,.05);   /* the hand lifts */
      if(a<gapUntil)continue;
      let press=Math.min(1,.5+ld*.7);
      if(a<.04)press*=.6+.4*(a/.04);                      /* a soft start  */
      const k=3+((rnd()*3)|0);
      for(let g=0;g<k;g++){
        ctx.globalAlpha=ga*R(.22,.62)*press;
        stamp(ctx,rc.pts[i][0]+R(-.55,.55)*w1,rc.pts[i][1]+R(-.55,.55)*w1,w1*R(.12,.3));
      }
    }
    ctx.globalAlpha=ga;
    return;
  }
  const brush=MAT_MED==="brush"&&!opt.forcePen;
  const W0=(brush?w0*2.1:w0)*(opt.press||1);
  const r=mResample(pts,Math.max(.9*u,W0*.3));
  if(!r.total)return;
  const P=r.pts,A=r.along,n=P.length;
  /* unit normals along the path — the stroke is a continuous RIBBON of
     ink, never a chain of stamps */
  const NX=new Array(n),NY=new Array(n);
  for(let i=0;i<n;i++){
    const p2=P[Math.min(n-1,i+1)],p1=P[Math.max(0,i-1)];
    const dx=p2[0]-p1[0],dy=p2[1]-p1[1];
    const d=Math.hypot(dx,dy)||1;
    NX[i]=-dy/d;NY[i]=dx/d;
  }
  const ph1=R(0,6.28),ph2=R(0,6.28),amp=brush?.17:.11;
  const f1=R(2.2,3.6),f2=R(5,8);
  /* the dip of ink: a loaded start that drains with the physical length
     of the stroke. The ink master may reload the brush (dip) or hurry
     its drying (drain). */
  const dip=R(1.0,1.3)*(opt.dip||1);
  const drain=clamp(clamp(r.total/((brush?620:1500)*u),.1,brush?1.15:.85)
               *R(.7,1.3)*(opt.drain||1),.04,2.6);
  const taper=opt.taper===undefined?"both":opt.taper;
  /* the line is a continuous ribbon in three nested plies — a soft full
     width, a denser middle, a near-black spine — drawn ALWAYS, their ink
     fading smoothly and a little unevenly as the brush drains. Nothing
     gates on or off: an analogue fade has no edges. The dry passages are
     carried instead by a bank of fine hairline BRISTLES, each wandering
     inside the ribbon with its own slow breathing envelope. */
  const plies=[
    {wf:1,  al:.5, wp:R(0,6.28),gf:R(55,120),gp:R(0,6.28),g2:R(0,6.28)},
    {wf:.8, al:.8, wp:R(0,6.28),gf:R(55,120),gp:R(0,6.28),g2:R(0,6.28)},
    {wf:.55,al:.95,wp:R(0,6.28),gf:R(55,120),gp:R(0,6.28),g2:R(0,6.28)}
  ];
  const bn1=R(7,12),bp1=R(0,6.28),bn2=R(19,31),bp2=R(0,6.28);
  const NB=brush?30:18;
  const bristles=[];
  for(let k2=0;k2<NB;k2++){
    const off=R(-.46,.46);
    bristles.push({off,wA:R(.5,2.2),alB:(brush?R(.6,1.1):R(.45,.85)),
      f1:R(1.6,4.5),p1:R(0,6.28),f2:R(9,24),p2:R(0,6.28),
      hf:R(40,110),hp:R(0,6.28),
      fo:R(3,8),po:R(0,6.28),edge:Math.abs(off)>.34});
  }
  /* fine bristle texture belongs to the great sweeps — a short mark is
     one press of the brush */
  const longStroke=r.total>800*u;
  /* the base width at every sample — the ribbon's edges must be shared
     EXACTLY between neighbouring segments, or the line staircases */
  const WS=new Array(n);
  for(let i=0;i<n;i++){
    const a=A[i];
    const ld=Math.max(0,dip-a*drain);
    let w=W0*(1+amp*Math.sin(a*f1*6.28+ph1)+(brush?.07:.04)*Math.sin(a*f2*6.28+ph2));
    w*=.62+.38*Math.min(1,ld);                   /* a drying line thins   */
    if(a<.05&&ld>.8)w*=1.1;                      /* the loaded touch-down */
    if(taper==="both"||taper==="start")
      if(a<.06)w*=.45+.55*Math.pow(a/.06,.7);
    if(taper==="both"||taper==="end")
      if(a>.93)w*=.3+.7*Math.pow((1-a)/.07,.8);
    WS[i]=w;
  }
  /* a ply's or bristle's edge at a given sample, identical from either side */
  const edge=(off,wfh,i,sign)=>{
    return [P[i][0]+NX[i]*(off+sign*wfh),P[i][1]+NY[i]*(off+sign*wfh)];
  };
  const quad=(i,off0,wh0,off1,wh1)=>{
    const e0=edge(off0,wh0,i,1),e1=edge(off1,wh1,i+1,1),
          e2=edge(off1,wh1,i+1,-1),e3=edge(off0,wh0,i,-1);
    ctx.beginPath();
    ctx.moveTo(e0[0],e0[1]);ctx.lineTo(e1[0],e1[1]);
    ctx.lineTo(e2[0],e2[1]);ctx.lineTo(e3[0],e3[1]);
    ctx.closePath();ctx.fill();
  };
  ctx.fillStyle=MAT_INK;
  const ga0=ctx.globalAlpha;
  const aph=R(0,6.28),aph2=R(0,6.28);
  const plyW=(L,i)=>{
    const a=A[i],w=WS[i];
    return L.wf*w*.5*(.95+.05*Math.sin(a*13+L.wp));
  };
  const brOff=(b2,i)=>{
    const a=A[i],w=WS[i];
    return (b2.off+.04*Math.sin(a*b2.fo+b2.po))*w;
  };
  /* per-segment quads share their edge coordinates EXACTLY, so the only
     joins are hairline anti-aliasing seams — invisible at any honest
     viewing scale; nothing is gated, nothing steps */
  const paleAt=ld=>1-Math.min(1,ld+.08);        /* how starved the ink looks */
  let capDone=false,lastW=0,lastI=0;
  for(let i=0;i<n-1;i++){
    const a=(A[i]+A[i+1])/2;
    const ld=Math.max(0,dip-a*drain);
    const wet=Math.min(1,ld/.6);
    if(Math.max(WS[i],WS[i+1])<.3*u)continue;
    const breath=.92+.08*Math.sin(a*17+aph)*Math.sin(a*5.3+aph2);
    const fade=.09+.91*Math.min(1,ld+.1);
    const cloud=.5+.5*Math.sin(a*bn1+bp1)*Math.sin(a*bn2+bp2);
    const pale=paleAt(ld);
    /* the drying body recedes unevenly — the bristles inherit the
       passage it abandons */
    const body=1-pale*(.6+.4*(1-cloud));
    for(const L of plies){
      /* the grain deepens exactly as the ink pales — wet ink lies flat */
      const grain=1-pale*(.3+.3*Math.sin(a*L.gf+L.gp)*Math.sin(a*L.gf*2.3+L.g2));
      const al=L.al*fade*breath*body*grain;
      if(al<.015)continue;
      ctx.globalAlpha=ga0*Math.min(1,al);
      quad(i,0,plyW(L,i),0,plyW(L,i+1));
    }
    if(longStroke){
      const pale=paleAt(ld);
      for(const b2 of bristles){
        let env=Math.sin(a*b2.f1+b2.p1)*Math.sin(a*b2.f2+b2.p2);
        env=env>0?Math.pow(env,.9):0;            /* smooth humps, no cuts */
        const sparkle=.6+.4*Math.sin(a*b2.hf+b2.hp);
        const want=Math.min(1,pale*1.9)+(b2.edge?.2*wet:0);
        const al=Math.min(1,b2.alB*want*env*sparkle*(.55+.45*Math.min(1,ld+.2)));
        if(al<.012)continue;
        ctx.globalAlpha=ga0*Math.min(1,al);
        const bw0=Math.max(.4*u,WS[i]*.012*b2.wA);
        const bw1=Math.max(.4*u,WS[i+1]*.012*b2.wA);
        quad(i,brOff(b2,i),bw0,brOff(b2,i+1),bw1);
      }
    }
    /* the loaded touch-down rounds the start of the stroke */
    if(!capDone&&WS[i]>1.6*u&&wet>.5){
      ctx.globalAlpha=ga0*Math.min(1,.92*(.12+.88*Math.min(1,ld+.1)));
      mblob(ctx,P[i][0],P[i][1],WS[i]*.46);
      capDone=true;
    }
    lastW=WS[i+1];lastI=i;
  }
  /* a blunt ending only where the line stops still wet and untapered */
  if(lastW>1.8*u&&taper!=="both"&&taper!=="end"){
    const ldE=Math.max(0,dip-drain);
    if(ldE>.55){
      ctx.globalAlpha=ga0*Math.min(1,.9*(.3+.7*Math.min(1,ldE+.15)));
      mblob(ctx,P[lastI+1][0],P[lastI+1][1],lastW*.44);
    }
  }
  ctx.globalAlpha=ga0;
}

/* a small irregular ink blob — for pools and dots; never a neat circle */
function mblob(ctx,x,y,r){
  ctx.fillStyle=MAT_INK;
  const a1=R(.1,.3),a2=R(.05,.2),p1=R(0,6.28),p2=R(0,6.28);
  ctx.beginPath();
  for(let i=0;i<=16;i++){
    const t=i/16*2*Math.PI;
    const rr=r*(1+a1*Math.sin(t+p1)+a2*Math.sin(2*t+p2));
    const px=x+Math.cos(t)*rr,py=y+Math.sin(t)*rr;
    if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();
}


/* an elliptical arc as control points (for mline) */
function mArcPts(cx,cy,rx,ry,a0,a1,rot,n){
  n=n||14;
  const ca=Math.cos(rot||0),sa=Math.sin(rot||0),out=[];
  for(let i=0;i<=n;i++){
    const t=a0+(a1-a0)*i/n;
    const px=Math.cos(t)*rx,py=Math.sin(t)*ry;
    out.push([cx+px*ca-py*sa,cy+px*sa+py*ca]);
  }
  return out;
}

/* =========================================================
   the subject grammars — each returns a PLAN of strokes
   ========================================================= */

/* every plan item: {pts,w,taper,label} | {dot:[x,y,r]} — drawn in
   order, one prog unit each */

/* ---- visage: the late mask face ---- */
/* One bold closed egg holds the whole head — no hair, no neck, no
   shoulders, no jewellery. Inside it, six or seven marks: two brows
   (one flowing on into the nose), the eyes as short heavy dashes, a
   small wavy mouth. The brush is loaded at the top of the oval and
   starves on the way round. */
function planVisage(W,H){
  const plan=[];
  const cx=W*R(.47,.53),cy=H*R(.46,.52);
  const hr=Math.min(W,H)*R(.26,.31),ry=hr*R(1.3,1.42);
  const tilt=R(-.05,.05),ca=Math.cos(tilt),sa=Math.sin(tilt);
  const P=(x,y)=>[cx+(x*hr)*ca-(y*ry)*sa, cy+(x*hr)*sa+(y*ry)*ca];
  const jx=a=>a+R(-.03,.03), jy=a=>a+R(-.03,.03);

  /* the egg: one closed contour, wide at the cranium, drawn from the
     crown round and back with a small overlap where it closes */
  const wide=R(.96,1.04);                 /* this face's breadth   */
  const chin=R(.5,.62);                   /* how narrow it ends    */
  plan.push({pts:[
    P(-.12,-1.04),P(jx(.45),jy(-.93)),P(jx(.85*wide),jy(-.52)),
    P(jx(1.0*wide),jy(-.02)),P(jx(.92*wide),jy(.42)),
    P(jx(.62),jy(.8)),P(jx(chin*.5),jy(1.02)),P(0,jy(1.05)),
    P(jx(-chin*.5),jy(1.0)),P(jx(-.64),jy(.78)),
    P(jx(-.93*wide),jy(.4)),P(jx(-1.0*wide),jy(-.04)),
    P(jx(-.84*wide),jy(-.54)),P(jx(-.42),jy(-.94)),
    P(-.06,-1.04),P(.18,jy(-1.0))],
    w:4.4,taper:"end",label:"the contour of the face"});

  /* one brow flows on into the nose; the small nostril angle ends it */
  const eyY=-.14+R(-.02,.02),sep=.4+R(-.02,.02),ew=.32+R(-.02,.03);
  const nside=pick([1,-1]);
  const nTip=.3+R(-.02,.04);
  plan.push({pts:[
    P(nside*(sep+ew*.7),eyY-.18+R(-.02,.02)),
    P(nside*sep,eyY-.3-R(0,.03)),
    P(nside*(sep-ew*.6),eyY-.22),
    P(nside*.1,jy(.0)),P(nside*.07,.16),P(nside*.05,nTip),
    P(-nside*.1,nTip+.06),P(-nside*.18,nTip+.02)],
    w:2.8,taper:"none",label:"the brow becomes the nose"});
  /* the other brow answers alone, a touch higher */
  plan.push({pts:[P(-nside*(sep-ew*.55),eyY-.23),
    P(-nside*sep,eyY-.32-R(0,.03)),
    P(-nside*(sep+ew*.72),eyY-.2+R(-.03,.02))],
    w:2.8,taper:"end",label:"the brow"});

  /* the eyes: short heavy dashes, lens-pointed, looking somewhere */
  const gaze=R(-.4,.4),tiltE=R(-.04,.04);
  for(const side of [1,-1]){
    const ex=side*sep+gaze*ew*.1;
    plan.push({pts:[P(ex-side*ew*.42,eyY+.03+tiltE*side),
      P(ex,eyY-.018),
      P(ex+side*ew*.45,eyY+.018-tiltE*side)],
      w:3.4,taper:"both",label:"the eye"});
  }

  /* the mouth: a small wavy bow, and its echo below */
  const lY=.62+R(-.02,.02),lw=.26+R(-.02,.03);
  plan.push({pts:[P(-lw,lY+.01),P(-lw*.5,lY-.045),P(-lw*.12,lY+.005),
    P(lw*.12,lY-.04),P(lw*.5,lY+.005),P(lw,lY-.02)],
    w:2.3,taper:"both",label:"the bow of the lips"});
  plan.push({pts:[P(-lw*.6,lY+.1),P(0,lY+.14+R(0,.02)),P(lw*.6,lY+.09)],
    w:2.2,taper:"both",label:"the lower lip"});
  return plan;
}

/* a petal as Matisse drew one: a fat rounded lobe flowing out from the
   bloom's heart, around a broad tip, and home again — never a spike */
function petalPts(cx,cy,ang,len,wid){
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const P=(t,sX)=>[cx+ca*len*t-sa*wid*sX, cy+sa*len*t+ca*wid*sX];
  const sk=R(-.16,.16);                     /* each petal leans a little */
  return [P(.08,.14),P(.34,.52+sk),P(.74,.66+sk),P(1.0,.34),
          P(1.06,sk*.4),P(1.0,-.34),P(.74,-.66+sk),P(.34,-.52+sk),P(.08,-.14)];
}

/* ---- a Matisse leaf: broad, lobed, drawn in one wandering contour ---- */
function leafPts(cx,cy,Lr,ang,lobes){
  const pts=[];const n=40;
  const ph=R(0,6.28);
  for(let i=0;i<=n;i++){
    const t=i/n*2*Math.PI;
    const lobe=Math.pow(Math.abs(Math.sin(t*lobes/2)),.55);
    const rr=Lr*(.52+.48*lobe)*(1+.05*Math.sin(t*3+ph));
    const ex=Math.cos(t)*rr*1.5,ey=Math.sin(t)*rr*.85;
    pts.push([cx+ex*Math.cos(ang)-ey*Math.sin(ang),cy+ex*Math.sin(ang)+ey*Math.cos(ang)]);
  }
  return pts;
}

/* ---- fleurs: the vase, the stems, the blooms, the great leaf ---- */
function planFleurs(W,H){
  const plan=[];
  const S=Math.min(W,H);
  const tY=H*R(.68,.76);          /* where the vase rests — no line drawn */
  /* the vase */
  const vx=W*R(.44,.56),vh=S*R(.21,.28),mw=vh*R(.36,.48);
  const shape=pick(["round","pitcher","tall"]);
  const bw=shape==="round"?mw*R(1.5,1.9):shape==="tall"?mw*R(1.0,1.2):mw*R(1.3,1.6);
  const fw=bw*R(.45,.6);
  const vTop=tY-vh;
  for(const s of [1,-1]){
    plan.push({pts:[
      [vx+s*mw,vTop],[vx+s*mw*.92,vTop+vh*.18],
      [vx+s*bw,tY-vh*R(.5,.62)],[vx+s*bw*.92,tY-vh*.22],
      [vx+s*fw,tY-vh*.04],[vx+s*fw*1.1,tY]],
      w:1.05,taper:"both",label:"the vase"});
  }
  plan.push({pts:mArcPts(vx,vTop,mw,mw*.24,Math.PI*.06,Math.PI*.94,0,10),
    w:.9,taper:"both",label:"the mouth of the vase"});
  plan.push({pts:[[vx-fw*1.08,tY],[vx,tY+R(3,8)*MAT_U],[vx+fw*1.08,tY]],
    w:.95,taper:"both",label:"the foot of the vase"});
  if(shape==="pitcher")
    plan.push({pts:[[vx+bw*.88,tY-vh*.6],[vx+bw*1.42,tY-vh*.54],
      [vx+bw*1.38,tY-vh*.3],[vx+bw*.92,tY-vh*.24]],
      w:.95,taper:"both",label:"the handle"});
  if(rnd()<.2)
    plan.push({pts:[[vx-bw*.8,tY-vh*.42],[vx-bw*.25,tY-vh*.34],[vx+bw*.3,tY-vh*.44],[vx+bw*.8,tY-vh*.36]],
      w:.7,taper:"both",label:"the vase's band"});

  /* the bouquet: stems rising, blooms opening — spread, never crowded */
  const K=3+RI(0,2);
  const domeR=S*R(.2,.27);
  const blooms=[];
  for(let i=0;i<K;i++){
    const a=Math.PI*(.12+.76*i/Math.max(1,K-1))+R(-.05,.05);
    const rr=domeR*R(.55,1.0)*(i%2?1:.72);
    const bx2=vx-Math.cos(a)*rr*1.5, by2=vTop-mw*.18-Math.sin(a)*rr;
    blooms.push([bx2,by2]);
    plan.push({pts:[[vx+R(-.4,.4)*mw,vTop+vh*.05],
      [vx+(bx2-vx)*.35+R(-8,8)*MAT_U,vTop-(vTop-by2)*.45],
      [bx2+R(-4,4)*MAT_U,by2+domeR*.12],[bx2,by2]],
      w:.85,taper:"end",label:"a stem rising"});
  }
  let f=0;
  for(const [bx2,by2] of blooms){
    const kind=pick(["anemone","anemone","anemone","tulip","rose","bud"]);
    const br=domeR*R(.32,.45);
    if(kind==="anemone"){
      /* a blossom of fat rounded lobes, each petal one flowing loop —
         their bases gather at the heart, as in the apricot drawings */
      const np=5+RI(0,1);
      const a0=R(0,6.28);
      for(let p=0;p<np;p++){
        const a=a0+p/np*6.28+R(-.18,.18);
        const len=br*R(.85,1.15),wid=len*R(.42,.55);
        plan.push({pts:petalPts(bx2+Math.cos(a)*br*.1,by2+Math.sin(a)*br*.09,
          a,len,wid),w:.8,taper:"none",label:"an anemone"});
      }
      /* the heart: two or three small scribbled stamens, not a bullseye */
      const nh=2+RI(0,1);
      for(let d=0;d<nh;d++){
        const ha=R(0,6.28),hl=br*R(.1,.18);
        const hx2=bx2+R(-.1,.1)*br,hy2=by2+R(-.1,.1)*br;
        plan.push({pts:[[hx2,hy2],[hx2+Math.cos(ha)*hl,hy2+Math.sin(ha)*hl],
          [hx2+Math.cos(ha+.9)*hl*.7,hy2+Math.sin(ha+.9)*hl*.7]],
          w:.7,taper:"both",label:"an anemone"});
      }
      if(rnd()<.5)plan.push({dot:[bx2+R(-.08,.08)*br,by2+R(-.08,.08)*br,br*R(.05,.08)],label:"an anemone"});
    }else if(kind==="tulip"){
      /* the cup as two or three rounded lobes leaning together */
      for(const [a2,sc2] of [[-2.1,1],[-1.05,.92],[-1.6,.8]].slice(0,rnd()<.7?3:2)){
        const len=br*R(.95,1.2)*sc2,wid=len*R(.4,.5);
        plan.push({pts:petalPts(bx2+Math.cos(a2)*br*.08,by2+br*.18+Math.sin(a2)*br*.06,
          a2,len,wid),w:.85,taper:"none",label:"a tulip"});
      }
    }else if(kind==="rose"){
      /* a loose spiral, the rose seen from above, one petal cupping it */
      const turns=R(2.6,3.4)*Math.PI,ph0=R(0,6.28),sq=R(.75,.95);
      const sp=[];
      for(let t2=0;t2<=turns;t2+=.4){
        const rr=br*(.12+.6*t2/turns);
        sp.push([bx2+Math.cos(t2+ph0)*rr,by2+Math.sin(t2+ph0)*rr*sq]);
      }
      plan.push({pts:sp,w:.8,taper:"end",label:"a rose"});
      plan.push({pts:mArcPts(bx2,by2,br*.85,br*.7,ph0+turns+.5,ph0+turns+3.4,0,10),
        w:.8,taper:"both",label:"a rose"});
    }else{
      plan.push({pts:petalPts(bx2,by2+br*.5,-Math.PI/2+R(-.2,.2),br*R(.95,1.2),br*R(.42,.55)),
        w:.8,taper:"none",label:"a bud"});
    }
    f++;
  }

  /* the great lobed leaf — the signature, with its midrib */
  const nleaf=1+(rnd()<.25?1:0);
  for(let i=0;i<nleaf;i++){
    const side=i?1:-1;
    const lx=vx+side*bw*R(1.5,2.1),ly=vTop-domeR*R(-.15,.2);
    const Lr=domeR*R(.34,.46),ang=side*R(.5,1.0)-Math.PI*.5*(side<0?0:0);
    const lp=leafPts(lx,ly,Lr,ang,pick([5,5,7]));
    plan.push({pts:lp,w:.9,taper:"none",label:"a lobed leaf"});
    /* the midrib runs the leaf's length */
    plan.push({pts:[[lx-Math.cos(ang)*Lr*1.0,ly-Math.sin(ang)*Lr*1.0],
      [lx,ly],[lx+Math.cos(ang)*Lr*.95,ly+Math.sin(ang)*Lr*.95]],
      w:.7,taper:"end",label:"the leaf's midrib"});
    /* its stem reaches back to the vase */
    plan.push({pts:[[vx+side*mw*.4,vTop],
      [vx+(lx-vx)*.55,(vTop+ly)/2+R(-6,6)*MAT_U],
      [lx-Math.cos(ang)*Lr*.9,ly-Math.sin(ang)*Lr*.9]],
      w:.8,taper:"end",label:"a lobed leaf"});
  }
  /* small almond leaves on the stems */
  for(let i=0;i<2+RI(0,1);i++){
    const sx=vx+R(-1,1)*domeR*.8, sy=vTop-R(.0,.6)*domeR;
    const ll=domeR*R(.14,.22),a=R(-1,1);
    plan.push({pts:[[sx,sy],[sx+Math.cos(a-.35)*ll,sy+Math.sin(a-.35)*ll],
      [sx+Math.cos(a)*ll*1.5,sy+Math.sin(a)*ll*1.5],
      [sx+Math.cos(a+.35)*ll,sy+Math.sin(a+.35)*ll],[sx,sy]],
      w:.75,taper:"both",label:"an almond leaf"});
  }
  return plan;
}

/* ---- a designed drawing: Claude's strokes, inked by the same pen ---- */
function planFromDesign(W,H,design){
  const plan=[];
  const cx=W*.5,cy=H*.5,RAD=Math.min(W,H)*.46;
  const conv=p=>[cx+p[0]*RAD,cy+p[1]*RAD];
  const emit=(st,mx)=>{
    const M=p=>mx?[2*cx-p[0],p[1]]:p;
    const w=.65+.25*(st.w||1);
    if(st.t==="line"&&st.pts&&st.pts.length>1)
      plan.push({pts:st.pts.map(p=>M(conv(p))),w,taper:"both",label:"the draughtsman's line"});
    else if(st.t==="arc")
      plan.push({pts:mArcPts(...M(conv([st.x,st.y])),st.rx*RAD,st.ry*RAD,
        st.a0*Math.PI/180,st.a1*Math.PI/180,(st.rot||0)*Math.PI/180*(mx?-1:1),14),
        w,taper:"both",label:"the draughtsman's line"});
    else if(st.t==="satin"){
      /* a petal drawn in outline — the wing keeps no solid masses */
      const a=(st.ang||0)*Math.PI/180*(mx?-1:1)+(mx?Math.PI:0);
      const c=M(conv([st.x,st.y])),L2=st.len*RAD,W2=st.wid*RAD;
      const pts=[];
      for(let i=0;i<=20;i++){
        const t=i/20*2*Math.PI;
        const ex=Math.cos(t)*L2*.5+L2*.5,ey=Math.sin(t)*W2*.5;
        pts.push([c[0]+ex*Math.cos(a)-ey*Math.sin(a),c[1]+ex*Math.sin(a)+ey*Math.cos(a)]);
      }
      plan.push({pts,w:.8,taper:"none",label:"the draughtsman's petal"});
    }else if(st.t==="knot")
      plan.push({dot:[...M(conv([st.x,st.y])),Math.max(2*MAT_U,st.r*RAD)],label:"the draughtsman's point"});
  };
  for(const st of design.strokes||[]){
    emit(st,false);
    if(design.mirror)emit(st,true);
  }
  return plan;
}

/* =========================================================
   the sheet itself
   ========================================================= */
function* matissePhase(seed,fmtKey,subjKey,statusCb,prog,design,touches){
  rnd=mulberry32(seed);
  const fmt=FORMATS[fmtKey]||FORMATS.classic;
  const long=LONG_EDGE;
  const W=fmt.w>=fmt.h?long:Math.round(long*fmt.w/fmt.h);
  const H=fmt.w>=fmt.h?Math.round(long*fmt.h/fmt.w):long;
  hi.width=W;hi.height=H;
  const u=(W+H)/2000;          /* the nib scales with the sheet's mean edge */
  MAT_U=u;
  REL=null;                                   /* ink raises no relief   */
  MAT_MED=matisseMediumFor(seed,subjKey);
  MAT_INK=MAT_MED==="crayon"?"#2b241c":"#211a13";

  /* the paper: warm wove, almost — but never quite — even */
  const warm=R(-4,5)|0;
  const paper=`rgb(${245+warm},${239+warm},${(225+warm)|0})`;
  const groundUnits=4;
  hctx.globalAlpha=1;
  hctx.fillStyle=paper;
  hctx.fillRect(0,0,W,H);
  statusCb(0,0,{c:"wove paper",matisse:"stretching the sheet"});
  /* broad tonal breath, very quiet */
  for(let i=0;i<5;i++){
    const cxx=R(0,1)*W,cyy=R(0,1)*H,cr=R(.25,.5)*Math.max(W,H);
    hctx.fillStyle=rnd()<.5?"#fffdf6":"#d8cfb8";
    for(let j2=0;j2<30;j2++){
      hctx.globalAlpha=R(.004,.012);
      const ang=R(0,6.28),rr=Math.sqrt(rnd())*cr;
      stamp(hctx,cxx+Math.cos(ang)*rr,cyy+Math.sin(ang)*rr,cr*R(.15,.3));
    }
  }
  hctx.globalAlpha=1;
  prog.done=(prog.done||0)+groundUnits;
  yield;

  /* the plan: Claude's drawing if one was commissioned, the house's
     otherwise — faces are ALWAYS the house's own mask grammar, so the
     signature style never drifts */
  const plan=(design&&design.strokes&&design.strokes.length&&subjKey!=="visage")
    ?planFromDesign(W,H,design)
    :subjKey==="fleurs"?planFleurs(W,H)
    :planVisage(W,H);

  const finishUnits=6;
  prog.total=(prog.done||0)+plan.length+finishUnits;
  /* the ink master's directions, by stroke index */
  const tmap={};
  if(Array.isArray(touches))
    for(const t of touches)if(t&&typeof t==="object")tmap[t.i|0]=t;

  /* the base nib width: the pen is fine, the crayon broad */
  const nib=(MAT_MED==="crayon"?3.2:MAT_MED==="brush"?2.6:2.3)*u;
  const inkName=MAT_MED==="crayon"?"crayon":"Indian ink";

  let sidx=0;
  for(const st of plan){
    const tch=tmap[sidx];sidx++;
    statusCb(0,0,{c:inkName,matisse:st.label||"the line"});
    hctx.globalAlpha=1;
    if(st.dot){
      hctx.fillStyle=MAT_INK;
      const dr=st.dot[2]*(tch&&tch.press?clamp(tch.press,.5,1.6):1);
      if(MAT_MED==="crayon"){
        for(let g=0;g<10;g++){
          hctx.globalAlpha=R(.25,.6);
          stamp(hctx,st.dot[0]+R(-.4,.4)*dr,st.dot[1]+R(-.4,.4)*dr,dr*R(.3,.6));
        }
        hctx.globalAlpha=1;
      }else{
        hctx.globalAlpha=R(.88,.98);
        mblob(hctx,st.dot[0],st.dot[1],dr);
        hctx.globalAlpha=1;
      }
    }else if(st.pts&&st.pts.length>1){
      mline(hctx,st.pts,nib*(st.w||1),{taper:st.taper,
        press:tch&&tch.press,dip:tch&&tch.dip,drain:tch&&tch.drain});
    }
    prog.done++;
    yield;
  }
  return {W,H,u,subjKey,paper,strokes:plan.map(p=>p.label||"a line")};
}

/* the sheet is photographed, not varnished: paper tooth, the gallery's
   gentle light, nothing of the oil wing's debris or mottle */
function* paperFinish(C,statusCb,prog){
  statusCb(0,0,null);
  const {W,H,u}=C;
  /* tooth: the paper's grain breathes through even the ink */
  const t=document.createElement("canvas");
  const tp=96;t.width=tp;t.height=tp;
  const tc=t.getContext("2d");
  for(let i=0;i<900;i++){
    tc.fillStyle=rnd()<.5?"rgba(255,255,250,.5)":"rgba(120,104,78,.4)";
    tc.globalAlpha=R(.2,.7);
    tc.fillRect((rnd()*tp)|0,(rnd()*tp)|0,1,1);
  }
  hctx.globalAlpha=.05;
  hctx.fillStyle=hctx.createPattern(t,"repeat");
  hctx.fillRect(0,0,W,H);
  hctx.globalAlpha=1;
  prog.done+=2;yield;
  /* the room's light: brightest where the lamp looks, quiet corners */
  const kx=rnd()<.5?0:W;
  let g=hctx.createRadialGradient(kx,0,Math.max(W,H)*.1,kx,0,Math.max(W,H)*1.25);
  g.addColorStop(0,"rgba(255,252,240,.05)");
  g.addColorStop(.55,"rgba(255,252,240,0)");
  g.addColorStop(1,"rgba(58,46,28,.07)");
  hctx.fillStyle=g;hctx.fillRect(0,0,W,H);
  prog.done+=2;yield;
  /* the sheet was handled once or twice: the faintest fleck */
  if(rnd()<.4){
    hctx.globalAlpha=R(.04,.08);
    hctx.fillStyle="#8a6f3f";
    stamp(hctx,W*pick([R(.04,.12),R(.88,.96)]),H*R(.08,.92),R(2,5)*u);
    hctx.globalAlpha=1;
  }
  prog.done+=2;yield;
}

function* matisseGenerate(seed,fmtKey,subjKey,statusCb,prog={},design,touches){
  if(prog.total===undefined){prog.total=1;prog.done=0;}
  const C=yield* matissePhase(seed,fmtKey,subjKey,statusCb,prog,design,touches);
  yield* paperFinish(C,statusCb,prog);
  return C;
}

/* ===== MATISSE WING END ===== */

