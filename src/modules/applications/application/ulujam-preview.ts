import "server-only";
import { z } from "zod";
import { and, eq, inArray, asc } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { events } from "../../../db/schema/content.ts";
import { teams } from "../../../db/schema/ulujam.ts";
import { buildUlujamFormDefinition } from "../domain/ulujam-input.ts";
export async function getUlujamPreview(actor: Actor, eventId: string) {
  z.uuid().parse(eventId);
  requirePermission(actor, "forms.write", eventId);
  const db = getDatabase();
  const [event] = await db
    .select({ id: events.id, title: events.title, kind: events.kind })
    .from(events)
    .where(eq(events.id, eventId));
  if (!event || event.kind !== "ulujam")
    throw Error("UluJam etkinliği bulunamadı");
  const options = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(
      and(
        eq(teams.eventId, eventId),
        inArray(teams.status, ["pending", "approved", "changes_requested"]),
      ),
    )
    .orderBy(asc(teams.name), asc(teams.id))
    .limit(50);
  return {
    eventId,
    title: event.title,
    teams: options,
    definition: buildUlujamFormDefinition(eventId, options),
  };
}
