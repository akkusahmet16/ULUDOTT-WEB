import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { EventCard } from "../../src/modules/events/ui/event-card";
import type { PublicContent } from "../../src/modules/publication/domain";
import { UlujamArchive } from "../../src/modules/events/ui/ulujam-archive";
import { defaultArchive2026 } from "../../src/modules/site-settings/domain/archives";

const event: PublicContent = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Topluluk etkinliği", slug: "topluluk-etkinligi", kind: "general",
  status: "published", displayStatus: "published", revision: 1,
  excerpt: null, description: null, body: "", categoryId: null,
  location: "Bursa", locationType: "physical", organizer: null,
  startsAt: new Date("2030-01-01T12:00:00Z"), endsAt: null,
  publishAt: new Date("2026-01-01T00:00:00Z"), unpublishAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"), capacity: null,
  maxTeamSize: 6, mediaId: null, formId: null, eventId: null,
  ctaUrl: null, ctaLabel: null, seo: {}, featuredPosition: null,
  applicationUrl: "/basvuru/topluluk-etkinligi", image: null,
};

it.each([
  ["cancelled", "İptal"],
  ["ended", "Bitti"],
])("marks %s events and suppresses their application action", (displayStatus, label) => {
  const html = renderToStaticMarkup(createElement(EventCard, {
    event: { ...event, displayStatus },
  }));
  expect(html).toContain(label);
  expect(html).not.toContain(event.applicationUrl);
  expect(html).not.toContain("/etkinlikler/topluluk-etkinligi");
});

it("displays custom category name when present or fallback eyebrow", () => {
  const withCategory = renderToStaticMarkup(createElement(EventCard, {
    event: { ...event, categoryName: "GameJam" },
  }));
  expect(withCategory).toContain("GameJam");

  const defaultCategory = renderToStaticMarkup(createElement(EventCard, {
    event: { ...event, categoryName: null },
  }));
  expect(defaultCategory).toContain("Topluluk buluşması");
});

it("preserves applications on a published event", () => {
  const html = renderToStaticMarkup(createElement(EventCard, { event }));
  expect(html).toContain(event.applicationUrl);
  expect(html).toContain("Başvur");
});

it("renders time without end-time when endsAt is null and omits venue when location is null", () => {
  const html = renderToStaticMarkup(
    createElement(EventCard, {
      event: { ...event, endsAt: null, location: null },
    }),
  );
  expect(html).not.toContain("–");
  expect(html).not.toContain("Konum");
});

it("serves responsive archive images while preserving gallery and game composition", () => {
  const html = renderToStaticMarkup(createElement(UlujamArchive, { archive: defaultArchive2026 }));
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
  expect(images).toHaveLength(6);
  for (const image of images) {
    expect(image).toContain('srcSet="');
    expect(image).toContain('/_next/image?');
    expect(image).toContain('sizes="');
  }
  expect(images[0]).toContain("67vw");
  expect(images[1]).toContain("33vw");
  expect(html).toContain("archive-gallery-featured");
  expect(html).toContain("archive-gallery-side");
  expect(html).toContain("Lost Pieces");
  expect(html).toContain("https://subzero-41.itch.io/lost-pieces");
});
