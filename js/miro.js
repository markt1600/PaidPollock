/* =========================================================
   the dream wing — paintings in the manner of Joan Miró
   ========================================================= */
const MIRO_PALETTES={
  reve:{name:"Rêve",note:"ivory ground · full primaries",medium:"Oil on canvas",
    ground:"#ebe2cd",clouds:["#e0d4b8","#f3ecd9","#d6c9ab","#e8dcc2"],
    marks:["red","blue","yellow","green","black"],line:"black",
    colors:{red:"#c23a1d",blue:"#1d4f9c",yellow:"#e3b21e",green:"#34784a",black:"#191512",white:"#f3eedd"},
    swatches:["#ebe2cd","#c23a1d","#1d4f9c","#e3b21e"]},
  constellation:{name:"Constellation",note:"mottled parchment · star fields",medium:"Gouache and oil wash on paper",
    ground:"#d8cba8",clouds:["#c4b48d","#e6dbbd","#b1a07c","#cfc09c","#998a68"],
    marks:["red","blue","yellow","green","black","black"],line:"black",
    colors:{red:"#b93620",blue:"#1c477f",yellow:"#d9a81f",green:"#2e6b42",black:"#1b1713",white:"#efe8d2"},
    swatches:["#d8cba8","#1b1713","#b93620","#1c477f"]},
  bleu:{name:"Bleu",note:"cobalt field · sparse wanderers",medium:"Oil on canvas",
    ground:"#1d4a99",clouds:["#16407f","#2756ae","#234e9e"],
    marks:["red","black","white"],line:"black",
    colors:{red:"#cf3a20",blue:"#1d4a99",yellow:"#e3b21e",green:"#34784a",black:"#15110e",white:"#efe9d8"},
    swatches:["#1d4a99","#cf3a20","#15110e","#efe9d8"]},
  nocturne:{name:"Nocturne",note:"umber night · bright wanderers",medium:"Oil on canvas",
    ground:"#27201a",clouds:["#1d1813","#332a21","#211b14","#3a2f24"],
    marks:["red","yellow","white","blue","green"],line:"pale",
    colors:{red:"#c8401f",blue:"#3a6cb4",yellow:"#e4b526",green:"#3f8454",black:"#14100d",white:"#ece3cb"},
    swatches:["#27201a","#e4b526","#c8401f","#ece3cb"]},
  terre:{name:"Terre",note:"burnt sienna · circus figures",medium:"Oil on canvas",
    ground:"#a8602f",clouds:["#965426","#b46c38","#8d4d22","#bb7440"],
    marks:["black","white","yellow","blue"],line:"black",
    colors:{red:"#a72d17",blue:"#1f4886",yellow:"#e0ae24",green:"#34784a",black:"#1a1410",white:"#f0e7d2"},
    swatches:["#a8602f","#1a1410","#e0ae24","#f0e7d2"]}
};

/* ---- mixed media: Miró worked in ink, gouache, crayon, fingertips ---- */
let MIRO_MED="ink";   /* the tool currently in hand */

/* wax crayon / charcoal: dry, grainy, the paper breathes through */
function crayon(ctx,pts,w0){
  const ga=ctx.globalAlpha;
  let total=0;
  for(let i=1;i<pts.length;i++)total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  if(total<1)return;
  for(let i=1;i<pts.length;i++){
    const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
    const d=Math.hypot(x2-x1,y2-y1), n=Math.max(1,Math.round(d/(w0*.3)));
    for(let j2=0;j2<=n;j2++){
      const t=j2/n, x=x1+(x2-x1)*t, y=y1+(y2-y1)*t;
      const k=2+((rnd()*3)|0);
      for(let g=0;g<k;g++){
        ctx.globalAlpha=ga*R(.16,.5);
        stamp(ctx,x+R(-.55,.55)*w0,y+R(-.55,.55)*w0,w0*R(.1,.28));
      }
      if((j2&3)===0)hstamp(x,y,w0*.5,.025);
    }
  }
  ctx.globalAlpha=ga;
}
/* a brush running dry: broken parallel streaks */
function dryBrush(ctx,pts,w0){
  const ga=ctx.globalAlpha;
  for(let strand=0;strand<4;strand++){
    const off=R(-.38,.38)*w0;
    for(let i=1;i<pts.length;i++){
      const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
      const d=Math.hypot(x2-x1,y2-y1), n=Math.max(1,Math.round(d/(w0*.25)));
      const nx=-(y2-y1)/d, ny=(x2-x1)/d;
      for(let j2=0;j2<=n;j2++){
        if(rnd()<.32)continue;
        const t=j2/n;
        ctx.globalAlpha=ga*R(.3,.65);
        stamp(ctx,x1+(x2-x1)*t+nx*off,y1+(y2-y1)*t+ny*off,w0*R(.1,.2));
      }
    }
  }
  ctx.globalAlpha=ga;
}
/* the signature crayon scribble: an elliptical spiral, wobbling */
function crayonScribble(ctx,cx,cy,rx,ry,turns,u){
  const rot=R(-.35,.35),cr=Math.cos(rot),sr=Math.sin(rot);
  const n=Math.round(turns*30), pts=[];
  for(let i=0;i<=n;i++){
    const a=i/30*2*Math.PI;
    const shrink=1-.5*(i/n)+R(-.05,.05);
    const px=Math.cos(a)*rx*shrink, py=Math.sin(a)*ry*shrink;
    pts.push([cx+px*cr-py*sr,cy+px*sr+py*cr]);
  }
  crayon(ctx,pts,3.8*u);
}
/* fingertip dabs: a dark heart ringed by hollow prints */
function dabCluster(ctx,cx,cy,r,u){
  const ga=ctx.globalAlpha;
  for(let i=0;i<4+((rnd()*3)|0);i++){
    ctx.globalAlpha=ga*R(.75,.95);
    stamp(ctx,cx+R(-.28,.28)*r,cy+R(-.28,.28)*r,r*R(.16,.3));
    hstamp(cx,cy,r*.3,.08);
  }
  const n=10+((rnd()*8)|0);
  for(let i=0;i<n;i++){
    const a=R(0,6.28), rr=r*R(.5,1.05);
    const dx=cx+Math.cos(a)*rr, dy=cy+Math.sin(a)*rr;
    const dr=r*R(.1,.17);
    ctx.globalAlpha=ga*R(.45,.8);
    const m=5+((rnd()*4)|0);
    for(let k=0;k<m;k++){
      const aa=k*2*Math.PI/m+R(-.3,.3);
      stamp(ctx,dx+Math.cos(aa)*dr,dy+Math.sin(aa)*dr,dr*R(.3,.5));
    }
    if(rnd()<.4)stamp(ctx,dx,dy,dr*R(.2,.35));
  }
  ctx.globalAlpha=ga;
}
/* an ink splat with spidery droplets */
function msplat(ctx,x,y,r,u){
  for(let i=0;i<10;i++)stamp(ctx,x+R(-.3,.3)*r,y+R(-.3,.3)*r,r*R(.2,.42));
  hstamp(x,y,r*.42,.09);
  const n=4+((rnd()*5)|0);
  for(let i=0;i<n;i++){
    const a=R(0,6.28), d=r*R(1,2.6);
    stamp(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d,Math.max(.8*u,r*R(.05,.14)));
  }
}
/* a comb / rake mark */
function mComb(ctx,x,y,s,ang,w){
  const ca=Math.cos(ang),sa=Math.sin(ang);
  obrush(ctx,[[x-ca*s,y-sa*s],[x+ca*s,y+sa*s]],w,true);
  const teeth=3+((rnd()*3)|0);
  for(let i=0;i<teeth;i++){
    const t=-.8+1.6*i/(teeth-1);
    const tx=x+ca*t*s, ty=y+sa*t*s;
    obrush(ctx,[[tx,ty],[tx-sa*s*R(.4,.6),ty+ca*s*R(.4,.6)]],w*.9,true);
  }
}

