/* =========================================================
   the silk wing — embroidered carrés in the manner of Hermès
   ========================================================= */
const SCARF_PALETTES={
  flamme:{name:"Flamme",note:"Hermès orange · gold · indigo",
    ground:"#f4ecda",border:"#d4551a",gold:"#c08a2a",
    threads:["#8a2f10","#2b4c6f","#f0e9d8"],
    flora:["#d97a3e","#b85a24","#8a3c14","#5e2a10"],accents:["#2b4c6f","#4a6f94","#1d3a57"],
    swatches:["#d4551a","#c08a2a","#8a2f10","#2b4c6f"]},
  marine:{name:"Marine",note:"navy · gold · ivory · lacquer",
    ground:"#13294a",border:"#0c1b32",gold:"#cda23a",
    threads:["#b8332a","#e9e2cf","#5b86b5"],
    flora:["#8fb4d8","#5b86b5","#39618f","#24405f"],accents:["#d97a52","#c8552d","#e8a285"],
    swatches:["#13294a","#cda23a","#b8332a","#e9e2cf"]},
  emeraude:{name:"Émeraude",note:"emerald · blush · jade · gold",
    ground:"#0e5440",border:"#093a2c",gold:"#caa43c",
    threads:["#e7b9b0","#7fcaab","#efe6cf"],
    flora:["#a8dcc2","#7fcaab","#4f9c7c","#2f6e54"],accents:["#e7b9b0","#d18d80","#f0d3cb"],
    swatches:["#0e5440","#caa43c","#e7b9b0","#7fcaab"]},
  noir:{name:"Noir",note:"black · gold · porcelain · lacquer",
    ground:"#191611",border:"#0d0b08",gold:"#cfa53d",
    threads:["#ece6d6","#9c9384","#b8332a"],
    flora:["#cfc4ae","#9c9384","#6e6657","#46413a"],accents:["#b8332a","#cfa53d","#8e2820"],
    swatches:["#191611","#cfa53d","#ece6d6","#b8332a"]},
  poudre:{name:"Poudre",note:"blush · plum · dove · old gold",
    ground:"#f4e3dd",border:"#cf9d92",gold:"#b08a3e",
    threads:["#7d5a64","#9aa6b0","#f6efe3"],
    flora:["#b3899a","#7d5a64","#9aa6b0","#5e6e7c"],accents:["#b08a3e","#caa55c","#8a6a2e"],
    swatches:["#ecd9d3","#b08a3e","#7d5a64","#9aa6b0"]}
};
const SCARF_MOTIFS={
  chaine:{name:"Chaîne",note:"anchor chains · rope borders"},
  cavalcade:{name:"Cavalcade",note:"stirrups · bits · ribbons"},
  jardin:{name:"Jardin",note:"rosettes · leaf scrolls"}
};

/* ---- embroidery primitives: every mark is laid as thread ---- */
/* mercerised thread catches the light along its top: derive a pale
   glint from whatever colour is in the needle */
