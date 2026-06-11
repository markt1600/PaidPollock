/* AI proxy for non-artifact hosts — makes the AI art director and the
 * curator's label work on Vercel.
 *
 * Setup: add ANTHROPIC_API_KEY to the project's environment variables and
 * redeploy. Without it the endpoint answers 503 and the front end simply
 * runs without AI.
 *
 * The endpoint is public, so it refuses anything that doesn't match the
 * atelier's exact call shape — one JPEG snapshot plus one short text
 * prompt, capped tokens, a server-pinned model — and checks the Origin.
 * It cannot be repurposed as a general Claude proxy.
 */
const MODEL = "claude-sonnet-4-20250514";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const key = process.env.ANTHROPIC_API_KEY || "";
    if (!key) return res.status(503).json({ error: "AI not configured" });

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "method not allowed" });
    }

    /* same-origin deterrent (browsers send Origin; absent for server calls) */
    const origin = req.headers.origin || "";
    const host = req.headers.host || "";
    if (origin && host && !origin.endsWith("//" + host)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const msgs = body.messages;
    if (!Array.isArray(msgs) || msgs.length !== 1 || msgs[0].role !== "user") {
      return res.status(400).json({ error: "bad request" });
    }
    const content = msgs[0].content;
    if (!Array.isArray(content) || content.length < 1 || content.length > 2) {
      return res.status(400).json({ error: "bad request" });
    }

    let img = null, txt = null;
    for (const b of content) {
      if (b && b.type === "image" && !img &&
          b.source && b.source.type === "base64" &&
          b.source.media_type === "image/jpeg" &&
          typeof b.source.data === "string" &&
          b.source.data.length <= 1600000) {
        img = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b.source.data } };
      } else if (b && b.type === "text" && !txt &&
                 typeof b.text === "string" && b.text.length <= 4000) {
        txt = { type: "text", text: b.text };
      } else {
        return res.status(400).json({ error: "bad request" });
      }
    }
    if (!txt) return res.status(400).json({ error: "bad request" });

    const maxTokens = Math.min(800, Math.max(1, (body.max_tokens | 0) || 300));
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: img ? [img, txt] : [txt] }]
      })
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "director error" });
  }
};
