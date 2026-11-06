import { listFanzinIssues, upsertFanzinIssue } from "../../../../modules/fanzin/application/fanzin-admin-service";
import { adminActor, privateHeaders, formError } from "../../../../modules/forms/application/admin-http";
import { requirePermission } from "../../../../modules/admin/domain/permissions";
import { readJson } from "../../../../lib/http/read-json";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await adminActor(request);
    requirePermission(actor, "content.write");
    const issues = await listFanzinIssues();
    return Response.json(issues, { headers: privateHeaders });
  } catch (error) {
    return formError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await adminActor(request);
    requirePermission(actor, "content.write");
    const body = await readJson(request, 1024 * 1024);
    const result = await upsertFanzinIssue(actor, body);
    return Response.json(result, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "Lütfen alanları kontrol edin." },
        { status: 400, headers: privateHeaders },
      );
    }
    const message = error instanceof Error ? error.message : "";
    if (message === "Yetki yok") {
      return Response.json({ error: message }, { status: 403, headers: privateHeaders });
    }
    if (message === "Oturum geçersiz") {
      return Response.json({ error: message }, { status: 401, headers: privateHeaders });
    }
    return Response.json(
      { error: message || "İşlem tamamlanamadı" },
      { status: 400, headers: privateHeaders },
    );
  }
}
