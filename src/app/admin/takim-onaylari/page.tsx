import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { formEvents } from "../../../modules/forms/application/form-service";
import { listApprovals } from "../../../modules/teams/application/approval-service";
import { ApprovalQueue } from "../../../modules/teams/ui/approval-queue";
export default async function Page() {
  const s = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!s) redirect("/admin");
  if (!s.actor.roles.includes("event_manager"))
    return (
      <main>
        <h1>Yetki yok</h1>
      </main>
    );
  const events = (await formEvents(s.actor)).filter((e) => e.kind === "ulujam");
  const initial = events.length
    ? await listApprovals(s.actor, events[0].id)
    : null;
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Takım ve bireysel katılım onayları</h1>
      {initial ? (
        <ApprovalQueue events={events} initial={initial} />
      ) : (
        <p>Yetkili olduğunuz UluJam etkinliği yok.</p>
      )}
    </main>
  );
}
