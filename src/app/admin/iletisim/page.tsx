import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { ContactEditor } from "../../../modules/site-settings/ui/contact-editor";
import { getContactSettings } from "../../../modules/site-settings/application/contact-settings";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  try {
    requirePermission(session.actor, "links.write");
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
      <h1>İletişim ve alt bağlantılar</h1>
      <p>
        İletişim sayfasını ve sitenin en altındaki bağlantıları aynı ekrandan
        düzenleyin.
      </p>
      <ContactEditor initial={await getContactSettings()} />
    </main>
  );
}
