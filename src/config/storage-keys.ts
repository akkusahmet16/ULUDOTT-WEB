export const STORAGE_KEYS = {
  theme: "uludott-theme",
  introSeen: "uludott-intro-seen",
} as const;

export type StorageKeyId = keyof typeof STORAGE_KEYS;
export type StorageKeyValue = (typeof STORAGE_KEYS)[StorageKeyId];

export const COOKIE_KEYS = {
  locale: "uludott-lang",
  adminSessionHttps: "__Host-uludott_admin",
  adminSessionHttp: "uludott_admin_local",
  adminCsrfHttps: "__Host-uludott_csrf",
  adminCsrfHttp: "uludott_csrf_local",
  teamSession: "__Host-uludott_team",
} as const;

export type CookieKeyId = keyof typeof COOKIE_KEYS;
export type CookieKeyValue = (typeof COOKIE_KEYS)[CookieKeyId];
