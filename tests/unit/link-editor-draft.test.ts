import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
import { expect, it } from "vitest";

// Reuse the repository's installed build tool; no app server or real API is used.
const require = createRequire(import.meta.url);
const toolRequire = createRequire(require.resolve("drizzle-kit"));
const { build } = toolRequire("esbuild") as {
  build(
    options: Record<string, unknown>,
  ): Promise<{ outputFiles: { text: string }[] }>;
};

it("yeni bağlantıda kategori değiştirince başlık, adres, açıklama ve yayın aralığı korunur", async () => {
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { LinkEditor } from './src/modules/links/ui/link-editor';
        createRoot(document.getElementById('app')).render(React.createElement(LinkEditor));`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    banner: { js: "var process = { env: {} };" },
    define: { "process.env.NODE_ENV": '"test"' },
    logLevel: "silent",
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent('<div id="app"></div>');
    await page.evaluate(() => {
      window.fetch = async (input, options) => {
        if (
          String(input) !== "/api/admin/links" ||
          (options?.method && options.method !== "GET")
        )
          throw Error("Bu test yalnız sabit listeyi okuyabilir");
        return Response.json({
          groups: [
            {
              id: "40000000-0000-4000-8000-000000000001",
              title: "İlk kategori",
              position: 0,
              revision: 1,
            },
            {
              id: "40000000-0000-4000-8000-000000000002",
              title: "İkinci kategori",
              position: 1,
              revision: 1,
            },
          ],
          links: [],
        });
      };
    });
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page
      .waitForFunction(
        () => document.querySelector("#app")?.childElementCount || undefined,
      )
      .catch((error) => {
        expect(errors).toEqual([]);
        throw error;
      });
    expect(errors).toEqual([]);
    const editor = page.getByRole("region", {
      name: "Bağlantı düzenleyici",
      exact: true,
    });
    await editor.getByLabel("Bağlantı başlığı").fill("Oyun gecesi");
    await editor
      .getByLabel("Adres", { exact: true })
      .fill("https://example.com/gece");
    await editor
      .getByLabel("Açıklama", { exact: true })
      .fill("Birlikte oynuyoruz.");
    await editor.getByLabel("Başlangıç (İstanbul)").fill("2030-01-01T12:00");
    await editor.getByLabel("Bitiş (İstanbul)").fill("2030-01-02T12:00");
    await editor
      .getByRole("combobox", { name: /^Kategori/ })
      .selectOption("40000000-0000-4000-8000-000000000002");
    expect(await editor.getByLabel("Bağlantı başlığı").inputValue()).toBe(
      "Oyun gecesi",
    );
    expect(await editor.getByLabel("Adres", { exact: true }).inputValue()).toBe(
      "https://example.com/gece",
    );
    expect(
      await editor.getByLabel("Açıklama", { exact: true }).inputValue(),
    ).toBe("Birlikte oynuyoruz.");
    expect(await editor.getByLabel("Başlangıç (İstanbul)").inputValue()).toBe(
      "2030-01-01T12:00",
    );
    expect(await editor.getByLabel("Bitiş (İstanbul)").inputValue()).toBe(
      "2030-01-02T12:00",
    );
    expect(
      await editor.getByRole("combobox", { name: /^Kategori/ }).inputValue(),
    ).toBe("40000000-0000-4000-8000-000000000002");
  } finally {
    await browser.close();
  }
});
