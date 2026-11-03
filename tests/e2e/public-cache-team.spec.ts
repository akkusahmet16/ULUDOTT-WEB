import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  buildUlujamFormDefinition,
  ulujamFields as fields,
} from "../../src/modules/applications/domain/ulujam-input";
import type { GameEditorData } from "../../src/modules/games/application/game-service";

type Revision = { id: string; revision: number };
type ApprovalTeam = Revision & {
  status: string;
  members: { id: string }[];
};

async function mutate<Result>(
  request: APIRequestContext,
  endpoint: string,
  data: unknown,
  csrfEndpoint = "/api/admin/csrf",
): Promise<Result> {
  const csrf = await request.get(csrfEndpoint);
  await expect(csrf).toBeOK();
  const { csrfToken } = await csrf.json();
  const response = await request.post(endpoint, {
    headers: {
      Origin: new URL(csrf.url()).origin,
      "x-csrf-token": csrfToken,
    },
    data,
  });
  await expect(response).toBeOK();
  return response.json();
}

test("sıcak üretim önbelleğinde takım reddi oyun listesinden ve ayrıntısından yapımcı adını hemen kaldırır", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();

  const unique = randomUUID();
  const title = `DEMO cache takım oyunu ${unique}`;
  const credit = `DEMO cache takım yapımcısı ${unique}`;
  const slug = `demo-cache-team-${unique}`;
  const formSlug = `demo-cache-team-form-${unique}`;
  let eventId: string | undefined;
  let gameId: string | undefined;
  const readEvent = async (): Promise<Revision & { status: string }> => {
    const response = await page.request.get(
      `/api/admin/events?preview=${eventId}`,
    );
    await expect(response).toBeOK();
    return response.json();
  };
  const readGame = async (): Promise<GameEditorData> => {
    const response = await page.request.get(`/api/admin/games/${gameId}`);
    await expect(response).toBeOK();
    return (await response.json()).game;
  };
  const readTeam = async (teamId: string): Promise<ApprovalTeam> => {
    const response = await page.request.get(
      `/api/admin/approvals?eventId=${eventId}`,
    );
    await expect(response).toBeOK();
    const { teams }: { teams: ApprovalTeam[] } = await response.json();
    const team = teams.find((item) => item.id === teamId);
    expect(team).toBeDefined();
    return team!;
  };

  try {
    const event = await mutate<Revision>(page.request, "/api/admin/events", {
      action: "save",
      input: {
        title: `DEMO cache takım etkinliği ${unique}`,
        slug: `demo-cache-team-event-${unique}`,
        kind: "ulujam",
        year: null,
        startsAt: "2099-01-01T00:00:00Z",
        location: "DEMO izole cache testi",
        publishAt: "2020-01-01T00:00:00Z",
        mediaId: null,
      },
    });
    eventId = event.id;
    await mutate(page.request, "/api/admin/events", {
      action: "publish",
      id: eventId,
      expectedRevision: (await readEvent()).revision,
      confirmed: true,
    });
    const form = await mutate<Revision>(page.request, "/api/admin/forms", {
      eventId,
      settings: {
        title: `DEMO cache takım formu ${unique}`,
        slug: formSlug,
        opensAt: "2020-01-01T00:00:00Z",
        closesAt: null,
        capacity: 2,
        waitlist: false,
        duplicatePolicy: "reject",
        thankYou: "DEMO izole başvuru alındı.",
        retentionDays: 1,
      },
    });
    const definition = await mutate<Revision>(
      page.request,
      `/api/admin/forms/${form.id}`,
      {
        action: "definition",
        input: buildUlujamFormDefinition(eventId),
        expectedRevision: form.revision,
      },
    );
    await mutate(page.request, `/api/admin/forms/${form.id}`, {
      action: "publish",
      expectedRevision: definition.revision,
    });
    const formResponse = await page.request.get(`/api/admin/forms/${form.id}`);
    await expect(formResponse).toBeOK();
    const publishedForm: { current: { id: string } } =
      await formResponse.json();
    const receipt = await mutate<{ team: { id: string } }>(
      request,
      "/api/ulujam/apply",
      {
        slug: formSlug,
        versionId: publishedForm.current.id,
        idempotencyKey: randomUUID(),
        answers: {
          [fields.fullName]: "DEMO izole katılımcı",
          [fields.email]: `${unique}@test.invalid`,
          [fields.phone]: "+905551234567",
          [fields.mode]: "new",
          [fields.skills]: ["software"],
          [fields.levels.software]: 3,
          [fields.teamName]: `DEMO cache takımı ${unique}`,
          [fields.expectedSize]: 2,
        },
      },
      "/api/forms/csrf",
    );
    const pendingTeam = await readTeam(receipt.team.id);
    expect(pendingTeam.members).toHaveLength(1);
    await mutate(page.request, "/api/admin/approvals", {
      kind: "team",
      id: receipt.team.id,
      decision: "approved",
      expectedRevision: pendingTeam.revision,
    });
    const game = await mutate<Revision>(page.request, "/api/admin/games", {
      eventId,
      input: {
        title,
        slug,
        description: "DEMO izole takım uygunluğu cache testi.",
        teamId: receipt.team.id,
        mediaId: null,
        itchUrl: "https://demo.itch.io/cache-team-game",
        historicalPartial: false,
        credits: [
          {
            applicationId: pendingTeam.members[0].id,
            publicationName: credit,
          },
        ],
      },
    });
    gameId = game.id;
    const draft = await readGame();
    expect(draft.historicalPartial).toBe(false);
    expect(draft.credits).toHaveLength(1);
    await mutate(
      request,
      "/api/cards/publication-consent",
      {
        token: draft.credits[0].token,
        publicationName: credit,
        consent: true,
        expectedRevision: draft.credits[0].revision,
      },
      "/api/forms/csrf",
    );
    await mutate(page.request, `/api/admin/games/${gameId}`, {
      action: "publish",
      expectedRevision: (await readGame()).revision,
    });

    // Repeat identical anonymous requests so a cross-request cache is warm.
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const path of ["/oyunlar", `/oyunlar/${slug}`]) {
        const response = await request.get(path);
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html).toContain(title);
        expect(html).toContain(credit);
      }
    }
    // Also warm the browser's client navigation, not just HTTP/Data Cache.
    await page.goto("/oyunlar");
    const card = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: title, exact: true }),
    });
    await card
      .getByRole("link", { name: "Oyun ayrıntıları", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/oyunlar/${slug}$`));
    await expect(
      page.getByText(`Yapımcılar: ${credit}`, { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Uludott ana sayfa", exact: true })
      .click();
    await expect(page).toHaveURL(new URL("/", page.url()).toString());
    const approvedTeam = await readTeam(receipt.team.id);
    expect(approvedTeam.status).toBe("approved");
    await mutate(page.request, "/api/admin/approvals", {
      kind: "team",
      id: receipt.team.id,
      decision: "rejected",
      reason: "DEMO izole uygunluk geri çekme",
      expectedRevision: approvedTeam.revision,
    });

    // The first reads after rejection must hide the already warmed projection.
    const list = await request.get("/oyunlar");
    expect(list.status()).toBe(200);
    const html = await list.text();
    expect.soft(html).not.toContain(title);
    expect.soft(html).not.toContain(credit);
    const detail = await request.get(`/oyunlar/${slug}`);
    expect.soft(detail.status()).toBe(404);
    expect.soft(await detail.text()).not.toContain(credit);
    await page.getByRole("button", { name: "Menü", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Ana menü", exact: true })
      .getByRole("link", { name: "Oyunlar", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp("/oyunlar$"));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText(`Yapımcılar: ${credit}`, { exact: true }),
    ).toHaveCount(0);
  } finally {
    try {
      if (gameId) {
        await mutate(page.request, `/api/admin/games/${gameId}`, {
          action: "unpublish",
          expectedRevision: (await readGame()).revision,
        });
      }
    } finally {
      if (eventId) {
        await mutate(page.request, "/api/admin/events", {
          action: "archive",
          id: eventId,
          expectedRevision: (await readEvent()).revision,
          confirmed: true,
        });
      }
    }
    // All records belong to this test; the harness drops its UUID database.
  }
});
