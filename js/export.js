/* =========================================================
   framed hi-res export
   ========================================================= */
function side(ctx,quad,grad){
  ctx.beginPath();
  ctx.moveTo(quad[0][0],quad[0][1]);
  for(let i=1;i<4;i++)ctx.lineTo(quad[i][0],quad[i][1]);
  ctx.closePath();
  ctx.fillStyle=grad;
  ctx.fill();
}
function frameGradient(ctx,style,x0,y0,x1,y1){
  const g=ctx.createLinearGradient(x0,y0,x1,y1);
  const stops={
    black:[[0,"#2a251a"],[.18,"#3b3527"],[.45,"#161209"],[.8,"#0b0906"],[1,"#1c1810"]],
    white:[[0,"#fcfaf3"],[.3,"#e9e4d6"],[.62,"#d4cebd"],[.85,"#efeadd"],[1,"#e2dccd"]],
    oak:  [[0,"#b5905c"],[.3,"#c6a472"],[.55,"#8d6c40"],[.8,"#a8854f"],[1,"#96763f"]],
    gold: [[0,"#6b4c12"],[.2,"#caa84e"],[.42,"#f3df92"],[.6,"#b88f2e"],[.82,"#8a6a1d"],[1,"#d9b958"]]
  }[style];
  for(const [o,c] of stops)g.addColorStop(o,c);
  return g;
}
/* paints the moulding — bases, material texture, carved profile, mitre
   seams, and seeded real-world wear — identically for the on-screen
   preview and the hi-res download (same per-piece seed = same frame). */
