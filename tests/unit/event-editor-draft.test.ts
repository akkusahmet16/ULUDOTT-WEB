import { createServer } from "node:http";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
import { expect, it } from "vitest";

const require = createRequire(import.meta.url);
const toolRequire = createRequire(require.resolve("drizzle-kit"));
const { build } = toolRequire("esbuild") as {
  build(
    options: Record<string, unknown>,
  ): Promise<{ outputFiles: { text: string }[] }>;
};
const eventId = "40000000-0000-4000-8000-000000000001";
const formId = "40000000-0000-4000-8000-000000000002";
const categoryId = "40000000-0000-4000-8000-000000000003";

it("etkinlik düzenleyici gelişmiş ayarları göstermez ve buton bağlantısı ile buton yazısını korur", async () => {
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { EventEditor } from './src/modules/events/ui/event-editor';
        createRoot(document.getElementById('app')).render(React.createElement(EventEditor));`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    outfile: "event-editor-test.js",
    banner: { js: "var process = { env: {} };" },
    define: { "process.env.NODE_ENV": '"test"' },
    logLevel: "silent",
  });
  const event = {
    id: eventId,
    title: "Bağlı etkinlik",
    slug: "bagli-etkinlik",
    kind: "general",
    status: "draft",
    revision: 3,
    categoryId,
    formId,
    mediaId: null,
    startsAt: null,
    endsAt: null,
    publishAt: null,
    unpublishAt: null,
    description: null,
    excerpt: null,
    location: null,
    locationType: "physical",
    organizer: null,
    capacity: null,
    maxTeamSize: 6,
    featuredPosition: null,
    seo: {},
    body: "",
    eventId: null,
    ctaUrl: "/basvuru/bagli-etkinlik",
    ctaLabel: "Hemen Katıl",
    createdAt: "2026-01-01T00:00:00Z",
    year: null,
  };
  let releaseOptions!: () => void;
  const optionsReady = new Promise<void>((resolve) => {
    releaseOptions = resolve;
  });
  const unexpected: string[] = [];
  const server = createServer(async (request, response) => {
    if (request.method !== "GET") {
      unexpected.push(`${request.method} ${request.url}`);
      response.writeHead(405).end();
      return;
    }
    const url = new URL(request.url!, "http://127.0.0.1");
    const json = (data: unknown) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(data));
    };
    if (url.pathname === "/api/admin/events") {
      if (url.searchParams.has("preview")) return json(event);
      await optionsReady;
      return json({
        items: [event],
        options: { categories: [], forms: [] },
      });
    }
    if (url.pathname === "/api/admin/media") return json({ items: [] });
    if (url.pathname === "/editor.js") {
      response.writeHead(200, { "Content-Type": "text/javascript" });
      response.end(bundle.outputFiles[0].text);
      return;
    }
    if (url.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end('<div id="app"></div><script src="/editor.js"></script>');
      return;
    }
    response.writeHead(404).end();
  });
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", resolve),
  );
  const address = server.address();
  if (!address || typeof address === "string")
    throw Error("Yerel test adresi alınamadı");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/?event=${eventId}`, {
      waitUntil: "domcontentloaded",
    });
    await expect
      .poll(() =>
        page
          .getByRole("heading", { name: "Bağlı etkinlik", exact: true })
          .isVisible(),
      )
      .toBe(true);
    releaseOptions();
    await expect
      .poll(() =>
        page.getByText("1 kayıt · Tarihler İstanbul saatidir.").isVisible(),
      )
      .toBe(true);
    expect(
      await page.getByText("Gelişmiş etkinlik ayarları").count(),
    ).toBe(0);
    expect(await page.locator('input[name="slug"]').count()).toBe(0);
    await page
      .getByLabel("Başlık", { exact: true })
      .fill("Başlığı güncelledim");
    const ctaFields = await page
      .locator("#etkinlik-duzenleyici")
      .evaluate((element) => {
        const data = new FormData(element as HTMLFormElement);
        return {
          ctaUrl: data.get("ctaUrl"),
          ctaLabel: data.get("ctaLabel"),
        };
      });
    expect(ctaFields).toEqual({
      ctaUrl: "/basvuru/bagli-etkinlik",
      ctaLabel: "Hemen Katıl",
    });
    await page
      .getByLabel("Buton bağlantısı / Link (opsiyonel)", { exact: true })
      .fill("https://uludott.com.tr/basvuru/ulujam-26");
    await page
      .getByLabel("Buton yazısı (opsiyonel)", { exact: true })
      .fill("Kayıt Ol");
    expect(await page.locator('input[name="ctaUrl"]').inputValue()).toBe(
      "https://uludott.com.tr/basvuru/ulujam-26",
    );
    expect(await page.locator('input[name="ctaLabel"]').inputValue()).toBe(
      "Kayıt Ol",
    );
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  } finally {
    releaseOptions();
    await browser.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
