import "server-only";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "../../../lib/cache/tags.ts";
import { z } from "zod";
import {
  adminActor,
  formError,
  privateHeaders,
} from "../../forms/application/admin-http.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { readJson } from "../../../lib/http/read-json.ts";
import { getContactSettings, saveContactSettings } from "./contact-settings.ts";
import { ulujamEditorData, saveUlujamSettings } from "./ulujam-settings.ts";
import { listArchives, saveArchive } from "./archives.ts";
import { listPublishedSiteGames } from "../../games/application/site-game-service.ts";
export function settingsHandler(scope: "ulujam" | "archives" | "contact") {
  return async (request: Request) => {
    try {
      const actor = await adminActor(request);
      requirePermission(
        actor,
        scope === "contact" ? "links.write" : "publication.write",
      );
      if (request.method === "GET") {
        const data =
          scope === "ulujam"
            ? await ulujamEditorData(actor)
            : scope === "contact"
              ? await getContactSettings()
              : {
                  items: await listArchives(actor),
                  gameOptions: await listPublishedSiteGames(),
                };
        return Response.json(data, { headers: privateHeaders });
      }
      const data = z
        .strictObject({
          input: z.unknown(),
          expectedRevision: z.int().nonnegative(),
        })
        .parse(await readJson(request, 128 * 1024));
      const result =
        scope === "ulujam"
          ? await saveUlujamSettings(actor, data.input, data.expectedRevision)
          : scope === "contact"
            ? await saveContactSettings(
                actor,
                data.input,
                data.expectedRevision,
              )
            : await saveArchive(actor, data.input, data.expectedRevision);
      revalidateTag(CACHE_TAGS.siteSettings, { expire: 0 });
      if (scope !== "contact") {
        revalidateTag(CACHE_TAGS.ulujam, { expire: 0 });
      }
      return Response.json(result, { headers: privateHeaders });
    } catch (error) {
      if (error instanceof z.ZodError)
        return Response.json(
          { error: error.issues[0]?.message ?? "Alanları kontrol edin." },
          { status: 400, headers: privateHeaders },
        );
      const message = error instanceof Error ? error.message : "";
      if (
        [
          "UluJam başvuru formu bulunamadı",
          "Başvuru formunu önce Form oluşturucu üzerinden yayımlayın",
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
  };
}
