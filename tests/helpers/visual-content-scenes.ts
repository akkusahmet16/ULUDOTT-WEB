import { expect, type Locator, type Page } from "@playwright/test";
import type { VisualProfile } from "./visual-fixture.ts";
import type { VisualStateScene } from "./visual-state-scenes.ts";

/** Align real content without changing styles, media, or the scroll handler. */
async function alignContent(page: Page, target: Locator) {
  await expect(target).toHaveCount(1);
  await target.scrollIntoViewIfNeeded();
  let stableSince = performance.now();
  await expect
    .poll(
      async () => {
        await page.evaluate(async () => {
          await document.fonts.ready;
          const visible = [...document.images].filter((image) => {
            const bounds = image.getBoundingClientRect();
            return (
              bounds.width > 0 &&
              bounds.height > 0 &&
              bounds.bottom > 0 &&
              bounds.top < innerHeight
            );
          });
          await Promise.all(
            visible.map(async (image) => {
              await image.decode();
              if (!image.naturalWidth) throw Error("CONTENT_IMAGE_NOT_DECODED");
            }),
          );
        });
        const position = await target.evaluate((element) => {
          const top = Math.min(120, innerHeight * 0.15);
          const scroller = document.scrollingElement;
          if (!scroller) throw Error("CONTENT_SCROLLER_REQUIRED");
          const requested = scrollY + element.getBoundingClientRect().top - top;
          const limit = Math.max(0, scroller.scrollHeight - innerHeight);
          return {
            // Fractional layout need not have an exactly attainable scroll
            // offset. Choose one absolute CSS-pixel position consistently.
            target: Math.round(Math.max(0, Math.min(requested, limit))),
            actual: scrollY,
            moving: document.getAnimations().some((animation) => {
              const timing = animation.effect?.getComputedTiming();
              return (
                animation.playState === "running" &&
                timing?.iterations !== Infinity &&
                animation.timeline?.constructor.name === "DocumentTimeline"
              );
            }),
          };
        });
        if (position.target !== position.actual) {
          // Lazy images and native reveal transitions can move the anchor.
          // Re-read their final geometry; never accept a one-pixel offset.
          await page.evaluate((offset) => scrollTo(0, offset), position.target);
          stableSince = performance.now();
          return false;
        }
        if (position.moving) {
          stableSince = performance.now();
          return false;
        }
        return performance.now() - stableSince >= 400;
      },
      { timeout: 15_000, intervals: [20, 50, 100] },
    )
    .toBe(true);
  await expect(target).toBeVisible();
}

/**
 * Mounted v0.1 content below the initial viewport. Empty business data still
 * renders the three default archive photos, two default published games and
 * default People/Places; only database-backed historical results are absent.
 */
