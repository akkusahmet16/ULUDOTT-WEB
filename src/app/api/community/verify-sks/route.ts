import "server-only";
import { z } from "zod";
import { verifyAndGrantMemberCardViaSks } from "../../../../modules/community/application/community-service.ts";

export const runtime = "nodejs";

const verifySksBodySchema = z.object({
  studentNumber: z.string().trim().min(4).max(30),
  password: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = verifySksBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "invalidInput" },
        { status: 400 },
      );
    }

    const result = await verifyAndGrantMemberCardViaSks(parsed.data);
    if (!result.success) {
      if (result.error === "INVALID_CREDENTIALS") {
        return Response.json(
          { ok: false, error: "invalidCredentials" },
          { status: 401 },
        );
      }
      if (result.error === "NOT_MEMBER") {
        return Response.json(
          { ok: false, error: "notMember" },
          { status: 403 },
        );
      }
      return Response.json(
        { ok: false, error: "sksUnavailable" },
        { status: 503 },
      );
    }

    return Response.json({
      ok: true,
      grantToken: result.grantToken,
    });
  } catch {
    return Response.json(
      { ok: false, error: "serverError" },
      { status: 500 },
    );
  }
}
