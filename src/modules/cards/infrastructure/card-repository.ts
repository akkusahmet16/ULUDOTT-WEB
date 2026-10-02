import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { cardEligibility } from "../domain/card-eligibility.ts";
export async function readCard(
  where: SQL,
  db: DbTx | ReturnType<typeof getDatabase> = getDatabase(),
) {
  const [r] =
    await db.execute(sql`select c.id,c.application_id,c.revision,c.checkin_token_encrypted,a.full_name,a.event_id,a.status,a.mode,e.title event_title,e.starts_at,e.status event_status,t.name team_name,t.status team_status,(ap.status='approved') member_approved,
 (a.submission_id is not null and not exists(select 1 from submissions s where s.id=a.submission_id and s.expires_at>clock_timestamp())) expired
 from cards c join applications a on a.id=c.application_id join events e on e.id=a.event_id left join memberships m on m.application_id=a.id and m.left_at is null left join teams t on t.id=m.team_id left join team_approvals ap on ap.team_id=t.id and ap.revision=m.approved_revision where ${where}`);
  if (!r) return null;
  return {
    id: String(r.id),
    applicationId: String(r.application_id),
    eventId: String(r.event_id),
    revision: Number(r.revision),
    name: String(r.full_name),
    eventTitle: String(r.event_title),
    startsAt: r.starts_at
      ? new Date(r.starts_at as string).toISOString()
      : null,
    teamName: r.team_name ? String(r.team_name) : null,
    encrypted: r.checkin_token_encrypted
      ? String(r.checkin_token_encrypted)
      : null,
    expired: r.expired === true,
    status: cardEligibility(
      {
        status: String(r.status),
        mode: String(r.mode),
        expired: r.expired === true,
        eventClosed: ["cancelled", "archived"].includes(String(r.event_status)),
      },
      r.team_status
        ? {
            status: String(r.team_status),
            memberApproved: r.member_approved === true,
          }
        : null,
    ),
  };
}
