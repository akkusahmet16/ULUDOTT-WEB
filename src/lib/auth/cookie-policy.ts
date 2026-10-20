export function authCookiePolicy(appUrl: string) {
  const secure = new URL(appUrl).protocol === "https:";
  return {
    sessionName: secure ? "__Host-uludott_admin" : "uludott_admin_local",
    csrfName: secure ? "__Host-uludott_csrf" : "uludott_csrf_local",
    secure,
  } as const;
}
