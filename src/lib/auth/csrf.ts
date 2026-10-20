import "server-only";
import { createHmac } from "node:crypto";
import { authKey } from "../config/auth.ts";
import { loadServerConfig } from "../config/server.ts";
import { equal, randomToken, tokenHash } from "./crypto.ts";
import { authCookies, SESSION_COOKIE } from "./session.ts";
export const CSRF_COOKIE = authCookies.csrfName;
function sign(body: string) {
  return createHmac("sha256", authKey())
    .update(`csrf:v1:${body}`)
    .digest("base64url");
}
export function readCookie(request: Request, name: string) {
  const found = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  return found?.slice(name.length + 1);
}
export function issueCsrf(session?: string): string {
  const body = `${randomToken()}.${Math.floor(Date.now() / 1000) + 3600}.${tokenHash(session ?? "anonymous")}`;
  return `${body}.${sign(body)}`;
}
function allowedOrigin(origin: string | null): boolean {
  const config = loadServerConfig();
  const configured = new URL(config.appUrl);
  if (origin === configured.origin) return true;
  if (config.environment !== "development" || configured.protocol !== "http:")
    return false;
  try {
    const supplied = new URL(origin ?? "");
    const loopback = new Set(["localhost", "127.0.0.1"]);
    return (
      supplied.origin === origin &&
      supplied.protocol === configured.protocol &&
      supplied.port === configured.port &&
      loopback.has(configured.hostname) &&
      loopback.has(supplied.hostname)
    );
  } catch {
    return false;
  }
}
export function verifyCsrf(request: Request): void {
  const supplied = request.headers.get("x-csrf-token") ?? "",
    stored = readCookie(request, CSRF_COOKIE) ?? "";
  const [nonce, expires, binding, mac, ...rest] = supplied.split(".");
  if (
    !allowedOrigin(request.headers.get("origin")) ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    supplied.length > 200 ||
    !equal(supplied, stored) ||
    !nonce ||
    !expires ||
    !binding ||
    !mac ||
    rest.length
  )
    throw new Error("CSRF doğrulaması başarısız");
  const body = `${nonce}.${expires}.${binding}`;
  if (
    !/^\d{10}$/.test(expires) ||
    Number(expires) <= Date.now() / 1000 ||
    Number(expires) > Date.now() / 1000 + 3601 ||
    !equal(mac, sign(body)) ||
    !equal(
      binding,
      tokenHash(readCookie(request, SESSION_COOKIE) ?? "anonymous"),
    )
  )
    throw new Error("CSRF doğrulaması başarısız");
}
