import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session.ts";
import { readCookie, verifyCsrf } from "../../../lib/auth/csrf.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { MAX_BYTES } from "../domain/media-policy.ts";
import {
  uploadMedia,
  listMedia,
  publishVariant,
  getPrivatePreview,
  previewDeletion,
  deleteMedia,
} from "./media-service.ts";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers });
}
async function boundedBody(request: Request, limit: number) {
  const r = request.body?.getReader();
  if (!r) throw new Error("Geçersiz istek");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  const timer = setTimeout(() => void r.cancel(), 10_000);
  try {
    for (;;) {
      const { done, value } = await r.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await r.cancel();
        throw new Error("Dosya boyutu sınırı");
      }
      chunks.push(value);
    }
    return Uint8Array.from(Buffer.concat(chunks)).buffer;
  } finally {
    clearTimeout(timer);
    r.releaseLock();
  }
}
export async function handleMediaRequest(request: Request) {
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
    requirePermission(session.actor, "media.write");
    if (request.method === "GET") {
      const url = new URL(request.url),
        preview = url.searchParams.get("preview"),
        deletion = url.searchParams.get("deletion");
      if (preview) {
        const v = await getPrivatePreview(session.actor, preview);
        return v
          ? new NextResponse(Uint8Array.from(v.data), {
              headers: { ...headers, "Content-Type": v.mimeType },
            })
          : json({ error: "Medya yok" }, 404);
      }
      if (deletion) return json(await previewDeletion(session.actor, deletion));
      return json({ items: await listMedia(session.actor) });
    }
    if (request.method !== "POST")
      return json({ error: "Yöntem desteklenmiyor" }, 405);
    if (
      request.headers.get("content-type")?.startsWith("multipart/form-data")
    ) {
      const bytes = await boundedBody(request, MAX_BYTES + 64 * 1024);
      const form = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": request.headers.get("content-type")! },
        body: bytes,
      }).formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("Geçersiz istek");
      const purpose = z
        .enum(["photo", "poster", "game", "social"])
        .parse(form.get("purpose"));
      const alt = z.string().parse(form.get("altText"));
      const result = await uploadMedia(session.actor, file, purpose, alt);
      return json({ id: result.id }, 201);
    }
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new Error("Geçersiz istek");
    const data = z
      .strictObject({
        action: z.enum(["publish", "delete"]),
        assetId: z.uuid(),
        confirmed: z.literal(true),
      })
      .parse(
        JSON.parse(
          Buffer.from(await boundedBody(request, 1024)).toString("utf8"),
        ),
      );
    if (data.action === "publish")
      return json({ url: await publishVariant(data.assetId, session.actor) });
    await deleteMedia(session.actor, data.assetId);
    return json({ ok: true });
  } catch (error) {
    const m = error instanceof Error ? error.message : "";
    if (m === "Yetki yok") return json({ error: "Yetki yok" }, 403);
    if (m === "Medya işleme meşgul") return json({ error: m }, 429);
    if (m === "Bağlı medya silinemez") return json({ error: m }, 409);
    if (m === "Dosya boyutu sınırı") return json({ error: m }, 413);
    return json(
      {
        error:
          "Medya işlemi tamamlanamadı. Dosyayı, alt metni ve yayın durumunu kontrol edin.",
      },
      400,
    );
  }
}
