export { verifyCsrf as requireCsrf } from "../auth/csrf.ts";
export type RouteClass = "private" | "public" | "asset";
export function routeClass(path: string): RouteClass {
  if (
    /^\/(admin(?:\/|$)|api\/(admin|forms|submissions|ulujam|team|cards|wallet)(?:\/|$)|basvuru(?:\/|$)|makbuz(?:\/|$)|kart(?:\/|$)|takim(?:\/|$)|yayin-onayi(?:\/|$))/.test(
      path,
    )
  )
    return "private";
  return path.startsWith("/_next/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/media/") ||
    /\.[a-z0-9]{2,6}$/i.test(path)
    ? "asset"
    : "public";
}
export function securityHeaders(
  kind: RouteClass,
  nonce: string,
  production: boolean,
): Record<string, string> {
  if (!/^[a-zA-Z0-9+/=_-]{16,100}$/.test(nonce)) throw Error("CSP_NONCE");
  const result: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy":
      kind === "private" ? "no-referrer" : "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com${production ? "" : " ws: wss:"}; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
  };
  if (production) result["Strict-Transport-Security"] = "max-age=31536000";
  if (kind === "private" || kind === "public")
    result["Cache-Control"] = "no-store"; // nonce-bearing HTML must never share a cached response.
  if (kind === "private") result["X-Robots-Tag"] = "noindex, nofollow";
  return result;
}
