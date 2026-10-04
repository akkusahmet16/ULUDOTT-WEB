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
test("video yalnız kaydırmayla ilerler, durur ve geri sarar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/hakkimizda");
  const video = page.locator(".people-hero video").first();
  const geometry = await video.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    height: el.getBoundingClientRect().height,
  }));
  const frame = async (p: number) => {
    await page.evaluate(
      ({ top, height, p }) =>
        scrollTo(0, top - innerHeight + (height + innerHeight) * p),
      { ...geometry, p },
    );
  };
  await frame(0.3);
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => v.duration > 0 && !v.seeking),
    )
    .toBe(true);
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => v.currentTime / v.duration),
    )
    .toBeCloseTo(0.3, 1);
  const before = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await page.waitForTimeout(400);
  expect(
    await video.evaluate((v: HTMLVideoElement) => v.currentTime),
  ).toBeCloseTo(before, 1);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await frame(0.7);
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => v.currentTime / v.duration),
    )
    .toBeCloseTo(0.7, 1);
  await frame(0.2);
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => v.currentTime / v.duration),
    )
    .toBeCloseTo(0.2, 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await frame(0.8);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});
