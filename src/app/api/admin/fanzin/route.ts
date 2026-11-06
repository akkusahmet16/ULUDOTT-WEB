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
    return formError(error);
  }
}
