import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { AboutManagement } from "../../../modules/community/about-management";

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
      <h1>Hakkımızda</h1>
      <p>
        Kişi ekleyin, bilgilerini düzenleyin, bölümünü ve sırasını belirleyin.
        Kaydettiğiniz değişiklikler Hakkımızda sayfasında görünür.
      </p>
      <p>
        Fotoğrafları cihazınızdan yükleyebilir veya mevcut dosyalar arasından
        seçebilirsiniz. Kişiyi silmek görsel dosyasını silmez.
      </p>
      <AboutManagement />
    </main>
  );
}
