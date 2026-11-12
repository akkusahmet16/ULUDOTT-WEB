import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { randomToken } from "../../../../../lib/auth/crypto.ts";
import {
  SOZLUK_OAUTH_STATE_COOKIE,
  sozlukCookieOptions,
} from "../../../../../modules/sozluk/application/sozluk-auth-service.ts";
import { isHttpsRequest } from "../../../../../modules/sozluk/application/sozluk-http.ts";

function getGoogleCallbackUrl(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const proto = isHttpsRequest(request) ? "https" : "http";
  return `${proto}://${host}/api/sozluk/auth/google/callback`;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth yapılandırılmamış (GOOGLE_CLIENT_ID eksik)." },
      { status: 503 },
    );
  }

  const state = randomToken();
  const codeVerifier = randomToken();
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getGoogleCallbackUrl(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(
    SOZLUK_OAUTH_STATE_COOKIE,
    JSON.stringify({ state, codeVerifier }),
    sozlukCookieOptions(isHttpsRequest(request), 600),
  );
  return response;
}