/* ---- oil-paint primitives: matte, brushed, faintly ridged ---- */
function obrush(ctx,pts,w0,taper){
  if(MIRO_MED==="crayon")return crayon(ctx,pts,w0*1.3);
  if(MIRO_MED==="dry")return dryBrush(ctx,pts,w0*1.2);
  /* a brush line through the points: width breathes, ends taper */
  let total=0;
  for(let i=1;i<pts.length;i++)total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  if(total<1)return;
  const ph=R(0,6.28);
  let run=0;
  for(let i=1;i<pts.length;i++){
    const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
    const d=Math.hypot(x2-x1,y2-y1), n=Math.max(1,Math.round(d/(w0*.4)));
    for(let j2=0;j2<=n;j2++){
      const t=j2/n, x=x1+(x2-x1)*t+R(-.1,.1)*w0, y=y1+(y2-y1)*t+R(-.1,.1)*w0;
      const along=(run+d*t)/total;
      let w=w0*(1+.35*Math.sin(along*7.2+ph));
      if(taper){
        if(along<.1)w*=.45+.9*(along/.1);   /* the loaded start swells */
        if(along>.86)w*=.3+.7*((1-along)/.14);
      }
      const ga0=ctx.globalAlpha;
      if(taper&&along>.88)ctx.globalAlpha=ga0*R(.45,.8); /* the brush runs dry */
      stamp(ctx,x,y,w*.5);
      ctx.globalAlpha=ga0;
      if((j2&1)===0)hstamp(x,y,w*.5,.08);
    }
    run+=d;
  }
}
/* a biomorphic blob: radial harmonics, matte fill, painted body */
function oblob(ctx,cx,cy,r,squash,ang,scrub){
  const a1=R(.08,.3),a2=R(.05,.22),a3=R(.02,.14);
  const p1=R(0,6.28),p2=R(0,6.28),p3=R(0,6.28);
  const sq=squash||R(.6,1);
  const ca=Math.cos(ang||0),sa=Math.sin(ang||0);
  const N2=46,pts=[];
  for(let i=0;i<=N2;i++){
    const t=i/N2*2*Math.PI;
    const rr=r*(1+a1*Math.sin(t+p1)+a2*Math.sin(2*t+p2)+a3*Math.sin(3*t+p3));
    const px=Math.cos(t)*rr, py=Math.sin(t)*rr*sq;
    pts.push([cx+px*ca-py*sa, cy+px*sa+py*ca]);
  }
  if(scrub){ /* a scrubbed crayon mass, paper breathing through */
    for(let k=5;k>=1;k--){
      const sc=k/5;
      crayon(ctx,pts.map(p=>[cx+(p[0]-cx)*sc,cy+(p[1]-cy)*sc]),r*.16);
    }
    return pts;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]);
  for(const p of pts)ctx.lineTo(p[0],p[1]);
  ctx.closePath();ctx.fill();
  /* paint body: an uneven ridge inside the edge, depth in the middle —
     never embossing the bare paper beyond the paint */
  for(let i=0;i<pts.length;i+=2){
    if(rnd()<.3)continue;
    const ins=R(.7,.9);
    hstamp(cx+(pts[i][0]-cx)*ins,cy+(pts[i][1]-cy)*ins,r*R(.08,.16),R(.06,.11));
  }
  for(let i=0;i<10;i++)hstamp(cx+R(-.45,.45)*r,cy+R(-.45,.45)*r*sq,r*R(.18,.34),.05);
  return pts;
}
function odisc(ctx,cx,cy,r){
  ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.fill();
  /* the paint settles unevenly: scattered swells, never a neat ring */
  const n=5+((rnd()*5)|0);
  for(let i=0;i<n;i++){
    const a=i*6.2832/n+R(-.45,.45);
    const rr=r*R(.3,.78);
    hstamp(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,r*R(.1,.22),R(.05,.11));
  }
  hstamp(cx+R(-.15,.15)*r,cy+R(-.15,.15)*r,r*R(.35,.55),.05);
}
function oring(ctx,cx,cy,r,w){
  const n=Math.max(10,Math.round(6.28*r/(w*.42)));
  for(let i=0;i<=n;i++){
    const a=i/n*6.2832;
    stamp(ctx,cx+Math.cos(a)*r+R(-.08,.08)*w,cy+Math.sin(a)*r+R(-.08,.08)*w,w*.5);
    if((i&1)===0)hstamp(cx+Math.cos(a)*r,cy+Math.sin(a)*r,w*.5,.07);
  }
}
function ostar(ctx,cx,cy,r,u){
  /* Miró's asterisk star: crossing strokes, slightly bowed */
  const arms=rnd()<.6?4:3, w=Math.max(2.2*u,r*.07);
  const a0=R(0,Math.PI);
  for(let k=0;k<arms;k++){
    const a=a0+k*Math.PI/arms;
    const dx=Math.cos(a),dy=Math.sin(a);
    const bow=R(-.12,.12)*r;
    obrush(ctx,[[cx-dx*r,cy-dy*r],[cx-dy*bow*.5,cy+dx*bow*.5],[cx+dx*r*R(.85,1.15),cy+dy*r*R(.85,1.15)]],w,true);
  }
}
function oeye(ctx,cx,cy,r,ang,u,pupilFill,outline){
  const fs=ctx.fillStyle;
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const P=(t,h)=>[cx+ca*t*r-sa*h, cy+sa*t*r+ca*h];
  const n=18, lens=[];
  for(let i=0;i<=n;i++){
    const t=-1+2*i/n, h=Math.sin(Math.acos(Math.min(1,Math.abs(t))))*r*.5;
    lens.push(P(t,-h));
  }
  for(let i=n;i>=0;i--){
    const t=-1+2*i/n, h=Math.sin(Math.acos(Math.min(1,Math.abs(t))))*r*.5;
    lens.push(P(t,h));
  }
  ctx.beginPath();
  ctx.moveTo(lens[0][0],lens[0][1]);
  for(const p of lens)ctx.lineTo(p[0],p[1]);
  ctx.closePath();ctx.fill();
  for(let i=0;i<lens.length;i+=3)hstamp(lens[i][0],lens[i][1],r*.12,.08);
  if(outline){
    ctx.fillStyle=outline;
    const w=Math.max(2*u,r*.08);
    obrush(ctx,lens.slice(0,n+1),w,true);
    obrush(ctx,lens.slice(n+1),w,true);
  }
  ctx.fillStyle=pupilFill||fs;
  odisc(ctx,cx,cy,r*.26);
  ctx.fillStyle=fs;
}
function omoon(ctx,cx,cy,r,ang){
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const pts=[];
  const n=26;
  for(let i=0;i<=n;i++){const a=-1.45+2.9*i/n;
    pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
  for(let i=n;i>=0;i--){const a=-1.45+2.9*i/n;
    pts.push([Math.cos(a)*r*.62+r*.3,Math.sin(a)*r*.88]);}
  ctx.beginPath();
  let first=true;
  for(const [px,py] of pts){
    const x=cx+px*ca-py*sa, y=cy+px*sa+py*ca;
    if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fill();
  for(let i=0;i<pts.length;i+=4){
    if(rnd()<.3)continue;
    const ins=R(.7,.88);
    const x=cx+(pts[i][0]*ca-pts[i][1]*sa)*ins, y=cy+(pts[i][0]*sa+pts[i][1]*ca)*ins;
    hstamp(x,y,r*R(.07,.13),R(.06,.1));
  }
}
function oladder(ctx,cx,cy,h,ang,u){
  const w=2.6*u, sp=h*.16;
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const P=(t,s)=>[cx+sa*s*sp+ca*t*h*.5, cy-ca*s*sp+sa*t*h*.5];
  obrush(ctx,[P(-1,-1),P(1,-1)],w,false);
  obrush(ctx,[P(-1,1),P(1,1)],w,false);
  const rungs=3+((rnd()*3)|0);
  for(let i=0;i<rungs;i++){
    const t=-0.8+1.6*i/(rungs-1)+R(-.04,.04);
    obrush(ctx,[P(t,-1.15),P(t,1.15)],w*.85,false);
  }
}
function obird(ctx,cx,cy,r,u){
  const w=Math.max(2.4*u,r*.08);
  const fl=rnd()<.5?1:-1;
  obrush(ctx,[[cx-r,cy+r*.25*fl],[cx-r*.3,cy-r*.4*fl],[cx+r*.25,cy+r*.05*fl],[cx+r,cy-r*.5*fl]],w,true);
  obrush(ctx,[[cx-r*.15,cy-r*.1*fl],[cx+r*.2,cy-r*.75*fl]],w*.85,true);
}
function odotsTrail(ctx,cx,cy,r,n,ang){
  const ca=Math.cos(ang),sa=Math.sin(ang);
  for(let i=0;i<n;i++){
    const t=i/(n-1)-.5;
    const sz=r*(0.5+0.5*Math.sin(Math.PI*i/(n-1)))*.16+r*.04;
    odisc(ctx,cx+ca*t*2*r+R(-.05,.05)*r,cy+sa*t*2*r+R(-.05,.05)*r,sz);
  }
}
/* a personnage in the manner of the late works: a great caged torso,
   wide-stance legs, a crayon halo, one raised accent */
function ofigure2(ctx,cx,cy,sc,pal,u){
  const C2=pal.colors;
  const lineC=pal.line==="pale"?C2.white:C2.black;
  const accent=[C2.red,"#5e1f1a",C2.blue][(rnd()*3)|0];
  ctx.fillStyle=lineC;
  /* torso: a leaning oval cage */
  const tilt=R(-.18,.18);
  const rx=sc*.34, ry=sc*.46;
  const per=[];
  for(let i=0;i<=40;i++){
    const a=i/40*2*Math.PI;
    const px=Math.cos(a)*rx*R(.96,1.04), py=Math.sin(a)*ry*R(.96,1.04);
    per.push([cx+px*Math.cos(tilt)-py*Math.sin(tilt),
              cy+px*Math.sin(tilt)+py*Math.cos(tilt)]);
  }
  MIRO_MED="ink";
  obrush(ctx,per,4.2*u,false);
  const inner=rnd();
  if(inner<.55){ /* the grid: bars across the cage */
    const nb=3+((rnd()*3)|0);
    for(let i=0;i<nb;i++){
      const t=-.6+1.2*i/(nb-1);
      obrush(ctx,[[cx-rx*.85,cy+ry*t+R(-.04,.04)*sc],
                  [cx+rx*.85,cy+ry*t*R(.85,1.15)]],3.6*u,true);
    }
    const nv=2+((rnd()*2)|0);
    for(let i=0;i<nv;i++){
      const t=-.5+1*i/Math.max(1,nv-1);
      obrush(ctx,[[cx+rx*t,cy-ry*.8],[cx+rx*t*R(.8,1.2),cy+ry*.8]],3.2*u,true);
    }
  }else if(inner<.8){ /* a scrubbed dark mass inside */
    oblob(ctx,cx+R(-.1,.1)*rx,cy+R(-.1,.1)*ry,sc*.26,R(.7,1),tilt,true);
  }
  /* the dark head-blob riding the cage's shoulder */
  oblob(ctx,cx+R(-.2,.2)*rx,cy-ry*R(.55,.8),sc*R(.13,.18),R(.8,1),R(0,3));
  /* legs: the wide stance */
  const hipY=cy+ry*.7;
  for(const side of [-1,1]){
    const fx=cx+side*sc*R(.3,.45), fy=cy+ry*1.3+R(0,.1)*sc;
    obrush(ctx,[[cx+side*rx*.2,hipY],[cx+side*sc*.18,hipY+ry*.4],[fx,fy]],7*u,true);
    obrush(ctx,[[fx,fy],[fx+side*sc*.13,fy+R(-.02,.02)*sc]],6*u,true); /* the foot */
  }
  /* arms: one raised holding the accent, one hooked */
  const armY=cy-ry*R(.1,.3);
  const upX=cx-rx*1.05, upTip=[upX-sc*R(.12,.2),armY-sc*R(.3,.45)];
  obrush(ctx,[[cx-rx*.7,armY],[upX,armY-sc*.1],upTip],3.6*u,true);
  ctx.fillStyle=accent;
  oblob(ctx,upTip[0],upTip[1]-sc*.06,sc*R(.07,.1),R(.6,.85),R(0,3));
  obrush(ctx,[[upTip[0],upTip[1]],[upTip[0],upTip[1]-sc*.04]],3*u,false);
  ctx.fillStyle=lineC;
  MIRO_MED=rnd()<.5?"crayon":"ink";
  obrush(ctx,[[cx+rx*.9,armY],[cx+rx*1.3,armY-sc*.12],[cx+rx*1.34,armY+sc*.14],[cx+rx*1.1,armY+sc*.18]],3.4*u,true);
  MIRO_MED="ink";
  /* the crayon halo drifting above */
  if(rnd()<.78)
    crayonScribble(ctx,cx+R(-.6,-.1)*sc,cy-ry*1.25+R(-.1,.1)*sc,
                   sc*R(.22,.3),sc*R(.12,.18),R(2.2,3.6),u);
  /* an ink splat and droplets where the brush paused */
  if(rnd()<.6)msplat(ctx,cx+R(-.3,.3)*sc,cy+R(0,.4)*sc,sc*R(.025,.045),u);
}

/* a figure in Miró's shorthand: head, eye, body, limbs, whiskers */
function ofigure(ctx,cx,cy,sc,pal,u){
  const C2=pal.colors, picks=pal.marks;
  const pick=()=>C2[picks[(rnd()*picks.length)|0]];
  const lineC=pal.line==="pale"?C2.white:C2.black;
  /* body: a large blob or a triangle skirt */
  const bodyC=pick();
  ctx.fillStyle=bodyC;
  if(rnd()<.5){
    oblob(ctx,cx,cy+sc*.25,sc*.42,R(.7,1.1),R(-.4,.4));
  }else{
    ctx.beginPath();
    ctx.moveTo(cx,cy-sc*.1);
    ctx.lineTo(cx-sc*.42,cy+sc*.62);
    ctx.lineTo(cx+sc*.42,cy+sc*.62);
    ctx.closePath();ctx.fill();
    for(let i=0;i<8;i++)hstamp(cx+R(-.3,.3)*sc,cy+R(0,.5)*sc,sc*.15,.08);
  }
  /* head */
  const headC=rnd()<.5?lineC:pick();
  ctx.fillStyle=headC;
  const hy=cy-sc*.55;
  if(rnd()<.6)odisc(ctx,cx,hy,sc*.22);
  else oblob(ctx,cx,hy,sc*.22,R(.7,1),R(-.3,.3));
  /* the eye, on head or body */
  ctx.fillStyle=C2.white;
  oeye(ctx,cx+R(-.06,.06)*sc,rnd()<.6?hy:cy+sc*.2,sc*.16,R(-.3,.3),u,C2.black,
       headC===C2.white?C2.black:undefined);
  /* neck + limbs in line */
  ctx.fillStyle=lineC;
  obrush(ctx,[[cx,hy+sc*.2],[cx+R(-.04,.04)*sc,cy+sc*.05]],2.6*u,false);
  obrush(ctx,[[cx-sc*.05,cy+sc*.15],[cx-sc*R(.4,.6),cy+sc*R(-.15,.2)]],2.6*u,true);
  obrush(ctx,[[cx+sc*.05,cy+sc*.15],[cx+sc*R(.4,.6),cy+sc*R(-.15,.2)]],2.6*u,true);
  /* whiskers from the head */
  const nw=2+((rnd()*4)|0);
  for(let i=0;i<nw;i++){
    const a=R(-2.6,-.5);
    obrush(ctx,[[cx,hy],[cx+Math.cos(a)*sc*R(.3,.5),hy+Math.sin(a)*sc*R(.3,.5)]],1.8*u,true);
  }
  /* a small star or dot held aloft */
  if(rnd()<.5){
    ctx.fillStyle=pick();
    if(rnd()<.5)ostar(ctx,cx+sc*R(.45,.65),hy-sc*R(.1,.3),sc*.14,u);
    else odisc(ctx,cx+sc*R(.45,.65),hy-sc*R(.1,.3),sc*.07);
  }
}

/* ---- the dream painting ---- */
function* miroPhase(seed,fmtKey,palKey,statusCb,prog){
  rnd=mulberry32(seed);
  const fmt=FORMATS[fmtKey]||FORMATS.classic;
  const long=LONG_EDGE;
  const W=fmt.w>=fmt.h?long:Math.round(long*fmt.w/fmt.h);
  const H=fmt.w>=fmt.h?Math.round(long*fmt.h/fmt.w):long;
  hi.width=W;hi.height=H;
  const u=Math.max(W,H)/1000;
  const pal=MIRO_PALETTES[palKey]||MIRO_PALETTES.reve;
  const C2=pal.colors;
  const lineC=pal.line==="pale"?C2.white:C2.black;

  /* canvas weave height base, as in the pollock wing */
  const hm=document.createElement("canvas");
  hm.width=Math.max(2,Math.ceil(W/2));
  hm.height=Math.max(2,Math.ceil(H/2));
  const hmx=hm.getContext("2d");
  hmx.fillStyle="#000";hmx.fillRect(0,0,hm.width,hm.height);
  hmx.globalCompositeOperation="lighter";
  const hp=Math.max(2,Math.round(1.7*u));
  hmx.fillStyle="rgba(255,255,255,0.035)";
  for(let y=0;y<hm.height;y+=hp)hmx.fillRect(0,y,hm.width,1);
  hmx.fillStyle="rgba(255,255,255,0.028)";
  for(let x=0;x<hm.width;x+=hp)hmx.fillRect(x,0,1,hm.height);
  hmx.fillStyle="rgba(255,255,255,0.07)";
  const nubs=Math.round(hm.width*hm.height*.004);
  for(let i=0;i<nubs;i++)hmx.fillRect((rnd()*hm.width)|0,(rnd()*hm.height)|0,1,1);
  hmx.setTransform(.5,0,0,.5,0,0);
  REL=hmx;RELU=u;
  LIGHT_ANG=-2.356+R(-.3,.3);

  /* the composition rolls its own dream */
  const V={
    comp:palKey==="bleu"?(rnd()<.8?"sparse":"constellation")
         :palKey==="constellation"?(rnd()<.65?"constellation":"personnages")
         :(r=>r<.55?"personnages":r<.78?"sparse":"constellation")(rnd()),
    horizon:rnd()<.16,
    speckle:rnd()<.5
  };
  const dense=V.comp==="constellation";
  const counts=dense?{anchors:1,mid:11+((rnd()*5)|0),small:18+((rnd()*10)|0),conn:9+((rnd()*6)|0)}
    :V.comp==="personnages"?{anchors:1,mid:2+((rnd()*3)|0),small:3+((rnd()*3)|0),conn:1+((rnd()*2)|0)}
    :{anchors:1,mid:1+((rnd()*3)|0),small:2+((rnd()*4)|0),conn:(rnd()*2)|0};

  const finishUnits=Math.ceil(hm.height/64)+3*(Math.ceil(hm.height/128)+Math.ceil(hm.width/128))+2;
  const groundUnits=8;
  const total=counts.anchors+counts.mid+counts.small+counts.conn;
  prog.total=groundUnits+total+finishUnits;
  prog.done=0;

  /* ---- the ground: washed, scumbled, breathing ---- */
  statusCb(0,0,{c:pal.ground,miro:"the ground wash"});
  hctx.fillStyle=pal.ground;
  hctx.fillRect(0,0,W,H);
  const nclouds=4+((rnd()*4)|0);
  for(let i=0;i<nclouds;i++){
    const cxx=R(.05,.95)*W, cyy=R(.05,.95)*H, cr=R(.18,.42)*Math.max(W,H);
    hctx.fillStyle=pal.clouds[(rnd()*pal.clouds.length)|0];
    const a=R(.018,.04);
    for(let j2=0;j2<60;j2++){
      hctx.globalAlpha=a*R(.6,1.4);
      const ang=R(0,6.28), rr=Math.sqrt(rnd())*cr;
      stamp(hctx,cxx+Math.cos(ang)*rr,cyy+Math.sin(ang)*rr*.8,cr*R(.12,.3));
    }
    hctx.globalAlpha=1;
    prog.done+=.5;
    yield;
  }
  /* dry-brush streaks with the weave */
  for(let i=0;i<18;i++){
    hctx.globalAlpha=R(.012,.03);
    hctx.fillStyle=rnd()<.5?"#fffaf0":"#5d4a32";
    const y0=R(0,1)*H, x0=R(-.1,.9)*W, len=R(.12,.4)*W, sl=R(-.08,.08);
    for(let x=0;x<len;x+=3*u)stamp(hctx,x0+x,y0+x*sl+R(-3,3)*u,R(1.5,4)*u);
  }
  hctx.globalAlpha=1;
  if(V.speckle){
    for(let i=0;i<160;i++){
      hctx.globalAlpha=R(.1,.4);
      hctx.fillStyle=rnd()<.7?lineC:pal.clouds[0];
      stamp(hctx,rnd()*W,rnd()*H,R(.5,1.6)*u);
    }
    hctx.globalAlpha=1;
  }
  if(V.horizon){
    hctx.fillStyle=lineC;
    const hy=H*R(.62,.8);
    obrush(hctx,[[W*.04,hy+R(-8,8)*u],[W*.5,hy+R(-10,10)*u],[W*.96,hy+R(-8,8)*u]],2.4*u,true);
  }
  prog.done=groundUnits;
  yield;

  /* ---- placement: forms float, never crowd ---- */
  const placed=[];
  function place(r,reachUp,reachDown){
    const up=(reachUp!==undefined?reachUp:r)+.03*H;
    const dn=(reachDown!==undefined?reachDown:r)+.03*H;
    const mx=r+.04*W;
    if(up+dn>H*.9||2*mx>W*.9)return null;
    for(let t=0;t<46;t++){
      const x=R(mx/W,1-mx/W)*W, y=R(up/H,1-dn/H)*H;
      let ok=true;
      for(const o of placed){
        if(Math.hypot(x-o.x,y-o.y)<(r+o.r)*1.12){ok=false;break;}
      }
      if(ok){const p={x,y,r};placed.push(p);return p;}
    }
    return null;
  }
  const pickC=()=>(V.comp==="personnages"&&rnd()<.5)
    ?lineC:C2[pal.marks[(rnd()*pal.marks.length)|0]];

  /* anchors: the protagonists */
  const base=Math.min(W,H);
  for(let i=0;i<counts.anchors;i++){
    const r=V.comp==="personnages"
      ?Math.min(base*R(.27,.36),H*.265,W*.32)
      :base*R(.14,.22);
    const p=V.comp==="personnages"
      ?place(r*.6,r*1.6,r*1.45)
      :place(r);
    if(!p)continue;
    statusCb(0,0,{c:lineC,miro:"the protagonist"});
    if(V.comp==="personnages"){
      ofigure2(hctx,p.x,p.y,r,pal,u);
      /* sometimes a small companion stands aside */
      if(rnd()<.3){
        const p2=place(r*.32,r*.5,r*.45);
        if(p2)ofigure(hctx,p2.x,p2.y,r*.4,pal,u);
      }
    }else{
      const roll=rnd();
      hctx.fillStyle=pickC();
      if(roll<.45){
        oblob(hctx,p.x,p.y,r*.7,R(.6,1),R(0,3.14));
        if(rnd()<.5){ /* pierce it with an eye */
          hctx.fillStyle=C2.white;
          oeye(hctx,p.x+R(-.2,.2)*r,p.y+R(-.2,.2)*r,r*.34,R(-.4,.4),u,C2.black);
        }
      }else if(roll<.7){
        hctx.fillStyle=lineC;
        ostar(hctx,p.x,p.y,r*.85,u);
      }else{
        omoon(hctx,p.x,p.y,r*.6,R(0,6.28));
      }
    }
    prog.done++;
    yield;
  }
  /* mid-weight forms */
  const midKinds=["disc","halfdisc","blob","star","moon","eye","ladder","bird","flag","dabs","comb","scribble"];
  for(let i=0;i<counts.mid;i++){
    const r=base*(V.comp==="constellation"?R(.035,.075):R(.06,.12));
    MIRO_MED=(q=>q<.55?"ink":q<.85?"crayon":"dry")(rnd());
    const p=place(r);if(!p)continue;
    const kind=midKinds[(rnd()*midKinds.length)|0];
    const c=pickC();
    statusCb(0,0,{c,miro:({disc:"a sun",halfdisc:"a divided disc",blob:"a wandering form",star:"a star",moon:"a crescent",eye:"an eye",ladder:"the ladder of escape",bird:"a bird",flag:"a pennant",dabs:"fingertip dabs",comb:"a rake of strokes",scribble:"a crayon scribble"})[kind]||"a form"});
    hctx.fillStyle=c;
    if(kind==="disc"){
      odisc(hctx,p.x,p.y,r*.8);
      if(rnd()<.5){hctx.fillStyle=lineC;oring(hctx,p.x,p.y,r*.95,2.4*u);}
    }else if(kind==="halfdisc"){
      const c2=pickC(), a0=R(0,6.28);
      hctx.beginPath();hctx.arc(p.x,p.y,r*.85,a0,a0+Math.PI);hctx.closePath();hctx.fill();
      hctx.fillStyle=c2===c?lineC:c2;
      hctx.beginPath();hctx.arc(p.x,p.y,r*.85,a0+Math.PI,a0+2*Math.PI);hctx.closePath();hctx.fill();
      hctx.fillStyle=lineC;oring(hctx,p.x,p.y,r*.85,2.2*u);
      for(let k=0;k<8;k++){const a=k*.785;hstamp(p.x+Math.cos(a)*r*.7,p.y+Math.sin(a)*r*.7,r*.2,.1);}
    }else if(kind==="blob"){
      oblob(hctx,p.x,p.y,r*.8,R(.55,1),R(0,3.14),rnd()<.3);
    }else if(kind==="star"){
      hctx.fillStyle=rnd()<.7?lineC:c;
      ostar(hctx,p.x,p.y,r,u);
    }else if(kind==="moon"){
      omoon(hctx,p.x,p.y,r*.8,R(0,6.28));
    }else if(kind==="eye"){
      hctx.fillStyle=C2.white;
      oeye(hctx,p.x,p.y,r,R(-.5,.5),u,c===C2.white?C2.black:c,lineC);
    }else if(kind==="ladder"){
      hctx.fillStyle=lineC;
      oladder(hctx,p.x,p.y,r*2.4,R(-1.8,-1.2),u);
    }else if(kind==="bird"){
      hctx.fillStyle=lineC;
      obird(hctx,p.x,p.y,r,u);
    }else if(kind==="dabs"){
      hctx.fillStyle=lineC;
      dabCluster(hctx,p.x,p.y,r,u);
    }else if(kind==="comb"){
      hctx.fillStyle=lineC;
      mComb(hctx,p.x,p.y,r,R(-.4,.4),3*u);
    }else if(kind==="scribble"){
      hctx.fillStyle=lineC;
      crayonScribble(hctx,p.x,p.y,r*1.2,r*R(.5,.8),R(2,3.5),u);
    }else{
      hctx.fillStyle=lineC;
      obrush(hctx,[[p.x,p.y+r],[p.x,p.y-r]],2.4*u,false);
      hctx.fillStyle=c;
      hctx.beginPath();
      hctx.moveTo(p.x,p.y-r);
      hctx.lineTo(p.x+r*R(.9,1.3),p.y-r*R(.55,.75));
      hctx.lineTo(p.x,p.y-r*R(.3,.45));
      hctx.closePath();hctx.fill();
      for(let k=0;k<4;k++)hstamp(p.x+R(0,.8)*r,p.y-r*R(.4,.9),r*.18,.08);
    }
    MIRO_MED="ink";
    prog.done++;
    if(i%2===0)yield;
  }
  /* small accents */
  statusCb(0,0,{c:lineC,miro:"small wanderers"});
  for(let i=0;i<counts.small;i++){
    const r=base*R(.008,.024);
    const p=place(r*2);if(!p)continue;
    const c=pickC();
    hctx.fillStyle=c;
    const roll=rnd();
    if(roll<.42)odisc(hctx,p.x,p.y,r);
    else if(roll<.66){hctx.fillStyle=lineC;ostar(hctx,p.x,p.y,r*2.2,u);}
    else if(roll<.8)odotsTrail(hctx,p.x,p.y,r*3,3+((rnd()*3)|0),R(0,6.28));
    else{hctx.fillStyle=lineC;odisc(hctx,p.x,p.y,r*.8);}
    prog.done++;
    if(i%3===0)yield;
  }
  /* connectors: thin lines wandering between forms */
  statusCb(0,0,{c:lineC,miro:"the wandering line"});
  hctx.fillStyle=lineC;
  for(let i=0;i<counts.conn&&placed.length>2;i++){
    const a=placed[(rnd()*placed.length)|0];
    /* the line prefers a nearby companion */
    const near=placed.filter(o=>o!==a)
      .sort((p1,p2)=>Math.hypot(p1.x-a.x,p1.y-a.y)-Math.hypot(p2.x-a.x,p2.y-a.y))
      .slice(0,4);
    const b=near[(rnd()*near.length)|0];
    if(!b)continue;
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy);
    if(len>base*.55&&rnd()<.6)continue;       // long reaches stay rare
    const nx=-dy/len, ny=dx/len;
    const bow1=R(-.22,.22)*len, bow2=R(-.22,.22)*len;
    const pts=[];
    for(let t=0;t<=14;t++){
      const tt=t/14;
      const wob=Math.sin(Math.PI*tt)*((1-tt)*bow1+tt*bow2);
      pts.push([a.x+dx*tt+nx*wob+R(-1.5,1.5)*u,
                a.y+dy*tt+ny*wob+R(-1.5,1.5)*u]);
    }
    obrush(hctx,pts,2*u,true);
    if(rnd()<.4){
      const m=pts[7];
      hctx.fillStyle=pickC();odisc(hctx,m[0],m[1],base*R(.006,.012));
      hctx.fillStyle=lineC;
    }
    prog.done++;
    yield;
  }
  return {hm,W,H,u,pal,placed,base};
}

/* one director round in the dream wing: place what Claude asks for */
function* miroRound(C,acts,prog){
  prog.total+=acts.length;
  const C2=C.pal.colors;
  const lineC=C.pal.line==="pale"?C2.white:C2.black;
  for(const a of acts){
    const c=C2[a.color]||lineC;
    const x=clamp(+a.x||.5,0,1)*C.W, y=clamp(+a.y||.5,0,1)*C.H;
    const r=clamp(+a.r||.05,.015,.2)*Math.max(C.W,C.H);
    hctx.fillStyle=c;
    if(a.type==="star"){hctx.fillStyle=rnd()<.6?lineC:c;ostar(hctx,x,y,r,C.u);}
    else if(a.type==="blob")oblob(hctx,x,y,r*.8,R(.55,1),R(0,3.14));
    else if(a.type==="moon")omoon(hctx,x,y,r*.7,R(0,6.28));
    else if(a.type==="dots")odotsTrail(hctx,x,y,r,3+((rnd()*3)|0),R(0,6.28));
    else if(a.type==="line"){
      hctx.fillStyle=lineC;
      const ang=R(0,6.28),ca=Math.cos(ang),sa=Math.sin(ang);
      const pts=[];
      for(let t=0;t<=10;t++){const tt=t/10-.5;
        pts.push([x+ca*tt*2*r+R(-.1,.1)*r,y+sa*tt*2*r+R(-.1,.1)*r]);}
      obrush(hctx,pts,2*C.u,true);
    }
    else odisc(hctx,x,y,r*.6);
    prog.done++;
    yield;
  }
}

function* miroGenerate(seed,fmtKey,palKey,statusCb,prog={},directives){
  if(prog.total===undefined){prog.total=1;prog.done=0;}
  const C=yield* miroPhase(seed,fmtKey,palKey,statusCb,prog);
  if(directives&&directives.length)
    for(const acts of directives)yield* miroRound(C,acts,prog);
  yield* varnishPhase(C,statusCb,prog);
}

/* ---- house emblems: hand-drawn stroke designs, one wing of variety ---- */
const HOUSE_DESIGNS={
chaine:[
 {subject:"Le Vaisseau",mirror:true,strokes:[
  {t:"line",c:1,w:3,pts:[[0,.52],[.45,.52],[.6,.36],[0,.36]]},
  {t:"line",c:1,w:2,pts:[[.02,.36],[.02,-.6]]},
  {t:"satin",c:2,x:.07,y:-.54,ang:78,len:.4,wid:.2},
  {t:"satin",c:2,x:.09,y:-.26,ang:80,len:.48,wid:.26},
  {t:"line",c:0,w:1,pts:[[.02,-.6],[.45,.52]]},
  {t:"line",c:0,w:1,pts:[[.02,-.6],[.3,-.46],[.02,-.3]]},
  {t:"arc",c:3,w:1,x:0,y:.64,rx:.5,ry:.07,a0:10,a1:170,rot:0},
  {t:"arc",c:3,w:1,x:.32,y:.7,rx:.22,ry:.05,a0:10,a1:170,rot:0},
  {t:"knot",c:0,x:.02,y:-.66,r:.03},
  {t:"line",c:0,w:1,pts:[[.02,-.66],[.16,-.72],[.02,-.7]]}]},
 {subject:"L'Ancre couronnée",mirror:true,strokes:[
  {t:"arc",c:1,w:2,x:0,y:-.5,rx:.12,ry:.12,a0:-90,a1:90,rot:0},
  {t:"line",c:1,w:3,pts:[[0,-.38],[0,.4]]},
  {t:"line",c:1,w:2,pts:[[0,-.16],[.3,-.16]]},
  {t:"knot",c:0,x:.3,y:-.16,r:.025},
  {t:"arc",c:1,w:3,x:0,y:.12,rx:.42,ry:.38,a0:20,a1:88,rot:0},
  {t:"line",c:1,w:2,pts:[[.42,.22],[.5,.1],[.34,.1]]},
  {t:"arc",c:0,w:1,x:0,y:0,rx:.66,ry:.66,a0:-58,a1:58,rot:0},
  {t:"satin",c:2,x:.1,y:-.74,ang:-25,len:.18,wid:.1},
  {t:"knot",c:0,x:0,y:-.78,r:.03}]},
 {subject:"La Rose des vents",mirror:true,strokes:[
  {t:"satin",c:1,x:0,y:-.06,ang:-90,len:.62,wid:.13},
  {t:"satin",c:1,x:0,y:.06,ang:90,len:.62,wid:.13},
  {t:"satin",c:1,x:.06,y:0,ang:0,len:.62,wid:.13},
  {t:"satin",c:0,x:.05,y:-.05,ang:-45,len:.4,wid:.09},
  {t:"satin",c:0,x:.05,y:.05,ang:45,len:.4,wid:.09},
  {t:"arc",c:2,w:1,x:0,y:0,rx:.5,ry:.5,a0:-90,a1:90,rot:0},
  {t:"knot",c:0,x:0,y:0,r:.05},
  {t:"knot",c:2,x:0,y:-.72,r:.03},{t:"knot",c:2,x:.72,y:0,r:.03},
  {t:"knot",c:2,x:0,y:.72,r:.03}]}
],
cavalcade:[
 {subject:"Le Fer couronné",mirror:true,strokes:[
  {t:"arc",c:1,w:3,x:0,y:-.04,rx:.42,ry:.48,a0:-65,a1:115,rot:0},
  {t:"knot",c:0,x:.4,y:-.2,r:.025},{t:"knot",c:0,x:.44,y:.08,r:.025},
  {t:"knot",c:0,x:.36,y:.34,r:.025},
  {t:"line",c:2,w:2,pts:[[-.02,-.52],[.5,.46]]},
  {t:"knot",c:2,x:.52,y:.5,r:.03},
  {t:"arc",c:3,w:1,x:.2,y:-.5,rx:.18,ry:.1,a0:160,a1:380,rot:-20},
  {t:"satin",c:0,x:.06,y:-.66,ang:-30,len:.16,wid:.09},
  {t:"knot",c:0,x:0,y:-.7,r:.03}]},
 {subject:"La Roue de calèche",mirror:true,strokes:[
  {t:"arc",c:1,w:3,x:0,y:0,rx:.6,ry:.6,a0:-90,a1:90,rot:0},
  {t:"arc",c:0,w:1,x:0,y:0,rx:.52,ry:.52,a0:-90,a1:90,rot:0},
  {t:"line",c:1,w:2,pts:[[0,-.6],[0,.6]]},
  {t:"line",c:1,w:2,pts:[[0,0],[.6,0]]},
  {t:"line",c:1,w:2,pts:[[0,0],[.42,-.42]]},
  {t:"line",c:1,w:2,pts:[[0,0],[.42,.42]]},
  {t:"arc",c:0,w:2,x:0,y:0,rx:.1,ry:.1,a0:-90,a1:90,rot:0},
  {t:"knot",c:0,x:0,y:0,r:.04},
  {t:"knot",c:2,x:.6,y:0,r:.025},{t:"knot",c:2,x:0,y:-.6,r:.025},
  {t:"knot",c:2,x:0,y:.6,r:.025}]},
 {subject:"L'Étrier rubané",mirror:true,strokes:[
  {t:"arc",c:1,w:3,x:0,y:-.12,rx:.4,ry:.46,a0:180,a1:360,rot:0},
  {t:"line",c:1,w:2,pts:[[.4,-.12],[.34,.32]]},
  {t:"line",c:1,w:3,pts:[[0,.34],[.36,.34]]},
  {t:"arc",c:2,w:2,x:.18,y:-.58,rx:.3,ry:.14,a0:150,a1:390,rot:-15},
  {t:"satin",c:2,x:.4,y:-.5,ang:35,len:.2,wid:.1},
  {t:"arc",c:0,w:1,x:0,y:.02,rx:.56,ry:.6,a0:-80,a1:80,rot:0},
  {t:"knot",c:0,x:0,y:-.62,r:.03},{t:"knot",c:0,x:0,y:.62,r:.03}]}
],
jardin:[
 {subject:"Le Bouquet",mirror:true,strokes:[
  {t:"line",c:0,w:2,pts:[[.16,.24],[.12,.6],[0,.62]]},
  {t:"line",c:0,w:1,pts:[[0,.3],[.16,.3]]},
  {t:"arc",c:2,w:1,x:0,y:.1,rx:.18,ry:.3,a0:-90,a1:20,rot:0},
  {t:"satin",c:1,x:.2,y:-.3,ang:-60,len:.26,wid:.16},
  {t:"satin",c:1,x:.42,y:-.06,ang:-15,len:.24,wid:.15},
  {t:"satin",c:3,x:.05,y:-.5,ang:-90,len:.26,wid:.16},
  {t:"satin",c:2,x:.3,y:.02,ang:130,len:.2,wid:.1},
  {t:"satin",c:2,x:.12,y:-.2,ang:75,len:.2,wid:.1},
  {t:"knot",c:0,x:.2,y:-.42,r:.03},{t:"knot",c:0,x:.46,y:-.18,r:.03},
  {t:"knot",c:0,x:.05,y:-.62,r:.03}]},
 {subject:"Le Papillon",mirror:true,strokes:[
  {t:"satin",c:1,x:.08,y:-.1,ang:-38,len:.5,wid:.34},
  {t:"satin",c:2,x:.08,y:.08,ang:35,len:.4,wid:.26},
  {t:"arc",c:0,w:1,x:.3,y:-.26,rx:.26,ry:.2,a0:-160,a1:80,rot:-38},
  {t:"line",c:1,w:2,pts:[[0,-.3],[0,.3]]},
  {t:"knot",c:1,x:0,y:-.36,r:.035},
  {t:"arc",c:1,w:1,x:.08,y:-.5,rx:.12,ry:.14,a0:180,a1:300,rot:0},
  {t:"knot",c:0,x:.26,y:-.16,r:.03},{t:"knot",c:0,x:.2,y:.14,r:.025},
  {t:"knot",c:3,x:.4,y:-.06,r:.02}]},
 {subject:"L'Oiseau chanteur",mirror:false,strokes:[
  {t:"line",c:0,w:2,pts:[[-.7,.34],[.7,.18]]},
  {t:"satin",c:2,x:-.5,y:.32,ang:-140,len:.18,wid:.09},
  {t:"satin",c:2,x:.45,y:.2,ang:-30,len:.18,wid:.09},
  {t:"satin",c:2,x:.1,y:.28,ang:-100,len:.16,wid:.08},
  {t:"satin",c:1,x:-.16,y:.1,ang:-28,len:.44,wid:.26},
  {t:"satin",c:1,x:-.3,y:-.22,ang:160,len:.3,wid:.12},
  {t:"satin",c:3,x:-.05,y:-.03,ang:-40,len:.22,wid:.1},
  {t:"arc",c:1,w:2,x:.26,y:-.22,rx:.12,ry:.11,a0:-180,a1:60,rot:0},
  {t:"line",c:0,w:1,pts:[[.37,-.24],[.5,-.2]]},
  {t:"knot",c:0,x:.3,y:-.26,r:.02},
  {t:"knot",c:0,x:-.45,y:-.32,r:.02}]}
]};

/* each family grows its own leaf */
const FAM_FROND={
  chaine:{leaf:.09,leafW:.2,gap:.038},      /* feathery kelp */
  cavalcade:{leaf:.17,leafW:.55,gap:.075},  /* rounded laurel */
  jardin:{leaf:.14,leafW:.34,gap:.05}       /* garden fern */
};
/* corner-cutting smoothing: an angular polyline becomes one flowing thread */
function chaikin(pts,iters){
  for(let k=0;k<iters;k++){
    if(pts.length<3)break;
    const out=[pts[0]];
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1];
      out.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25]);
      out.push([a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);
    }
    out.push(pts[pts.length-1]);
    pts=out;
  }
  return pts;
}

