/* ===== KEITA WING START ===== */
/* =========================================================
   the nocturne wing — Keita-ish Tokyo nights
   A light-based engine: the picture is built as a night
   scene lit by one glowing protagonist (a vending machine,
   a phone box, a corner store), with halation, pooled light
   on the asphalt, rim-lit silhouettes and a painterly skin.
   ========================================================= */

const KEITA_SCENES={
  jihanki:{name:"Vending machine",note:"the glowing jihanki in a lane"},
  denwa:  {name:"Phone box",      note:"a warm booth on an empty road"},
  konbini:{name:"Corner store",   note:"the all-night shopfront"}
};
const KEITA_TITLES={
  jihanki:["Last Drink","Jihanki","Cold Light","Night Vending","Blue Refill"],
  denwa:  ["The Call","Dial Tone","Green Evening","Last Call","Public Telephone"],
  konbini:["Open All Night","Corner Light","Night Errand","Fluorescent Garden","Closing Time"]
};

/* ---- small colour kit ---- */
function kHex(h){const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function kMix(a,b,t){
  const A=kHex(a),B=kHex(b);
  return `rgb(${Math.round(A[0]+(B[0]-A[0])*t)},${Math.round(A[1]+(B[1]-A[1])*t)},${Math.round(A[2]+(B[2]-A[2])*t)})`;
}
function kA(h,al){
  if(h[0]!=="#")return h.replace("rgb(","rgba(").replace(")",`,${al})`);
  const c=kHex(h);return `rgba(${c[0]},${c[1]},${c[2]},${al})`;
}

/* a soft radial pool of colour — the engine's basic unit of light */
function kGlow(ctx,x,y,r,h,al,ry){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,kA(h,al));
  g.addColorStop(.5,kA(h,al*.45));
  g.addColorStop(1,kA(h,0));
  ctx.save();
  if(ry&&ry!==r){ctx.translate(x,y);ctx.scale(1,ry/r);ctx.translate(-x,-y);}
  ctx.fillStyle=g;
  ctx.fillRect(x-r,y-r*(ry?r/(ry||r):1)*1.2,2*r,2.4*r);
  ctx.restore();
}

/* soft mottling that breaks any machine-perfect gradient */
function kMottle(ctx,x,y,w,h,cols,n,rmin,rmax,al){
  for(let i=0;i<n;i++){
    const px=x+rnd()*w,py=y+rnd()*h,r=R(rmin,rmax);
    const g=ctx.createRadialGradient(px,py,0,px,py,r);
    const c=pick(cols);
    g.addColorStop(0,kA(c,al*R(.5,1)));
    g.addColorStop(1,kA(c,0));
    ctx.fillStyle=g;
    ctx.fillRect(px-r,py-r,2*r,2*r);
  }
}

/* a painter's rectangle: the long runs stay STRAIGHT (only a breath of
   jitter), but every corner turns ROUND — the hand draws lines true and
   softens the turns */
function kJit(x,y,w,h,j,cr){
  j=j===undefined?1:j;
  cr=cr===undefined?Math.min(w,h)*.14:cr;
  cr=Math.max(.5,Math.min(cr,Math.min(w,h)*.42));
  const J=()=>R(-j,j);
  const pts=[];
  const seg=(x0,y0,x1,y1)=>{
    const L=Math.hypot(x1-x0,y1-y0);
    const n=Math.max(1,Math.round(L/140));
    for(let i=0;i<n;i++){
      const t=i/n;
      pts.push([x0+(x1-x0)*t+J(),y0+(y1-y0)*t+J()]);
    }
  };
  const arc=(cx2,cy2,a0,a1)=>{
    for(let i=0;i<=3;i++){
      const a=a0+(a1-a0)*i/3;
      pts.push([cx2+Math.cos(a)*cr+J()*.4,cy2+Math.sin(a)*cr+J()*.4]);
    }
  };
  seg(x+cr,y, x+w-cr,y);   arc(x+w-cr,y+cr,-Math.PI/2,0);
  seg(x+w,y+cr, x+w,y+h-cr); arc(x+w-cr,y+h-cr,0,Math.PI/2);
  seg(x+w-cr,y+h, x+cr,y+h); arc(x+cr,y+h-cr,Math.PI/2,Math.PI);
  seg(x,y+h-cr, x,y+cr);   arc(x+cr,y+cr,Math.PI,Math.PI*1.5);
  return pts;
}
function kPoly(ctx,pts){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath();
}
function kPRect(ctx,x,y,w,h,j,cr){kPoly(ctx,kJit(x,y,w,h,j,cr));ctx.fill();}

/* ---- the wing's one palette: Morimoto's muted dusk ----
   deep desaturated indigo above, warm umber earth below, lamps in
   sodium amber, the store light a quiet green-white — never neon teal */
const KP={
  skyTop:"#15303a", skyHz:"#2b5456",
  cityFaces:["#c9a187","#b58a72","#d4b394","#a18a76","#8f8284","#c2a98c","#867e88","#ad9a7e"],
  winC:["#ffd9a0","#ffc27e","#f6e6c0","#e8a86a"],
  win:"#e2ae6e",
  neon:["#b86a74","#6fa896","#cfae84","#7e9cb8","#c08458"],
  wall:["#241e17","#383023"],
  ground:["#1c1712","#3b3124"],
  road:["#141a24","#2b3544"],
  sodium:"#eeb066",
  store:"#d7e6c8", machine:"#cfe0e4", booth:"#f2bf78"
};

/* the signature street lamp: a dark pole carrying one to three warm
   glowing lanterns */
function kLamp(ctx,x,baseY,h2,u){
  ctx.fillStyle="#15110d";
  kPRect(ctx,x-3.2*u,baseY-h2,6.4*u,h2,.6,2.5*u);
  const gy=baseY-h2;
  const n=1+RI(0,2);
  for(let i=0;i<n;i++){
    const gx=x+(i-(n-1)/2)*15*u;
    if(n>1){
      ctx.fillStyle="#15110d";
      ctx.fillRect(Math.min(x,gx)-u,gy+1.5*u,Math.abs(gx-x)+2*u,2.2*u);
    }
    ctx.fillStyle="#15110d";
    kPRect(ctx,gx-6*u,gy-13*u,12*u,14*u,.5,3*u);
    ctx.fillStyle=kA("#ffe5b2",.95);
    kPRect(ctx,gx-4.6*u,gy-11.6*u,9.2*u,11*u,.4,3*u);
    ctx.globalCompositeOperation="lighter";
    kGlow(ctx,gx,gy-6*u,38*u,KP.sodium,.4);
    kGlow(ctx,gx,gy-6*u,120*u,KP.sodium,.12);
    ctx.globalCompositeOperation="source-over";
  }
  ctx.globalCompositeOperation="lighter";
  kGlow(ctx,x,baseY,95*u,KP.sodium,.14,42*u);
  ctx.globalCompositeOperation="source-over";
}

/* paver work: the warm brick ground his streets stand on */
function kPavers(ctx,x,y,w,h,u){
  ctx.strokeStyle="rgba(8,6,4,.3)";
  let py=y+R(4,12)*u,row=0;
  while(py<y+h){
    const sp=(7+ (py-y)/h*16)*u;            /* rows widen toward us */
    ctx.lineWidth=Math.min(2.2,.8+(py-y)/h*1.6)*u;
    ctx.beginPath();ctx.moveTo(x,py+R(-1,1)*u);ctx.lineTo(x+w,py+R(-1,1)*u);ctx.stroke();
    /* a few cross joints, offset every other row */
    const step=sp*R(2.4,3.4);
    for(let jx=x+((row%2)?step/2:0)+R(0,step);jx<x+w;jx+=step)
      if(rnd()<.7){ctx.beginPath();ctx.moveTo(jx,py);ctx.lineTo(jx+R(-2,2)*u,py+sp);ctx.stroke();}
    /* the odd paver remembers a different firing */
    if(rnd()<.5){
      ctx.fillStyle=kA(pick(["#4a3a28","#2a2018","#46362a"]),R(.06,.14));
      ctx.fillRect(x+rnd()*w,py,step*R(.4,.9),sp);
    }
    py+=sp;row++;
  }
}
/* brushy blocking: SOFT lozenges of tone that melt into the field —
   the paint flows; nothing boxy survives */
function kBrush(ctx,x,y,w,h,cols,n,al0,al1,angBias){
  for(let i=0;i<n;i++){
    const px=x+rnd()*w,py=y+rnd()*h;
    const pw=R(.07,.24)*Math.min(w,h*4),ph=pw*R(.16,.34);
    const c=pick(cols);
    ctx.save();
    ctx.translate(px,py);ctx.rotate((angBias||0)+R(-.15,.15));
    ctx.scale(1,Math.max(.05,ph/pw));
    const g=ctx.createRadialGradient(0,0,0,0,0,pw/2);
    g.addColorStop(0,kA(c,R(al0,al1)));
    g.addColorStop(1,kA(c,0));
    ctx.fillStyle=g;
    ctx.fillRect(-pw/2,-pw/2,pw,pw);
    ctx.restore();
  }
}

/* the city behind everything: a dense warm-pastel carpet of small
   buildings, window-lit, receding band by band into the teal haze —
   Tokyo alive to the horizon */
