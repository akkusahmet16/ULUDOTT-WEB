import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("2026 oyun editörü, gerçek yapımcı onayı, finalist, tam yayın ve geri çekme", async ({
  page,
  browser,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await page.getByRole("link", { name: "Oyunlar", exact: true }).click();
  await page
    .getByText("UluJam takım oyunları ve derece yönetimi", { exact: true })
    .click();
  await page
    .getByRole("link", { name: /Adsız arşiv oyunu · https:\/\/subzero-41/ })
    .click();
  await expect(page).toHaveURL(/\/admin\/oyunlar\/[a-f0-9-]{36}$/);
  const gameId = new URL(page.url()).pathname.split("/").at(-1)!;
  const endpoint = `/api/admin/games/${gameId}`;
  const readGame = async () => {
    const response = await page.request.get(endpoint);
    await expect(response).toBeOK();
    return (await response.json()).game;
  };
  const original = await readGame();
  expect(original.historicalPartial).toBe(true);
  expect(original.credits).toHaveLength(0);
  const mutate = async (data: Record<string, unknown>) => {
    const current = await readGame();
    const csrfResponse = await page.request.get("/api/admin/csrf");
    const { csrfToken } = await csrfResponse.json();
    const response = await page.request.post(endpoint, {
      headers: {
        origin: new URL(csrfResponse.url()).origin,
        "x-csrf-token": csrfToken,
      },
      data: { ...data, expectedRevision: current.revision },
    });
    await expect(response).toBeOK();
  };
  let context: BrowserContext | undefined;
  try {
    await page.getByLabel("Oyun adı", { exact: true }).fill("DEMO arşiv oyunu");
    await page
      .getByLabel("Oyun adresi", { exact: true })
      .fill("demo-archive-game");
    await page
      .getByLabel("Açıklama", { exact: true })
      .fill("DEMO doğrulanmış oyun açıklaması.");
    await page
      .getByLabel("Doğrulanmış 2026 takım adı")
      .fill("DEMO arşiv takımı");
    await page.getByLabel("Kısmi 2026 arşiv kaydı olarak yayımla").uncheck();
    await page
      .getByRole("button", { name: "Yapımcı ekle", exact: true })
      .click();
    await page.getByLabel("1. önerilen yayın adı").fill("DEMO yayın adı");
    await page.getByRole("button", { name: "Oyun taslağını kaydet" }).click();
    await expect(page.getByRole("status")).toContainText("Taslak kaydedildi");
    const saved = await (
      await page.request.get(
        "/api/admin/games/" + new URL(page.url()).pathname.split("/").at(-1),
      )
    ).json();
    expect({
      title: saved.game.title,
      slug: saved.game.slug,
      description: saved.game.description,
      editorialTeamName: saved.game.editorialTeamName,
      historicalPartial: saved.game.historicalPartial,
    }).toEqual({
      title: "DEMO arşiv oyunu",
      slug: "demo-archive-game",
      description: "DEMO doğrulanmış oyun açıklaması.",
      editorialTeamName: "DEMO arşiv takımı",
      historicalPartial: false,
    });
    await page
      .getByRole("button", { name: "Oyunu yayımla", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "açık rıza/onay gerekli",
    );
    const invite = (await page
      .getByRole("link", {
        name: "1. yapımcıya özel onay bağlantısı (yeni sekmede)",
      })
      .getAttribute("href"))!;
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 390, height: 900 },
    });
    const owner = await context.newPage();
    await owner.goto(new URL(invite, page.url()).toString());
    await owner
      .getByLabel(
        "Bu adın bu oyunda herkese açık yayımlanmasına izin veriyorum.",
      )
      .check();
    await owner
      .getByRole("button", { name: "Yayın adımı onayla", exact: true })
      .click();
    await expect(owner.getByRole("status")).toContainText("onay kaydedildi");
    await page
      .getByRole("button", { name: "Onayları ve kaydı yenile" })
      .click();
    await expect(page.getByText("Yayın onayı: Alındı")).toBeVisible();
    await page
      .getByRole("button", { name: "Finalist olarak işaretle" })
      .click();
    await expect(page.getByText(/Finalist: Evet/)).toBeVisible();
    await page
      .getByRole("button", { name: "Oyunu yayımla", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Oyun yayımlandı.");
    expect((await readGame()).finalist).toBe(true);
    await page.getByRole("link", { name: "Genel oyun sayfasını aç" }).click();
    await page.setViewportSize({ width: 390, height: 900 });
    await expect(
      page.getByRole("heading", { name: "DEMO arşiv oyunu", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Yapımcılar: DEMO yayın adı")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Oyunu itch.io’da aç (yeni sekmede)" }),
    ).toHaveAttribute("href", "https://subzero-41.itch.io/lost-pieces");
    await expect(page).toHaveTitle(/DEMO arşiv oyunu/);
    await expect(
      page
        .getByRole("article", { name: "DEMO arşiv oyunu", exact: true })
        .locator(".eyebrow"),
    ).toContainText("Finalist");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: ".local/task20-public-game-mobile.png",
      fullPage: true,
    });
    await page.goto("/oyunlar");
    const published = page.getByRole("region", {
      name: "Yayımlanmış oyunlar",
      exact: true,
    });
    const gameCard = published.getByRole("article").filter({
      has: page.getByRole("heading", {
        name: "DEMO arşiv oyunu",
        exact: true,
      }),
    });
    await expect(gameCard).toBeVisible();
    await expect(
      gameCard.getByText("Yapımcılar: DEMO yayın adı", { exact: true }),
    ).toBeVisible();
    await expect(
      gameCard.getByRole("link", { name: "Oyun ayrıntıları", exact: true }),
    ).toHaveAttribute("href", "/oyunlar/demo-archive-game");
    await page.goto("/ulujam");
    const archive = page.getByRole("region", { name: "UluJam 2026 arşivi" });
    await expect(
      archive.getByRole("heading", { name: "İlk üç oyun", exact: true }),
    ).toBeVisible();
    for (const [title, url] of [
      ["Lost Pieces", "https://subzero-41.itch.io/lost-pieces"],
      ["Lost Child Soul", "https://kmevciman.itch.io/lostchildsoul"],
      ["ProjectSW", "https://kairosthegeek.itch.io/project-sw"],
    ]) {
      const card = archive.getByRole("article").filter({
        has: page.getByRole("heading", { name: title, exact: true }),
      });
      await expect(card).toBeVisible();
      await expect(card.getByRole("link")).toHaveAttribute("href", url);
    }
    await expect(
      archive.getByText("DEMO arşiv oyunu", { exact: true }),
    ).toHaveCount(0);
    await page.goto("/oyunlar/demo-archive-game");
    await owner.getByRole("button", { name: "Yayın onayımı geri çek" }).click();
    await expect(owner.getByRole("status")).toContainText("geri çekildi");
    await page.reload();
    await expect(page.getByRole("heading", { name: /404/ })).toBeVisible();
    await page.goto("/oyunlar");
    await expect(
      page
        .getByRole("region", { name: "Yayımlanmış oyunlar", exact: true })
        .getByRole("heading", { name: "DEMO arşiv oyunu", exact: true }),
    ).toHaveCount(0);
    await page.goto("/ulujam");
    await expect(
      page
        .getByRole("region", { name: "UluJam 2026 arşivi" })
        .getByRole("link", { name: /Lost Pieces/ }),
    ).toHaveAttribute("href", original.itchUrl);
  } finally {
    try {
      const current = await readGame();
      if (current.finalist !== original.finalist) {
        await mutate({ action: "finalist", selected: original.finalist });
      }
      // Publication locks the reserved test slug. Restore the original partial
      // semantics; the disposable E2E database removes the reserved slug too.
      await mutate({
        action: "save",
        input: {
          title: original.title,
          slug: current.slugLocked ? current.slug : original.slug,
          description: original.description,
          teamId: original.teamId,
          editorialTeamName: original.editorialTeamName,
          mediaId: original.mediaId,
          itchUrl: original.itchUrl,
          historicalPartial: original.historicalPartial,
          credits: [],
        },
      });
      if (original.published) await mutate({ action: "publish" });
      const restored = await readGame();
      expect({
        title: restored.title,
        historicalPartial: restored.historicalPartial,
        finalist: restored.finalist,
        rank: restored.rank,
        published: restored.published,
        credits: restored.credits,
      }).toEqual({
        title: original.title,
        historicalPartial: original.historicalPartial,
        finalist: original.finalist,
        rank: original.rank,
        published: original.published,
        credits: [],
      });
    } finally {
      await context?.close();
    }
  }
});
test("Oyun/consent API anonim ve CSRF reddi", async ({ request }) => {
  expect((await request.get("/api/admin/games")).status()).toBe(401);
  expect((await request.post("/api/admin/games")).status()).toBe(403);
  expect((await request.post("/api/cards/publication-consent")).status()).toBe(
    403,
  );
});
