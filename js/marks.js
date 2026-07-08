/* =========================================================
   paint marks
   ========================================================= */
function stamp(ctx,x,y,r){
  ctx.beginPath();
  ctx.arc(x,y,r,0,6.2832);
  ctx.fill();
}
/* teardrop droplet pointing along ang */
function droplet(ctx,x,y,r,ang,elong){
  if(REL&&r>RELU){
    hstamp(x,y,r*(1+elong*.25),.09);
    const f=ctx.fillStyle;          /* oil wicks out into the canvas */
    ctx.fillStyle="rgba(96,72,40,0.05)";
    stamp(ctx,x,y,r*1.7);
    ctx.fillStyle=f;
  }
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.ellipse(0,0,r*(1+elong),r,0,0,6.2832);
  ctx.fill();
  /* tail behind */
  if(elong>0.35){
    ctx.beginPath();
    ctx.ellipse(-r*(1.2+elong),0,r*.5*elong,r*.32,0,0,6.2832);
    ctx.fill();
  }
  ctx.restore();
}
/* irregular pooled blob */
function pool(ctx,x,y,r){
  hstamp(x,y,r,.07);
  const f=ctx.fillStyle;            /* oil stain blooms around the pool */
  ctx.fillStyle="rgba(96,72,40,0.06)";
  stamp(ctx,x,y,r*1.45);
  ctx.fillStyle=f;
  const lobes=RI(4,8);
  stamp(ctx,x,y,r);
  for(let i=0;i<lobes;i++){
    const a=R(0,6.2832), d=R(.25,.85)*r;
    stamp(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d,r*R(.35,.7));
  }
}
/* wet-paint registry: recent pools & heavy ropes that haven't dried */
function pushWet(wet,x,y,r,cr,cg,cb){
  wet.push({x,y,r,cr,cg,cb});
  if(wet.length>420)wet.splice(0,60);
}
/* a hover-pool dries: beaded rim, settled grit, registered as wet */
function finishPool(ctx,x,y,r,fillNow,rimNow,u,wet,col){
  if(x===null||r<=0)return;
  ctx.fillStyle=fillNow();
  pool(ctx,x,y,r*.96);
  ctx.fillStyle=rimNow();
  const nR=Math.max(8,Math.round(r/(u*.9)));
  for(let i=0;i<nR;i++){
    const a=(i/nR)*6.2832+R(-.12,.12);
    const ex=x+Math.cos(a)*r*R(.88,1), ey=y+Math.sin(a)*r*R(.88,1);
    stamp(ctx,ex,ey,u*R(.55,1.1));
    hstamp(ex,ey,u*1.2,.1);            // the rim beads upward
  }
  hstamp(x,y,r,.08);
  if(r>3*u){
    ctx.fillStyle="rgba(45,34,20,0.26)";
    const gN=RI(2,6);
    for(let i=0;i<gN;i++)stamp(ctx,x+R(-.7,.7)*r,y+R(-.7,.7)*r,R(.2,.55)*u);
  }
  pushWet(wet,x,y,r,col[0],col[1],col[2]);
}
/* a fresh line crossing wet paint drags and marbles both colours */
function marble(ctx,wet,x,y,dir,w,alpha,fillNow){
  for(let i=wet.length-1,k=0;i>=0&&k<70;i--,k++){
    const e=wet[i];
    const dx=x-e.x,dy=y-e.y;
    if(dx*dx+dy*dy<e.r*e.r){
      if(rnd()<.3){
        ctx.fillStyle=rgbStr(e.cr,e.cg,e.cb,alpha*.55);
        stamp(ctx,x+Math.cos(dir)*w*R(.8,1.6),y+Math.sin(dir)*w*R(.8,1.6),w*R(.22,.4));
        ctx.fillStyle=fillNow();
        const pa=dir+(rnd()<.5?1.5708:-1.5708);
        stamp(ctx,x+Math.cos(pa)*w*R(.7,1.4),y+Math.sin(pa)*w*R(.7,1.4),w*R(.16,.32));
      }
      return;
    }
  }
}
/* forward crown splatter thrown by an energetic impact */
function crown(ctx,x,y,dir,vh,vz,r,u,fill){
  ctx.fillStyle=fill;
  const n=RI(2,6);
  const reach=r*clamp(vh/vz,.4,3)*R(3,9);
  for(let i=0;i<n;i++){
    const a=dir+R(-.85,.85);
    const d=reach*R(.4,1.1);
    droplet(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d,r*R(.16,.4),a,R(.5,1.8));
  }
}
/* a thin poured wash: a broad irregular stain with a mottled body,
   feathered bleeding edges, and pigment gathering at the drying rim.
   Washes are thin, so they add almost no height — the weave reads
   straight through them. */
