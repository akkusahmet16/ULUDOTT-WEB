import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authenticateWithGoogleProfile,
  createGoogleOnboardingToken,
  SOZLUK_OAUTH_STATE_COOKIE,
  SOZLUK_ONBOARDING_COOKIE,
  SOZLUK_SESSION_COOKIE,
  sozlukCookieOptions,
} from "../../../../../../modules/sozluk/application/sozluk-auth-service.ts";
import { isHttpsRequest } from "../../../../../../modules/sozluk/application/sozluk-http.ts";

function buildBaseOrigin(request: Request): { origin: string; isSubdomain: boolean } {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const isSubdomain =
    hostname === "sozluk.uludott.com.tr" ||
    hostname === "sozluk.localhost" ||
    hostname === "sozluk.127.0.0.1";
  const proto = isHttpsRequest(request) ? "https" : "http";
  return { origin: `${proto}://${host}`, isSubdomain };
}

export async function GET(request: Request) {
  const { origin, isSubdomain } = buildBaseOrigin(request);
  const homePath = isSubdomain ? "/" : "/sozluk";
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret || !code || !returnedState) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=oauth`);
  }

  const store = await cookies();
  const rawStateCookie = store.get(SOZLUK_OAUTH_STATE_COOKIE)?.value;
  if (!rawStateCookie) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=state`);
  }

  let parsedState: { state?: string; codeVerifier?: string };
  try {
    parsedState = JSON.parse(rawStateCookie) as {
      state?: string;
      codeVerifier?: string;
    };
  } catch {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=state`);
  }

  if (
    !parsedState.state ||
    !parsedState.codeVerifier ||
    parsedState.state !== returnedState
  ) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=state`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/sozluk/auth/google/callback`,
      grant_type: "authorization_code",
      code_verifier: parsedState.codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=token`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=token`);
  }

  const userRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  );
  if (!userRes.ok) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=userinfo`);
  }

  const userInfo = (await userRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  };
  if (!userInfo.sub || !userInfo.email || userInfo.email_verified === false) {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=email`);
  }

  try {
    const authResult = await authenticateWithGoogleProfile({
      sub: userInfo.sub,
      email: userInfo.email,
    });
    const https = isHttpsRequest(request);

    if (authResult.kind === "signed_in") {
      const response = NextResponse.redirect(`${origin}${homePath}`);
      response.cookies.delete(SOZLUK_OAUTH_STATE_COOKIE);
      response.cookies.set(
        SOZLUK_SESSION_COOKIE,
        authResult.token,
        sozlukCookieOptions(https),
      );
      return response;
    }

    const onboardingToken = createGoogleOnboardingToken(
      userInfo.sub,
      userInfo.email,
    );
    const response = NextResponse.redirect(
      `${origin}${homePath}?onboarding=1`,
    );
    response.cookies.delete(SOZLUK_OAUTH_STATE_COOKIE);
    response.cookies.set(
      SOZLUK_ONBOARDING_COOKIE,
      onboardingToken,
      sozlukCookieOptions(https, 900),
    );
    return response;
  } catch {
    return NextResponse.redirect(`${origin}${homePath}?auth_error=banned`);
  }
}
