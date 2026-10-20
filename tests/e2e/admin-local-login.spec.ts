import { expect, test } from "@playwright/test";

for (const hostname of ["localhost", "127.0.0.1"]) {
  test(`yerel ${hostname} adresinde giriş, oturum yenileme ve çıkış`, async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(
      process.env.ULUDOTT_E2E_PRODUCTION === "1",
      "Yerel HTTP adreslerinin geliştirme testi",
    );
    const url = new URL("/admin", baseURL);
    url.hostname = hostname;
    await page.goto(url.toString());
    await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Yönetim modülleri" }),
    ).toBeVisible();
    const first = (await context.cookies()).find(
      (cookie) => cookie.name === "uludott_admin_local",
    );
    expect(first).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      path: "/",
    });
    await page
      .getByRole("button", { name: "Oturumu yenile", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Oturum yenilendi");
    const next = (await context.cookies()).find(
      (cookie) => cookie.name === "uludott_admin_local",
    );
    expect(next?.value).toBeTruthy();
    expect(next?.value).not.toBe(first?.value);
    await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
    await expect(page.getByLabel("Özel şifre")).toBeVisible();
    expect(
      (await context.cookies()).some(
        (cookie) => cookie.name === "uludott_admin_local",
      ),
    ).toBe(false);
  });
}
