import "server-only";
import { verifyCsrf } from "../../../lib/auth/csrf.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { walletHeaders } from "./wallet-http.ts";
import { requestGooglePass } from "./google-service.ts";
export async function handleGoogleWallet(request: Request, token: string) {
  try {
    try {
      verifyCsrf(request);
    } catch {
      return Response.json(
        { error: "İstek doğrulanamadı" },
        { status: 403, headers: walletHeaders },
      );
    }
    return Response.json(await requestGooglePass(token), {
      headers: walletHeaders,
    });
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
