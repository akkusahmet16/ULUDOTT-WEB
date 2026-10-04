import { test, expect } from "@playwright/test";
test("ana sayfa etiketsiz ve mini oyunsuz; People bir açılış videosu ve bir fotoğraf", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".header-page-name")).toHaveCount(0);
  await expect(page.locator(".game-break")).toHaveCount(0);
  await page.goto("/ulujam");
  await expect(page.locator(".header-page-name")).toHaveText("UluJam");
  await expect(page.locator(".game-break")).toHaveCount(0);
  await page.goto("/hakkimizda");
  await expect(page.locator(".people-gallery img")).toHaveCount(8);
  const counts = await page
    .locator(".people-chapter")
    .evaluateAll((nodes) =>
      nodes.map(
        (node) =>
          new Set(
            [
              ...node.querySelectorAll(
                ".people-hero img,.people-gallery img,video",
              ),
            ].map((el) =>
              el.tagName === "VIDEO"
                ? el.getAttribute("poster")
                : el.getAttribute("src"),
            ),
          ).size,
      ),
    );
  expect(counts).toEqual(Array(8).fill(1));
});
for (const width of [390, 1440]) {
  test(`açılış ortada sabit kalır ve son12karede ayrılır ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/hakkimizda");
    const video = page.locator(".people-hero video").first();
    const track = page.locator(".people-video-track").first();
    await expect(track).toHaveCount(1);
    const geometry = await track.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      height: el.getBoundingClientRect().height,
    }));
    const at = async (offset: number) => {
      await page.evaluate((y) => scrollTo(0, y), geometry.top + offset);
    };
    await at(-900);
    await expect
      .poll(() =>
        video.evaluate((v: HTMLVideoElement) => v.duration > 0 && !v.seeking),
      )
      .toBe(true);
    for (const [offset, time] of [
      [-810, 0.02],
      [-450, 0.1],
      [-90, 0.18],
      [0, 0.2],
    ]) {
      await at(offset);
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
        .toBeCloseTo(time, 2);
    }
    const hold = geometry.height - 900;
    for (const p of [0.25, 0.7, 0.2]) {
      await at(hold * p);
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => !v.seeking))
        .toBe(true);
      await expect
        .poll(() => video.evaluate((v) => v.getBoundingClientRect().top))
        .toBeCloseTo(0, 0);
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
        .toBeCloseTo(
          await video.evaluate(
            (v: HTMLVideoElement, progress: number) =>
              12 / 60 + progress * (v.duration - 24 / 60),
            p,
          ),
          1,
        );
    }
    const time = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    await page.waitForTimeout(400);
    expect(
      await video.evaluate((v: HTMLVideoElement) => v.currentTime),
    ).toBeCloseTo(time, 2);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await at(hold);
    await expect
      .poll(() =>
        video.evaluate((v: HTMLVideoElement) => v.duration - v.currentTime),
      )
      .toBeCloseTo(12 / 60, 2);
    await at(hold + 450);
    await expect
      .poll(() => video.evaluate((v) => v.getBoundingClientRect().top))
      .toBeCloseTo(-450, 0);
    await expect
      .poll(() =>
        video.evaluate((v: HTMLVideoElement) => v.duration - v.currentTime),
      )
      .toBeCloseTo(6.5 / 60, 2);
    await at(hold * 0.5);
    await expect
      .poll(() => video.evaluate((v) => v.getBoundingClientRect().top))
      .toBeCloseTo(0, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    expect(
      await track.evaluate((el) => el.getBoundingClientRect().height),
    ).toBe(900);
  });
}
test("sekiz açılış kısa ekranda ortada kalır ve metin taşmaz", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 450 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/hakkimizda");
  for (const track of await page.locator(".people-video-track").all()) {
    await track.evaluate((el) => {
      const r = el.getBoundingClientRect();
      scrollTo(0, r.top + scrollY + (r.height - innerHeight) * 0.5);
    });
    await expect
      .poll(() =>
        track
          .locator(".people-hero")
          .evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBeCloseTo(0, 0);
    const bounds = await track.locator(".people-copy").evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
    }));
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.bottom).toBeLessThanOrEqual(450);
  }
});