function* wash(ctx,opts){
  const {W,H,u,rgb,kind,wet}=opts;
  const RB=R(14,58)*u;
  const x=opts._cx??R(.02,.98)*W, y=opts._cy??R(.02,.98)*H;
  /* some throws are thick: buttery impasto dragged with the stick */
  const impasto=kind!=="fine"&&rnd()<.45;
  const aMin=impasto?.4:.28;
  const aMax=impasto?.85:(kind==="fine"?.42:.7);
  /* the oil soaks ahead of the colour */
  ctx.fillStyle="rgba(96,72,40,0.05)";
  stamp(ctx,x,y,RB*1.15);
  let px2=x,py2=y,a2=R(0,6.2832);
  const n=Math.round((RB/u)*R(2.6,4));
  for(let i=0;i<n;i++){
    a2+=R(-1.1,1.1);
    const step=RB*R(.05,.16);
    px2+=Math.cos(a2)*step+(x-px2)*.12;
    py2+=Math.sin(a2)*step+(y-py2)*.12;
    const rr=RB*R(.12,.3);
    ctx.fillStyle=rgbStr(
      clamp(rgb[0]+R(-16,16),0,255),
      clamp(rgb[1]+R(-16,16),0,255),
      clamp(rgb[2]+R(-16,16),0,255),R(aMin,aMax));
    stamp(ctx,px2,py2,rr);
    if(impasto)hstamp(px2,py2,rr*.9,.1);
    if(rnd()<.2){ /* satellite bleed lobes */
      const aa=R(0,6.2832), dd=rr*R(.8,1.6);
      stamp(ctx,px2+Math.cos(aa)*dd,py2+Math.sin(aa)*dd,rr*R(.3,.6));
    }
    if((i&15)===0)yield;
  }
  /* darker pigment gathers at the drying edge */
  ctx.fillStyle=rgbStr(rgb[0]*.62,rgb[1]*.62,rgb[2]*.64,.18);
  const nE=Math.round((RB/u)*1.2);
  for(let i=0;i<nE;i++){
    const aa=R(0,6.2832), d=RB*R(.72,1.05);
    stamp(ctx,x+Math.cos(aa)*d,y+Math.sin(aa)*d,u*R(1,3));
  }
  if(impasto){
    /* knife-drag striations carved along one direction — grooves in
       both the colour and the height, crests for the light to catch */
    const sa=R(0,6.2832);
    const ca=Math.cos(sa), sb=Math.sin(sa);
    const span=RB*1.6;
    const lines=Math.round(span/(2.6*u));
    for(let k=0;k<lines;k++){
      const off=(k-lines/2)*2.6*u+R(-.8,.8)*u;
      const len=span*R(.5,1);
      const sx0=x-sb*off-ca*len*.5, sy0=y+ca*off-sb*len*.5;
      const segs=Math.round(len/(2*u));
      ctx.fillStyle=rgbStr(rgb[0]*.74,rgb[1]*.74,rgb[2]*.78,.18);
      for(let j=0;j<segs;j++){
        const jx=sx0+ca*j*2*u+R(-.5,.5)*u, jy=sy0+sb*j*2*u+R(-.5,.5)*u;
        if(Math.hypot(jx-x,jy-y)>RB*.95)continue;
        stamp(ctx,jx,jy,.9*u);
        hstamp(jx,jy,1.2*u,.16);
      }
      if((k&7)===0)yield;
    }
    hstamp(x,y,RB*.6,.08);
  }else{
    hstamp(x,y,RB*.5,.03);
  }
  pushWet(wet,x,y,RB*.9,rgb[0],rgb[1],rgb[2]);
  /* masses often chain: a second blob bleeds off the first */
  if(!opts._chained&&rnd()<.35){
    const aa=R(0,6.2832);
    yield* wash(ctx,{...opts,_chained:true,
      _cx:x+Math.cos(aa)*RB*1.2,_cy:y+Math.sin(aa)*RB*1.2});
  }
}

