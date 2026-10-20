export type SiteAssetScope = "people" | "games" | "ulujam";
export type SiteAssetKind = "image" | "video";
export type SiteAsset = {
  path: string;
  name: string;
  folder: string;
  kind: SiteAssetKind;
};