/* paint a designed stroke group at any position and scale */
function drawDesignStrokes(ctx,strokes,cx,cy,RAD,THREADS,wTh,mirror,u){
  const pass=()=>{
    for(const st of strokes){
      ctx.fillStyle=THREADS[st.c]||THREADS[1];
      const w=wTh*(0.55+0.3*(st.w||1));
      if(st.t==="line"&&st.pts&&st.pts.length>1){
        const sm=chaikin(st.pts.map(p=>[cx+p[0]*RAD,cy+p[1]*RAD]),2);
        for(let j=1;j<sm.length;j++)
          eline(ctx,sm[j-1][0],sm[j-1][1],sm[j][0],sm[j][1],w,.06);
      }else if(st.t==="arc"){
        earc(ctx,cx+st.x*RAD,cy+st.y*RAD,st.rx*RAD,st.ry*RAD,
             st.a0*Math.PI/180,st.a1*Math.PI/180,(st.rot||0)*Math.PI/180,w,.06);
      }else if(st.t==="satin"){
        satinO(ctx,cx+st.x*RAD,cy+st.y*RAD,(st.ang||0)*Math.PI/180,
               st.len*RAD,st.wid*RAD,w*.85);
      }else if(st.t==="knot"){
        knot(ctx,cx+st.x*RAD,cy+st.y*RAD,Math.max(wTh*.6,st.r*RAD));
      }
    }
  };
  pass();
  if(mirror){
    ctx.save();
    ctx.translate(cx,cy);ctx.scale(-1,1);ctx.translate(-cx,-cy);
    pass();
    ctx.restore();
  }
}

