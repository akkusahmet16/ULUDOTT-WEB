import { waitForVisualFonts } from "./visual-fonts.ts";
import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import type { Sql } from "postgres";
import { VISUAL_PANEL_PASSWORD } from "./visual-fixture.ts";
import { installFixedDate } from "./visual-clock-script.mjs";
import { comparePngPixels } from "./visual-pixels.ts";
import { captureVisualPng } from "./visual-capture.ts";
import { VISUAL_DEVICE_SCALE_FACTOR } from "./visual-runtime.ts";

const baseURL = "https://127.0.0.1:3443";
const ownedDatabase = /^uludott_test_[0-9a-f]{32}$/;

function invariant(value: unknown, code: string): asserts value {
  if (!value) throw Error(code);
}

async function guardOwnedDatabase(sql: Sql) {
  invariant(
    !sql.options.path &&
      sql.options.host.length > 0 &&
      sql.options.host.every((host) =>
        ["127.0.0.1", "localhost"].includes(host),
      ) &&
      ownedDatabase.test(sql.options.database),
    "OWNED_BOUNDARY_DATABASE_REQUIRED",
  );
  const [identity] = await sql`select current_database() as name`;
  invariant(
    ownedDatabase.test(String(identity.name)) &&
      identity.name === sql.options.database,
    "OWNED_BOUNDARY_DATABASE_REQUIRED",
  );
}

async function settleBoundary(page: Page) {
  await waitForVisualFonts(page);
  // A streaming document is deliberately still loading. Wait for its actual
  // stylesheets and visible fonts instead of waiting for the response to end.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const links = [
          ...document.querySelectorAll<HTMLLinkElement>(
            'link[rel="stylesheet"]',
          ),
        ];
        return links.length > 0 && links.every((link) => link.sheet !== null);
      }),
    )
    .toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = (element: Element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        box.width > 0 &&
        box.height > 0 &&
        box.bottom > 0 &&
        box.top < innerHeight &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    };
    for (const element of document.querySelectorAll(
      "body, h1, h2, p, a, button",
    )) {
      if (!visible(element)) continue;
      const font = getComputedStyle(element).font;
      await document.fonts.load(font);
      if (!document.fonts.check(font)) throw Error("BOUNDARY_FONT_NOT_LOADED");
    }
    if ([...document.fonts].some((font) => font.status === "error"))
      throw Error("BOUNDARY_FONT_LOAD_FAILED");
    for (const image of document.images) {
      if (!visible(image)) continue;
      await image.decode();
      if (!image.naturalWidth) throw Error("BOUNDARY_IMAGE_NOT_DECODED");
    }
  });
  await page.waitForTimeout(1_250);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function stableBoundaryPng(page: Page) {
  await settleBoundary(page);
  const first = await captureVisualPng(page);
  await page.waitForTimeout(100);
  const second = await captureVisualPng(page);
  invariant(
    (await comparePngPixels(first, second)).equal,
    "BOUNDARY_PIXELS_NOT_STABLE",
  );
  return first;
}

async function loginAndLeaveAdmin(
  page: Page,
  progress: (stage: string) => void,
) {
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (["/api/admin/csrf", "/api/admin/login"].includes(path))
      progress(
        "login-" +
          (path.endsWith("csrf") ? "csrf" : "post") +
          "-" +
          response.status(),
      );
  });
  // Preserve the real login response and all flags except its browser-host-clock
  // expiry date. This synthetic session remains only in this disposable context.
  await page.route("**/api/admin/login", async (route) => {
    const response = await route.fetch();
    const headers = response.headers();
    if (headers["set-cookie"])
      headers["set-cookie"] = headers["set-cookie"].replace(
        /;\s*expires=[^;]+/gi,
        "",
      );
    await route.fulfill({ response, headers });
  });
  const login = await page.goto("/admin");
  invariant(login?.status() === 200, "BOUNDARY_LOGIN_HTTP_FAILED");
  await page
    .getByLabel("Özel şifre", { exact: true })
    .fill(VISUAL_PANEL_PASSWORD);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Birlikte yönet.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri", exact: true }),
  ).toBeAttached();
  invariant(
    (await page.context().cookies()).some(
      (cookie) => cookie.httpOnly && cookie.secure,
    ),
    "BOUNDARY_SECURE_SESSION_REQUIRED",
  );
  const contact = await page.goto("/iletisim");
  invariant(contact?.status() === 200, "BOUNDARY_CONTACT_HTTP_FAILED");
}

async function restoreFormsTable(sql: Sql) {
  await guardOwnedDatabase(sql);
  await sql.begin(async (tx) => {
    await tx`set local lock_timeout='2s'`;
    await tx`set local statement_timeout='3s'`;
    const [tables] = await tx`select to_regclass('public.forms') as original,
      to_regclass('public.visual_forms_interrupted') as interrupted`;
    if (tables.original && !tables.interrupted) return;
    invariant(
      !tables.original && tables.interrupted,
      "BOUNDARY_TABLE_RESTORE_PRECONDITION_FAILED",
    );
    await tx`alter table public.visual_forms_interrupted rename to forms`;
  });
}

