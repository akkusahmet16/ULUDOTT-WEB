import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import jsQR from "jsqr";
import type { LinkItem } from "../../src/modules/links/domain/link";
import type { ContactSettings } from "../../src/modules/site-settings/domain/contact";

type LinkInventory = {
  groups: { id: string; title: string; position: number; revision: number }[];
  links: LinkItem[];
};
type ContactSnapshot = { data: ContactSettings; revision: number };

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Özel şifre").fill("E2E-only-password-long-42");
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByText("Yönetim oturumu açık.")).toBeVisible();
}

async function mutate<T>(
  request: APIRequestContext,
  endpoint: string,
  data: unknown,
): Promise<T> {
  const csrfResponse = await request.get("/api/admin/csrf");
  expect(csrfResponse.ok()).toBe(true);
  const { csrfToken } = await csrfResponse.json();
  const response = await request.post(endpoint, {
    headers: {
      "x-csrf-token": csrfToken,
      Origin: new URL(csrfResponse.url()).origin,
    },
    data,
  });
  expect(response.ok()).toBe(true);
  return response.json();
}

async function readLinks(request: APIRequestContext): Promise<LinkInventory> {
  const response = await request.get("/api/admin/links");
  expect(response.ok()).toBe(true);
  return response.json();
}

async function readContact(
  request: APIRequestContext,
): Promise<ContactSnapshot> {
  const response = await request.get("/api/admin/contact-settings");
  expect(response.ok()).toBe(true);
  return response.json();
}

