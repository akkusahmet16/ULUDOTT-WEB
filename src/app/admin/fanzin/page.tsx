import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { FanzinAdminList } from "../../../modules/fanzin/ui/fanzin-admin-list";

export default async function FanzinPage() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) return null;
  requirePermission(session.actor, "content.write");

  return <FanzinAdminList />;
}
