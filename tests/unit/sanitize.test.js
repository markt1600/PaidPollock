/* Unit tests for the ledge's entry sanitiser — the pure function guarding
 * the communal ledge's public write path. Run with: node --test tests/unit */
const test = require("node:test");
const assert = require("node:assert/strict");
const { sanitize } = require("../../api/_lib/sanitize.js");

const pollock = (over = {}) => ({
  id: "abc123", seed: 42, mode: "pollock",
  format: "classic", palette: "convergence", title: "Test", ...over
});

test("accepts a well-formed pollock entry", () => {
  const e = sanitize(pollock());
  assert.deepEqual(e, {
    id: "abc123", seed: 42, mode: "pollock", format: "classic",
    dyn: 0.6, title: "Test", thumb: "", palette: "convergence"
  });
});

test("rejects junk wholesale", () => {
  assert.equal(sanitize(null), null);
  assert.equal(sanitize("string"), null);
  assert.equal(sanitize({}), null);
  assert.equal(sanitize(pollock({ seed: "not-a-number" })), null);
  assert.equal(sanitize(pollock({ id: "" })), null);
});

test("rejects unknown formats and palettes", () => {
  assert.equal(sanitize(pollock({ format: "a0" })), null);
  assert.equal(sanitize(pollock({ palette: "neon" })), null);
});

test("unknown mode falls back to pollock and validates as such", () => {
  const e = sanitize(pollock({ mode: "banksy" }));
  assert.equal(e.mode, "pollock");
});

test("clamps title length and defaults empty titles", () => {
  assert.equal(sanitize(pollock({ title: "x".repeat(99) })).title.length, 48);
  assert.equal(sanitize(pollock({ title: "   " })).title, "Untitled");
});

test("drops non-image and oversized thumbnails", () => {
  assert.equal(sanitize(pollock({ thumb: "javascript:alert(1)" })).thumb, "");
  assert.equal(sanitize(pollock({ thumb: "data:text/html,<x>" })).thumb, "");
  assert.equal(
    sanitize(pollock({ thumb: "data:image/png;base64," + "A".repeat(200000) })).thumb, "");
  const ok = "data:image/png;base64,iVBORw0KGgo=";
  assert.equal(sanitize(pollock({ thumb: ok })).thumb, ok);
});

test("clamps dyn into [0,1] and defaults it", () => {
  assert.equal(sanitize(pollock({ dyn: 7 })).dyn, 1);
  assert.equal(sanitize(pollock({ dyn: -3 })).dyn, 0);
  assert.equal(sanitize(pollock({})).dyn, 0.6);
});

test("miro entries need a miro palette and keep named colours", () => {
  assert.equal(sanitize(pollock({ mode: "miro" })), null); // convergence isn't a miro palette
  const e = sanitize(pollock({
    mode: "miro", palette: "reve",
    directives: [[{ type: "star", layer: 99, x: 2, y: -1, r: 9, color: "mauve" }]]
  }));
  assert.equal(e.palette, "reve");
  assert.deepEqual(e.directives, [[{ type: "star", layer: 31, x: 1, y: 0, r: 0.6, color: "black" }]]);
});

test("matisse entries validate subject and clamp ink-master touches", () => {
  assert.equal(sanitize(pollock({ mode: "matisse", subject: "chats" })), null);
  const e = sanitize(pollock({
    mode: "matisse", subject: "visage",
    touches: [{ i: 3, press: 99 }, { i: 3, press: 1 }, { i: -1, press: 1 }, { bogus: true }]
  }));
  assert.equal(e.subject, "visage");
  assert.deepEqual(e.touches, [{ i: 3, press: 1.5 }]); // clamped, deduped by index
  assert.equal(e.palette, undefined);
});

test("basquiat entries clamp directive regions and colour names", () => {
  const e = sanitize(pollock({
    mode: "basquiat",
    directives: [{
      concept: "c".repeat(200), dominant: "crimson", accent: "teal", restraint: 4,
      regions: [{ x: 5, y: -1, w: 9, h: 0, color: "purple", style: "spray" }]
    }]
  }));
  assert.equal(e.directives[0].concept.length, 90);
  assert.equal(e.directives[0].dominant, "red");   // unknown -> default
  assert.equal(e.directives[0].accent, "teal");
  assert.equal(e.directives[0].restraint, 1);
  assert.deepEqual(e.directives[0].regions, [
    // h:0 is falsy, so the 0.2 default kicks in before clamping
    { x: 0.95, y: 0, w: 0.6, h: 0.2, color: "blue", style: "scribble" }
  ]);
});

test("pollock directives clamp rounds and actions", () => {
  const round = Array.from({ length: 20 }, () => ({ type: "pour", layer: 1, x: .5, y: .5, r: .2 }));
  const e = sanitize(pollock({ directives: [round, round, round, round] }));
  assert.equal(e.directives.length, 3);   // max three director rounds
  assert.equal(e.directives[0].length, 6); // max six touch-ups per round
});

test("story is trimmed and capped at 600 chars", () => {
  assert.equal(sanitize(pollock({ story: "  hi  " })).story, "hi");
  assert.equal(sanitize(pollock({ story: "s".repeat(700) })).story.length, 600);
  assert.equal(sanitize(pollock({ story: "   " })).story, undefined);
});
