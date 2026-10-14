import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { z } from "zod";
import { ADMIN_THEME } from "../../src/config/theme.config.ts";
import { STORAGE_KEYS } from "../../src/config/storage-keys.ts";

const manifest = z.object({
  browser: z.string(), fixedTime: z.string(),
  files: z.array(z.object({ route: z.string(), device: z.string(), viewport: z.object({ width: z.number(), height: z.number() }), filename: z.string().regex(/^[a-z-]+\.png$/), sha256: z.string() })),
}).parse(JSON.parse(readFileSync("tests/e2e/__baseline-classic__/manifest.json", "utf8")));

test.beforeAll(async ({ browser }) => {
  expect(browser.version()).toBe(manifest.browser);
  expect(manifest.files).toHaveLength(16);
  for (const file of manifest.files) expect(createHash("sha256").update(readFileSync(`tests/e2e/__baseline-classic__/${file.filename}`)).digest("hex")).toBe(file.sha256);
  mkdirSync("tests/e2e/__evidence__", { recursive: true });
  writeFileSync("tests/e2e/__evidence__/faz1-classic-diff.json", "[]\n");
});
for (const file of manifest.files) test(`Classic ${file.route} ${file.device}`, async ({ page }) => {
  await page.setViewportSize(file.viewport);
  await page.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), { key: STORAGE_KEYS.theme, theme: ADMIN_THEME });
  await page.clock.install({ time: new Date("2026-10-10T09:00:00.000Z") });
  await page.clock.pauseAt(new Date(manifest.fixedTime));
  expect((await page.goto(file.route, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await page.locator("main").waitFor();
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))); });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await expect(page).toHaveScreenshot(file.filename, { fullPage: false, animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.01, threshold: 0 });
  // Playwright eşiğine ek olarak antialias dahil birebir RGBA farkı kaydedilir.
  const actual = await page.screenshot({ fullPage: false, animations: "disabled", caret: "hide" });
  const pixels = await page.evaluate(async ({ before, after }) => {
    const decode = async (source: string) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) throw Error("Canvas gerekli");
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, image.width, image.height).data;
    };
    const left = await decode(before), right = await decode(after);
    if (left.length !== right.length) throw Error("Görsel boyutu değişti");
    let changed = 0;
    for (let i = 0; i < left.length; i += 4) if (left[i] !== right[i] || left[i + 1] !== right[i + 1] || left[i + 2] !== right[i + 2] || left[i + 3] !== right[i + 3]) changed++;
    return { changed, total: left.length / 4, ratio: changed / (left.length / 4) };
  }, { before: readFileSync(`tests/e2e/__baseline-classic__/${file.filename}`).toString("base64"), after: actual.toString("base64") });
  expect(pixels.ratio).toBeLessThanOrEqual(0.01);
  const path = "tests/e2e/__evidence__/faz1-classic-diff.json";
  const previous = z.array(z.object({ filename: z.string(), changed: z.number(), total: z.number(), ratio: z.number() })).parse(JSON.parse(readFileSync(path, "utf8")));
  writeFileSync(path, JSON.stringify([...previous, { filename: file.filename, ...pixels }], null, 2) + "\n");
});
