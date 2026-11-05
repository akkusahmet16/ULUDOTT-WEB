import { test, expect } from "@playwright/test";
import { STORAGE_KEYS } from "../../src/config/storage-keys";

test("BootScript nonce CSP, hydration, ArtDeco font variables, and private headers on public and admin routes", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  const publicRes = await page.goto("/");
  expect(publicRes).not.toBeNull();
  const publicCsp = publicRes!.headers()["content-security-policy"];
  expect(publicCsp).toContain("'strict-dynamic'");
  const nonceMatch = publicCsp.match(/'nonce-([^']+)'/);
  expect(nonceMatch).not.toBeNull();

  const publicState = await page.evaluate((themeKey) => {
    const html = document.documentElement;
    const bootScript = document.getElementById(
      "uludott-boot",
    ) as HTMLScriptElement | null;
    const rootStyle = getComputedStyle(html);
    const bodyStyle = getComputedStyle(document.body);
    return {
      dataTheme: html.getAttribute("data-theme"),
      bootNonceLength: bootScript?.nonce.length ?? 0,
      storedTheme: localStorage.getItem(themeKey),
      fontArtdecoBody: rootStyle.getPropertyValue("--font-artdeco-body").trim(),
      fontArtdecoDisplay: rootStyle
        .getPropertyValue("--font-artdeco-display")
        .trim(),
      fontBody: rootStyle.getPropertyValue("--font-body").trim(),
      fontDisplay: rootStyle.getPropertyValue("--font-display").trim(),
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
    };
  }, STORAGE_KEYS.theme);

  expect(publicState.dataTheme).toBe("cinematic");
  expect(publicState.bootNonceLength).toBeGreaterThan(0);
  expect(publicState.storedTheme).toBeNull();
  expect(publicState.fontArtdecoBody.length).toBeGreaterThan(0);
  expect(publicState.fontArtdecoDisplay.length).toBeGreaterThan(0);
  expect(publicState.fontBody).toBe(publicState.fontArtdecoBody);
  expect(publicState.fontDisplay).toBe(publicState.fontArtdecoDisplay);
  expect(publicState.bodyBg).toBe("rgb(12, 13, 27)");
  expect(publicState.bodyColor).toBe("rgb(255, 249, 203)");

  const adminRes = await page.goto("/admin");
  expect(adminRes).not.toBeNull();
  expect(adminRes!.headers()["cache-control"]).toContain("no-store");
  expect(adminRes!.headers()["referrer-policy"]).toBe("no-referrer");
  expect(adminRes!.headers()["x-robots-tag"]).toBe("noindex, nofollow");

  const adminState = await page.evaluate(() => {
    const html = document.documentElement;
    const rootStyle = getComputedStyle(html);
    return {
      dataTheme: html.getAttribute("data-theme"),
      adminBg: rootStyle.getPropertyValue("--admin-bg").trim(),
      adminPanel: rootStyle.getPropertyValue("--admin-panel").trim(),
    };
  });

  expect(adminState.dataTheme).toBe("classic");
  expect(adminState.adminBg).toBe("#0d101b");
  expect(adminState.adminPanel).toBe("#171c2b");
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("BootScript and ThemeProvider handle legacy/invalid values and storage SecurityError without visual drift", async ({
  page,
}) => {
  await page.addInitScript((themeKey) => {
    try {
      localStorage.setItem(themeKey, "arcade");
    } catch {
      // ignore
    }
  }, STORAGE_KEYS.theme);

  await page.goto("/hakkimizda");
  expect(
    await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    ),
  ).toBe("cinematic");

  // Simulate localStorage throwing SecurityError before navigation
  const secPage = await page.context().newPage();
  await secPage.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await secPage.goto("/oyunlar");
  const secState = await secPage.evaluate(() => ({
    dataTheme: document.documentElement.getAttribute("data-theme"),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));
  expect(secState).toEqual({
    dataTheme: "cinematic",
    bodyBg: "rgb(12, 13, 27)",
  });
  await secPage.close();
});

test("JS-disabled browser renders v0.1 first paint with data-theme=cinematic", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "cinematic",
    );
    await expect(page.locator(".brand img")).toHaveCount(1);
  } finally {
    await context.close();
  }
});
