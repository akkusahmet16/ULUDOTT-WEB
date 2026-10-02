import "server-only";
import { applications, applicationSkills } from "../../../db/schema/ulujam.ts";
import { submissions } from "../../../db/schema/forms.ts";
import { eq } from "drizzle-orm";
import type { DbTx } from "../../../lib/database/transaction.ts";
import type { UlujamInput } from "../domain/ulujam-input.ts";
export async function insertApplication(
  tx: DbTx,
  input: UlujamInput,
  submissionId: string,
) {
  const [a] = await tx
    .insert(applications)
    .values({
      eventId: input.eventId,
      submissionId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      mode: input.mode,
      skillDescription: input.skillDescription,
      status: "pending",
    })
    .returning();
  await tx
    .insert(applicationSkills)
    .values(input.skills.map((s) => ({ ...s, applicationId: a.id })));
  await tx
    .update(submissions)
    .set({ fullName: input.fullName, email: input.email, phone: input.phone })
    .where(eq(submissions.id, submissionId));
  return a;
}
