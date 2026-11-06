export const SITE_ASSET_SCOPES = [
  "all",
  "uploads",
  "people",
  "games",
  "ulujam",
  "sponsors",
  "places",
  "events",
  "fanzin",
  "homepage",
  "general",
] as const;

export type SiteAssetScope = (typeof SITE_ASSET_SCOPES)[number];
export type SiteAssetKind = "image" | "video" | "document";
export type SiteAsset = {
  path: string;
  name: string;
  folder: string;
  kind: SiteAssetKind;
  size?: number;
  updatedAt?: string;
};
