import {
  adminActor,
  formError,
  privateHeaders,
} from "../../../../modules/forms/application/admin-http";
import { requirePermission } from "../../../../modules/admin/domain/permissions";
import {
  listSiteAssets,
  uploadSiteAsset,
  deleteSiteAsset,
} from "../../../../modules/media/application/site-assets";
import {
  SITE_ASSET_SCOPES,
  type SiteAssetScope,
} from "../../../../modules/media/domain/site-asset";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await adminActor(request);
    const rawScope = new URL(request.url).searchParams.get("scope");
    const scope: SiteAssetScope =
      rawScope && (SITE_ASSET_SCOPES as readonly string[]).includes(rawScope)
        ? (rawScope as SiteAssetScope)
        : "all";

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
    const rawScope = formData.get("scope");
    const scope: SiteAssetScope =
      rawScope &&
      (SITE_ASSET_SCOPES as readonly string[]).includes(String(rawScope))
        ? (String(rawScope) as SiteAssetScope)
        : "general";

    requirePermission(
      actor,
      scope === "games" ? "games.edit" : "content.write",
    );
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json(
        { error: "Dosya zorunludur" },
        { status: 400, headers: privateHeaders },
      );
    }
    const item = await uploadSiteAsset(scope, file);
    return Response.json({ item }, { status: 201, headers: privateHeaders });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Failed to parse body as FormData")) {
        return Response.json(
          {
            error:
              "Dosya yükleme akışı tamamlanamadı. Dosya boyutu sunucu (Nginx reverse proxy) sınırını aşmış olabilir. Nginx yapılandırmanızda 'client_max_body_size 100M;' tanımlı olduğundan emin olun.",
          },
          { status: 413, headers: privateHeaders },
        );
      }
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
        { error: error.message || "Dosya yüklenemedi" },
        { status: 400, headers: privateHeaders },
      );
    }
    return formError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await adminActor(request);
    requirePermission(actor, "content.write");

    let targetPath = "";
    const url = new URL(request.url);
    if (url.searchParams.has("path")) {
      targetPath = url.searchParams.get("path") || "";
    } else {
      try {
        const body = await request.json();
        targetPath = body.path || "";
      } catch {
        targetPath = "";
      }
    }

    if (!targetPath) {
      return Response.json(
        { error: "Silinecek dosya yolu belirtilmedi" },
        { status: 400, headers: privateHeaders },
      );
    }

    const result = await deleteSiteAsset(targetPath);
    return Response.json(
      { ok: true, deletedPath: result.path },
      { headers: privateHeaders },
    );
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
      return Response.json(
        { error: error.message || "Dosya silinemedi" },
        { status: 400, headers: privateHeaders },
      );
    }
    return formError(error);
  }
}

