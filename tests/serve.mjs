/* Tiny static file server for local preview and the golden-image tests.
 * No dependencies. Serves the repo root; /api/* answers 404 so the front
 * end falls back to its localStorage ledge, exactly like any plain host. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json"
};

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const rel = normalize(path).replace(/^([/\\])+/, "");
    if (rel.split(/[/\\]/).includes("..")) { res.writeHead(400); return res.end(); }
    const file = join(root, rel === "" ? "index.html" : rel);
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(port, () => console.log(`atelier at http://localhost:${port}`));
