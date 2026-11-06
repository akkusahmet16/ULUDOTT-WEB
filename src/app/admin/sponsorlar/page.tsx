import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { SponsorsEditor } from "../../../modules/site-settings/ui/sponsors-editor";

export default async function SponsorsPage() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) return null;
  requirePermission(session.actor, "content.write");

  return <SponsorsEditor />;
}
