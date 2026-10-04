import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440])
  test(`panel pencereleri ve sayfa başlığı ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".brand img")).toHaveCount(1);
    await expect(page.locator(".header-page-name")).toHaveText("Ana sayfa");
    await page
      .getByRole("button", { name: "UluJam içeriklerini aç", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "UluJam" });
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((el) => el.getBoundingClientRect().width),
    ).toBeGreaterThan(width === 1440 ? 1000 : 350);
    await dialog.getByRole("button", { name: "İçeriği kapat" }).hover();
    expect(
      (await new AxeBuilder({ page }).include("#story-ulujam").analyze())
        .violations,
    ).toEqual([]);
    await expect(
      dialog.getByRole("heading", { name: "UluJam vlog", exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Vlogu oynat", exact: true })
      .click();
    await expect(dialog.locator("iframe")).toHaveAttribute(
      "src",
      /youtube-nocookie.com\/embed\/_ECGC1V__xo/,
    );
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "UluJam içeriklerini aç", exact: true }),
    ).toBeFocused();
    await page
      .getByRole("button", { name: "Derece oyunlarını aç", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog", { name: "Derece oyunları" })
        .getByRole("link", { name: "Tüm derece oyunları" }),
    ).toHaveAttribute("href", "/oyunlar#derece-oyunlari");
    await page.keyboard.press("Escape");
    await page.goto("/hakkimizda#yonetim-kurulu");
    await expect(page.locator(".header-page-name")).toHaveText("Hakkımızda");
    await expect(page.locator(".people-chapter")).toHaveCount(8);
    await expect(page.locator(".people-chapter video")).toHaveCount(10);
    await expect(page.locator(".people-gallery img")).toHaveCount(36);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("yanlış hafıza eşleşmesi kendiliğinden kapanır", async ({ page }) => {
  await page.goto("/");
  const game = page.getByRole("region", { name: "Hafıza eşleştirme" });
  await game
    .getByRole("button", { name: "Kart 1: kapalı", exact: true })
    .click();
  await game
    .getByRole("button", { name: "Kart 2: kapalı", exact: true })
    .click();
  await expect(
    game.getByRole("button", { name: "Kart 1: kapalı", exact: true }),
  ).toBeEnabled();
  await expect(
    game.getByRole("button", { name: "Kart 2: kapalı", exact: true }),
  ).toBeEnabled();
});

test("People galerisi aynı pencerede açılır ve klavye ile gezilir", async ({
  page,
}) => {
  await page.goto("/hakkimizda");
  const first = page.locator(".people-gallery a").first();
  await first.click();
  const gallery = page.getByRole("dialog", { name: "Fotoğraf galerisi" });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator("img")).toHaveAttribute("src", /jason-duval-01/);
  await page.keyboard.press("ArrowRight");
  await expect(gallery.locator("img")).toHaveAttribute("src", /jason-duval-02/);
  await page.keyboard.press("Escape");
  await expect(gallery).not.toBeVisible();
  await expect(first).toBeFocused();
});

test("People klipleri görünürken oynar, renk sahneyi izler", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/hakkimizda");
  const clip = page.locator(".people-clip video").first();
  await clip.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      clip.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--scene-bg")
          .trim(),
      ),
    )
    .toBe("#171923");
  await page.locator("#people-cal").scrollIntoViewIfNeeded();
  await expect
    .poll(() => clip.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--scene-bg")
          .trim(),
      ),
    )
    .toBe("#213949");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await clip.scrollIntoViewIfNeeded();
  await expect
    .poll(() => clip.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
});

test("hero videosu elle duraklatılır ve kaydırma yeniden başlatmaz", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/hakkimizda#people-jason");
  const hero = page.locator("#people-jason .people-hero"),
    video = hero.locator("video");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused))
    .toBe(true);
  await hero
    .getByRole("button", { name: "Videoyu duraklat", exact: true })
    .click({ timeout: 5000 });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await page.locator("#people-cal").scrollIntoViewIfNeeded();
  await hero.scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
});
