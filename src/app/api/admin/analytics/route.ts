import { getAnalyticsSummary } from "../../../../modules/admin/application/analytics-service";
import { adminActor, privateHeaders, formError } from "../../../../modules/forms/application/admin-http";
import { requirePermission } from "../../../../modules/admin/domain/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await adminActor(request);
    requirePermission(actor, "content.write");
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const summary = await getAnalyticsSummary(days);
    return Response.json(summary, { headers: privateHeaders });
  } catch (error) {
    return formError(error);
  }
}
