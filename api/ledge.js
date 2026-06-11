/* The communal ledge — a tiny Vercel serverless function.
 *
 * Backed by any Upstash-compatible Redis REST store (Vercel Marketplace:
 * "Upstash for Redis", formerly Vercel KV). Connect one to the project and
 * the env vars below appear automatically. No npm dependencies.
 *
 *   GET  /api/ledge            -> [entry, ...]  (newest first, max 5)
 *   POST /api/ledge {entry}    -> merged list   (server-side merge)
 *   POST /api/ledge {id,title} -> list with that piece renamed
 *
 * Without a configured store the endpoint answers 503 and the front end
 * falls back gracefully to localStorage.
 */
const KEY = "drip-atelier-ledge-v2";
const FORMATS = ["square", "classic", "pano", "portrait"];
const PALETTES = ["convergence", "number31", "lavender", "bluepoles", "onyx"];
const SCARF_PALETTES = ["flamme", "marine", "emeraude", "noir", "poudre"];
const MOTIFS = ["chaine", "cavalcade", "jardin"];

function env(name, alt) {
  return process.env[name] || process.env[alt] || "";
}
async function kv(cmd) {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
  const tok = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error("kv " + r.status);
  return (await r.json()).result;
}

function sanitize(e) {
  if (!e || typeof e !== "object") return null;
  const id = String(e.id || "").slice(0, 64);
  const seed = Number(e.seed);
  const dyn = Number(e.dyn);
  let title = String(e.title || "Untitled").trim().slice(0, 48) || "Untitled";
  let thumb = typeof e.thumb === "string" && e.thumb.startsWith("data:image/") ? e.thumb : "";
  if (thumb.length > 150000) thumb = "";
  if (!id || !Number.isFinite(seed)) return null;
  const mode = e.mode === "scarf" ? "scarf" : "pollock";
  if (mode === "scarf") {
    if (!SCARF_PALETTES.includes(e.palette)) return null;
  } else {
    if (!FORMATS.includes(e.format) || !PALETTES.includes(e.palette)) return null;
  }
  const out = {
    id, seed, mode,
    format: mode === "scarf" ? "square" : e.format,
    palette: e.palette,
    dyn: Number.isFinite(dyn) ? Math.min(1, Math.max(0, dyn)) : 0.6,
    title, thumb
  };
  if (mode === "scarf") {
    out.motif = MOTIFS.includes(e.motif) ? e.motif : "chaine";
    if (e.design && Array.isArray(e.design.strokes)) {
      const cl = (x, a, b) => Math.min(b, Math.max(a, Number(x) || 0));
      const strokes = [];
      for (const st of e.design.strokes.slice(0, 80)) {
        if (!st || typeof st !== "object") continue;
        const c = Math.min(3, Math.max(0, st.c | 0));
        const w = cl(st.w, 1, 3);
        if (st.t === "line" && Array.isArray(st.pts)) {
          const pts = st.pts.slice(0, 24)
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
      if (strokes.length) {
        out.design = {
          subject: String(e.design.subject || "").slice(0, 48),
          mirror: !!e.design.mirror,
          strokes
        };
      }
    }
  }
  if (typeof e.story === "string" && e.story.trim()) {
    out.story = e.story.trim().slice(0, 600);
  }
  if (Array.isArray(e.directives)) {
    const TYPES = ["pour", "wash", "web", "splash"];
    const dirs = e.directives.slice(0, 3).map(round =>
      Array.isArray(round)
        ? round.slice(0, 6).map(a => ({
            type: TYPES.includes(a && a.type) ? a.type : "pour",
            layer: Math.min(31, Math.max(0, (a && a.layer) | 0)),
            x: Math.min(1, Math.max(0, Number(a && a.x) || 0.5)),
            y: Math.min(1, Math.max(0, Number(a && a.y) || 0.5)),
            r: Math.min(0.6, Math.max(0.05, Number(a && a.r) || 0.2))
          }))
        : []
    ).filter(r => r.length);
    if (dirs.length) out.directives = dirs;
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const configured =
      env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL") &&
      env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
    if (!configured) {
      return res.status(503).json({ error: "ledge storage not configured" });
    }

    if (req.method === "GET") {
      const raw = await kv(["GET", KEY]);
      let list = [];
      try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
      return res.status(200).json(Array.isArray(list) ? list.slice(0, 5) : []);
    }

    if (req.method === "POST") {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const raw = await kv(["GET", KEY]);
      let list = [];
      try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];

      if (body.entry) {
        const e = sanitize(body.entry);
        if (!e) return res.status(400).json({ error: "bad entry" });
        list = [e, ...list.filter(x => x && x.id !== e.id)].slice(0, 5);
      } else if (body.id && typeof body.title === "string") {
        const id = String(body.id).slice(0, 64);
        const t = body.title.trim().slice(0, 48);
        const hit = list.find(x => x && x.id === id);
        if (hit && t) hit.title = t;
      } else {
        return res.status(400).json({ error: "bad request" });
      }

      await kv(["SET", KEY, JSON.stringify(list)]);
      return res.status(200).json(list);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "ledge error" });
  }
};
