import "server-only";
import { sql, eq } from "drizzle-orm";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { cards } from "../../../db/schema/wallet.ts";
import { enqueue } from "../../../lib/queue/outbox.ts";
import { cardEligibility } from "../domain/card-eligibility.ts";
export async function refreshApplicationCards(tx: DbTx, ids: string[]) {
  if (!ids.length) return;
  const rows =
    await tx.execute(sql`select c.id,c.revision,a.id application_id,a.status,a.mode,e.status event_status,t.status team_status,
 (ap.status='approved') member_approved,
 (a.submission_id is not null and not exists(select 1 from submissions s where s.id=a.submission_id and s.expires_at>clock_timestamp())) expired
 from cards c join applications a on a.id=c.application_id join events e on e.id=a.event_id left join memberships m on m.application_id=a.id and m.left_at is null left join teams t on t.id=m.team_id left join team_approvals ap on ap.team_id=t.id and ap.revision=m.approved_revision where a.id in (${sql.join(
   ids.map((id) => sql`${id}::uuid`),
   sql`,`,
 )}) order by c.id for update of c`);
  for (const r of rows) {
    const status = cardEligibility(
      {
        status: String(r.status),
        mode: String(r.mode),
        expired: Boolean(r.expired),
        eventClosed: ["cancelled", "archived"].includes(String(r.event_status)),
      },
      r.team_status
        ? {
            status: String(r.team_status),
            memberApproved: r.member_approved === true,
          }
        : null,
    );
    const revision = Number(r.revision) + 1;
    await tx
      .update(cards)
      .set({ status, revision })
      .where(eq(cards.id, String(r.id)));
    await enqueue(tx, "card.changed", String(r.id), revision, {
      cardId: String(r.id),
      applicationId: String(r.application_id),
    });
  }
}