function kCity(ctx,W,H,horizon,u,hour,maxH){
  const skyHz=KP.skyHz;
  /* a few soft clouds drift high over the city */
  for(let i=0;i<RI(3,6);i++){
    const cx2=W*rnd(),cy2=horizon*R(.1,.6),cw=W*R(.06,.16);
    ctx.save();ctx.translate(cx2,cy2);ctx.scale(1,R(.18,.3));
    const g=ctx.createRadialGradient(0,0,0,0,0,cw/2);
    g.addColorStop(0,kA("#8fb0aa",R(.05,.1)));g.addColorStop(1,kA("#8fb0aa",0));
    ctx.fillStyle=g;ctx.fillRect(-cw/2,-cw/2,cw,cw);
    ctx.restore();
  }
  /* three bands of buildings, far to near, each clearer and taller */
  const bands=[
    {t:.82,hM:.45,lift:maxH*.22},
    {t:.52,hM:.7, lift:maxH*.1},
    {t:.2, hM:1,  lift:0}
  ];
  for(const B of bands){
    const base=horizon-B.lift;
    let x=-W*.02;
    while(x<W){
      if(rnd()<.05){x+=W*R(.005,.02);continue;}
      const bw=W*R(.014,.05)*(1.15-B.t*.4);
      const bh=H*.012+maxH*Math.pow(rnd(),2.1)*B.hM*(.5+.5*(1-B.t));
      /* pastel, but at dusk's value: the face darkens first, then hazes */
      const dusk=kMix(pick(KP.cityFaces),"#1a1512",R(.5,.62));
      const face=kMix(dusk,skyHz,Math.min(1,B.t*.55+R(0,.1)));
      ctx.fillStyle=face;
      kPRect(ctx,x,base-bh,bw,bh+H*.012,.7,Math.min(3*u,bw*.12));
      /* the roof's darker cap */
      ctx.fillStyle=kMix("#221e26",skyHz,B.t*.55);
      ctx.fillRect(x,base-bh,bw,Math.min(7*u,bh*.14));
      /* windows: a loose warm grid of small lights */
      if(rnd()<.92){
        const cw2=Math.max(5.5*u,bw/RI(2,5)),rh=8*u;
        const litP=(.32+.2*rnd())*(1-B.t*.5);
        for(let wy=base-bh+rh*1.1;wy<base-rh*.4;wy+=rh){
          for(let wx=x+bw*.1;wx<x+bw*.88;wx+=cw2){
            if(rnd()>litP)continue;
            ctx.fillStyle=kA(pick(KP.winC),R(.5,.95)*(1-B.t*.5));
            ctx.fillRect(wx+R(0,1.4)*u,wy+R(0,1.4)*u,R(2.2,3.6)*u,R(2,3.2)*u);
          }
        }
      }
      /* the odd lit shopfront at street level of the near band */
      if(B.t<.3&&rnd()<.18){
        ctx.fillStyle=kA(pick(["#ffce8e","#e8f0d0","#ffb87a"]),.5);
        ctx.fillRect(x+bw*.12,base-H*.014,bw*.76,H*.012);
      }
      /* a vertical sign or a beacon, sparingly, near only */
      if(B.t<.3&&rnd()<.07){
        const sc2=pick(KP.neon),sw2=R(5,9)*u,sh3=H*R(.03,.07);
        ctx.fillStyle=kA(sc2,.55);
        kPRect(ctx,x+bw*R(.2,.7),base-bh*R(.5,.9),sw2,sh3,.5,2*u);
        ctx.globalCompositeOperation="lighter";
        kGlow(ctx,x+bw*.45,base-bh*.7,sw2*3.6,sc2,.12,sh3*.7);
        ctx.globalCompositeOperation="source-over";
      }
      if(B.t<.3&&bh>maxH*.7&&rnd()<.4){
        ctx.fillStyle="rgba(214,92,84,.8)";
        ctx.beginPath();ctx.arc(x+bw*R(.3,.7),base-bh-H*.003,1.6*u,0,7);ctx.fill();
      }
      x+=bw+W*R(.0005,.008);
    }
    /* the haze settles between this band and the next */
    if(B.t>.3){
      const hz=ctx.createLinearGradient(0,base-maxH,0,base);
      hz.addColorStop(0,kA(skyHz,0));hz.addColorStop(1,kA(skyHz,.28*B.t));
      ctx.fillStyle=hz;ctx.fillRect(0,base-maxH,W,maxH);
    }
  }
  /* warm breath rises off the lit quarters */
  ctx.globalCompositeOperation="lighter";
  for(let i=0;i<RI(5,9);i++)
    kGlow(ctx,W*rnd(),horizon-maxH*R(.1,.55),W*R(.03,.09),"#ffcf96",R(.04,.08));
  ctx.globalCompositeOperation="source-over";
  /* the city stands on its own dark edge */
  ctx.fillStyle="#100e0e";
  ctx.fillRect(0,horizon-H*.008,W,H*.011);
}

