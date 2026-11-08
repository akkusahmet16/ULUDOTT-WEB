import "server-only";
import { z } from "zod";
import { requestCommunityGooglePass } from "../../../../../modules/wallet/application/google-service.ts";
import { SubmissionError } from "../../../../../modules/forms/domain/submission-error.ts";
import { walletHeaders } from "../../../../../modules/wallet/application/wallet-http.ts";

export const runtime = "nodejs";

const walletBodySchema = z.object({
  grantToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = walletBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "Geçersiz veya eksik doğrulama anahtarı" },
        { status: 400, headers: walletHeaders },
      );
    }

    const result = await requestCommunityGooglePass(parsed.data.grantToken);
    return Response.json(result, { headers: walletHeaders });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof SubmissionError
            ? e.message
            : "Google Wallet isteği tamamlanamadı",
      },
      {
        status: e instanceof SubmissionError ? e.status : 503,
        headers: walletHeaders,
      },
    );
  }
}
