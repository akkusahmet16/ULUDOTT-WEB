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
  listGames,
  getGameEditor,
  gameOptions,
  saveGameDraft,
  publishGame,
  unpublishGame,
  markFinalist,
  assignAward,
} from "./game-service.ts";
export function gameError(e: unknown) {
  if (e instanceof SubmissionError)
    return Response.json(
      { error: e.message },
      { status: e.status, headers: privateHeaders },
    );
  if (
    e instanceof Error &&
    [
      "Tam oyun bilgisi gerekli",
      "Yapımcı yayın adı için açık rıza/onay gerekli",
    ].includes(e.message)
  )
    return Response.json(
      { error: e.message },
      { status: 409, headers: privateHeaders },
    );
  return formError(e);
}
export async function gameRequest(req: Request, id?: string) {
  try {
    const actor = await adminActor(req);
    if (req.method === "GET") {
      const url = new URL(req.url);
      if (id) {
        const game = await getGameEditor(actor, id);
        return Response.json(
          { game, options: await gameOptions(actor, game.eventId) },
          { headers: privateHeaders },
        );
      }
      const eventId = url.searchParams.get("eventId") ?? undefined;
      return Response.json(
        url.searchParams.get("options") === "1"
          ? await gameOptions(actor, eventId ?? "")
          : await listGames(
              actor,
              eventId,
              url.searchParams.get("cursor") ?? undefined,
            ),
        { headers: privateHeaders },
      );
    }
    if (!id) {
      const d = z
        .strictObject({ eventId: z.uuid(), input: z.unknown() })
        .parse(await readJson(req, 64 * 1024));
      return Response.json(await saveGameDraft(actor, d.eventId, d.input), {
        status: 201,
        headers: privateHeaders,
      });
    }
    const d = z
      .strictObject({
        action: z.enum(["save", "publish", "unpublish", "finalist", "award"]),
        expectedRevision: z.int().positive(),
        input: z.unknown().optional(),
        selected: z.boolean().optional(),
        rank: z.int().min(1).max(3).nullable().optional(),
      })
      .parse(await readJson(req, 64 * 1024));
    let result;
    if (d.action === "save") {
      const g = await getGameEditor(actor, id);
      const input = z.record(z.string(), z.unknown()).parse(d.input);
      result = await saveGameDraft(actor, g.eventId, {
        ...input,
        id,
        expectedRevision: d.expectedRevision,
      });
    } else if (d.action === "publish")
      result = await publishGame(actor, id, d.expectedRevision);
    else if (d.action === "unpublish")
      result = await unpublishGame(actor, id, d.expectedRevision);
    else if (d.action === "finalist")
      result = await markFinalist(
        actor,
        id,
        d.expectedRevision,
        z.boolean().parse(d.selected),
      );
    else {
      const g = await getGameEditor(actor, id);
      if (d.rank === undefined) throw Error("Derece gerekli");
      result = await assignAward(
        actor,
        g.eventId,
        d.rank,
        id,
        d.expectedRevision,
      );
    }
    return Response.json(result, { headers: privateHeaders });
  } catch (e) {
    return gameError(e);
  }
}
