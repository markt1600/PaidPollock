# The Atelier

A generative drip-painting studio in the manner of Jackson Pollock. Pure static
HTML/JS — no build step, no dependencies, ready for Vercel.

## Features
- **Physically simulated pours** — the engine models the artist's hand moving
  above the canvas with a viscous paint string dangling from the stick on a
  damped spring (paint can't turn corners: every wrist jerk becomes a curve or
  whip-loop). Paint parcels leave the string, fly ballistically under real
  gravity scaled to the canvas's physical size, and land carried ahead of the
  hand. Line weight follows mass conservation (w ∝ √(Q/v)); above each paint's
  breakup speed the filament tears Rayleigh-style into scattered droplet
  trails with impact-stretched drops; energetic impacts throw forward crown
  splatter; hovering pools paint into anchored discs with beaded rims and
  settled grit; fresh lines crossing still-wet paint drag and marble both
  colours. Plus colour drifting along each skein and cast shadows.
- **Impasto relief & varnish** — every mark also raises a half-resolution
  height field whose base is the canvas weave itself. When the pour is done,
  a varnish-and-lighting pass relaxes the field (wet paint smooths), then
  lights it with a real shading model: surface normals with Lambertian
  diffuse, tight Blinn-Phong glints on the wet enamel, cast shadows (every
  rope shadows the canvas on its down-light side via an occlusion march
  toward the light), and contact ambient occlusion at rope bases and in
  crevices. Bare canvas stays matte cloth, thin passages let the weave show
  through, heavy ropes bury it. The key light's angle varies per painting
  (aluminium shimmer follows it). The finished picture is then photographed
  in the gallery: a museum track light rakes from the key corner, a soft
  spot blooms there, and the corners fall quiet — depth from shadow, never
  a white veil.
- **Material texture** — enamel on raw canvas wicks oil outward, so every
  rope, droplet and pool blooms a faint warm stain halo into the cloth.
  The finishing pass settles studio debris (dust, fibres, the odd nib) into
  the paint, lays per-pixel pigment-and-sensor grain over everything, and
  adds two octaves of cloudy mottle — the soft unevenness of ageing, gloss
  and light. The ground itself carries weave, slubs, tonal blotches, and
  soiled, handled edges.
- **Washes & webs** — beyond lines, the engine throws two more mark
  families from the late drip paintings: broad thin *washes* (irregular
  soaked stains with mottled bodies, feathered bleeding edges, pigment
  gathering at the drying rim, often chaining into larger complexes — and
  thin enough that the weave reads through them). Nearly half of the
  heavier washes go down as *impasto*: buttery thick bodies that raise the
  height field across their whole area, with knife-drag striations carved
  along one direction into both the colour and the relief — grooves for
  the raking light to catch, crest glints where the gloss peaks, and
  longer cast shadows thrown by the taller paint and *webs* (bursts of
  long fine threads sweeping arcs around a region, the dense hairline
  netting of works like Convergence). Lines crossing wet washes drag and
  marble. Palettes interleave masses, webbing and threadwork in the layer
  orders of the originals — and the session itself is interleaved in time:
  every action is stamped with a moment in the session (its colour's phase
  plus a wide spread, with occasional returns to an earlier can) and the
  whole plan is sorted by that clock, so no colour ever arrives as a single
  stratum. Black runs under one red mass and over the next, the way the
  painter actually circled the canvas.
- **Aluminium paint** — Lavender Veil and Blue Poles carry a metallic
  aluminium layer (as the originals did) whose flake catches the key light:
  strokes angled toward it flare bright, strokes across it fall to darker
  grey.
- **Live painting, paced** — a fresh painting unfolds over ~3 seconds so you
  can watch it develop layer by layer; regenerate at any moment with
  **Pour a new painting** (mid-generation regeneration cancels cleanly).
  Rehanging from the ledge is near-instant. Respects prefers-reduced-motion.
- **High resolution** — renders at 4,400 px on the long edge offscreen;
  the on-screen view is a scaled preview of the same pixels.
- **Formats** — Square, Classic 3:2, Panorama, Portrait.
- **Palettes** — five, each named for and tuned to one of the famous drip
  paintings: Convergence (the default), One: No. 31, Lavender Mist,
  Blue Poles, and Number 32 (black enamel on cream).
