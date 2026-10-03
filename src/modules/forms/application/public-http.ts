import "server-only";
import { AnswerValidationError } from "../domain/answer-errors.ts";
import { z } from "zod";
import { enforceRateLimit } from "../../../lib/security/rate-limit.ts";
import { verifyBotToken } from "../../../lib/security/turnstile.ts";
import { verifyCsrf } from "../../../lib/auth/csrf.ts";
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
  await enforceRateLimit(scope, "global");
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
        botToken: z.string().max(2048).optional(),
      })
      .parse(await readJson(req, 128 * 1024));
    if (d.website) throw new SubmissionError(400, "İstek doğrulanamadı");
    await verifyBotToken(d.botToken, "form_submit");
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
