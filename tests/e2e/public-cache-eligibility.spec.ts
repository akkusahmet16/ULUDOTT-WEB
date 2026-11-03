import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { historical2026 } from "../../src/modules/games/domain/historical-result";
import type { GameEditorData } from "../../src/modules/games/application/game-service";

async function mutate(page: Page, endpoint: string, data: unknown) {
  const csrf = await page.request.get("/api/admin/csrf");
  expect(csrf.ok()).toBe(true);
  const { csrfToken } = await csrf.json();
  const response = await page.request.post(endpoint, {
    headers: { Origin: new URL(csrf.url()).origin, "x-csrf-token": csrfToken },
    data,
  });
  expect(response.ok(), `Fixture write ${endpoint}: ${response.status()}`).toBe(
    true,
  );
  return response.json();
}

for (const action of ["cancelled", "archive"] as const) {
  test(`sıcak üretim önbelleğinde ${action}: oyun, ad ve varsayılan derece bir sonraki istekte kaldırılır`, async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
    // This is a canonical historical fixture inside the harness's UUID DB.
    // It is not an edit to the working database's 2026 records.
    const eventId = historical2026.eventId;
    const gameId = historical2026.results[1].id;
    const endpoint = `/api/admin/games/${gameId}`;
    const readEvent = async () => {
      const response = await page.request.get(
        `/api/admin/events?preview=${eventId}`,
      );
      expect(response.ok()).toBe(true);
      return response.json();
    };
    const readGame = async (): Promise<GameEditorData> => {
      const response = await page.request.get(endpoint);
      expect(response.ok()).toBe(true);
      return (await response.json()).game;
    };
    const originalEvent = await readEvent();
    const originalGame = await readGame();
    expect(originalEvent.status).toBe("draft");
    expect(originalGame.historicalPartial).toBe(true);
    expect(originalGame.credits).toHaveLength(0);
    const title = `DEMO cache ${action} oyunu`;
    const credit = `DEMO cache ${action} yapımcısı`;
    const slug = originalGame.slugLocked
      ? originalGame.slug!
      : `demo-cache-${randomUUID()}`;
    try {
      await mutate(page, endpoint, {
        action: "save",
        expectedRevision: originalGame.revision,
        input: {
          title,
          slug,
          description: "Yalnız izole üretim cache testi.",
          teamId: null,
          editorialTeamName: "DEMO cache takımı",
          mediaId: null,
          itchUrl: originalGame.itchUrl,
          historicalPartial: false,
          credits: [{ applicationId: null, publicationName: credit }],
        },
      });
      const draft = await readGame();
      const token = draft.credits[0].token!;
      const publicCsrf = await page.request.get("/api/forms/csrf");
      const { csrfToken } = await publicCsrf.json();
      const consent = await page.request.post(
        "/api/cards/publication-consent",
        {
          headers: {
            Origin: new URL(publicCsrf.url()).origin,
            "x-csrf-token": csrfToken,
          },
          data: {
            token,
            publicationName: credit,
            consent: true,
            expectedRevision: draft.credits[0].revision,
          },
        },
      );
      expect(consent.ok()).toBe(true);
      const ready = await readGame();
      await mutate(page, endpoint, {
        action: "publish",
        expectedRevision: ready.revision,
      });
      for (let attempt = 0; attempt < 2; attempt++) {
        const list = await page.request.get("/oyunlar");
        expect(list.status()).toBe(200);
        expect(await list.text()).toContain(credit);
        const detail = await page.request.get(`/oyunlar/${slug}`);
        expect(detail.status()).toBe(200);
        expect(await detail.text()).toContain(credit);
        await page.goto("/ulujam");
        await expect(
          page
            .getByRole("region", { name: "UluJam 2026 arşivi", exact: true })
            .getByRole("heading", { name: "Lost Child Soul", exact: true }),
        ).toBeVisible();
      }
      const currentEvent = await readEvent();
      await mutate(page, "/api/admin/events", {
        action,
        id: eventId,
        expectedRevision: currentEvent.revision,
        confirmed: true,
      });
      const list = await page.request.get("/oyunlar");
      const html = await list.text();
      expect(list.status()).toBe(200);
      expect.soft(html).not.toContain(credit);
      expect.soft(html).not.toContain(title);
      const detail = await page.request.get(`/oyunlar/${slug}`);
      expect.soft(detail.status()).toBe(404);
      expect.soft(await detail.text()).not.toContain(credit);
      await page.goto("/ulujam");
      const archive = page.getByRole("region", {
        name: "UluJam 2026 arşivi",
        exact: true,
      });
      await expect(archive).toBeVisible();
      await expect
        .soft(
          archive.getByRole("heading", {
            name: "Lost Child Soul",
            exact: true,
          }),
        )
        .toHaveCount(0);
      await expect
        .soft(
          archive.getByText("Henüz yayımlanmış derece bağlantısı yok.", {
            exact: true,
          }),
        )
        .toBeVisible();
    } finally {
      // Restore status before game publication. Keep only the locked test slug
      // until the harness drops its disposable DB, as in games.spec.ts.
      const currentEvent = await readEvent();
      await mutate(page, "/api/admin/events", {
        action: "draft",
        id: eventId,
        expectedRevision: currentEvent.revision,
        confirmed: true,
      });
      const current = await readGame();
      await mutate(page, endpoint, {
        action: "save",
        expectedRevision: current.revision,
        input: {
          title: originalGame.title,
          slug: current.slugLocked ? current.slug : originalGame.slug,
          description: originalGame.description,
          teamId: originalGame.teamId,
          editorialTeamName: originalGame.editorialTeamName,
          mediaId: originalGame.mediaId,
          itchUrl: originalGame.itchUrl,
          historicalPartial: originalGame.historicalPartial,
          credits: [],
        },
      });
      if (originalGame.published) {
        const restored = await readGame();
        await mutate(page, endpoint, {
          action: "publish",
          expectedRevision: restored.revision,
        });
      }
      expect((await readEvent()).status).toBe("draft");
      expect(await readGame()).toMatchObject({
        historicalPartial: true,
        title: originalGame.title,
        credits: [],
        published: originalGame.published,
      });
    }
  });
}
