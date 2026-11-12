import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  logoutSozlukSession,
  SOZLUK_SESSION_COOKIE,
} from "../../../../../modules/sozluk/application/sozluk-auth-service.ts";

export async function POST() {
  const store = await cookies();
  const token = store.get(SOZLUK_SESSION_COOKIE)?.value;
  await logoutSozlukSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SOZLUK_SESSION_COOKIE);
  return response;
}
