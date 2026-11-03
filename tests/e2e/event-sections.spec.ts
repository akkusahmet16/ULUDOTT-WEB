import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Yönetim modülleri" }),
  ).toBeVisible();
}
async function mutate(page: Page, endpoint: string, data: unknown) {
  const csrfResponse = await page.request.get("/api/admin/csrf");
  const { csrfToken } = await csrfResponse.json();
  const response = await page.request.post(endpoint, {
    headers: {
      "x-csrf-token": csrfToken,
      Origin: new URL(csrfResponse.url()).origin,
    },
    data,
  });
  expect(response.ok()).toBe(true);
  return response.json();
}

test("Etkinlikler sayfasında yaklaşan ve geçmiş kayıtlar ayrı başlıklar altında gösterilir", async ({
  page,
}) => {
  await login(page);
  const created: string[] = [];
  try {
    for (const [title, slug, startsAt, endsAt] of [
      [
        "Gelecek topluluk buluşması",
        "event-sections-future",
        "2099-01-01T10:00:00Z",
        "2099-01-01T12:00:00Z",
      ],
      [
        "Geçmiş topluluk buluşması",
        "event-sections-past",
        "2020-01-01T10:00:00Z",
        "2020-01-01T12:00:00Z",
      ],
    ]) {
      const record = await mutate(page, "/api/admin/events", {
        action: "save",
        input: {
          title,
          slug,
          kind: "general",
          startsAt,
          endsAt,
          location: "Topluluk salonu",
        },
      });
      created.push(record.id);
      await mutate(page, "/api/admin/events", {
        action: "publish",
        id: record.id,
        expectedRevision: record.revision,
        confirmed: true,
      });
    }
    await page.goto("/etkinlikler");
    const upcoming = page.getByRole("region", {
      name: "Yaklaşan etkinlikler",
      exact: true,
    });
    const past = page.getByRole("region", {
      name: "Geçmiş etkinlikler",
      exact: true,
    });
    await expect(
      upcoming.getByRole("heading", {
        name: "Yaklaşan Etkinlikler",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      past.getByRole("heading", { name: "Geçmiş Etkinlikler", exact: true }),
    ).toBeAttached();
    await expect(
      upcoming.getByRole("article", {
        name: "Gelecek topluluk buluşması",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      upcoming.getByRole("article", {
        name: "Geçmiş topluluk buluşması",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      past.getByRole("article", {
        name: "Geçmiş topluluk buluşması",
        exact: true,
      }),
    ).toBeAttached();
    await expect(
      past.getByRole("article", {
        name: "Gelecek topluluk buluşması",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  } finally {
    for (const id of created) {
      const current = await (
        await page.request.get(`/api/admin/events?preview=${id}`)
      ).json();
      await mutate(page, "/api/admin/events", {
        action: "archive",
        id,
        expectedRevision: current.revision,
        confirmed: true,
      });
    }
  }
});

test("sosyal medya videosu panelden gizlenir ve dosya korunarak yeniden açılabilir", async ({
  page,
}) => {
  await login(page);
  const slot = "chapter:sosyal-medya-ekip";
  const original = (
    await (await page.request.get("/api/admin/people")).json()
  ).items.find((item: { slot: string }) => item.slot === slot);
  async function editor() {
    await page.goto("/admin/people");
    await page
      .getByRole("button", { name: "Bölüm ve videolar", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Bölüm filtresi", exact: true })
      .selectOption("sosyal-medya-ekip");
    const item = page.locator(".people-editor-item:not([hidden])");
    await item.locator(":scope > summary").click();
    return item;
  }
  try {
    let item = await editor();
    await expect(
      item.getByRole("checkbox", {
        name: "Açılış videosunu sitede göster",
        exact: true,
      }),
    ).not.toBeChecked();
    await item
      .getByRole("checkbox", {
        name: "Açılış videosunu sitede göster",
        exact: true,
      })
      .check();
    await item.getByRole("button", { name: "Kaydet", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("kaydedildi");
    await page.goto("/hakkimizda");
    await expect(
      page
        .getByRole("region", { name: "Sosyal Medya", exact: true })
        .locator("video"),
    ).toHaveAttribute("src", original.fields.video);
    item = await editor();
    await item
      .getByRole("checkbox", {
        name: "Açılış videosunu sitede göster",
        exact: true,
      })
      .uncheck();
    await item.getByRole("button", { name: "Kaydet", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("kaydedildi");
    await page.goto("/hakkimizda");
    const social = page.getByRole("region", {
      name: "Sosyal Medya",
      exact: true,
    });
    await expect(
      social.getByRole("heading", { name: "Sosyal Medya", exact: true }),
    ).toBeAttached();
    await expect(social.locator("video")).toHaveCount(0);
    await expect(
      social.getByRole("heading", { name: "Ahmet Akkuş", exact: true }),
    ).toBeAttached();
    const saved = (
      await (await page.request.get("/api/admin/people")).json()
    ).items.find((record: { slot: string }) => record.slot === slot);
    expect(saved.fields.video).toBe(original.fields.video);
    expect(saved.fields.videoVisible).toBe(false);
  } finally {
    const current = (
      await (await page.request.get("/api/admin/people")).json()
    ).items.find((item: { slot: string }) => item.slot === slot);
    await mutate(page, "/api/admin/people", {
      action: "save",
      slot,
      fields: original.fields,
      expectedRevision: current.revision,
    });
  }
});
