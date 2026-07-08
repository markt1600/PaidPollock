/* ===== BASQUIAT WING START =====
   A library of symbol primitives + a crayon (oilstick) line pass + a dense
   wall-to-wall hand-lettered text field, on off-white paper. Mirrors the Miró
   wing's architecture. The skull is a LOCKED house grammar — the AI never
   draws the face. Scoped in an IIFE so its generic helper names never leak. */
const { basquiatGenerate } = (function () {
  'use strict';
  let U = 1;
  function setMed(med, color, u) { MAT_MED = med; MAT_INK = color; MAT_U = u; }
  function setRnd(fn) { rnd = fn; }

/* ============================================================================
 * THE BASQUIAT WING — a prototype, not yet wired into the atelier.
 *
 * Architecture mirrors the Miró wing: a library of symbol primitives + a
 * crayon (oilstick) line pass + flat colour fields, loosely composed all-over.
 * The line is drawn with the Matisse wing's crayon engine (matlib.mline),
 * so the dry oilstick texture comes for free.
 *
 * The HEAD is a LOCKED house grammar — a fixed parametric function with a few
 * seeded toggles. As with the Matisse masks, geometry for the face never comes
 * from the AI; the house draws it. That contract is the whole reason the head
 * doesn't become a quality-bar landmine the way the Morimoto scenes did.
 * ==========================================================================*/

/* nib scale U is declared on the IIFE above */
/* a crayon stroke in a chosen colour: just re-inks the existing engine      */
function line(ctx, pts, w, color, opt) {
  setMed('crayon', color, U);
  mline(ctx, pts, w, opt || {});
}
const J = a => R(-a, a);          /* a little jitter                        */

/* ---------------------------------------------------------------------------
 * PALETTE — disciplined, dirtied primaries on a strong ground. Mark colour is
 * chosen by ground luminance so the line always reads.
 * ------------------------------------------------------------------------- */
const GROUNDS = [
  { bg:'#1b3a6b', dark:true },   /* cobalt   */
  { bg:'#6d2018', dark:true },   /* oxblood  */
  { bg:'#15110d', dark:true },   /* near-black */
  { bg:'#2a5145', dark:true },   /* viridian */
  { bg:'#b07f2c', dark:false },  /* ochre    */
  { bg:'#d7caab', dark:false },  /* raw bone */
];
const IVORY = '#ece3cf', CHAR = '#15110d';
const ACCENT = ['#c4341e', '#e3b417', '#205aa0', '#3f8f6b']; /* cad red, cad yellow, blue, green */
const markOn = g => g.dark ? IVORY : CHAR;

/* ---------------------------------------------------------------------------
 * THE SYMBOL SET — each a crayon mark or two.
 * ------------------------------------------------------------------------- */
function crown(ctx, x, y, s, color) {
  const w = s, h = s * 0.7;
  /* three points, the middle tallest — the signature */
  const p = [
    [x - w, y], [x - w * 0.62, y - h * 0.78 + J(s*.04)],
    [x - w * 0.34, y - h * 0.18], [x, y - h + J(s*.05)],
    [x + w * 0.34, y - h * 0.18], [x + w * 0.62, y - h * 0.78 + J(s*.04)],
    [x + w, y],
  ];
  line(ctx, p, 2.4 * U, color, { taper: 'both' });
  /* little serif ticks at the three peaks */
  for (const px of [-w * 0.62, 0, w * 0.62]) {
    const ty = y - (px === 0 ? h : h * 0.78);
    line(ctx, [[x + px - s*.08, ty - s*.12], [x + px + s*.08, ty - s*.12]], 2 * U, color);
  }
}
function halo(ctx, x, y, rx, color) {
  const ry = rx * 0.34;
  line(ctx, mArcPts(x, y, rx, ry, Math.PI * 1.08, Math.PI * 1.92, 0, 16), 2 * U, color, { taper: 'both' });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * 0.5 + (i - 2) * 0.42;
    line(ctx, [[x + Math.cos(a) * rx * 0.7, y - Math.abs(Math.sin(a)) * ry - 2*U],
               [x + Math.cos(a) * rx * 0.95, y - Math.abs(Math.sin(a)) * ry - rx * 0.22]], 1.8 * U, color);
  }
}
function arrow(ctx, x, y, len, ang, color) {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
  line(ctx, [[x, y], [ex, ey]], 2 * U, color, { taper: 'start' });
  for (const d of [2.5, -2.5]) {
    line(ctx, [[ex, ey], [ex + Math.cos(ang + d) * len * 0.3, ey + Math.sin(ang + d) * len * 0.3]], 2 * U, color);
  }
}
function asterisk(ctx, x, y, s, color) {
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3 + J(.2);
    line(ctx, [[x - Math.cos(a) * s, y - Math.sin(a) * s], [x + Math.cos(a) * s, y + Math.sin(a) * s]], 1.8 * U, color);
  }
}
function crosshatch(ctx, x, y, w, h, color) {
  const n = 4 + (R(0, 3) | 0), gap = w / n;
  for (let i = 0; i <= n; i++)
    line(ctx, [[x + i*gap + J(2), y + J(3)], [x + i*gap + J(2), y + h + J(3)]], 1.5 * U, color);
  const m = 3 + (R(0, 2) | 0), vg = h / m;
  for (let i = 0; i <= m; i++)
    line(ctx, [[x + J(3), y + i*vg + J(2)], [x + w + J(3), y + i*vg + J(2)]], 1.5 * U, color);
}
function box(ctx, x0, y0, x1, y1, color) {
  line(ctx, [[x0,y0],[x1,y0+J(2)],[x1+J(2),y1],[x0+J(2),y1+J(1)],[x0,y0]], 1.8 * U, color, {});
}
function drip(ctx, x, y, len, color) {
  const pts = [[x, y]];
  const n = 5 + (R(0,3)|0);
  for (let i = 1; i <= n; i++) pts.push([x + J(2 + i*0.4), y + len * i / n]);
  line(ctx, pts, 2 * U, color, { taper: 'start' });
  setMed('crayon', color, U);
  ctx.fillStyle = color;
  for (let g = 0; g < 6; g++) { ctx.globalAlpha = R(.4,.8); stamp(ctx, x + J(2), y + len + J(3), (2.5 + R(0,2)) * U); }
  ctx.globalAlpha = 1;
}

/* ---------------------------------------------------------------------------
 * ANATOMY & DIAGRAM MARKS — the exposed-skeleton vocabulary. Bodies, bones,
 * hands, tallies, registration crosses, scribble-fill, number rows. This is
 * the layer that takes the wing from "a head" to "a Basquiat".
 * ------------------------------------------------------------------------- */
