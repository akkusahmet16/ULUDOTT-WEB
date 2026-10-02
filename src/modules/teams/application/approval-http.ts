import "server-only";
import { z } from "zod";
import {
  adminActor,
  formError,
  privateHeaders,
} from "../../forms/application/admin-http.ts";
import { readJson } from "../../../lib/http/read-json.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import {
  approveRoster,
  requestRosterChanges,
  rejectTeam,
  decideSolo,
  listApprovals,
} from "./approval-service.ts";
import { decisionSchema } from "../domain/approval.ts";
export async function approvalRequest(req: Request) {
  try {
    const actor = await adminActor(req);
    if (req.method === "GET") {
      const url = new URL(req.url);
      return Response.json(
        await listApprovals(
          actor,
          url.searchParams.get("eventId") ?? "",
          url.searchParams.get("cursor") ?? undefined,
          url.searchParams.get("soloCursor") ?? undefined,
        ),
        { headers: privateHeaders },
      );
    }
    const d = z
      .strictObject({
        kind: z.enum(["team", "solo"]),
        id: z.uuid(),
        decision: decisionSchema,
        expectedRevision: z.int().positive(),
        reason: z.string().max(1000).optional(),
      })
      .parse(await readJson(req));
    const result =
      d.kind === "solo"
        ? await decideSolo(
            actor,
            d.id,
            d.decision,
            d.reason,
            d.expectedRevision,
          )
        : d.decision === "approved"
          ? await approveRoster(actor, d.id, d.expectedRevision)
          : d.decision === "rejected"
            ? await rejectTeam(actor, d.id, d.reason ?? "", d.expectedRevision)
            : await requestRosterChanges(
                actor,
                d.id,
                d.reason ?? "",
                d.expectedRevision,
              );
    return Response.json(result, { headers: privateHeaders });
  } catch (e) {
    if (e instanceof SubmissionError)
      return Response.json(
        { error: e.message },
        { status: e.status, headers: privateHeaders },
      );
    return formError(e);
  }
}
