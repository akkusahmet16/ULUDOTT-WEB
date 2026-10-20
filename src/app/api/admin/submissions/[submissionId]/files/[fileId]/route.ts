import { adminActor, privateHeaders } from "../../../../../../../modules/forms/application/admin-http";
import { getSubmissionFile } from "../../../../../../../modules/forms/application/submission-admin";
export const runtime = "nodejs";
export async function GET(req: Request, context: { params: Promise<{ submissionId: string; fileId: string }> }) {
  try {
    const actor = await adminActor(req);
    const { submissionId, fileId } = await context.params;
    const file = await getSubmissionFile(actor, submissionId, fileId);
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  } catch {
    return Response.json({ error: "Dosya bulunamadı veya erişim yok" }, { status: 404, headers: privateHeaders });
  }
}
