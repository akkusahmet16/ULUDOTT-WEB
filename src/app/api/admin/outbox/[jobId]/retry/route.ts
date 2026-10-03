import {
  resolveSession,
  SESSION_COOKIE,
} from "../../../../../../lib/auth/session";
import { verifyCsrf, readCookie } from "../../../../../../lib/auth/csrf";
import { retryJob } from "../../../../../../worker/claim-job";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function POST(
  request: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    verifyCsrf(request);
    const session = await resolveSession(
      readCookie(request, SESSION_COOKIE) ?? "",
    );
    if (!session)
      return Response.json(
        { error: "Oturum gerekli" },
        { status: 401, headers },
      );
    await retryJob(session.actor, (await ctx.params).jobId);
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json(
      { error: "İş yeniden denenemedi" },
      { status: 403, headers },
    );
  }
}