/* a burst of fine threads: a local net of hairlines radiating and
   tangling around one region, the dense webbing of the reference works */
function* web(ctx,opts){
  const {W,H,u,rgb,alpha}=opts;
  const RB=opts._cr!==undefined?opts._cr:R(40,150)*u;
  const cx2=opts._cx!==undefined?opts._cx:R(.05,.95)*W;
  const cy2=opts._cy!==undefined?opts._cy:R(.05,.95)*H;
  const strands=RI(5,14);
  for(let s2=0;s2<strands;s2++){
    let x=cx2+R(-.5,.5)*RB, y=cy2+R(-.5,.5)*RB;
    let a2=R(0,6.2832);
    const bias=R(-.12,.12);            // each thread sweeps its own arc
    const segs=RI(30,80);
    const wd=R(.4,1.1)*u;
    ctx.fillStyle=rgbStr(
      clamp(rgb[0]+R(-10,10),0,255),
      clamp(rgb[1]+R(-10,10),0,255),
      clamp(rgb[2]+R(-10,10),0,255),alpha);
    for(let i=0;i<segs;i++){
      a2+=bias+R(-.18,.18);
      const st=R(4,9)*u;
      const nx2=x+Math.cos(a2)*st, ny2=y+Math.sin(a2)*st;
      const d=Math.hypot(nx2-x,ny2-y);
      const k2=Math.max(1,Math.ceil(d/(wd*.6)));
      for(let j=0;j<=k2;j++)
        stamp(ctx,x+(nx2-x)*j/k2,y+(ny2-y)*j/k2,wd*.5*R(.9,1.1));
      x=nx2;y=ny2;
      if(rnd()<.05)stamp(ctx,x+R(-3,3)*u,y+R(-3,3)*u,wd*R(.4,.8));
      if(Math.hypot(x-cx2,y-cy2)>RB*1.5&&rnd()<.3)break;
    }
    if((s2&3)===0)yield;
  }
}

/* aerial spray: a flicked arc of tiny flecks */
function spray(ctx,u,W,H,fill){
  let x=R(0,W), y=R(0,H);
  let a=R(0,6.2832);
  const n=RI(8,32);
  ctx.fillStyle=fill;
  for(let i=0;i<n;i++){
    a+=R(-.45,.45);
    x+=Math.cos(a)*R(6,46)*u; y+=Math.sin(a)*R(6,46)*u;
    if(x<0||x>W||y<0||y>H)break;
    if(rnd()<.25)continue;
    const ox=R(-7,7)*u, oy=R(-7,7)*u;   // never collinear
    droplet(ctx,x+ox,y+oy,R(.25,1.1)*u,a+R(-.6,.6),R(.2,1.1));
    if(rnd()<.35)stamp(ctx,x+R(-9,9)*u,y+R(-9,9)*u,R(.2,.7)*u);
  }
}
/* impact splash: core + radiating droplets + specks */
function splash(ctx,u,W,H,fill,shadowFill,fx,fy){
  const x=fx!==undefined?fx:R(W*.02,W*.98), y=fy!==undefined?fy:R(H*.02,H*.98);
  const core=R(5,16)*u;
  if(shadowFill){ctx.fillStyle=shadowFill; pool(ctx,x+1.4*u,y+1.8*u,core*1.02);}
  ctx.fillStyle=fill;
  pool(ctx,x,y,core);
  const rays=RI(9,26);
  for(let i=0;i<rays;i++){
    const a=R(0,6.2832);
    const d=core*R(1.2,7.5);
    const rr=clamp(core*R(.10,.4)*(1-d/(core*9)),.6*u,core*.5);
    droplet(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d,rr,a,R(.4,1.6));
    if(rnd()<.5){ /* trailing speck */
      const d2=d*R(1.15,1.5);
      stamp(ctx,x+Math.cos(a)*d2,y+Math.sin(a)*d2,rr*R(.25,.5));
    }
  }
}

