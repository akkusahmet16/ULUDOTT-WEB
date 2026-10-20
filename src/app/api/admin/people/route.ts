import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "../../../../lib/cache/tags.ts";
import { z } from "zod";
import { SESSION_COOKIE, resolveSession } from "../../../../lib/auth/session";
import { readCookie, verifyCsrf } from "../../../../lib/auth/csrf";
import { readJson } from "../../../../lib/http/read-json";
import {
  listPeopleContent,
  savePeopleContent,
  savePeopleMember,
  removePeopleMember,
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
        action: z.enum(["save", "create", "remove"]).default("save"),
        slot: z.string().max(120).optional(),
        expectedRevision: z.int().nonnegative().optional(),
        fields: z.unknown().optional(),
      })
      .parse(await readJson(request, 16 * 1024));
    if (input.action === "create") {
      const result = await savePeopleMember(session.actor, input.fields);
      revalidateTag(CACHE_TAGS.people, { expire: 0 });
      return json(result, 201);
    }
    const slot = z.string().min(1).parse(input.slot);
    const revision = z.int().nonnegative().parse(input.expectedRevision);
    if (input.action === "remove") {
      const result = await removePeopleMember(session.actor, slot, revision);
      revalidateTag(CACHE_TAGS.people, { expire: 0 });
      return json(result);
    }
    const result = await savePeopleContent(
      session.actor,
      slot,
      input.fields,
      revision,
    );
    revalidateTag(CACHE_TAGS.people, { expire: 0 });
    return json(result);
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
        "Bilinmeyen bölüm",
        "İzin verilmeyen medya yolu",
        "Medya dosyası bulunamadı veya izin verilmiyor",
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
