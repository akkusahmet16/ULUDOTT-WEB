import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { routeClass, securityHeaders } from "./lib/security/headers";
import { edgeDecision } from "./lib/security/edge-policy";
const SOZLUK_BYPASS_PREFIXES = [
  "/api/",
  "/_next/",
  "/brand/",
  "/media/",
  "/uploads/",
  "/assets/",
  "/sozluk/",
];

function isSozlukHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "sozluk.uludott.com.tr" ||
    hostname === "sozluk.localhost" ||
    hostname === "sozluk.127.0.0.1"
  );
}

export function proxy(request: NextRequest) {
  console.log(
    "PROXY_HIT:",
    request.nextUrl.href,
    "HOST:",
    request.headers.get("host"),
    "PROTO:",
    request.headers.get("x-forwarded-proto"),
  );
  const sozlukSubdomain = isSozlukHost(request.headers.get("host"));
  const rawPathname = request.nextUrl.pathname;
  const shouldRewriteToSozluk =
    sozlukSubdomain &&
    rawPathname !== "/sozluk" &&
    !SOZLUK_BYPASS_PREFIXES.some((prefix) => rawPathname.startsWith(prefix)) &&
    !/\.[a-z0-9]{2,6}$/i.test(rawPathname);

  const effectivePathname = shouldRewriteToSozluk
    ? rawPathname === "/"
      ? "/sozluk"
      : `/sozluk${rawPathname}`
    : rawPathname;

  const nonce = randomBytes(18).toString("base64"),
    kind = routeClass(effectivePathname);
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

  // API rotaları (özellikle dosya yüklemeleri: fanzin PDF, medya, form submit):
  // Next.js middleware'inde `request: { headers }` verildiğinde istek gövdesi (body) tamponlanır
  // ve varsayılan 10MB sınırında akış kesilerek "Failed to parse body as FormData" hatasına yol açar.
  // API isteklerinde gövdeyi tamponlamadan ham akış olarak Route Handler'a iletiyoruz:
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    for (const [name, value] of Object.entries(secure))
      response.headers.set(name, value);
    return response;
  }

  const headers = new Headers(request.headers);
  headers.delete("x-uludott-origin");
  headers.set("x-nonce", nonce);
  headers.set("x-pathname", effectivePathname);
  if (sozlukSubdomain) headers.set("x-sozluk-host", "1");
  headers.set("Content-Security-Policy", secure["Content-Security-Policy"]);

  let response: NextResponse;
  if (shouldRewriteToSozluk) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.protocol = "http:";
    rewriteUrl.pathname = effectivePathname;
    response = NextResponse.rewrite(rewriteUrl, { request: { headers } });
  } else {
    response = NextResponse.next({ request: { headers } });
  }
  for (const [name, value] of Object.entries(secure))
    response.headers.set(name, value);
  return response;
}
