import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { HomepageEditor } from "../../../modules/site-settings/ui/homepage-editor";

export default async function SiteIcerikleriPage() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) return null;
  requirePermission(session.actor, "content.write");

  return <HomepageEditor />;
}
