import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { UlujamEditor } from "../../../modules/site-settings/ui/ulujam-editor";
import { ulujamEditorData } from "../../../modules/site-settings/application/ulujam-settings";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  try {
    requirePermission(session.actor, "publication.write");
  } catch {
    return (
      <main>
        <h1>Yetki yok</h1>
        <Link href="/admin">Yönetime dön</Link>
      </main>
    );
  }
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>UluJam yönetimi</h1>
      <p>
        Ana sayfa videosunu, UluJam tanıtımını ve başvuru yayınını buradan
        yönetin.
      </p>
      <UlujamEditor initial={await ulujamEditorData(session.actor)} />
    </main>
  );
}
