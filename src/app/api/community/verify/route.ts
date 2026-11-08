import "server-only";
import { z } from "zod";
import { verifyAndGrantMemberCard } from "../../../../modules/community/application/community-service.ts";

export const runtime = "nodejs";

const verifyBodySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = verifyBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "invalidInput" },
        { status: 400 },
      );
    }

    const result = await verifyAndGrantMemberCard(parsed.data);
    if (!result.success) {
      return Response.json(
        { ok: false, error: "notFound" },
        { status: 404 },
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
