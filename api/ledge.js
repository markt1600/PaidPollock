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
const KEY = "drip-atelier-ledge-v1";
const FORMATS = ["square", "classic", "pano", "portrait"];
const PALETTES = ["convergence", "number31", "lavender", "bluepoles", "onyx"];

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
  if (!FORMATS.includes(e.format) || !PALETTES.includes(e.palette)) return null;
  const out = {
    id, seed,
    format: e.format,
    palette: e.palette,
    dyn: Number.isFinite(dyn) ? Math.min(1, Math.max(0, dyn)) : 0.6,
    title, thumb
  };
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