function kRR(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

/* a standing silhouette, faceless, rim-lit from the source side.
   dir=+1 means the light is to the figure's right. The lit contour is
   stored while the body is built, so the rim light retraces the SAME
   curve and never floats free of the form. */
function kFigure(ctx,fx,fy,fh,dir,rimH,opts={}){
  const u=fh/7.2;
  const dark="#0a0f15";
  const shW=u*1.08;
  const hemW=u*1.22;
  const hemY=fy-fh*.4, shY=fy-fh*.77;
  const hx=fx+dir*u*.12, hy=fy-fh*.855, hr=opts.hood?u*.52:u*.43;
  ctx.save();
  ctx.fillStyle=dark;
  /* legs in a slight stance, tucked under the hem */
  const legW=u*.52,gap=u*.12;
  for(const sgn of [-1,1]){
    const lx=fx+sgn*(gap/2+legW/2);
    const spread=sgn*u*.12;
    ctx.beginPath();
    ctx.moveTo(lx-legW/2,hemY-u*.2);
    ctx.lineTo(lx+legW/2,hemY-u*.2);
    ctx.lineTo(lx+legW*.34+spread,fy);
    ctx.lineTo(lx-legW*.34+spread,fy);
    ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.ellipse(lx+spread+sgn*legW*.2,fy,legW*.62,u*.15,0,0,7);ctx.fill();
  }
  /* jacket + head as one silhouette; the lit edge is replayed for rim.
     The side runs hip-out, waist-in, shoulder-round — never a slab. */
  const side=(sg)=>({
    hem:[fx+sg*hemW*.94,hemY],
    hip:[fx+sg*hemW*1.12,fy-fh*.55],
    waist:[fx+sg*shW*.96,shY+u*1.25],
    sh:[fx+sg*shW,shY+u*.3],
    shTop:[fx+sg*shW*.66,shY-u*.18],
    neck:[fx+sg*u*.46,shY-u*.18]
  });
  const Ls=side(-dir),Rs=side(dir);
  ctx.beginPath();
  ctx.moveTo(Ls.hem[0],Ls.hem[1]);
  ctx.bezierCurveTo(Ls.hip[0],Ls.hip[1], Ls.waist[0],Ls.waist[1], Ls.sh[0],Ls.sh[1]);
  ctx.quadraticCurveTo(Ls.shTop[0],Ls.shTop[1], Ls.neck[0],Ls.neck[1]);
  /* the head sinks into the collar — a hunched figure has no neck */
  ctx.quadraticCurveTo(hx-hr*1.02,hy+hr*.5, hx-hr*.96,hy-hr*.1);
  ctx.quadraticCurveTo(hx-hr*.88,hy-hr*1, hx,hy-hr*1.06);
  ctx.quadraticCurveTo(hx+hr*.88,hy-hr*1, hx+hr*.96,hy-hr*.1);
  ctx.quadraticCurveTo(hx+hr*1.02,hy+hr*.5, Rs.neck[0],Rs.neck[1]);
  ctx.quadraticCurveTo(Rs.shTop[0],Rs.shTop[1], Rs.sh[0],Rs.sh[1]);
  ctx.bezierCurveTo(Rs.waist[0],Rs.waist[1], Rs.hip[0],Rs.hip[1], Rs.hem[0],Rs.hem[1]);
  ctx.quadraticCurveTo(fx,hemY+u*.18, Ls.hem[0],Ls.hem[1]);
  ctx.closePath();ctx.fill();
  /* the near arm, a quiet bend toward the light */
  ctx.beginPath();
  ctx.moveTo(fx+dir*shW*.8,shY+u*.7);
  ctx.quadraticCurveTo(fx+dir*shW*1.32,shY+u*1.4, fx+dir*shW*.78,shY+u*2.05);
  ctx.quadraticCurveTo(fx+dir*shW*.5,shY+u*1.7, fx+dir*shW*.58,shY+u*1.0);
  ctx.closePath();ctx.fill();
  /* a bucket hat, if worn */
  if(opts.hat){
    ctx.beginPath();ctx.ellipse(hx,hy-hr*.42,hr*1.22,hr*.3,dir*.06,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(hx,hy-hr*.72,hr*.92,hr*.52,0,3.14,6.28);ctx.fill();
  }
  /* the near side of the figure catches the lamp: a soft wash clipped
     to the body, falling off across the back */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(Ls.hem[0],Ls.hem[1]);
  ctx.bezierCurveTo(Ls.hip[0],Ls.hip[1], Ls.waist[0],Ls.waist[1], Ls.sh[0],Ls.sh[1]);
  ctx.quadraticCurveTo(Ls.shTop[0],Ls.shTop[1], Ls.neck[0],Ls.neck[1]);
  ctx.quadraticCurveTo(hx-hr*1.02,hy+hr*.5, hx-hr*.96,hy-hr*.1);
  ctx.quadraticCurveTo(hx-hr*.88,hy-hr*1, hx,hy-hr*1.06);
  ctx.quadraticCurveTo(hx+hr*.88,hy-hr*1, hx+hr*.96,hy-hr*.1);
  ctx.quadraticCurveTo(hx+hr*1.02,hy+hr*.5, Rs.neck[0],Rs.neck[1]);
  ctx.quadraticCurveTo(Rs.shTop[0],Rs.shTop[1], Rs.sh[0],Rs.sh[1]);
  ctx.bezierCurveTo(Rs.waist[0],Rs.waist[1], Rs.hip[0],Rs.hip[1], Rs.hem[0],Rs.hem[1]);
  ctx.quadraticCurveTo(fx,hemY+u*.18, Ls.hem[0],Ls.hem[1]);
  ctx.closePath();ctx.clip();
  const lw2=ctx.createLinearGradient(fx+dir*hemW*1.1,0,fx-dir*hemW*.9,0);
  lw2.addColorStop(0,kA(rimH,opts.lit===undefined?.16:opts.lit));
  lw2.addColorStop(.55,kA(rimH,.04));
  lw2.addColorStop(1,kA(rimH,0));
  ctx.fillStyle=lw2;
  ctx.fillRect(fx-hemW*2,hy-hr*1.4,hemW*4,fh*1.2);
  /* the fabric is not flat: a few quiet fold shadows */
  ctx.fillStyle="rgba(4,8,12,.35)";
  for(let i=0;i<3;i++){
    const fy2=shY+u*R(1.2,3.6);
    ctx.fillRect(fx-shW*.7+R(-1,1)*u*.3,fy2,shW*R(.8,1.3),u*R(.1,.22));
  }
  ctx.restore();
  /* rim light: the SAME lit contour, retraced exactly */
  ctx.strokeStyle=kA(rimH,.5);
  ctx.lineWidth=Math.max(1.4,u*.05);
  ctx.lineCap="round";
  ctx.beginPath();
  ctx.moveTo(Rs.sh[0],Rs.sh[1]);
  ctx.bezierCurveTo(Rs.waist[0],Rs.waist[1], Rs.hip[0],Rs.hip[1], Rs.hem[0],Rs.hem[1]);
  ctx.stroke();
  /* the head's lit edge — only when bare-headed; a hat shades it */
  if(!opts.hat){
    ctx.strokeStyle=kA(rimH,.38);
    ctx.beginPath();
    ctx.ellipse(hx,hy-hr*.08,hr*.96,hr*.92,0,dir>0?-1.1:2.6,dir>0?.4:4.1);
    ctx.stroke();
  }
  ctx.globalCompositeOperation="lighter";
  kGlow(ctx,fx+dir*shW*.85,shY+u*.5,u*.85,rimH,.12);
  ctx.globalCompositeOperation="source-over";
  ctx.restore();
}

/* sagging wires across the sky — the night's calligraphy */
function kWires(ctx,W,y0,n,col,u){
  ctx.strokeStyle=col;
  for(let i=0;i<n;i++){
    const ya=y0+R(-30,60)*u/3,yb=ya+R(-40,40)*u/3,sag=R(20,90)*u/3;
    ctx.lineWidth=Math.max(1,R(.8,2)*u/3);
    ctx.beginPath();
    ctx.moveTo(-10,ya);
    ctx.quadraticCurveTo(W*R(.3,.7),Math.max(ya,yb)+sag,W+10,yb);
    ctx.stroke();
  }
}

/* the painterly skin laid over every nocturne at the end */
function* keitaFinish(C,statusCb,prog){
  const {W,H}=C;const u=(W+H)/2000;
  statusCb(0,0,{keita:"breathing on the lamps"});
  /* halation: a downscaled copy, squared to keep the darks dark, laid
     back over the painting additively — the lights bleed, as oil and
     varnish and a wet night make them bleed */
  {
    const sc=8;
    const bl=document.createElement("canvas");
    bl.width=Math.max(2,Math.round(W/sc));bl.height=Math.max(2,Math.round(H/sc));
    const bc=bl.getContext("2d");
    bc.drawImage(hi,0,0,bl.width,bl.height);
    bc.globalCompositeOperation="multiply";
    bc.drawImage(bl,0,0);                     /* square → threshold-ish */
    const bl2=document.createElement("canvas");
    bl2.width=Math.max(2,Math.round(W/(sc*2.5)));bl2.height=Math.max(2,Math.round(H/(sc*2.5)));
    bl2.getContext("2d").drawImage(bl,0,0,bl2.width,bl2.height);
    hctx.globalCompositeOperation="lighter";
    hctx.globalAlpha=.32;
    hctx.imageSmoothingEnabled=true;
    hctx.drawImage(bl,0,0,W,H);
    hctx.globalAlpha=.26;
    hctx.drawImage(bl2,0,0,W,H);
    hctx.globalAlpha=1;
    hctx.globalCompositeOperation="source-over";
  }
  prog.done++;yield;
  /* a soft overlay of the picture's own blur: oil's quiet cohesion */
  {
    const sc=14;
    const ov=document.createElement("canvas");
    ov.width=Math.max(2,Math.round(W/sc));ov.height=Math.max(2,Math.round(H/sc));
    ov.getContext("2d").drawImage(hi,0,0,ov.width,ov.height);
    hctx.globalCompositeOperation="overlay";
    hctx.globalAlpha=.14;
    hctx.drawImage(ov,0,0,W,H);
    hctx.globalAlpha=1;
    hctx.globalCompositeOperation="source-over";
  }
  statusCb(0,0,{keita:"letting the night settle"});
  /* the facet pass: broad overlay patches modulate the tone the way a
     loaded brush blocks in a night — nothing stays machine-smooth */
  hctx.globalCompositeOperation="overlay";
  for(let i=0;i<240;i++){
    const px=rnd()*W,py=rnd()*H;
    const pw=W*R(.04,.14),ph=pw*R(.18,.4);
    const c=pick(["#1e2a38","#3a3226","#243640","#2e2620","#1c2430"]);
    hctx.save();
    hctx.translate(px,py);hctx.rotate(R(-.25,.25));
    hctx.scale(1,Math.max(.05,ph/pw));
    const g=hctx.createRadialGradient(0,0,0,0,0,pw/2);
    g.addColorStop(0,kA(c,R(.06,.13)));
    g.addColorStop(1,kA(c,0));
    hctx.fillStyle=g;
    hctx.fillRect(-pw/2,-pw/2,pw,pw);
    hctx.restore();
    if(i%80===79)yield;
  }
  hctx.globalCompositeOperation="source-over";
  /* vignette */
  const v=hctx.createRadialGradient(W/2,H*.46,Math.min(W,H)*.42,W/2,H*.5,Math.max(W,H)*.74);
  v.addColorStop(0,"rgba(4,10,18,0)");
  v.addColorStop(1,"rgba(3,8,15,.42)");
  hctx.fillStyle=v;hctx.fillRect(0,0,W,H);
  prog.done++;yield;
  /* fine grain — oil never dries perfectly even */
  statusCb(0,0,{keita:"a last pass of the soft brush"});
  const n=Math.round(W*H/16000);
  for(let i=0;i<n;i++){
    const x=rnd()*W,y=rnd()*H,r=R(.6,2.2)*u;
    hctx.globalAlpha=R(.012,.04);
    hctx.fillStyle=rnd()<.5?"#dfe8ee":"#020910";
    hctx.beginPath();hctx.arc(x,y,r,0,7);hctx.fill();
    if(i%800===799)yield;
  }
  hctx.globalAlpha=1;
  /* a few long, almost invisible brush pulls */
  for(let i=0;i<60;i++){
    const y=rnd()*H,len=R(.1,.4)*W;
    hctx.globalAlpha=R(.012,.03);
    hctx.fillStyle=rnd()<.5?"#cfdde6":"#04111c";
    hctx.fillRect(rnd()*W-len/2,y,len,R(1,3)*u);
  }
  hctx.globalAlpha=1;
  prog.done+=2;yield;
}

/* =========================================================
   scene: jihanki — the vending machine in a night lane
   ========================================================= */
function kJihanki(C,statusCb,steps){
  const {W,H}=C;const u=(W+H)/2000;
  /* one muted dusk; the seed only tilts it a little warmer or cooler */
  const hour="dusk";
  const openSky=rnd()<.85;                   /* the city behind the lane */
  const skyY=openSky?H*R(.32,.44):0;
  const groundY=H*R(.66,.74);
  const wallA=KP.wall[0],wallB=KP.wall[1];
  const groundA=KP.ground[0],groundB=KP.ground[1];
  const glowH=KP.machine;
  const skyA=KP.skyTop,skyB=KP.skyHz;

  /* layout of the machines, needed by several passes */
  const mh=H*R(.48,.58);
  const mw=mh*R(.48,.54);
  const mx=W*R(.34,.54)-mw/2;
  const myb=groundY+H*R(.01,.035);
  const my=myb-mh;
  const second=rnd()<.65;
  const m2w=mw*R(.84,.96), m2x=mx+mw+u*R(4,12);
  const m2y=my+mh*.04, m2h=mh*.96;
  const warm2=rnd()<.6;                       /* the neighbour glows amber */
  const glow2=warm2?KP.sodium:glowH;
  const bodyHues=["#2e4252","#5c2a28","#8e948e","#3a4440","#6e3624"];
  const bodyH=pick(bodyHues),body2=pick(bodyHues);
  const cgx=second?(mx+ (mw+m2w+u*8)/2):(mx+mw/2);

  steps.push({label:"mixing the indigo night",fn:()=>{
    if(openSky){
      const sg=hctx.createLinearGradient(0,0,0,skyY*1.4);
      sg.addColorStop(0,skyA);sg.addColorStop(1,skyB);
      hctx.fillStyle=sg;hctx.fillRect(0,0,W,skyY+2);
      kMottle(hctx,0,0,W,skyY,[skyA,skyB],40,W*.06,W*.2,.1);
    }
    const g=hctx.createLinearGradient(0,skyY,0,groundY);
    g.addColorStop(0,wallA);g.addColorStop(1,wallB);
    hctx.fillStyle=g;hctx.fillRect(0,skyY,W,groundY-skyY+2);
    kMottle(hctx,0,skyY,W,groundY-skyY,[wallA,wallB,"#060d14"],110,W*.04,W*.15,.12);
    kBrush(hctx,0,skyY,W,groundY-skyY,[wallA,wallB,"#2e2418","#120e08"],150,.03,.08,0);
    if(openSky){
      /* the city carries on behind the lane */
      kBrush(hctx,0,0,W,skyY,[skyA,skyB,"#1d4248"],50,.03,.06,0);
      kCity(hctx,W,H,skyY,u,hour,H*R(.16,.24));
    }
  }});
  steps.push({label:"the lane's old wall",fn:()=>{
    hctx.strokeStyle="rgba(2,8,14,.3)";
    const nb=6+RI(0,4);
    for(let i=0;i<=nb;i++){
      const x=W*i/nb+R(-20,20)*u;
      hctx.lineWidth=R(1,2.4)*u;
      hctx.beginPath();hctx.moveTo(x,skyY+R(0,40)*u);hctx.lineTo(x+R(-10,10)*u,groundY);hctx.stroke();
    }
    /* the boards of an old wooden front run the lane */
    hctx.lineWidth=1.4*u;
    hctx.strokeStyle="rgba(8,6,4,.28)";
    for(let y=skyY+R(10,26)*u;y<groundY;y+=R(16,26)*u){
      hctx.beginPath();hctx.moveTo(0,y);hctx.lineTo(W,y+R(-5,5)*u);hctx.stroke();
    }
    /* a shuttered window above the machines, asleep */
    if(rnd()<.7){
      const sx2=W*R(.55,.78),sw2=W*R(.07,.1),sy2=skyY+(groundY-skyY)*R(.12,.3);
      hctx.fillStyle="#171310";
      kPRect(hctx,sx2,sy2,sw2,sw2*.78,.8,3*u);
      hctx.strokeStyle="rgba(120,100,80,.16)";hctx.lineWidth=1.4*u;
      for(let i=1;i<5;i++){
        hctx.beginPath();hctx.moveTo(sx2,sy2+sw2*.78*i/5);
        hctx.lineTo(sx2+sw2,sy2+sw2*.78*i/5);hctx.stroke();
      }
    }
    /* a small sleeping sign board */
    if(rnd()<.6){
      const gx2=W*R(.05,.2),gw2=W*R(.05,.08);
      hctx.fillStyle=kA(pick(KP.neon),.3);
      kPRect(hctx,gx2,skyY+(groundY-skyY)*R(.15,.35),gw2,gw2*.4,.8,2.5*u);
    }
    /* grime gathers at the wall's foot */
    const gr=hctx.createLinearGradient(0,groundY-H*.08,0,groundY);
    gr.addColorStop(0,"rgba(3,8,12,0)");gr.addColorStop(1,"rgba(3,8,12,.5)");
    hctx.fillStyle=gr;hctx.fillRect(0,groundY-H*.08,W,H*.08);
    /* a downpipe with its drip stain */
    if(rnd()<.65){const px=W*R(.8,.94);
      hctx.fillStyle="rgba(4,10,16,.7)";
      hctx.fillRect(px,skyY,R(8,14)*u,groundY-skyY);
      const st=hctx.createLinearGradient(0,skyY,0,groundY);
      st.addColorStop(0,"rgba(2,6,10,.25)");st.addColorStop(1,"rgba(2,6,10,0)");
      hctx.fillStyle=st;hctx.fillRect(px-8*u,skyY,30*u,(groundY-skyY)*.7);}
    /* an air-conditioner box */
    if(rnd()<.55){const bx=W*R(.04,.16),by=groundY-H*R(.3,.44),bw=W*R(.06,.09);
      hctx.fillStyle="#0a141d";
      kRR(hctx,bx,by,bw,bw*.62,bw*.04);hctx.fill();
      hctx.fillStyle="rgba(150,180,200,.12)";
      for(let i=0;i<4;i++)hctx.fillRect(bx+bw*.1,by+bw*.12+i*bw*.11,bw*.8,bw*.03);}
    /* dim posters remember the daytime — small, sunk into the wall */
    for(let i=0;i<RI(1,3);i++){
      const pw=W*R(.03,.055),ph=pw*R(1.25,1.5),px=W*R(.05,.78),py=groundY-H*R(.36,.52);
      hctx.fillStyle="rgba(150,152,144,.1)";
      hctx.fillRect(px,py,pw,ph);
      hctx.fillStyle=kA(pick(["#8a3040","#2a5a78","#7a6a36"]),.08);
      hctx.fillRect(px+pw*.1,py+ph*.08,pw*.8,ph*.4);
      hctx.fillStyle="rgba(20,28,36,.14)";
      for(let r2=0;r2<3;r2++)hctx.fillRect(px+pw*.1,py+ph*(.56+r2*.12),pw*R(.4,.8),ph*.05);
      /* its own faint shadow keeps it on the wall */
      hctx.fillStyle="rgba(3,8,12,.25)";
      hctx.fillRect(px,py+ph,pw,2.2*u);
    }
  }});
  steps.push({label:"pouring the asphalt",fn:()=>{
    const g=hctx.createLinearGradient(0,groundY,0,H);
    g.addColorStop(0,groundB);g.addColorStop(1,groundA);
    hctx.fillStyle=g;hctx.fillRect(0,groundY,W,H-groundY);
    hctx.fillStyle="rgba(2,8,12,.6)";
    hctx.fillRect(0,groundY-2.5*u,W,5*u);
    kMottle(hctx,0,groundY,W,H-groundY,[groundA,groundB,"#100c08"],90,W*.03,W*.13,.14);
    kBrush(hctx,0,groundY,W,H-groundY,[groundA,groundB,"#33281c"],130,.03,.08,0);
    kPavers(hctx,0,groundY+H*.02,W,H-groundY,u);
    /* a kerb edge or drain cover, barely told */
    if(rnd()<.5){
      const ky=H*R(.86,.94);
      hctx.strokeStyle="rgba(130,160,175,.08)";
      hctx.lineWidth=2*u;
      hctx.beginPath();hctx.moveTo(0,ky);hctx.lineTo(W,ky+R(-4,4)*u);hctx.stroke();
    }
  }});

  /* ---- the machines: body, window, lower works ---- */
  const drawBody=(x,y,w,h,body,dim,gl)=>{
    hctx.fillStyle="rgba(2,6,10,.75)";
    hctx.beginPath();hctx.ellipse(x+w/2,y+h+2*u,w*.64,h*.018,0,0,7);hctx.fill();
    const g=hctx.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,kMix(body,"#03070c",dim?.62:.18));
    g.addColorStop(.55,kMix(body,"#03070c",dim?.7:.34));
    g.addColorStop(1,kMix(body,"#03070c",dim?.82:.58));
    hctx.fillStyle=g;
    kPRect(hctx,x,y,w,h,1.7*u);
    /* side faces catch the neighbour's light */
    const sg=hctx.createLinearGradient(x,0,x+w*.18,0);
    sg.addColorStop(0,kA(gl,dim?.05:.12));sg.addColorStop(1,kA(gl,0));
    hctx.fillStyle=sg;hctx.fillRect(x,y,w*.18,h);
    hctx.fillStyle=kA(gl,dim?.12:.3);
    hctx.fillRect(x+w*.02,y+h*.004,w*.96,h*.01);
    if(!dim){
      /* the signage band across the crown, lit from within */
      const by2=y+h*.018,bh2=h*.034;
      hctx.fillStyle=kMix(gl,"#ffffff",.3);
      hctx.fillRect(x+w*.06,by2,w*.88,bh2);
      hctx.fillStyle=kA(pick(["#b8252c","#1f6cc0","#1a8a5e"]),.75);
      for(let i2=0;i2<RI(3,5);i2++)
        hctx.fillRect(x+w*(.12+i2*.16),by2+bh2*.25,w*R(.05,.1),bh2*.5);
      hctx.globalCompositeOperation="lighter";
      kGlow(hctx,x+w/2,by2+bh2/2,w*.5,gl,.16,bh2*2.4);
      hctx.globalCompositeOperation="source-over";
    }
  };
  const drawWindow=(x,y,w,h,dim,gl)=>{
    const wx=x+w*.07,wy=y+h*.05,ww=w*.86,wh=h*.5;
    /* the lit cavity */
    const wg=hctx.createLinearGradient(0,wy,0,wy+wh);
    wg.addColorStop(0,dim?kMix(gl,"#1a232c",.45):kMix(gl,"#e8eef2",.45));
    wg.addColorStop(.85,dim?kMix(gl,"#1a232c",.55):kMix(gl,"#c8d4da",.35));
    wg.addColorStop(1,dim?"#101820":kMix(gl,"#5a7080",.5));
    hctx.fillStyle=wg;
    kPRect(hctx,wx,wy,ww,wh,1.3*u);
    /* three rows of cans */
    const prodCols=["#b8252c","#d8741c","#1a8a5e","#1f6cc0","#d8b22c","#a8325e","#1f9eb0","#d9d6cc","#3a3f8a"];
    const rows=3;
    for(let rI=0;rI<rows;rI++){
      const ry=wy+wh*(.08+rI*.3),rh2=wh*.205;
      /* the row's inner shadow ceiling */
      const rg=hctx.createLinearGradient(0,ry-wh*.03,0,ry+rh2*.4);
      rg.addColorStop(0,"rgba(30,45,58,.4)");rg.addColorStop(1,"rgba(30,45,58,0)");
      hctx.fillStyle=rg;hctx.fillRect(wx+ww*.02,ry-wh*.03,ww*.96,rh2);
      const nIt=5+RI(0,2);
      for(let ci=0;ci<nIt;ci++){
        const slot=ww*.86/nIt,cw=slot*.66,cx=wx+ww*.07+ci*slot+slot*.17;
        const col=pick(prodCols);
        const base=dim?kMix(col,"#202830",.5):col;
        /* a can: cylinder shading, lid hint, label band */
        const cg=hctx.createLinearGradient(cx,0,cx+cw,0);
        cg.addColorStop(0,kMix(base,"#0c1218",.4));
        cg.addColorStop(.3,kMix(base,"#ffffff",dim?.05:.22));
        cg.addColorStop(.7,base);
        cg.addColorStop(1,kMix(base,"#0c1218",.45));
        hctx.fillStyle=cg;
        kRR(hctx,cx,ry,cw,rh2,cw*.18);hctx.fill();
        hctx.fillStyle=dim?"rgba(200,215,225,.18)":"rgba(235,245,250,.55)";
        hctx.fillRect(cx+cw*.08,ry+rh2*.02,cw*.84,rh2*.07);
        if(rnd()<.7){
          hctx.fillStyle=kA(rnd()<.5?"#f2f0e6":"#101826",dim?.2:.5);
          hctx.fillRect(cx+cw*.12,ry+rh2*.38,cw*.76,rh2*.22);
        }
      }
      /* shelf strip + price tabs beneath */
      hctx.fillStyle="rgba(16,26,36,.6)";
      hctx.fillRect(wx+ww*.03,ry+rh2+wh*.012,ww*.94,wh*.024);
      for(let ci=0;ci<nIt;ci++){
        const slot=ww*.86/nIt,cx=wx+ww*.07+ci*slot+slot*.1;
        hctx.fillStyle=dim?"rgba(225,232,236,.25)":"rgba(240,246,250,.85)";
        hctx.fillRect(cx,ry+rh2+wh*.042,slot*.5,wh*.026);
        hctx.fillStyle="rgba(40,40,60,.5)";
        hctx.fillRect(cx+slot*.06,ry+rh2+wh*.05,slot*.32,wh*.008);
      }
    }
    /* glass glare */
    hctx.save();
    hctx.beginPath();hctx.rect(wx,wy,ww,wh);hctx.clip();
    hctx.globalAlpha=dim?.05:.09;
    hctx.fillStyle="#ffffff";
    hctx.beginPath();
    hctx.moveTo(wx+ww*.08,wy+wh);hctx.lineTo(wx+ww*.32,wy);
    hctx.lineTo(wx+ww*.46,wy);hctx.lineTo(wx+ww*.22,wy+wh);
    hctx.closePath();hctx.fill();
    hctx.beginPath();
    hctx.moveTo(wx+ww*.58,wy+wh);hctx.lineTo(wx+ww*.8,wy);
    hctx.lineTo(wx+ww*.88,wy);hctx.lineTo(wx+ww*.66,wy+wh);
    hctx.closePath();hctx.fill();
    hctx.restore();
    hctx.globalAlpha=1;
    /* the window's thin chrome frame */
    hctx.strokeStyle=dim?"rgba(160,180,195,.18)":"rgba(220,235,245,.4)";
    hctx.lineWidth=1.8*u;
    kPoly(hctx,kJit(wx,wy,ww,wh,1.1*u));hctx.stroke();
  };
  const drawLower=(x,y,w,h,dim,gl)=>{
    const py=y+h*.575;
    /* price / select strip */
    hctx.fillStyle="rgba(7,13,20,.65)";
    hctx.fillRect(x+w*.07,py,w*.86,h*.052);
    for(let i=0;i<6;i++){
      hctx.fillStyle=kA(gl,dim?.3:.9);
      hctx.beginPath();hctx.arc(x+w*(.15+i*.12),py+h*.026,w*.013,0,7);hctx.fill();
      if(!dim){hctx.globalCompositeOperation="lighter";
        kGlow(hctx,x+w*(.15+i*.12),py+h*.026,w*.05,gl,.3);
        hctx.globalCompositeOperation="source-over";}
    }
    /* the ad panel — a soft lit rectangle with a colour memory */
    hctx.fillStyle=dim?"rgba(190,205,210,.12)":"rgba(235,244,248,.5)";
    hctx.fillRect(x+w*.07,py+h*.07,w*.36,h*.13);
    hctx.fillStyle=kA(pick(["#b8252c","#1f6cc0","#1a8a5e"]),dim?.15:.4);
    hctx.fillRect(x+w*.1,py+h*.085,w*.3,h*.07);
    /* coin works */
    hctx.fillStyle="rgba(8,14,22,.75)";
    hctx.fillRect(x+w*.6,py+h*.07,w*.3,h*.14);
    hctx.fillStyle=kA("#ffd9a0",dim?.3:.85);
    hctx.fillRect(x+w*.65,py+h*.09,w*.07,h*.011);
    hctx.fillStyle=kA(gl,dim?.25:.7);
    hctx.fillRect(x+w*.65,py+h*.12,w*.17,h*.024);
    /* dispensing flap */
    hctx.fillStyle="rgba(4,8,14,.85)";
    kRR(hctx,x+w*.09,py+h*.235,w*.55,h*.12,w*.018);hctx.fill();
    hctx.fillStyle="rgba(150,190,210,.2)";
    hctx.fillRect(x+w*.11,py+h*.245,w*.51,h*.012);
  };

  steps.push({label:"wheeling in the machine",fn:()=>{
    if(second)drawBody(m2x,m2y,m2w,m2h,body2,true,glow2);
    drawBody(mx,my,mw,mh,bodyH,false,glowH);
  }});
  steps.push({label:"stocking the bright shelf",fn:()=>{
    if(second){drawWindow(m2x,m2y,m2w,m2h,true,glow2);
      drawLower(m2x,m2y,m2w,m2h,true,glow2);}
    drawWindow(mx,my,mw,mh,false,glowH);
    drawLower(mx,my,mw,mh,false,glowH);
  }});
  steps.push({label:"switching the lamp on",fn:()=>{
    hctx.globalCompositeOperation="lighter";
    const cx=mx+mw/2,cy=my+mh*.3;
    /* the wall behind blazes — wide flat washes hugging the lane, never
       a round cloud */
    kGlow(hctx,cx,my+mh*.12,mw*3.1,glowH,.24,mw*1.9);
    kGlow(hctx,cx,cy,mw*1.7,glowH,.13,mw*1.3);
    kGlow(hctx,cx,my+mh*.45,mw*5.2,glowH,.11,mw*2.6);
    if(second){
      kGlow(hctx,m2x+m2w/2,m2y+m2h*.3,m2w*1.5,glow2,.13,m2w*1.1);
      kGlow(hctx,m2x+m2w/2,m2y+m2h*.12,m2w*2.2,glow2,.09,m2w*1.3);
    }
    hctx.globalCompositeOperation="source-over";
  }});
  steps.push({label:"letting the light pool on the asphalt",fn:()=>{
    hctx.globalCompositeOperation="lighter";
    kGlow(hctx,cgx,myb+H*.06,mw*2.6,glowH,.3,mw*1.05);
    if(second&&warm2)kGlow(hctx,m2x+m2w/2,myb+H*.05,m2w*1.3,glow2,.14,m2w*.55);
    /* the whole window smears downward on the asphalt */
    const sm=hctx.createLinearGradient(0,myb,0,myb+H*.26);
    sm.addColorStop(0,kA(glowH,.2));sm.addColorStop(1,kA(glowH,0));
    hctx.fillStyle=sm;
    hctx.fillRect(mx+mw*.05,myb,mw*.9,H*.26);
    /* brighter columns where the cans shine */
    for(let i=0;i<4;i++){
      const rx=mx+mw*(.16+i*.225);
      kGlow(hctx,rx,myb+H*.07,mw*R(.12,.18),glowH,R(.08,.14),H*R(.1,.17));
    }
    /* the pool breaks into dapples: small horizontal patches of paint,
       dense near the machine, scattering with distance */
    const nd=Math.round(420);
    for(let i=0;i<nd;i++){
      const t=Math.pow(rnd(),1.6);
      const dy=myb+H*.012+t*(H-myb)*.85;
      const spread=mw*(0.7+t*2.6);
      const dx=cgx+R(-1,1)*spread;
      const persp=.35+t*1.1;
      const close=1-Math.min(1,Math.abs(dx-cgx)/(spread+1));
      const al=R(.05,.2)*(1-t*.75)*(.4+.6*close);
      kGlow(hctx,dx,dy,R(7,26)*u*persp,rnd()<.85?glowH:"#fff6da",al,R(2.4,6)*u*persp);
    }
    hctx.globalCompositeOperation="source-over";
    /* and soft dark passages ride inside the pool, the asphalt's tooth */
    for(let i=0;i<140;i++){
      const t=Math.pow(rnd(),1.5);
      const dy=myb+H*.02+t*(H-myb)*.7;
      const dx=cgx+R(-1,1)*mw*(0.6+t*2);
      const persp=.35+t*1.1;
      kGlow(hctx,dx,dy,R(6,20)*u*persp,groundA,R(.12,.32),R(2,5)*u*persp);
    }
  }});
  if(rnd()<.55)steps.push({label:"posting the lone figure",fn:()=>{
    const dir=rnd()<.65?-1:1;                /* which side the light is */
    const fh=mh*R(.8,.9);
    const fx=dir<0
      ?mx+mw*R(1.05,1.3)+(second?m2w*R(0,.6):0)
      :mx-mw*R(.22,.5);
    kFigure(hctx,fx,myb+H*R(.015,.035),fh,dir,glowH,
      {hat:rnd()<.5,hood:rnd()<.4});
  }});
  steps.push({label:"stringing the wires",fn:()=>{
    if(rnd()<.8)kWires(hctx,W,H*R(.03,openSky?.16:.1),RI(2,4),"rgba(2,7,12,.6)",u*3);
    hctx.globalCompositeOperation="lighter";
    kGlow(hctx,cgx,my+mh*.35,Math.max(W,H)*.95,glowH,.06);
    hctx.globalCompositeOperation="source-over";
  }});
}

/* =========================================================
   scene: denwa — the warm phone box on an empty road
   ========================================================= */
function kDenwa(C,statusCb,steps){
  const {W,H}=C;const u=(W+H)/2000;
  const horizon=H*R(.42,.5);
  const walkY=H*R(.8,.86);              /* the sidewalk's near edge */
  const skyA=KP.skyTop,skyB=KP.skyHz;
  const roadA=KP.road[0],roadB=KP.road[1];
  const walkA=KP.ground[0],walkB=KP.ground[1];
  const warm=KP.booth,warmDeep="#d98a3a";
  const bw=H*R(.21,.24),bh=bw*R(2.1,2.3);
  const bx=W*R(.56,.7)-bw/2,bby=walkY+H*R(.02,.05),by=bby-bh;

  steps.push({label:"mixing the green evening",fn:()=>{
    const sg=hctx.createLinearGradient(0,0,0,horizon*1.15);
    sg.addColorStop(0,skyA);sg.addColorStop(.7,kMix(skyA,skyB,.55));sg.addColorStop(1,skyB);
    hctx.fillStyle=sg;hctx.fillRect(0,0,W,horizon+2);
    kMottle(hctx,0,0,W,horizon,[skyA,skyB,"#0a2a30"],70,W*.05,W*.2,.1);
    kBrush(hctx,0,0,W,horizon,[skyA,skyB,"#1d4248"],70,.03,.06,0);
    /* Tokyo across the road: towers, windows, neon */
    kCity(hctx,W,H,horizon,u,"green",H*R(.22,.3));
  }});
  steps.push({label:"laying the road",fn:()=>{
    const g=hctx.createLinearGradient(0,horizon,0,walkY);
    g.addColorStop(0,kMix(roadB,skyB,.18));g.addColorStop(1,roadA);
    hctx.fillStyle=g;hctx.fillRect(0,horizon,W,walkY-horizon+2);
    kMottle(hctx,0,horizon,W,walkY-horizon,[roadA,roadB],70,W*.04,W*.14,.12);
    kBrush(hctx,0,horizon,W,walkY-horizon,[roadA,roadB,"#222c3a"],110,.03,.07,0);
    /* the centre line, broken, hurrying away */
    hctx.fillStyle="rgba(190,210,200,.16)";
    let t=0;
    while(t<1){
      const y=horizon+(walkY-horizon)*t;
      const sc2=.2+t*1.1;
      hctx.fillRect(W*R(.3,.32),y,26*u*sc2,4*u*sc2);
      t+=.13+t*.12;
    }
    /* the sidewalk, a shade lighter, with its kerb */
    const wg=hctx.createLinearGradient(0,walkY,0,H);
    wg.addColorStop(0,walkB);wg.addColorStop(1,walkA);
    hctx.fillStyle=wg;hctx.fillRect(0,walkY,W,H-walkY);
    hctx.fillStyle="rgba(200,225,215,.12)";
    hctx.fillRect(0,walkY,W,2.6*u);
    hctx.fillStyle="rgba(3,10,9,.5)";
    hctx.fillRect(0,walkY+2.6*u,W,3*u);
    kMottle(hctx,0,walkY,W,H-walkY,[walkA,walkB,"#241a10"],60,W*.03,W*.12,.13);
    kBrush(hctx,0,walkY,W,H-walkY,[walkA,walkB,"#33281c","#181208"],90,.03,.08,0);
    /* the warm paver work his sidewalks stand on */
    kPavers(hctx,0,walkY+H*.01,W,H-walkY,u);
    /* the tactile strip runs the kerb, its yellow long since muted */
    hctx.fillStyle="rgba(150,128,58,.22)";
    hctx.fillRect(0,walkY+H*.012,W,H*.016);
  }});
  steps.push({label:"raising the poles",fn:()=>{
    /* a guardrail along the kerb, catching a little sky */
    hctx.strokeStyle="rgba(150,180,170,.3)";
    hctx.lineWidth=4.5*u;
    hctx.beginPath();hctx.moveTo(0,walkY-H*.022);hctx.lineTo(W,walkY-H*.028);hctx.stroke();
    hctx.lineWidth=3.4*u;
    for(let i=0;i<9;i++){
      const px=W*(i/8)+R(-10,10)*u;
      hctx.beginPath();hctx.moveTo(px,walkY-H*.024);hctx.lineTo(px,walkY);hctx.stroke();
    }
    /* telephone poles: one near, one or two far */
    const drawPole=(px,scale)=>{
      const pw=9*u*scale,top=horizon-H*.34*scale;
      hctx.fillStyle="#091a18";
      hctx.fillRect(px-pw/2,top,pw,walkY-top);
      hctx.fillRect(px-pw*2.4,top+H*.02*scale,pw*4.8,3.4*u*scale);
      hctx.fillRect(px-pw*1.8,top+H*.05*scale,pw*3.6,3*u*scale);
      if(rnd()<.6){ /* the transformer drum */
        hctx.fillRect(px+pw*.5,top+H*.06*scale,pw*1.5,H*.035*scale);
      }
    };
    drawPole(W*R(.12,.2),1);
    drawPole(W*R(.42,.5),.55);
    if(rnd()<.6)drawPole(W*R(.78,.95),.4);
    kWires(hctx,W,H*R(.04,.12),RI(4,7),"rgba(6,6,8,.5)",u*3);
    /* the lamplighter's work: one or two warm lanterns down the walk */
    kLamp(hctx,W*R(.06,.16),walkY+H*R(.04,.1),H*R(.3,.4),u);
    if(rnd()<.5)kLamp(hctx,W*R(.86,.96),walkY+H*R(.02,.06),H*R(.24,.32),u);
  }});
  steps.push({label:"building the booth",fn:()=>{
    /* the booth's host: a dark building edge behind it, just entering */
    if(rnd()<.6){
      hctx.fillStyle="#191510";
      kPRect(hctx,W*R(.88,.94),horizon-H*R(.2,.32),W*.2,H*.8,1,6*u);
      hctx.fillStyle=kA(KP.win,.4);
      hctx.fillRect(W*R(.93,.97),horizon-H*R(.1,.22),5*u,4*u);
    }
    /* its shadow first — tight under the frame, never a dark ring */
    hctx.fillStyle="rgba(2,8,8,.45)";
    hctx.beginPath();hctx.ellipse(bx+bw/2,bby+1.4*u,bw*.56,H*.008,0,0,7);hctx.fill();
    /* the frame */
    const fg=hctx.createLinearGradient(0,by,0,bby);
    fg.addColorStop(0,"#2c261d");fg.addColorStop(1,"#16110b");
    hctx.fillStyle=fg;
    kPRect(hctx,bx,by,bw,bh,1.7*u);
    /* roof slab + lit crown sign */
    hctx.fillStyle="#1c170f";
    hctx.fillRect(bx-bw*.06,by-bh*.012,bw*1.12,bh*.03);
    hctx.fillStyle=kMix("#f2ecd8","#ffffff",.25);
    hctx.fillRect(bx+bw*.1,by+bh*.018,bw*.8,bh*.042);
    hctx.fillStyle="rgba(80,72,52,.7)";
    hctx.fillRect(bx+bw*.2,by+bh*.03,bw*.6,bh*.018);
    /* the warm glass: three vertical panels each side of a mullion */
    const gx=bx+bw*.08,gy=by+bh*.08,gw=bw*.84,gh=bh*.84;
    const gg=hctx.createLinearGradient(0,gy,0,gy+gh);
    gg.addColorStop(0,kMix(warm,"#ffffff",.42));
    gg.addColorStop(.45,warm);
    gg.addColorStop(1,kMix(warmDeep,"#5a3417",.4));
    hctx.fillStyle=gg;
    kPRect(hctx,gx,gy,gw,gh,1.3*u);
    /* the telephone on its shelf, half lost in the warmth */
    hctx.fillStyle="rgba(58,52,40,.85)";
    kRR(hctx,gx+gw*.18,gy+gh*.4,gw*.36,gh*.16,gw*.04);hctx.fill();
    hctx.fillStyle="rgba(24,20,14,.9)";
    hctx.fillRect(gx+gw*.22,gy+gh*.43,gw*.12,gh*.1);
    hctx.fillStyle="rgba(2,10,9,.55)";
    hctx.fillRect(gx+gw*.18,gy+gh*.56,gw*.36,gh*.014);
    /* the shelf's shadow falls down the glass */
    const shg=hctx.createLinearGradient(0,gy+gh*.56,0,gy+gh*.9);
    shg.addColorStop(0,"rgba(90,40,10,.32)");shg.addColorStop(1,"rgba(90,40,10,0)");
    hctx.fillStyle=shg;hctx.fillRect(gx,gy+gh*.56,gw,gh*.34);
    /* mullions: the frame's dark bones over the glass */
    hctx.fillStyle="#1a150e";
    hctx.fillRect(gx+gw*.485,gy,gw*.03,gh);
    for(let i=1;i<4;i++)hctx.fillRect(gx,gy+gh*i/4-bh*.006,gw,bh*.012);
    hctx.fillStyle="rgba(255,235,200,.25)";
    hctx.fillRect(gx,gy,gw,bh*.008);
    /* the lamp inside, at the crown of the glass */
    hctx.globalCompositeOperation="lighter";
    kGlow(hctx,gx+gw/2,gy+gh*.08,gw*.8,"#ffe2b0",.5,gh*.16);
    hctx.globalCompositeOperation="source-over";
  }});
  steps.push({label:"letting the warmth out",fn:()=>{
    hctx.globalCompositeOperation="lighter";
    kGlow(hctx,bx+bw/2,by+bh*.3,bw*3.4,warm,.2,bh*.9);
    kGlow(hctx,bx+bw/2,by+bh*.55,bw*6,warm,.1,bh*1.1);
    /* the pool on the pavement */
    kGlow(hctx,bx+bw/2,bby+H*.03,bw*2.6,warm,.32,bw*1.0);
    const sm=hctx.createLinearGradient(0,bby,0,bby+H*.2);
    sm.addColorStop(0,kA(warm,.22));sm.addColorStop(1,kA(warm,0));
    hctx.fillStyle=sm;hctx.fillRect(bx+bw*.04,bby,bw*.92,H*.2);
    /* warm dapples walk away from the door */
    for(let i=0;i<260;i++){
      const t=Math.pow(rnd(),1.5);
      const dy=bby+H*.012+t*(H-bby)*.8;
      const spread=bw*(0.9+t*2.4);
      const dx=bx+bw/2+R(-1,1)*spread;
      const persp=.4+t*1.1;
      const close=1-Math.min(1,Math.abs(dx-bx-bw/2)/(spread+1));
      kGlow(hctx,dx,dy,R(7,24)*u*persp,rnd()<.8?warm:"#ffe9c4",
        R(.05,.18)*(1-t*.7)*(.4+.6*close),R(2.4,5.6)*u*persp);
    }
    hctx.globalCompositeOperation="source-over";
    for(let i=0;i<90;i++){
      const t=Math.pow(rnd(),1.4);
      const dy=bby+H*.02+t*(H-bby)*.6;
      const dx=bx+bw/2+R(-1,1)*bw*(0.7+t*1.8);
      kGlow(hctx,dx,dy,R(6,18)*u,walkA,R(.12,.32),R(2,4.4)*u);
    }
    /* far streetlamps down the road, tiny and patient */
    hctx.globalCompositeOperation="lighter";
    for(let i=0;i<RI(2,4);i++){
      const lx=W*R(.02,.4),ly=horizon-H*R(.04,.12);
      hctx.fillStyle=kA("#ffd9a0",.9);
      hctx.fillRect(lx,ly,3.4*u,3*u);
      kGlow(hctx,lx,ly,26*u,"#ffd9a0",.3);
    }
    hctx.globalCompositeOperation="source-over";
  }});
  if(rnd()<.35)steps.push({label:"posting the passer-by",fn:()=>{
    const dir=bx>W*.5?1:-1;
    const fx=bx+bw/2-dir*bw*R(1.2,2.2);
    kFigure(hctx,fx,walkY+H*R(.04,.08),bh*R(.52,.6),dir,warm,
      {hood:rnd()<.5,hat:rnd()<.3});
  }});
}

/* =========================================================
   scene: konbini — the all-night corner store, frontal
   ========================================================= */
function kKonbini(C,statusCb,steps){
  const {W,H}=C;const u=(W+H)/2000;
  const skyY=H*R(.12,.18);
  const groundY=H*R(.68,.74);
  const skyA=KP.skyTop,skyB=KP.skyHz;
  const groundA=KP.ground[0],groundB=KP.ground[1];
  const glowH=KP.store;
  /* the store lives on the ground floor of its building */
  const hostY=skyY+H*R(.01,.03);
  /* the house stripes: orange, green, red on the pale band — always */
  const stripes=["#e8650f","#0fa066","#cc2f1f"];
  const fasY=skyY+H*R(.13,.19),fasH=H*R(.085,.105);
  const glY=fasY+fasH,glH=groundY-glY;
  const doorX=W*R(.42,.6),doorW=W*R(.085,.105);
  const brickX=rnd()<.5?W*R(.06,.12):-1;     /* a brick pier at the left */
  const brickW=W*R(.07,.1);

  steps.push({label:"mixing the indigo night",fn:()=>{
    const sg=hctx.createLinearGradient(0,0,0,skyY*1.3);
    sg.addColorStop(0,skyA);sg.addColorStop(1,skyB);
    hctx.fillStyle=sg;hctx.fillRect(0,0,W,skyY+2);
    kMottle(hctx,0,0,W,skyY,[skyA,skyB],40,W*.06,W*.2,.1);
    kBrush(hctx,0,0,W,skyY,[skyA,skyB,"#1d4248"],50,.03,.06,0);
    /* the city stacks up behind the store */
    kCity(hctx,W,H,skyY,u,"green",H*R(.14,.2));
  }});
  steps.push({label:"raising the shopfront",fn:()=>{
    /* the building band behind the glass */
    hctx.fillStyle="#16120d";
    hctx.fillRect(0,skyY,W,groundY-skyY+2);
    /* the host building: a dark muted facade above the fascia, with a
       window row, AC boxes, a balcony rail — the store sits IN a city */
    const fgd=hctx.createLinearGradient(0,hostY,0,fasY);
    fgd.addColorStop(0,"#221d18");fgd.addColorStop(1,"#322a20");
    hctx.fillStyle=fgd;
    kPRect(hctx,-u*4,hostY,W+u*8,fasY-hostY+u*2,1,5*u);
    kBrush(hctx,0,hostY,W,fasY-hostY,["#241e16","#352c20","#1c1812"],70,.04,.09,0);
    /* the window row — most asleep, one or two awake */
    const nwin=RI(5,8),wh2=(fasY-hostY)*R(.34,.44);
    for(let i=0;i<nwin;i++){
      const wx2=W*(i+.5)/nwin+R(-12,12)*u,ww2=W*R(.035,.05);
      const lit=rnd()<.22;
      hctx.fillStyle=lit?kA(KP.win,R(.5,.75)):"rgba(10,12,18,.8)";
      kPRect(hctx,wx2-ww2/2,hostY+(fasY-hostY)*R(.22,.32),ww2,wh2,.7,2.5*u);
      if(lit){
        hctx.globalCompositeOperation="lighter";
        kGlow(hctx,wx2,hostY+(fasY-hostY)*.45,ww2*1.6,KP.win,.16);
        hctx.globalCompositeOperation="source-over";
      }
      if(rnd()<.3){ /* an AC box hangs below */
        hctx.fillStyle="#15110d";
        kPRect(hctx,wx2-ww2*.3,fasY-(fasY-hostY)*.16,ww2*.6,(fasY-hostY)*.13,.6,2*u);
      }
    }
    /* the balcony rail's thin line */
    hctx.strokeStyle="rgba(120,104,84,.2)";hctx.lineWidth=1.6*u;
    hctx.beginPath();hctx.moveTo(0,hostY+(fasY-hostY)*.68);
    hctx.lineTo(W,hostY+(fasY-hostY)*.68+R(-3,3)*u);hctx.stroke();
    /* the corner carries its vertical sign */
    if(rnd()<.7){
      const sx2=W*pick([R(.02,.05),R(.93,.96)]),sw2=W*.022;
      const sc2=pick(KP.neon);
      hctx.fillStyle=kA(sc2,.6);
      kPRect(hctx,sx2,hostY+(fasY-hostY)*.1,sw2,(fasY-hostY)*.86,.7,3*u);
      hctx.fillStyle="rgba(12,12,14,.6)";
      for(let g2=0;g2<4;g2++)
        hctx.fillRect(sx2+sw2*.25,hostY+(fasY-hostY)*(.2+g2*.17),sw2*.5,(fasY-hostY)*.05);
      hctx.globalCompositeOperation="lighter";
      kGlow(hctx,sx2+sw2/2,hostY+(fasY-hostY)*.5,sw2*4,sc2,.18,(fasY-hostY)*.5);
      hctx.globalCompositeOperation="source-over";
    }
    /* fascia: the lit white band with its stripes */
    const fg=hctx.createLinearGradient(0,fasY,0,fasY+fasH);
    fg.addColorStop(0,"#e9f0dc");
    fg.addColorStop(.8,"#cfdfc8");
    fg.addColorStop(1,"#94ac96");
    hctx.fillStyle=fg;
    kPRect(hctx,-u*4,fasY,W+u*8,fasH,1.8*u);
    /* three stripes and three only: orange, then green, then red */
    stripes.forEach((sc,i)=>{
      hctx.fillStyle=sc;
      kPRect(hctx,-u*4,fasY+fasH*(.2+i*.22),W+u*8,fasH*.15,1*u);
    });

    /* the fascia's soft drop shadow onto the glass below */
    const fsh=hctx.createLinearGradient(0,glY,0,glY+glH*.18);
    fsh.addColorStop(0,"rgba(6,18,16,.55)");fsh.addColorStop(1,"rgba(6,18,16,0)");
    hctx.fillStyle="#0d2624";hctx.fillRect(0,glY,W,glH);
    hctx.fillStyle=fsh;hctx.fillRect(0,glY,W,glH*.18);
  }});
  steps.push({label:"lighting the shelves",fn:()=>{
    /* the glass band: a green-white interior with shelf memories */
    const inset=W*.012;
    const gg=hctx.createLinearGradient(0,glY,0,groundY);
    gg.addColorStop(0,"#c2d6ba");
    gg.addColorStop(.6,"#a4c0a6");
    gg.addColorStop(1,"#74907e");
    hctx.fillStyle=gg;
    kPRect(hctx,inset,glY+glH*.06,W-inset*2,glH*.94,1.5*u);
    /* the ceiling's lamp strips, seen through the glass */
    hctx.fillStyle="rgba(255,255,250,.5)";
    for(let i=0;i<RI(3,5);i++)
      hctx.fillRect(inset+(W-inset*2)*R(.04,.86),glY+glH*R(.07,.13),W*R(.04,.08),glH*.022);
    /* the ad band runs below the ceiling: a row of framed panels */
    const prodCols=["#b8252c","#d8741c","#1a8a5e","#1f6cc0","#d8b22c","#a8325e","#1f9eb0","#e9e6da"];
    {
      let ax=inset*2+W*R(0,.03);
      const ay=glY+glH*.15,ah=glH*.1;
      while(ax<W-inset*2-W*.04){
        const aw=W*R(.025,.045);
        hctx.fillStyle="rgba(238,242,230,.55)";
        hctx.fillRect(ax,ay,aw,ah);
        hctx.fillStyle=kA(pick(prodCols),R(.4,.7));
        hctx.fillRect(ax+aw*.12,ay+ah*.15,aw*.76,ah*.45);
        hctx.fillStyle="rgba(40,50,44,.4)";
        hctx.fillRect(ax+aw*.12,ay+ah*.7,aw*R(.4,.7),ah*.12);
        ax+=aw+W*R(.008,.025);
      }
    }
    /* shelf rows: gondolas with their boards, dense with goods */
    for(let r2=0;r2<3;r2++){
      const ry=glY+glH*(.32+r2*.2),rh2=glH*.125;
      hctx.fillStyle="rgba(60,84,72,.45)";
      hctx.fillRect(inset*2,ry-glH*.016,W-inset*4,glH*.016);
      hctx.fillStyle="rgba(225,238,228,.5)";
      hctx.fillRect(inset*2,ry+rh2,W-inset*4,glH*.022);
      hctx.fillStyle="rgba(40,60,52,.3)";
      hctx.fillRect(inset*2,ry+rh2+glH*.022,W-inset*4,glH*.012);
      let x=inset*2+W*R(0,.015);
      while(x<W-inset*2){
        /* goods face out in RUNS of a colour, as a planogram does */
        const run=RI(2,6),col=pick(prodCols),cw=W*R(.005,.011);
        const tall=rh2*R(.7,.98),top=ry+rh2*R(.02,.22);
        for(let r3=0;r3<run&&x<W-inset*2;r3++){
          if(rnd()<.94){
            hctx.fillStyle=kA(kMix(col,"#e8e4d4",R(.05,.16)),R(.55,.88));
            hctx.fillRect(x,top+R(-1,1)*u,cw,tall);
          }
          x+=cw+W*R(.0004,.0015);
        }
        x+=W*R(.001,.006);
      }
      /* a red or yellow price sign hangs over the row here and there */
      for(let i2=0;i2<RI(1,3);i2++){
        const px2=inset*2+(W-inset*4)*rnd();
        hctx.fillStyle=kA(pick(["#d8b22c","#c43a2a"]),R(.65,.9));
        hctx.fillRect(px2,ry-glH*.012,W*R(.008,.016),glH*.05);
      }
    }
    /* an ATM keeps its pale vigil near the door */
    if(rnd()<.7){
      const tx=doorX+doorW*R(1.3,1.7),tw=doorW*.5;
      hctx.fillStyle="rgba(228,234,224,.75)";
      kPRect(hctx,tx,glY+glH*.42,tw,glH*.5,.8,3*u);
      hctx.fillStyle="rgba(40,70,90,.65)";
      hctx.fillRect(tx+tw*.18,glY+glH*.48,tw*.64,glH*.1);
    }
    /* a magazine rack remembers its colours by the door */
    hctx.fillStyle="rgba(190,205,195,.4)";
    hctx.fillRect(doorX-doorW*1.5,glY+glH*.25,doorW*.8,glH*.5);
    for(let i=0;i<8;i++){
      hctx.fillStyle=kA(pick(prodCols),R(.3,.6));
      hctx.fillRect(doorX-doorW*1.45+ (i%2)*doorW*.36,glY+glH*(.28+Math.floor(i/2)*.12),doorW*.3,glH*.09);
    }
    /* the doorway: brightest of all, its floor seen through */
    const dg=hctx.createLinearGradient(0,glY,0,groundY);
    dg.addColorStop(0,"#dcebd2");
    dg.addColorStop(1,"#bcd4b6");
    hctx.fillStyle=dg;
    hctx.fillRect(doorX,glY+glH*.04,doorW,glH*.96);
    hctx.fillStyle="rgba(120,150,135,.4)";
    hctx.fillRect(doorX+doorW*.47,glY+glH*.04,doorW*.05,glH*.96);
    hctx.fillStyle="rgba(225,245,230,.7)";
    hctx.fillRect(doorX-doorW*.04,glY,doorW*1.08,glH*.05);
    hctx.fillStyle="rgba(10,30,26,.8)";
    hctx.fillRect(doorX-doorW*.05,glY+glH*.04,doorW*.05,glH*.96);
    hctx.fillRect(doorX+doorW,glY+glH*.04,doorW*.05,glH*.96);
    hctx.fillStyle=kA("#fffef2",.55);
    hctx.fillRect(doorX+doorW*.06,groundY-glH*.16,doorW*.88,glH*.16);
    /* posters stuck on the glass itself, facing the street */
    for(let i=0;i<RI(4,8);i++){
      const px2=inset*2+(W-inset*4)*rnd();
      if(Math.abs(px2-doorX-doorW/2)<doorW*.9)continue;
      const pw2=W*R(.012,.022),ph2=pw2*R(1.2,1.5);
      const py2=glY+glH*R(.3,.62);
      hctx.fillStyle="rgba(240,242,234,.82)";
      hctx.fillRect(px2,py2,pw2,ph2);
      hctx.fillStyle=kA(pick(prodCols),.8);
      hctx.fillRect(px2+pw2*.08,py2+ph2*.08,pw2*.84,ph2*.34);
      hctx.fillStyle="rgba(50,56,50,.5)";
      for(let r3=0;r3<3;r3++)
        hctx.fillRect(px2+pw2*.1,py2+ph2*(.5+r3*.14),pw2*R(.5,.8),ph2*.06);
    }
    /* mullions over everything */
    hctx.fillStyle="#0a1f1d";
    const nm=7+RI(0,3);
    for(let i=0;i<=nm;i++){
      const mxx=inset+ (W-inset*2)*i/nm;
      if(Math.abs(mxx-doorX-doorW/2)<doorW*.8)continue;
      hctx.fillRect(mxx-2.6*u,glY,5.2*u,glH);
    }
    hctx.fillRect(inset,glY+glH*.02,W-inset*2,3.4*u);
    hctx.fillRect(inset,groundY-4*u,W-inset*2,4*u);
    /* the brick pier, holding the corner */
    if(brickX>0){
      hctx.fillStyle="#241410";
      hctx.fillRect(brickX,glY-fasH*.1,brickW,groundY-glY+fasH*.1);
      const bg2=hctx.createLinearGradient(brickX,0,brickX+brickW,0);
      bg2.addColorStop(0,"rgba(214,148,96,.35)");bg2.addColorStop(1,"rgba(214,148,96,.06)");
      hctx.fillStyle=bg2;
      hctx.fillRect(brickX,glY-fasH*.1,brickW,groundY-glY+fasH*.1);
      hctx.fillStyle="rgba(20,8,6,.5)";
      const rows=Math.round((groundY-glY)/(H*.022));
      for(let r2=0;r2<=rows;r2++){
        const ry=glY-fasH*.1+r2*H*.022;
        hctx.fillRect(brickX,ry,brickW,1.6*u);
        const off=(r2%2)?brickW*.25:0;
        for(let c2=0;c2<3;c2++)
          hctx.fillRect(brickX+off+c2*brickW*.5-1.3*u,ry,2.6*u,H*.022);
      }
    }
    /* bins and an ice box keep the wall company */
    hctx.fillStyle="#10211f";
    const binX=doorX+doorW*R(1.6,2.2);
    for(let i=0;i<3;i++)
      kRR(hctx,binX+i*W*.035,groundY-H*.085,W*.03,H*.082,W*.004),hctx.fill();
    hctx.fillStyle="rgba(190,215,205,.16)";
    for(let i=0;i<3;i++)
      hctx.fillRect(binX+i*W*.035+W*.004,groundY-H*.078,W*.022,H*.012);
  }});
  steps.push({label:"pouring the asphalt",fn:()=>{
    const g=hctx.createLinearGradient(0,groundY,0,H);
    g.addColorStop(0,groundB);g.addColorStop(1,groundA);
    hctx.fillStyle=g;hctx.fillRect(0,groundY,W,H-groundY);
    kMottle(hctx,0,groundY,W,H-groundY,[groundA,groundB,"#241a10"],90,W*.03,W*.12,.13);
    kBrush(hctx,0,groundY,W,H-groundY,[groundA,groundB,"#33281c","#181208"],130,.03,.08,0);
    kPavers(hctx,0,groundY+H*.015,W,H-groundY,u);
    /* a parking line or two, almost worn away */
    hctx.strokeStyle="rgba(210,225,210,.1)";
    hctx.lineWidth=4*u;
    for(let i=0;i<RI(1,3);i++){
      const lx=W*R(.1,.9);
      hctx.beginPath();hctx.moveTo(lx,H*R(.86,.92));hctx.lineTo(lx+W*R(-.06,.06),H);hctx.stroke();
    }
  }});
  steps.push({label:"switching the night shift on",fn:()=>{
    hctx.globalCompositeOperation="lighter";
    kGlow(hctx,W*.5,fasY+fasH*.5,W*.55,glowH,.04,fasH*1.8);
    kGlow(hctx,W*.5,glY+glH*.5,W*.6,glowH,.04,glH*1.2);
    kGlow(hctx,doorX+doorW/2,glY+glH*.5,doorW*3,glowH,.07,glH*1.0);
    /* the pool runs the whole storefront */
    kGlow(hctx,W*.5,groundY+H*.05,W*.52,glowH,.22,H*.13);
    kGlow(hctx,doorX+doorW/2,groundY+H*.045,doorW*3.4,glowH,.26,H*.1);
    const sm=hctx.createLinearGradient(0,groundY,0,groundY+H*.2);
    sm.addColorStop(0,kA(glowH,.16));sm.addColorStop(1,kA(glowH,0));
    hctx.fillStyle=sm;hctx.fillRect(W*.02,groundY,W*.96,H*.2);
    for(let i=0;i<460;i++){
      const t=Math.pow(rnd(),1.5);
      const dy=groundY+H*.012+t*(H-groundY)*.85;
      const dx=W*R(.02,.98);
      const persp=.4+t*1.1;
      const al=R(.04,.16)*(1-t*.7)*(Math.abs(dx-doorX-doorW/2)<W*.18?1.3:.8);
      kGlow(hctx,dx,dy,R(7,26)*u*persp,rnd()<.85?glowH:"#fff6da",Math.min(.24,al),R(2.4,5.6)*u*persp);
    }
    hctx.globalCompositeOperation="source-over";
    for(let i=0;i<150;i++){
      const t=Math.pow(rnd(),1.4);
      kGlow(hctx,W*rnd(),groundY+H*.02+t*(H-groundY)*.7,R(6,20)*u,groundA,R(.12,.3),R(2,4.6)*u);
    }
  }});
  steps.push({label:"posting the night owls",fn:()=>{
    /* a street lamp keeps one corner */
    if(rnd()<.65)kLamp(hctx,W*pick([R(.03,.08),R(.92,.97)]),groundY+H*R(.05,.12),H*R(.3,.42),u);
    const n=rnd()<.5?RI(1,2):0;
    for(let i=0;i<n;i++){
      const dir=rnd()<.5?-1:1;
      const fx=doorX+doorW/2+R(.8,2.6)*doorW*(i?1:-1);
      kFigure(hctx,fx,groundY+H*R(.04,.09),(groundY-glY)*R(.95,1.1),
        fx<doorX?1:-1,glowH,{hood:rnd()<.5,hat:rnd()<.25});
    }
  }});
  steps.push({label:"stringing the wires",fn:()=>{
    if(rnd()<.75)kWires(hctx,W,H*R(.03,.1),RI(2,4),"rgba(2,8,10,.55)",u*3);
  }});
}

/* =========================================================
   the nocturne pipeline
   ========================================================= */
function* keitaPhase(seed,fmtKey,sceneKey,statusCb,prog){
  rnd=mulberry32((seed^0x6e0c)>>>0);
  const fmt=FORMATS[fmtKey]||FORMATS.classic;
  const long=LONG_EDGE;
  const W=fmt.w>=fmt.h?long:Math.round(long*fmt.w/fmt.h);
  const H=fmt.w>=fmt.h?Math.round(long*fmt.h/fmt.w):long;
  hi.width=W;hi.height=H;
  REL=null;
  const C={W,H,sceneKey};
  const steps=[];
  if(sceneKey==="denwa")kDenwa(C,statusCb,steps);
  else if(sceneKey==="konbini")kKonbini(C,statusCb,steps);
  else kJihanki(C,statusCb,steps);
  prog.total=(prog.done||0)+steps.length+4;
  for(const st of steps){
    statusCb(0,0,{keita:st.label});
    st.fn();
    prog.done++;
    yield;
  }
  return C;
}
function* keitaGenerate(seed,fmtKey,sceneKey,statusCb,prog={}){
  if(prog.total===undefined){prog.total=1;prog.done=0;}
  const C=yield* keitaPhase(seed,fmtKey,sceneKey,statusCb,prog);
  yield* keitaFinish(C,statusCb,prog);
  return C;
}

/* ===== KEITA WING END ===== */