function ribcage(ctx, x, y, w, h, color) {
  line(ctx, [[x, y],[x+J(4), y+h]], 2.6*U, color, { taper:'both' });   /* the spine */
  const n = 3 + (R(0,3)|0);
  for (let i=1;i<=n;i++) {
    const ry = y + h*i/(n+1);
    for (const sgn of [-1,1])
      line(ctx, [[x+J(2), ry],[x+sgn*w*.5, ry-h*.05],[x+sgn*w*.6, ry+h*.05]], 1.7*U, color, { taper:'end' });
  }
}
function hand(ctx, x, y, s, color) {
  const sp = R(.5,.95);
  for (let i=0;i<5;i++) {
    const a = -Math.PI*.5 + (i-2)*sp*.5 + J(.1);
    line(ctx, [[x, y],[x+Math.cos(a)*s, y+Math.sin(a)*s]], 1.7*U, color, { taper:'end' });
  }
  line(ctx, mArcPts(x, y, s*.32, s*.24, .1, 3.04, 0, 7), 1.6*U, color);
}
function limb(ctx, x0, y0, x1, y1, color) {                /* a bone with joint rings */
  line(ctx, [[x0+J(2),y0],[x1+J(2),y1]], 2.3*U, color, { taper:'both' });
  for (const [jx,jy] of [[x0,y0],[x1,y1]])
    line(ctx, mArcPts(jx, jy, 4*U, 4*U, 0, 6.283, 0, 9), 1.4*U, color);
}
function figure(ctx, x, y, s, color, accent) {             /* a full exposed-skeleton body */
  const hd = head(ctx, x, y - s*1.18, s*.46, color, accent);
  ribcage(ctx, x, y - s*.6, s*.72, s*.85, color);
  for (const sgn of [-1,1]) {                              /* arms + splayed hands */
    const ex = x + sgn*s*.72, ey = y - s*.08;
    limb(ctx, x + sgn*s*.12, y - s*.56, ex, ey, color);
    hand(ctx, ex + sgn*s*.04, ey + s*.08, s*.2, color);
  }
  for (const sgn of [-1,1]) limb(ctx, x + sgn*s*.07, y + s*.28, x + sgn*s*.3, y + s, color); /* legs */
  return hd;
}
function tally(ctx, x, y, n, color) {
  for (let i=0;i<n;i++) line(ctx, [[x+i*5*U, y],[x+i*5*U+J(1.5), y-13*U]], 1.6*U, color);
  if (n>=4) line(ctx, [[x-2*U, y-6*U],[x+(n-1)*5*U+2*U, y-7*U+J(2)]], 1.6*U, color);
}
function scribbleFill(ctx, x, y, w, h, color) {            /* dense back-and-forth overpaint */
  const pts=[]; let yy=y; const rows=4+(R(0,5)|0), step=h/rows;
  for (let r=0;r<=rows;r++){ pts.push([x+(r%2?w:0)+J(5), yy]); pts.push([x+(r%2?0:w)+J(5), yy]); yy+=step; }
  line(ctx, pts, 2*U, color, {});
}
/* a hand-coloured region: dense crayon scribble in a colour, paper showing through */
function colorScribble(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha != null ? alpha : R(.5,.78);
  const passes = 2 + (R(0,3)|0);
  for (let p = 0; p < passes; p++) {
    const rows = 12 + (R(0,14)|0), step = h/rows, skew = R(-.28,.28);
    const pts = []; let yy = y;
    for (let r = 0; r <= rows; r++) { const off = skew*step*r;
      pts.push([x + (r%2?w:0) + J(10) + off, yy]); pts.push([x + (r%2?0:w) + J(10) + off, yy]); yy += step; }
    line(ctx, pts, R(2.5,4.2)*U, color, {});
  }
  ctx.restore();
}
/* a hand-painted fill: a wobbly-edged shape, NEVER a straight-edged box */
function handFill(ctx, x, y, w, h, color, alpha, jitScale) {
  ctx.save(); ctx.globalAlpha = alpha != null ? alpha : 1; ctx.fillStyle = color;
  const jit = Math.min(w,h) * (jitScale || .05) + 2, pts = [];
  const edge = (ax,ay,bx,by) => { for (let i=0;i<4;i++){const t=i/4; pts.push([ax+(bx-ax)*t+J(jit), ay+(by-ay)*t+J(jit)]);} };
  edge(x,y,x+w,y); edge(x+w,y,x+w,y+h); edge(x+w,y+h,x,y+h); edge(x,y+h,x,y);
  ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* fill the CURRENT clip region with a dense colour scribble that reads as a
   hand-coloured solid — NEVER a flat fill */
function denseScribble(ctx, x, y, w, h, color, alpha, heavy) {
  ctx.save();
  ctx.globalAlpha = alpha != null ? alpha : 1;
  /* heavy = build up an opaque, dark, text-occluding mass; still crayon */
  if (heavy) {                                         /* a deep tone base, crayon laid over it */
    ctx.save(); ctx.globalAlpha = .62; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  const dirs = heavy ? [0, 1, 2, 3, 0, 1] : null;     /* H,V,diag,diag,H,V — denser */
  const passes = heavy ? dirs.length : 2 + (R(0,2)|0);
  const tight = heavy ? 1.55 : 2.3, fat = heavy ? R(4,5.6) : R(2.2,3.4);
  for (let p = 0; p < passes; p++) {
    const dir = heavy ? dirs[p] : (p === 0 ? 0 : (R(0,1) < .5 ? 0 : 1));
    if (dir < 2) {                                     /* axis-aligned passes */
      const horiz = dir === 0;
      const span = horiz ? h : w, cross = horiz ? w : h;
      const rows = Math.max(10, Math.round(span / (tight*U)));
      const step = span / rows; let pos = horiz ? y : x; const pts = [];
      for (let r = 0; r <= rows; r++) {
        const a = (r%2 ? cross : 0) + J(7), b = (r%2 ? 0 : cross) + J(7);
        if (horiz) { pts.push([x+a, pos]); pts.push([x+b, pos]); }
        else { pts.push([pos, y+a]); pts.push([pos, y+b]); }
        pos += step;
      }
      line(ctx, pts, fat*U, color, {});
    } else {                                           /* diagonal coverage passes */
      const down = dir === 2, pts2 = [];
      for (let o = -h; o < w + h; o += tight*1.3*U) {
        const x0 = x + o, x1 = x0 + (down ? h : -h);
        pts2.push([x0 + J(6), y]); pts2.push([x1 + J(6), y + h]);
        pts2.push([x1 + J(6), y + h]); pts2.push([x0 + J(6), y]);
      }
      line(ctx, pts2, fat*U, color, {});
    }
  }
  ctx.restore();
}
/* a wobbly-edged shape filled with dense scribble — replaces every solid box */
function scribbleBox(ctx, x, y, w, h, color, opt) {
  opt = opt || {};
  const jit = Math.min(w,h)*(opt.jit||.06) + 2, poly = [];
  const edge = (ax,ay,bx,by) => { for (let i=0;i<4;i++){const t=i/4; poly.push([ax+(bx-ax)*t+J(jit), ay+(by-ay)*t+J(jit)]);} };
  edge(x,y,x+w,y); edge(x+w,y,x+w,y+h); edge(x+w,y+h,x,y+h); edge(x,y+h,x,y);
  ctx.save();
  ctx.beginPath(); poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip();
  denseScribble(ctx, x - jit, y - jit, w + 2*jit, h + 2*jit, color, opt.alpha != null ? opt.alpha : 1);
  ctx.restore();
  if (opt.outline) line(ctx, poly.concat([poly[0]]), (opt.ow||1.8)*U, opt.outline, {});
}
/* an ORGANIC shape, clearly coloured in by hand with a colour pencil:
   an irregular blob, filled with directional pencil hatching + a soft outline */
function pencilShape(ctx, cx, cy, rx, ry, color) {
  const n = 13, out = [], ph = R(0,6.28);
  for (let i=0;i<=n;i++){ const a=i/n*6.283, r=(1+.16*Math.sin(a*3+ph))*(1+J(.13)); out.push([cx+Math.cos(a)*rx*r, cy+Math.sin(a)*ry*r]); }
  ctx.save();
  ctx.beginPath(); out.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = R(.5,.75);
  const ang = R(0,3.1416), ca = Math.cos(ang), sa = Math.sin(ang), span = Math.max(rx,ry)*2.3;
  const step = Math.max(2.5*U, span / (16 + (R(0,12)|0)));
  for (let d=-span; d<span; d+=step) {                       /* colour-pencil hatching */
    const pts = []; for (let t=-span;t<=span;t+=span/6) pts.push([cx + ca*t - sa*d + J(2.5), cy + sa*t + ca*d + J(2.5)]);
    line(ctx, pts, R(1.8,3)*U, color, {});
  }
  if (R(0,1) < .5) {                                       /* a second, crossing pass */
    const a2 = ang + R(.7,1.2), c2 = Math.cos(a2), s2 = Math.sin(a2);
    for (let d=-span; d<span; d+=step*1.4) {
      const pts = []; for (let t=-span;t<=span;t+=span/6) pts.push([cx + c2*t - s2*d + J(2.5), cy + s2*t + c2*d + J(2.5)]);
      line(ctx, pts, R(1.6,2.6)*U, color, {});
    }
  }
  ctx.restore();
  ctx.globalAlpha = R(.6,.85);
  line(ctx, out, R(1.4,2.4)*U, color, {});                 /* the soft hand outline */
  ctx.globalAlpha = 1;
}
function regMark(ctx, x, y, s, color) {                    /* a registration cross-in-circle */
  line(ctx, [[x-s,y],[x+s,y]], 1.6*U, color);
  line(ctx, [[x,y-s],[x,y+s]], 1.6*U, color);
  line(ctx, mArcPts(x, y, s*.7, s*.7, 0, 6.283, 0, 10), 1.4*U, color);
}

/* ---------------------------------------------------------------------------
 * A STROKE ALPHABET — blocky capitals in the house hand, run through crayon.
 * Glyphs live in a unit box: x right 0..1, y down 0..1 (cap-top 0, base 1).
 * ------------------------------------------------------------------------- */
const G = {
  A:[[[0,1],[.5,0],[1,1]],[[.2,.62],[.8,.62]]],
  B:[[[0,1],[0,0],[.7,0],[.9,.25],[.62,.5],[0,.5]],[[.62,.5],[.92,.52],[1,.76],[.78,1],[0,1]]],
  C:[[[1,.18],[.55,0],[.1,.22],[.05,.72],[.5,1],[1,.82]]],
  D:[[[0,1],[0,0],[.55,0],[1,.4],[1,.62],[.55,1],[0,1]]],
  E:[[[1,0],[0,0],[0,1],[1,1]],[[0,.52],[.72,.52]]],
  F:[[[1,0],[0,0],[0,1]],[[0,.52],[.7,.52]]],
  G:[[[1,.18],[.55,0],[.08,.3],[.1,.74],[.55,1],[1,.82],[1,.58]],[[.58,.58],[1,.58]]],
  H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.52],[1,.52]]],
  I:[[[.5,0],[.5,1]],[[.22,0],[.78,0]],[[.22,1],[.78,1]]],
  J:[[[1,0],[1,.78],[.68,1],[.22,.9],[.12,.66]]],
  K:[[[0,0],[0,1]],[[1,0],[.05,.55]],[[.05,.5],[1,1]]],
  L:[[[0,0],[0,1],[1,1]]],
  M:[[[0,1],[0,0],[.5,.58],[1,0],[1,1]]],
  N:[[[0,1],[0,0],[1,1],[1,0]]],
  O:[[[.5,0],[.1,.25],[.05,.72],[.5,1],[.95,.72],[.92,.25],[.5,0]]],
  P:[[[0,1],[0,0],[.72,0],[.92,.26],[.7,.52],[0,.52]]],
  Q:[[[.5,0],[.1,.25],[.05,.72],[.5,1],[.95,.72],[.92,.25],[.5,0]],[[.58,.7],[1,1.08]]],
  R:[[[0,1],[0,0],[.72,0],[.92,.26],[.7,.52],[0,.52]],[[.42,.52],[1,1]]],
  S:[[[1,.16],[.6,0],[.12,.2],[.32,.46],[.72,.56],[.9,.8],[.42,1],[0,.84]]],
  T:[[[0,0],[1,0]],[[.5,0],[.5,1]]],
  U:[[[0,0],[0,.68],[.32,1],[.68,1],[1,.68],[1,0]]],
  V:[[[0,0],[.5,1],[1,0]]],
  W:[[[0,0],[.26,1],[.5,.42],[.74,1],[1,0]]],
  X:[[[0,0],[1,1]],[[1,0],[0,1]]],
  Y:[[[0,0],[.5,.52],[1,0]],[[.5,.52],[.5,1]]],
  Z:[[[0,0],[1,0],[0,1],[1,1]]],
  '0':[[[.5,0],[.1,.25],[.05,.72],[.5,1],[.95,.72],[.92,.25],[.5,0]],[[.25,.82],[.78,.18]]],
  '1':[[[.28,.22],[.5,0],[.5,1]],[[.22,1],[.8,1]]],
  '2':[[[.02,.22],[.5,0],[.9,.26],[.6,.56],[0,1],[1,1]]],
  '3':[[[0,.12],[.72,0],[.92,.26],[.55,.5],[.92,.72],[.7,1],[0,.9]]],
  '4':[[[.72,1],[.72,0],[0,.66],[1,.66]]],
  '5':[[[1,0],[.1,0],[0,.46],[.6,.4],[.9,.66],[.6,1],[0,.9]]],
  '7':[[[0,0],[1,0],[.4,1]]],
  '+':[[[.5,.2],[.5,.8]],[[.2,.5],[.8,.5]]],
  '-':[[[.2,.5],[.8,.5]]],
  '.':[[[.45,.95],[.55,.95]]],
  '(':[[[.68,0],[.32,.32],[.32,.68],[.68,1]]],
  ')':[[[.32,0],[.68,.32],[.68,.68],[.32,1]]],
  ',':[[[.52,.82],[.4,1.06]]],
  '/':[[[.8,0],[.2,1]]],
  '=':[[[.2,.4],[.8,.4]],[[.2,.7],[.8,.7]]],
  ' ':[],
};
/* ---- text transform helpers: an angled, gently curved, drifting baseline ---- */
function mkXform(x, y, ang, amp, freq, ph) {
  const ca = Math.cos(ang||0), sa = Math.sin(ang||0);
  return (lx, ly) => { const wy = ly + (amp ? amp*Math.sin(lx*freq + ph) : 0);
    return [x + lx*ca - wy*sa, y + lx*sa + wy*ca]; };
}
function ringLocal(cx, cy, r, map) { const o=[]; for (let i=0;i<=12;i++){const a=i/12*6.283; o.push(map(cx+Math.cos(a)*r, cy+Math.sin(a)*r));} return o; }
function encloseLocal(kind, x0, y0, x1, y1, map) {       /* wobbly hand-drawn box or oval, in baseline space */
  const o = [];
  if (kind === 'oval') {
    const cx=(x0+x1)/2, cy=(y0+y1)/2, rx=Math.abs(x1-x0)/2*1.16, ry=Math.abs(y1-y0)/2*1.25;
    for (let i=0;i<=16;i++){const a=i/16*6.283; o.push(map(cx+Math.cos(a)*rx+J(2), cy+Math.sin(a)*ry+J(2)));}
  } else {
    const edge=(ax,ay,bx,by)=>{ for(let i=0;i<3;i++){const t=i/3; o.push(map(ax+(bx-ax)*t+J(2), ay+(by-ay)*t+J(2)));} };
    edge(x0,y0,x1,y0); edge(x1,y0,x1,y1); edge(x1,y1,x0,y1); edge(x0,y1,x0,y0); o.push(map(x0,y0));
  }
  return o;
}