function liteThread(fs){
  if(typeof fs!=="string"||fs[0]!=="#"||fs.length<7)return null;
  const r=parseInt(fs.slice(1,3),16),g=parseInt(fs.slice(3,5),16),b=parseInt(fs.slice(5,7),16);
  return `rgba(${Math.min(255,Math.round(r*.55+140))},${Math.min(255,Math.round(g*.55+140))},${Math.min(255,Math.round(b*.55+135))},0.55)`;
}
function eline(ctx,x1,y1,x2,y2,w,relA){
  const d=Math.hypot(x2-x1,y2-y1), n=Math.max(1,Math.round(d/(w*.55)));
  const fs=ctx.fillStyle, lite=liteThread(fs);
  for(let i=0;i<=n;i++){
    const t=i/n;
    const x=x1+(x2-x1)*t+R(-.14,.14)*w, y=y1+(y2-y1)*t+R(-.14,.14)*w;
    stamp(ctx,x,y,w*.5*R(.92,1.08));
    if((i&1)===0)hstamp(x,y,w*.85,relA===undefined?.07:relA);
    if(lite&&i%3===1){
      ctx.fillStyle=lite;
      stamp(ctx,x-w*.16,y-w*.16,w*.22);
      ctx.fillStyle=fs;
    }
  }
}
function earc(ctx,cx,cy,rx,ry,a0,a1,rot,w,relA){
  const len=Math.abs(a1-a0)*Math.max(rx,ry), n=Math.max(4,Math.round(len/(w*.55)));
  const cr=Math.cos(rot),sr=Math.sin(rot);
  const fs=ctx.fillStyle, lite=liteThread(fs);
  for(let i=0;i<=n;i++){
    const a=a0+(a1-a0)*i/n;
    const px=Math.cos(a)*rx, py=Math.sin(a)*ry;
    const x=cx+px*cr-py*sr+R(-.12,.12)*w, y=cy+px*sr+py*cr+R(-.12,.12)*w;
    stamp(ctx,x,y,w*.5*R(.92,1.08));
    if((i&1)===0)hstamp(x,y,w*.85,relA===undefined?.07:relA);
    if(lite&&i%3===1){
      ctx.fillStyle=lite;
      stamp(ctx,x-w*.16,y-w*.16,w*.22);
      ctx.fillStyle=fs;
    }
  }
}
/* a satin petal with a darker couched outline — proper raised work */
function darkThread(fs){
  if(typeof fs!=="string"||fs[0]!=="#"||fs.length<7)return fs;
  const r=parseInt(fs.slice(1,3),16),g=parseInt(fs.slice(3,5),16),b=parseInt(fs.slice(5,7),16);
  return `#${[r,g,b].map(v=>Math.max(0,Math.round(v*.62)).toString(16).padStart(2,"0")).join("")}`;
}
function satinO(ctx,cx,cy,ang,len,wid,w){
  const fs=ctx.fillStyle;
  satin(ctx,cx,cy,ang,len,wid,w);
  ctx.fillStyle=darkThread(fs);
  const mx=cx+Math.cos(ang)*len*.5, my=cy+Math.sin(ang)*len*.5;
  earc(ctx,mx,my,len*.5,wid*.5,0,6.2832,ang,w*.55,.05);
  ctx.fillStyle=fs;
}
/* a satin-stitched petal or leaf: parallel threads across a pointed oval */
function satin(ctx,cx,cy,ang,len,wid,w){
  const n=Math.max(3,Math.round(len/(w*.72)));
  const ca=Math.cos(ang),sa=Math.sin(ang);
  for(let i=0;i<=n;i++){
    const t=i/n;
    const half=Math.sin(Math.PI*t)*wid*.5;
    const bx=cx+ca*len*t, by=cy+sa*len*t;
    eline(ctx,bx-sa*half,by+ca*half,bx+sa*half,by-ca*half,w,.05);
  }
}
function knot(ctx,x,y,r){
  for(let i=0;i<6;i++)stamp(ctx,x+R(-.4,.4)*r,y+R(-.4,.4)*r,r*R(.45,.7));
  hstamp(x,y,r*1.4,.15);
}
function withSym(ctx,n,cx,cy,fn){
  for(let k=0;k<n;k++){
    ctx.save();
    ctx.translate(cx,cy);ctx.rotate(k*2*Math.PI/n);ctx.translate(-cx,-cy);
    if(REL){REL.save();REL.translate(cx,cy);REL.rotate(k*2*Math.PI/n);REL.translate(-cx,-cy);}
    fn(k);
    if(REL)REL.restore();
    ctx.restore();
  }
}
/* identical arms: the same random stream replayed at each rotation —
   this is what gives a carré its repeating geometry */
function symArms(ctx,n,cx,cy,fn){
  const sub=(rnd()*2147483647)|0, saved=rnd;
  withSym(ctx,n,cx,cy,k=>{rnd=mulberry32(sub);fn(k);});
  rnd=saved;
}