/**
 * Exercise Next's real server loading/error boundaries on an owned fixture DB.
 * PNGs remain in memory. The caller owns the browser, database and server; no
 * tracing, DOM dumps, URLs, cookies or database-driver causes are persisted here.
 */
export async function captureVisualAdminBoundaries(
  browser: Browser,
  sql: Sql,
  epoch: number,
): Promise<Map<string, Buffer>> {
  const captures = new Map<string, Buffer>();
  try {
    invariant(
      Number.isSafeInteger(epoch) && epoch > 0,
      "BOUNDARY_EPOCH_REQUIRED",
    );
    await guardOwnedDatabase(sql);
    const [tables] = await sql`select to_regclass('public.forms') as original,
      to_regclass('public.visual_forms_interrupted') as interrupted`;
    invariant(
      tables.original && !tables.interrupted,
      "BOUNDARY_TABLE_PRECONDITION_FAILED",
    );
  } catch {
    throw Error("ADMIN_BOUNDARY_PREPARATION_FAILED");
  }

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 375, height: 812 },
  ]) {
    for (const state of ["loading", "error"] as const) {
      const alias = `admin-${state}-${viewport.width}x${viewport.height}`;
      let context: BrowserContext | undefined;
      let stage = "context";
      try {
        context = await browser.newContext({
          baseURL,
          ignoreHTTPSErrors: true,
          viewport,
          deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
          locale: "tr-TR",
          timezoneId: "Europe/Istanbul",
          colorScheme: "dark",
          forcedColors: "none",
          reducedMotion: "no-preference",
          isMobile: false,
          hasTouch: false,
        });
        context.setDefaultTimeout(15_000);
        const page = await context.newPage();
        await page.addInitScript(installFixedDate, epoch);
        await page.mouse.move(viewport.width - 1, viewport.height - 1);
        stage = "login";
        await loginAndLeaveAdmin(page, (value) => {
          stage = value;
        });

        if (state === "loading") {
          stage = "loading";
          await guardOwnedDatabase(sql);
          const png = await sql.begin(async (tx) => {
            await tx`set local lock_timeout='2s'`;
            await tx`lock table public.forms in access exclusive mode`;
            stage = "loading-locked";
            try {
              const response = await page.goto("/admin", {
                waitUntil: "commit",
              });
              stage = "loading-http-" + response?.status();
              invariant(
                response?.status() === 200,
                "BOUNDARY_LOADING_HTTP_FAILED",
              );
              const status = page
                .getByRole("status")
                .filter({ hasText: "Yönetim ekranı yükleniyor…" });
              await expect(status).toHaveCount(1);
              await expect(status).toBeVisible();
              await expect(status).toHaveText("Yönetim ekranı yükleniyor…");
              stage = "loading-capture";
              const png = await stableBoundaryPng(page);
              await expect(status).toBeVisible();
              return png;
            } finally {
              // Abort the streaming request before the transaction releases its
              // lock, even when readiness or screenshot verification fails.
              await context!.close();
            }
          });
          captures.set(alias, png);
        } else {
          stage = "error";
          await guardOwnedDatabase(sql);
          try {
            await sql.begin(async (tx) => {
              await tx`set local lock_timeout='2s'`;
              await tx`set local statement_timeout='3s'`;
              await tx`alter table public.forms rename to visual_forms_interrupted`;
            });
            // A real dashboard database failure must reach the real Next error
            // boundary. Do not replace an API response or inject fallback HTML.
            await page.goto("/admin");
            await expect(
              page.getByRole("heading", {
                name: "Yönetim ekranı açılamadı",
                exact: true,
              }),
            ).toBeVisible();
          } finally {
            stage = "restore";
            // Restore schema before any capture or recovery interaction. This
            // also handles a DDL commit whose promise failed after committing.
            await restoreFormsTable(sql);
          }
          stage = "error-capture";
          const png = await stableBoundaryPng(page);
          await expect(
            page.getByRole("heading", {
              name: "Yönetim ekranı açılamadı",
              exact: true,
            }),
          ).toBeVisible();
          stage = "recovery";
          await page
            .getByRole("button", { name: "Ekranı yeniden yükle", exact: true })
            .click();
          await expect(
            page.getByRole("heading", { name: "Birlikte yönet.", exact: true }),
          ).toBeVisible();
          await expect(
            page.getByRole("heading", {
              name: "Yönetim ekranı açılamadı",
              exact: true,
            }),
          ).toHaveCount(0);
          captures.set(alias, png);
        }
      } catch {
        captures.clear();
        throw Error(`${alias}: ADMIN_BOUNDARY_CAPTURE_FAILED (${stage})`);
      } finally {
        await context?.close().catch(() => undefined);
      }
    }
  }
  return captures;
}
