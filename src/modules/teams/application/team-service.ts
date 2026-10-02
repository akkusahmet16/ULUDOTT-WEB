import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { events } from "../../../db/schema/content.ts";
import { teams, teamAccess } from "../../../db/schema/ulujam.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
import {
  randomToken,
  tokenHash,
  hashPassword,
  verifyPassword,
} from "../../../lib/auth/crypto.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import {
  encryptReplay,
  decryptReplay,
} from "../../forms/infrastructure/submission-repository.ts";
import { normalizeTeamName } from "../domain/team.ts";
import { addMember, lockTeam } from "../infrastructure/team-repository.ts";
export async function createTeamWithFounder(
  tx: DbTx,
  input: {
    eventId: string;
    participantId: string;
    name: string;
    expectedSize: number;
  },
) {
  const name = z.string().trim().min(1).max(100).parse(input.name),
    size = z.int().positive().parse(input.expectedSize);
  const [event] = await tx
    .select()
    .from(events)
    .where(eq(events.id, input.eventId));
  if (!event || size > event.maxTeamSize)
    throw new SubmissionError(409, "Etkinlik takım üst sınırı aşıldı");
  const token = randomToken(),
    password = randomToken();
  const [t] = await tx
    .insert(teams)
    .values({
      eventId: input.eventId,
      name,
      normalizedName: normalizeTeamName(name),
      expectedSize: size,
      status: "pending",
    })
    .returning();
  await tx
    .insert(teamAccess)
    .values({
      teamId: t.id,
      tokenHash: tokenHash(token),
      passwordHash: await hashPassword(password),
      tokenEncrypted: encryptReplay({ token }, "team-access:" + t.id),
    });
  await addMember(tx, t.id, input.participantId);
  return { id: t.id, token, password };
}
export async function joinTeam(
  tx: DbTx,
  teamId: string,
  participantId: string,
  password: string,
) {
  const t = await lockTeam(tx, teamId);
  const [access] = await tx
    .select()
    .from(teamAccess)
    .where(eq(teamAccess.teamId, t.id))
    .for("update");
  if (!access || !(await verifyPassword(access.passwordHash, password)))
    throw new SubmissionError(403, "Takım parolası geçersiz");
  if (!access.tokenEncrypted)
    throw new SubmissionError(409, "Takım erişimi yenilenmeli");
  const token = z
    .strictObject({ token: z.string().regex(/^[\w-]{43}$/) })
    .parse(decryptReplay(access.tokenEncrypted, "team-access:" + t.id)).token;
  const updated = await addMember(tx, t.id, participantId);
  return { ...updated, token };
}
