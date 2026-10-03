import { timingSafeEqual } from "node:crypto";
export function edgeDecision(
  req: Request,
  originSecret = process.env.ORIGIN_SHARED_SECRET,
): number | null {
  if (originSecret) {
    const a = Buffer.from(originSecret),
      b = Buffer.from(req.headers.get("x-uludott-origin") ?? "");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return 403;
  }
  if (
    !["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(
      req.method,
    )
  )
    return 405;
  const path = new URL(req.url).pathname;
  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    path.startsWith("/api/")
  ) {
    const length = req.headers.get("content-length");
    const limit =
      path === "/api/admin/media" ? 8 * 1024 * 1024 + 64 * 1024 : 128 * 1024;
    if (
      length !== null &&
      (!/^\d{1,12}$/.test(length) || Number(length) > limit)
    )
      return 413;
  }
  return null;
}
