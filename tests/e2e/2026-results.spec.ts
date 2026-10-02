import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const urls = [
  "https://subzero-41.itch.io/lost-pieces",
  "https://kmevciman.itch.io/lostchildsoul",
  "https://kairosthegeek.itch.io/project-sw",
];
test("2026 derece kartları eksik bilgiyi uydurmadan mobil/klavye ile açılır", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  expect((await page.goto("/oyunlar"))?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Oyunlar", exact: true }),
  ).toBeVisible();
  const cards = page
    .getByRole("region", { name: "UluJam 2026 sonuçları" })
    .getByRole("article");
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    await expect(card.getByRole("heading")).toHaveText(`${i + 1}. derece`);
    await expect(
      card.getByText("Kısmi editoryal kayıt", { exact: true }),
    ).toBeVisible();
    const link = card.getByRole("link");
    await expect(link).toHaveAttribute("href", urls[i]);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener noreferrer/);
    await link.focus();
    await expect(link).toBeFocused();
  }
  await cards.nth(0).getByRole("link").focus();
  await page.keyboard.press("Tab");
  await expect(cards.nth(1).getByRole("link")).toBeFocused();
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);
  await expect(page.getByText("lost-pieces", { exact: true })).toHaveCount(0);
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
  await page.getByRole("main").focus();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: ".local/task8-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".local/task8-desktop.png", fullPage: true });
});
