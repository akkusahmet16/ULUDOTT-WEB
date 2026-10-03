import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { getSystemStatus } from "../../../modules/admin/application/dashboard-service";
import { SystemStatus } from "../../../modules/admin/ui/system-status";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  if (!session.actor.roles.includes("system_admin"))
    return (
      <main>
        <h1>Yetki yok</h1>
        <Link href="/admin">Yönetime dön</Link>
      </main>
    );
  return (
    <main>
      <h1>Sistem durumu</h1>
      <SystemStatus status={await getSystemStatus(session.actor)} />
    </main>
  );
}
