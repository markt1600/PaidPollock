/* The communal ledge — a tiny Vercel serverless function.
 *
 * Backed by any Upstash-compatible Redis REST store (Vercel Marketplace:
 * "Upstash for Redis", formerly Vercel KV). Connect one to the project and
 * the env vars below appear automatically. No npm dependencies.
 *
 *   GET  /api/ledge            -> [entry, ...]  (newest first, max 5)
 *   POST /api/ledge {entry}    -> merged list   (atomic server-side merge)
 *   POST /api/ledge {id,title} -> list with that piece renamed
 *
 * Writes run as Lua scripts (EVAL) so the read-merge-write is atomic —
 * two visitors finishing pours in the same instant can no longer clobber
 * each other's entry. Every caller is rate-limited per IP.
 *
 * Without a configured store the endpoint answers 503 and the front end
 * falls back gracefully to localStorage.
 */
const { kv, kvConfigured, rateLimit } = require("./_lib/shared.js");
const { sanitize } = require("./_lib/sanitize.js");

const KEY = "drip-atelier-ledge-v2";
const MAX_ENTRIES = 5;

/* Prepend the new entry, drop any older entry with the same id, trim to
 * MAX_ENTRIES — all inside Redis, atomically. */
const SAVE_SCRIPT = `
local list = {}
local raw = redis.call('GET', KEYS[1])
if raw then
  local ok, v = pcall(cjson.decode, raw)
  if ok and type(v) == 'table' then list = v end
end
local entry = cjson.decode(ARGV[1])
local out = { entry }
for i = 1, #list do
  local e = list[i]
  if type(e) == 'table' and e.id ~= entry.id and #out < tonumber(ARGV[2]) then
    out[#out + 1] = e
  end
end
local enc = cjson.encode(out)
redis.call('SET', KEYS[1], enc)
return enc
`;

/* Retitle one entry in place, atomically; write back only if it changed. */
const RENAME_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return '[]' end
local ok, list = pcall(cjson.decode, raw)
if not ok or type(list) ~= 'table' then return '[]' end
local changed = false
for i = 1, #list do
  local e = list[i]
  if type(e) == 'table' and e.id == ARGV[1] then
    e.title = ARGV[2]
    changed = true
  end
end
if changed then
  redis.call('SET', KEYS[1], cjson.encode(list))
end
return cjson.encode(list)
`;

/* cjson encodes an empty Lua table as {}, so always guard the parse. */
function asList(raw) {
  let list = [];
  try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
  return Array.isArray(list) ? list.slice(0, MAX_ENTRIES) : [];
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (!kvConfigured()) {
      return res.status(503).json({ error: "ledge storage not configured" });
    }

    if (req.method === "GET") {
      /* the front end polls every 30 s; 60/min leaves lots of headroom */
      if (!(await rateLimit(req, res, "ledge-get", 60, 60))) return;
      const raw = await kv(["GET", KEY]);
      return res.status(200).json(asList(raw));
    }

    if (req.method === "POST") {
      if (!(await rateLimit(req, res, "ledge-post", 10, 60))) return;
      const body = req.body && typeof req.body === "object" ? req.body : {};

      if (body.entry) {
        const e = sanitize(body.entry);
        if (!e) return res.status(400).json({ error: "bad entry" });
        const raw = await kv([
          "EVAL", SAVE_SCRIPT, "1", KEY,
          JSON.stringify(e), String(MAX_ENTRIES)
        ]);
        return res.status(200).json(asList(raw));
      }

      if (body.id && typeof body.title === "string") {
        const id = String(body.id).slice(0, 64);
        const t = body.title.trim().slice(0, 48);
        if (!t) {
          const raw = await kv(["GET", KEY]);
          return res.status(200).json(asList(raw));
        }
        const raw = await kv(["EVAL", RENAME_SCRIPT, "1", KEY, id, t]);
        return res.status(200).json(asList(raw));
      }

      return res.status(400).json({ error: "bad request" });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "ledge error" });
  }
};