- **Presentation** — naked canvas, gallery black/white, natural oak, or museum
  gold, each with a linen liner. The chosen frame is composited into the
  download at full resolution with mitred corners, an inner shadow, and real
  material texture clipped inside each side: long wavy grain and the
  occasional knot in the oak, gold leaf laid in squares with seams, patina
  and red bole wearing through at the corners, brushed satin black, warm
  gesso white — all under a carved profile with a burnished outer ridge and
  shadowed inner step. Every frame carries its own seeded wear: scuffs and
  fine scratches, nicks bitten out of the outer edge, softly worn corners,
  and per-style flaws (flaked gold leaf baring the red bole, yellowed
  gesso, satin rubbed bright where it's gripped, pale chips at the oak
  mitres). The on-screen frame is painted by the same code with the same
  per-piece seed as the download — what you see is exactly what you save.
- **Download** — one-click PNG export, named after the piece.
- **The ledge** — the five most recent finished works rest on a rail below
  the wall; click one to rehang it instantly. Works are stored as tiny
  *recipes* (seed + format + palette) plus a thumbnail, never pixels, and
  regenerate pixel-identically. Where the host provides shared storage
  (window.storage — e.g. running as a Claude artifact) the ledge is
  **communal**: it holds the five most recent pours by *anyone* visiting
  the atelier, refreshed every 30 s, with save-time merging so nobody's
  fresh pour is clobbered — and the app tells visitors that the ledge and
  their titles are public. On Vercel, the bundled `/api/ledge` serverless
  function provides the same communal behaviour: the front end probes it
  once at boot and, if healthy, switches to remote mode (server-side merge
  on save, 30 s refresh). Anywhere neither is available it falls back to
  this browser's localStorage (guarded — session-only memory where even
  that is unavailable).

### Enabling the communal ledge on Vercel