/* render one word in the crayon hand; angle/curve/drift/enclose via opts */
function word(ctx, str, x, y, h, color, opt) {
  opt = opt || {};
  str = str.toUpperCase();
  const sp = h * 0.18, w = h * 0.66;
  const amp = opt.curve ? h*opt.curve : 0, freq = opt.curveFreq || (1.4/Math.max(1, str.length*w)), ph = opt.curvePhase || R(0,6.28);
  const map = mkXform(x, y, opt.angle||0, amp, freq, ph);
  let lx = 0; const wsl = J(.12);                     /* a per-word slant */
  for (const ch of str) {
    const dy = J(h*.14), ls = R(.82,1.18), lw2 = w*R(.88,1.08);   /* uneven letters */
    if (ch === '\u00A9') {
      const r = h * 0.42, ccx = lx + r, ccy = -h * 0.5 + dy;
      line(ctx, ringLocal(ccx, ccy, r, map), 1.6 * U, color);
      for (const s of G.C) line(ctx, s.map(p => map(ccx - r*.42 + p[0]*r*.8, ccy - r*.5 + p[1]*r)), 1.4*U, color);
      lx += r * 2 + sp*R(.6,1.3); continue;
    }
    const g = G[ch] || G[' '];
    for (const stroke of g) {
      if (!stroke.length) continue;
      const jx = J(1.8), sl = wsl + J(.05);
      line(ctx, stroke.map(p => map(lx + p[0]*lw2 + jx + p[1]*sl*lw2, (p[1]-1)*h*ls + dy + J(1.8))), 1.7 * U, color, {});
    }
    lx += lw2 + sp*R(.55,1.4);
  }
  const right = lx - sp;
  if (opt.strike) line(ctx, [map(-h*.12, -h*.48), map(right + h*.12, -h*.5)], 2.2 * U, color);
  if (opt.box || opt.enclose) line(ctx, encloseLocal(opt.enclose==='oval'?'oval':'box', -h*.2, h*.18, right + h*.2, -h*1.15, map), 1.8*U, color);
  return x + right;
}

/* ---------------------------------------------------------------------------
 * THE HEAD — the LOCKED house grammar. Seeded toggles only; the AI never
 * supplies any of this geometry.
 * ------------------------------------------------------------------------- */
