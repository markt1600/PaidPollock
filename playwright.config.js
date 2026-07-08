// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/golden",
  /* a full hi-res render takes a while; be generous */
  timeout: 180000,
  /* goldens are platform-agnostic on purpose: canvas output here is pure
   * path geometry (no fonts), so the same Chromium renders it the same
   * everywhere; the small maxDiffPixelRatio in the spec absorbs
   * antialiasing drift between Chromium versions. Regenerate with
   * `npx playwright test --update-snapshots`. */
  snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{ext}",
  fullyParallel: true,
  use: {
    browserName: "chromium",
    /* the app honours prefers-reduced-motion by rendering flat-out */
    contextOptions: { reducedMotion: "reduce" },
    /* point CHROMIUM_PATH at a pre-installed browser to skip the download
     * (e.g. sandboxed CI images that ship their own Chromium) */
    ...(process.env.CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
      : {})
  },
  webServer: {
    command: "node tests/serve.mjs",
    port: 4173,
    reuseExistingServer: true
  }
});
