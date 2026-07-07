/* Shared helpers for the atelier's serverless functions.
 *
 * Lives in an underscore-prefixed directory so Vercel does not expose it
 * as an endpoint. No npm dependencies — talks to any Upstash-compatible
 * Redis REST store with plain fetch.
 */

function env(name, alt) {
  return process.env[name] || process.env[alt] || "";
}

function kvConfigured() {
  return !!(
    env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL") &&
    env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN")
  );
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

/* The first hop in x-forwarded-for is the client (Vercel sets it). */
function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "");
  const first = fwd.split(",")[0].trim();
  return first || String(req.headers["x-real-ip"] || "") || "unknown";
}

/* INCR + first-hit EXPIRE in one round trip, so the window is atomic. */
const RL_SCRIPT =
  "local n = redis.call('INCR', KEYS[1]) " +
  "if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end " +
  "return n";

/* Best-effort fallback when no Redis store is connected: a fixed window
 * per warm function instance. Not shared across instances, but it still
 * blunts a single client hammering one warm lambda. */
const memHits = new Map();
function memCount(key, windowSec, nowMs) {
  const hit = memHits.get(key);
  if (hit && hit.reset > nowMs) return ++hit.n;
  if (memHits.size > 5000) memHits.clear();
  memHits.set(key, { n: 1, reset: nowMs + windowSec * 1000 });
  return 1;
}

/* Fixed-window per-IP rate limit. Returns true when the request may
 * proceed; otherwise answers 429 (with Retry-After) and returns false.
 * Redis-backed when a store is connected, in-memory best effort when
 * not, and fails open if Redis itself errors. */
async function rateLimit(req, res, bucket, limit, windowSec) {
  const key = "atelier-rl:" + bucket + ":" + clientIp(req);
  let n;
  if (kvConfigured()) {
    try {
      n = Number(await kv(["EVAL", RL_SCRIPT, "1", key, String(windowSec)]));
    } catch (err) {
      n = 1; /* store unreachable — let the request through */
    }
  } else {
    n = memCount(key, windowSec, Date.now());
  }
  if (n > limit) {
    res.setHeader("Retry-After", String(windowSec));
    res.status(429).json({ error: "too many requests" });
    return false;
  }
  return true;
}

module.exports = { env, kv, kvConfigured, clientIp, rateLimit };
