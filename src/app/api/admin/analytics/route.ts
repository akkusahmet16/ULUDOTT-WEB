import { getAnalyticsSummary } from "../../../../modules/admin/application/analytics-service";
import { adminActor, privateHeaders, formError } from "../../../../modules/forms/application/admin-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await adminActor(request);
    const hasAccess =
      actor.roles.includes("content_editor") ||
      actor.roles.includes("event_manager") ||
      actor.roles.includes("system_admin");

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Yetki yok" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const summary = await getAnalyticsSummary(days);
    return Response.json(summary, { headers: privateHeaders });
  } catch (error) {
    return formError(error);
  }
}
