import { randomUUID } from "node:crypto";
import { test, expect, type Locator, type Page } from "@playwright/test";
import { z } from "zod";
import { ulujamSettingsSchema } from "../../src/modules/site-settings/domain/ulujam";

const settingSchema = z.object({
  data: ulujamSettingsSchema,
  revision: z.int().nonnegative(),
});
const eventSchema = z.object({ id: z.uuid(), revision: z.int().positive() });

async function mutate(page: Page, endpoint: string, data: unknown) {
  const csrfResponse = await page.request.get("/api/admin/csrf");
  await expect(csrfResponse).toBeOK();
  const { csrfToken } = z
    .object({ csrfToken: z.string() })
    .parse(await csrfResponse.json());
  const response = await page.request.post(endpoint, {
    headers: {
      "x-csrf-token": csrfToken,
      Origin: new URL(csrfResponse.url()).origin,
    },
    data,
  });
  await expect(response).toBeOK();
  return response.json();
}

async function readSetting(page: Page) {
  const response = await page.request.get("/api/admin/ulujam-settings");
  await expect(response).toBeOK();
  return settingSchema.parse(await response.json());
}

async function readCountdown(countdown: Locator, start: Date) {
  const snapshot = await countdown.evaluate((node) => ({
    text: node.textContent ?? "",
    now: Date.now(),
  }));
  const parts = snapshot.text.match(/\d+/g)?.map(Number);
  expect(parts).toHaveLength(4);
  if (!parts) throw Error("Sayaç metni çözülemedi");
  const seconds = parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60 + parts[3];
  expect(
    Math.abs(seconds - Math.ceil((start.getTime() - snapshot.now) / 1000)),
  ).toBeLessThanOrEqual(1);
  return seconds;
}

test("sıcak önbellekte sayaç her istekte taze başlar, ilerler ve üç evrede hidrasyon hatası vermez", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrat|mismatch|server.render/i.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri" }),
  ).toBeVisible();

  const original = await readSetting(page);
  const inventoryResponse = await page.request.get("/api/admin/events");
  await expect(inventoryResponse).toBeOK();
  const inventory = z
    .object({ items: z.array(z.object({ year: z.int().nullable() })) })
    .parse(await inventoryResponse.json());
  const usedYears = new Set([
    original.data.year,
    ...inventory.items.map((event) => event.year),
  ]);
  const year = Array.from({ length: 201 }, (_, index) => 2200 - index).find(
    (candidate) => !usedYears.has(candidate),
  );
  if (year === undefined) throw Error("Sayaç testi için boş UluJam yılı yok");
  const suffix = randomUUID();
  const start = new Date(Date.now() + 3_600_000);
  const input = {
    title: "DEMO cache sayacı " + suffix,
    slug: "cache-countdown-" + suffix,
    kind: "ulujam",
    year,
    location: "Yalnız sayaç test konumu",
    mediaId: null,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 3_600_000).toISOString(),
    publishAt: new Date(Date.now() - 60_000).toISOString(),
  };
  let eventId: string | undefined;
  let presentationTouched = false;
  try {
    const created = eventSchema.parse(
      await mutate(page, "/api/admin/events", { action: "save", input }),
    );
    eventId = created.id;
    presentationTouched = true;
    await mutate(page, "/api/admin/ulujam-settings", {
      input: { ...original.data, year },
      expectedRevision: original.revision,
    });
    await page.goto("/ulujam");
    const currentYear = page.getByRole("region", {
      name: `UluJam ${year}`,
      exact: true,
    });
    await expect(
      currentYear.getByText("Yakında", { exact: true }),
    ).toBeVisible();

    const published = eventSchema.parse(
      await mutate(page, "/api/admin/events", {
        action: "publish",
        id: eventId,
        expectedRevision: created.revision,
        confirmed: true,
      }),
    );
    // Warm the data cache before either freshness sample.
    const warm = await page.request.get("/ulujam");
    await expect(warm).toBeOK();
    await warm.body();
    const initialTimes: number[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const before = Date.now();
      const response = await page.request.get("/ulujam");
      await expect(response).toBeOK();
      const html = (await response.text()).replaceAll('\\"', '"');
      const initialNow = /"initialNow":"([^"\\]+)"/.exec(html)?.[1];
      expect(initialNow).toBeDefined();
      const serverNow = Date.parse(initialNow ?? "");
      expect(serverNow).toBeGreaterThanOrEqual(before - 1000);
      expect(serverNow).toBeLessThanOrEqual(Date.now() + 1000);
      initialTimes.push(serverNow);

      await page.goto("/ulujam");
      const countdown = currentYear.getByLabel("Etkinliğe kalan süre");
      await expect(countdown).toBeVisible();
      const seconds = await readCountdown(countdown, start);
      await page.waitForTimeout(1200);
      expect(await readCountdown(countdown, start)).toBeLessThan(seconds);
    }
    expect(initialTimes[1] - initialTimes[0]).toBeGreaterThanOrEqual(1000);

    const started = eventSchema.parse(
      await mutate(page, "/api/admin/events", {
        action: "save",
        id: eventId,
        expectedRevision: published.revision,
        input: {
          ...input,
          startsAt: new Date(Date.now() - 60_000).toISOString(),
        },
      }),
    );
    await page.goto("/ulujam");
    await expect(
      currentYear.getByText("Etkinlik başladı.", { exact: true }),
    ).toBeVisible();
    await mutate(page, "/api/admin/events", {
      action: "draft",
      id: eventId,
      expectedRevision: started.revision,
      confirmed: true,
    });
    await page.goto("/ulujam");
    await expect(
      currentYear.getByText("Yakında", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    try {
      if (presentationTouched) {
        const current = await readSetting(page);
        await mutate(page, "/api/admin/ulujam-settings", {
          input: original.data,
          expectedRevision: current.revision,
        });
        expect((await readSetting(page)).data).toEqual(original.data);
      }
    } finally {
      if (eventId) {
        const response = await page.request.get(
          "/api/admin/events?preview=" + eventId,
        );
        await expect(response).toBeOK();
        const current = eventSchema.parse(await response.json());
        await mutate(page, "/api/admin/events", {
          action: "archive",
          id: eventId,
          expectedRevision: current.revision,
          confirmed: true,
        });
      }
    }
  }
});
