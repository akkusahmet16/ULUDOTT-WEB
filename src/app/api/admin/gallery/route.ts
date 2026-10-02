import { resolveSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { readCookie, verifyCsrf } from "../../../../lib/auth/csrf";
import { readJson } from "../../../../lib/http/read-json";
import {
  saveGallery,
  galleryInventory,
} from "../../../../modules/events/application/ulujam-service";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (d: unknown, s = 200) => Response.json(d, { status: s, headers });
async function handle(req: Request) {
  try {
    if (req.method === "POST") {
      try {
        verifyCsrf(req);
      } catch {
        return json({ error: "İstek doğrulanamadı" }, 403);
      }
    }
    const session = await resolveSession(readCookie(req, SESSION_COOKIE) ?? "");
    if (!session) return json({ error: "Oturum geçersiz" }, 401);
    if (req.method === "GET")
      return json(
        await galleryInventory(
          session.actor,
          new URL(req.url).searchParams.get("eventId") ?? "",
        ),
      );
    await saveGallery(session.actor, await readJson(req));
    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return json(
      {
        error:
          message === "Yetki yok"
            ? message
            : message === "Sürüm çakışması"
              ? "Sürüm çakışması; listeyi yenileyin."
              : "Galeri kaydedilemedi. Alanları ve medya uygunluğunu kontrol edin.",
      },
      message === "Yetki yok" ? 403 : message === "Sürüm çakışması" ? 409 : 400,
    );
  }
}
export const GET = handle;
export const POST = handle;
