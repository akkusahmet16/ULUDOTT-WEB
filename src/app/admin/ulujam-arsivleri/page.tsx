import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { ArchiveEditor } from "../../../modules/site-settings/ui/archive-editor";
import { listArchives } from "../../../modules/site-settings/application/archives";
import { listPublishedSiteGames } from "../../../modules/games/application/site-game-service";
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
      <h1>UluJam arşivleri</h1>
      <p>
        Her yıl için aynı görünümde bir arşiv hazırlayın; fotoğrafları önceden
        yüklenmiş dosyalardan seçin.
      </p>
      <ArchiveEditor
        initial={await listArchives(session.actor)}
        gameOptions={await listPublishedSiteGames()}
      />
    </main>
  );
}
