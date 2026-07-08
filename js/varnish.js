/* the varnish pass: light the accumulated height field from the upper
   left — ridges catch light, valleys shade, enamel beads specular gloss,
   bare canvas stays matte cloth — then add the photographer's key light. */
function* finishRelief(ctx,hm,W,H,u,prog,opts){
  const SILK=!!(opts&&opts.silk);
  const hx2=hm.getContext("2d");
  hx2.setTransform(1,0,0,1,0,0);
  const hw=hm.width,hh=hm.height;
  const src=hx2.getImageData(0,0,hw,hh);
  const hd=src.data;
  const N=hw*hh;

  /* wet paint relaxes — one gentle pass only, so knife-drag
     striations survive into the lighting */
  let A=new Float32Array(N), B=new Float32Array(N);
  for(let i=0;i<N;i++)A[i]=hd[i*4];
  for(let pass=0;pass<1;pass++){
    for(let y=0;y<hh;y++){
      const o=y*hw;
      for(let x=0;x<hw;x++){
        const xm=x>0?x-1:x, xp=x<hw-1?x+1:x;
        B[o+x]=(A[o+xm]+A[o+x]+A[o+xp])/3;
      }
      if((y&127)===0){prog.done++;yield;}
    }
    for(let x=0;x<hw;x++){
      for(let y=0;y<hh;y++){
        const ym=y>0?y-1:y, yp=y<hh-1?y+1:y;
        A[y*hw+x]=(B[ym*hw+x]+B[y*hw+x]+B[yp*hw+x])/3;
      }
      if((x&127)===0){prog.done++;yield;}
    }
  }

  /* a wide-blurred copy senses the neighbourhood: contact occlusion */
  const Wd=new Float32Array(A);
  for(let pass=0;pass<2;pass++){
    for(let y=0;y<hh;y++){
      const o=y*hw;
      for(let x=0;x<hw;x++){
        const x1=Math.max(0,x-2),x2=Math.min(hw-1,x+2);
        B[o+x]=(Wd[o+x1]+Wd[o+Math.max(0,x-1)]+Wd[o+x]+Wd[o+Math.min(hw-1,x+1)]+Wd[o+x2])/5;
      }
      if((y&127)===0){prog.done++;yield;}
    }
    for(let x=0;x<hw;x++){
      for(let y=0;y<hh;y++){
        const y1=Math.max(0,y-2),y2=Math.min(hh-1,y+2);
        Wd[y*hw+x]=(B[y1*hw+x]+B[Math.max(0,y-1)*hw+x]+B[y*hw+x]+B[Math.min(hh-1,y+1)*hw+x]+B[y2*hw+x])/5;
      }
      if((x&127)===0){prog.done++;yield;}
    }
  }

  /* this painting's raking key light, and its Blinn half-vector */
  const klx=Math.cos(LIGHT_ANG), kly=Math.sin(LIGHT_ANG), klz=.62;
  const ll=Math.hypot(klx,kly,klz);
  const Lx=klx/ll, Ly=kly/ll, Lz=klz/ll;
  let Hx=Lx,Hy=Ly,Hz=Lz+1;
  const hl=Math.hypot(Hx,Hy,Hz); Hx/=hl;Hy/=hl;Hz/=hl;
  /* shadow march heads toward the light */
  const sdx=klx<0?-1:1, sdy=kly<0?-1:1;
  const kS=.028;                       // height → slope (paint is ~1 mm tall)

  const out=hx2.createImageData(hw,hh);
  const od=out.data;
  for(let y=0;y<hh;y++){
    const ym=y>0?y-1:y, yp=y<hh-1?y+1:y;
    for(let x=0;x<hw;x++){
      const i=y*hw+x;
      const xm=x>0?x-1:x, xp=x<hw-1?x+1:x;
      const h=A[i];
      /* surface normal from the relaxed height field */
      const gx=(A[y*hw+xp]-A[y*hw+xm])*kS;
      const gy=(A[yp*hw+x]-A[ym*hw+x])*kS;
      const inv=1/Math.sqrt(gx*gx+gy*gy+1);
      const nx=-gx*inv, ny=-gy*inv, nz=inv;
      const thin=h<34;                 // bare canvas or a thin film
      const rel=thin?.38:Math.min(1.05,.4+h/150);
      let lightA=0, darkA=0;
      /* Lambert: slopes toward the light brighten, away fall to shade */
      const d=(nx*Lx+ny*Ly+nz*Lz-Lz)*255*rel;
      if(d>0)lightA=d*.6; else darkA=-d*.68;
      if(!thin){
        /* tight wet-enamel glints (Blinn-Phong, high exponent) */
        const sp=nx*Hx+ny*Hy+nz*Hz;
        if(sp>0){
          const s2=sp*sp,s4=s2*s2,s8=s4*s4,s16=s8*s8,s32=s16*s16;
          lightA+=s32*(70+Math.min(h,160)*.55);   // taller paint, hotter gloss
          if(s32>.92&&h>110)lightA=200;           // crest glint
        }
        lightA=Math.max(lightA,2+Math.min(h*.012,5));  // gloss film
      }
      /* contact occlusion: hollows beside tall paint sink into shade */
      const ao=(Wd[i]-h)*.45;
      if(ao>0)darkA+=Math.min(ao,38);
      /* cast shadow: march toward the light hunting for an occluder */
      let sh=0;
      for(let t2=1;t2<=5;t2++){
        const ox=x+sdx*t2, oy=y+sdy*t2;
        if(ox<0||oy<0||ox>=hw||oy>=hh)break;
        const occ=A[oy*hw+ox]-h-16*t2;
        if(occ>sh)sh=occ;
      }
      if(sh>0)darkA+=Math.min(sh*.65,75);
      lightA=Math.min(lightA,200); darkA=Math.min(darkA,115);
      const o=i*4;
      if(lightA>=darkA){od[o]=255;od[o+1]=250;od[o+2]=236;od[o+3]=lightA-darkA*.5;}
      else{od[o]=26;od[o+1]=18;od[o+2]=10;od[o+3]=darkA-lightA*.5;}
    }
    if((y&63)===0){prog.done++;yield;}
  }
  hx2.putImageData(out,0,0);            // the height canvas becomes the overlay
  ctx.drawImage(hm,0,0,W,H);

  /* ---- material truth ---- */
  /* studio debris: dust, fibres, the odd nib settled into the paint —
     none of which belongs on a pressed silk carré */
  const debris=SILK?0:Math.round((W*H)/(4400*2933)*150);
  for(let i=0;i<debris;i++){
    ctx.fillStyle=rnd()<.6?"rgba(52,42,30,0.45)":"rgba(238,233,219,0.4)";
    stamp(ctx,rnd()*W,rnd()*H,R(.25,.85)*u);
  }
  const fibres=SILK?0:RI(7,15);
  ctx.fillStyle="rgba(60,50,36,0.32)";
  for(let i=0;i<fibres;i++){
    let fx=rnd()*W, fy=rnd()*H, fa=R(0,6.2832);
    const seg=RI(5,11);
    for(let j=0;j<seg;j++){
      fa+=R(-.7,.7);
      fx+=Math.cos(fa)*1.8*u; fy+=Math.sin(fa)*1.8*u;
      stamp(ctx,fx,fy,.32*u);
    }
  }
  prog.done++;yield;

  /* pigment & sensor grain: per-pixel noise over everything */
  const gt=document.createElement("canvas");
  gt.width=gt.height=512;
  const gtc=gt.getContext("2d");
  const gImg=gtc.createImageData(512,512);
  for(let i=0;i<gImg.data.length;i+=4){
    const lite=rnd()<.5;
    gImg.data[i]=gImg.data[i+1]=gImg.data[i+2]=lite?245:18;
    gImg.data[i+3]=(rnd()*(SILK?6:13))|0;
  }
  gtc.putImageData(gImg,0,0);
  ctx.fillStyle=ctx.createPattern(gt,"repeat");
  ctx.fillRect(0,0,W,H);

  /* cloudy mottle: ageing oil and gloss — paint only, never silk */
  for(const oct of SILK?[]:[[24,.028],[96,.022]]){
    const mt=document.createElement("canvas");
    mt.width=mt.height=oct[0];
    const mtc=mt.getContext("2d");
    const mImg=mtc.createImageData(oct[0],oct[0]);
    for(let i=0;i<mImg.data.length;i+=4){
      const warm=rnd()<.62;
      mImg.data[i]=warm?116:252;
      mImg.data[i+1]=warm?92:247;
      mImg.data[i+2]=warm?58:236;
      mImg.data[i+3]=(rnd()*255)|0;
    }
    mtc.putImageData(mImg,0,0);
    ctx.globalAlpha=oct[1];
    ctx.drawImage(mt,0,0,W,H);
    ctx.globalAlpha=1;
  }
  prog.done++;yield;
  /* the gallery photograph: a museum track light rakes from the key
     corner, a soft spot blooms there, and the corners fall quiet —
     depth comes from shadow, never from a white veil */
  const lxn=Math.cos(LIGHT_ANG), lyn=Math.sin(LIGHT_ANG);
  const LK=SILK?.35:1;   /* silk is photographed flat and even */
  let g=ctx.createLinearGradient(
    W*(.5+lxn*.5),H*(.5+lyn*.5),W*(.5-lxn*.5),H*(.5-lyn*.5));
  g.addColorStop(0,`rgba(255,248,232,${(.03*LK).toFixed(3)})`);
  g.addColorStop(.5,"rgba(0,0,0,0)");
  g.addColorStop(1,`rgba(22,15,7,${(.07*LK).toFixed(3)})`);
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
  g=ctx.createRadialGradient(
    W*(.5+lxn*.22),H*(.5+lyn*.22),0,
    W*(.5+lxn*.22),H*(.5+lyn*.22),Math.max(W,H)*.55);
  g.addColorStop(0,`rgba(255,250,238,${(.035*LK).toFixed(3)})`);
  g.addColorStop(1,"rgba(255,250,238,0)");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
  g=ctx.createRadialGradient(W*.5,H*.5,Math.max(W,H)*.38,W*.5,H*.5,Math.hypot(W,H)*.62);
  g.addColorStop(0,"rgba(0,0,0,0)");
  g.addColorStop(1,`rgba(20,14,6,${(.1*LK).toFixed(3)})`);
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
}

