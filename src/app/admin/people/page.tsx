import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { PeopleEditor } from "../../../modules/community/people-editor";

export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  try {
    requirePermission(session.actor, "content.write");
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
      <h1>Yönetim kurulu içerikleri</h1>
      <p>
        Beş bölüm ve sekiz kişi sabit sıralanır. Her kişi için bir detay
        görseli, her bölüm için bir açılış videosu düzenlenir.
      </p>
      <p>
        Görselleri <Link href="/admin/medya">Medya</Link> bölümünde yayımlayın;
        yayımlanan görselin <code>/media/…</code> yolunu buraya yazın. Açılış
        videoları <code>/community/…</code> dosyalarından sunulur.
      </p>
      <PeopleEditor />
    </main>
  );
}
