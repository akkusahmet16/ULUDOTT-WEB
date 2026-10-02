import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { listGames } from "../../../modules/games/application/game-service";
import { GameList } from "../../../modules/games/ui/game-list";
import { GameEditor } from "../../../modules/games/ui/game-editor";
export default async function Page() {
  const s = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!s) redirect("/admin");
  if (
    !s.actor.roles.some((r) => ["content_editor", "event_manager"].includes(r))
  )
    return (
      <main>
        <h1>Yetki yok</h1>
      </main>
    );
  const data = await listGames(s.actor);
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Oyun ve sonuç yönetimi</h1>
      <GameList initial={data} />
      <h2>Yeni oyun taslağı</h2>
      <GameEditor events={data.events} />
    </main>
  );
}
