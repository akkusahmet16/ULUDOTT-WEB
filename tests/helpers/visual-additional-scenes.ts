import { expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { VisualMediaFixture } from "./visual-media-fixture.ts";
import type { VisualStateScene } from "./visual-state-scenes.ts";

export function visualAdditionalScenes(
  media: VisualMediaFixture,
): VisualStateScene[] {
  const library = (page: Page) =>
    page.getByRole("region", { name: "Medya kütüphanesi", exact: true });
  const privateCard = (page: Page) =>
    library(page)
      .getByRole("article")
      .filter({
        has: page.getByRole("heading", {
          name: "DEMO özel onaylı afiş",
          exact: true,
        }),
      });
  return [
    ...[
      {
        alias: "publish",
        trigger: "Yayın etkisini göster",
        dialog: "Yayın etkisi",
      },
      {
        alias: "archive",
        trigger: "Yayından kaldır / arşivle",
        dialog: "Yayından kaldırma",
      },
      { alias: "cancel", trigger: "İptal et", dialog: "Etkinlik iptali" },
    ].map(({ alias, trigger, dialog }): VisualStateScene => ({
      alias: "state-event-dialog-" + alias,
      path: "/admin/etkinlikler",
      prepare: async (page) => {
        const workspace = page.getByRole("region", {
          name: "Etkinlik yönetimi çalışma alanı",
          exact: true,
        });
        await workspace
          .getByRole("article", { name: "DEMO gelecek buluşma", exact: true })
          .getByRole("button", { name: "Düzenle", exact: true })
          .click();
        await expect(
          workspace.getByLabel("Başlık", { exact: true }),
        ).toHaveValue("DEMO gelecek buluşma");
        if (alias === "cancel")
          await workspace
            .getByText("Diğer durum işlemleri", { exact: true })
            .click();
        await page.getByRole("button", { name: trigger, exact: true }).click();
        await expect(
          page.getByRole("dialog", { name: dialog, exact: true }),
        ).toBeVisible();
      },
    })),
    {
      alias: "state-media-private",
      path: "/admin/medya",
      prepare: async (page) => {
        await privateCard(page).scrollIntoViewIfNeeded();
        await expect(
          privateCard(page).getByText("Özel", { exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-media-publication-dialog",
      path: "/admin/medya",
      prepare: async (page) => {
        await privateCard(page)
          .getByRole("button", { name: "Yayımla", exact: true })
          .click();
        await expect(
          page.getByRole("dialog", { name: "Görsel yayını", exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "state-media-delete-preview",
      path: "/admin/medya",
      prepare: async (page) => {
        await privateCard(page)
          .getByRole("button", { name: "Silme etkisini göster", exact: true })
          .click();
        await expect(
          privateCard(page).getByText("Bağlı içerik: 0", { exact: true }),
        ).toBeVisible();
        await expect(
          privateCard(page).getByRole("button", {
            name: "Silmeyi onayla",
            exact: true,
          }),
        ).toBeEnabled();
      },
    },
    ...["pending", "error"].map((state): VisualStateScene => ({
      alias: "state-media-upload-" + state,
      path: "/admin/medya",
      prepare: async (page) => {
        const variant = media.variants[0];
        await page.getByLabel("Görsel dosyası", { exact: true }).setInputFiles({
          name: "DEMO-onayli-afis.webp",
          mimeType: variant.mime,
          buffer: await readFile("public" + variant.publicPath),
        });
        await page
          .getByLabel("Alt metin", { exact: true })
          .fill("DEMO onaylı afiş yükleme");
        await page.route("**/api/admin/media", (route) => {
          if (route.request().method() !== "POST") return route.fallback();
          if (state === "error")
            return route.fulfill({
              status: 500,
              json: { error: "İşlem tamamlanamadı" },
            });
        });
        const request = page.waitForRequest(
          (r) =>
            r.method() === "POST" &&
            new URL(r.url()).pathname === "/api/admin/media",
        );
        await page.getByRole("button", { name: "Yükle", exact: true }).click();
        await request;
        if (state === "pending")
          await expect(
            page.getByRole("button", { name: "İşleniyor…", exact: true }),
          ).toBeDisabled();
        else
          await expect(page.getByRole("status")).toHaveText(
            "İşlem tamamlanamadı",
          );
      },
    })),
  ];
}
