import { z } from "zod";
import { verifyCsrf } from "../../../../lib/auth/csrf";
import { readJson } from "../../../../lib/http/read-json";
import { privateHeaders } from "../../../../modules/forms/application/admin-http";
import { gameError } from "../../../../modules/games/application/game-http";
import { approvePublicationName } from "../../../../modules/games/application/credit-consent-service";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    verifyCsrf(req);
    const d = z
      .strictObject({
        token: z.string().max(100),
        publicationName: z.string().max(160),
        consent: z.boolean(),
        expectedRevision: z.int().positive(),
      })
      .parse(await readJson(req));
    return Response.json(
      await approvePublicationName(
        d.token,
        d.publicationName,
        d.consent,
        d.expectedRevision,
      ),
      { headers: privateHeaders },
    );
  } catch (e) {
    return gameError(e);
  }
}
