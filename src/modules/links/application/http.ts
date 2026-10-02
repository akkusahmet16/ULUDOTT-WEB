import "server-only";
import { z } from "zod";
import { readJson } from "../../../lib/http/read-json.ts";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session.ts";
import { readCookie, verifyCsrf } from "../../../lib/auth/csrf.ts";
import {
  saveLink,
  saveGroup,
  listLinks,
  hideLink,
  reorderLinks,
  reorderGroups,
} from "./link-service.ts";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
export async function handleLinks(request: Request) {
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
    if (request.method === "GET") return json(await listLinks(session.actor));
    if (request.method !== "POST")
      return json({ error: "Yöntem desteklenmiyor" }, 405);
    const d = z
      .strictObject({
        action: z.enum([
          "save_link",
          "save_group",
          "hide",
          "reorder_links",
          "reorder_groups",
        ]),
        input: z.unknown().optional(),
        id: z.uuid().optional(),
        expectedRevision: z.int().positive().optional(),
        orderedIds: z.array(z.uuid()).min(1).max(200).optional(),
        expectedRevisions: z.record(z.uuid(), z.int().positive()).optional(),
      })
      .parse(await readJson(request));
    if (d.action === "save_link")
      return json(await saveLink(session.actor, d.input));
    if (d.action === "save_group")
      return json(await saveGroup(session.actor, d.input));
    if (d.action === "hide") {
      if (!d.id || !d.expectedRevision) throw Error("Geçersiz istek");
      return json(await hideLink(session.actor, d.id, d.expectedRevision));
    }
    if (!d.orderedIds || !d.expectedRevisions) throw Error("Geçersiz istek");
    if (d.action === "reorder_links")
      await reorderLinks(session.actor, d.orderedIds, d.expectedRevisions);
    else await reorderGroups(session.actor, d.orderedIds, d.expectedRevisions);
    return json({ ok: true });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "Yetki yok") return json({ error: m }, 403);
    if (m === "Sürüm çakışması")
      return json(
        { error: "Sürüm çakışması. Listeyi yenileyip tekrar inceleyin." },
        409,
      );
    if (m === "İstek çok büyük") return json({ error: m }, 413);
    const safe = [
      "Kategori yok",
      "Kayıt yok",
      "Sıra kullanılıyor",
      "Dış adresi doğrulayın",
      "Bağlantı hedefi yayında değil",
      "Eksik veya geçersiz sıra",
      "Bağlantı sınırı",
      "Kategori sınırı",
    ];
    return json(
      {
        error: safe.includes(m)
          ? m
          : "Bağlantı işlemi tamamlanamadı. Alanları ve yayın aralığını kontrol edin.",
      },
      400,
    );
  }
}