1. Deploy the folder as-is — `api/ledge.js` ships with it (no npm deps).
2. In the Vercel dashboard, add an **Upstash for Redis** store from the
   Marketplace (formerly Vercel KV) and connect it to the project. The
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` env vars (or the `UPSTASH_*`
   pair — both are honoured) appear automatically; redeploy.
3. Done. Without a store the endpoint answers 503 and every visitor simply
   keeps a private localStorage ledge — nothing breaks.

The endpoint sanitises every write (whitelisted formats/palettes, numeric
seed, 48-char titles, image-only thumbnails capped at 150 KB) and the
ledge itself is capped at five entries server-side.
  No server needed; cross-device storage would require Vercel KV/Blob + an API
  route.
- **Naming** — click the title on the museum placard to rename a piece; the
  name follows it onto the ledge and into the download filename.
- Five enamel palettes inspired by the classic canon. Each work gets a museum
  placard with a generated title and physical dimensions.

## The dream wing — Joan Miró

The third collection paints in Miró's dream language: biomorphic blobs,
filled-lens eyes, asterisk stars, crescents, ladders of escape, birds,
pennants, half-divided discs, french-dot trails and thin calligraphic
lines that wander between forms — in oil, on washed and scumbled grounds
with dry-brush streaks and occasional spatter, lit by the same relief
engine as the pollock wing. All canvas formats apply.

The wing now paints in **mixed media**, as Miró did: each element takes
up a tool — wet ink with pressure swells, a loaded start and a brush
that runs dry; **wax crayon** laid grainy with the paper breathing
through; dry-brush streaks — plus crayon scribble halos, fingertip dab
clusters with hollow rims, ink splats, rake-of-strokes comb marks, and
blobs that may arrive scrubbed in crayon rather than filled flat.
Compositions were refocused after the late works on paper: far fewer,
far larger elements — the *personnage* mode now paints one commanding
protagonist (a caged grid torso, a dark head-blob riding its shoulder,
wide-stance legs, one raised accent disc, a crayon halo drifting above)
with only a handful of companions, and colour stays restrained around
the figures.

- **Palettes** — Rêve (ivory, full primaries), Constellation (mottled
  parchment, dense star fields), Bleu (cobalt monochrome, sparse
  wanderers), Nocturne (umber night, bright forms, pale line) and Terre
  (burnt sienna, circus figures).
- **Seeded compositions** — each work rolls *personnages* (large figures
  with whiskers, lens eyes, triangle skirts and raised stars),
  *constellation* (dozens of interlinked small forms) or *sparse* (a few
  forms in great space, the Bleu default); plus an optional horizon line
  and ground spatter. Connector lines prefer nearby companions and bow
  like a hand drew them.
- **AI director** — with AI on, Miró's "inner eye" reviews the dream up
  to twice and commissions placed touch-ups (stars, discs, blobs, moons,
  lines, dot trails in named colours), recorded for pixel-identical
  rehang; the curator writes the label in a poetic mid-century voice.

## The silk wing — embroidered carrés

A **Collection** chooser at the top of the controls switches between the
two wings. *Jackson Pollock* (the default) is the painting studio.
*Hermès Scarves* commissions square silk twill carrés, 90 × 90 cm, in the
classic carré grammar: printed border band with stitched gold keylines, a
motif row repeated on all four sides, corner ornaments, a diamond field
lattice, gold medallion rings with a twelve-fold radial garland, and a
satin-stitched centre rosette.

- **Motif families** — *Chaîne* (interlocking anchor chains, corner
  anchors), *Cavalcade* (stirrups, snaffle bits, horseshoes, ribbons) and
  *Jardin* (rosettes, leaf scrolls, french-knot buds).
- **Every commission rolls its own architecture** — seeded variety in the
  centrepiece (layered rosette with radial garland, compass star, or one
  of nine hand-drawn house emblems: ships, crowned anchors, compass
  roses, horseshoe crests, carriage wheels, beribboned stirrups,
  bouquets, butterflies, songbirds), medallion radius, garland count
  (12/16/20), petal count, border-row count, ring ornament style
  (scallops, dots or ticks), and the presence of the inner frame, fringe,
  braid, knot ring, tick band, satellites and corner cartouches. Same
  recipe, same pixels; new seed, new design.
- **Colourways** — Flamme, Marine, Émeraude, Noir and Poudre, each a
  ground + border + gold + three thread colours.
- **The garden composition** — alongside the classic medallion, each
  commission can roll (or the AI designer can choose) an all-over
  botanical *garden* in the manner of the maison's great jungle scarves:
  a **fractal engine with six families** — fern fronds, coral branches
  with polyp-knot tips, scrollwork volutes that spawn counter-volutes,
  plumes with hairline barbs, ray bursts whose spokes end in
  mini-bursts, and forking ribbon meanders — rolled per piece with
  family-weighted odds (kelp-leaning coral for Chaîne, plumes and
  ribbons for Cavalcade, ferns for Jardin), so leaves appear in some
  designs and none at all in others; a separate roll decides how much
  fractal a medallion carries (rich, wreath-only, corners-only, or none) lays dark under-canopy silhouettes,
  arcing palm crowns, corner spills, wandering vines with berries,
  clustered flower-burst colour stories with stray blooms, small far-off
  birds — balanced asymmetry, massed forms, no geometric scaffold. The
  medallion mode was decluttered in the same spirit: fewer simultaneous
  band treatments, no connector arcs, a sparser field with leaf sprigs —
  and the fractal flora now grows through it too: family-tuned fronds
  (feathery kelp for Chaîne, rounded laurel for Cavalcade, garden fern
  for Jardin) spill from the four field corners with accent blooms, a
  stitched leaf wreath hugs the medallion, and sprigs interleave the
  gold pips along the border row.
- **Embroidery, not flat print** — every mark is laid as thread: stem
  stitches, satin-stitch petals with darker couched outlines, layered
  double rosettes, french knots — each raising the height field so the
  relief lighting renders raised cord with shadows and catch-lights, and
  every stitch run carries its own mercerised catch-light glints.
- **Worked in every zone** — a diaper pattern inside the border band, a
  gold rope braid riding the inner keyline, gold pips between border
  motifs, lozenge cartouches framing the corner ornaments, a scalloped
  and knot-ringed medallion, a sixteen-fold radial garland, an inner
  ornament ring, twin satellite rings in the corner pockets, and a
  cross-stitch lattice filling the field.
- **Silk realism** — a diagonal twill weave in both relief and colour,
  anisotropic sheen sweeps, gentle drape shading, and a hand-rolled hem
  with picked gold hem stitches around the perimeter.

Carrés are square only (the format chooser hides; likewise the motif
chooser hides in the painting wing), fully seeded and deterministic, live
on the communal ledge alongside the paintings (server-sanitised
mode/motif/design), and the AI curator writes their labels in the voice
of a great maison.

**Calm by construction** — every designed stroke is smoothed through
corner-cutting (Chaikin) passes into one continuous flowing thread, the
designer's brief demands few long connected curves with satin lying
along the silhouette, medallion sprays and wreaths fold airy fractal
styles back into composed scrollwork at full stitch weight, and the
silk finish carries none of the oil wing's debris, fibres or ageing
mottle — a pressed carré, not a painted one. Framed scarves rest on a
naked-silk liner with a quiet diagonal sheen rather than raw linen.

**The AI designer** — with the AI toggle on, each fresh carré begins
with Claude as head designer: it chooses the composition (garden or
medallion), sets the density, places the colour-accent regions for a
garden, or composes a richly worked figurative centrepiece (45–100 strokes invited, 4,800-token budget) plus an optional **satellite group** — a second small scene repeated four-fold around the field, the way the great equestrian carrés surround their centre — as a constrained stroke
drawing (polylines, arcs, satin patches, french knots in the colourway's
threads — nautical subjects for Chaîne, equestrian for Cavalcade,
botanical for Jardin, with optional mirror symmetry), and the atelier
embroiders whatever it draws in place of the house rosette. The sanitised
design is recorded in the recipe, so illustrated carrés rehang
pixel-identically with no API call. Design replies pass through a
forgiving JSON reader (token-budget truncation is trimmed back to the
last complete stroke and re-closed) with a 3,000-token budget. The live AI *director* still applies
only to the painting wing — a carré's symmetry is already its discipline.

## AI art director (optional, default off)

A toggle in the control rail enables the **AI art director** — disabled by
default; switching it on is disclosed as sending the canvas image to the
Anthropic API. When on, each fresh pour runs as a supervised session:

1. The base painting is thrown as usual (you watch it happen).
2. **The director steps back**: a downscaled snapshot goes to Claude with
   the palette, and Claude judges two things at once — all-over
   compositional balance (sparse corners, clumped colour, dead zones) and
   realism (anything reading as computer-generated rather than
   photographed paint).
3. Claude replies with a strict-JSON verdict: satisfied, a one-line note,
   and up to five targeted touch-ups (mark type, palette layer, region).
   The touch-ups are painted live on the canvas with the same physics
   engine — you watch the director's corrections land.
4. Up to three rounds, stopping early the moment the director is
   satisfied.
5. After the varnish, **the curator writes the wall label**: two or three
   sentences interpreting the finished work, shown beneath the placard.

Director rounds are recorded as tiny *directives* in the work's recipe, so
rehanging an AI-directed piece replays the exact same touch-ups through
the deterministic engine — pixel-identical, with no API call. The label is
stored too. Both travel through the communal ledge (server-sanitised).

### Routes — artifact vs Vercel

The front end reaches Claude two ways and remembers whichever works:

1. **Direct** — running as a claude.ai artifact, calls to
   `api.anthropic.com` are authenticated by the host. No key needed.
2. **Proxy** — on Vercel, the bundled `/api/director` function carries the
   request with a server-side key. Setup: add `ANTHROPIC_API_KEY` to the
   project's environment variables and redeploy. That's all.

The proxy is public, so it's locked to the atelier's exact call shape:
one JPEG snapshot plus one short text prompt, tokens capped at 800, the
model pinned server-side, and a same-origin check — it can't be
repurposed as a general Claude proxy. Each AI-directed pour costs roughly
2–4 vision calls (up to three director rounds plus the label).

If neither route works (no key configured, offline, plain static host),
the first failed call quietly disables AI for the session and pours
continue procedurally.

## Deploy to Vercel
Any of these:

1. **Dashboard:** vercel.com → Add New → Project → import this folder's repo
   (or drag-and-drop the folder on a Hobby plan). Framework preset: **Other**.
   No build command, output directory: root.
2. **CLI:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

That's it — `index.html` is the whole app.

## Local preview
```bash
npx serve .
# or just open index.html in a browser
```
