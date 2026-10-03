import "server-only";
import { sql } from "drizzle-orm";
import { withTransaction } from "../lib/database/transaction.ts";
import { retentionRuns } from "../db/schema/operations.ts";
import { randomToken, tokenHash } from "../lib/auth/crypto.ts";
import { enqueue } from "../lib/queue/outbox.ts";
import { gameCardsChanged } from "../modules/games/application/game-service.ts";
import { refreshApplicationCards } from "../modules/cards/application/card-revision.ts";
export async function deleteOrAnonymizeExpired(now: Date) {
  if (
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime()) ||
    now.getTime() > Date.now() + 1000
  )
    throw Error("RETENTION_CLOCK");
  return withTransaction(async (tx) => {
    const counts = { deleted: 0, anonymized: 0, pendingRevocations: 0 };
    const [lock] = await tx.execute(
      sql`select pg_try_advisory_xact_lock(hashtext('uludott_retention_v1')) ok`,
    );
    if (!lock.ok) return counts;
    await tx.execute(sql`set local statement_timeout='10s'`);
    const candidates = await tx.execute(
      sql`select id,form_id,event_id from submissions where expires_at<=${now.toISOString()}::timestamptz order by form_id,id limit 25`,
    );
    for (const candidate of candidates) {
      const id = String(candidate.id);
      await tx.execute(
        sql`select id from forms where id=${String(candidate.form_id)}::uuid for update`,
      );
      if (candidate.event_id)
        await tx.execute(
          sql`select id from events where id=${String(candidate.event_id)}::uuid for update`,
        );
      const [subject] = await tx.execute(
        sql`select id from submissions where id=${id}::uuid and expires_at<=${now.toISOString()}::timestamptz for update`,
      );
      if (!subject) continue;
      const [a] = await tx.execute(
        sql`select id from applications where submission_id=${id}::uuid for update`,
      );
      if (a) {
        const aid = String(a.id);
        const affectedTeams = await tx.execute(
          sql`select distinct team_id from memberships where application_id=${aid}::uuid order by team_id`,
        );
        for (const team of affectedTeams) {
          const tid = String(team.team_id);
          await tx.execute(
            sql`select id from teams where id=${tid}::uuid for update`,
          );
          await tx.execute(
            sql`update team_approvals set note=null where team_id=${tid}::uuid`,
          );
          const [removed] = await tx.execute(
            sql`select exists(select 1 from memberships where application_id=${aid}::uuid and team_id=${tid}::uuid and left_at is null) active`,
          );
          await tx.execute(
            sql`delete from memberships where application_id=${aid}::uuid and team_id=${tid}::uuid`,
          );
          const members = await tx.execute(
            sql`select application_id from memberships where team_id=${tid}::uuid and left_at is null`,
          );
          if (removed.active)
            await tx.execute(
              sql`update teams set roster_revision=roster_revision+1 where id=${tid}::uuid`,
            );
          if (!members.length) {
            await tx.execute(
              sql`update teams set name='Silinen takım',normalized_name=${"removed-" + tid},status='withdrawn' where id=${tid}::uuid`,
            );
            await tx.execute(
              sql`delete from team_sessions where team_id=${tid}::uuid`,
            );
            await tx.execute(
              sql`update team_access set token_hash=${tokenHash(randomToken())},password_hash='disabled',token_encrypted=null,revision=revision+1 where team_id=${tid}::uuid`,
            );
          }
          if (removed.active)
            await refreshApplicationCards(
              tx,
              members.map((m) => String(m.application_id)),
            );
        }
        const unpublished = await tx.execute(
          sql`update games set published_at=null,revision=revision+1 where published_at is not null and id in (select game_id from game_credits where application_id=${aid}::uuid) returning team_id`,
        );
        await gameCardsChanged(
          tx,
          unpublished.map((g) => (g.team_id ? String(g.team_id) : null)),
        );
        await tx.execute(
          sql`update game_credits set application_id=null,publication_name=null,consented_at=null,consent_token_hash=null,consent_token_encrypted=null,revision=revision+1 where application_id=${aid}::uuid`,
        );
        await tx.execute(
          sql`delete from application_skills where application_id=${aid}::uuid`,
        );
        await tx.execute(
          sql`update applications set submission_id=null,full_name='Silinen katılımcı',email=${"removed-" + aid + "@privacy.invalid"},phone='+10000000000',skill_description=null,review_note=null,token_hash=null,approved_by=null,approved_at=null,status='withdrawn',erased_at=clock_timestamp(),revision=revision+1 where id=${aid}::uuid`,
        );
        const cards = await tx.execute(
          sql`update cards set status='revoked',revision=revision+1,token_hash=${tokenHash(randomToken())},checkin_token_hash=${tokenHash(randomToken())},checkin_token_encrypted=null where application_id=${aid}::uuid returning id,revision`,
        );
        for (const c of cards) {
          await enqueue(tx, "card.changed", String(c.id), Number(c.revision), {
            cardId: String(c.id),
            applicationId: aid,
          });
          const [pending] = await tx.execute(
            sql`select count(*)::int n from wallet_passes where card_id=${String(c.id)}::uuid and provider_state!='revoked'`,
          );
          counts.pendingRevocations += Number(pending.n);
        }
        counts.anonymized++;
      }
      await tx.execute(
        sql`delete from idempotency_records where resource_id=${id}::uuid`,
      );
      await tx.execute(
        sql`delete from submission_answers where submission_id=${id}::uuid`,
      );
      await tx.execute(
        sql`delete from consents where submission_id=${id}::uuid`,
      );
      await tx.execute(
        sql`delete from submission_status_history where submission_id=${id}::uuid`,
      );
      await tx.execute(sql`delete from submissions where id=${id}::uuid`);
      counts.deleted++;
    }
    await tx.execute(
      sql`delete from idempotency_records where expires_at<=${now.toISOString()}::timestamptz`,
    );
    await tx.execute(
      sql`delete from admin_sessions where expires_at<=${now.toISOString()}::timestamptz or revoked_at is not null`,
    );
    await tx.execute(
      sql`delete from team_sessions where expires_at<=${now.toISOString()}::timestamptz or revoked_at is not null`,
    );
    await tx.execute(
      sql`delete from rate_limits where expires_at<=${now.toISOString()}::timestamptz`,
    );
    await tx.execute(
      sql`delete from retention_runs where completed_at<${now.toISOString()}::timestamptz-interval '30 days'`,
    );
    if (counts.deleted) await tx.insert(retentionRuns).values(counts);
    return counts;
  });
}
