#!/usr/bin/env node
/* Rebuilds the single-file version of the atelier for hosts that want one
 * HTML document — e.g. running as a claude.ai artifact (where window.storage
 * provides the communal ledge).
 *
 *   node scripts/build-artifact.mjs        -> dist/artifact.html
 *
 * It inlines css/atelier.css as a <style> block and the whole js/ load
 * order as one <script> block, exactly where index.html references them.
 * No dependencies, no minification — the output is the same code, one file.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

let html = read("index.html");

/* inline the stylesheet */
html = html.replace(
  /<link rel="stylesheet" href="css\/atelier\.css">/,
  () => "<style>\n" + read("css/atelier.css") + "</style>"
);

/* inline every js file, in order, as one script block */
const srcs = [...html.matchAll(/<script src="(js\/[\w-]+\.js)"><\/script>\n?/g)];
if (!srcs.length) throw new Error("no <script src> tags found in index.html");
const bundle = "<script>\n" + srcs.map((m) => read(m[1])).join("") + "</script>\n";
html = html.replace(srcs[0][0], () => bundle);
for (const m of srcs.slice(1)) html = html.replace(m[0], "");

if (/<link rel="stylesheet"|<script src=/.test(html)) {
  throw new Error("unresolved external reference left in output");
}

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/artifact.html"), html);
console.log(
  "dist/artifact.html — " + (html.length / 1024).toFixed(0) + " KB, " +
  srcs.length + " scripts + 1 stylesheet inlined"
);
