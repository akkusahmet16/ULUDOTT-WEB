import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../database/transaction.ts";
import { rateLimits } from "../../db/schema/operations.ts";
import { tokenHash } from "../auth/crypto.ts";
import { SubmissionError } from "../../modules/forms/domain/submission-error.ts";
export async function enforceRateLimit(
  bucket: string,
  identity: string,
  options = { limit: 120, windowSeconds: 60 },
): Promise<void> {
  z.string()
    .regex(/^[a-z_]{1,80}$/)
    .parse(bucket);
  z.string().min(1).max(512).parse(identity);
  const limit = z.int().min(1).max(10000).parse(options.limit),
    seconds = z.int().min(1).max(3600).parse(options.windowSeconds);
  const window = new Date(
    Math.floor(Date.now() / (seconds * 1000)) * seconds * 1000,
  );
  const n = await withTransaction(async (tx) => {
    await tx.delete(rateLimits).where(sql`${rateLimits.expiresAt}<now()`);
    const [r] = await tx
      .insert(rateLimits)
      .values({
        scope: bucket,
        keyHash: tokenHash(identity),
        windowStartsAt: window,
        count: 1,
        expiresAt: new Date(window.getTime() + seconds * 2000),
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
  if (n > limit)
    throw new SubmissionError(
      429,
      "Çok fazla istek. Daha sonra tekrar deneyin.",
    );
}
