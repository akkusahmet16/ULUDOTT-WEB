import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440])
  test(`yüklenen afişler ve başkan medyası ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("img", {
        name: "Uludott Valorant turnuvası afişi",
        exact: true,
      }),
    ).toHaveCount(0);
    const meeting = page.locator('a[href="/etkinlikler"]').filter({
      has: page.getByRole("heading", {
        name: "Sohbet et. Yeni şeyler dene.",
      }),
    });
    const meetingPoster = meeting.locator("img");
    await expect(meetingPoster).toHaveAttribute(
      "src",
      /etkinlik-coffe-talk-afis/,
    );
    const meetingRatio = await meetingPoster.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.height / r.width;
    });
    expect(meetingRatio).toBeCloseTo(1.25, 2);
    await page.goto("/etkinlikler");
    const coffee = page.getByRole("region", {
      name: "Coffee Talk etkinliği",
      exact: true,
    });
    await expect(
      coffee.getByText("7 Ekim · Çarşamba", { exact: true }),
    ).toBeVisible();
    await expect(
      coffee.getByText("18.00–20.30", { exact: true }),
    ).toBeVisible();
    await expect(
      coffee.getByText("Nest’o Coffee Roastery", { exact: true }),
    ).toBeVisible();
    const placement = await coffee.evaluate((el) => {
      const image = el.querySelector("img")!.getBoundingClientRect();
      const text = el
        .querySelector(".coffee-talk-info")!
        .getBoundingClientRect();
      return {
        image: { right: image.right, bottom: image.bottom },
        text: { left: text.left, top: text.top },
      };
    });
    if (width === 1440)
      expect(placement.text.left).toBeGreaterThan(placement.image.right);
    else
      expect(placement.text.top).toBeGreaterThanOrEqual(placement.image.bottom);
    const poster = page.getByRole("img", {
      name: "Uludott tanışma etkinliği — Coffee Talk afişi",
      exact: true,
    });
    await expect(poster).toBeVisible();
    const ratio = await poster.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.height / r.width;
    });
    expect(ratio).toBeCloseTo(1.25, 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
    expect((await page.request.get("/duyurular")).status()).toBe(404);
    await page.goto("/hakkimizda");
    const chair = page.getByRole("region", {
      name: "Hamza Yiğit Adıgüzel",
      exact: true,
    });
    await expect(chair.locator("video")).toHaveCount(1);
    await expect(chair.locator("video")).toHaveAttribute(
      "src",
      /baskan-yigit-acilis.mp4/,
    );
    await expect(chair.locator(".people-gallery img")).toHaveCount(1);
    await expect(chair.locator(".people-gallery img")).toHaveAttribute(
      "alt",
      /Hamza Yiğit Adıgüzel detay fotoğrafı/,
    );
  });
