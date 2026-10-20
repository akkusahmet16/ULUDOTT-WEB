import { z } from "zod";
import {
  adminActor,
  formError,
  privateHeaders,
} from "../../../../modules/forms/application/admin-http";
import { requirePermission } from "../../../../modules/admin/domain/permissions";
import { listSiteAssets } from "../../../../modules/media/application/site-assets";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await adminActor(request);
    const scope = z
      .enum(["people", "games", "ulujam"])
      .parse(new URL(request.url).searchParams.get("scope"));
    requirePermission(
      actor,
      scope === "games" ? "games.edit" : "content.write",
    );
    return Response.json(
      { items: await listSiteAssets(scope) },
      { headers: privateHeaders },
    );
  } catch (error) {
    return formError(error);
  }
}
