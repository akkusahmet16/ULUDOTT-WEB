import { COOKIE_KEYS } from "../../config/storage-keys.ts";

export function authCookiePolicy(appUrl: string) {
  const secure = new URL(appUrl).protocol === "https:";
  return {
    sessionName: secure
      ? COOKIE_KEYS.adminSessionHttps
      : COOKIE_KEYS.adminSessionHttp,
    csrfName: secure ? COOKIE_KEYS.adminCsrfHttps : COOKIE_KEYS.adminCsrfHttp,
    secure,
  } as const;
}
