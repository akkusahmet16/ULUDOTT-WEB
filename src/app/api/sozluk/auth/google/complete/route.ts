import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  completeGoogleOnboarding,
  SOZLUK_ONBOARDING_COOKIE,
  SOZLUK_SESSION_COOKIE,
  sozlukCookieOptions,
  verifyGoogleOnboardingToken,
} from "../../../../../../modules/sozluk/application/sozluk-auth-service.ts";
import {
  isHttpsRequest,
  sozlukErrorResponse,
} from "../../../../../../modules/sozluk/application/sozluk-http.ts";

export async function POST(request: Request) {
  const store = await cookies();
  const onboardingToken = store.get(SOZLUK_ONBOARDING_COOKIE)?.value;
  const claims = verifyGoogleOnboardingToken(onboardingToken);
  if (!claims) {
    return NextResponse.json(
      { error: "Google oturum doğrulaması süresi dolmuş. Tekrar giriş yapın." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { token, author } = await completeGoogleOnboarding(claims, body);
    const response = NextResponse.json({ author }, { status: 201 });
    response.cookies.delete(SOZLUK_ONBOARDING_COOKIE);
    response.cookies.set(
      SOZLUK_SESSION_COOKIE,
      token,
      sozlukCookieOptions(isHttpsRequest(request)),
    );
    return response;
  } catch (error) {
    return sozlukErrorResponse(error);
  }
}
