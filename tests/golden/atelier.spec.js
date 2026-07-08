// @ts-check
/* Golden-image regression tests.
 *
 * Every work in the atelier is fully reproducible from its recipe
 * (seed + format + palette/subject), and the app promises that ledge
 * recipes rehang pixel-identically. These tests hold it to that: each
 * spec rehangs a pinned recipe through the real engine in Chromium,
 * downscales the hi-res canvas, and compares against a committed golden
 * PNG. An engine change that silently alters how old recipes render —
 * breaking every piece already resting on a communal ledge — fails here.
 *
 * Regenerate goldens after an INTENDED engine change with:
 *   npx playwright test --update-snapshots
 */
const { test, expect } = require("@playwright/test");

const RECIPES = [
  { id: "golden-pollock", seed: 12345, mode: "pollock", format: "classic", palette: "convergence", dyn: 0.6, title: "Golden Pour" },
  { id: "golden-miro", seed: 20260707, mode: "miro", format: "square", palette: "reve", dyn: 0.6, title: "Golden Dream" },
  { id: "golden-matisse", seed: 777, mode: "matisse", format: "portrait", subject: "fleurs", dyn: 0.6, title: "Fleurs d'or" },
  { id: "golden-basquiat", seed: 4242, mode: "basquiat", format: "classic", dyn: 0.6, title: "Golden Crown" }
];

/* Rehang a recipe through the app's own ledge path and hand back the
 * finished hi-res canvas, downscaled to ~600 px, as a PNG buffer. */
async function renderRecipe(page, recipe) {
  await page.goto("/");
  await page.evaluate((r) => startGeneration({ entry: r }), recipe);
  await page.waitForFunction(() => state.done, null, { timeout: 170000 });
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement("canvas");
    const s = 600 / Math.max(hi.width, hi.height);
    c.width = Math.round(hi.width * s);
    c.height = Math.round(hi.height * s);
    c.getContext("2d").drawImage(hi, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test.describe("the app boots from the split files", () => {
  test("loads with no page errors and starts a pour", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await page.waitForFunction(() => typeof startGeneration === "function");
    /* the boot pour is random; just wait for it to finish cleanly */
    await page.waitForFunction(() => state.done, null, { timeout: 170000 });
    expect(errors).toEqual([]);
    await expect(page.locator("#regen")).toBeVisible();
  });
});

test.describe("golden images — recipes rehang identically", () => {
  for (const recipe of RECIPES) {
    test(`${recipe.mode} (seed ${recipe.seed})`, async ({ page }) => {
      const png = await renderRecipe(page, recipe);
      expect(png).toMatchSnapshot(`${recipe.mode}.png`, { maxDiffPixelRatio: 0.01 });
    });
  }
});

test.describe("determinism — the pixel-identical rehang guarantee", () => {
  test("the same recipe renders byte-identically twice", async ({ page }) => {
    const first = await renderRecipe(page, RECIPES[0]);
    const second = await renderRecipe(page, RECIPES[0]);
    expect(second.equals(first)).toBe(true);
  });
});
