import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { routeClass, securityHeaders } from "./lib/security/headers";
import { edgeDecision } from "./lib/security/edge-policy";
export function proxy(request: NextRequest) {
  const nonce = randomBytes(18).toString("base64"),
    kind = routeClass(request.nextUrl.pathname);
  const secure = securityHeaders(
    kind,
    nonce,
    process.env.NODE_ENV === "production" &&
      new URL(process.env.APP_URL ?? request.url).protocol === "https:",
  );
  const denied = edgeDecision(request);
  if (denied)
    return NextResponse.json(
      { error: "İstek kabul edilmedi." },
      { status: denied, headers: { ...secure, "Cache-Control": "no-store" } },
    );
  const headers = new Headers(request.headers);
  headers.delete("x-uludott-origin");
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", secure["Content-Security-Policy"]);
  const response = NextResponse.next({ request: { headers } });
  for (const [name, value] of Object.entries(secure))
    response.headers.set(name, value);
  return response;
}
