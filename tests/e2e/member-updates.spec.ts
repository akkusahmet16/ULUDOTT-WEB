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
test("üyeler teslim sırası, bilgileri ve eksik medya referanslarıyla doludur", async ({
  page,
  request,
}) => {
  await page.goto("/hakkimizda");
  const chapters = page.locator(".people-chapter");
  await expect(chapters.locator("h2")).toHaveText([
    "Hamza Yiğit Adıgüzel",
    "Batuhan Özdemir",
    "Sosyal Medya Ekibi",
    "Etkinlik Ekibi",
    "Halis Can Sağır",
  ]);
  await expect(chapters.nth(1)).toContainText("Uludott Dergi Yazarı");
  await expect(chapters.nth(2).locator(".people-detail h3")).toHaveText([
    "Ahmet Akkuş",
    "Melek",
    "Emir",
  ]);
  await expect(chapters.nth(3).locator(".people-detail h3")).toHaveText([
    "Efe Tutucu",
    "Aybey",
  ]);
  for (let i = 0; i < 5; i++) {
    await expect(chapters.nth(i).locator("video")).toHaveCount(1);
    await expect(chapters.nth(i).locator(".people-gallery img")).toHaveCount(
      [1, 1, 3, 2, 1][i],
    );
    for (const selector of ["video", ".people-gallery img"]) {
      const src = await chapters
        .nth(i)
        .locator(selector)
        .first()
        .getAttribute("src");
      expect((await request.get(src!)).status()).toBe(200);
    }
  }
  await expect(chapters.nth(1).locator("video")).toHaveAttribute(
    "src",
    /baskan-yard-batu-acilis/,
  );
  await expect(chapters.nth(4).locator(".people-gallery img")).toHaveAttribute(
    "src",
    /cayci-halis-detay/,
  );
  for (const i of [2, 3]) {
    await expect(chapters.nth(i).locator("video")).toHaveAttribute(
      "src",
      /theme\/reference/,
    );
    for (const image of await chapters
      .nth(i)
      .locator(".people-gallery img")
      .all())
      await expect(image).toHaveAttribute("src", /theme\/reference/);
  }
});
