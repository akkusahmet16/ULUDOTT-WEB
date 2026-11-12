import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  resolveSozlukSession,
  SOZLUK_SESSION_COOKIE,
  type SozlukSessionAuthor,
} from "./sozluk-auth-service.ts";

export async function getSozlukAuthorFromCookies(): Promise<SozlukSessionAuthor | null> {
  const store = await cookies();
  const token = store.get(SOZLUK_SESSION_COOKIE)?.value;
  return resolveSozlukSession(token);
}

export function isHttpsRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0]?.trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

const ERROR_STATUS_MAP: Record<string, { status: number; message: string }> = {
  SOZLUK_NICK_TAKEN: { status: 409, message: "Bu mahlas zaten alınmış." },
  SOZLUK_EMAIL_TAKEN: { status: 409, message: "Bu e-posta zaten kayıtlı." },
  SOZLUK_INVALID_CREDENTIALS: {
    status: 401,
    message: "Mahlas/e-posta veya parola hatalı.",
  },
  SOZLUK_ACCOUNT_BANNED: { status: 403, message: "Hesap askıya alınmış." },
  SOZLUK_AUTHOR_MUTED: { status: 403, message: "Hesap geçici olarak susturulmuş." },
  SOZLUK_INVALID_TITLE: { status: 400, message: "Geçersiz başlık." },
  SOZLUK_TOPIC_LOCKED: { status: 403, message: "Bu başlık kilitli." },
  SOZLUK_TOPIC_NOT_FOUND: { status: 404, message: "Başlık bulunamadı." },
  SOZLUK_ENTRY_NOT_FOUND: { status: 404, message: "Entry bulunamadı." },
  SOZLUK_FORBIDDEN: { status: 403, message: "Bu işlem için yetkiniz yok." },
};

export function sozlukErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Geçersiz girdi." },
      { status: 400 },
    );
  }
  if (error instanceof Error && error.message in ERROR_STATUS_MAP) {
    const mapped = ERROR_STATUS_MAP[error.message]!;
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
  return NextResponse.json(
    { error: "İşlem sırasında bir hata oluştu." },
    { status: 500 },
  );
}
