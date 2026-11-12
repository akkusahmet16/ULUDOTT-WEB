import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { AnalyticsDashboard } from "../../../modules/admin/ui/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) return null;

  const hasAccess =
    session.actor.roles.includes("content_editor") ||
    session.actor.roles.includes("event_manager") ||
    session.actor.roles.includes("system_admin");

  if (!hasAccess) return null;

  return <AnalyticsDashboard />;
}
