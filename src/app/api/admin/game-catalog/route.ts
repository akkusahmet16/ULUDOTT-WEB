import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "../../../../lib/cache/tags.ts";
import { z } from "zod";
import {
  adminActor,
  formError,
  privateHeaders,
} from "../../../../modules/forms/application/admin-http";
import { readJson } from "../../../../lib/http/read-json";
import {
  listSiteGames,
  saveSiteGame,
  removeSiteGame,
} from "../../../../modules/games/application/site-game-service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return Response.json(
      { items: await listSiteGames(await adminActor(request)) },
      { headers: privateHeaders },
    );
  } catch (error) {
    return formError(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await adminActor(request);
    const data = z
      .strictObject({
        action: z.enum(["save", "remove"]),
        id: z.uuid().optional(),
        expectedRevision: z.int().nonnegative().optional(),
        input: z.unknown().optional(),
      })
      .parse(await readJson(request, 32 * 1024));
    const result =
      data.action === "save"
        ? await saveSiteGame(actor, data.input, data.id, data.expectedRevision)
        : await removeSiteGame(
            actor,
            z.uuid().parse(data.id),
            z.int().nonnegative().parse(data.expectedRevision),
          );
    revalidateTag(CACHE_TAGS.siteGames, { expire: 0 });
    return Response.json(result, {
      status: data.action === "save" && !data.id ? 201 : 200,
      headers: privateHeaders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "Alanları kontrol edin." },
        { status: 400, headers: privateHeaders },
      );
    }
    const message = error instanceof Error ? error.message : "";
    if (
      [
        "Oyun bulunamadı",
        "İzin verilmeyen medya yolu",
        "Medya dosyası bulunamadı veya izin verilmiyor",
      ].includes(message)
    )
      return Response.json(
        { error: message },
        { status: 400, headers: privateHeaders },
      );
    return formError(error);
  }
}
