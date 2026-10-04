import { expect, test } from "@playwright/test";

test("ana sayfa oyun kartını gizler, sponsorları iletişimin önünde gösterir", async ({
  page,
}) => {
  await page.goto("/");
  const destinations = page.getByRole("region", {
    name: "Buluşmalar",
  });
  await expect(destinations.getByRole("link", { name: /Oyunlar/ })).toHaveCount(
    0,
  );
  const sponsors = page.getByRole("region", { name: "Sponsorlar" });
  await expect(sponsors.getByRole("img", { name: "Dijipin" })).toBeVisible();
  const contact = page.getByRole("region", { name: "İletişim" });
  expect(
    await sponsors.evaluate(
      (node, next) =>
        Boolean(
          node.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      await contact.elementHandle(),
    ),
  ).toBe(true);
});

test("Topluluğun dünyası başlığı dar ekranlarda kelimenin ortasından bölünmez", async ({
  page,
}) => {
  for (const width of [390, 700]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const title = page.getByRole("heading", { name: "Topluluğun dünyası." });
    await expect(title).toBeVisible();
    expect(
      await title.evaluate((node) => {
        const first = node.firstChild;
        if (!first) return 0;
        const range = document.createRange();
        range.selectNodeContents(first);
        return range.getClientRects().length;
      }),
    ).toBe(1);
  }
});

test("Hakkımızda yalnız topluluk insanlarını ve gerçek buluşma yerlerini gösterir", async ({
  page,
}) => {
  await page.goto("/hakkimizda");
  await expect(
    page.getByText("Topluluğun insanları", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/People \/ Topluluğun insanları/)).toHaveCount(0);
  await expect(page.getByText(/Her disipline yer var/i)).toHaveCount(0);
  for (const name of [
    "Ecem Kafe & Oyun",
    "Nest'o Coffe Roastery",
    "Müptela Kahve",
    "Çamlık Personel Yemekhanesi",
    "Mete Cengiz Kültür Merkezi",
  ]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Sponsorlar", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Görsel yer tutucu", { exact: false }),
  ).toHaveCount(0);
});

test("Oyunlar sayfası sağlanan iki yayımlanmış oyunu itch bağlantılarıyla gösterir", async ({
  page,
}) => {
  await page.goto("/oyunlar");
  const published = page.getByRole("region", { name: "Yayımlanmış oyunlar" });
  const noTime = published.getByRole("link", { name: /No Time To Die/ });
  await expect(noTime).toHaveAttribute(
    "href",
    "https://altay434.itch.io/no-time-to-die",
  );
  await expect(
    noTime.getByRole("img", { name: "No Time To Die" }),
  ).toBeVisible();
  const inFrame = published.getByRole("link", { name: /InFrame/ });
  await expect(inFrame).toHaveAttribute(
    "href",
    "https://farukb.itch.io/inframe",
  );
  await expect(inFrame.getByRole("img", { name: "InFrame" })).toBeVisible();
});
