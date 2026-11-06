import { z } from "zod";

export const sponsorItemSchema = z.strictObject({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(120),
  logoUrl: z.string().min(1).max(500),
  websiteUrl: z.string().trim().max(1000).default(""),
  position: z.number().int().min(0).max(10000).default(10),
  visible: z.boolean().default(true),
});

export const sponsorsSettingsSchema = z.strictObject({
  title: z.string().trim().max(120).default("Sponsorlarımız"),
  sponsors: z.array(sponsorItemSchema).max(50).default([]),
});

export type SponsorItem = z.infer<typeof sponsorItemSchema>;
export type SponsorsSettings = z.infer<typeof sponsorsSettingsSchema>;

export const defaultSponsorsSettings: SponsorsSettings = {
  title: "Sponsorlarımız",
  sponsors: [
    {
      id: "sponsor-dijipin",
      name: "Dijipin",
      logoUrl: "/community/01-anasayfa/sponsorlar/sponsor-dijipin-logo.webp",
      websiteUrl: "https://dijipin.com",
      position: 10,
      visible: true,
    },
  ],
};
