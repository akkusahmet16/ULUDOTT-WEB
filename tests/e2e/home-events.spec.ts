import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function mutate(page: Page, body: unknown) {
  const { csrfToken } = await (
    await page.request.get("/api/admin/csrf")
  ).json();
  const response = await page.request.post("/api/admin/events", {
    headers: { "x-csrf-token": csrfToken, Origin: new URL(page.url()).origin },
    data: body,
  });
  expect(response.ok()).toBe(true);
  return response.json();
}

for (const width of [1440, 390]) {
  test(`ana sayfa tarih ayrımı, tek kart kaydırma ve 5 saniyelik geçiş ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/admin");
    await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Yönetim modülleri" }),
    ).toBeVisible();
    const ids: string[] = [];
    try {
      for (const [title, slug, start, end] of [
        [
          "HOME Yaklaşan A",
          "home-upcoming-a",
          "2099-01-01T10:00:00Z",
          "2099-01-01T12:00:00Z",
        ],
        [
          "HOME Yaklaşan B",
          "home-upcoming-b",
          "2099-01-02T10:00:00Z",
          "2099-01-02T12:00:00Z",
        ],
        [
          "HOME Geçmiş yeni",
          "home-past-new",
          "2025-02-01T10:00:00Z",
          "2025-02-01T12:00:00Z",
        ],
        [
          "HOME Geçmiş eski",
          "home-past-old",
          "2025-01-01T10:00:00Z",
          "2025-01-01T12:00:00Z",
        ],
      ]) {
        const saved = await mutate(page, {
          action: "save",
          input: {
            title,
            slug: `${slug}-${width}`,
            kind: "general",
            startsAt: start,
            endsAt: end,
            location: "Test salonu",
            publishAt: "2020-01-01T00:00:00Z",
          },
        });
        ids.push(saved.id);
        await mutate(page, {
          action: "publish",
          id: saved.id,
          expectedRevision: saved.revision,
          confirmed: true,
        });
      }
      await page.goto("/");
      const upcoming = page.getByRole("region", {
        name: "Yaklaşan etkinlikler",
        exact: true,
      });
      const world = page.getByRole("region", {
        name: "People ve Places",
        exact: true,
      });
      const past = page.getByRole("region", {
        name: "Geçmiş etkinlikler",
        exact: true,
      });
      await expect(
        upcoming.getByRole("heading", { name: "HOME Yaklaşan A", exact: true }),
      ).toBeAttached();
      await expect(
        upcoming.getByRole("heading", { name: "HOME Yaklaşan B", exact: true }),
      ).toBeAttached();
      await expect(
        upcoming.getByText("HOME Geçmiş yeni", { exact: true }),
      ).toHaveCount(0);
      const boxes = await Promise.all([
        upcoming.boundingBox(),
        world.boundingBox(),
        past.boundingBox(),
      ]);
      expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
      expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
      const a = await upcoming
        .getByRole("article", { name: "HOME Yaklaşan A", exact: true })
        .boundingBox();
      const b = await upcoming
        .getByRole("article", { name: "HOME Yaklaşan B", exact: true })
        .boundingBox();
      expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
      await past.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await expect(past.getByRole("article")).toHaveCount(1);
      await expect(
        past.getByRole("heading", { name: "HOME Geçmiş yeni", exact: true }),
      ).toBeVisible();
      const firstVisibleAt = Date.now();
      await page.screenshot({ path: `.local/home-events-${width}.png` });
      await expect(
        past.getByRole("heading", { name: "HOME Geçmiş eski", exact: true }),
      ).toBeVisible({ timeout: 7000 });
      expect(Date.now() - firstVisibleAt).toBeGreaterThan(4300);
      await past
        .getByRole("button", { name: "Otomatik geçişi duraklat", exact: true })
        .click();
      const track = past.getByRole("group", {
        name: "Etkinlikleri kaydır",
        exact: true,
      });
      await track.focus();
      await page.keyboard.press("ArrowRight");
      await expect(
        past.getByRole("heading", { name: "HOME Geçmiş yeni", exact: true }),
      ).toBeVisible();
      await page.waitForTimeout(5200);
      await expect(
        past.getByRole("heading", { name: "HOME Geçmiş yeni", exact: true }),
      ).toBeVisible();
      await past
        .getByRole("button", { name: "Sonraki etkinlik", exact: true })
        .click();
      await expect(
        past.getByRole("heading", { name: "HOME Geçmiş eski", exact: true }),
      ).toBeVisible();
      await track.scrollIntoViewIfNeeded();
      const box = await track.boundingBox();
      await expect
        .poll(() => track.evaluate((element) => Math.round(element.scrollLeft)))
        .toBe(Math.round(box!.width));
      await page.mouse.move(
        box!.x + box!.width / 2,
        Math.max(
          120,
          Math.min(page.viewportSize()!.height - 120, box!.y + box!.height / 2),
        ),
      );
      await page.mouse.wheel(-box!.width, 0);
      await expect(
        past.getByRole("heading", { name: "HOME Geçmiş yeni", exact: true }),
      ).toBeVisible();
      expect(
        (
          await new AxeBuilder({ page })
            .include('section[aria-label="Geçmiş etkinlikler"]')
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    } finally {
      await page.goto("/admin");
      const { items } = await (
        await page.request.get("/api/admin/events")
      ).json();
      for (const event of items.filter((item: { id: string }) =>
        ids.includes(item.id),
      ))
        await mutate(page, {
          action: "archive",
          id: event.id,
          expectedRevision: event.revision,
          confirmed: true,
        });
    }
  });
}
