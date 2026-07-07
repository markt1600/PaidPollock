/* Tests for the AI director proxy: call-shape validation, origin check,
 * and the in-memory (no Redis configured) rate-limit path.
 * Run with: node --test tests/unit */
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.ANTHROPIC_API_KEY = "test-key";
delete process.env.KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_REST_URL;

let upstreamCalls = 0;
global.fetch = async (url, opts) => {
  assert.equal(url, "https://api.anthropic.com/v1/messages");
  upstreamCalls++;
  const req = JSON.parse(opts.body);
  return { status: 200, json: async () => ({ ok: true, model: req.model }) };
};

const handler = require("../../api/director.js");

function call(body, headers = {}, method = "POST") {
  return new Promise(resolve => {
    const res = {
      headers: {}, statusCode: 200,
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.statusCode = c; return this; },
      json(payload) { resolve({ status: this.statusCode, headers: this.headers, body: payload }); }
    };
    handler({ method, body, headers: { "x-forwarded-for": "5.5.5.5", ...headers } }, res);
  });
}

const good = () => ({
  messages: [{ role: "user", content: [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "abc" } },
    { type: "text", text: "judge this painting" }
  ] }]
});

test("forwards a well-formed snapshot+prompt call", async () => {
  const r = await call(good());
  assert.equal(r.status, 200);
  assert.equal(upstreamCalls, 1);
});

test("rejects non-POST, bad shapes, and cross-origin calls", async () => {
  assert.equal((await call(undefined, {}, "GET")).status, 405);
  assert.equal((await call({ messages: [] })).status, 400);
  assert.equal((await call({ messages: [{ role: "user", content: [{ type: "text", text: "x" }, { type: "text", text: "y" }] }] })).status, 400);
  const png = good();
  png.messages[0].content[0].source.media_type = "image/png";
  assert.equal((await call(png)).status, 400);
  const r = await call(good(), { origin: "https://evil.example", host: "atelier.vercel.app" });
  assert.equal(r.status, 403);
});

test("rate-limits per IP even without a Redis store", async () => {
  let last;
  for (let i = 0; i < 13; i++) last = await call(good());
  assert.equal(last.status, 429);
  assert.equal(last.headers["Retry-After"], "300");
});
