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
  assignParticipant,
  unassignParticipant,
  seekerBoard,
} from "./matching-service.ts";
export async function assignmentRequest(req: Request) {
  try {
    const actor = await adminActor(req);
    if (req.method === "GET") {
      const url = new URL(req.url);
      const filter = {
        eventId: url.searchParams.get("eventId"),
        ...Object.fromEntries(
          ["skill", "minLevel", "cursor", "teamCursor"].flatMap((k) =>
            url.searchParams.has(k) ? [[k, url.searchParams.get(k)]] : [],
          ),
        ),
      };
      return Response.json(await seekerBoard(actor, filter), {
        headers: privateHeaders,
      });
    }
    const input = z
      .strictObject({
        action: z.enum(["assign", "undo"]),
        participantId: z.uuid(),
        teamId: z.uuid(),
        expectedRevision: z.int().positive(),
      })
      .parse(await readJson(req));
    const fn =
      input.action === "assign" ? assignParticipant : unassignParticipant;
    return Response.json(
      await fn(
        actor,
        input.participantId,
        input.teamId,
        input.expectedRevision,
      ),
      { headers: privateHeaders },
    );
  } catch (e) {
    if (e instanceof SubmissionError)
      return Response.json(
        { error: e.message },
        { status: e.status, headers: privateHeaders },
      );
    return formError(e);
  }
}