/* ---- the fractal flora: fronds that branch into fronds ----
   geometry is generated first (one pass of the random stream), then
   painted — so a dark silhouette pass and the lit pass share bones */
function frondGeom(x,y,ang,len,opt,depth){
  const segs=Math.max(6,Math.round(len/(opt.u*9)));
  const stem=[];let a=ang,px=x,py=y;
  const curl=opt.curl===undefined?R(-.5,.5):opt.curl;
  for(let i=0;i<=segs;i++){
    stem.push([px,py,a]);
    px+=Math.cos(a)*len/segs;py+=Math.sin(a)*len/segs;
    a+=curl/segs+R(-.025,.025);
  }
  const leaves=[];
  const gap=opt.gap||.07;
  for(let t=opt.bare||.14;t<=1;t+=gap*R(.85,1.15)){
    const i=Math.min(segs,Math.round(t*segs));
    const st=stem[i];
    const taper=1-.62*t;
    const side=(leaves.length%2?1:-1);
    const ll=len*(opt.leaf||.16)*taper*R(.85,1.15);
    const lw=ll*(opt.leafW||.32);
    const lang=st[2]+side*(opt.leafAng||1.15)*R(.9,1.1);
    leaves.push([st[0],st[1],lang,ll,lw]);
  }
  const subs=[];
  if(depth>0){
    const nb=opt.branches||2;
    for(let b=0;b<nb;b++){
      const t=.3+.55*b/Math.max(1,nb-1)+R(-.06,.06);
      const i=Math.min(segs,Math.round(t*segs));
      const st=stem[i];
      const side=(b%2?1:-1);
      subs.push(frondGeom(st[0],st[1],st[2]+side*R(.5,.9),len*R(.34,.48),opt,depth-1));
    }
  }
  return {stem,leaves,subs};
}
function frondPaint(ctx,g,opt,shadow){
  const u=opt.u;
  if(shadow){ /* silhouette pass: simple, dark, offset — the under-canopy */
    const ox=2.6*u,oy=3.4*u;
    for(let i=1;i<g.stem.length;i++)
      eline(ctx,g.stem[i-1][0]+ox,g.stem[i-1][1]+oy,g.stem[i][0]+ox,g.stem[i][1]+oy,opt.w*1.2,.03);
    for(const lf of g.leaves)
      eline(ctx,lf[0]+ox,lf[1]+oy,lf[0]+ox+Math.cos(lf[2])*lf[3],lf[1]+oy+Math.sin(lf[2])*lf[3],opt.w*1.5,.03);
  }else{
    for(let i=1;i<g.stem.length;i++)
      eline(ctx,g.stem[i-1][0],g.stem[i-1][1],g.stem[i][0],g.stem[i][1],opt.w,.06);
    for(const lf of g.leaves){
      if(lf[3]<5*u)eline(ctx,lf[0],lf[1],lf[0]+Math.cos(lf[2])*lf[3],lf[1]+Math.sin(lf[2])*lf[3],opt.w*1.1,.05);
      else satin(ctx,lf[0],lf[1],lf[2],lf[3],lf[4],Math.max(1.8*u,opt.w*.8));
    }
  }
  for(const sub of g.subs)frondPaint(ctx,sub,opt,shadow);
}
/* a palm burst: fronds radiating from one crown */
function palmGeom(x,y,r,opt,nF,a0,spread){
  const out=[];
  const n=nF||(5+((rnd()*4)|0));
  for(let i=0;i<n;i++){
    const a=a0+spread*(i/Math.max(1,n-1)-.5)+R(-.08,.08);
    /* each frond rises, arcs outward, and droops at the tip */
    const sg=Math.sign(Math.cos(a)||(rnd()<.5?1:-1));
    out.push(frondGeom(x,y,a,r*R(.85,1.15),
      {...opt,curl:sg*R(.8,1.5),bare:.05},opt.depth||0));
  }
  return out;
}
/* a flower burst: thin radiating petals, like the asters of the garden */
function flowerBurst(ctx,x,y,r,u,petalC,heartC){
  const n=10+((rnd()*9)|0);
  const fs=ctx.fillStyle;
  ctx.fillStyle=petalC;
  for(let i=0;i<n;i++){
    const a=i*2*Math.PI/n+R(-.1,.1);
    const ll=r*R(.75,1.05);
    eline(ctx,x+Math.cos(a)*r*.12,y+Math.sin(a)*r*.12,
              x+Math.cos(a)*ll,y+Math.sin(a)*ll,Math.max(1.8*u,r*.07),.06);
    if(rnd()<.5)
      eline(ctx,x+Math.cos(a)*ll,y+Math.sin(a)*ll,
                x+Math.cos(a)*ll*1.18,y+Math.sin(a)*ll*1.18,Math.max(1.4*u,r*.04),.04);
  }
  ctx.fillStyle=heartC;
  knot(ctx,x,y,Math.max(2.5*u,r*.1));
  for(let i=0;i<6;i++)knot(ctx,x+R(-.14,.14)*r,y+R(-.14,.14)*r,Math.max(1.6*u,r*.05));
  ctx.fillStyle=fs;
}
/* a wandering vine with leaf pairs and berries */
function vine(ctx,x,y,ang,len,u,leafC,berryC){
  const segs=Math.max(8,Math.round(len/(u*10)));
  let a=ang,px=x,py=y,flip=1;
  const fs=ctx.fillStyle;
  for(let i=0;i<segs;i++){
    const nx=px+Math.cos(a)*len/segs, ny=py+Math.sin(a)*len/segs;
    ctx.fillStyle=leafC;
    eline(ctx,px,py,nx,ny,2*u,.05);
    if(i%2===1){
      const ll=len*.085*R(.8,1.2);
      satin(ctx,nx,ny,a+flip*1.2,ll,ll*.5,1.8*u);
      flip=-flip;
    }
    if(rnd()<.18){ctx.fillStyle=berryC;knot(ctx,nx,ny,2.2*u);}
    a+=R(-.5,.5)*.55+(rnd()<.3?flip*.3:0);
    px=nx;py=ny;
  }
  ctx.fillStyle=fs;
}
/* ---- the fractal registry: six families, one grammar ----
   each style draws recursively; a sub-seed lets the dark silhouette
   pass and the lit pass share identical bones */