async function hideOwnedLinks(request: APIRequestContext, groupId: string) {
  const inventory = await readLinks(request);
  const failures: unknown[] = [];
  for (const owned of inventory.links.filter(
    (item) => item.groupId === groupId,
  )) {
    try {
      const latest = (await readLinks(request)).links.find(
        (item) => item.id === owned.id,
      );
      if (latest?.published)
        await mutate(request, "/api/admin/links", {
          action: "hide",
          id: latest.id,
          expectedRevision: latest.revision,
        });
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "Sahipli test bağlantıları gizlenemedi");
}

test("bağlantı yönetimi: sahipli kategori sırası, kısa URL/QR ve gizleme", async ({
  page,
}) => {
  const nonce = randomUUID();
  const groupTitle = `E2E bağlantıları ${nonce}`;
  const internalTitle = `Topluluk test bağlantısı ${nonce}`;
  const outsideTitle = `E2E ${nonce} `.padEnd(150, "X");
  let groupId: string | undefined;
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  const before = await readLinks(page.request);
  try {
    await page.goto("/admin/linkler");
    await page.getByLabel("Kategori başlığı").fill(groupTitle);
    await page
      .getByLabel("Kategori sırası")
      .fill(
        String(
          Math.max(-1, ...before.groups.map((group) => group.position)) + 1,
        ),
      );
    await page
      .getByRole("button", { name: "Kategoriyi kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Kaydedildi");
    const createdGroup = (await readLinks(page.request)).groups.find(
      (group) => group.title === groupTitle,
    );
    expect(createdGroup).toBeDefined();
    groupId = createdGroup!.id;
    await page
      .getByRole("combobox", { name: "Kategori", exact: true })
      .selectOption(groupId);
    await page.getByLabel("Bağlantı başlığı").fill(internalTitle);
    await page.getByLabel("Adres", { exact: true }).fill("/hakkimizda");
    await page.getByLabel("Bağlantı sırası").fill("0");
    await page.getByLabel("Öne çıkar").check();
    await page.getByLabel("Yayımla").check();
    await page
      .getByRole("button", { name: "Bağlantıyı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Kaydedildi");
    await page
      .getByRole("button", { name: "Yeni bağlantı", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Kategori", exact: true })
      .selectOption(groupId);
    await page.getByLabel("Bağlantı başlığı").fill(outsideTitle);
    await page
      .getByLabel("Adres", { exact: true })
      .fill("https://example.com/test");
    await page.getByLabel("Bağlantı sırası").fill("1");
    await page.getByLabel("Öne çıkar").uncheck();
    await page.getByLabel("Yayımla").check();
    await page.getByLabel("Dış adresi doğruladım").check();
    await page
      .getByRole("button", { name: "Bağlantıyı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Kaydedildi");
    const category = page.getByRole("region", {
      name: groupTitle,
      exact: true,
    });
    const card = (title: string) =>
      category.getByRole("article").filter({
        has: page.getByRole("heading", { name: title, exact: true }),
      });
    await card(outsideTitle)
      .getByRole("button", { name: "Yukarı taşı", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Sıra güncellendi");
    await expect(category.getByRole("article").getByRole("heading")).toHaveText(
      [outsideTitle, internalTitle],
    );
    const owned = (await readLinks(page.request)).links.filter(
      (item) => item.groupId === groupId,
    );
    expect(owned.map((item) => item.title)).toEqual([
      outsideTitle,
      internalTitle,
    ]);
    const [external, internal] = owned;
    expect(external).toMatchObject({
      position: 0,
      published: true,
      url: "https://example.com/test",
    });
    expect(internal).toMatchObject({
      position: 1,
      published: true,
      featured: true,
      url: "/hakkimizda",
    });
    const copied = new URL(`/l/${internal.id}`, page.url()).toString();
    const qrPath = `/api/links/${internal.id}/qr`;
    const result = await page.request.get(qrPath);
    expect(result.status()).toBe(200);
    const { data, info } = await sharp(await result.body())
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(
      jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data,
    ).toBe(copied);
    const redirect = await page.request.get(copied, { maxRedirects: 0 });
    expect(redirect.status()).toBe(307);
    expect(redirect.headers().location).toBe(
      new URL("/hakkimizda", copied).toString(),
    );
    const outsideRedirect = await page.request.get(`/l/${external.id}`, {
      maxRedirects: 0,
    });
    expect(outsideRedirect.status()).toBe(307);
    expect(outsideRedirect.headers().location).toBe("https://example.com/test");
    await page.goto("/");
    const footerSocial = page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Sosyal medya", exact: true });
    for (const title of [internalTitle, outsideTitle])
      await expect(
        footerSocial.getByRole("link", { name: title, exact: true }),
      ).toHaveCount(0);
    await page.goto("/admin/linkler");
    for (const item of [internal, external]) {
      await card(item.title)
        .getByRole("button", { name: "Düzenle", exact: true })
        .click();
      await card(item.title)
        .getByRole("button", { name: "Gizle", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("Gizlendi");
      await expect(page.getByLabel("Yayımla")).not.toBeChecked();
      await expect(card(item.title)).toContainText("Gizli");
      expect((await page.request.get(`/l/${item.id}`)).status()).toBe(404);
      expect(
        (await page.request.get(`/api/links/${item.id}/qr`)).status(),
      ).toBe(404);
    }
    expect(
      (await readLinks(page.request)).links
        .filter((item) => item.groupId === groupId)
        .every((item) => !item.published),
    ).toBe(true);
  } finally {
    if (groupId) await hideOwnedLinks(page.request, groupId);
  }
});

test("sosyal footer: iletişim ayarlarından sıra, dış bağlantı ve gizleme", async ({
  page,
}) => {
  const nonce = randomUUID();
  const firstTitle = `E2E alt bağlantı ${nonce}`;
  const secondTitle = `E2E footer ${nonce} `.padEnd(80, "X");
  const firstUrl = `https://example.com/e2e-footer-first/${nonce}`;
  const secondUrl = `https://example.com/e2e-footer-second/${nonce}`;
  const endpoint = "/api/admin/contact-settings";
  await page.setViewportSize({ width: 390, height: 900 });
  await login(page);
  const original = await readContact(page.request);
  try {
    await mutate<ContactSnapshot>(page.request, endpoint, {
      input: {
        ...original.data,
        socials: [
          ...original.data.socials,
          {
            id: `e2e-first-${nonce}`,
            title: firstTitle,
            url: firstUrl,
            icon: "link",
            contact: false,
            footer: true,
          },
          {
            id: `e2e-second-${nonce}`,
            title: secondTitle,
            url: secondUrl,
            icon: "link",
            contact: false,
            footer: true,
          },
        ],
      },
      expectedRevision: original.revision,
    });
    await page.goto("/admin/iletisim");
    const firstSlot = page.getByRole("group", {
      name: `${original.data.socials.length + 1}. bağlantı`,
      exact: true,
    });
    const secondSlot = page.getByRole("group", {
      name: `${original.data.socials.length + 2}. bağlantı`,
      exact: true,
    });
    await secondSlot
      .getByRole("button", { name: "Yukarı", exact: true })
      .click();
    await expect(
      firstSlot.getByLabel("Bağlantı adı", { exact: true }),
    ).toHaveValue(secondTitle);
    await page
      .getByRole("button", { name: "İletişim ayarlarını kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "İletişim bilgileri ve alt bağlantılar kaydedildi.",
    );
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const social = footer.getByRole("navigation", { name: "Sosyal medya" });
    const originalTitles = original.data.socials
      .filter((item) => item.footer)
      .map((item) => item.title);
    const expectedTitles = [...originalTitles, secondTitle, firstTitle];
    await expect(social.getByRole("link")).toHaveCount(expectedTitles.length);
    for (let index = 0; index < expectedTitles.length; index++)
      await expect(social.getByRole("link").nth(index)).toHaveAccessibleName(
        expectedTitles[index],
      );
    for (const [title, url] of [
      [firstTitle, firstUrl],
      [secondTitle, secondUrl],
    ]) {
      const external = social.getByRole("link", { name: title, exact: true });
      await expect(external).toHaveAttribute("href", url);
      await expect(external).toHaveAttribute("target", "_blank");
      await expect(external).toHaveAttribute(
        "rel",
        /noopener noreferrer external/,
      );
    }
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: ".local/task7-mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: ".local/task7-desktop.png", fullPage: true });
    await page.goto("/admin/iletisim");
    await firstSlot.getByLabel("Alt bölümde göster", { exact: true }).uncheck();
    await secondSlot
      .getByLabel("Alt bölümde göster", { exact: true })
      .uncheck();
    await page
      .getByRole("button", { name: "İletişim ayarlarını kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "İletişim bilgileri ve alt bağlantılar kaydedildi.",
    );
    await page.goto("/");
    for (const title of [firstTitle, secondTitle])
      await expect(
        footer.getByRole("link", { name: title, exact: true }),
      ).toHaveCount(0);
    await expect(social.getByRole("link")).toHaveCount(originalTitles.length);
  } finally {
    const latest = await readContact(page.request);
    await mutate<ContactSnapshot>(page.request, endpoint, {
      input: original.data,
      expectedRevision: latest.revision,
    });
  }
});

test("bağlantı API ve kısa adres keyfi URL kabul etmez", async ({
  request,
}) => {
  expect((await request.get("/api/admin/links")).status()).toBe(401);
  expect((await request.post("/api/admin/links")).status()).toBe(403);
  expect(
    (await request.get("/l/invalid?url=https://example.com")).status(),
  ).toBe(404);
  expect((await request.get("/api/links/invalid/qr")).status()).toBe(404);
});
