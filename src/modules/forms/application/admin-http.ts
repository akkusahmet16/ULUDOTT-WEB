import "server-only";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "../../../lib/cache/tags.ts";
import { z } from "zod";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session.ts";
import { readCookie, verifyCsrf } from "../../../lib/auth/csrf.ts";
import { readJson } from "../../../lib/http/read-json.ts";
import {
  createDraftForm,
  saveDraftForm,
  saveFormSettings,
  publishForm,
  pauseForm,
  closeForm,
  getForm,
  listForms,
} from "./form-service.ts";
export const privateHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function adminActor(req: Request) {
  if (req.method !== "GET") verifyCsrf(req);
  const s = await resolveSession(readCookie(req, SESSION_COOKIE) ?? "");
  if (!s) throw Error("Oturum geçersiz");
  return s.actor;
}
export function formError(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  const safe = [
    "Başvuru bulunamadı",
    "Geçersiz sayfa",
    "Durum geçişi geçersiz",
    "Kontenjan dolu",
    "Rıza yönetici tarafından değiştirilemez",
    "Bu e-posta ile başvuru mevcut",
    "Bağlı katılımcı kaydı önce yönetilmelidir",
    "Dışa aktarma sınırı aşıldı; filtreleri daraltın",
    "Yetki yok",
    "Oturum geçersiz",
    "Sürüm çakışması",
    "Başlangıç tarihi gerekli",
    "En az bir alan gerekli",
    "Formun tarih penceresi geçmiş",
    "Yayımlı form adresi değiştirilemez",
    "Form henüz yayımlanmadı",
    "Form bulunamadı",
    "Tekrar politikası tek zorunlu koşulsuz e-posta alanı gerektirir",
    "UluJam formunda dosya alanı kullanılamaz",
  ];
  const status =
    m === "Yetki yok"
      ? 403
      : m === "Oturum geçersiz"
        ? 401
        : m === "Sürüm çakışması"
          ? 409
          : m.startsWith("CSRF")
            ? 403
            : m === "İstek çok büyük"
              ? 413
              : 400;
  return Response.json(
    {
      error: safe.includes(m)
        ? m
        : "İşlem tamamlanamadı. Alanları, kuralları ve tarihleri kontrol edin.",
    },
    { status, headers: privateHeaders },
  );
}
export async function handleForms(req: Request, id?: string) {
  try {
    const actor = await adminActor(req);
    if (req.method === "GET")
      return Response.json(
        id ? await getForm(actor, id) : await listForms(actor),
        { headers: privateHeaders },
      );
    if (!id) {
      const d = z
        .strictObject({
          eventId: z.uuid(),
          settings: z.unknown(),
          definition: z.unknown().optional(),
          publish: z.boolean().optional(),
        })
        .parse(await readJson(req, 128 * 1024));
      const created = await createDraftForm(actor, d.eventId, d.settings);
      let revision = created.revision;
      if (d.definition) {
        const saved = await saveDraftForm(actor, created.id, d.definition, revision);
        revision = saved.revision;
      }
      if (d.publish) {
        const pub = await publishForm(actor, created.id, revision);
        revision = pub.revision;
      }
      revalidateTag(CACHE_TAGS.events, { expire: 0 });
      revalidateTag(CACHE_TAGS.ulujam, { expire: 0 });
      return Response.json(
        { id: created.id, revision },
        { status: 201, headers: privateHeaders },
      );
    }
    const d = z
      .strictObject({
        action: z.enum(["definition", "settings", "publish", "pause", "close"]),
        input: z.unknown().optional(),
        expectedRevision: z.int().positive(),
      })
      .parse(await readJson(req, 128 * 1024));
    const result =
      d.action === "definition"
        ? await saveDraftForm(actor, id, d.input, d.expectedRevision)
        : d.action === "settings"
          ? await saveFormSettings(actor, id, d.input, d.expectedRevision)
          : d.action === "publish"
            ? await publishForm(actor, id, d.expectedRevision)
            : d.action === "pause"
              ? await pauseForm(actor, id, d.expectedRevision)
              : await closeForm(actor, id, d.expectedRevision);
    revalidateTag(CACHE_TAGS.events, { expire: 0 });
    revalidateTag(CACHE_TAGS.ulujam, { expire: 0 });
    return Response.json(result, { headers: privateHeaders });
  } catch (e) {
    return formError(e);
  }
}