const FR_DRAW={
  fern(ctx,x,y,ang,len,opt,depth){
    const g=frondGeom(x,y,ang,len,opt,depth);
    frondPaint(ctx,g,opt,!!opt.shadow);
  },
  coral(ctx,x,y,ang,len,opt,depth){
    const segs=Math.max(4,Math.round(len/(opt.u*10)));
    const w=opt.w*(opt.shadow?1.5:1);
    let a=ang,px=x,py=y;
    for(let i=0;i<segs;i++){
      const nx=px+Math.cos(a)*len/segs, ny=py+Math.sin(a)*len/segs;
      eline(ctx,px,py,nx,ny,w*(1-.3*i/segs),.05);
      a+=(opt.curl||0)/segs+R(-.16,.16);
      px=nx;py=ny;
      if(depth>0&&i===Math.round(segs*.5)&&rnd()<.7)
        FR_DRAW.coral(ctx,px,py,a+R(.6,1.1)*(rnd()<.5?1:-1),len*R(.4,.6),opt,depth-1);
    }
    if(depth>0){
      const forks=2+(rnd()<.4?1:0);
      for(let k=0;k<forks;k++)
        FR_DRAW.coral(ctx,px,py,a+R(-.9,.9),len*R(.5,.7),opt,depth-1);
    }else if(!opt.shadow)knot(ctx,px,py,w*1.05);
  },
  scroll(ctx,x,y,ang,len,opt,depth){
    const w=Math.max(opt.w*(opt.shadow?1.4:1),1.8*opt.u);
    const dir=opt.dir||(rnd()<.5?1:-1);
    /* a sweeping stem that bows gently into the coil */
    const segs=8;
    let qx=x,qy=y,a=ang;
    for(let i=0;i<segs;i++){
      const nx=qx+Math.cos(a)*len*.55/segs, ny=qy+Math.sin(a)*len*.55/segs;
      eline(ctx,qx,qy,nx,ny,w*(1-.25*i/segs),.05);
      a+=dir*.09+R(-.02,.02);
      qx=nx;qy=ny;
    }
    /* the volute: coiling inward from the stem's tip */
    const r0=len*.3;
    const ccx=qx+Math.cos(a+dir*1.5708)*r0, ccy=qy+Math.sin(a+dir*1.5708)*r0;
    let th=Math.atan2(qy-ccy,qx-ccx);
    const turns=R(1.4,2.1), n=Math.round(turns*20);
    for(let i=1;i<=n;i++){
      th+=dir*2*Math.PI/20;
      const rr=r0*(1-.85*i/n);
      const nx=ccx+Math.cos(th)*rr, ny=ccy+Math.sin(th)*rr;
      eline(ctx,qx,qy,nx,ny,w*(.75-.45*i/n),.04);
      qx=nx;qy=ny;
    }
    if(!opt.shadow)knot(ctx,qx,qy,w*.85);
    if(depth>0&&rnd()<.85)
      FR_DRAW.scroll(ctx,x+Math.cos(ang)*len*.3,y+Math.sin(ang)*len*.3,
                     ang+dir*R(.7,1.2),len*R(.4,.55),{...opt,dir:-dir},depth-1);
  },
  plume(ctx,x,y,ang,len,opt,depth){
    const segs=Math.max(6,Math.round(len/(opt.u*9)));
    const w=opt.w*(opt.shadow?1.4:1);
    const curl=opt.curl===undefined?R(-.6,.6):opt.curl;
    const stem=[];let a=ang,px=x,py=y;
    for(let i=0;i<=segs;i++){
      stem.push([px,py,a]);
      px+=Math.cos(a)*len/segs;py+=Math.sin(a)*len/segs;
      a+=curl/segs+R(-.02,.02);
    }
    for(let i=1;i<stem.length;i++)
      eline(ctx,stem[i-1][0],stem[i-1][1],stem[i][0],stem[i][1],w,.05);
    /* hairline barbs sweeping back along the quill */
    for(let t=.1;t<=1;t+=.023*R(.85,1.15)){
      const i=Math.min(segs,Math.round(t*segs));
      const st=stem[i], taper=Math.sin(Math.PI*Math.min(1,t*1.1))*.9+.1;
      const bl=len*.2*taper;
      for(const side of [-1,1]){
        const ba=st[2]+side*R(1.9,2.3);
        eline(ctx,st[0],st[1],st[0]+Math.cos(ba)*bl*R(.85,1.15),
              st[1]+Math.sin(ba)*bl*R(.85,1.15),Math.max(w*.5,1.4*opt.u),.03);
      }
    }
    if(depth>0)
      FR_DRAW.plume(ctx,stem[Math.round(segs*.55)][0],stem[Math.round(segs*.55)][1],
                    stem[Math.round(segs*.55)][2]+R(.5,.9)*(rnd()<.5?1:-1),
                    len*R(.38,.5),opt,depth-1);
  },
  burst(ctx,x,y,ang,len,opt,depth){
    const w=Math.max(opt.w*(opt.shadow?1.4:1),2.1*opt.u);
    const spread=opt.spread||2*Math.PI;
    const n=opt.dense?(13+((rnd()*7)|0)):(9+((rnd()*5)|0));
    for(let i=0;i<n;i++){
      const a=ang+spread*(i/n-.5)+R(-.06,.06);
      const ll=len*R(.6,1);
      const tx=x+Math.cos(a)*ll, ty=y+Math.sin(a)*ll;
      eline(ctx,x+Math.cos(a)*len*.08,y+Math.sin(a)*len*.08,tx,ty,w*R(.5,.8),.04);
      if(depth>0&&i%2===0)
        FR_DRAW.burst(ctx,tx,ty,a,ll*.32,{...opt,spread:2.2},depth-1);
      else if(!opt.shadow&&rnd()<.6)knot(ctx,tx,ty,w*.8);
    }
    if(!opt.shadow)knot(ctx,x,y,w*1.2);
  },
  ribbon(ctx,x,y,ang,len,opt,depth){
    const segs=Math.max(8,Math.round(len/(opt.u*10)));
    const w=opt.w*(opt.shadow?1.4:1), half=Math.max(2.5*opt.u,len*.022);
    let a=ang,px=x,py=y;
    const pts=[];
    for(let i=0;i<=segs;i++){
      pts.push([px,py,a]);
      px+=Math.cos(a)*len/segs;py+=Math.sin(a)*len/segs;
      a+=Math.sin(i*.85)*.34+R(-.05,.05);
    }
    for(let i=1;i<pts.length;i++){
      const na=(pts[i][2]+pts[i-1][2])/2;
      const nx=-Math.sin(na)*half, ny=Math.cos(na)*half;
      eline(ctx,pts[i-1][0]+nx,pts[i-1][1]+ny,pts[i][0]+nx,pts[i][1]+ny,w*.7,.04);
      eline(ctx,pts[i-1][0]-nx,pts[i-1][1]-ny,pts[i][0]-nx,pts[i][1]-ny,w*.7,.04);
      if(i%3===0)eline(ctx,pts[i][0]+nx,pts[i][1]+ny,pts[i][0]-nx,pts[i][1]-ny,w*.5,.03);
    }
    const e=pts[pts.length-1];
    if(depth>0){
      FR_DRAW.ribbon(ctx,e[0],e[1],e[2]+R(.4,.8),len*R(.4,.55),opt,depth-1);
      FR_DRAW.ribbon(ctx,e[0],e[1],e[2]-R(.4,.8),len*R(.4,.55),opt,depth-1);
      if(!opt.shadow)earc(ctx,e[0],e[1],half*1.6,half*1.6,0,6.2832,0,w*.6,.05);
    }else if(!opt.shadow)knot(ctx,e[0],e[1],w*.9);
  }
};
const FR_LABEL={fern:"fern fronds",coral:"coral branches",scroll:"scrollwork volutes",
  plume:"plumes",burst:"ray bursts",ribbon:"ribbon meanders"};