/* ---- the carré itself ---- */
function* scarfPhase(seed,palKey,motifKey,statusCb,prog,design){
  rnd=mulberry32(seed);
  const S=LONG_EDGE;
  hi.width=S;hi.height=S;
  const W=S,H=S,u=S/1000;
  const pal=SCARF_PALETTES[palKey]||SCARF_PALETTES.flamme;
  const motif=(motifKey in SCARF_MOTIFS)?motifKey:"chaine";

  hctx.fillStyle=pal.ground;
  hctx.fillRect(0,0,S,S);

  /* height field starts as silk twill: fine diagonal ribs */
  const hm=document.createElement("canvas");
  hm.width=Math.max(2,Math.ceil(S/2));
  hm.height=Math.max(2,Math.ceil(S/2));
  const hmx=hm.getContext("2d");
  hmx.fillStyle="#000";hmx.fillRect(0,0,hm.width,hm.height);
  hmx.globalCompositeOperation="lighter";
  hmx.save();
  hmx.translate(hm.width/2,hm.height/2);
  hmx.rotate(Math.PI/4);
  const D=Math.ceil(Math.hypot(hm.width,hm.height));
  const pitch=Math.max(3,Math.round(2.1*u));
  hmx.fillStyle="rgba(255,255,255,.008)";
  for(let y=-D;y<=D;y+=pitch)hmx.fillRect(-D,y,2*D,1);
  hmx.restore();
  hmx.setTransform(.5,0,0,.5,0,0);
  REL=hmx;RELU=u;
  LIGHT_ANG=-2.356+R(-.2,.2);
  yield;

  const cx2=S/2, cy2=S/2;
  const b0=.045*S, b1=.155*S;
  const gold=pal.gold, T0=pal.threads[0], T1=pal.threads[1], T2=pal.threads[2];
  const wTh=2.3*u;                       // standard thread gauge

  /* every commission rolls its own architecture — seeded, so each work
     is its own design yet rehangs identically */
  const V={
    innerFrame:rnd()<.7,
    fringe:rnd()<.75,
    braid:rnd()<.8,
    knotRing:rnd()<.7,
    tickBand:rnd()<.65,
    satTwo:rnd()<.75,
    rowN:10+((rnd()*5)|0),
    garN:[12,16,20][(rnd()*3)|0],
    petals:[8,10,12][(rnd()*3)|0],
    scStyle:(rnd()*3)|0,                 // 0 scallops, 1 dot pairs, 2 ticks
    cornerLoz:rnd()<.75
  };
  V.medR=V.innerFrame?(.262+rnd()*.012):(.275+rnd()*.04);
  /* composition: the flowing garden or the classic medallion */
  V.comp=(design&&(design.composition==="garden"||design.composition==="medallion"))
    ?design.composition
    :(rnd()<(motif==="jardin"?.62:.42)?"garden":"medallion");
  const GARDEN=V.comp==="garden";
  /* declutter the medallion: fewer simultaneous treatments, calmer field */
  if(rnd()<.5)V.fringe=false;
  if(V.fringe&&V.braid&&rnd()<.6)V.braid=false;
  if(V.knotRing&&V.tickBand){if(rnd()<.5)V.knotRing=false;else V.tickBand=false;}
  let centre="design";
  if(GARDEN)centre="garden";
  else if(!design||!design.strokes||!design.strokes.length){
    const r0=rnd();
    if(r0<.42){
      const lib=HOUSE_DESIGNS[motif]||HOUSE_DESIGNS.chaine;
      design={...lib[(rnd()*lib.length)|0]};
      centre="emblem";
    }else centre=r0<.62?"star":"rosette";
  }
  const DENS=design&&design.density!==undefined?design.density:R(.45,.85);
  /* which fractal families this carré grows, and how much of them */
  const famF=FAM_FRACTALS[motif]||FAM_FRACTALS.jardin;
  V.fr1=famF[(rnd()*famF.length)|0];
  V.fr2=rnd()<.45?V.fr1:famF[(rnd()*famF.length)|0];
  const fu=rnd();
  V.frUse=fu<.45?"rich":fu<.65?"wreath":fu<.85?"corners":"none";
  const FOPT=()=>({u,w:2.2*u,...(FAM_FROND[motif]||FAM_FROND.jardin)});
  /* on the medallion's quiet architecture, sprays and wreaths stay
     composed: airy styles fold back into scrollwork */
  const CALM={fern:"fern",coral:"coral",scroll:"scroll",
              plume:"scroll",burst:"scroll",ribbon:"scroll"};
  V.fr1c=CALM[V.fr1]||"scroll";
  V.fr2c=CALM[V.fr2]||"scroll";

  const jobs=[];
  const J=(c,label,fn)=>jobs.push({c,label,fn});

  if(GARDEN){
    /* ====== the garden, composed: geometry and repetition first ======
       a carré is built on symmetry — identical arms repeated about the
       centre — with only the rare commission left free-growing */
    const F=pal.flora, A=pal.accents;
    const dk=darkThread(F[3]);
    V.gsym=(g=>g<.5?4:g<.82?2:1)(rnd());
    const ARM=(fn)=>V.gsym>1?symArms(hctx,V.gsym,S/2,S/2,fn):fn();
    if(rnd()<.7)J(pal.gold,"a quiet keyline",function*(){
      hctx.fillStyle=pal.gold;
      const r=b0*.9;
      eline(hctx,r,r,S-r,r,wTh*.8);eline(hctx,S-r,r,S-r,S-r,wTh*.8);yield;
      eline(hctx,S-r,S-r,r,S-r,wTh*.8);eline(hctx,r,S-r,r,r,wTh*.8);yield;
    });
    /* layer 1: the under-canopy enters from the top edge of every arm */
    J(pal.flora[3],FR_LABEL[V.fr1]+", under-canopy",function*(){
      const big={...FOPT(),w:2.4*u,branches:2};
      const per=Math.round(((9+rnd()*5)*(.6+.6*DENS))/V.gsym);
      ARM(()=>{
        for(let i=0;i<per;i++){
          const t=R(.08,.92), inset=b0*1.6;
          const x=t*S, y=inset;
          const inward=Math.atan2(S/2-y,S/2-x)+R(-.45,.45);
          fractal(hctx,V.fr1,x,y,inward,
            Math.min(S*R(.16,.3),V.fr1==="burst"?S*.12:Infinity),
            {...big,dense:true},V.fr1==="burst"?0:1,null,F[3]);
        }
      });
      prog.done+=4;
      yield;
    });
    /* identical foliage spills at all four corners */
    J(pal.flora[2],"corner spills",function*(){
      const cnr={...FOPT(),w:2.4*u};
      symArms(hctx,4,S/2,S/2,()=>{
        const toC=Math.PI/4;
        const n=4+((rnd()*3)|0);
        for(let k=0;k<n;k++){
          const a=toC+1.3*(k/Math.max(1,n-1)-.5)+R(-.08,.08);
          fractal(hctx,V.fr1,b0,b0,a,
            Math.min(S*R(.14,.24),V.fr1==="burst"?S*.12:V.fr1==="scroll"?S*.17:Infinity),
            {...cnr,curl:Math.sign(Math.cos(a)||1)*R(.5,1)},0,
            dk,F[2+(k%2)]);
        }
        if(V.fr1==="fern"||V.fr2==="fern"){
          hctx.fillStyle=F[1];
          vine(hctx,b0,b0,toC+R(-.4,.4),S*R(.14,.22),u,F[1],pal.accents[0]);
        }
      });
      prog.done+=4;
      yield;
    });
    /* layer 2: a central crown, and satellite crowns on the arms */
    J(pal.flora[1],FR_LABEL[V.fr1]+" crowns",function*(){
      const palm={...FOPT(),w:2.6*u,leaf:.125,gap:.04};
      const lenCap=V.fr1==="burst"?S*.13:V.fr1==="scroll"?S*.17:Infinity;
      const crown=(x,y,r,n,a0,sp)=>{
        const dep=V.fr1==="coral"?1:0;
        for(let k=0;k<n;k++){
          const a=a0+sp*(k/Math.max(1,n-1)-.5)+R(-.08,.08);
          const sg=Math.sign(Math.cos(a)||(rnd()<.5?1:-1));
          fractal(hctx,V.fr1,
            V.fr1==="burst"?x+Math.cos(a)*r*R(.3,.7):x,
            V.fr1==="burst"?y+Math.sin(a)*r*R(.3,.7):y,
            a,Math.min(r*R(.85,1.15),lenCap),
            {...palm,curl:sg*R(.8,1.5),bare:.05,dense:true},dep,
            dk,F[k%2?1:0]);
        }
      };
      /* the centre crown, mirrored within itself for poise */
      symArms(hctx,2,S/2,S/2,()=>{
        crown(S/2,S*R(.6,.66),S*R(.24,.3),5,-Math.PI/2+R(-.15,0),1.4);
      });
      prog.done+=1.5;yield;
      /* satellite crowns riding each arm */
      ARM(()=>{
        crown(S/2,S*R(.16,.22),S*R(.15,.2),5+((rnd()*2)|0),Math.PI/2,2.1);
      });
      prog.done+=1.5;
      yield;
    });
    /* layer 3: mid growth, sown in one wedge and repeated */
    J(pal.flora[2],"mid growth",function*(){
      const mid={...FOPT(),branches:2};
      const per=Math.round(((13+rnd()*7)*(.5+DENS))/V.gsym);
      ARM(()=>{
        for(let i=0;i<per;i++){
          const aw=-Math.PI/2+R(-1,1)*Math.PI/V.gsym*.92;
          const rr=S*(.12+Math.sqrt(rnd())*.36);
          const x=S/2+Math.cos(aw)*rr, y=S/2+Math.sin(aw)*rr;
          fractal(hctx,i%3===2?V.fr2:V.fr1,x,y,R(0,6.28),
            Math.min(S*R(.1,.2),V.fr1==="scroll"?S*.14:Infinity),
            mid,rnd()<.5?1:0,null,F[2-(i%2)]);
        }
      });
      prog.done+=4;
      yield;
    });
    /* layer 4: the colour story — a garland ring and repeated bursts */
    J(pal.accents[0],"flower garland",function*(){
      if(V.gsym>1){
        /* a ring of identical blooms about the centre */
        if(rnd()<.7){
          const K=[8,10,12][(rnd()*3)|0];
          const ringR=S*R(.24,.33);
          symArms(hctx,K,S/2,S/2,()=>{
            flowerBurst(hctx,S/2,S/2-ringR,S*R(.03,.045),u,A[0],pal.gold);
          });
        }
        /* repeated accent clusters on the arms */
        const acR=S*R(.1,.15), acD=S*R(.3,.42);
        ARM(()=>{
          const n=3+((rnd()*3)|0);
          for(let i=0;i<n;i++){
            const a=R(0,6.28),rr=Math.sqrt(rnd())*acR;
            flowerBurst(hctx,S/2+Math.cos(-Math.PI/4)*acD+Math.cos(a)*rr,
                        S/2+Math.sin(-Math.PI/4)*acD+Math.sin(a)*rr,
                        S*R(.02,.042),u,A[i%A.length],pal.gold);
          }
          hctx.fillStyle=A[1];
          vine(hctx,S/2+Math.cos(-Math.PI/4)*acD,S/2+Math.sin(-Math.PI/4)*acD,
               R(0,6.28),S*R(.1,.16),u,A[1],pal.gold);
        });
        /* the grand bloom holds the exact centre */
        hctx.fillStyle=A[0];
        for(let i=0;i<10;i++){
          const a=i*.628+R(-.05,.05);
          satinO(hctx,S/2+Math.cos(a)*S*.02,S/2+Math.sin(a)*S*.02,a,S*.05,S*.024,2*u);
        }
        hctx.fillStyle=A[2];
        for(let i=0;i<8;i++){
          const a=i*.785+.3;
          satin(hctx,S/2+Math.cos(a)*S*.014,S/2+Math.sin(a)*S*.014,a,S*.028,S*.014,1.8*u);
        }
        hctx.fillStyle=pal.gold;
        knot(hctx,S/2,S/2,3.4*u);
      }else{
        /* the free garden keeps its loose colour story */
        const accents=(design&&design.accents&&design.accents.length
          ?design.accents.map(a=>({x:a.x*S,y:a.y*S,r:a.r*S}))
          :(()=>{const n=2+((rnd()*2)|0),out=[];
            for(let i=0;i<n;i++)out.push({
              x:S*(i%2?R(.6,.85):R(.15,.4)),y:S*R(.12,.45),r:S*R(.1,.17)});
            return out;})());
        for(const ac of accents){
          const n=4+((rnd()*4)|0);
          for(let i=0;i<n;i++){
            const a=R(0,6.28),rr=Math.sqrt(rnd())*ac.r;
            flowerBurst(hctx,ac.x+Math.cos(a)*rr,ac.y+Math.sin(a)*rr,
                        S*R(.022,.05),u,A[i%A.length],pal.gold);
          }
          hctx.fillStyle=A[1];
          vine(hctx,ac.x,ac.y,R(0,6.28),S*R(.12,.2),u,A[1],pal.gold);
        }
        const nStray=3+((rnd()*3)|0);
        for(let i=0;i<nStray;i++)
          flowerBurst(hctx,S*R(.1,.9),S*R(.1,.9),S*R(.014,.028),u,A[(rnd()*A.length)|0],pal.gold);
      }
      prog.done+=4;
      yield;
    });
    /* layer 5: small sprigs sown per arm; birds only in the free garden */
    J(pal.flora[0],"small wanderers",function*(){
      const spr={...FOPT(),w:1.8*u};
      const per=Math.round(((20+rnd()*14)*(.5+DENS))/V.gsym);
      ARM(()=>{
        for(let i=0;i<per;i++){
          const aw=-Math.PI/2+R(-1,1)*Math.PI/V.gsym*.95;
          const rr=S*(.08+Math.sqrt(rnd())*.4);
          fractal(hctx,i%2?V.fr2:V.fr1,S/2+Math.cos(aw)*rr,S/2+Math.sin(aw)*rr,
            R(0,6.28),S*R(.035,.07),spr,0,null,F[(rnd()*3)|0]);
        }
      });
      if(V.gsym===1){
        hctx.fillStyle=A[0];
        const nb=2+((rnd()*4)|0);
        const bx=S*R(.35,.65),by=S*R(.3,.45);
        for(let i=0;i<nb;i++)sbird(hctx,bx+R(-.06,.06)*S,by+R(-.04,.04)*S,S*R(.008,.014),u);
      }
      prog.done+=4;
      yield;
    });
  }

  if(!GARDEN)
  /* printed silk border band */
  J(pal.border,"border silk",function*(){
    hctx.fillStyle=pal.border;
    hctx.fillRect(b0,b0,S-2*b0,b1-b0);
    hctx.fillRect(b0,S-b1,S-2*b0,b1-b0);
    hctx.fillRect(b0,b1,b1-b0,S-2*b1);
    hctx.fillRect(S-b1,b1,b1-b0,S-2*b1);
    yield;
  });
  /* diaper pattern worked into the border band */
  if(!GARDEN)J(gold,"band diaper",function*(){
    const yc0=b0+.018*S, yc1=b1-.018*S, stepD=.024*S;
    for(let side=0;side<4;side++){
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(side*Math.PI/2);hctx.translate(-cx2,-cy2);
      hctx.fillStyle=darkThread(pal.border);
      let col=0;
      for(let x=b0+stepD;x<S-b0-stepD*.5;x+=stepD,col++){
        const y=(col%2?yc0+(yc1-yc0)*.3:yc0+(yc1-yc0)*.7);
        const d2=.006*S;
        eline(hctx,x-d2,y-d2,x+d2,y+d2,wTh*.45,.03);
        eline(hctx,x-d2,y+d2,x+d2,y-d2,wTh*.45,.03);
      }
      hctx.restore();
      if(side&1)yield;
    }
    yield;
  });
  /* gold keylines, stitched */
  if(!GARDEN)J(gold,"gold keyline",function*(){
    hctx.fillStyle=gold;
    for(const r of [b0,b1]){
      eline(hctx,r,r,S-r,r,wTh);yield;
      eline(hctx,S-r,r,S-r,S-r,wTh);yield;
      eline(hctx,S-r,S-r,r,S-r,wTh);yield;
      eline(hctx,r,S-r,r,r,wTh);yield;
    }
    hctx.fillStyle=T2;
    const r2=b1+.012*S;
    eline(hctx,r2,r2,S-r2,r2,wTh*.7);
    eline(hctx,S-r2,r2,S-r2,S-r2,wTh*.7);yield;
    eline(hctx,S-r2,S-r2,r2,S-r2,wTh*.7);
    eline(hctx,r2,S-r2,r2,r2,wTh*.7);yield;
  });
  /* a scallop fringe hanging from the outer keyline, dots at its feet */
  if(!GARDEN&&V.fringe)J(gold,"band fringe",function*(){
    const stepF=.018*S;
    for(let side=0;side<4;side++){
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(side*Math.PI/2);hctx.translate(-cx2,-cy2);
      hctx.fillStyle=darkThread(pal.border);
      for(let x=b0+stepF;x<S-b0-stepF*.5;x+=stepF)
        earc(hctx,x,b0+.004*S,stepF*.42,.006*S,0,Math.PI,0,wTh*.45,.04);
      hctx.fillStyle=gold;
      for(let x=b0+stepF;x<S-b0-stepF*.5;x+=stepF)
        stamp(hctx,x-stepF*.5,b0+.012*S,wTh*.4);
      hctx.restore();
      if(side&1)yield;
    }
    yield;
  });
  /* a rope braid running just inside the inner keyline */
  if(!GARDEN&&V.braid)J(gold,"rope braid",function*(){
    const rb=b1-.012*S, stepB=.011*S, dl=.0042*S;
    hctx.fillStyle=gold;
    for(let side=0;side<4;side++){
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(side*Math.PI/2);hctx.translate(-cx2,-cy2);
      for(let x=b1+stepB;x<S-b1;x+=stepB)
        eline(hctx,x-dl,rb+dl,x+dl,rb-dl,wTh*.55,.05);
      hctx.restore();
      if(side&1)yield;
    }
    yield;
  });
  /* the border row, repeated on all four sides */
  if(!GARDEN)J(T2,"border motifs",function*(){
    const yc=(b0+b1)/2, n=V.rowN, x0=b1+.02*S, x1=S-b1-.02*S;
    for(let side=0;side<4;side++){
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(side*Math.PI/2);hctx.translate(-cx2,-cy2);
      for(let i=0;i<n;i++){
        const x=x0+(x1-x0)*i/(n-1), sz=.052*S;
        hctx.fillStyle=T2;
        if(motif==="chaine")mLink(hctx,x,yc,sz,wTh);
        else if(motif==="cavalcade")(i%2?mBit:mStirrup)(hctx,x,yc,sz*.9,wTh);
        else mLeafStem(hctx,x,yc,sz,0,wTh*.9,T2,gold);
        if(i<n-1){ /* a gold pip or a leaf sprig between neighbours */
          const mxp=x+(x1-x0)/(n-1)/2;
          if(i%2){
            hctx.fillStyle=gold;
            knot(hctx,mxp,yc,wTh*.8);
          }else if(V.frUse!=="none"){
            const ff={...FOPT(),w:1.5*u};
            fractal(hctx,V.fr1c,mxp,yc+.012*S,-Math.PI/2,.022*S,ff,0,null,gold);
          }else{
            hctx.fillStyle=gold;
            knot(hctx,mxp,yc,wTh*.7);
          }
          hctx.fillStyle=T2;
        }
        if((i&2)===0)yield;
      }
      hctx.restore();
      yield;
    }
  });
  /* corner ornaments */
  if(!GARDEN)J(T1,"corner ornaments",function*(){
    const cc=(b0+b1)/2;
    withSym(hctx,4,cx2,cy2,()=>{
      const x=cc+.035*S, y=cc+.035*S, sz=.075*S;
      /* lozenge cartouche framing the corner piece */
      if(V.cornerLoz){
        hctx.fillStyle=gold;
        const L2=sz*1.05;
        eline(hctx,x-L2,y,x,y-L2,wTh*.6,.05);
        eline(hctx,x,y-L2,x+L2,y,wTh*.6,.05);
        eline(hctx,x+L2,y,x,y+L2,wTh*.6,.05);
        eline(hctx,x,y+L2,x-L2,y,wTh*.6,.05);
        knot(hctx,x-L2,y,wTh);knot(hctx,x+L2,y,wTh);
        knot(hctx,x,y-L2,wTh);knot(hctx,x,y+L2,wTh);
      }else{
        hctx.fillStyle=gold;
        earc(hctx,x,y,sz*1.1,sz*1.1,0,6.2832,0,wTh*.6,.05);
      }
      hctx.fillStyle=T1;
      if(motif==="chaine")mAnchor(hctx,x,y,sz,wTh*1.1);
      else if(motif==="cavalcade")mHorseshoe(hctx,x,y,sz,wTh);
      else mRosette(hctx,x,y,sz,wTh,T1,gold);
    });
    yield;
  });
  /* field sprinkle on a diamond lattice */
  if(!GARDEN)J(T0,"field lattice",function*(){
    const step=.052*S, inner=b1+.045*S;
    let row=0;
    for(let y=inner;y<S-inner;y+=step,row++){
      let col=0;
      for(let x=inner+(row%2?step/2:0);x<S-inner;x+=step,col++){
        if(Math.hypot(x-cx2,y-cy2)<(V.medR+.05)*S)continue;
        if(rnd()<.34)continue;
        const sz=.013*S;
        hctx.fillStyle=(row+col)%2?T0:darkThread(T1);
        if((row+col)%2===0){ /* tiny cross-stitch between marks */
          const d2=.005*S;
          eline(hctx,x-d2,y-d2,x+d2,y+d2,wTh*.4,.03);
          eline(hctx,x-d2,y+d2,x+d2,y-d2,wTh*.4,.03);
        }else if(rnd()<.5&&V.frUse!=="none"){
          fractal(hctx,V.fr2c,x,y,R(0,6.28),.026*S,
            {...FOPT(),w:1.6*u,gap:.1},0,null,hctx.fillStyle);
        }
        else if(motif==="chaine")earc(hctx,x,y,sz,sz,0,6.2832,0,wTh*.6,.05);
        else if(motif==="cavalcade")earc(hctx,x,y,sz,sz*1.1,-.4,3.54,0,wTh*.6,.05);
        else knot(hctx,x,y,wTh*.9);
      }
      yield;
    }
  });
  /* a fine inner frame stepping toward the medallion */
  if(!GARDEN&&V.innerFrame)J(T1,"inner frame",function*(){
    const rf=.205*S;
    hctx.fillStyle=T1;
    eline(hctx,rf,rf,S-rf,rf,wTh*.6,.05);
    eline(hctx,S-rf,rf,S-rf,S-rf,wTh*.6,.05);yield;
    eline(hctx,S-rf,S-rf,rf,S-rf,wTh*.6,.05);
    eline(hctx,rf,S-rf,rf,rf,wTh*.6,.05);yield;
    /* florets where the frame turns */
    withSym(hctx,4,cx2,cy2,()=>{
      hctx.fillStyle=gold;
      knot(hctx,rf,rf,wTh*1.2);
      for(let i=0;i<5;i++){
        const a=-Math.PI/4+(i-2)*.5;
        hctx.fillStyle=i%2?gold:T1;
        satin(hctx,rf+Math.cos(a)*wTh*2.2,rf+Math.sin(a)*wTh*2.2,a,.013*S,.007*S,wTh*.55);
      }
    });
    yield;
  });
  /* the medallion: gold rings, radial ornaments, centre rosette */
  if(!GARDEN)J(gold,"medallion rings",function*(){
    const MR=V.medR*S;
    hctx.fillStyle=gold;
    earc(hctx,cx2,cy2,MR,MR,0,6.2832,0,wTh*1.15);yield;
    earc(hctx,cx2,cy2,MR-.012*S,MR-.012*S,0,6.2832,0,wTh*.7);yield;
    /* ornament riding the outer ring — style by the roll */
    const ns=56, ro=MR+.012*S;
    for(let i=0;i<ns;i++){
      const a=i*2*Math.PI/ns;
      const ox=cx2+Math.cos(a)*ro, oy=cy2+Math.sin(a)*ro;
      if(V.scStyle===0)
        earc(hctx,ox,oy,.012*S,.009*S,Math.PI,2*Math.PI,a+Math.PI/2,wTh*.5,.05);
      else if(V.scStyle===1){
        if(i%2===0)stamp(hctx,ox,oy,wTh*.55);
        else knot(hctx,ox,oy,wTh*.7);
      }else
        eline(hctx,cx2+Math.cos(a)*(ro-.004*S),cy2+Math.sin(a)*(ro-.004*S),
                   cx2+Math.cos(a)*(ro+.006*S),cy2+Math.sin(a)*(ro+.006*S),wTh*.45,.04);
      if(i%10===9)yield;
    }
    hctx.fillStyle=T0;
    earc(hctx,cx2,cy2,MR*.52,MR*.52,0,6.2832,0,wTh*.7);yield;
    if(V.knotRing){
      for(let i=0;i<32;i++){
        const a=i*Math.PI/16;
        knot(hctx,cx2+Math.cos(a)*MR*.46,cy2+Math.sin(a)*MR*.46,wTh*.9);
      }
      yield;
    }
    if(V.tickBand){
      hctx.fillStyle=darkThread(gold);
      for(let i=0;i<64;i++){
        const a=i*Math.PI/32;
        eline(hctx,cx2+Math.cos(a)*(MR-.009*S),cy2+Math.sin(a)*(MR-.009*S),
                   cx2+Math.cos(a)*(MR-.002*S),cy2+Math.sin(a)*(MR-.002*S),wTh*.45,.04);
        if(i%16===15)yield;
      }
      yield;
    }
  });
  /* ---- the illustrated centrepiece, when a designer has drawn one ---- */
  const THREADS=[gold,T0,T1,T2];
  /* the designer's satellite group, repeated four-fold in the pockets */
  if(!GARDEN&&design&&design.satellite&&design.satellite.length)
  J(T1,"satellite scenes",function*(){
    withSym(hctx,4,cx2,cy2,()=>{
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(Math.PI/4);hctx.translate(-cx2,-cy2);
      drawDesignStrokes(hctx,design.satellite,cx2,cy2-.415*S,.105*S,
                        THREADS,wTh*.8,false,u);
      hctx.restore();
    });
    yield;
  });
  if(!GARDEN&&centre==="star")J(T0,"compass star",function*(){
    const MR=V.medR*S;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4, long2=(i%2===0);
      hctx.fillStyle=long2?T0:gold;
      satinO(hctx,cx2+Math.cos(a)*MR*.1,cy2+Math.sin(a)*MR*.1,a,
             MR*(long2?.72:.44),MR*(long2?.16:.1),wTh*.9);
      if(i%4===3)yield;
    }
    hctx.fillStyle=T1;
    earc(hctx,cx2,cy2,MR*.28,MR*.28,0,6.2832,0,wTh*.7);
    hctx.fillStyle=gold;
    knot(hctx,cx2,cy2,wTh*2);
    withSym(hctx,8,cx2,cy2,()=>{knot(hctx,cx2,cy2-MR*.84,wTh*1.1);});
    yield;
  });
  if(!GARDEN&&design&&design.strokes&&design.strokes.length){
    J(gold,"illustrated centrepiece",function*(){
      drawDesignStrokes(hctx,design.strokes,cx2,cy2,V.medR*S*.95,
                        THREADS,wTh,design.mirror,u);
      yield;
    });
  }
  if(centre==="rosette")
  J(T0,"radial garland",function*(){
    /* interstitial sprigs between the main radials */
    withSym(hctx,V.garN,cx2,cy2,()=>{
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(Math.PI/V.garN);hctx.translate(-cx2,-cy2);
      hctx.fillStyle=gold;
      const y=cy2-V.medR*S*.82;
      satin(hctx,cx2,y,-1.5708,.018*S,.009*S,wTh*.55);
      knot(hctx,cx2,y+.012*S,wTh*.7);
      hctx.restore();
    });
    withSym(hctx,V.garN,cx2,cy2,(k)=>{
      const x=cx2, y=cy2-V.medR*S*.75, sz=V.medR*S*.24;
      if(motif==="chaine"){
        hctx.fillStyle=k%2?T0:T1;
        earc(hctx,x,y-sz*.3,sz*.34,sz*.24,0,6.2832,0,wTh);
        earc(hctx,x,y+sz*.3,sz*.34,sz*.24,0,6.2832,1.5708,wTh);
      }else if(motif==="cavalcade"){
        hctx.fillStyle=k%2?T0:T2;
        if(k%2)mRibbon(hctx,x,y,sz,wTh*.9);
        else mStirrup(hctx,x,y,sz*.8,wTh*.9);
      }else{
        hctx.fillStyle=k%2?T0:T1;
        satin(hctx,x,y+sz*.3,-1.5708,sz*.85,sz*.4,wTh*.9);
      }
    });
    yield;
  });
  if(centre==="rosette")
  J(gold,"centre rosette",function*(){
    mRosette(hctx,cx2,cy2,V.medR*S*.4,wTh*1.05,T0,gold,V.petals);yield;
    hctx.fillStyle=gold;
    earc(hctx,cx2,cy2,.075*S,.075*S,0,6.2832,0,wTh*.7);
    withSym(hctx,8,cx2,cy2,()=>{
      knot(hctx,cx2,cy2-.105*S,wTh*1.3);
    });
    yield;
  });
  /* a fine inner ring of small ornaments just off the medallion */
  /* fractal corner sprays: the family's leaf spills into the field */
  if(!GARDEN&&(V.frUse==="rich"||V.frUse==="corners")
     &&!(design&&design.satellite&&design.satellite.length))
  J(pal.flora[1],FR_LABEL[V.fr1c]+", corner sprays",function*(){
    const ff={...FOPT(),w:2.6*u};
    const F=pal.flora, dk=darkThread(F[3]);
    const cc=b1+.055*S;
    withSym(hctx,4,cx2,cy2,()=>{
      const n=3+((rnd()*2)|0);
      for(let k=0;k<n;k++){
        const a=Math.PI/4+1.1*(k/Math.max(1,n-1)-.5)+R(-.06,.06);
        fractal(hctx,V.fr1c,cc,cc,a,S*R(.11,.17),ff,0,dk,F[1+(k%2)]);
      }
      if(rnd()<.6){
        hctx.fillStyle=pal.accents[0];
        flowerBurst(hctx,cc+S*R(.02,.05),cc+S*R(.02,.05),S*R(.015,.025),u,pal.accents[0],gold);
      }
    });
    yield;
  });
  /* a stitched wreath hugging the medallion — in the rolled style */
  if(!GARDEN&&(V.frUse==="rich"||V.frUse==="wreath"))
  J(pal.flora[2],FR_LABEL[V.fr1c]+" wreath",function*(){
    const ff={...FOPT(),w:2.2*u};
    const MR=V.medR*S;
    const nW=18+((rnd()*8)|0);
    for(let i=0;i<nW;i++){
      const a=i*2*Math.PI/nW+R(-.04,.04);
      const x=cx2+Math.cos(a)*(MR+.022*S), y=cy2+Math.sin(a)*(MR+.022*S);
      fractal(hctx,V.fr1c,x,y,a+Math.PI/2*(i%2?1:-1),S*R(.045,.07),
        {...ff,curl:(i%2?1:-1)*R(.6,1)},0,null,pal.flora[1+(i%2)]);
      if(i%6===5)yield;
    }
    yield;
  });
  if(!GARDEN)J(gold,"inner ring",function*(){
    withSym(hctx,16,cx2,cy2,(k)=>{
      const x=cx2, y=cy2-(V.medR+.045)*S, sz=.016*S;
      hctx.fillStyle=k%2?gold:T0;
      if(motif==="chaine")earc(hctx,x,y,sz,sz*.75,0,6.2832,0,wTh*.55,.05);
      else if(motif==="cavalcade")knot(hctx,x,y,wTh*1.1);
      else satin(hctx,x,y+sz*.5,-1.5708,sz*1.6,sz*.8,wTh*.6);
    });
    yield;
  });
  /* satellites between medallion and border, two interleaved rings */
  if(!GARDEN)J(T1,"field satellites",function*(){
    withSym(hctx,8,cx2,cy2,(k)=>{
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(Math.PI/8);hctx.translate(-cx2,-cy2);
      const x=cx2, y=cy2-.405*S, sz=.045*S;
      hctx.fillStyle=k%2?T1:T2;
      if(motif==="chaine")mLink(hctx,x,y,sz,wTh*.85);
      else if(motif==="cavalcade")mBit(hctx,x,y,sz*.9,wTh*.85);
      else mRosette(hctx,x,y,sz,wTh*.8,k%2?T1:T2,gold);
      hctx.restore();
    });
    yield;
    if(V.satTwo)withSym(hctx,4,cx2,cy2,(k)=>{
      hctx.save();
      hctx.translate(cx2,cy2);hctx.rotate(Math.PI/4);hctx.translate(-cx2,-cy2);
      const x=cx2, y=cy2-.44*S, sz=.03*S;
      hctx.fillStyle=k%2?T0:gold;
      if(motif==="chaine")mAnchor(hctx,x,y,sz,wTh*.65);
      else if(motif==="cavalcade")mHorseshoe(hctx,x,y,sz,wTh*.6);
      else mLeafStem(hctx,x,y,sz,1.5708,wTh*.6,k%2?T0:gold,T1);
      hctx.restore();
    });
    yield;
  });

  const hh=hm.height,hw=hm.width;
  const finishUnits=Math.ceil(hh/64)+3*(Math.ceil(hh/128)+Math.ceil(hw/128))+2;
  prog.total=jobs.length*8+finishUnits+16;
  prog.done=0;

  for(const job of jobs){
    statusCb(0,0,{c:job.c,scarf:job.label});
    yield* job.fn();
    prog.done+=8;
    yield;
  }
  return {hm,W,H,u,pal,motif};
}

