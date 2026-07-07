/* Tests for the ledge handler against a mock Upstash REST store.
 *
 * The mock implements GET/SET plus the two EVAL scripts the handler uses,
 * mirroring their Lua semantics in JS, so these tests exercise the
 * handler's atomic-write wiring: merge/dedupe/trim on save, in-place
 * rename, rate limiting, and the unconfigured-store fallback.
 * Run with: node --test tests/unit
 */
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.KV_REST_API_URL = "https://mock-kv.test";
process.env.KV_REST_API_TOKEN = "token";

/* ---- mock Upstash REST store ---------------------------------------- */
const store = new Map();
function evalScript(script, keys, argv) {
  if (script.includes("INCR")) {
    const k = keys[0];
    const n = (store.get(k) || 0) + 1;
    store.set(k, n);
    return n;
  }
  if (script.includes("local entry = cjson.decode")) { // SAVE_SCRIPT
    let list = [];
    try { const v = JSON.parse(store.get(keys[0]) ?? "null"); if (Array.isArray(v)) list = v; } catch {}
    const entry = JSON.parse(argv[0]);
    const max = Number(argv[1]);
    const out = [entry];
    for (const e of list) {
      if (e && typeof e === "object" && e.id !== entry.id && out.length < max) out.push(e);
    }
    store.set(keys[0], JSON.stringify(out));
    return JSON.stringify(out);
  }
  // RENAME_SCRIPT
  const raw = store.get(keys[0]);
  if (raw === undefined) return "[]";
  let list;
  try { list = JSON.parse(raw); } catch { return "[]"; }
  if (!Array.isArray(list)) return "[]";
  let changed = false;
  for (const e of list) {
    if (e && typeof e === "object" && e.id === argv[0]) { e.title = argv[1]; changed = true; }
  }
  if (changed) store.set(keys[0], JSON.stringify(list));
  return JSON.stringify(list);
}
global.fetch = async (url, opts) => {
  assert.equal(url, "https://mock-kv.test");
  const cmd = JSON.parse(opts.body);
  const [op, ...rest] = cmd;
  let result = null;
  if (op === "GET") result = store.get(rest[0]) ?? null;
  else if (op === "SET") { store.set(rest[0], rest[1]); result = "OK"; }
  else if (op === "EVAL") {
    const [script, nkeys, ...ka] = rest;
    const n = Number(nkeys);
    result = evalScript(script, ka.slice(0, n), ka.slice(n));
  }
  return { ok: true, json: async () => ({ result }) };
};
/* ---------------------------------------------------------------------- */

const handler = require("../../api/ledge.js");

function call(method, body, ip = "1.2.3.4") {
  return new Promise(resolve => {
    const res = {
      headers: {}, statusCode: 200,
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.statusCode = c; return this; },
      json(payload) { resolve({ status: this.statusCode, headers: this.headers, body: payload }); }
    };
    handler({ method, body, headers: { "x-forwarded-for": ip } }, res);
  });
}

const entry = (id, over = {}) => ({
  id, seed: 1, mode: "pollock", format: "classic",
  palette: "convergence", title: "Piece " + id, ...over
});

test("GET on an empty store returns []", async () => {
  store.clear();
  const r = await call("GET", undefined);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, []);
});

test("save prepends, dedupes by id, and trims to five", async () => {
  store.clear();
  for (const id of ["a", "b", "c", "d", "e", "f"]) {
    const r = await call("POST", { entry: entry(id) }, "10.0.0." + id.charCodeAt(0));
    assert.equal(r.status, 200);
  }
  let list = (await call("GET", undefined, "9.9.9.1")).body;
  assert.deepEqual(list.map(e => e.id), ["f", "e", "d", "c", "b"]); // trimmed, newest first

  // re-saving "d" moves it to the front without duplicating it
  await call("POST", { entry: entry("d") }, "10.0.0.99");
  list = (await call("GET", undefined, "9.9.9.2")).body;
  assert.deepEqual(list.map(e => e.id), ["d", "f", "e", "c", "b"]);
});

test("rejects an unsanitisable entry with 400", async () => {
  store.clear();
  const r = await call("POST", { entry: { id: "x", seed: "NaN" } });
  assert.equal(r.status, 400);
});

test("rename changes one title in place", async () => {
  store.clear();
  await call("POST", { entry: entry("a") }, "10.1.0.1");
  await call("POST", { entry: entry("b") }, "10.1.0.2");
  const r = await call("POST", { id: "a", title: "  Renamed  " }, "10.1.0.3");
  assert.equal(r.status, 200);
  const a = r.body.find(e => e.id === "a");
  assert.equal(a.title, "Renamed");
  assert.equal(r.body.find(e => e.id === "b").title, "Piece b");
});

test("POSTs beyond the per-IP window answer 429 with Retry-After", async () => {
  store.clear();
  const ip = "10.2.0.1";
  let last;
  for (let i = 0; i < 11; i++) last = await call("POST", { entry: entry("e" + i) }, ip);
  assert.equal(last.status, 429);
  assert.equal(last.headers["Retry-After"], "60");
  // a different IP is unaffected
  const other = await call("POST", { entry: entry("z") }, "10.2.0.2");
  assert.equal(other.status, 200);
});

test("answers 503 when no store is configured", async () => {
  const url = process.env.KV_REST_API_URL;
  process.env.KV_REST_API_URL = "";
  try {
    const r = await call("GET", undefined);
    assert.equal(r.status, 503);
  } finally {
    process.env.KV_REST_API_URL = url;
  }
});