/* one pour, simulated physically. The hand travels above the canvas
   trailing a loaded stick; a viscous paint string dangles from it on a
   damped spring (paint can't turn corners — every jerk of the wrist
   becomes a curve or a whip-loop). Parcels leave the string, fly
   ballistically under gravity and land carried ahead of the hand.
   Mass conservation sets line weight (w ∝ √(Q/v)); above the breakup
   speed the filament tears Rayleigh-style into a scattered droplet
   trail with stretched impacts; hovering pools paint into discs with
   beaded rims; energetic impacts throw forward crown splatter. */
function* pour(ctx,opts){
  const {W,H,u,kind,rgb,alpha,dyn,ppm,wet}=opts;
  const K=KINDS[kind];

  /* ballistics */
  const g=9.81*ppm;                              // px/s²
  const hDrop=R(.4,1.0)*ppm*(.8+.5*dyn);         // throw height
  const tFly=Math.sqrt(2*hDrop/g)*R(.55,.95);    // string hangs part-way down
  const vz=g*tFly;                               // vertical impact speed

  const w0=R(K.w[0],K.w[1])*u;                   // rope width at vRef
  const vRef=(.55+.45*dyn)*ppm;
  const vBreak=K.vBreak*ppm*R(.8,1.25);
  const hoverV=.16*ppm;

  /* the hand */
  let hx=rnd()<.8?R(-.06*W,1.06*W):W*(.5+(rnd()+rnd()-1)*.6);
  let hy=rnd()<.8?R(-.06*H,1.06*H):H*(.5+(rnd()+rnd()-1)*.6);
  if(opts._cx!==undefined){hx=opts._cx+R(-1,1)*W*.06;hy=opts._cy+R(-1,1)*H*.06;}
  const horiz=W>=H;
  let ang=(horiz?0:Math.PI/2)+R(-.95,.95)+(rnd()<.5?Math.PI:0);
  let hv=R(.3,1.15)*(.5+1.1*dyn)*ppm;
  const hvMax=3.1*ppm*(.45+.85*dyn);
  const A1=R(.6,5),F1=R(.5,2),P1=R(0,6.28);
  const A2=R(.8,4), F2=R(2,6),  P2=R(0,6.28);
  const straightThrow=rnd()<(.04+.2*dyn);

  /* the dangling paint string: damped spring follower */
  let sx=hx,sy=hy,svx=0,svy=0;
  const spr=R(26,52),dmp=R(4,7);

  const dt=1/90;
  const steps=RI(K.steps[0],K.steps[1]);
  let paint=R(.85,1.15);
  let cr=rgb[0],cg=rgb[1],cb=rgb[2];
  let dirNow=ang;
  const met=!!opts.metal;
  /* aluminium flake catches the key light: strokes angled toward it
     flare bright, strokes across it fall to a darker grey */
  const fillNow=()=>{
    let m=1;
    if(met)m=1+.26*Math.cos(dirNow-LIGHT_ANG);
    return rgbStr(Math.min(255,cr*m),Math.min(255,cg*m),Math.min(255,cb*m),alpha);
  };
  const rimNow=()=>rgbStr(cr*.84,cg*.84,cb*.86,alpha); // opaque: translucent rims band where stamps overlap

  let plx=null,ply=null,oob=0,simT=0;
  let poolV=0,poolR=0,poolX=0,poolY=0;
  let w=w0,wS=w0;

  for(let t=0;t<steps;t++){
    simT+=dt;
    const curl=straightThrow?.3:1;
    ang+=(A1*Math.sin(simT*F1+P1)+A2*Math.sin(simT*F2+P2))*curl*dt+R(-.05,.05);
    if(!straightThrow&&rnd()<.01+.03*dyn)ang+=R(-.85,.85); // wrist jerk
    hv*=Math.exp(R(-1,1)*.09);
    if(rnd()<.004+.02*dyn)hv*=R(1.8,2.7);                  // whip / flick
    if(rnd()<.017-.011*dyn)hv*=R(.08,.3);                  // hover
    hv=clamp(hv,.05*ppm,hvMax);
    if(straightThrow)hv=Math.max(hv,1.1*ppm);
    hx+=Math.cos(ang)*hv*dt; hy+=Math.sin(ang)*hv*dt;

    /* the string follows, swinging */
    svx+=(spr*(hx-sx)-dmp*svx)*dt;
    svy+=(spr*(hy-sy)-dmp*svy)*dt;
    sx+=svx*dt; sy+=svy*dt;
    const vrel=Math.hypot(svx,svy)+1e-6;
    const dir=Math.atan2(svy,svx);
    dirNow=dir;

    /* parcels land carried ahead of the string */
    const lx=sx+svx*tFly, ly=sy+svy*tFly;
    const margin=Math.max(W,H)*.06;
    if(lx<-margin||lx>W+margin||ly<-margin||ly>H+margin){
      if(++oob>12)break;
    }else oob=0;

    cr=clamp(cr+R(-.7,.7),rgb[0]-14,rgb[0]+14);
    cg=clamp(cg+R(-.7,.7),rgb[1]-14,rgb[1]+14);
    cb=clamp(cb+R(-.7,.7),rgb[2]-14,rgb[2]+14);

    /* mass conservation: deposited width ∝ √(Q/v), low-passed —
       a viscous filament changes gauge gradually */
    const wT=w0*clamp(Math.sqrt(vRef/vrel),.34,2.6);
    wS+=(wT-wS)*.14;
    w=wS;
    paint-=(w*vrel*dt)/(u*u*K.drain);
    if(paint<=0)break;
    const dry=paint<.2;

    /* hovering: paint pools onto one anchored spot */
    if(vrel<hoverV){
      if(poolR===0){poolX=lx;poolY=ly;}
      else if(Math.hypot(lx-poolX,ly-poolY)>poolR*1.5){
        /* the hand wandered: this pool dries, a new one starts */
        finishPool(ctx,poolX,poolY,poolR,fillNow,rimNow,u,wet,[cr,cg,cb]);
        poolV=0;poolR=0;poolX=lx;poolY=ly;
      }
      poolV+=w0*w0*vRef*dt*.08;
      const r=Math.min(Math.sqrt(poolV/(4.7*u)),K.poolMax*u);
      if(r>poolR+.4*u){
        ctx.fillStyle="rgba(96,72,40,0.02)";
        stamp(ctx,poolX,poolY,r*1.35);
        ctx.fillStyle=fillNow();
        stamp(ctx,poolX,poolY,r);
        hstamp(poolX,poolY,r,.05);
        poolR=r;
      }
      plx=lx;ply=ly;
      if((t&47)===0)yield;
      continue;
    }
    if(poolR>0){
      finishPool(ctx,poolX,poolY,poolR,fillNow,rimNow,u,wet,[cr,cg,cb]);
      poolV=0;poolR=0;
    }

    const broken=vrel>vBreak||(dry&&rnd()>paint*4);
    if(plx!==null&&!broken){
      /* continuous rope */
      const dx=lx-plx,dy=ly-ply;
      const dist=Math.hypot(dx,dy);
      const nSt=Math.max(1,Math.ceil(dist/Math.max(w*.38,.9)));
      if(K.shadow&&w>4*u){
        ctx.fillStyle="rgba(60,44,24,0.10)";
        for(let i=0;i<=nSt;i+=2)
          stamp(ctx,plx+dx*i/nSt+.9*u,ply+dy*i/nSt+1.2*u,w*.55);
      }
      if(w>2.2*u){ /* enamel wicks oil into the raw canvas: a faint halo */
        ctx.fillStyle="rgba(96,72,40,0.045)";
        for(let i=0;i<=nSt;i+=2)
          stamp(ctx,plx+dx*i/nSt,ply+dy*i/nSt,w*.95);
      }
      ctx.fillStyle=fillNow();
      for(let i=0;i<=nSt;i++)
        stamp(ctx,plx+dx*i/nSt+R(-1,1)*w*.06,ply+dy*i/nSt+R(-1,1)*w*.06,w*.5*R(.95,1.05));
      if(w>2.6*u){ /* heavier ropes stand proud; hairlines lie flat */
        const ha=Math.min((w/u-2.6)*.024+.03,.16);
        for(let i=0;i<=nSt;i+=2)
          hstamp(plx+dx*i/nSt,ply+dy*i/nSt,w*.64,ha);
      }
      if(kind==="bold"&&w>5*u&&rnd()<.45){ /* enamel sheen */
        ctx.fillStyle="rgba(255,252,240,0.05)";
        stamp(ctx,plx+dx*.5-w*.2,ply+dy*.5-w*.26,w*.2);
      }
      if(w>4.5*u&&(t&7)===0)pushWet(wet,lx,ly,w*1.1,cr,cg,cb);
      if(rnd()<.16)marble(ctx,wet,lx,ly,dir,w,alpha,fillNow);
      if(w>4.5*u&&vrel>1.1*vRef&&rnd()<.1)
        crown(ctx,lx,ly,dir,vrel,vz,w*.5,u,fillNow());
    }else if(plx!==null&&broken){
      /* Rayleigh breakup: the filament tears into a droplet trail */
      const dx=lx-plx,dy=ly-ply;
      const dist=Math.hypot(dx,dy);
      const fromDry=vrel<=vBreak;         // tore because the load ran out
      const sigma=vrel*tFly*.05+(fromDry?w*.9:w*.3); // landing scatter
      const elong=fromDry?clamp(vrel/vz,.1,.6)       // dribble: round drops
                         :clamp(vrel/vz,.15,2.4);    // slung: stretched
      const gap=fromDry?R(3.2,7.5):R(1.8,5.5);
      const nD=Math.max(1,Math.round(dist/(w*gap)));
      ctx.fillStyle=fillNow();
      for(let i=0;i<nD;i++){
        if(rnd()<.22)continue;
        const f=(i+R(.2,.8))/nD;
        const jx=plx+dx*f+R(-1,1)*sigma, jy=ply+dy*f+R(-1,1)*sigma;
        const r=w*R(.25,.75)*(fromDry?clamp(paint*4,.3,1):1);
        droplet(ctx,jx,jy,r,dir+R(-.4,.4),elong*R(.6,1.3));
        if(r>1.1*u&&vrel>1.3*vRef&&rnd()<.22)
          crown(ctx,jx,jy,dir,vrel,vz,r,u,fillNow());
      }
    }
    plx=lx;ply=ly;
    if((t&47)===0)yield;
  }
  if(poolR>0)finishPool(ctx,poolX,poolY,poolR,fillNow,rimNow,u,wet,[cr,cg,cb]);
  /* lift-off: the string snaps, last drops fly on ahead */
  if(plx!==null){
    ctx.fillStyle=fillNow();
    const dir=Math.atan2(svy,svx);
    const tail=RI(2,6);
    for(let i=1;i<=tail;i++){
      const d=i*R(3,10)*u;
      droplet(ctx,plx+Math.cos(dir)*d,ply+Math.sin(dir)*d,
              Math.max(.6*u,w0*.28/i),dir,R(.5,1.6));
    }
  }
}