function paintFrameMaterial(c,W,H,fw,style,fr){
  /* four mitred moulding sides */
  side(c,[[0,0],[W,0],[W-fw,fw],[fw,fw]],          frameGradient(c,style,0,0,0,fw));
  side(c,[[0,H],[W,H],[W-fw,H-fw],[fw,H-fw]],      frameGradient(c,style,0,H,0,H-fw));
  side(c,[[0,0],[fw,fw],[fw,H-fw],[0,H]],          frameGradient(c,style,0,0,fw,0));
  side(c,[[W,0],[W,H],[W-fw,H-fw],[W-fw,fw]],      frameGradient(c,style,W,0,W-fw,0));

  /* ---- material texture, clipped inside each mitred side ---- */
  const sides2=[
    {q:[[0,0],[W,0],[W-fw,fw],[fw,fw]],     b:[0,0,W,fw],    horiz:true},
    {q:[[0,H],[W,H],[W-fw,H-fw],[fw,H-fw]], b:[0,H-fw,W,fw], horiz:true},
    {q:[[0,0],[fw,fw],[fw,H-fw],[0,H]],     b:[0,0,fw,H],    horiz:false},
    {q:[[W,0],[W,H],[W-fw,H-fw],[W-fw,fw]], b:[W-fw,0,fw,H], horiz:false}
  ];
  for(const sd of sides2){
    c.save();
    c.beginPath();
    c.moveTo(sd.q[0][0],sd.q[0][1]);
    for(let i=1;i<4;i++)c.lineTo(sd.q[i][0],sd.q[i][1]);
    c.closePath();
    c.clip();
    const bx=sd.b[0],by=sd.b[1],bw=sd.b[2],bh=sd.b[3];
    const along=sd.horiz?bw:bh, across=sd.horiz?bh:bw;
    if(style==="oak"){
      /* long wavy grain running the length of the moulding */
      const strands=Math.round(across/3);
      for(let k=0;k<strands;k++){
        const base=fr()*across;
        const amp=across*(.03+fr()*.1);
        const fr2=.003+fr()*.01;
        const ph=fr()*6.28;
        c.fillStyle=fr()<.45
          ?`rgba(82,58,28,${(.03+fr()*.05).toFixed(3)})`
          :`rgba(242,214,168,${(.04+fr()*.07).toFixed(3)})`;
        const th=fr()<.18?2.4:1.2;
        for(let p=0;p<along;p+=3){
          const off=base+Math.sin(p*fr2+ph)*amp;
          if(sd.horiz)c.fillRect(bx+p,by+off,3,th);
          else c.fillRect(bx+off,by+p,th,3);
        }
      }
      /* the occasional knot */
      const knots=Math.max(0,Math.round(along/(fw*16)-fr()));
      for(let k=0;k<knots;k++){
        const kp=fr()*along, kq=across*(.25+fr()*.5);
        const kx=sd.horiz?bx+kp:bx+kq, ky=sd.horiz?by+kq:by+kp;
        for(let rr2=1;rr2<=4;rr2++){
          c.strokeStyle=`rgba(58,38,16,${(.16-rr2*.025).toFixed(3)})`;
          c.lineWidth=1.4;
          c.beginPath();
          c.ellipse(kx,ky,rr2*fw*.05*(sd.horiz?1.8:1),rr2*fw*.05*(sd.horiz?1:1.8),0,0,6.2832);
          c.stroke();
        }
      }
    }else if(style==="gold"){
      /* gold leaf laid in squares: seams, each leaf its own cast, patina */
      const leaf=fw*1.6;
      for(let p=fr()*leaf;p<along;p+=leaf*(0.85+fr()*.3)){
        c.fillStyle="rgba(64,42,10,0.16)";
        if(sd.horiz)c.fillRect(bx+p,by,1.6,bh); else c.fillRect(bx,by+p,bw,1.6);
        c.fillStyle="rgba(255,240,180,0.10)";
        if(sd.horiz)c.fillRect(bx+p+1.6,by,1.2,bh); else c.fillRect(bx,by+p+1.6,bw,1.2);
        c.fillStyle=fr()<.5
          ?`rgba(140,100,30,${(fr()*.07).toFixed(3)})`
          :`rgba(255,236,170,${(fr()*.06).toFixed(3)})`;
        if(sd.horiz)c.fillRect(bx+p,by,leaf,bh); else c.fillRect(bx,by+p,bw,leaf);
      }
      const sp2=Math.round(along*across/900);
      for(let k=0;k<sp2;k++){
        c.fillStyle=fr()<.5?"rgba(255,243,192,.2)":"rgba(86,56,12,.2)";
        c.fillRect(bx+fr()*bw,by+fr()*bh,1.6,1.6);
      }
      /* red bole ground showing through at the worn corners */
      c.fillStyle="rgba(112,46,22,0.08)";
      for(const [cx2,cy2] of [[bx,by],[bx+bw,by],[bx,by+bh],[bx+bw,by+bh]]){
        c.beginPath();c.arc(cx2,cy2,fw*.7,0,6.2832);c.fill();
      }
    }else if(style==="black"){
      /* satin black, brushed along its length, with a quiet sheen */
      const streaks=Math.round(across/2.5);
      for(let k=0;k<streaks;k++){
        const base=fr()*across;
        c.fillStyle=fr()<.5
          ?`rgba(96,88,68,${(.025+fr()*.045).toFixed(3)})`
          :`rgba(0,0,0,${(.05+fr()*.07).toFixed(3)})`;
        if(sd.horiz)c.fillRect(bx,by+base,bw,1); else c.fillRect(bx+base,by,1,bh);
      }
    }else{
      /* white gesso: faint warm brush texture */
      const streaks=Math.round(across/3);
      for(let k=0;k<streaks;k++){
        const base=fr()*across;
        c.fillStyle=fr()<.5
          ?`rgba(186,174,150,${(.03+fr()*.04).toFixed(3)})`
          :`rgba(255,252,244,${(.04+fr()*.04).toFixed(3)})`;
        if(sd.horiz)c.fillRect(bx,by+base,bw,1); else c.fillRect(bx+base,by,1,bh);
      }
    }
    c.restore();
  }
  /* carved profile: burnished outer ridge, shadowed inner step */
  c.strokeStyle="rgba(255,248,228,0.16)";
  c.lineWidth=Math.max(1.5,fw*.06);
  c.strokeRect(fw*.14,fw*.14,W-fw*.28,H-fw*.28);
  c.strokeStyle="rgba(0,0,0,0.22)";
  c.lineWidth=Math.max(1.5,fw*.05);
  c.strokeRect(fw*.8,fw*.8,W-fw*1.6,H-fw*1.6);
  /* mitre seams */
  c.strokeStyle="rgba(0,0,0,.28)";
  c.lineWidth=Math.max(1.5,fw*.018);
  c.beginPath();
  c.moveTo(0,0);c.lineTo(fw,fw);
  c.moveTo(W,0);c.lineTo(W-fw,fw);
  c.moveTo(0,H);c.lineTo(fw,H-fw);
  c.moveTo(W,H);c.lineTo(W-fw,H-fw);
  c.stroke();

  /* ---- nobody's frame is perfect: seeded wear ---- */
  const inBand=(x,y)=>x<fw||y<fw||x>W-fw||y>H-fw;
  /* scuffs & fine scratches */
  const scr=Math.round((W+H)/(fw*6))+6;
  for(let i=0;i<scr;i++){
    let sx2=fr()*W, sy2=fr()*H, tries=0;
    while(!inBand(sx2,sy2)&&tries++<8){sx2=fr()*W;sy2=fr()*H;}
    if(!inBand(sx2,sy2))continue;
    const ang=fr()*6.2832, len=fw*(fr()<.15?(1.6+fr()*2.2):(.25+fr()*.7));
    const lite=fr()<.6;
    c.fillStyle=lite?`rgba(255,250,232,${(.08+fr()*.1).toFixed(3)})`
                    :`rgba(20,14,6,${(.08+fr()*.09).toFixed(3)})`;
    const steps=Math.max(3,Math.round(len/1.5));
    for(let j=0;j<steps;j++)
      c.fillRect(sx2+Math.cos(ang)*j*1.5,sy2+Math.sin(ang)*j*1.5,1.2,1.2);
  }
  /* nicks bitten out of the outer edge */
  const nicks=7+Math.round(fr()*7);
  for(let i=0;i<nicks;i++){
    const side2=Math.floor(fr()*4), t=fr(), nl=1.5+fr()*4.5, nd=1.5+fr()*3;
    c.fillStyle=`rgba(15,10,4,${(.28+fr()*.22).toFixed(3)})`;
    if(side2===0)c.fillRect(t*W,0,nl,nd);
    else if(side2===1)c.fillRect(t*W,H-nd,nl,nd);
    else if(side2===2)c.fillRect(0,t*H,nd,nl);
    else c.fillRect(W-nd,t*H,nd,nl);
    /* a pale bruise beside the bite */
    c.fillStyle=`rgba(255,248,230,${(.1+fr()*.08).toFixed(3)})`;
    if(side2===0)c.fillRect(t*W-1,nd,nl+2,1.4);
    else if(side2===1)c.fillRect(t*W-1,H-nd-1.4,nl+2,1.4);
    else if(side2===2)c.fillRect(nd,t*H-1,1.4,nl+2);
    else c.fillRect(W-nd-1.4,t*H-1,1.4,nl+2);
  }
  /* small bites on the sight edge, where canvases were leaned */
  const inNicks=2+Math.round(fr()*4);
  for(let i=0;i<inNicks;i++){
    const side2=Math.floor(fr()*4), t=.1+fr()*.8, nl=1.5+fr()*3;
    c.fillStyle=`rgba(12,8,3,${(.3+fr()*.2).toFixed(3)})`;
    if(side2===0)c.fillRect(fw+t*(W-2*fw),fw-1.5-fr()*1.5,nl,1.5+fr()*1.5);
    else if(side2===1)c.fillRect(fw+t*(W-2*fw),H-fw,nl,1.5+fr()*1.5);
    else if(side2===2)c.fillRect(fw-1.5-fr()*1.5,fw+t*(H-2*fw),1.5+fr()*1.5,nl);
    else c.fillRect(W-fw,fw+t*(H-2*fw),1.5+fr()*1.5,nl);
  }
  /* the burnished outer ridge rubs through where hands have been */
  {
    const rubs=6+Math.round(fr()*7);
    const rr3=fw*.14;
    for(let i=0;i<rubs;i++){
      const side2=Math.floor(fr()*4), t=fr(), L2=fw*(.5+fr()*1.4);
      c.fillStyle=fr()<.7
        ?`rgba(255,251,236,${(.14+fr()*.12).toFixed(3)})`
        :`rgba(18,12,5,${(.12+fr()*.1).toFixed(3)})`;
      if(side2===0)c.fillRect(t*W,rr3-1,L2,2.2);
      else if(side2===1)c.fillRect(t*W,H-rr3-1,L2,2.2);
      else if(side2===2)c.fillRect(rr3-1,t*H,2.2,L2);
      else c.fillRect(W-rr3-1,t*H,2.2,L2);
    }
  }
  /* dust and grime settled against the inner step */
  {
    const g2=fw*.86;
    c.strokeStyle="rgba(22,15,8,0.10)";
    c.lineWidth=Math.max(2,fw*.1);
    c.strokeRect(g2,g2,W-2*g2,H-2*g2);
    const smudges=5+Math.round(fr()*6);
    for(let i=0;i<smudges;i++){
      const side2=Math.floor(fr()*4), t=fr(), L2=fw*(.4+fr()*1.2);
      c.fillStyle=`rgba(24,16,8,${(.06+fr()*.07).toFixed(3)})`;
      if(side2===0)c.fillRect(fw*.3+t*(W-fw),g2-fw*.06,L2,fw*.12);
      else if(side2===1)c.fillRect(fw*.3+t*(W-fw),H-g2-fw*.06,L2,fw*.12);
      else if(side2===2)c.fillRect(g2-fw*.06,fw*.3+t*(H-fw),fw*.12,L2);
      else c.fillRect(W-g2-fw*.06,fw*.3+t*(H-fw),fw*.12,L2);
    }
  }
  /* fly specks, the patient work of decades */
  {
    const specks=8+Math.round(fr()*8);
    for(let i=0;i<specks;i++){
      let sx2=fr()*W, sy2=fr()*H, tries=0;
      while(!inBand(sx2,sy2)&&tries++<8){sx2=fr()*W;sy2=fr()*H;}
      if(!inBand(sx2,sy2))continue;
      c.fillStyle=`rgba(28,18,8,${(.3+fr()*.3).toFixed(3)})`;
      c.beginPath();c.arc(sx2,sy2,.7+fr()*.8,0,6.2832);c.fill();
    }
  }
  /* soft wear at the handled corners */
  for(const corner of [[0,0],[W,0],[0,H],[W,H]]){
    if(fr()<.4)continue;
    c.fillStyle=`rgba(255,248,230,${(.04+fr()*.05).toFixed(3)})`;
    c.beginPath();c.arc(corner[0],corner[1],fw*(.35+fr()*.35),0,6.2832);c.fill();
  }
  /* style-specific flaws */
  if(style==="gold"){
    /* flaked leaf: the red bole shows through in worn islands */
    const flakes=4+Math.round(fr()*5);
    for(let i=0;i<flakes;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      const r2=fw*(.07+fr()*.1);
      c.fillStyle="rgba(112,46,22,0.5)";
      for(let k=0;k<3;k++){
        c.beginPath();
        c.arc(fx2+(fr()-.5)*r2*1.4,fy2+(fr()-.5)*r2*1.4,r2*(.5+fr()*.5),0,6.2832);
        c.fill();
      }
      c.fillStyle="rgba(56,22,8,0.3)";
      c.beginPath();c.arc(fx2+r2*.4,fy2+r2*.3,r2*.35,0,6.2832);c.fill();
    }
  }else if(style==="white"||style==="black"){
    /* paint chips: the pale gesso ground shows through the losses */
    const chips=3+Math.round(fr()*5);
    for(let i=0;i<chips;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      const r2=fw*(.04+fr()*.08);
      /* an irregular loss */
      c.fillStyle=style==="black"?"rgba(226,212,182,0.8)":"rgba(238,228,206,0.9)";
      c.beginPath();
      for(let k=0;k<=8;k++){
        const a=k/8*6.2832, rr2=r2*(.6+fr()*.7);
        const px=fx2+Math.cos(a)*rr2, py=fy2+Math.sin(a)*rr2*.8;
        if(k===0)c.moveTo(px,py);else c.lineTo(px,py);
      }
      c.closePath();c.fill();
      /* the shadowed lip of the chip */
      c.fillStyle="rgba(10,7,3,0.4)";
      c.beginPath();c.arc(fx2-r2*.4,fy2+r2*.45,r2*.4,1.2,4.2);c.fill();
      /* a hairline crack escaping the loss */
      if(fr()<.6){
        const a=fr()*6.2832;
        c.strokeStyle="rgba(12,8,4,0.35)";
        c.lineWidth=1;
        c.beginPath();
        c.moveTo(fx2+Math.cos(a)*r2,fy2+Math.sin(a)*r2);
        c.lineTo(fx2+Math.cos(a+R(-.4,.4))*r2*(2+fr()*2),fy2+Math.sin(a+R(-.4,.4))*r2*(2+fr()*2));
        c.stroke();
      }
    }
  }
  if(style==="white"){
    /* gesso yellows where hands and sun have been */
    const spots=5+Math.round(fr()*4);
    for(let i=0;i<spots;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      c.fillStyle=`rgba(196,172,116,${(.07+fr()*.07).toFixed(3)})`;
      c.beginPath();c.arc(fx2,fy2,fw*(.3+fr()*.6),0,6.2832);c.fill();
    }
  }
  if(style==="black"){
    /* satin rubbed brighter where the frame is gripped */
    const spots=2+Math.round(fr()*3);
    for(let i=0;i<spots;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      c.fillStyle=`rgba(140,128,100,${(.05+fr()*.05).toFixed(3)})`;
      c.beginPath();c.arc(fx2,fy2,fw*(.3+fr()*.5),0,6.2832);c.fill();
    }
  }else if(style==="oak"){
    /* a pale chip at one or two mitre corners */
    for(const corner of [[fw*.5,fw*.5],[W-fw*.5,fw*.5],[fw*.5,H-fw*.5],[W-fw*.5,H-fw*.5]]){
      if(fr()<.65)continue;
      c.fillStyle="rgba(232,206,160,0.4)";
      c.beginPath();c.arc(corner[0],corner[1],fw*(.08+fr()*.1),0,6.2832);c.fill();
    }
    /* woodworm: little colonies of flight holes */
    const colonies=1+Math.round(fr()*2);
    for(let i=0;i<colonies;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      const holes=3+Math.round(fr()*4);
      for(let k=0;k<holes;k++){
        const hx=fx2+(fr()-.5)*fw*1.2, hy=fy2+(fr()-.5)*fw*1.2;
        c.fillStyle="rgba(16,10,4,0.7)";
        c.beginPath();c.arc(hx,hy,.9+fr()*.9,0,6.2832);c.fill();
        c.fillStyle="rgba(255,244,220,0.25)";
        c.beginPath();c.arc(hx+.8,hy+.8,.6,0,6.2832);c.fill();
      }
    }
    /* a faint tide mark where damp once crept */
    if(fr()<.6){
      const side2=Math.floor(fr()*4), t=fr();
      c.strokeStyle="rgba(60,40,18,0.12)";
      c.lineWidth=1.4;
      c.beginPath();
      const tx=side2<2?t*W:(side2===2?fw*.5:W-fw*.5);
      const ty=side2<2?(side2===0?fw*.5:H-fw*.5):t*H;
      c.arc(tx,ty,fw*(.4+fr()*.5),fr()*6.28,fr()*6.28+3.5+fr()*2);
      c.stroke();
    }
  }
  if(style==="gold"){
    /* the gilt dulls in cloudy patches, and oxidation freckles it */
    const clouds=2+Math.round(fr()*3);
    for(let i=0;i<clouds;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      c.fillStyle=`rgba(74,54,22,${(.06+fr()*.05).toFixed(3)})`;
      c.beginPath();c.arc(fx2,fy2,fw*(.4+fr()*.7),0,6.2832);c.fill();
    }
    const frk=6+Math.round(fr()*8);
    for(let i=0;i<frk;i++){
      let fx2=fr()*W, fy2=fr()*H, tries=0;
      while(!inBand(fx2,fy2)&&tries++<8){fx2=fr()*W;fy2=fr()*H;}
      if(!inBand(fx2,fy2))continue;
      c.fillStyle=`rgba(40,26,8,${(.25+fr()*.25).toFixed(3)})`;
      c.beginPath();c.arc(fx2,fy2,.8+fr()*1,0,6.2832);c.fill();
    }
  }
}

