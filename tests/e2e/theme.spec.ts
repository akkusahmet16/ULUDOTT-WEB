import { mkdirSync, writeFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { z } from "zod";
import { ADMIN_THEME, DEFAULT_THEME } from "../../src/config/theme.config.ts";
import { STORAGE_KEYS } from "../../src/config/storage-keys.ts";

test("ilk ziyaret varsayılan tema ve hidrasyon hatası olmadan açılır", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (/hydration|hydrated/i.test(message.text())) errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", DEFAULT_THEME);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("Classic DOMContentLoaded öncesinde uygulanır ve web font indirmez", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", request => { if (request.resourceType() === "font" && !request.url().includes("next-devtools")) fonts.push(request.url()); });
  await page.addInitScript(({ key, theme }) => {
    localStorage.setItem(key, theme);
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.dataset.observedTheme = document.documentElement.dataset.theme;
      document.documentElement.dataset.observedBg = getComputedStyle(document.body).backgroundColor;
      document.documentElement.dataset.observedExpectedBg = (() => { const probe = document.createElement("div"); probe.style.backgroundColor = "var(--color-bg)"; document.body.append(probe); const value = getComputedStyle(probe).backgroundColor; probe.remove(); return value; })();
    }, { once: true });
  }, { key: STORAGE_KEYS.theme, theme: ADMIN_THEME });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-observed-theme", ADMIN_THEME);
  const observed = await page.locator("html").evaluate(element => ({ bg: element.dataset.observedBg, expected: element.dataset.observedExpectedBg, font: getComputedStyle(document.body).fontFamily }));
  expect(observed.bg).toBe(observed.expected);
  expect(observed.font).toMatch(/^Arial/);
  expect(fonts).toEqual([]);
  expect(await page.locator('link[rel="preload"][as="font"]').count()).toBe(0);
});

test("geçersiz tercih varsayılana döner", async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, "invalid-theme"), STORAGE_KEYS.theme);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", DEFAULT_THEME);
});

test("localStorage getter SecurityError ile de sayfa açılır", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw Error("SecurityError"); } }));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", DEFAULT_THEME);
  expect(errors).toEqual([]);
});

test("Arcade kökün altında admin hesaplanmış font/zemini Classic kalır", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("html")).toHaveAttribute("data-theme", DEFAULT_THEME);
  await expect(page.locator(".admin-shell")).toHaveAttribute("data-theme", ADMIN_THEME);
  const actual = await page.locator(".admin-shell").evaluate(element => ({ font: getComputedStyle(element).fontFamily, background: getComputedStyle(element).backgroundColor, token: getComputedStyle(element).getPropertyValue("--color-bg").trim() }));
  expect(actual.font).toMatch(/^Arial/);
  expect(actual.background).not.toBe(await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor));
});

test("tema sekmeler arasında senkronize olur; silme varsayılana döner", async ({ page, context }) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate(({ key, theme }) => localStorage.setItem(key, theme), { key: STORAGE_KEYS.theme, theme: ADMIN_THEME });
  await expect(page.locator("html")).toHaveAttribute("data-theme", ADMIN_THEME);
  await other.evaluate(key => localStorage.removeItem(key), STORAGE_KEYS.theme);
  await expect(page.locator("html")).toHaveAttribute("data-theme", DEFAULT_THEME);
});

test("iç içe iki yönde tema geçersiz kılınır ve gerçek font yeniden hesaplanır", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const fonts = await page.evaluate(({ outer, inner }) => {
    const parent = document.createElement("div");
    parent.dataset.theme = outer;
    parent.style.fontFamily = "var(--font-body)";
    const child = document.createElement("div");
    child.dataset.theme = inner;
    child.style.fontFamily = "var(--font-body)";
    parent.append(child);
    document.body.append(parent);
    const result = { parent: getComputedStyle(parent).fontFamily, child: getComputedStyle(child).fontFamily };
    parent.remove();
    return result;
  }, { outer: ADMIN_THEME, inner: DEFAULT_THEME });
  expect(fonts.parent).toMatch(/^Arial/);
  expect(fonts.child).toMatch(/Space.?Grotesk/i);
});

