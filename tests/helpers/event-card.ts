import { expect, type Page } from "@playwright/test";
export async function openEventWithoutApplication(page: Page, title: string) {
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await expect(card).toBeVisible();
  await expect(
    card.getByRole("link", { name: "Başvur", exact: true }),
  ).toHaveCount(0);
  await card
    .getByRole("link", { name: "Etkinlik ayrıntıları", exact: true })
    .click();
}
