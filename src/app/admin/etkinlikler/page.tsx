import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { EventEditor } from "../../../modules/events/ui/event-editor";
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
        <Link href="/admin">Yönetime dön</Link>
      </main>
    );
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Etkinlik yönetimi</h1>
      <EventEditor />
    </main>
  );
}
