import "server-only";
import { AnswerValidationError } from "../domain/answer-errors.ts";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { rateLimits } from "../../../db/schema/operations.ts";
import { verifyCsrf } from "../../../lib/auth/csrf.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import { readJson } from "../../../lib/http/read-json.ts";
import { SubmissionError } from "../domain/submission-error.ts";
import { submitForm } from "./submit-form.ts";
import { getReceipt } from "./receipt-service.ts";
export const publicPrivateHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
async function rate(scope: string) {
  const window = new Date(Math.floor(Date.now() / 60000) * 60000);
  const n = await withTransaction(async (tx) => {
    await tx.delete(rateLimits).where(sql`${rateLimits.expiresAt}<now()`);
    const [row] = await tx
      .insert(rateLimits)
      .values({
        scope,
        keyHash: tokenHash("global"),
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
      .returning({ count: rateLimits.count });
    return row.count;
  });
  if (n > 120)
    throw new SubmissionError(
      429,
      "Çok fazla istek. Bir dakika sonra tekrar deneyin.",
    );
}
export async function publicSubmit(req: Request, slug: string) {
  try {
    verifyCsrf(req);
    await rate("public_form_submit");
    const d = z
      .strictObject({
        answers: z.unknown(),
        versionId: z.uuid(),
        idempotencyKey: z.string(),
        website: z.string().max(512).default(""),
      })
      .parse(await readJson(req, 128 * 1024));
    if (d.website) throw new SubmissionError(400, "İstek doğrulanamadı");
    const receipt = await submitForm(slug, d.answers, d.idempotencyKey, {
      versionId: d.versionId,
    });
    return Response.json(receipt, {
      status: 201,
      headers: publicPrivateHeaders,
    });
  } catch (e) {
    return error(e);
  }
}
export async function receiptRequest(req: Request) {
  try {
    verifyCsrf(req);
    await rate("public_receipt");
    const { token } = z
      .strictObject({ token: z.string().max(100) })
      .parse(await readJson(req));
    return Response.json(await getReceipt(token), {
      headers: publicPrivateHeaders,
    });
  } catch (e) {
    return error(e);
  }
}
function error(e: unknown) {
  const status =
    e instanceof SubmissionError
      ? e.status
      : e instanceof Error && e.message.startsWith("CSRF")
        ? 403
        : 400;
  return Response.json(
    {
      ...(e instanceof AnswerValidationError
        ? { fieldErrors: e.fieldErrors }
        : {}),
      error:
        e instanceof AnswerValidationError
          ? e.message
          : e instanceof SubmissionError
            ? e.message
            : status === 403
              ? "İstek doğrulanamadı"
              : "Yanıtları, zorunlu alanları ve form kurallarını kontrol edin.",
    },
    { status, headers: publicPrivateHeaders },
  );
}
