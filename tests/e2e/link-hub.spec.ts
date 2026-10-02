import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import jsQR from "jsqr";
test("mobil bağlantı merkezi: kategori, sıra, kopyalama, QR, gizleme ve klavye", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("44444444444444444444444444444444");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  await page.goto("/admin/linkler");
  await page.getByLabel("Kategori başlığı").fill("Test kategorisi");
  await page
    .getByRole("button", { name: "Kategoriyi kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  await page.getByLabel("Bağlantı başlığı").fill("Topluluk test bağlantısı");
  await page.getByLabel("Adres", { exact: true }).fill("/hakkimizda");
  await page.getByLabel("Öne çıkar").check();
  await page.getByLabel("Yayımla").check();
  await page
    .getByRole("button", { name: "Bağlantıyı kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  await page
    .getByRole("button", { name: "Yeni bağlantı", exact: true })
    .click();
  await page.getByLabel("Bağlantı başlığı").fill("Dış test bağlantısı");
  await page
    .getByLabel("Adres", { exact: true })
    .fill("https://example.com/test");
  await page.getByLabel("Yayımla").check();
  await page.getByLabel("Dış adresi doğruladım").check();
  await page
    .getByRole("button", { name: "Bağlantıyı kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kaydedildi");
  const ext = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Dış test bağlantısı",
        exact: true,
      }),
    });
  await ext.getByRole("button", { name: "Yukarı taşı", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Sıra güncellendi");
  const qrRequests: string[] = [];
  page.on("request", (request) => { if (/\/api\/links\/[^/]+\/qr$/.test(request.url())) qrRequests.push(request.url()); });
  await page.goto("/linkler");
  await expect(
    page.getByRole("heading", { name: "Uludott bağlantıları", exact: true }),
  ).toBeVisible();
  const external = page.getByRole("link", {
    name: "Dış test bağlantısı",
    exact: true,
  });
  await expect(external).toHaveAttribute("rel", /noopener/);
  await expect(external).toHaveAttribute("target", "_blank");
  await expect(
    page
      .getByRole("region", { name: "Test kategorisi" })
      .getByRole("article")
      .first(),
  ).toContainText("Dış test bağlantısı");
  const featured = page
    .getByRole("region", { name: "Öne çıkan bağlantılar" })
    .getByRole("article")
    .first();
  await featured
    .getByRole("button", { name: "Adresi kopyala", exact: true })
    .click();
  await expect(featured.getByRole("status")).toContainText("Kopyalandı");
  expect(qrRequests).toHaveLength(0);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: async () => { throw new Error("unavailable"); } }));
  await featured.getByRole("button", { name: "Adresi kopyala", exact: true }).click();
  await expect(featured.getByLabel("Kopyalanacak adres")).toHaveValue(copied);
  await featured.getByLabel("Kopyalanacak adres").focus();
  expect(await featured.getByLabel("Kopyalanacak adres").evaluate((input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!)).toBe(copied.length);
  expect(copied).toMatch(/\/l\/[0-9a-f-]{36}$/);
  await featured.getByRole("button", { name: "QR kodu", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Bağlantı QR kodu" });
  await expect(dialog.getByRole("img")).toBeVisible();
  const src = await dialog.getByRole("img").getAttribute("src");
  const result = await page.request.get(src!);
  expect(result.status()).toBe(200);
  const { data, info } = await sharp(await result.body())
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data).toBe(
    copied,
  );
  await page.keyboard.press("Escape");
  await expect(
    featured.getByRole("button", { name: "QR kodu", exact: true }),
  ).toBeFocused();
  const redirect = await page.request.get(copied, { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers().location).toMatch(/\/hakkimizda$/);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".local/task7-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".local/task7-desktop.png", fullPage: true });
  await page.goto("/admin/linkler");
  const card = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Topluluk test bağlantısı",
        exact: true,
      }),
    });
  await card.getByRole("button", { name: "Düzenle", exact: true }).click();
  await card.getByRole("button", { name: "Gizle", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Gizlendi");
  await expect(page.getByLabel("Yayımla")).not.toBeChecked();
  expect((await page.request.get(copied)).status()).toBe(404);
  expect((await page.request.get(src!)).status()).toBe(404);
  await page.goto("/linkler");
  await expect(
    page.getByRole("link", { name: "Topluluk test bağlantısı", exact: true }),
  ).toHaveCount(0);
});
test("bağlantı API ve kısa adres keyfi URL kabul etmez", async ({
  request,
}) => {
  expect((await request.get("/api/admin/links")).status()).toBe(401);
  expect((await request.post("/api/admin/links")).status()).toBe(403);
  expect(
    (await request.get("/l/invalid?url=https://example.com")).status(),
  ).toBe(404);
  expect((await request.get("/api/links/invalid/qr")).status()).toBe(404);
});
