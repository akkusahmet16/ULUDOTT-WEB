import { expect, test } from "@playwright/test";

test("ana sayfa kayıt/giriş veya başvuru durumu göstermez", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Uludott" }),
  ).toBeVisible();
  await expect(
    page.getByText("Başvurular henüz açılmadı.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(
    page.getByRole("button", { name: /giriş|kayıt|başvur/i }),
  ).toHaveCount(0);
});
