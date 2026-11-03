import { expect, type Page, type Response } from "@playwright/test";

type PendingRead = {
  key: string;
  response: Promise<Response>;
};

/** Navigate with the real client fetches armed before hydration can start them. */
export async function navigateVisualPage(
  page: Page,
  path: string,
  expectedHttpStatus = 200,
): Promise<void> {
  const pathname = new URL(path, "https://visual.invalid").pathname;
  const reads: PendingRead[] = [];
  function expectRead(
    key: string,
    apiPath: string,
    query: (url: URL) => boolean = () => true,
  ) {
    reads.push({
      key,
      response: page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          response.request().method() === "GET" &&
          url.pathname === apiPath &&
          query(url)
        );
      }),
    });
  }
  if (pathname === "/admin/etkinlikler") {
    expectRead("events", "/api/admin/events", (url) => !url.search);
    expectRead("media", "/api/admin/media", (url) => !url.search);
  } else if (pathname === "/admin/people") {
    expectRead("people", "/api/admin/people");
  } else if (pathname === "/admin/medya") {
    expectRead("media", "/api/admin/media", (url) => !url.search);
  } else if (pathname === "/admin/linkler") {
    expectRead("links", "/api/admin/links");
  } else if (
    pathname === "/admin/oyunlar" ||
    /^\/admin\/oyunlar\/[^/]+$/.test(pathname)
  ) {
    expectRead(
      "game-options",
      "/api/admin/games",
      (url) =>
        url.searchParams.get("options") === "1" &&
        Boolean(url.searchParams.get("eventId")),
    );
  }

  // Attach rejection handlers immediately: a failed navigation must not leave
  // pending response waiters with unhandled rejections during test cleanup.
  const [navigation, responses] = await Promise.all([
    page.goto(path),
    Promise.all(reads.map((read) => read.response)),
  ]);
  expect(
    navigation,
    "Visual navigation must return an HTTP response",
  ).not.toBeNull();
  expect(navigation!.status(), "Visual page HTTP status").toBe(
    expectedHttpStatus,
  );
  expect(
    new URL(page.url()).pathname === pathname,
    "Visual navigation must retain the requested route",
  ).toBe(true);

  const data = new Map<string, Record<string, unknown>>();
  for (const [index, response] of responses.entries()) {
    const key = reads[index].key;
    expect(response.ok(), `Visual ${key} read must succeed`).toBe(true);
    const body: unknown = await response.json();
    expect(typeof body, `Visual ${key} response must be an object`).toBe(
      "object",
    );
    expect(body, `Visual ${key} response must not be null`).not.toBeNull();
    data.set(key, body as Record<string, unknown>);
  }
  if (pathname.startsWith("/admin/") && expectedHttpStatus === 200) {
    await expect(
      page.getByRole("navigation", { name: "Yönetim modülleri", exact: true }),
    ).toBeAttached();
    await expect(
      page.getByRole("heading", { name: "Yetki yok", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "Yönetim ekranı açılamadı",
        exact: true,
      }),
    ).toHaveCount(0);
  }

  if (pathname === "/admin/etkinlikler") {
    const items = data.get("events")!.items;
    expect(
      Array.isArray(items),
      "Visual event response must contain items",
    ).toBe(true);
    expect((items as unknown[]).length, "Full visual fixture event count").toBe(
      7,
    );
    await expect(
      page.getByRole("heading", { name: "Etkinlikler", level: 1, exact: true }),
    ).toBeVisible();
    const workspace = page.getByRole("region", {
      name: "Etkinlik yönetimi çalışma alanı",
      exact: true,
    });
    await expect(
      workspace.getByText("7 kayıt · Tarihler İstanbul saatidir.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(workspace.getByRole("article")).toHaveCount(7);
    await expect(
      page.getByText("Etkinlikler hazırlanıyor…", { exact: true }),
    ).toHaveCount(0);
  } else if (pathname === "/admin/people") {
    const items = data.get("people")!.items;
    expect(
      Array.isArray(items),
      "Visual people response must contain items",
    ).toBe(true);
    const entries = items as { kind: string }[];
    const members = entries.filter((item) => item.kind === "member").length;
    const chapters = entries.filter((item) => item.kind === "chapter").length;
    await expect(
      page.getByRole("heading", { name: "Hakkımızda", level: 1, exact: true }),
    ).toBeVisible();
    const workspace = page.getByRole("region", {
      name: "Hakkımızda içerik düzenleyici",
      exact: true,
    });
    await expect(
      workspace.getByText(`${members} kişi · ${chapters} bölüm`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      workspace.getByRole("button", { name: "Yeni kişi ekle", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByText("İçerikler hazırlanıyor…", { exact: true }),
    ).toHaveCount(0);
  } else if (pathname === "/admin/medya") {
    const items = data.get("media")!.items;
    expect(Array.isArray(items), "Visual media list must contain items").toBe(
      true,
    );
    await expect(
      page.getByRole("heading", {
        name: "Medya yönetimi",
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
    const library = page.getByRole("region", {
      name: "Medya kütüphanesi",
      exact: true,
    });
    await expect(library.getByRole("article")).toHaveCount(
      (items as unknown[]).length,
    );
    if (!(items as unknown[]).length)
      await expect(
        library.getByText("Henüz yüklenmiş görsel yok.", { exact: true }),
      ).toBeVisible();
    await expect(
      page.getByText("Medya listesi alınamadı", { exact: true }),
    ).toHaveCount(0);
  } else if (pathname === "/admin/linkler") {
    expect(
      data.get("links")!.groups,
      "Full visual fixture has no link groups",
    ).toEqual([]);
    expect(
      data.get("links")!.links,
      "Full visual fixture has no link entries",
    ).toEqual([]);
    await expect(
      page.getByRole("heading", {
        name: "Bağlantı yönetimi",
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Önce kategori oluşturun.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Liste alınamadı", { exact: true }),
    ).toHaveCount(0);
  } else if (data.has("game-options")) {
    const options = data.get("game-options")!;
    expect(
      Array.isArray(options.teams),
      "Visual game options must contain teams",
    ).toBe(true);
    expect(
      Array.isArray(options.covers),
      "Visual game options must contain covers",
    ).toBe(true);
    await expect(
      page.getByRole("heading", {
        name:
          pathname === "/admin/oyunlar"
            ? "Oyun ve sonuç yönetimi"
            : "Oyun kaydını düzenle",
        level: 1,
        exact: true,
      }),
    ).toBeVisible();
    // The main games route keeps this editor in a closed details element.
    // Count attached options without opening it or changing its visual state.
    await expect(
      page
        .getByRole("combobox", {
          name: "Takım",
          exact: true,
          includeHidden: true,
        })
        .locator("option"),
    ).toHaveCount((options.teams as unknown[]).length + 1);
    await expect(
      page
        .getByRole("combobox", {
          name: "Kapak",
          exact: true,
          includeHidden: true,
        })
        .locator("option"),
    ).toHaveCount((options.covers as unknown[]).length + 1);
    await expect(
      page.getByText("Seçenekler alınamadı.", { exact: true }),
    ).toHaveCount(0);
  } else if (
    pathname === "/makbuz" &&
    !new URL(path, "https://visual.invalid").hash
  ) {
    await expect(
      page.getByText("Makbuz bağlantısını kullanın.", { exact: true }),
    ).toBeVisible();
  }
}
