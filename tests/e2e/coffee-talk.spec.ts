import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
test("Coffee Talk DEMO editör yayını, site içi başvuru ve kapanış", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Başvur", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page
    .getByLabel("Parola", { exact: true })
    .fill("E2E-only-password-long-42");
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill("88888888888888888888888888888888");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  async function headers() {
    const c = await page.evaluate(async () =>
      (await fetch("/api/admin/csrf", { cache: "no-store" })).json(),
    );
    return {
      "x-csrf-token": c.csrfToken,
      Origin: new URL(page.url()).origin,
      Cookie: (await page.context().cookies())
        .map((c) => c.name + "=" + c.value)
        .join("; "),
    };
  }
  async function post(url: string, data: unknown) {
    const r = await page.request.post(url, { headers: await headers(), data });
    expect(r.ok()).toBe(true);
    return r.json();
  }
  const listing = await (
    await page.request.get("/api/admin/events", { headers: await headers() })
  ).json();
  const draft = listing.items.find(
    (e: { slug: string }) => e.slug === "coffee-talk",
  );
  expect(draft).toMatchObject({
    startsAt: null,
    location: null,
    mediaId: null,
    formId: null,
    status: "draft",
  });
  const form = await post("/api/admin/forms", {
    eventId: draft.id,
    settings: {
      title: "Coffee Talk DEMO başvuru",
      slug: "coffee-demo",
      opensAt: "2020-01-01T00:00:00Z",
      closesAt: null,
      capacity: 10,
      waitlist: false,
      duplicatePolicy: "allow",
      thankYou: "DEMO başvurusu alındı.",
      retentionDays: 1,
    },
  });
  await post("/api/admin/forms/" + form.id, {
    action: "definition",
    expectedRevision: 1,
    input: {
      fields: [
        {
          id: randomUUID(),
          type: "short_text",
          label: "Ad soyad",
          required: true,
        },
      ],
    },
  });
  await post("/api/admin/forms/" + form.id, {
    action: "publish",
    expectedRevision: 2,
  });
  const image = await sharp({
    create: { width: 300, height: 200, channels: 3, background: "purple" },
  })
    .png()
    .toBuffer();
  let upload = await page.request.post("/api/admin/media", {
    headers: await headers(),
    multipart: {
      file: { name: "demo.png", mimeType: "image/png", buffer: image },
      purpose: "poster",
      altText: "Yalnız test için sentetik DEMO afişi",
    },
  });
  for (let n = 0; upload.status() === 429 && n < 5; n++) {
    await page.waitForTimeout(300);
    upload = await page.request.post("/api/admin/media", {
      headers: await headers(),
      multipart: {
        file: { name: "demo.png", mimeType: "image/png", buffer: image },
        purpose: "poster",
        altText: "Yalnız test için sentetik DEMO afişi",
      },
    });
  }
  expect(upload.status()).toBe(201);
  const asset = await upload.json();
  await post("/api/admin/media", {
    action: "publish",
    assetId: asset.id,
    confirmed: true,
  });
  await post("/api/admin/events", {
    action: "save",
    id: draft.id,
    expectedRevision: 1,
    input: {
      title: "Coffee Talk DEMO",
      slug: "coffee-talk",
      kind: "general",
      startsAt: "2030-01-01T12:00:00Z",
      location: "DEMO test konumu",
      mediaId: asset.id,
      formId: form.id,
      featuredPosition: 1,
    },
  });
  await post("/api/admin/events", {
    action: "publish",
    id: draft.id,
    expectedRevision: 2,
    confirmed: true,
  });
  await page.goto("/");
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Coffee Talk DEMO", exact: true }),
  });
  await expect(card.getByRole("img", { name: /sentetik DEMO/ })).toBeVisible();
  await card.getByRole("link", { name: "Başvur", exact: true }).click();
  await expect(page.getByLabel(/Takım|Beceri|Oyuncu adı/)).toHaveCount(0);
  await page.getByLabel("Ad soyad *").fill("DEMO kişi");
  await page.getByRole("button", { name: "Başvuruyu gönder" }).click();
  await expect(
    page.getByRole("heading", { name: "Başvuru alındı" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Makbuzu ve durumu görüntüle" }).click();
  await expect(page.getByText("Durum: Alındı", { exact: true })).toBeVisible();
  await post("/api/admin/forms/" + form.id, {
    action: "close",
    expectedRevision: 3,
  });
  await page.goto("/basvuru/coffee-demo");
  await expect(
    page.getByText("Bu form şu anda başvuru almıyor."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Başvuruyu gönder" }),
  ).toHaveCount(0);
  await page.goto("/etkinlikler/coffee-talk");
  await expect(
    page.getByRole("link", { name: "Başvur", exact: true }),
  ).toHaveCount(0);
  await post("/api/admin/events", {
    action: "archive",
    id: draft.id,
    expectedRevision: 3,
    confirmed: true,
  });
});
