import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import QRCode from "qrcode";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { getDatabase } from "../../../lib/database/client.ts";
import { cards } from "../../../db/schema/wallet.ts";
import { randomToken, tokenHash } from "../../../lib/auth/crypto.ts";
import {
  encryptReplay,
  decryptReplay,
} from "../../forms/infrastructure/submission-repository.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { readCard } from "../infrastructure/card-repository.ts";
import { enqueue } from "../../../lib/queue/outbox.ts";
export const cardToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export async function createApplicationCard(tx: DbTx, applicationId: string) {
  const id = randomUUID(),
    token = randomToken(),
    checkin = randomToken();
  await tx
    .insert(cards)
    .values({
      id,
      applicationId,
      tokenHash: tokenHash(token),
      checkinTokenHash: tokenHash(checkin),
      checkinTokenEncrypted: encryptReplay(
        { token: checkin },
        "check-in:" + id,
      ),
      status: "pending",
    });
  await enqueue(tx, "card.changed", id, 1, { cardId: id, applicationId });
  return { id, token };
}
export async function ownCardRecord(token: string) {
  if (!cardToken.safeParse(token).success)
    throw new SubmissionError(404, "Kart bulunamadı");
  const r = await readCard(sql`c.token_hash=${tokenHash(token)}`);
  if (!r) throw new SubmissionError(404, "Kart bulunamadı");
  if (r.expired)
    throw new SubmissionError(410, "Başvurunun saklama süresi doldu");
  return r;
}
export async function requireActiveCard(token: string) {
  const r = await ownCardRecord(token);
  if (r.status !== "active")
    throw new SubmissionError(403, "Kart henüz aktif değil");
  return r;
}
export async function getOwnCard(token: string) {
  const r = await ownCardRecord(token);
  let qr: string | null = null;
  if (r.status === "active" && r.encrypted) {
    const data = z
      .object({ token: cardToken })
      .parse(decryptReplay(r.encrypted, "check-in:" + r.id));
    qr = await QRCode.toDataURL("uludott:check-in:" + data.token, {
      width: 280,
      margin: 4,
      errorCorrectionLevel: "M",
    });
  }
  return {
    id: r.id,
    revision: r.revision,
    name: r.name,
    eventTitle: r.eventTitle,
    startsAt: r.startsAt,
    teamName: r.teamName,
    status: r.status,
    qr,
  };
}
export type CardView = Awaited<ReturnType<typeof getOwnCard>>;
export async function getTeamCardSummaries(session: {
  id: string;
  teamId: string;
}) {
  z.uuid().parse(session.id);
  z.uuid().parse(session.teamId);
  const db = getDatabase();
  const [valid] = await db.execute(
    sql`select s.id from team_sessions s join team_access ac on ac.team_id=s.team_id and ac.revision=s.access_revision where s.id=${session.id} and s.team_id=${session.teamId} and s.revoked_at is null and s.expires_at>clock_timestamp()`,
  );
  if (!valid) throw new SubmissionError(403, "Takım oturumu gerekli");
  const rows = await db.execute(
    sql`select a.full_name,a.status,a.mode,t.status team_status,e.status event_status,(ap.status='approved') member_approved from memberships m join applications a on a.id=m.application_id join teams t on t.id=m.team_id join events e on e.id=a.event_id left join team_approvals ap on ap.team_id=t.id and ap.revision=m.approved_revision where m.team_id=${session.teamId} and m.left_at is null and (a.submission_id is null or exists(select 1 from submissions su where su.id=a.submission_id and su.expires_at>clock_timestamp())) and exists(select 1 from team_sessions s join team_access ac on ac.team_id=s.team_id and ac.revision=s.access_revision where s.id=${session.id} and s.team_id=m.team_id and s.revoked_at is null and s.expires_at>clock_timestamp()) order by a.id`,
  );
  const { cardEligibility } = await import("../domain/card-eligibility.ts");
  return rows.map((r) => ({
    name: String(r.full_name),
    status: cardEligibility(
      {
        status: String(r.status),
        mode: String(r.mode),
        eventClosed: ["cancelled", "archived"].includes(String(r.event_status)),
      },
      {
        status: String(r.team_status),
        memberApproved: r.member_approved === true,
      },
    ),
  }));
}
