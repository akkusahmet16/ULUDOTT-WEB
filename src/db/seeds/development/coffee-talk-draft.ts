import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "../../../lib/database/client.ts";
import { events } from "../../schema/content.ts";
const id = "c0ffee00-0000-4000-8000-000000000014";
// Explicit development seed. Never invent real scheduling, location or artwork.
export async function seedCoffeeTalkDraft(db: Database): Promise<string> {
  return db.transaction(async (tx) => {
    await tx
      .insert(events)
      .values({
        id,
        title: "Coffee Talk: Tanışma Etkinliği",
        slug: "coffee-talk",
        kind: "general",
      })
      .onConflictDoNothing();
    const [e] = await tx.select().from(events).where(eq(events.id, id));
    if (!e || e.slug !== "coffee-talk" || e.kind !== "general")
      throw Error("Coffee Talk taslak kimlik çakışması");
    return e.id;
  });
}
