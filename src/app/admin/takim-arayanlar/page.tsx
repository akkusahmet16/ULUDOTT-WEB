import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { formEvents } from "../../../modules/forms/application/form-service";
import { seekerBoard } from "../../../modules/matching/application/matching-service";
import { SeekerBoard } from "../../../modules/matching/ui/seeker-board";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  if (!session.actor.roles.includes("event_manager"))
    return (
      <main>
        <h1>Yetki yok</h1>
      </main>
    );
  const events = (await formEvents(session.actor)).filter(
    (e) => e.kind === "ulujam",
  );
  const initial = events.length
    ? await seekerBoard(session.actor, { eventId: events[0].id })
    : null;
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Takım arayanlar</h1>
      {events.length ? (
        <SeekerBoard events={events} initial={initial} />
      ) : (
        <p>Yetkili olduğunuz UluJam etkinliği yok.</p>
      )}
    </main>
  );
}
