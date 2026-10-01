import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withTransaction } from "../../../lib/database/transaction.ts";
import {
  SESSION_COOKIE,
  cookieOptions,
  resolveSession,
  renewSession,
  revokeSession,
} from "../../../lib/auth/session.ts";
import {
  CSRF_COOKIE,
  issueCsrf,
  verifyCsrf,
  readCookie,
} from "../../../lib/auth/csrf.ts";
import { loginRateAllowed } from "../infrastructure/admin-repository.ts";
import { authenticateAdmin } from "./auth-service.ts";
const securityHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
const bodySchema = z.strictObject({
  email: z.email().max(254),
  password: z.string().min(1).max(1024),
  mfaCode: z.string().min(1).max(64),
});
function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: securityHeaders });
}
async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("BODY");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new Error("BODY");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("BODY");
  } finally {
    reader.releaseLock();
  }
}
export async function handleAdminRequest(
  action: "csrf" | "session" | "login" | "logout" | "renew",
  request: Request,
) {
  try {
    const token = readCookie(request, SESSION_COOKIE) ?? "";
    if (action === "csrf") {
      const csrf = issueCsrf(token || undefined);
      const r = response({ csrfToken: csrf });
      r.cookies.set(CSRF_COOKIE, csrf, { ...cookieOptions, maxAge: 3600 });
      return r;
    }
    if (action === "session") {
      const session = await resolveSession(token);
      return session
        ? response({ actor: session.actor, expiresAt: session.expiresAt })
        : response({ error: "Oturum geçersiz" }, 401);
    }
    try {
      verifyCsrf(request);
    } catch {
      return response({ error: "İstek doğrulanamadı" }, 403);
    }
    if (action === "login") {
      const allowed = await withTransaction(loginRateAllowed);
      if (!allowed)
        return response(
          { error: "Çok fazla deneme. Daha sonra tekrar deneyin." },
          429,
        );
      let data: ReturnType<typeof bodySchema.parse>;
      try {
        data = bodySchema.parse(await readBody(request));
      } catch {
        return response({ error: "Giriş alanlarını kontrol edin." }, 400);
      }
      try {
        const session = await authenticateAdmin(
          data.email,
          data.password,
          data.mfaCode,
        );
        const r = response({ ok: true });
        r.cookies.set(SESSION_COOKIE, session.token, {
          ...cookieOptions,
          expires: session.expiresAt,
        });
        return r;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Giriş bilgileri doğrulanamadı"
        )
          return response({ error: "Giriş bilgileri doğrulanamadı" }, 401);
        throw error;
      }
    }
    const session = await resolveSession(token);
    if (!session) return response({ error: "Oturum geçersiz" }, 401);
    if (action === "renew") {
      const next = await renewSession(token);
      const r = response({ ok: true });
      r.cookies.set(SESSION_COOKIE, next.token, {
        ...cookieOptions,
        expires: next.expiresAt,
      });
      return r;
    }
    await revokeSession(session.id);
    const r = response({ ok: true });
    r.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    r.cookies.set(CSRF_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return r;
  } catch {
    return response({ error: "İşlem şu anda tamamlanamadı." }, 503);
  }
}
