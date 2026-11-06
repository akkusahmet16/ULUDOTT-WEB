import { getFanzinIssue, deleteFanzinIssue } from "../../../../../modules/fanzin/application/fanzin-admin-service";
import { adminActor, privateHeaders, formError } from "../../../../../modules/forms/application/admin-http";
import { requirePermission } from "../../../../../modules/admin/domain/permissions";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await getFanzinIssue(id);
    if (!data) {
      return Response.json({ error: "Sayı bulunamadı" }, { status: 404, headers: privateHeaders });
    }
    return Response.json(data, { headers: privateHeaders });
  } catch (error) {
    return formError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await adminActor(request);
    requirePermission(actor, "content.write");
    const { id } = await params;
    await deleteFanzinIssue(actor, id);
    return Response.json({ success: true }, { headers: privateHeaders });
  } catch (error) {
    return formError(error);
  }
}
