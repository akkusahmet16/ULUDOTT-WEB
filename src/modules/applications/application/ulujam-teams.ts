import "server-only";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import { getPublicForm } from "../../forms/application/public-form-service.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
export async function getUlujamTeams(slug: string, cursor?: string) {
  if (cursor) z.uuid().parse(cursor);
  const f = await getPublicForm(slug);
  if (!f || f.state !== "open" || f.eventKind !== "ulujam")
    throw new SubmissionError(409, "UluJam başvurusu açık değil");
  const rows = await getDatabase().execute(
    sql`select t.id,t.name from teams t where t.event_id=${f.eventId} and t.status in ('pending','approved','changes_requested') and (select count(*) from memberships m where m.team_id=t.id and m.left_at is null)<t.expected_size ${cursor ? sql`and t.id>${cursor}::uuid` : sql``} order by t.id limit 51`,
  );
  return {
    items: rows
      .slice(0, 50)
      .map((r) => ({ id: String(r.id), name: String(r.name) })),
    nextCursor: rows.length > 50 ? String(rows[49].id) : null,
  };
}