test("Classic gezinme hedefleri en az 48px ve komşu footer hedefleri ayrıdır", async ({ page }) => {
  await page.addInitScript(({ key, theme }) => localStorage.setItem(key, theme), { key: STORAGE_KEYS.theme, theme: ADMIN_THEME });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });
  const sizes = await page.locator(".site-nav a, .site-footer a").evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
  for (const size of sizes) { expect(size.width).toBeGreaterThanOrEqual(48); expect(size.height).toBeGreaterThanOrEqual(48); }
  const gap = await page.locator(".site-footer a").evaluateAll(elements => elements[1].getBoundingClientRect().left - elements[0].getBoundingClientRect().right);
  expect(gap).toBeGreaterThanOrEqual(0);
});

test("Arcade dar ekranlarda taşmaz ve gezinme hedefleri en az 48px olur", async ({ page }) => {
  for (const width of [320, 375, 901, 1024, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const links = await page.locator(".site-nav a, .site-footer a").evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
  for (const link of links) { expect(link.width).toBeGreaterThanOrEqual(48); expect(link.height).toBeGreaterThanOrEqual(48); }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Menü" }).click();
  for (const link of await page.locator(".site-nav a").all()) expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(48);
});

test("Türkçe glifler üç gerçek web fontuyla çizilir ve ağ boyutları kaydedilir", async ({ page, context }) => {
  test.skip(process.env.ULUDOTT_E2E_PRODUCTION !== "1", "Font ağı kanıtı üretim çıktısında ölçülür");
  const fontResponses: Promise<{ url: string; bytes: number }>[] = [];
  page.on("response", response => { if (response.request().resourceType() === "font") fontResponses.push(response.body().then(body => ({ url: new URL(response.url()).pathname, bytes: body.length }))); });
  await page.goto("/", { waitUntil: "networkidle" });
  const glyphs = ["İ", "ı", "Ğ", "ğ", "Ş", "ş", "Ç", "ç", "Ö", "ö", "Ü", "ü"];
  await page.evaluate(async glyphs => {
    const specimen = document.createElement("section");
    specimen.id = "font-specimen";
    specimen.style.cssText = "padding:var(--space-8);background:var(--color-bg);color:var(--color-text);display:grid;gap:var(--space-6)";
    for (const family of ["display", "body", "label"]) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:var(--space-3);flex-wrap:wrap";
      for (const [index, glyph] of glyphs.entries()) {
        const span = document.createElement("span");
        span.id = `glyph-${family}-${index}`;
        span.style.cssText = `font-family:var(--font-${family});font-size:var(--text-3xl);font-weight:var(--weight-regular)`;
        span.textContent = glyph;
        row.append(span);
      }
      specimen.append(row);
    }
    document.body.replaceChildren(specimen);
    for (const span of specimen.querySelectorAll("span")) await document.fonts.load(getComputedStyle(span).font, span.textContent ?? "");
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
  }, glyphs);
  const session = await context.newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  const fontSchema = z.object({ fonts: z.array(z.object({ familyName: z.string(), postScriptName: z.string(), isCustomFont: z.boolean(), glyphCount: z.number() })) });
  const evidence: { family: string; glyph: string; fonts: z.infer<typeof fontSchema>["fonts"] }[] = [];
  for (const family of ["display", "body", "label"]) for (const [index, glyph] of glyphs.entries()) {
    const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: `#glyph-${family}-${index}` });
    const { fonts } = fontSchema.parse(await session.send("CSS.getPlatformFontsForNode", { nodeId }));
    const used = fonts.filter(font => font.glyphCount > 0);
    expect(used.length).toBeGreaterThan(0);
    for (const font of used) expect(font.isCustomFont).toBe(true);
    const expected = { display: /Press.?Start/i, body: /Space.?Grotesk/i, label: /VT323/i };
    expect(used.every(font => Object.entries(expected).some(([key, pattern]) => key === family && pattern.test(font.familyName + font.postScriptName)))).toBe(true);
    evidence.push({ family, glyph, fonts: used });
  }
  mkdirSync("tests/e2e/__evidence__", { recursive: true });
  await page.locator("#font-specimen").screenshot({ path: "tests/e2e/__evidence__/faz1-turkish-glyphs.png" });
  const preload = await page.locator('link[rel="preload"][as="font"]').evaluateAll(elements => elements.map(element => element.getAttribute("href")));
  expect(preload).toEqual([]);
  writeFileSync("tests/e2e/__evidence__/faz1-font-metrics.json", JSON.stringify({ glyphs: evidence, preload, requests: await Promise.all(fontResponses) }, null, 2) + "\n");
});