/* silk, not enamel: twill lustre, drape, a hand-rolled hem */
function* silkFinish(C,statusCb,prog){
  statusCb(0,0,null);
  yield* finishRelief(hctx,C.hm,C.W,C.H,C.u,prog,{silk:true});
  REL=null;
  const S=C.W,u=C.u;

  /* twill weave in the colour space */
  const p=Math.max(6,Math.round(3.2*u));
  const t=document.createElement("canvas");
  t.width=p;t.height=p;
  const tc=t.getContext("2d");
  tc.fillStyle="rgba(255,255,255,.04)";
  for(let i=0;i<p;i++)tc.fillRect(i,(p-1-i),1,1);
  tc.fillStyle="rgba(10,8,4,.02)";
  for(let i=0;i<p;i++)tc.fillRect(i,(Math.floor(p/2)+p-1-i)%p,1,1);
  hctx.fillStyle=hctx.createPattern(t,"repeat");
  hctx.fillRect(0,0,S,S);
  prog.done+=4;yield;

  /* anisotropic sheen: light sweeps along the weave */
  let g=hctx.createLinearGradient(0,0,S,S);
  g.addColorStop(0,"rgba(255,255,252,0)");
  g.addColorStop(.3,"rgba(255,255,252,.09)");
  g.addColorStop(.52,"rgba(255,255,252,0)");
  hctx.fillStyle=g;hctx.fillRect(0,0,S,S);
  g=hctx.createLinearGradient(S,0,0,S);
  g.addColorStop(.45,"rgba(255,255,252,0)");
  g.addColorStop(.66,"rgba(255,255,252,.05)");
  g.addColorStop(.85,"rgba(255,255,252,0)");
  hctx.fillStyle=g;hctx.fillRect(0,0,S,S);
  g=hctx.createRadialGradient(S*.92,S*.94,S*.1,S*.92,S*.94,S*.7);
  g.addColorStop(0,"rgba(15,14,30,.07)");
  g.addColorStop(1,"rgba(15,14,30,0)");
  hctx.fillStyle=g;hctx.fillRect(0,0,S,S);
  prog.done+=4;yield;

  /* the silk does not lie perfectly flat: gentle drape waves */
  for(let i=0;i<3;i++){
    const wx=R(.2,.8)*S, wy=R(.2,.8)*S;
    const ang=Math.PI/4+R(-.35,.35), len=S*R(.4,.75), wid=S*R(.07,.12);
    const ca=Math.cos(ang),sa=Math.sin(ang);
    const steps=44;
    for(let j2=0;j2<=steps;j2++){
      const tt=(j2/steps-.5)*len;
      const fade=Math.sin(Math.PI*j2/steps);
      hctx.fillStyle=`rgba(22,18,40,${(.004*fade).toFixed(4)})`;
      stamp(hctx,wx+ca*tt-sa*wid*.4,wy+sa*tt+ca*wid*.4,wid*.8);
      hctx.fillStyle=`rgba(255,255,250,${(.0045*fade).toFixed(4)})`;
      stamp(hctx,wx+ca*tt+sa*wid*.4,wy+sa*tt-ca*wid*.4,wid*.75);
    }
    yield;
  }
  prog.done+=4;

  /* hand-rolled hem: a soft tube of silk around the perimeter */
  const inset=.022*S, hw2=6.5*u;
  const sline=(x1,y1,x2,y2,w,wob)=>{
    const d=Math.hypot(x2-x1,y2-y1), n=Math.max(2,Math.round(d/(w*.5)));
    for(let i=0;i<=n;i++){
      const tt=i/n;
      stamp(hctx,x1+(x2-x1)*tt+R(-wob,wob),y1+(y2-y1)*tt+R(-wob,wob),w*.5*R(.9,1.1));
    }
  };
  const ring=(r,w,wob)=>{
    sline(r,r,S-r,r,w,wob);sline(S-r,r,S-r,S-r,w,wob);
    sline(S-r,S-r,r,S-r,w,wob);sline(r,S-r,r,r,w,wob);
  };
  hctx.fillStyle="rgba(18,12,6,.18)";
  ring(inset,hw2*1.5,1.4*u);yield;
  hctx.fillStyle="rgba(255,255,250,.26)";
  ring(inset+hw2*.9,hw2*.8,1.0*u);yield;
  hctx.fillStyle="rgba(18,12,6,.12)";
  ring(inset+hw2*1.8,hw2*.55,1.0*u);
  /* hem stitches, picked in gold */
  hctx.fillStyle=C.pal.gold;
  const sr=inset+hw2*3, stepS=11*u;
  for(let x=sr;x<S-sr;x+=stepS){stamp(hctx,x,sr,1.1*u);stamp(hctx,x,S-sr,1.1*u);}
  for(let y=sr;y<S-sr;y+=stepS){stamp(hctx,sr,y,1.1*u);stamp(hctx,S-sr,y,1.1*u);}
  prog.done+=4;yield;
}

function* scarfGenerate(seed,palKey,motifKey,statusCb,prog={},design){
  if(prog.total===undefined){prog.total=1;prog.done=0;}
  const C=yield* scarfPhase(seed,palKey,motifKey,statusCb,prog,design);
  yield* silkFinish(C,statusCb,prog);
}

