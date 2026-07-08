/* =========================================================
   ground: raw canvas with weave + grain
   ========================================================= */
function paintGround(ctx,W,H,groundHex){
  ctx.fillStyle=groundHex;
  ctx.fillRect(0,0,W,H);

  const u=Math.max(W,H)/1000;
  /* weave tile */
  const t=document.createElement("canvas");
  const ts=Math.round(96*u); t.width=t.height=ts;
  const tc=t.getContext("2d");
  tc.fillStyle=groundHex; tc.fillRect(0,0,ts,ts);
  const pitch=Math.max(3,Math.round(3.4*u));
  for(let y=0;y<ts;y+=pitch){
    tc.fillStyle=`rgba(80,62,38,${0.025+rnd()*0.03})`;
    tc.fillRect(0,y,ts,1);
    tc.fillStyle="rgba(255,250,235,0.05)";
    tc.fillRect(0,y+1,ts,1);
  }
  for(let x=0;x<ts;x+=pitch){
    tc.fillStyle=`rgba(80,62,38,${0.02+rnd()*0.025})`;
    tc.fillRect(x,0,1,ts);
  }
  ctx.fillStyle=ctx.createPattern(t,"repeat");
  ctx.fillRect(0,0,W,H);

  /* grain speckle */
  const n=document.createElement("canvas");
  n.width=n.height=256;
  const nc=n.getContext("2d");
  const img=nc.createImageData(256,256);
  for(let i=0;i<img.data.length;i+=4){
    const v=rnd()*255|0;
    img.data[i]=img.data[i+1]=img.data[i+2]=v;
    img.data[i+3]=rnd()<.5?14:0;
  }
  nc.putImageData(img,0,0);
  ctx.globalAlpha=.55;
  ctx.fillStyle=ctx.createPattern(n,"repeat");
  ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;

  /* slubs: thick spots in the thread */
  ctx.fillStyle="rgba(96,78,48,0.10)";
  const slubPitch=3.4*u;
  const slubs=Math.round((W*H)/(u*u)/9000);
  for(let i=0;i<slubs;i++){
    const sy=Math.round(rnd()*H/slubPitch)*slubPitch;
    ctx.fillRect(rnd()*W,sy,R(4,15)*u,1.3*u);
  }

  /* handled edges: years of hands and dust */
  const eb=Math.max(W,H)*.045;
  const soil=(x0,y0,x1,y1,rx,ry,rw,rh)=>{
    const g2=ctx.createLinearGradient(x0,y0,x1,y1);
    g2.addColorStop(0,"rgba(70,55,32,0.06)");
    g2.addColorStop(1,"rgba(70,55,32,0)");
    ctx.fillStyle=g2;
    ctx.fillRect(rx,ry,rw,rh);
  };
  soil(0,0,eb,0, 0,0,eb,H);
  soil(W,0,W-eb,0, W-eb,0,eb,H);
  soil(0,0,0,eb, 0,0,W,eb);
  soil(0,H,0,H-eb, 0,H-eb,W,eb);

  /* soft tonal blotches (aged canvas) */
  for(let i=0;i<10;i++){
    const g=ctx.createRadialGradient(
      rnd()*W,rnd()*H,0,
      rnd()*W,rnd()*H,R(120,420)*u);
    const dark=rnd()<.5;
    g.addColorStop(0,dark?"rgba(96,76,46,0.045)":"rgba(255,250,238,0.05)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);
  }
}

