import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";

async function authHeaders(page: Page) {
  const response = await page.request.get("/api/admin/csrf");
  expect(response.ok()).toBe(true);
  const { csrfToken } = await response.json();
  return {
    "x-csrf-token": csrfToken as string,
    Origin: new URL(response.url()).origin,
  };
}

async function mutate(page: Page, path: string, data: unknown) {
  const response = await page.request.post(path, {
    headers: await authHeaders(page),
    data,
  });
  expect(response.ok()).toBe(true);
  return response.json();
}

for (const width of [390, 1440])
  test(`yüklenen afişler ve başkan medyası ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin");
    await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();

    // The harness owns a separate test database. Keep the real Coffee Talk draft untouched.
    const title = `DEMO kaynak afiş yerleşim testi ${width}`;
    const altText = `Yalnız E2E testi için mevcut Coffee Talk kaynak afişi ${width}`;
    const input = {
      title,
      slug: `demo-supplied-media-${width}-${randomUUID()}`,
      kind: "general",
      startsAt: "2099-01-01T15:00:00Z",
      endsAt: "2099-01-01T17:30:00Z",
      location: "Yalnız E2E testi için sentetik konum",
    };
    let mediaId: string | undefined;
    let eventId: string | undefined;
    try {
      const source = await page.request.get(
        "/community/04-etkinlikler/etkinlik-coffe-talk/etkinlik-coffe-talk-afis.webp",
      );
      expect(source.status()).toBe(200);
      expect(source.headers()["content-type"]).toContain("image/webp");
      const buffer = await source.body();
      const upload = async () =>
        page.request.post("/api/admin/media", {
          headers: await authHeaders(page),
          multipart: {
            file: {
              name: "etkinlik-coffe-talk-afis.webp",
              mimeType: "image/webp",
              buffer,
            },
            purpose: "event-poster",
            altText,
          },
        });
      let response = await upload();
      for (
        let attempt = 0;
        response.status() === 429 && attempt < 5;
        attempt++
      ) {
        await page.waitForTimeout(300);
        response = await upload();
      }
      expect(response.status()).toBe(201);
      mediaId = (await response.json()).id;
      const publishedMedia = await mutate(page, "/api/admin/media", {
        action: "publish",
        assetId: mediaId,
        confirmed: true,
      });
      const saved = await mutate(page, "/api/admin/events", {
        action: "save",
        input: { ...input, mediaId },
      });
      eventId = saved.id;
      await mutate(page, "/api/admin/events", {
        action: "publish",
        id: eventId,
        expectedRevision: saved.revision,
        confirmed: true,
      });

      for (const path of ["/", "/etkinlikler"]) {
        await page.goto(path);
        await expect(
          page.getByRole("img", {
            name: "Uludott Valorant turnuvası afişi",
            exact: true,
          }),
        ).toHaveCount(0);
        const event = page.getByRole("article", { name: title, exact: true });
        const poster = event.getByRole("img", { name: altText, exact: true });
        await expect(poster).toBeVisible();
        await expect(poster).toHaveAttribute("src", publishedMedia.url);
        await expect(
          event.getByRole("link", {
            name: `${title} etkinliğinin ayrıntıları`,
            exact: true,
          }),
        ).toHaveAttribute("href", `/etkinlikler/${input.slug}`);
        await expect
          .poll(() =>
            poster.evaluate((image: HTMLImageElement) => ({
              width: image.naturalWidth,
              height: image.naturalHeight,
            })),
          )
          .toEqual({ width: 1080, height: 1350 });
        const ratio = await poster.evaluate((image) => {
          const rect = image.getBoundingClientRect();
          return rect.height / rect.width;
        });
        expect(ratio).toBeCloseTo(1.25, 2);
        await expect(
          event.getByText("1 Ocak Perşembe", { exact: true }),
        ).toBeVisible();
        await expect(
          event.getByText("18:00–20:30", { exact: true }),
        ).toBeVisible();
        await expect(
          event.getByText(input.location, { exact: true }),
        ).toBeVisible();
        const placement = await event.evaluate((element) => {
          const image = element.querySelector("img")!.getBoundingClientRect();
          const text = element
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
          expect(placement.text.top).toBeGreaterThanOrEqual(
            placement.image.bottom,
          );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          (await new AxeBuilder({ page }).include("main").analyze()).violations,
        ).toEqual([]);
      }
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
    } finally {
      if (eventId) {
        const response = await page.request.get(
          `/api/admin/events?preview=${eventId}`,
        );
        expect(response.ok()).toBe(true);
        const current = await response.json();
        const archived = await mutate(page, "/api/admin/events", {
          action: "archive",
          id: eventId,
          expectedRevision: current.revision,
          confirmed: true,
        });
        // Archived events still reference their media, so detach it before deletion.
        await mutate(page, "/api/admin/events", {
          action: "save",
          id: eventId,
          expectedRevision: archived.revision,
          input: { ...input, mediaId: null, featuredPosition: null },
        });
      }
      if (mediaId)
        await mutate(page, "/api/admin/media", {
          action: "delete",
          assetId: mediaId,
          confirmed: true,
        });
    }
  });
