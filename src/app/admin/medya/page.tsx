import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { MediaLibrary } from "../../../modules/media/ui/media-library";
import Link from "next/link";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  try {
    requirePermission(session.actor, "media.write");
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
      <h1>Medya yönetimi</h1>
      <p>Yüklemeler önce özel olarak işlenir; yayın kararını ayrı verin.</p>
      <MediaLibrary />
    </main>
  );
}