export function visualContentScenes(
  profile: VisualProfile,
): VisualStateScene[] {
  const archive = (page: Page) =>
    page.getByRole("region", {
      name: "UluJam 2026 arşivi",
      exact: true,
    });
  const gallery = (page: Page) =>
    archive(page).getByRole("region", {
      name: "Arşiv galerisi",
      exact: true,
    });
  const places = (page: Page) =>
    page.getByRole("region", { name: "Mekânlar", exact: true });
  const results = (page: Page) =>
    page.getByRole("region", {
      name: "UluJam 2026 sonuçları",
      exact: true,
    });
  const published = (page: Page) =>
    page.getByRole("region", {
      name: "Yayımlanmış oyunlar",
      exact: true,
    });
  const publishedCount = profile === "full" ? 3 : 2;
  const scenes: VisualStateScene[] = [
    {
      alias: "content-archive-heading",
      path: "/ulujam",
      prepare: async (page) => {
        await alignContent(
          page,
          archive(page).getByRole("heading", {
            name: "UluJam 2026 arşivi",
            exact: true,
          }),
        );
      },
    },
    {
      alias: "content-archive-gallery",
      path: "/ulujam",
      prepare: async (page) => {
        await expect(gallery(page).locator("figure")).toHaveCount(3);
        await alignContent(
          page,
          gallery(page).getByRole("heading", { name: "Galeri", exact: true }),
        );
      },
    },
    ...[1, 2].map((index): VisualStateScene => ({
      alias: `content-archive-gallery-tile-${index + 1}`,
      path: "/ulujam",
      prepare: async (page) => {
        const tile = gallery(page).locator("figure").nth(index);
        await alignContent(page, tile);
        await expect(tile.locator("figcaption")).toContainText(
          `UluJam 2026 / 0${index + 1}`,
        );
      },
    })),
    {
      alias: "content-archive-gallery-hover",
      path: "/ulujam",
      pointer: "hover",
      hoverTarget: (page) => gallery(page).locator("figure").first(),
      prepare: async (page) => {
        const tile = gallery(page).locator("figure").first();
        await alignContent(page, tile);
        await tile.hover({ scroll: "none" });
      },
    },
    {
      alias: "content-places-heading",
      path: "/hakkimizda",
      prepare: async (page) => {
        await alignContent(
          page,
          places(page).getByRole("heading", {
            name: "Birlikte. Aynı yerde.",
            exact: true,
          }),
        );
      },
    },
    ...[
      { alias: "cafes", heading: "Etkinlik kafeleri", selector: ".place-0" },
      {
        alias: "venues",
        heading: "Salonlar & Buluşma Alanları",
        selector: ".place-1",
      },
    ].map(({ alias, heading, selector }): VisualStateScene => ({
      alias: `content-place-${alias}`,
      path: "/hakkimizda",
      prepare: async (page) => {
        const place = places(page).locator(selector);
        await alignContent(page, place);
        await expect(
          place.getByRole("heading", { name: heading, exact: true }),
        ).toBeVisible();
      },
    })),
    {
      alias: "content-place-cafes-hover",
      path: "/hakkimizda",
      pointer: "hover",
      hoverTarget: (page) => places(page).locator(".place-0"),
      prepare: async (page) => {
        const place = places(page).locator(".place-0");
        await alignContent(page, place);
        await place.hover({ scroll: "none" });
      },
    },
    {
      alias: "content-people-text-only",
      path: "/hakkimizda",
      prepare: async (page) => {
        const detail = page.locator(".people-detail-text-only");
        await alignContent(page, detail);
        await expect(detail.locator("img,video")).toHaveCount(0);
        await expect(
          detail.getByRole("heading", { name: "Tuğçe", exact: true }),
        ).toBeVisible();
      },
    },
    {
      alias: "content-published-games-heading",
      path: "/oyunlar",
      prepare: async (page) => {
        await expect(
          published(page).locator(".published-game-card"),
        ).toHaveCount(publishedCount);
        await alignContent(
          page,
          published(page).getByRole("heading", {
            name: "Yayımlanmış oyunlar ve finalistler",
            exact: true,
          }),
        );
      },
    },
    ...Array.from({ length: publishedCount }, (_, index): VisualStateScene => ({
      alias: `content-published-game-${index + 1}`,
      path: "/oyunlar",
      prepare: async (page) => {
        await alignContent(
          page,
          published(page).locator(".published-game-card").nth(index),
        );
      },
    })),
    ...["hover", "focus"].map((state): VisualStateScene => ({
      alias: `content-published-game-${state}`,
      path: "/oyunlar",
      ...(state === "hover"
        ? {
            pointer: "hover" as const,
            hoverTarget: (page: Page) =>
              published(page).locator(".published-game-card").first(),
          }
        : { pointer: "neutral" as const }),
      prepare: async (page) => {
        const card = published(page).locator(".published-game-card").first();
        await alignContent(page, card);
        if (state === "hover") await card.hover({ scroll: "none" });
        else {
          await card.focus();
          await expect(card).toBeFocused();
        }
      },
    })),
    ...[
      {
        alias: "upcoming",
        label: "Yaklaşan etkinlikler",
        heading: "Yaklaşan Etkinlikler",
      },
      {
        alias: "past",
        label: "Geçmiş etkinlikler",
        heading: "Geçmiş Etkinlikler",
      },
    ].map(({ alias, label, heading }): VisualStateScene => ({
      alias: `content-events-${alias}`,
      path: "/etkinlikler",
      prepare: async (page) => {
        const section = page.getByRole("region", { name: label, exact: true });
        await alignContent(
          page,
          section.getByRole("heading", { name: heading, exact: true }),
        );
      },
    })),
  ];

  if (profile === "empty") {
    scenes.push(
      {
        alias: "content-archive-games-empty",
        path: "/ulujam",
        prepare: async (page) => {
          await expect(archive(page).locator(".degree-game-card")).toHaveCount(
            0,
          );
          await alignContent(
            page,
            archive(page).getByText(
              "Henüz yayımlanmış derece bağlantısı yok.",
              { exact: true },
            ),
          );
        },
      },
      {
        alias: "content-public-degree-empty",
        path: "/oyunlar",
        prepare: async (page) => {
          await expect(results(page).locator(".degree-game-card")).toHaveCount(
            0,
          );
          await alignContent(
            page,
            results(page).getByText(
              "Henüz yayımlanmış derece bağlantısı yok.",
              { exact: true },
            ),
          );
        },
      },
    );
  } else {
    for (const scope of ["archive", "public"] as const)
      for (const index of [0, 1, 2]) {
        scenes.push({
          alias: `content-${scope}-degree-${index + 1}`,
          path: scope === "archive" ? "/ulujam" : "/oyunlar",
          prepare: async (page) => {
            const section = scope === "archive" ? archive(page) : results(page);
            await expect(section.locator(".degree-game-card")).toHaveCount(3);
            await alignContent(
              page,
              index === 0
                ? section.getByRole("heading", {
                    name: scope === "archive" ? "İlk üç oyun" : "UluJam 2026",
                    exact: true,
                  })
                : section.locator(".degree-game-card").nth(index),
            );
          },
        });
      }
  }
  if (profile === "full") {
    scenes.push(
      {
        alias: "content-published-result-card",
        path: "/oyunlar",
        prepare: async (page) => {
          const card = published(page)
            .getByRole("article")
            .filter({
              has: page.getByRole("heading", {
                name: "DEMO görsel oyun",
                exact: true,
              }),
            });
          await alignContent(page, card);
          await expect(
            card.getByRole("link", { name: "Oyun ayrıntıları", exact: true }),
          ).toBeVisible();
        },
      },
      {
        alias: "content-event-detail-body",
        path: "/etkinlikler/demo-visual-future",
        prepare: async (page) => {
          await alignContent(page, page.locator(".content-body"));
          await expect(
            page.getByRole("link", { name: "Başvur", exact: true }),
          ).toBeVisible();
        },
      },
      {
        alias: "content-game-detail-credits",
        path: "/oyunlar/demo-visual-game",
        prepare: async (page) => {
          await alignContent(page, page.getByText(/^Yapımcılar:/));
          await expect(
            page.getByRole("link", {
              name: "Oyunu itch.io’da aç (yeni sekmede)",
              exact: true,
            }),
          ).toBeVisible();
        },
      },
    );
  }
  return scenes;
}
