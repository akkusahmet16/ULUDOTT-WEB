import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { AnalyticsDashboard } from "../../../modules/admin/ui/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) return null;
  requirePermission(session.actor, "content.write");

  return <AnalyticsDashboard />;
}
