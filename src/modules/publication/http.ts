import "server-only";
import { z } from "zod";
import { resolveSession, SESSION_COOKIE } from "../../lib/auth/session.ts";
import { readCookie, verifyCsrf } from "../../lib/auth/csrf.ts";
import { save, list, preview, transition, editorOptions } from "./service.ts";
import type { ContentType } from "./domain.ts";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
async function body(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("Geçersiz istek");
  let size = 0,
    timedOut = false;
  const chunks: Uint8Array[] = [];
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel();
  }, 10000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) throw Error("İstek süresi aşıldı");
      if (done) break;
      size += value.byteLength;
      if (size > 128 * 1024) {
        await reader.cancel();
        throw Error("İstek çok büyük");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
export function handler(type: ContentType) {
  return async (request: Request) => {
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
      if (request.method === "GET") {
        const id = new URL(request.url).searchParams.get("preview");
        return json(
          id
            ? await preview(type, id, session.actor)
            : {
                items: await list(type, session.actor),
                options: await editorOptions(session.actor),
              },
        );
      }
      if (request.method !== "POST")
        return json({ error: "Yöntem desteklenmiyor" }, 405);
      const d = z
        .strictObject({
          action: z.enum([
            "save",
            "publish",
            "draft",
            "archive",
            "ended",
            "cancelled",
          ]),
          id: z.uuid().optional(),
          expectedRevision: z.int().positive().optional(),
          confirmed: z.literal(true).optional(),
          input: z.unknown().optional(),
        })
        .parse(await body(request));
      if (d.action === "save")
        return json(
          await save(type, session.actor, d.input, d.id, d.expectedRevision),
          d.id ? 200 : 201,
        );
      if (!d.id || !d.expectedRevision || !d.confirmed)
        throw Error("İşlem onayı ve sürüm gerekli");
      return json(
        await transition(
          type,
          d.id,
          session.actor,
          d.expectedRevision,
          d.action === "archive" ? "archived" : d.action,
        ),
      );
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m === "Yetki yok") return json({ error: m }, 403);
      if (m === "Sürüm çakışması")
        return json(
          {
            error:
              "Sürüm çakışması. Listeyi yenileyip değişiklikleri inceleyin.",
          },
          409,
        );
      if (m === "İstek çok büyük") return json({ error: m }, 413);
      const safe = [
        "Yayın için tarih ve konum gerekli",
        "Afiş yayımlanmalı",
        "CTA hedefi yayında değil",
        "Afiş hazır değil",
        "Slug kullanılıyor",
        "İçerik yok",
        "Form aynı etkinliğe bağlı olmalı",
        "Yayın penceresi bitti",
      ];
      return json(
        {
          error: safe.includes(m)
            ? m
            : "İşlem tamamlanamadı. Alanları, zaman aralığını ve izinleri kontrol edin.",
        },
        400,
      );
    }
  };
}
