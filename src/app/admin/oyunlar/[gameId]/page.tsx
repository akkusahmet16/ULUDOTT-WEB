import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import {
  getGameEditor,
  gameOptions,
  listGames,
} from "../../../../modules/games/application/game-service";
import { GameEditor } from "../../../../modules/games/ui/game-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
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
  const { gameId } = await params;
  let initial;
  try {
    initial = await getGameEditor(s.actor, gameId);
  } catch {
    notFound();
  }
  const [options, list] = await Promise.all([
    gameOptions(s.actor, initial.eventId, {
      teamId: initial.teamId ?? undefined,
      mediaId: initial.mediaId ?? undefined,
    }),
    listGames(s.actor),
  ]);
  return (
    <main>
      <Link href="/admin/oyunlar">Oyun listesine dön</Link>
      <h1>Oyun kaydını düzenle</h1>
      <GameEditor
        initial={initial}
        initialOptions={options}
        events={list.events}
      />
    </main>
  );
}
