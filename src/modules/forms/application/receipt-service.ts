import "server-only";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../../lib/database/client.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import { submissions } from "../../../db/schema/forms.ts";
import { SubmissionError } from "../domain/submission-error.ts";
export async function getReceipt(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new SubmissionError(404, "Makbuz bulunamadı veya süresi doldu");
  const [s] = await getDatabase()
    .select({
      status: submissions.status,
      createdAt: submissions.createdAt,
      snapshot: submissions.snapshot,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.receiptTokenHash, tokenHash(token)),
        sql`${submissions.expiresAt}>now()`,
      ),
    );
  if (!s) throw new SubmissionError(404, "Makbuz bulunamadı veya süresi doldu");
  const metadata = z
    .strictObject({
      formTitle: z.string().max(160),
      thankYou: z.string().max(2000),
    })
    .parse(s.snapshot);
  return {
    status: s.status,
    submittedAt: s.createdAt.toISOString(),
    formTitle: metadata.formTitle,
    message: metadata.thankYou,
  };
}
