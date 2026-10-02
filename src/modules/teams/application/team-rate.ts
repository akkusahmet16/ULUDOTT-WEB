import "server-only";
import { sql, lt } from "drizzle-orm";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { rateLimits } from "../../../db/schema/operations.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
export async function teamRate(scope: string, key: string, limit = 10) {
  const window = new Date(Math.floor(Date.now() / 60000) * 60000);
  const count = await withTransaction(async (tx) => {
    await tx.delete(rateLimits).where(lt(rateLimits.expiresAt, new Date()));
    const [r] = await tx
      .insert(rateLimits)
      .values({
        scope,
        keyHash: tokenHash(key),
        windowStartsAt: window,
        count: 1,
        expiresAt: new Date(window.getTime() + 120000),
      })
      .onConflictDoUpdate({
        target: [
          rateLimits.scope,
          rateLimits.keyHash,
          rateLimits.windowStartsAt,
        ],
        set: { count: sql`${rateLimits.count}+1` },
      })
      .returning({ n: rateLimits.count });
    return r.n;
  });
  if (count > limit)
    throw new SubmissionError(
      429,
      "Çok fazla istek. Bir dakika sonra tekrar deneyin.",
    );
}
