import "server-only";
import { z } from "zod";
import type { DbTx } from "../database/transaction.ts";
import { auditLogs } from "../../db/schema/operations.ts";

export type Actor = { adminId: string; roles: string[]; eventScopes: string[] };
const identity = z.object({
  type: z.string().regex(/^[a-z_]{1,40}$/),
  id: z.uuid(),
});
const changesSchema = z.strictObject({
  recordCount: z.int().min(0).max(10000).optional(),
  format: z.enum(["csv", "xlsx"]).optional(),
  revision: z.int().positive().optional(),
  previousRevision: z.int().positive().optional(),
  status: z
    .enum([
      "draft",
      "scheduled",
      "published",
      "ended",
      "cancelled",
      "archived",
      "received",
      "pending",
      "approved",
      "rejected",
      "withdrawn",
      "changes_requested",
      "active",
      "revoked",
      "closed",
      "paused",
      "waitlisted",
    ])
    .optional(),
  changedFields: z
    .array(
      z.enum([
        "title",
        "slug",
        "kind",
        "description",
        "location",
        "startsAt",
        "endsAt",
        "publishAt",
        "unpublishAt",
        "status",
        "capacity",
        "maxTeamSize",
        "revision",
        "name",
        "fullName",
        "email",
        "phone",
        "skills",
        "mode",
        "rosterRevision",
        "formVersion",
        "consent",
        "media",
        "rank",
        "publicationName",
        "roles",
        "eventScopes",
      ]),
    )
    .max(64)
    .optional(),
});
export async function appendAudit(
  tx: DbTx,
  actor: Actor,
  action: string,
  object: { type: string; id: string },
  redactedChanges: Record<string, unknown>,
): Promise<void> {
  const changes = changesSchema.safeParse(redactedChanges);
  const target = identity.safeParse(object);
  if (!changes.success)
    throw new Error(
      "Denetim değişiklikleri yalnızca izinli, kişisel veri içermeyen metadata olabilir.",
    );
  if (
    !target.success ||
    !z.uuid().safeParse(actor.adminId).success ||
    !/^[a-z_]+\.[a-z_]+$/.test(action) ||
    action.length > 100
  )
    throw new Error("Geçersiz denetim kimliği veya eylemi.");
  await tx.insert(auditLogs).values({
    actorId: actor.adminId,
    action,
    objectType: target.data.type,
    objectId: target.data.id,
    changes: changes.data,
  });
}
