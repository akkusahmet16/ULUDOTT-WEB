import { verifyBotToken } from "../../../lib/security/turnstile.ts";
import "server-only";
import { z } from "zod";
import { readJson } from "../../../lib/http/read-json.ts";
import { verifyCsrf } from "../../../lib/auth/csrf.ts";
import { publicPrivateHeaders } from "../../forms/application/public-http.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import {
  loginTeam,
  logoutTeam,
  rotateTeamAccess,
  TEAM_COOKIE,
} from "./team-access.ts";
import { adminActor } from "../../forms/application/admin-http.ts";
import { submitUlujam } from "../../applications/application/submit-ulujam.ts";
import { getUlujamTeams } from "../../applications/application/ulujam-teams.ts";
import { teamRate } from "./team-rate.ts";
export function teamError(e: unknown) {
  const status =
    e instanceof SubmissionError
      ? e.status
      : e instanceof Error && e.message.startsWith("CSRF")
        ? 403
        : 400;
  return Response.json(
    {
      error:
        e instanceof SubmissionError
          ? e.message
          : status === 403
            ? "İstek doğrulanamadı"
            : "Alanları ve kuralları kontrol edin.",
    },
    { status, headers: publicPrivateHeaders },
  );
}
export async function teamRequest(
  req: Request,
  action: "login" | "logout" | "apply" | "rotate",
) {
  try {
    verifyCsrf(req);
    const headers = new Headers(publicPrivateHeaders);
    if (action === "logout") {
      await logoutTeam(req);
      headers.set(
        "Set-Cookie",
        TEAM_COOKIE + "=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0",
      );
      return Response.json({ ok: true }, { headers });
    }
    if (action === "login") {
      const d = z
        .strictObject({ token: z.string(), password: z.string() })
        .parse(await readJson(req));
      const s = await loginTeam(d.token, d.password);
      headers.set(
        "Set-Cookie",
        TEAM_COOKIE +
          "=" +
          s.token +
          "; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800",
      );
      return Response.json({ ok: true }, { headers });
    }
    if (action === "rotate") {
      const actor = await adminActor(req),
        d = z.strictObject({ teamId: z.uuid() }).parse(await readJson(req));
      return Response.json(await rotateTeamAccess(actor, d.teamId), {
        headers,
      });
    }
    const d = z
      .strictObject({
        slug: z.string(),
        versionId: z.uuid(),
        answers: z.unknown(),
        teamId: z.uuid().optional(),
        password: z.string().max(128).optional(),
        idempotencyKey: z.string(),
        website: z.string().max(512).default(""),
        botToken: z.string().max(2048).optional(),
      })
      .parse(await readJson(req, 128 * 1024));
    if (d.website) throw new SubmissionError(400, "İstek doğrulanamadı");
    await verifyBotToken(d.botToken, "ulujam_apply");
    const input = {
      slug: d.slug,
      versionId: d.versionId,
      answers: d.answers,
      ...(d.teamId ? { teamId: d.teamId } : {}),
      ...(d.password ? { password: d.password } : {}),
    };
    const idempotencyKey = d.idempotencyKey;
    return Response.json(await submitUlujam(input, idempotencyKey), {
      status: 201,
      headers,
    });
  } catch (e) {
    return teamError(e);
  }
}
export async function teamListRequest(req: Request) {
  try {
    await teamRate("ulujam_team_read", "global", 120);
    const url = new URL(req.url);
    return Response.json(
      await getUlujamTeams(
        url.searchParams.get("slug") ?? "",
        url.searchParams.get("cursor") ?? undefined,
      ),
      { headers: publicPrivateHeaders },
    );
  } catch (e) {
    return teamError(e);
  }
}
