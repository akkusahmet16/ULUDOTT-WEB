import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { z } from "zod";

test("sıcak veri önbelleğinde initialNow tazedir, sayaç sapması ≤1 sn; hidrasyon ve üç evre doğru", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && /hydrat|mismatch|server.render/i.test(message.text())) errors.push(message.text());
  });
  await page.goto("/ulujam");
  await expect(page.getByRole("region", { name: "UluJam 2027" }).getByText("Yakında", { exact: true })).toBeVisible();
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill("admin-e2e@test.invalid");
  await page.getByLabel("Parola", { exact: true }).fill("E2E-only-password-long-42");
  await page.getByLabel("Doğrulama veya kurtarma kodu").fill("11111111111111111111111111111111");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  const csrf = z.object({ csrfToken: z.string() }).parse(await page.evaluate(async () => (await fetch("/api/admin/csrf", { cache: "no-store" })).json()));
  const headers = {
    "x-csrf-token": csrf.csrfToken, Origin: new URL(page.url()).origin,
    Cookie: (await page.context().cookies()).map(cookie => `${cookie.name}=${cookie.value}`).join("; "),
  };
  const image = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#ffffff" } }).png().toBuffer();
  const upload = await page.request.post("/api/admin/media", { headers, multipart: {
    file: { name: "fixture.png", mimeType: "image/png", buffer: image }, purpose: "poster", altText: "Sentetik sayaç test afişi",
  } });
  expect(upload.status()).toBe(201);
  const asset = z.object({ id: z.uuid() }).parse(await upload.json());
  expect((await page.request.post("/api/admin/media", { headers, data: { action: "publish", assetId: asset.id, confirmed: true } })).ok()).toBe(true);
  const inventory = z.object({ items: z.array(z.object({ id: z.uuid(), slug: z.string(), revision: z.int() })) }).parse(await (await page.request.get("/api/admin/events", { headers })).json());
  const event = inventory.items.find(item => item.slug === "ulujam-2027");
  if (!event) throw Error("İzole 2027 fixture yok");
  const start = new Date(Date.now() + 3_600_000);
  const input = {
    title: "UluJam 2027", slug: "ulujam-2027", kind: "ulujam", location: "Yalnız test konumu", mediaId: asset.id,
    startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 3_600_000).toISOString(), publishAt: new Date(Date.now() - 60_000).toISOString(),
  };
  const mutate = async (data: unknown) => {
    const response = await page.request.post("/api/admin/events", { headers, data });
    expect(response.ok()).toBe(true);
    return z.object({ revision: z.int().positive() }).parse(await response.json());
  };
  const saved = await mutate({ action: "save", id: event.id, expectedRevision: event.revision, input });
  const published = await mutate({ action: "publish", id: event.id, expectedRevision: saved.revision, confirmed: true });
  const initialTimes: number[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const before = Date.now();
    const response = await page.request.get("/ulujam");
    const html = (await response.text()).replaceAll('\\"', '"');
    const initialNow = /"initialNow":"([^"\\]+)"/.exec(html)?.[1];
    expect(initialNow).toBeDefined();
    const serverNow = Date.parse(initialNow ?? "");
    expect(serverNow).toBeGreaterThanOrEqual(before - 1000);
    expect(serverNow).toBeLessThanOrEqual(Date.now() + 1000);
    initialTimes.push(serverNow);
    await page.goto("/ulujam");
    const countdown = page.getByLabel("Etkinliğe kalan süre");
    await expect(countdown).toBeVisible();
    const snapshot = await countdown.evaluate(node => ({ text: node.textContent ?? "", now: Date.now() }));
    const parts = snapshot.text.match(/\d+/g)?.map(Number);
    expect(parts).toHaveLength(4);
    if (!parts) throw Error("Sayaç metni çözülemedi");
    const displayed = parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60 + parts[3];
    expect(Math.abs(displayed - Math.ceil((start.getTime() - snapshot.now) / 1000))).toBeLessThanOrEqual(1);
    await page.waitForTimeout(1200);
  }
  expect(initialTimes[1] - initialTimes[0]).toBeGreaterThanOrEqual(1000);
  const started = await mutate({ action: "save", id: event.id, expectedRevision: published.revision, input: { ...input, startsAt: new Date(Date.now() - 60_000).toISOString() } });
  await page.goto("/ulujam");
  await expect(page.getByText("Etkinlik başladı.", { exact: true })).toBeVisible();
  await mutate({ action: "draft", id: event.id, expectedRevision: started.revision, confirmed: true });
  await page.goto("/ulujam");
  await expect(page.getByRole("region", { name: "UluJam 2027" }).getByText("Yakında", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
