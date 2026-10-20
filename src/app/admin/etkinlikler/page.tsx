import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { canCreateEvent } from "../../../modules/admin/domain/modules";
import { EventEditor } from "../../../modules/events/ui/event-editor";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  if (
    !session.actor.roles.some((role) =>
      ["content_editor", "event_manager"].includes(role),
    )
  )
    return (
      <main>
        <h1>Yetki yok</h1>
        <Link href="/admin">Yönetime dön</Link>
      </main>
    );
  return (
    <main>
      <h1>Etkinlikler</h1>
      <p>
        Etkinliğini hazırla, önizle ve yayımla. Tarihi geçen kayıtlar ana
        sayfanın geçmiş etkinlikler alanında görünür.
      </p>
      <EventEditor canCreate={canCreateEvent(session.actor)} />
    </main>
  );
}
