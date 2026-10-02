import { z } from "zod";
import {
  adminActor,
  formError,
  privateHeaders,
} from "../../../../modules/forms/application/admin-http";
import { readJson } from "../../../../lib/http/read-json";
import {
  resolveCheckIn,
  rotateCheckIn,
} from "../../../../modules/cards/application/check-in-service";
import { SubmissionError } from "../../../../modules/forms/domain/submission-error";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const actor = await adminActor(req);
    const input = z
      .discriminatedUnion("action", [
        z.strictObject({
          action: z.literal("resolve"),
          token: z.string().max(100),
        }),
        z.strictObject({
          action: z.literal("rotate"),
          id: z.uuid(),
          expectedRevision: z.int().positive(),
        }),
      ])
      .parse(await readJson(req));
    return Response.json(
      input.action === "resolve"
        ? await resolveCheckIn(
            actor,
            input.token.replace(/^uludott:check-in:/, ""),
          )
        : await rotateCheckIn(actor, input.id, input.expectedRevision),
      { headers: privateHeaders },
    );
  } catch (e) {
    return e instanceof SubmissionError
      ? Response.json(
          { error: e.message },
          { status: e.status, headers: privateHeaders },
        )
      : formError(e);
  }
}
