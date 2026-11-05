import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { chromium } from "@playwright/test";
import {
  ADMIN_THEME,
  DEFAULT_THEME,
  THEMES,
  THEME_REGISTRY,
  isAdminPathname,
  isThemeId,
  resolveRuntimeTheme,
} from "../../src/config/theme.config.ts";
import {
  COOKIE_KEYS,
  STORAGE_KEYS,
} from "../../src/config/storage-keys.ts";
import {
  BOOT_SCRIPT_CONFIG,
  assertSafeBootToken,
  buildBootScript,
} from "../../src/config/boot-script.ts";
import { authCookiePolicy } from "../../src/lib/auth/cookie-policy.ts";
import {
  VISUAL_BROWSER_ARGS,
  VISUAL_DEVICE_SCALE_FACTOR,
} from "../helpers/visual-runtime.ts";

function runBootScriptInVm(options: {
  pathname?: string;
  localStorageMap?: Record<string, string>;
  sessionStorageMap?: Record<string, string>;
  throwOnLocalStorage?: boolean;
  throwOnSessionStorage?: boolean;
}) {
  const attrs = new Map<string, string>();
  const localWrites = new Map<string, string>();
  const scriptCode = buildBootScript();

  const context = vm.createContext({
    document: {
      documentElement: {
        setAttribute(name: string, value: string) {
          attrs.set(name, String(value));
        },
        getAttribute(name: string) {
          return attrs.get(name) ?? null;
        },
      },
    },
    location: {
      pathname: options.pathname ?? "/",
    },
    localStorage: {
      getItem(key: string) {
        if (options.throwOnLocalStorage) {
          throw new Error("SecurityError: localStorage disabled");
        }
        return options.localStorageMap?.[key] ?? null;
      },
      setItem(key: string, value: string) {
        localWrites.set(key, value);
      },
    },
    sessionStorage: {
      getItem(key: string) {
        if (options.throwOnSessionStorage) {
          throw new Error("SecurityError: sessionStorage disabled");
        }
        return options.sessionStorageMap?.[key] ?? null;
      },
    },
  });

  vm.runInContext(scriptCode, context);
  return { attrs, localWrites };
}

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("Theme Runtime, Fonts, Storage Keys, and BootScript Unit Suite (Faz 1 — İş 1B)", () => {
  it("validates THEMES, ThemeId, DEFAULT_THEME, ADMIN_THEME, isThemeId, and THEME_REGISTRY against v0.1 inventory", () => {
    expect(THEMES).toEqual(["cinematic", "classic"]);
    expect(DEFAULT_THEME).toBe("cinematic");
    expect(ADMIN_THEME).toBe("classic");

    expect(isThemeId("cinematic")).toBe(true);
    expect(isThemeId("classic")).toBe(true);
    expect(isThemeId("arcade")).toBe(false);
    expect(isThemeId("light")).toBe(false);
    expect(isThemeId("dark")).toBe(false);
    expect(isThemeId("")).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
    expect(isThemeId(42)).toBe(false);

    for (const id of THEMES) {
      const def = THEME_REGISTRY[id];
      expect(def.id).toBe(id);
      expect(def.colorScheme).toBe("dark");
      expect(def.labelKey).toBe(`theme.${id}`);
    }
    expect(THEME_REGISTRY.cinematic.scope).toBe("public");
    expect(THEME_REGISTRY.classic.scope).toBe("admin");

    expect(isAdminPathname("/admin")).toBe(true);
    expect(isAdminPathname("/admin/etkinlikler")).toBe(true);
    expect(isAdminPathname("/")).toBe(false);
    expect(isAdminPathname("/hakkimizda")).toBe(false);

    // Verify no legacy theme migration or unrequested public profile exists
    expect(resolveRuntimeTheme({ pathname: "/", storedTheme: null })).toBe("cinematic");
    expect(resolveRuntimeTheme({ pathname: "/", storedTheme: "arcade" })).toBe("cinematic");
    expect(resolveRuntimeTheme({ pathname: "/", storedTheme: "light" })).toBe("cinematic");
    expect(resolveRuntimeTheme({ pathname: "/admin", storedTheme: "cinematic" })).toBe("classic");
    expect(resolveRuntimeTheme({ pathname: "/admin/oyunlar", storedTheme: "arcade" })).toBe("classic");
    expect(resolveRuntimeTheme({ pathname: "/", storedTheme: "cinematic", forcedTheme: "classic" })).toBe("classic");
  });

  it("verifies STORAGE_KEYS and COOKIE_KEYS centralize all storage and cookie names without changing auth/CSRF contracts", () => {
    expect(STORAGE_KEYS).toEqual({
      theme: "uludott-theme",
      introSeen: "uludott-intro-seen",
    });

    expect(COOKIE_KEYS).toEqual({
      locale: "uludott-lang",
      adminSessionHttps: "__Host-uludott_admin",
      adminSessionHttp: "uludott_admin_local",
      adminCsrfHttps: "__Host-uludott_csrf",
      adminCsrfHttp: "uludott_csrf_local",
      teamSession: "__Host-uludott_team",
    });

    expect(authCookiePolicy("https://uludott.com.tr")).toEqual({
      sessionName: COOKIE_KEYS.adminSessionHttps,
      csrfName: COOKIE_KEYS.adminCsrfHttps,
      secure: true,
    });
    expect(authCookiePolicy("http://127.0.0.1:3000")).toEqual({
      sessionName: COOKIE_KEYS.adminSessionHttp,
      csrfName: COOKIE_KEYS.adminCsrfHttp,
      secure: false,
    });

    // Ensure no file in src/ hardcodes storage/cookie key strings outside src/config/storage-keys.ts
    const srcDir = path.resolve(process.cwd(), "src");
    const tsFiles = walkTsFiles(srcDir);
    const allKeyLiterals = [
      ...Object.values(STORAGE_KEYS),
      ...Object.values(COOKIE_KEYS),
    ];

    const violations: string[] = [];
    for (const file of tsFiles) {
      const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
      if (rel === "src/config/storage-keys.ts") continue;

      const content = fs.readFileSync(file, "utf8");
      for (const keyLiteral of allKeyLiterals) {
        if (content.includes(`"${keyLiteral}"`) || content.includes(`'${keyLiteral}'`)) {
          violations.push(`${rel} hardcodes key literal "${keyLiteral}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("verifies src/config/fonts.ts preserves ArtDeco font files, weights, swap display, and producer variable names", () => {
    const fontsFile = path.resolve(process.cwd(), "src/config/fonts.ts");
    const layoutFile = path.resolve(process.cwd(), "src/app/layout.tsx");
    const fontsSource = fs.readFileSync(fontsFile, "utf8");
    const layoutSource = fs.readFileSync(layoutFile, "utf8");

    expect(fontsSource).toContain("../styles/fonts/ArtDeco-Regular.woff");
    expect(fontsSource).toContain("../styles/fonts/ArtDeco-Medium.woff");
    expect(fontsSource).toContain("../styles/fonts/ArtDeco-Bold.woff");
    expect(fontsSource).toContain("../styles/fonts/ArtDeco-CondensedBold.woff");
    expect(fontsSource).toContain('variable: "--font-artdeco-body"');
    expect(fontsSource).toContain('variable: "--font-artdeco-display"');
    expect(fontsSource).toContain('display: "swap"');

    expect(layoutSource).toContain('from "../config/fonts.ts"');
    expect(layoutSource).toContain('from "../components/boot/BootScript.tsx"');
    expect(layoutSource).toContain('from "../components/theme/ThemeProvider.tsx"');
  });

  it("validates buildBootScript safety, SecurityError resilience, invalid/legacy values, and zero unrequested writes", () => {
    const script = buildBootScript();
    expect(script).toContain( JSON.stringify(STORAGE_KEYS.theme));
    expect(script).toContain(JSON.stringify(STORAGE_KEYS.introSeen));
    expect(script).toContain(JSON.stringify(DEFAULT_THEME));
    expect(script).toContain(JSON.stringify(ADMIN_THEME));

    // Reject unsafe tokens to prevent script injection
    expect(() => assertSafeBootToken('bad"token', "test")).toThrow(/BOOT_SCRIPT_UNSAFE_TOKEN/);
    expect(() => assertSafeBootToken("<script>", "test")).toThrow(/BOOT_SCRIPT_UNSAFE_TOKEN/);
    expect(() =>
      buildBootScript({
        ...BOOT_SCRIPT_CONFIG,
        allowedThemes: [],
      }),
    ).toThrow(/BOOT_SCRIPT_EMPTY_THEMES/);

    // 1. Default public route with empty storage: sets cinematic, writes nothing to localStorage
    const emptyPublic = runBootScriptInVm({ pathname: "/" });
    expect(emptyPublic.attrs.get("data-theme")).toBe("cinematic");
    expect(emptyPublic.attrs.has("data-intro-seen")).toBe(false);
    expect(emptyPublic.localWrites.size).toBe(0);

    // 2. Legacy/invalid values ("arcade", "light", "invalid") fall back to DEFAULT_THEME without migration
    for (const invalidVal of ["arcade", "light", "dark", "invalid", ""]) {
      const res = runBootScriptInVm({
        pathname: "/oyunlar",
        localStorageMap: { [STORAGE_KEYS.theme]: invalidVal },
      });
      expect(res.attrs.get("data-theme")).toBe("cinematic");
      expect(res.localWrites.size).toBe(0);
    }

    // 3. Storage SecurityError on both localStorage and sessionStorage is caught cleanly
    const secErr = runBootScriptInVm({
      pathname: "/ulujam",
      throwOnLocalStorage: true,
      throwOnSessionStorage: true,
    });
    expect(secErr.attrs.get("data-theme")).toBe("cinematic");
    expect(secErr.attrs.has("data-intro-seen")).toBe(false);

    // 4. Admin route always sets ADMIN_THEME ("classic")
    const adminRes = runBootScriptInVm({
      pathname: "/admin/etkinlikler",
      localStorageMap: { [STORAGE_KEYS.theme]: "cinematic" },
    });
    expect(adminRes.attrs.get("data-theme")).toBe("classic");

    // 5. sessionStorage introSeen === "true" sets data-intro-seen="true", other values ignored
    const introTrue = runBootScriptInVm({
      pathname: "/",
      sessionStorageMap: { [STORAGE_KEYS.introSeen]: "true" },
    });
    expect(introTrue.attrs.get("data-intro-seen")).toBe("true");

    const introFalse = runBootScriptInVm({
      pathname: "/",
      sessionStorageMap: { [STORAGE_KEYS.introSeen]: "false" },
    });
    expect(introFalse.attrs.has("data-intro-seen")).toBe(false);
  });

  it("verifies CSP nonce execution, JS-disabled fallback, storage SecurityError, and v0.1 first-paint styles in Chromium", async () => {
    const themesCss = fs.readFileSync(
      path.resolve(process.cwd(), "src/styles/themes.css"),
      "utf8",
    );
    const baseCss = fs.readFileSync(
      path.resolve(process.cwd(), "src/styles/base.css"),
      "utf8",
    );
    const bootJs = buildBootScript();
    const nonce = "rAnd0mN0nc3Base64Value==";
    const origin = "https://127.0.0.1:39494";

    const browser = await chromium.launch({
      channel: "chromium",
      headless: true,
      args: [...VISUAL_BROWSER_ARGS],
    });

    try {
      // Case A: JS enabled + strict nonce CSP + blocked un-nonced script + storage SecurityError
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
      });
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        const isAdmin = url.pathname.startsWith("/admin");
        return route.fulfill({
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "content-security-policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'`,
          },
          body: `<!doctype html><html lang="tr" data-theme="cinematic"><head>
            <style>${themesCss}\n${baseCss}</style>
            <script nonce="${nonce}">
              if (location.search.includes("throwStorage=1")) {
                Object.defineProperty(window, "localStorage", {
                  get() { throw new DOMException("Blocked", "SecurityError"); }
                });
              }
            </script>
            <script id="uludott-boot" nonce="${nonce}">${bootJs}</script>
            <script>window.__unnoncedExecuted = true;</script>
          </head><body class="${isAdmin ? "admin" : ""}"><main id="main-content"><h1>ULUDOTT</h1></main></body></html>`,
        });
      });

      const page = await context.newPage();
      await page.goto(`${origin}/?throwStorage=1`, { waitUntil: "domcontentloaded" });
      const statePublic = await page.evaluate(() => {
        const bodyStyle = getComputedStyle(document.body);
        return {
          theme: document.documentElement.getAttribute("data-theme"),
          unnonced: Boolean((window as unknown as { __unnoncedExecuted?: boolean }).__unnoncedExecuted),
          bg: bodyStyle.backgroundColor,
          fg: bodyStyle.color,
        };
      });
      expect(statePublic).toEqual({
        theme: "cinematic",
        unnonced: false,
        bg: "rgb(12, 13, 27)",
        fg: "rgb(255, 249, 203)",
      });

      await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
      const stateAdmin = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        return {
          theme: document.documentElement.getAttribute("data-theme"),
          adminBg: rootStyle.getPropertyValue("--admin-bg").trim(),
          ink: rootStyle.getPropertyValue("--ink").trim(),
        };
      });
      expect(stateAdmin).toEqual({
        theme: "classic",
        adminBg: "#0d101b",
        ink: "#0c0d1b",
      });
      await context.close();

      // Case B: JS disabled (javaScriptEnabled: false) preserves exact v0.1 first paint
      const noJsContext = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
        javaScriptEnabled: false,
      });
      await noJsContext.route("**/*", async (route) => {
        return route.fulfill({
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
          body: `<!doctype html><html lang="tr" data-theme="cinematic"><head>
            <style>${themesCss}\n${baseCss}</style>
            <script id="uludott-boot" nonce="${nonce}">${bootJs}</script>
          </head><body><main id="main-content"><h1>ULUDOTT</h1></main></body></html>`,
        });
      });
      const noJsPage = await noJsContext.newPage();
      await noJsPage.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
      const noJsState = await noJsPage.evaluate(() => {
        const bodyStyle = getComputedStyle(document.body);
        return {
          theme: document.documentElement.getAttribute("data-theme"),
          bg: bodyStyle.backgroundColor,
          fg: bodyStyle.color,
        };
      });
      expect(noJsState).toEqual({
        theme: "cinematic",
        bg: "rgb(12, 13, 27)",
        fg: "rgb(255, 249, 203)",
      });
      await noJsContext.close();
    } finally {
      await browser.close();
    }
  });
});
