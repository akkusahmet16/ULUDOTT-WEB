import { z } from "zod";
import { SESSION_COOKIE, resolveSession } from "../../../../lib/auth/session";
import { readCookie, verifyCsrf } from "../../../../lib/auth/csrf";
import { readJson } from "../../../../lib/http/read-json";
import {
  listPeopleContent,
  savePeopleContent,
} from "../../../../modules/community/people-content";

export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });
async function handle(request: Request) {
  try {
    if (request.method !== "GET") {
      try {
        verifyCsrf(request);
      } catch {
        return json({ error: "İstek doğrulanamadı" }, 403);
      }
    }
    const session = await resolveSession(
      readCookie(request, SESSION_COOKIE) ?? "",
    );
    if (!session) return json({ error: "Oturum geçersiz" }, 401);
    if (request.method === "GET")
      return json({ items: await listPeopleContent(session.actor) });
    const input = z
      .strictObject({
        slot: z.string().max(120),
        expectedRevision: z.int().nonnegative(),
        fields: z.unknown(),
      })
      .parse(await readJson(request, 16 * 1024));
    return json(
      await savePeopleContent(
        session.actor,
        input.slot,
        input.fields,
        input.expectedRevision,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Yetki yok") return json({ error: message }, 403);
    if (message === "Sürüm çakışması")
      return json(
        { error: "Başka bir yönetici bu alanı değiştirdi. Sayfayı yenileyin." },
        409,
      );
    if (
      [
        "Bilinmeyen alan",
        "Medya yayında değil",
        "Medya dosyası bulunamadı",
      ].includes(message)
    )
      return json({ error: message }, 400);
    if (error instanceof z.ZodError)
      return json({ error: "Alanları ve medya yollarını kontrol edin." }, 400);
    return json({ error: "İçerik kaydedilemedi." }, 503);
  }
}
export const GET = handle;
export const POST = handle;