function head(ctx, cx, cy, s, color, accent) {
  const w = s, h = s * 1.22;
  /* a scrubbed colour mass behind the skull — rough, never a clean disc */
  if (R(0,1) < .62) {
    ctx.save(); ctx.globalAlpha = R(.7,.92); ctx.fillStyle = accent;
    if (R(0,1) < .5) {                        /* a torn field, hand-painted */
      ctx.restore();
      handFill(ctx, cx - w*R(.7,.95) + J(6), cy - h*R(.55,.8) + J(6), w*R(1.4,1.9), h*R(1.2,1.7), accent, R(.7,.92), .08);
      ctx.save();
    } else {                                    /* a hacked-out mass */
      ctx.beginPath();
      const n = 14, rr = s*R(1.0,1.2);
      for (let i=0;i<=n;i++){const a=i/n*6.283; const r=rr*(1+J(.14)); const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r*1.15; i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  /* the skull — angular, asymmetric, a flat-ish cranium */
  const jb = R(.86,1.04);                      /* jaw asymmetry */
  const out = [
    [0,-1.02],[-.5,-.98],[-.86,-.66],[-.99,-.1],[-.9*jb,.42],[-.5,.84],[-.16,1.08],
    [.18,1.08],[.52,.84],[.92/jb,.42],[.99,-.1],[.86,-.66],[.5,-.98],[0,-1.02]
  ].map(p => [cx + p[0]*w*.5 + J(4), cy + p[1]*h*.5 + J(4)]);
  line(ctx, out, 3.0 * U, color, {});
  /* skull seams — the exposed cranium */
  if (R(0,1) < .7) line(ctx, [[cx+J(3), cy-h*.5],[cx+J(4), cy-h*.04]], 1.6*U, color, {taper:'both'});
  line(ctx, [[cx - w*.4, cy - h*.3 + J(3)],[cx + w*.4, cy - h*.3 + J(4)]], 1.6*U, color, {taper:'both'});

  /* eyes — bigger, intenser, often asymmetric (left ≠ right) */
  const eyeY = cy - h*0.14, ex = w*0.27;
  const eye = (ox, kind, rsc) => {
    const r = w*.14*rsc;
    if (kind < .34) {                            /* a wide ringed eye, pupil shoved off-centre */
      line(ctx, mArcPts(ox, eyeY, r, r, 0, 6.283, 0, 14), 2.2*U, color);
      ctx.fillStyle = color; const dx=J(r*.5), dy=J(r*.5);
      for (let g=0;g<7;g++){ctx.globalAlpha=R(.45,.85);stamp(ctx,ox+dx+J(2),eyeY+dy+J(2),2.6*U);} ctx.globalAlpha=1;
    } else if (kind < .68) {                      /* crossed out */
      line(ctx, [[ox-r,eyeY-r],[ox+r,eyeY+r]], 2.4*U, color);
      line(ctx, [[ox+r,eyeY-r],[ox-r,eyeY+r]], 2.4*U, color);
    } else {                                      /* a hollow socket — radiating */
      line(ctx, mArcPts(ox, eyeY, r*1.05, r*1.05, 0, 6.283, 0, 14), 2.2*U, color);
      for (let k=0;k<5;k++){const a=k/5*6.283;line(ctx,[[ox+Math.cos(a)*r*.3,eyeY+Math.sin(a)*r*.3],[ox+Math.cos(a)*r,eyeY+Math.sin(a)*r]],1.4*U,color);}
    }
  };
  const asym = R(0,1) < .55;                    /* sometimes the two eyes disagree */
  const kL = R(0,1), kR = asym ? R(0,1) : kL;
  eye(cx - ex, kL, R(.9,1.15)); eye(cx + ex, kR, R(.9,1.15));

  /* nose — two nostril ticks, raw */
  line(ctx, [[cx + J(2), eyeY + w*.12],[cx + J(3), cy + h*.05]], 1.8*U, color);
  line(ctx, [[cx - w*.06, cy + h*.05],[cx + J(2), cy + h*.09],[cx + w*.06, cy + h*.05]], 1.6*U, color);

  /* mouth — the signature BARED TEETH GRID, wide and toothy */
  const mw = w*R(.66,.84), mh = h*R(.16,.22), mx0 = cx - mw*.5 + J(4), my0 = cy + h*0.2;
  box(ctx, mx0, my0, mx0+mw, my0+mh, color);
  const nt = 6 + (R(0,4)|0), tg = mw/nt;
  for (let i=1;i<nt;i++) line(ctx, [[mx0+i*tg+J(1.5), my0+J(2)],[mx0+i*tg+J(1.5), my0+mh+J(2)]], 1.7*U, color);
  line(ctx, [[mx0+J(2), my0+mh*.5],[mx0+mw+J(2), my0+mh*.5+J(2)]], 1.8*U, color);  /* the gum line */

  /* exposed structure — a cheek of crosshatch */
  if (R(0,1) < .55) crosshatch(ctx, cx + w*(R(0,1)<.5?.32:-.54), cy - h*.04, w*.22, h*.22, color);

  /* the neck & a clavicle V */
  const ny = cy + h*0.54;
  line(ctx, [[cx - w*.24, ny],[cx - w*.22, ny + h*.3]], 2.2*U, color, {taper:'end'});
  line(ctx, [[cx + w*.24, ny],[cx + w*.22, ny + h*.3]], 2.2*U, color, {taper:'end'});
  if (R(0,1) < .75)
    line(ctx, [[cx - w*.42, ny + h*.26],[cx, ny + h*.46],[cx + w*.42, ny + h*.26]], 1.9*U, color, {taper:'both'});
  return { topY: cy - h*0.51 };
}

/* ---------------------------------------------------------------------------
 * COMPOSITION — field, optional panel, scrub, head(s), symbols, words, drips.
 * ------------------------------------------------------------------------- */
const WORDBANK = [   /* curated to his material / anatomical / heraldic registers,
                        deliberately steering clear of charged sociopolitical text */
  'KING','CROWN','HALO','HERO','FAMOUS','TEETH','BONE','FEMUR','AORTA','LIVER',
  'NERVE','SKULL','GOLD','SUGAR','SALT','MILK','TAR','OZONE','LEAD','NOTARY',
  'ORIGIN','THOR','NILE','SACRED','PLASMA','CORPUS','HALF','KINGS','SPINE','RIB',
  'ASBESTOS','MARROW','IRON','COPPER','TITANIUM','VEIN','ARTERY','PELVIS','ULNA',
];
const FRAGS = ['A','E','S','M','X','PX','III','MM','½','©'];   /* loose tokens */
/* fragmented everyday / found words, the kind pulled from packaging & signs —
   the documented technique, sprinkled in sparingly */
const FOUND = ['FOOEY','ASBESTOS','TEETH','SOAP','TOBACCO','SUGAR','SALT','MILK','TAR',
               'PLUSH','SADDLE','FLATBUSH','GRADE A','LIVER','NOTARY','PERFECTO','CHEAP'];
/* whole sayings, kept to aphorisms (not specific charged work-titles), used rarely
   and rendered as a stacked multi-line inscription like the canvases */
const SAYINGS = [
  ['MOST YOUNG KINGS','GET THEIR','HEAD CUT OFF.'],
  ['THIS IS NOT','A PIPE'],
];
/* SAMO© is his actual graffiti tag — left OFF by default, because stamping it on
   a generated piece reads as signing AS him rather than as homage. Flip to true
   only if an explicit, clearly-labelled tribute tag is wanted. */
const USE_SAMO = true;

/* ORIGINAL commentary in his fragmentary, cryptic register (not quoted) —
   the registers he worked in (power, money, mortality, the crown) turned onto
   the present: machine intelligence, the cost of living, the gap between rich
   and poor, hollow politics, a burning world nobody looks at. Kept raw and
   ambiguous rather than slogan-like, woven in sparingly and often struck out. */
const COMMENTARY = [
  /* the machine ascendant */
  'THE MACHINE LEARNS', 'ARTIFICIAL KING', 'WHO TAUGHT THE MACHINE\u00A9', 'SILICON CROWN',
  'OBSOLETE MAN', 'THE THINKING ENGINE', 'MAN MADE THE GOD THAT REPLACES MAN', 'AUTOMATA\u00A9',
  'THE ALGORITHM OWNS THE CROWN',
  /* the cost of living */
  'BREAD COSTS MORE', 'PAY MORE GET LESS', 'THE DOLLAR SHRINKS', '100 IS THE NEW 10',
  'CHEAPER YESTERDAY', 'EVERYTHING COSTS MORE', 'PRICE\u00A9 RISING',
  /* the gap */
  'FEW OWN ALL', 'THE GOLD GOES UP', 'KINGS AND PAUPERS', 'THE 1 AND THE 99',
  'FULL VAULTS EMPTY PLATES', 'WHO HOLDS THE GOLD', 'GOLD FOR THE FEW', 'EMPTY HANDS',
  /* hollow politics */
  'THE KINGS LIE', 'EMPTY PROMISE', 'THE THRONE IS HOLLOW', 'NO ONE LEADS',
  'BROKEN CROWN', 'PROMISES (VOID)', 'RULERS ASLEEP', 'VOTES FOR NOTHING',
  /* the burning world */
  'THE LAST TREE', 'NOBODY LOOKS UP', 'THE RIVER DIES', 'SOLD THE SKY',
  'NO ONE CARES', 'THE EARTH FOR SALE', 'WARMER EVERY YEAR', 'PARADISE (PAVED)', 'ASH FOR AIR',
];
/* a few as stacked, declarative inscriptions */
const COMMENTARY_STACKS = [
  ['FEW OWN ALL', 'THE REST', 'OWE'],
  ['THE MACHINE', 'WEARS', 'THE CROWN'],
  ['NOBODY', 'LOOKS', 'UP'],
  ['THE KINGS', 'LIE', 'AND SLEEP'],
];

/* a stacked list of words, some struck through */
function numberRow(ctx, x, y, h, color) {
  let str=''; const n=3+(R(0,5)|0); for(let i=0;i<n;i++) str+='0123456789'[(R(0,10))|0];
  word(ctx, str, x, y, h, color, {});
}
function wordStack(ctx, x, y, h, color, pickWord) {
  let yy = y; const n = 2 + (R(0,3)|0), ang = R(0,1)<.4 ? J(.08) : 0;
  for (let i=0;i<n;i++) { word(ctx, pickWord(), x, yy, h, color, { strike: R(0,1) < .35, angle: ang }); yy += h*1.6; }
  if (R(0,1) < .4) line(ctx, encloseLocal(R(0,1)<.5?'box':'oval', x - h*.3, y + h*.2, x + h*5.5, y + (n-1)*h*1.6 - h*1.1, (lx,ly)=>[lx,ly]), 1.8*U, color);
}
/* a famous saying, stacked into lines like the canvases (used rarely) */
function inscription(ctx, lines, x, y, h, color, opt) {
  opt = opt || {}; let yy = y; const ang = opt.angle || 0;
  let widest = 0;
  for (const ln of lines) {
    word(ctx, ln, x, yy, h, color, { angle: ang, strike: opt.strike && R(0,1)<.4 });
    widest = Math.max(widest, ln.length*h*.62); yy += h*1.5;
  }
  if (opt.underline) line(ctx, [[x, yy-h*1.5+h*.22],[x+widest, yy-h*1.5+h*.26+J(2)]], 2.4*U, color, {});
}

/* ---------------------------------------------------------------------------
 * THE PAPER & ITS TEEMING TEXT — Basquiat grounds are never flat colour. A
 * warm ruled paper, collaged colour zones, and a wallpaper of small (often
 * illegible) handwriting, ©'d labels, boxes and little diagrams in every gap.
 * ------------------------------------------------------------------------- */
const PAPERS = ['#efe9d8', '#f0ebdb', '#ece6d2', '#f1ecde'];   /* off-white wove, no lines */
const ZONES  = ['#b5321f', '#2f6fb0', '#cf9a2b', '#2f6f63', '#efe7d2', '#1a1712', '#d8b94a'];
const BIGZONES = ['#b5321f', '#2f6fb0', '#cf9a2b', '#2f6f63', '#d8b94a', '#efe7d2'];
const CHARC  = '#1d1813';

/* ---- a fast PEN renderer for the dense background text (fine, not crayon) ---- */
function penStroke(ctx, pts, w, color, alpha) {
  ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p,i) => i ? ctx.lineTo(p[0]+J(.5), p[1]+J(.5)) : ctx.moveTo(p[0]+J(.5), p[1]+J(.5)));
  ctx.stroke(); ctx.globalAlpha = 1;
}
function penWord(ctx, str, x, y, h, color, opt) {
  opt = opt || {}; str = str.toUpperCase();
  const sp = h*0.16, w = h*0.6, al = R(.42,.82), lw = Math.max(.8, h*.07*R(.8,1.3));
  const amp = opt.curve ? h*opt.curve : 0, freq = opt.curveFreq || (1.4/Math.max(1, str.length*w)), ph = opt.curvePhase || R(0,6.28);
  const map = mkXform(x, y, opt.angle||0, amp, freq, ph);
  let lx = 0; const wsl = J(.13);
  for (const ch of str) {
    const dy = J(h*.16), ls = R(.78,1.2), lw2 = w*R(.84,1.1);
    if (ch === '\u00A9') {
      const r = h*.4, ccx = lx+r, ccy = -h*.5 + dy;
      penStroke(ctx, ringLocal(ccx, ccy, r, map), lw, color, al);
      for (const s of G.C) penStroke(ctx, s.map(p=>map(ccx - r*.42 + p[0]*r*.8, ccy - r*.5 + p[1]*r)), lw, color, al);
      lx += r*2 + sp*R(.55,1.35); continue;
    }
    const g = G[ch] || G[' '];
    for (const stroke of g) { if (!stroke.length) continue; const jx=J(1.2), sl=wsl+J(.06);
      penStroke(ctx, stroke.map(p=>map(lx + p[0]*lw2 + jx + p[1]*sl*lw2, (p[1]-1)*h*ls + dy + J(1.2))), lw, color, al); }
    lx += lw2 + sp*R(.5,1.45);
  }
  const right = lx - sp;
  if (opt.strike) penStroke(ctx, [map(-h*.1,-h*.48), map(right+h*.1,-h*.5)], lw*1.4, color, al+.12);
  if (opt.box || opt.enclose) penStroke(ctx, encloseLocal(opt.enclose==='oval'?'oval':'box', -h*.2, h*.15, right+h*.2, -h*1.15, map), lw, color, al);
  return x + right;
}
/* original Basquiat-flavoured phrases assembled from the registers (not quoted) */
function phrase(pickWord) {
  const Wd = pickWord, N = () => '' + ((R(0,400)|0));
  const t = R(0,1);
  if (t < .14) return Wd()+' + '+Wd();
  if (t < .26) return Wd()+' ('+Wd()+')';
  if (t < .38) return 'DIAGRAM OF THE '+Wd();
  if (t < .48) return 'DETAIL OF THE '+Wd();
  if (t < .58) return 'SIDE VIEW OF '+Wd();
  if (t < .67) return N()+' PERCENT';
  if (t < .76) return Wd()+' WITHOUT '+Wd();
  if (t < .85) return 'THE '+Wd()+' OF '+Wd();
  if (t < .93) return N()+'. '+Wd();
  return 'NON-'+Wd();
}
/* a solid black mass — the compositional anchor blocks of image 1 */
function blackBlock(ctx, x, y, w, h) {
  scribbleBox(ctx, x, y, w, h, pick(['#161310','#1a1712']), { alpha: R(.9,1), jit: R(.05,.09) });
}
function heartIcon(ctx, x, y, s, color) {
  line(ctx, [[x, y+s*.6],[x-s*.7,y-s*.1],[x-s*.4,y-s*.7],[x,y-s*.3],[x+s*.4,y-s*.7],[x+s*.7,y-s*.1],[x,y+s*.6]], 1.6*U, color, {});
}
function eyeIcon(ctx, x, y, s, color) {
  line(ctx, mArcPts(x, y, s, s*.55, 0, 3.1416, 0, 8), 1.5*U, color);
  line(ctx, mArcPts(x, y, s, s*.55, 3.1416, 6.283, 0, 8), 1.5*U, color);
  line(ctx, mArcPts(x, y, s*.32, s*.32, 0, 6.283, 0, 8), 1.4*U, color);
}
function bolt(ctx, x, y, s, color) {
  line(ctx, [[x, y-s],[x-s*.4, y],[x+s*.1, y],[x-s*.2, y+s]], 2*U, color, {});
}

function ruledLines(ctx, W, H, color) {
  const gap = H / (24 + (R(0,14)|0));
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  for (let y = gap; y < H; y += gap) {
    ctx.globalAlpha = R(.05,.12);
    ctx.beginPath(); ctx.moveTo(0, y + J(2));
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + J(2));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
/* one line of illegible handwriting: short wavy runs broken into "words" */
function scrawlLine(ctx, x, y, w, h, color) {
  let cx = x; const end = x + w;
  while (cx < end) {
    const wl = R(.1,.24) * w, pts = [], n = 6 + (R(0,5)|0);
    for (let i = 0; i <= n; i++) pts.push([cx + wl*i/n, y + Math.sin(i*1.7)*h*.32 + J(h*.18)]);
    line(ctx, pts, 1.1*U, color, {});
    cx += wl + R(.03,.08)*w;
  }
}
/* the wallpaper: rows of scrawl with occasional real labels, ©'s */
function smallText(ctx, x, y, w, h, color, pickWord) {
  const rows = 3 + (R(0,6)|0); let yy = y;
  for (let r = 0; r < rows; r++) {
    if (R(0,1) < .28) word(ctx, pickWord() + (R(0,1)<.5?'\u00A9':''), x, yy + h, h, color, { strike: R(0,1)<.3 });
    else scrawlLine(ctx, x, yy + h*.5, w*R(.55,1), h, color);
    yy += h*1.55;
  }
}
function circledC(ctx, x, y, r, color) {
  line(ctx, mArcPts(x, y, r, r, 0, 6.283, 0, 12), 1.3*U, color);
  for (const s of G.C) line(ctx, s.map(p => [x - r*.4 + p[0]*r*.8, y - r*.5 + p[1]*r]), 1.2*U, color);
}
function eggRow(ctx, x, y, color) {
  const n = 4 + (R(0,5)|0), cols = Math.min(n, 4);
  for (let i = 0; i < n; i++)
    line(ctx, mArcPts(x + (i%cols)*10*U, y + ((i/cols)|0)*9*U, 3.5*U, 4.6*U, 0, 6.283, 0, 9), 1.2*U, color);
}
function stickRow(ctx, x, y, s, color) {          /* a row of tiny arms-up figures */
  const n = 3 + (R(0,5)|0);
  for (let i = 0; i < n; i++) {
    const fx = x + i*s*1.15;
    line(ctx, mArcPts(fx, y, s*.18, s*.18, 0, 6.283, 0, 7), 1.2*U, color);
    line(ctx, [[fx, y+s*.18],[fx, y+s*.7]], 1.3*U, color);
    line(ctx, [[fx-s*.3, y+s*.04],[fx, y+s*.3],[fx+s*.3, y+s*.04]], 1.2*U, color);
    line(ctx, [[fx, y+s*.7],[fx-s*.2, y+s]], 1.2*U, color);
    line(ctx, [[fx, y+s*.7],[fx+s*.2, y+s]], 1.2*U, color);
  }
}
function triLetter(ctx, x, y, s, ch, color) {     /* a triangle with a letter inside */
  line(ctx, [[x, y-s],[x-s, y+s],[x+s, y+s],[x, y-s]], 1.4*U, color);
  word(ctx, ch, x - s*.3, y + s*.55, s*1.05, color, {});
}
function diamondX(ctx, x, y, s, color) {
  line(ctx, [[x,y-s],[x+s,y],[x,y+s],[x-s,y],[x,y-s]], 1.4*U, color);
  line(ctx, [[x-s*.5,y-s*.5],[x+s*.5,y+s*.5]], 1.3*U, color);
  line(ctx, [[x+s*.5,y-s*.5],[x-s*.5,y+s*.5]], 1.3*U, color);
}

/* ---- the iconic FILLED crown: fat triangular peaks, outlined, on a block ---- */
function crownFilled(ctx, cx, baseY, w, h, fill, withBlock) {
  if (withBlock) {                                /* the red block + blue cushion, scribbled */
    scribbleBox(ctx, cx - w*.95, baseY - h*1.7, w*1.9, h*2.15, ZONES[0], { alpha:.95, jit:.07 });
    scribbleBox(ctx, cx - w*.6, baseY + h*.06, w*1.2, h*.22, '#3f86c4', { alpha:1, jit:.16 });
  }
  const v = h*.16;
  const pts = [
    [cx - w, baseY], [cx - w*.52, baseY - h + v], [cx - w*.46, baseY - v*1.2],
    [cx, baseY - h*1.16], [cx + w*.46, baseY - v*1.2], [cx + w*.52, baseY - h + v],
    [cx + w, baseY], [cx - w, baseY]
  ];
  ctx.save();
  ctx.beginPath(); pts.forEach((p,i) => i ? ctx.lineTo(p[0]+J(2),p[1]+J(2)) : ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip();
  denseScribble(ctx, cx - w*1.05, baseY - h*1.35, w*2.1, h*1.45, fill, 1);   /* the yellow crown, scribbled */
  ctx.restore();
  line(ctx, pts, 3.4*U, '#15110d', {});            /* the bold black outline */
}

/* ---- the iconic FILLED MASK HEAD: dark oval, almond ring-eyes, teeth bar ---- */
function almondEye(ctx, cx, cy, w, h, tilt) {
  const pts = [], ca = Math.cos(tilt), sa = Math.sin(tilt), jx = w*.05, jy = h*.16;
  for (let i = 0; i <= 10; i++) { const t=i/10, ex=-w/2+w*t+J(jx), ey=-Math.sin(Math.PI*t)*h/2 - J(jy*.4); pts.push([cx+ex*ca-ey*sa, cy+ex*sa+ey*ca]); }
  for (let i = 10; i >= 0; i--) { const t=i/10, ex=-w/2+w*t+J(jx), ey= Math.sin(Math.PI*t)*h/2 + J(jy*.4); pts.push([cx+ex*ca-ey*sa, cy+ex*sa+ey*ca]); }
  ctx.beginPath(); pts.forEach((p,i) => i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
  ctx.fillStyle = '#e8c23a'; ctx.fill();
  line(ctx, pts, 1.8*U, '#15110d', {});
  const ir = Math.min(w,h)*.32, ip = [];          /* a wobbly iris, not a perfect disc */
  for (let k=0;k<=11;k++){ const a=k/11*6.283, rr=ir*(1+J(.22)); ip.push([cx+Math.cos(a)*rr+J(1), cy+Math.sin(a)*rr+J(1)]); }
  ctx.beginPath(); ip.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
  ctx.fillStyle = '#d9641f'; ctx.fill();
  ctx.fillStyle = '#15110d'; ctx.beginPath(); ctx.arc(cx+J(1.5),cy+J(1.5),ir*.42,0,6.283); ctx.fill();
}
function maskHead(ctx, cx, cy, s) {
  const w = s, h = s*1.25, dark = pick(['#241410','#1a1310','#2a1712','#15110d']);
  const out = [[0,-1],[-.62,-.92],[-.92,-.5],[-.86,.05],[-.6,.55],[-.28,.92],[0,1.04],
               [.28,.92],[.6,.55],[.86,.05],[.92,-.5],[.62,-.92],[0,-1]]
              .map(p => [cx+p[0]*w*.5+J(3), cy+p[1]*h*.5+J(3)]);
  ctx.save();
  ctx.beginPath(); out.forEach((p,i) => i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip();
  denseScribble(ctx, cx-w*.55, cy-h*.62, w*1.1, h*1.26, dark, 1, true);
  ctx.restore();
  line(ctx, out, 2.6*U, '#15110d', {});
  const eyeY = cy - h*.1, ex = w*.26, ew = w*.34, eh = w*.2;
  almondEye(ctx, cx-ex, eyeY, ew, eh, .32);
  almondEye(ctx, cx+ex, eyeY, ew, eh, -.32);
  line(ctx, [[cx+J(1), eyeY+eh*.4],[cx+J(2), cy+h*.06]], 1.6*U, '#15110d');
  teethBar(ctx, cx, cy+h*.22, w*.6, h*.12, '#15110d');
  return { topY: cy - h*.5 };
}

/* the red bared-teeth bar (hand-painted, no straight edges), reused across skulls */
function teethBar(ctx, cx, my, mw, mh, dark) {
  const mx = cx - mw*.5;
  scribbleBox(ctx, mx, my, mw, mh, '#b5321f', { alpha:1, jit:.18 });
  const nt = 6 + (R(0,4)|0), tg = mw/nt;
  for (let i = 0; i < nt; i++) { const txp = mx + i*tg + tg*.5 + J(1.5);
    line(ctx, [[txp, my+mh*.18+J(1)],[txp+J(1.5), my+mh*.82+J(1)]], Math.max(2, tg*.36)*U, '#e8ddc4', {}); }
  line(ctx, encloseLocal('box', mx, my+mh, mx+mw, my, (lx,ly)=>[lx,ly]), 1.8*U, dark, {});
}

/* a SCRIBBLE-FILLED skull — coloured crayon fill, like image 1's central head */
function scribbleSkull(ctx, cx, cy, s) {
  const w = s, h = s*1.25, warm = pick(['#4a2014','#3a1810','#5a2818','#34160e']);
  const out = [[0,-1],[-.6,-.95],[-.95,-.55],[-.9,0],[-.62,.5],[-.3,.9],[0,1.05],
               [.3,.9],[.62,.5],[.9,0],[.95,-.55],[.6,-.95],[0,-1]]
              .map(p => [cx+p[0]*w*.5+J(4), cy+p[1]*h*.5+J(4)]);
  ctx.save();
  ctx.beginPath(); out.forEach((p,i) => i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip();
  denseScribble(ctx, cx-w*.6, cy-h*.65, w*1.2, h*1.3, warm, 1, true);
  ctx.restore();
  line(ctx, out, 2.6*U, '#2a1410', {});
  const eyeY = cy - h*.12, ex = w*.27;
  for (const sgn of [-1,1]) { const ox = cx + sgn*ex;
    /* a hand-drawn pale socket: wobbly edge, slight per-eye variation, not a disc */
    const ey2 = eyeY + J(w*.04), er = w*.15*(1+J(.12)), sp = [];
    for (let k=0;k<=12;k++){ const a=k/12*6.283, rr=er*(1+J(.2)); sp.push([ox+Math.cos(a)*rr+J(1.2), ey2+Math.sin(a)*rr+J(1.2)]); }
    ctx.fillStyle = '#e8c23a';
    ctx.beginPath(); sp.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
    line(ctx, sp.concat([sp[0]]), 1.4*U, '#2a1410');
    if (R(0,1) < .5) { line(ctx, mArcPts(ox, ey2, er*.82, er*.82, 0, 6.283, 0, 12), 2*U, '#2a1410');
      ctx.fillStyle = '#2a1410'; for (let g=0;g<6;g++){ctx.globalAlpha=R(.5,.85);stamp(ctx,ox+J(2),ey2+J(2),2.4*U);} ctx.globalAlpha=1; }
    else { line(ctx, [[ox-er*.78,ey2-er*.78],[ox+er*.78,ey2+er*.78]], 2*U, '#2a1410'); line(ctx, [[ox+er*.78,ey2-er*.78],[ox-er*.78,ey2+er*.78]], 2*U, '#2a1410'); }
  }
  line(ctx, [[cx+J(2), eyeY+w*.14],[cx+J(2), cy+h*.05]], 1.8*U, '#2a1410');
  teethBar(ctx, cx, cy+h*.2, w*.6, h*.12, '#2a1410');
  return { topY: cy - h*.5 };
}

/* a SIDE-FACING (profile) skull */
function maskHeadProfile(ctx, cx, cy, s) {
  const w = s, h = s*1.28, dir = R(0,1)<.5?1:-1, dark = pick(['#241410','#1a1310','#2a1712','#15110d']);
  const P = [
    [-.45,-1.0],[.15,-1.05],[.55,-.78],[.6,-.42],[.5,-.34],[.86,-.12],[.55,-.02],
    [.64,.08],[.5,.16],[.62,.32],[.34,.44],[.08,.52],[-.5,.5],[-.64,.05],[-.56,-.6],[-.45,-1.0]
  ].map(p => [cx + dir*p[0]*w*.5 + J(3), cy + p[1]*h*.5 + J(3)]);
  ctx.save();
  ctx.beginPath(); P.forEach((p,i) => i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.clip();
  denseScribble(ctx, cx-w*.6, cy-h*.62, w*1.2, h*1.28, dark, 1, true);
  ctx.restore();
  line(ctx, P, 2.6*U, '#15110d', {});
  const ex = cx + dir*w*.2, ey = cy - h*.32;
  almondEye(ctx, ex, ey, w*.3, w*.18, dir>0?-.2:.2);
  line(ctx, [[cx+dir*w*.04, ey-w*.2],[cx+dir*w*.4, ey-w*.15]], 1.6*U, '#15110d');   /* brow */
  const mw = w*.32, my = cy+h*.04, mx = cx + dir*w*.32 - (dir>0?mw:0);
  scribbleBox(ctx, mx, my, mw, h*.1, '#b5321f', { alpha:1, jit:.2 });
  const nt = 3+(R(0,3)|0), tg = mw/nt;
  for (let i=0;i<nt;i++) { const txp = mx + i*tg + tg*.5 + J(1); line(ctx, [[txp, my+h*.022],[txp+J(1), my+h*.078]], Math.max(2,tg*.34)*U, '#e8ddc4', {}); }
  line(ctx, encloseLocal('box', mx, my+h*.1, mx+mw, my, (lx,ly)=>[lx,ly]), 1.6*U, '#15110d', {});
  line(ctx, mArcPts(cx-dir*w*.14, cy-h*.04, w*.09, w*.11, 0, 6.283, 0, 8), 1.5*U, '#15110d');  /* ear */
  return { topY: cy - h*.5 };
}

/* pick any skull variant — the house keeps the grammar, the AI never draws it */
function anySkull(ctx, cx, cy, s) {
  const t = R(0,1);
  if (t < .46) return maskHead(ctx, cx, cy, s);
  if (t < .76) return scribbleSkull(ctx, cx, cy, s);
  return maskHeadProfile(ctx, cx, cy, s);
}
function torsoFigure(ctx, cx, cy, s, accent) {
  const tw = s*.9, th = s*1.15, tx = cx-tw*.5, ty = cy-th*.5;
  line(ctx, [[tx,ty+th*.12],[tx+tw*.12,ty],[tx+tw*.88,ty],[tx+tw,ty+th*.12],[tx+tw,ty+th],[tx,ty+th],[tx,ty+th*.12]], 2.4*U, '#b5321f', {});
  scribbleBox(ctx, tx+tw*.16, ty+th*.16, tw*.68, th*.66, '#2f6fb0', { alpha:.92, jit:.1 });
  for (let i = 0; i < 4; i++) {
    const ox = tx+tw*(.3+R(0,.4)), oy = ty+th*(.25+R(0,.45)), col = pick(['#cf9a2b','#d9641f','#b5321f','#e8c23a']);
    const pts = []; for (let k = 0; k <= 8; k++) pts.push([ox+Math.cos(k)*s*.08+J(3), oy+Math.sin(k*1.3)*s*.1+J(3)]);
    line(ctx, pts, 2*U, col, {});
  }
  line(ctx, [[tx,ty+th*.2],[tx-s*.5,ty-th*.1]], 2.2*U, '#b5321f', {taper:'end'});
  line(ctx, [[tx+tw,ty+th*.2],[tx+tw+s*.5,ty+th*.05]], 2.2*U, accent, {taper:'end'});
  scribbleBox(ctx, cx-tw*.34, ty+th, tw*.2, th*.5, '#1a1510', { alpha:1, jit:.14 });
  scribbleBox(ctx, cx+tw*.14, ty+th, tw*.2, th*.5, '#1a1510', { alpha:1, jit:.14 });
}

/* ---- AI DIRECTOR support: it only ever sets the COLOUR SCHEME and the
   hand-coloured BACKGROUND FIELDS. It picks from named house colours (never
   raw hex), so the muted discipline holds; it never touches the mask, the
   geometry or the words. ---- */
const BQ_NAMED = { red:'#c4341e', yellow:'#e3b417', blue:'#205aa0', green:'#3f8f6b',
                   ochre:'#cf9a2b', teal:'#2f6f63', gold:'#d8b94a', oxblood:'#b5321f' };
function bqColor(name, fallback) { return BQ_NAMED[name] || fallback; }
function bqAccents(directives) {
  if (!directives || !directives.dominant) return ACCENT;
  const dom = bqColor(directives.dominant, ACCENT[0]);
  const sec = bqColor(directives.accent, ACCENT[2]);
  const restraint = directives.restraint != null ? Math.max(0, Math.min(1, directives.restraint)) : .6;
  let acc = [dom, dom, dom, sec, sec];        /* dominant carries the weight */
  if (restraint < .75) acc = acc.concat([ACCENT[1]]);
  if (restraint < .4)  acc = acc.concat(ACCENT);
  return acc;
}

function* basquiatPhase(seed, fmtKey, palKey, statusCb, prog, directives) {
  directives = directives || {};
  const fmt = FORMATS[fmtKey] || FORMATS.classic;
  const long = LONG_EDGE;
  const W = fmt.w >= fmt.h ? long : Math.round(long * fmt.w / fmt.h);
  const H = fmt.w >= fmt.h ? Math.round(long * fmt.h / fmt.w) : long;
  hi.width = W; hi.height = H;
  const ctx = hctx;
  const S = Math.min(W, H);
  U = (W + H) / 2000;
  const RNG = mulberry32((seed * 2654435761) >>> 0);
  rnd = RNG;
  prog.total = (prog.done || 0) + 24;
  const tick = (lab) => { statusCb(0, 0, { c: 'oilstick & crayon', basquiat: lab }); };
  const ACCENT = bqAccents(directives);          /* the director's colour scheme (or the house default) */

  /* ---- THE PAPER: off-white wove, no lines ---- */
  ctx.fillStyle = PAPERS[(R(0, PAPERS.length)) | 0]; ctx.fillRect(0, 0, W, H);
  const mk = CHARC;
  const recent = [];
  const pickWord = () => { let w, t=0; do { w = pick(WORDBANK); t++; } while (recent.includes(w) && t<6); recent.push(w); if (recent.length>4) recent.shift(); return w; };

  /* ---- hand-coloured regions behind the text. Drawn on a FORKED rng so the
         director can set them without disturbing the rest of the composition;
         when the director supplies regions, they replace the random ones. ---- */
  {
    const REGRNG = mulberry32((seed ^ 0x9e3779b9) >>> 0);
    setRnd(REGRNG);
    const REGION_COLS = ['#2f6fb0','#2f6fb0','#d9641f','#c4341e','#cf9a2b','#2f6f63','#e8c23a'];
    if (directives.regions && directives.regions.length) {
      for (const rg of directives.regions.slice(0,4)) {
        const col = bqColor(rg.color, pick(REGION_COLS));
        const x = clamp(+rg.x||0,0,1)*W, y = clamp(+rg.y||0,0,1)*H,
              w = clamp(+rg.w||.25,.06,.7)*W, h = clamp(+rg.h||.2,.06,.6)*H;
        if (rg.style === 'pencil') pencilShape(ctx, x + w/2, y + h/2, w/2, h/2, col);
        else colorScribble(ctx, x, y, w, h, col);
      }
    } else {
      for (let i = 0; i < 2 + (R(0,3)|0); i++) {
        const col = pick(REGION_COLS);
        if (R(0,1) < .5)
          colorScribble(ctx, R(.0,.7)*W, R(.0,.7)*H, R(.2,.45)*W, R(.14,.4)*H, col);
        else
          pencilShape(ctx, R(.12,.85)*W, R(.12,.85)*H, R(.09,.2)*W, R(.07,.18)*H, col);
      }
    }
    setRnd(RNG);                                /* resume the main stream, untouched */
  }
  prog.done++; tick('the ground'); yield;
  /* ---- one or two hand-painted black masses ---- */
  for (let i = 0; i < 1 + (R(0,2)|0); i++)
    blackBlock(ctx, R(.02,.7)*W, R(.18,.62)*H, R(.1,.2)*W, R(.2,.42)*H);

  /* ---- THE WALLPAPER: real text, packed wall to wall, organic and messy ---- */
  let yy = H*.008, __row = 0;
  while (yy < H*.992) {
    const hh = R(.0095,.016)*S;
    let xx = R(.002,.05)*W;
    while (xx < W*.985) {
      let txt; const rr = R(0,1);
      if (rr < .06) txt = pick(FOUND);                              /* a found word */
      else if (rr < .15) txt = pick(COMMENTARY);                    /* contemporary commentary */
      else if (rr < .60) txt = phrase(pickWord);
      else txt = pickWord() + (R(0,1)<.4 ? '\u00A9' : '');
      const o = {};
      if (R(0,1) < .45) o.angle = J(.16);                 /* a tilt */
      if (R(0,1) < .32) o.curve = R(.06,.22)*(R(0,1)<.5?1:-1);  /* a wavering baseline */
      if (R(0,1) < .08) o.enclose = R(0,1)<.5 ? 'box' : 'oval';   /* a hand-drawn shape */
      o.strike = R(0,1) < .13;
      const w0 = penWord(ctx, txt, xx, yy + hh, hh, R(0,1)<.13 ? pick(ACCENT) : mk, o);
      xx += (w0 - xx) + R(.008,.06)*W;
    }
    yy += hh*R(1.2,1.7);
    if ((++__row % 6) === 0) { prog.done++; tick('the hand fills the page'); yield; }
  }
  prog.done++; tick('the hand fills the page'); yield;
  /* ---- little diagrams woven through the gaps ---- */
  for (let i = 0; i < 16 + (R(0,12)|0); i++) {
    const x=R(.03,.96)*W, y=R(.03,.96)*H, s2=R(.016,.036)*S, p=R(0,1), col=pick([mk,mk,pick(ACCENT)]);
    if (p<.16) circledC(ctx, x, y, s2*.6, col);
    else if (p<.3) eggRow(ctx, x, y, col);
    else if (p<.4) stickRow(ctx, x, y, s2*1.1, mk);
    else if (p<.5) triLetter(ctx, x, y, s2*.8, pick(FRAGS), col);
    else if (p<.6) diamondX(ctx, x, y, s2*.8, col);
    else if (p<.7) regMark(ctx, x, y, s2*.55, col);
    else if (p<.78) heartIcon(ctx, x, y, s2, col);
    else if (p<.86) eyeIcon(ctx, x, y, s2, col);
    else if (p<.93) bolt(ctx, x, y, s2*1.3, pick([mk,ACCENT[0]]));
    else tally(ctx, x, y, 3+(R(0,4)|0), col);
  }

  prog.done++; tick('diagrams in the margins'); yield;
  /* ---- THE ANCHOR: any skull variant, usually on a torso ---- */
  const ax = R(.32,.5)*W, hs = R(.15,.2)*S;
  const hy = R(.32,.42)*H;
  const anchor = anySkull(ctx, ax, hy, hs);
  if (R(0,1) < .7) torsoFigure(ctx, ax + J(hs*.2), hy + hs*1.5, hs*1.15, pick([mk, ACCENT[2]]));
  /* the iconic FILLED crown over the head, on its block */
  crownFilled(ctx, ax + J(hs*.15), anchor.topY - hs*.12, hs*.72, hs*.6, ZONES[6], R(0,1) < .7);

  /* a few bold declarative labels near the anchor, some boxed/struck/angled */
  for (let i = 0; i < 2 + (R(0,2)|0); i++) {
    const side = R(0,1)<.5?-1:1;
    const r = R(0,1);
    const txt = r<.3 ? pick(COMMENTARY) : r<.65 ? phrase(pickWord) : pickWord();
    const o = { strike: R(0,1)<.35 };
    if (R(0,1) < .35) o.enclose = R(0,1)<.5 ? 'box' : 'oval';
    if (R(0,1) < .4) o.angle = J(.1);
    if (R(0,1) < .25) o.curve = R(.05,.14)*(R(0,1)<.5?1:-1);
    word(ctx, txt, Math.max(W*.02, ax + side*S*R(.26,.5) - (side<0?S*.42:0)),
         anchor.topY + S*R(.05,.7), R(.028,.042)*S, pick([mk, ACCENT[0]]), o);
  }

  /* ---- SECONDARY incident: HEADLESS anatomy only — one skull per piece ---- */
  for (let i = 0; i < 1 + (R(0,2)|0); i++) {
    const sx=R(.6,.9)*W, sy=R(.4,.78)*H, cs=R(.06,.1)*S, p=R(0,1);
    if (p < .4) ribcage(ctx, sx, sy, cs*1.4, cs*1.8, mk);
    else if (p < .72) { limb(ctx, sx, sy, sx+cs, sy+cs*1.4, mk); hand(ctx, sx+cs, sy+cs*1.4, cs*.5, mk); }
    else torsoFigure(ctx, sx, sy, cs*1.1, pick(ACCENT));   /* a torso window — no head */
    if (R(0,1) < .6) word(ctx, pickWord(), sx-cs, sy+cs*2, R(.024,.034)*S, mk, { strike:R(0,1)<.3, angle:J(.07) });
  }

  prog.done++; tick('the head, the crown'); yield;
  /* ---- MID-SCALE TEXT: word-stacks, number rows, boxed/struck words ---- */
  for (let i = 0; i < 1 + (R(0,2)|0); i++)
    wordStack(ctx, R(.55,.86)*W, R(.1,.5)*H, R(.026,.04)*S, pick([mk,mk,ACCENT[0]]), pickWord);
  for (let i = 0; i < 2 + (R(0,2)|0); i++) {
    let w = pickWord(); if (R(0,1)<.5) w += '\u00A9';
    word(ctx, w, R(.04,.7)*W, R(.12,.94)*H, R(.026,.042)*S, pick([mk,mk,ACCENT[0]]), { strike:R(0,1)<.4, box:R(0,1)<.14 });
  }
  for (let i = 0; i < 1 + (R(0,2)|0); i++) numberRow(ctx, R(.05,.8)*W, R(.08,.94)*H, R(.022,.036)*S, mk);

  /* ---- small outline crowns + symbols over the field ---- */
  for (let i = 0; i < 5 + (R(0,5)|0); i++) {
    const x=R(.04,.96)*W, y=R(.06,.95)*H, s2=R(.025,.05)*S, col=pick([mk,mk,pick(ACCENT)]);
    const p=R(0,1);
    if (p<.3) crown(ctx,x,y,s2,col);
    else if (p<.5) halo(ctx,x,y,s2,col);
    else if (p<.7) arrow(ctx,x,y,s2*1.8,R(0,6.28),col);
    else asterisk(ctx,x,y,s2*.7,col);
  }

  /* ---- a stacked inscription, sparingly — a classic aphorism or a
         contemporary statement, like the canvases ---- */
  if (R(0,1) < .6) {
    const lines = R(0,1) < .5 ? pick(SAYINGS) : pick(COMMENTARY_STACKS);
    inscription(ctx, lines, R(.04,.42)*W, R(.5,.85)*H,
       R(.026,.04)*S, pick([mk, mk, ACCENT[0]]), { strike: R(0,1)<.35, angle: J(.06), underline: R(0,1)<.45 });
  }
  if (USE_SAMO && R(0,1) < .4) word(ctx, 'SAMO\u00A9', R(.05,.6)*W, R(.08,.32)*H, R(.03,.045)*S, mk, { angle: J(.08) });

  /* ---- a few drips ---- */
  for (let i = 0; i < 1 + (R(0,2)|0); i++) drip(ctx, R(.08,.92)*W, R(.06,.5)*H, R(.05,.13)*H, pick([mk,pick(ACCENT)]));
  prog.done++; tick('the last marks');
  return { W, H, u: U, subjKey: 'canvas', paper: '#efe9d8',
           strokes: ['a Basquiat-school canvas in oilstick & crayon'] };
}

/* the wing entry: the dense paper, then the gallery's gentle paper finish */
function* basquiatGenerate(seed, fmtKey, palKey, statusCb, prog = {}, directives) {
  if (prog.total === undefined) { prog.total = 1; prog.done = 0; }
  const C = yield* basquiatPhase(seed, fmtKey, palKey, statusCb, prog, directives);
  yield* paperFinish(C, statusCb, prog);
  return C;
}

  return { basquiatGenerate };
})();
/* ===== BASQUIAT WING END ===== */

