import { z } from "zod";
import {
  adminActor,
  formError,
  privateHeaders,
} from "../../../../modules/forms/application/admin-http";
import { requirePermission } from "../../../../modules/admin/domain/permissions";
import {
  listSiteAssets,
  uploadSiteAsset,
} from "../../../../modules/media/application/site-assets";

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

export async function POST(request: Request) {
  try {
    const actor = await adminActor(request);
    const formData = await request.formData();
    const scope = z
      .enum(["people", "games", "ulujam"])
      .parse(formData.get("scope"));
    requirePermission(
      actor,
      scope === "games" ? "games.edit" : "content.write",
    );
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json(
        { error: "Görsel dosyası zorunludur" },
        { status: 400, headers: privateHeaders },
      );
    }
    const item = await uploadSiteAsset(scope, file);
    return Response.json({ item }, { status: 201, headers: privateHeaders });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Yetki yok") {
        return Response.json(
          { error: error.message },
          { status: 403, headers: privateHeaders },
        );
      }
      if (error.message === "Oturum geçersiz") {
        return Response.json(
          { error: error.message },
          { status: 401, headers: privateHeaders },
        );
      }
      if (error.message.startsWith("CSRF")) {
        return Response.json(
          { error: error.message },
          { status: 403, headers: privateHeaders },
        );
      }
      return Response.json(
        { error: error.message || "Görsel yüklenemedi" },
        { status: 400, headers: privateHeaders },
      );
    }
    return formError(error);
  }
}