const FAM_FRACTALS={
  chaine:["coral","coral","scroll","burst","fern"],
  cavalcade:["plume","plume","ribbon","scroll","fern"],
  jardin:["fern","fern","scroll","burst","plume"]
};
/* draw one fractal element, optionally with a matching silhouette */
function fractal(ctx,style,x,y,ang,len,opt,depth,shadowFill,mainFill){
  const fn=FR_DRAW[style]||FR_DRAW.fern;
  const sub=(rnd()*2147483647)|0;
  const saved=rnd;
  if(shadowFill){
    rnd=mulberry32(sub);
    ctx.save();
    ctx.translate(2.6*opt.u,3.4*opt.u);
    ctx.fillStyle=shadowFill;
    fn(ctx,x,y,ang,len,{...opt,shadow:true},depth);
    ctx.restore();
  }
  rnd=mulberry32(sub);
  if(mainFill)ctx.fillStyle=mainFill;
  fn(ctx,x,y,ang,len,opt,depth);
  rnd=saved;
}

/* a small far-off bird, two strokes */
function sbird(ctx,x,y,r,u){
  earc(ctx,x-r*.5,y,r*.55,r*.4,-2.6,-.6,0,1.7*u,.03);
  earc(ctx,x+r*.5,y,r*.55,r*.4,-2.55,-.5,0,1.7*u,.03);
}

