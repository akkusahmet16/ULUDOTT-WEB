import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { randomToken, tokenHash } from "../../../lib/auth/crypto.ts";
import { authKey } from "../../../lib/config/auth.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { normalizeSozlukNick } from "../domain/slug.ts";
import {
  googleOnboardingSchema,
  type GoogleOnboardingInput,
} from "../domain/validation.ts";
import {
  findActiveAuthorSession,
  findAuthorByGoogleSub,
  findAuthorByIdentifier,
  findAuthorByNick,
  insertAuthor,
  insertAuthorSession,
  linkAuthorGoogleSub,
  revokeAuthorSessionByTokenHash,
} from "../infrastructure/sozluk-repository.ts";

export const SOZLUK_SESSION_COOKIE = "ulusozluk_session";
export const SOZLUK_OAUTH_STATE_COOKIE = "ulusozluk_oauth_state";
export const SOZLUK_ONBOARDING_COOKIE = "ulusozluk_google_onboarding";

const SESSION_TTL_MS = 14 * 24 * 60 * 60_000;
const ONBOARDING_TTL_MS = 15 * 60_000;

export function sozlukCookieOptions(isHttps: boolean, maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds ?? Math.floor(SESSION_TTL_MS / 1000),
  };
}

export interface SozlukSessionAuthor {
  readonly id: string;
  readonly nick: string;
  readonly rank: string;
  readonly status: string;
  readonly bio: string;
}

export interface GoogleOnboardingClaims {
  readonly sub: string;
  readonly email: string;
  readonly exp: number;
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", authKey())
    .update(`sozluk-google:${payloadB64}`)
    .digest("base64url");
}

export function createGoogleOnboardingToken(sub: string, email: string): string {
  const claims: GoogleOnboardingClaims = {
    sub,
    email: email.trim().toLowerCase(),
    exp: Date.now() + ONBOARDING_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url",
  );
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyGoogleOnboardingToken(
  token: string | undefined,
): GoogleOnboardingClaims | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = signPayload(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as GoogleOnboardingClaims;
    if (!parsed.sub || !parsed.email || parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function authenticateWithGoogleProfile(profile: {
  sub: string;
  email: string;
}): Promise<
  | { readonly kind: "signed_in"; readonly token: string; readonly author: SozlukSessionAuthor }
  | { readonly kind: "needs_onboarding" }
> {
  const normalizedEmail = profile.email.trim().toLowerCase();

  return withTransaction(async (tx) => {
    let author = await findAuthorByGoogleSub(tx, profile.sub);
    if (!author) {
      const byEmail = await findAuthorByIdentifier(tx, normalizedEmail);
      if (byEmail) {
        await linkAuthorGoogleSub(tx, byEmail.id, profile.sub);
        author = { ...byEmail, googleSub: profile.sub };
      }
    }

    if (!author) {
      return { kind: "needs_onboarding" as const };
    }
    if (author.status === "banned") {
      throw new Error("SOZLUK_ACCOUNT_BANNED");
    }

    const token = randomToken();
    await insertAuthorSession(tx, {
      authorId: author.id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });

    return {
      kind: "signed_in" as const,
      token,
      author: {
        id: author.id,
        nick: author.nick,
        rank: author.rank,
        status: author.status,
        bio: author.bio,
      },
    };
  });
}

export async function completeGoogleOnboarding(
  claims: GoogleOnboardingClaims,
  raw: GoogleOnboardingInput,
) {
  const input = googleOnboardingSchema.parse(raw);
  const normalizedNick = normalizeSozlukNick(input.nick);

  return withTransaction(async (tx) => {
    const existingNick = await findAuthorByNick(tx, normalizedNick);
    if (existingNick) {
      throw new Error("SOZLUK_NICK_TAKEN");
    }
    const existingEmail = await findAuthorByIdentifier(tx, claims.email);
    if (existingEmail) {
      throw new Error("SOZLUK_EMAIL_TAKEN");
    }

    const author = await insertAuthor(tx, {
      nick: input.nick.trim(),
      normalizedNick,
      email: claims.email,
      googleSub: claims.sub,
      passwordHash: null,
      bio: input.bio ?? "",
      rank: "yazar",
    });

    const token = randomToken();
    await insertAuthorSession(tx, {
      authorId: author.id,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });

    return {
      token,
      author: {
        id: author.id,
        nick: author.nick,
        rank: author.rank,
        status: author.status,
        bio: author.bio,
      } satisfies SozlukSessionAuthor,
    };
  });
}

export async function resolveSozlukSession(
  token: string | undefined,
): Promise<SozlukSessionAuthor | null> {
  if (!token || !/^[A-Za-z0-9_-]{32,64}$/.test(token)) {
    return null;
  }
  return withTransaction(async (tx) => {
    const row = await findActiveAuthorSession(tx, tokenHash(token));
    if (!row) return null;
    if (row.session.expiresAt.getTime() <= Date.now()) return null;
    if (row.author.status === "banned") return null;

    return {
      id: row.author.id,
      nick: row.author.nick,
      rank: row.author.rank,
      status: row.author.status,
      bio: row.author.bio,
    };
  });
}

export async function logoutSozlukSession(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{32,64}$/.test(token)) return;
  await withTransaction(async (tx) => {
    await revokeAuthorSessionByTokenHash(tx, tokenHash(token));
  });
}
