import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { historical2026 } from "../../../modules/games/domain/historical-result";
import { GalleryEditor } from "../../../modules/events/ui/gallery-editor";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  try {
    requirePermission(session.actor, "media.attach", historical2026.eventId);
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
      <h1>UluJam 2026 galeri yönetimi</h1>
      <GalleryEditor />
    </main>
  );
}