/* ---- the motif vocabulary ---- */
function mLink(ctx,x,y,s,w){ // two interlocked stitched rings
  earc(ctx,x-s*.32,y,s*.42,s*.30,0,6.2832,.35,w);
  earc(ctx,x+s*.32,y,s*.42,s*.30,0,6.2832,-.35,w);
}
function mAnchor(ctx,x,y,s,w){
  earc(ctx,x,y-s*.62,s*.16,s*.16,0,6.2832,0,w);          // ring
  eline(ctx,x,y-s*.46,x,y+s*.42,w*1.1);                  // shank
  eline(ctx,x-s*.34,y-s*.18,x+s*.34,y-s*.18,w);          // stock
  earc(ctx,x,y+s*.10,s*.46,s*.36,.45,2.69,0,w*1.1);      // flukes
}
function mStirrup(ctx,x,y,s,w){
  earc(ctx,x,y-s*.08,s*.40,s*.46,Math.PI,2*Math.PI,0,w*1.1); // arch
  eline(ctx,x-s*.40,y-s*.08,x-s*.34,y+s*.34,w);
  eline(ctx,x+s*.40,y-s*.08,x+s*.34,y+s*.34,w);
  eline(ctx,x-s*.40,y+s*.36,x+s*.40,y+s*.36,w*1.2);      // tread
}
function mBit(ctx,x,y,s,w){
  earc(ctx,x,y,s*.42,s*.42,0,6.2832,0,w);
  eline(ctx,x-s*.58,y,x+s*.58,y,w*1.1);
  knot(ctx,x-s*.58,y,w*1.1);knot(ctx,x+s*.58,y,w*1.1);
}
function mHorseshoe(ctx,x,y,s,w){
  earc(ctx,x,y,s*.45,s*.5,-.5,3.64,0,w*1.3);
  for(let i=0;i<5;i++){
    const a=-.3+i*.85;
    knot(ctx,x+Math.cos(a)*s*.45,y+Math.sin(a)*s*.5,w*.8);
  }
}
function mRosette(ctx,x,y,s,w,petalFill,centerFill,nP){
  const N2=nP||8;
  ctx.fillStyle=petalFill;
  for(let i=0;i<N2;i++){
    const a=i*2*Math.PI/N2+R(-.06,.06);
    satinO(ctx,x+Math.cos(a)*s*.14,y+Math.sin(a)*s*.14,a,s*.4,s*.24,w);
  }
  ctx.fillStyle=centerFill;
  for(let i=0;i<N2;i++){
    const a=i*2*Math.PI/N2+Math.PI/N2;
    satin(ctx,x+Math.cos(a)*s*.1,y+Math.sin(a)*s*.1,a,s*.2,s*.12,w*.8);
  }
  knot(ctx,x,y,w*1.7);
  ctx.fillStyle=petalFill;
  for(let i=0;i<6;i++)knot(ctx,x+Math.cos(i*1.047)*w*2.6,y+Math.sin(i*1.047)*w*2.6,w*.7);
}
function mLeafStem(ctx,x,y,s,ang,w,leafFill,stemFill){
  ctx.fillStyle=stemFill;
  earc(ctx,x,y+s*.5,s*.9,s*.55,-1.95,-1.15,ang,w);
  ctx.fillStyle=leafFill;
  const ca=Math.cos(ang),sa=Math.sin(ang);
  for(let i=0;i<3;i++){
    const t=-.55+i*.42;
    const lx=x+ca*t*s, ly=y+sa*t*s;
    satin(ctx,lx,ly,ang+(i%2?1.15:-1.15),s*.34,s*.18,w);
  }
}
function mRibbon(ctx,x,y,s,w){
  earc(ctx,x-s*.3,y,s*.32,s*.2,2.6,5.9,0,w);
  earc(ctx,x+s*.3,y,s*.32,s*.2,-.5,2.7,0,w);
  satin(ctx,x,y,R(0,6.28),s*.2,s*.12,w*.9);
}

