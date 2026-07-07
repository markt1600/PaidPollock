/* Sanitises a ledge entry posted by a visitor. Pure function, no I/O —
 * kept separate from the handler so it can be unit-tested directly.
 * Returns the cleaned entry, or null when the input is not acceptable. */
const FORMATS = ["square", "classic", "pano", "portrait"];
const PALETTES = ["convergence", "number31", "lavender", "bluepoles", "onyx"];
const SCARF_PALETTES = ["flamme", "marine", "emeraude", "noir", "poudre"];
const MOTIFS = ["chaine", "cavalcade", "jardin"];
const MIRO_PALETTES = ["reve", "constellation", "bleu", "nocturne", "terre"];
const SUBJECTS = ["visage", "fleurs"];
const KEITA_SCENES = ["jihanki", "denwa", "konbini"];

function sanitize(e) {
  if (!e || typeof e !== "object") return null;
  const id = String(e.id || "").slice(0, 64);
  const seed = Number(e.seed);
  const dyn = Number(e.dyn);
  let title = String(e.title || "Untitled").trim().slice(0, 48) || "Untitled";
  let thumb = typeof e.thumb === "string" && e.thumb.startsWith("data:image/") ? e.thumb : "";
  if (thumb.length > 150000) thumb = "";
  if (!id || !Number.isFinite(seed)) return null;
  const mode = e.mode === "scarf" ? "scarf" : e.mode === "miro" ? "miro"
             : e.mode === "matisse" ? "matisse"
             : e.mode === "keita" ? "keita"
             : e.mode === "basquiat" ? "basquiat" : "pollock";
  if (mode === "scarf") {
    if (!SCARF_PALETTES.includes(e.palette)) return null;
  } else if (mode === "miro") {
    if (!FORMATS.includes(e.format) || !MIRO_PALETTES.includes(e.palette)) return null;
  } else if (mode === "matisse") {
    if (!FORMATS.includes(e.format) || !SUBJECTS.includes(e.subject)) return null;
  } else if (mode === "keita") {
    if (!FORMATS.includes(e.format) || !KEITA_SCENES.includes(e.subject)) return null;
  } else if (mode === "basquiat") {
    if (!FORMATS.includes(e.format)) return null;
  } else {
    if (!FORMATS.includes(e.format) || !PALETTES.includes(e.palette)) return null;
  }
  const out = {
    id, seed, mode,
    format: mode === "scarf" ? "square" : e.format,
    dyn: Number.isFinite(dyn) ? Math.min(1, Math.max(0, dyn)) : 0.6,
    title, thumb
  };
  if (mode !== "matisse" && mode !== "keita" && mode !== "basquiat") out.palette = e.palette;
  if (mode === "scarf") {
    out.motif = MOTIFS.includes(e.motif) ? e.motif : "chaine";
    if (e.design && typeof e.design === "object") {
      const cl = (x, a, b) => Math.min(b, Math.max(a, Number(x) || 0));
      const dOut = {
        subject: String(e.design.subject || "").slice(0, 48),
        mirror: !!e.design.mirror
      };
      if (e.design.composition === "garden" || e.design.composition === "medallion")
        dOut.composition = e.design.composition;
      if (e.design.density !== undefined) dOut.density = cl(e.design.density, 0, 1);
      if (Array.isArray(e.design.accents)) {
        const acc = e.design.accents.slice(0, 4)
          .filter(x => x && typeof x === "object")
          .map(x => ({ x: cl(x.x, .05, .95), y: cl(x.y, .05, .95), r: cl(x.r, .05, .25) }));
        if (acc.length) dOut.accents = acc;
      }
      const readGroup = (arr, cap) => {
      const strokes = [];
      for (const st of (Array.isArray(arr) ? arr : []).slice(0, cap)) {
        if (!st || typeof st !== "object") continue;
        const c = Math.min(3, Math.max(0, st.c | 0));
        const w = cl(st.w, 1, 3);
        if (st.t === "line" && Array.isArray(st.pts)) {
          const pts = st.pts.slice(0, 32)
            .filter(p => Array.isArray(p) && p.length >= 2)
            .map(p => [cl(p[0], -1, 1), cl(p[1], -1, 1)]);
          if (pts.length > 1) strokes.push({ t: "line", c, w, pts });
        } else if (st.t === "arc") {
          strokes.push({ t: "arc", c, w, x: cl(st.x, -1, 1), y: cl(st.y, -1, 1),
            rx: cl(st.rx, .01, 1), ry: cl(st.ry, .01, 1),
            a0: cl(st.a0, -360, 360), a1: cl(st.a1, -360, 360), rot: cl(st.rot, -360, 360) });
        } else if (st.t === "satin") {
          strokes.push({ t: "satin", c, x: cl(st.x, -1, 1), y: cl(st.y, -1, 1),
            ang: cl(st.ang, -360, 360), len: cl(st.len, .02, .7), wid: cl(st.wid, .01, .4) });
        } else if (st.t === "knot") {
          strokes.push({ t: "knot", c, x: cl(st.x, -1, 1), y: cl(st.y, -1, 1), r: cl(st.r, .005, .08) });
        }
      }
      return strokes;
      };
      const strokes = readGroup(e.design.strokes, 140);
      const sat = readGroup(e.design.satellite, 36);
      if (strokes.length) dOut.strokes = strokes;
      if (sat.length) dOut.satellite = sat;
      if (dOut.strokes || dOut.composition || dOut.accents || dOut.satellite) out.design = dOut;
    }
  }
  if (mode === "keita") out.subject = e.subject;
  if (mode === "matisse") {
    out.subject = e.subject;
    if (e.design && typeof e.design === "object") {
      const cl = (x, a, b) => Math.min(b, Math.max(a, Number(x) || 0));
      const dOut = {
        subject: String(e.design.subject || "").slice(0, 48),
        mirror: !!e.design.mirror
      };
      const strokes = [];
      for (const st of (Array.isArray(e.design.strokes) ? e.design.strokes : []).slice(0, 48)) {
        if (!st || typeof st !== "object") continue;
        const w = cl(st.w, 1, 3);
        if (st.t === "line" && Array.isArray(st.pts)) {
          const pts = st.pts.slice(0, 32)
            .filter(p => Array.isArray(p) && p.length >= 2)
            .map(p => [cl(p[0], -1, 1), cl(p[1], -1, 1)]);
          if (pts.length > 1) strokes.push({ t: "line", c: 0, w, pts });
        } else if (st.t === "arc") {
          strokes.push({ t: "arc", c: 0, w, x: cl(st.x, -1, 1), y: cl(st.y, -1, 1),
            rx: cl(st.rx, .01, 1), ry: cl(st.ry, .01, 1),
            a0: cl(st.a0, -360, 360), a1: cl(st.a1, -360, 360), rot: cl(st.rot, -360, 360) });
        } else if (st.t === "satin") {
          strokes.push({ t: "satin", c: 0, x: cl(st.x, -1, 1), y: cl(st.y, -1, 1),
            ang: cl(st.ang, -360, 360), len: cl(st.len, .02, .5), wid: cl(st.wid, .01, .3) });
        } else if (st.t === "knot") {
          strokes.push({ t: "knot", c: 0, x: cl(st.x, -1, 1), y: cl(st.y, -1, 1), r: cl(st.r, .005, .06) });
        }
      }
      if (strokes.length) { dOut.strokes = strokes; out.design = dOut; }
    }
    if (Array.isArray(e.touches)) {
      const cl = (x, a, b) => Math.min(b, Math.max(a, Number(x) || 0));
      const seen = {}, touches = [];
      for (const t of e.touches.slice(0, 16)) {
        if (!t || typeof t !== "object") continue;
        const i = t.i | 0;
        if (i < 0 || i > 63 || seen[i]) continue;
        seen[i] = 1;
        const o = { i };
        if (t.press !== undefined) o.press = cl(t.press, .6, 1.5);
        if (t.dip !== undefined) o.dip = cl(t.dip, .5, 1.6);
        if (t.drain !== undefined) o.drain = cl(t.drain, .3, 2.4);
        if (o.press !== undefined || o.dip !== undefined || o.drain !== undefined) touches.push(o);
      }
      if (touches.length) out.touches = touches;
    }
  }
  if (typeof e.story === "string" && e.story.trim()) {
    out.story = e.story.trim().slice(0, 600);
  }
  if (mode === "basquiat") {
    if (Array.isArray(e.directives) && e.directives[0] && typeof e.directives[0] === "object") {
      const BN = ["red","yellow","blue","green","ochre","teal","gold","oxblood"];
      const nm = (c, d) => BN.includes(c) ? c : d;
      const d = e.directives[0];
      const cl = (x, a, b, dv) => Math.min(b, Math.max(a, Number(x) || dv));
      const regions = Array.isArray(d.regions) ? d.regions.slice(0, 4).map(r => ({
        x: cl(r && r.x, 0, .95, 0), y: cl(r && r.y, 0, .95, 0),
        w: cl(r && r.w, .08, .6, .25), h: cl(r && r.h, .08, .5, .2),
        color: nm(r && r.color, "blue"), style: (r && r.style) === "pencil" ? "pencil" : "scribble"
      })) : [];
      out.directives = [{
        concept: String(d.concept || "").slice(0, 90),
        dominant: nm(d.dominant, "red"), accent: nm(d.accent, "blue"),
        restraint: cl(d.restraint, 0, 1, .6), regions
      }];
    }
  } else if (Array.isArray(e.directives)) {
    const TYPES = mode === "miro"
      ? ["star", "disc", "blob", "moon", "line", "dots"]
      : ["pour", "wash", "web", "splash"];
    const COLORS = ["red", "blue", "yellow", "green", "black", "white"];
    const dirs = e.directives.slice(0, 3).map(round =>
      Array.isArray(round)
        ? round.slice(0, 6).map(a => {
            const act = {
              type: TYPES.includes(a && a.type) ? a.type : TYPES[0],
              layer: Math.min(31, Math.max(0, (a && a.layer) | 0)),
              x: Math.min(1, Math.max(0, Number(a && a.x) || 0.5)),
              y: Math.min(1, Math.max(0, Number(a && a.y) || 0.5)),
              r: Math.min(0.6, Math.max(0.015, Number(a && a.r) || 0.2))
            };
            if (mode === "miro")
              act.color = COLORS.includes(a && a.color) ? a.color : "black";
            return act;
          })
        : []
    ).filter(r => r.length);
    if (dirs.length) out.directives = dirs;
  }
  return out;
}

module.exports = { sanitize };
