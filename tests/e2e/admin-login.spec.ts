import { test, expect } from "@playwright/test";
import { TOTP } from "otpauth";
const email = "admin-e2e@test.invalid",
  password = "E2E-only-password-long-42",
  secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
test("yönetici giriş MFA, güvenli cookie, yenileme ve çıkış akışı", async ({
  page,
  context,
}) => {
  await page.goto("/admin");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Parola", { exact: true }).fill(password);
  await page
    .getByLabel("Doğrulama veya kurtarma kodu")
    .fill(new TOTP({ secret }).generate());
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
  const first = (await context.cookies()).find(
    (c) => c.name === "__Host-uludott_admin",
  )!;
  expect(first.httpOnly).toBe(true);
  expect(first.secure).toBe(true);
  expect(first.sameSite).toBe("Strict");
  expect(first.path).toBe("/");
  await page.getByRole("button", { name: "Oturumu yenile" }).click();
  await expect(page.getByRole("status")).toContainText("Oturum yenilendi");
  const next = (await context.cookies()).find((c) => c.name === first.name)!;
  expect(next.value).not.toBe(first.value);
  await page.getByRole("button", { name: "Çıkış yap" }).click();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  expect(
    (await context.cookies()).find((c) => c.name === first.name),
  ).toBeUndefined();
});
test("CSRF olmayan giriş/logout ve genel kayıt endpointi reddedilir", async ({
  request,
}) => {
  const r = await request.post("/api/admin/login", {
    data: { email, password, mfaCode: "000000" },
  });
  expect(r.status()).toBe(403);
  expect(r.headers()["cache-control"]).toContain("no-store");
  expect(r.headers()["referrer-policy"]).toBe("no-referrer");
  expect((await request.post("/api/admin/logout")).status()).toBe(403);
  expect((await request.post("/api/admin/register")).status()).toBe(404);
  const session = await request.get("/api/admin/session");
  expect(session.status()).toBe(401);
  expect(await session.json()).not.toHaveProperty("token");
});