function buildFramed(){
  if(state.frame==="none")return hi;
  const style=state.frame;
  const long=Math.max(hi.width,hi.height);
  const fw=Math.round(long*(style==="gold"?0.046:style==="oak"?0.038:0.032));
  const liner=Math.round(fw*0.22);
  const W=hi.width+2*(fw+liner), H=hi.height+2*(fw+liner);
  const out=document.createElement("canvas");
  out.width=W;out.height=H;
  const c=out.getContext("2d");

  /* the liner: raw linen for a painting, naked silk for a carré,
     a wide bevelled paper mat for a drawing */
  const SILKL=state.mode==="scarf", MATL=state.mode==="matisse";
  if(MATL){
    const mat=Math.round(fw*1.55);
    const W2=hi.width+2*(fw+mat), H2=hi.height+2*(fw+mat);
    out.width=W2;out.height=H2;
    c.fillStyle="#f7f3e8";
    c.fillRect(fw,fw,W2-2*fw,H2-2*fw);
    /* the mat's cut bevel: a bright inner edge and a fine shadow line */
    const bv=Math.max(3,Math.round(fw*.07));
    c.fillStyle="#fffdf4";
    c.fillRect(fw+mat-bv,fw+mat-bv,hi.width+2*bv,hi.height+2*bv);
    c.strokeStyle="rgba(96,80,48,.4)";
    c.lineWidth=Math.max(1.5,fw*.018);
    c.strokeRect(fw+mat-bv,fw+mat-bv,hi.width+2*bv,hi.height+2*bv);
    c.drawImage(hi,fw+mat,fw+mat);
    /* the sheet sits a breath below the mat: a soft shadow at its head */
    const g2=c.createLinearGradient(0,fw+mat,0,fw+mat+fw*.35);
    g2.addColorStop(0,"rgba(35,25,12,.12)");g2.addColorStop(1,"rgba(35,25,12,0)");
    c.fillStyle=g2;
    c.fillRect(fw+mat,fw+mat,hi.width,fw*.35);
    paintFrameMaterial(c,W2,H2,fw,style,mulberry32(state.frameSeed));
    return out;
  }
  c.fillStyle=SILKL?"#f4efe2":"#ece6d6";
  c.fillRect(fw,fw,W-2*fw,H-2*fw);
  if(SILKL){ /* a quiet diagonal sheen across the silk margin */
    const g0=c.createLinearGradient(fw,fw,W-fw,H-fw);
    g0.addColorStop(0,"rgba(255,255,252,0)");
    g0.addColorStop(.42,"rgba(255,255,252,.16)");
    g0.addColorStop(.55,"rgba(214,206,186,.10)");
    g0.addColorStop(1,"rgba(255,255,252,0)");
    c.fillStyle=g0;
    c.fillRect(fw,fw,W-2*fw,H-2*fw);
  }
  c.strokeStyle="rgba(90,72,44,.35)";
  c.lineWidth=Math.max(2,fw*.03);
  c.strokeRect(fw+liner-c.lineWidth/2,fw+liner-c.lineWidth/2,
               hi.width+c.lineWidth,hi.height+c.lineWidth);

  /* the painting */
  c.drawImage(hi,fw+liner,fw+liner);

  /* soft inner shadow over painting edges */
  const sh=Math.round(fw*.5);
  const ix=fw+liner, iy=fw+liner, iw=hi.width, ih=hi.height;
  const shade=(x0,y0,x1,y1,vert)=>{
    const g=c.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,"rgba(35,25,12,.20)");g.addColorStop(1,"rgba(35,25,12,0)");
    c.fillStyle=g;
    if(vert)c.fillRect(ix,Math.min(y0,y1),iw,sh);
    else c.fillRect(Math.min(x0,x1),iy,sh,ih);
  };
  shade(ix,iy,ix,iy+sh,true);
  shade(ix,iy+ih,ix,iy+ih-sh,true);
  shade(ix,iy,ix+sh,iy,false);
  shade(ix+iw,iy,ix+iw-sh,iy,false);

  /* moulding: bases, texture, profile, seams, wear — shared painter */
  paintFrameMaterial(c,W,H,fw,style,mulberry32(state.frameSeed));
  return out;
}

function download(){
  if(!state.done)return;
  const src=buildFramed();
  const a=document.createElement("a");
  const name=state.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"untitled";
  statusEl.innerHTML=`<span class="dot"></span>Preparing your file…`;
  src.toBlob(blob=>{
    a.href=URL.createObjectURL(blob);
    a.download=`drip-atelier-${name}-${src.width}x${src.height}.png`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    statusEl.innerHTML=`<b>${esc(state.title)}</b> downloaded — ${src.width.toLocaleString()} × ${src.height.toLocaleString()} px PNG.`;
  },"image/png");
}

