import { test, expect } from "@playwright/test";
for (const width of [390, 1440]) {
  test(`menü simgesi düğmede ortalanır ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const button = page.getByRole("button", { name: "Menü", exact: true });
    for (const open of [false, true]) {
      if (open) await button.click();
      await button.hover();
      const r = await button.evaluate((el) => {
        const b = el.getBoundingClientRect(),
          i = el.querySelector(".menu-lines")!.getBoundingClientRect();
        return {
          dx: Math.abs((b.left + b.right - i.left - i.right) / 2),
          dy: Math.abs((b.top + b.bottom - i.top - i.bottom) / 2),
          width: b.width,
          height: b.height,
        };
      });
      expect(r.dx).toBeLessThan(1);
      expect(r.dy).toBeLessThan(1);
      expect(r.width).toBe(48);
      expect(r.height).toBe(48);
      await expect(button).toHaveAttribute("aria-expanded", String(open));
    }
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
}
test("üyeler güncel ekip sırası ve teslim edilen detay fotoğraflarıyla görünür", async ({
  page,
  request,
}) => {
  await page.goto("/hakkimizda");
  const chapters = page.locator(".people-chapter");
  await expect(chapters.locator("h2")).toHaveText([
    "Hamza Yiğit Adıgüzel",
    "Batuhan Özdemir",
    "Sosyal Medya",
    "Halis Can Sağır",
    "Tuğçe",
  ]);
  await expect(chapters.nth(1)).toContainText("Uludott Dergi Yazarı");
  await expect(chapters.nth(2).locator(".people-detail h3")).toHaveText([
    "Ahmet Akkuş",
    "Emir",
    "Melek",
  ]);
  await expect(chapters.nth(3).locator(".people-detail h3")).toHaveText([
    "Halis Can Sağır",
    "Efe Tutucu",
    "Aybey",
    "Fatih Soyer",
    "Eren Bozacı",
  ]);
  for (let i = 0; i < 5; i++) {
    await expect(chapters.nth(i).locator("video")).toHaveCount([1, 1, 0, 1, 0][i]);
    await expect(chapters.nth(i).locator(".people-gallery img")).toHaveCount(
      [1, 1, 3, 5, 0][i],
    );
    for (const media of await chapters
      .nth(i)
      .locator("video, .people-gallery img")
      .all()) {
      const src = await media.getAttribute("src");
      expect((await request.get(src!)).status()).toBe(200);
    }
  }
  await expect(chapters.nth(1).locator("video")).toHaveAttribute(
    "src",
    /baskan-yard-batu-acilis/,
  );
  await expect(chapters.nth(4)).toContainText("Tuğçe");
  await expect(chapters.nth(4)).toContainText("BÖTE 2. sınıf");
  await expect(chapters.nth(4)).toContainText("Çaylak çaycı.");
  await expect(chapters.nth(3).locator("video")).toHaveAttribute(
    "src",
    /ed-baskan-halis-acilis/,
  );
  for (const i of [2, 3]) {
    for (const image of await chapters
      .nth(i)
      .locator(".people-gallery img")
      .all()) {
      await expect(image).toHaveAttribute(
        "src",
        /community\/03-hakkimizda\/people/,
      );
      expect(
        (await request.get((await image.getAttribute("src"))!)).status(),
      ).toBe(200);
    }
  }
  await expect(chapters.nth(1).locator(".people-gallery img")).toHaveAttribute(
    "src",
    /baskan-yard-batu-detay\.webp/,
  );
});

test("ortak menü yalnız teslim edilen iki görsel arasında geçiş yapar", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menü", exact: true }).click();
  const art = page.locator(".menu-scene-art");
  const menu = page.getByRole("navigation", { name: "Ana menü" });
  for (const name of [
    "Ana sayfa",
    "Hakkımızda",
    "UluJam",
    "Etkinlikler",
    "Oyunlar",
    "İletişim",
  ]) {
    await menu.getByRole("link", { name, exact: true }).hover();
    await expect(art).toHaveAttribute(
      "src",
      name === "Hakkımızda"
        ? "/community/00-ortak/menu-people.webp"
        : "/community/00-ortak/menu-topluluk.webp",
    );
    expect((await request.get((await art.getAttribute("src"))!)).status()).toBe(
      200,
    );
  }
});
