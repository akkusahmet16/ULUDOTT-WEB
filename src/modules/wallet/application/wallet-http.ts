import "server-only";
import { z } from "zod";
import { verifyCsrf } from "../../../lib/auth/csrf.ts";
import { readJson } from "../../../lib/http/read-json.ts";
import { cardToken } from "../../cards/application/card-service.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import {
  getWalletStatus,
  requestWalletPass,
  providerSchema,
} from "./wallet-service.ts";
export const walletHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
export async function handleWalletStatus(request: Request) {
  try {
    try {
      verifyCsrf(request);
    } catch {
      return Response.json(
        { error: "İstek doğrulanamadı" },
        { status: 403, headers: walletHeaders },
      );
    }
    const d = z
      .strictObject({
        cardToken,
        provider: providerSchema,
        action: z.enum(["status", "request"]),
      })
      .parse(await readJson(request, 2048));
    return Response.json(
      d.action === "status"
        ? await getWalletStatus(d.cardToken)
        : await requestWalletPass(d.cardToken, d.provider),
      { headers: walletHeaders },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof SubmissionError
            ? error.message
            : "İstek tamamlanamadı",
      },
      {
        status:
          error instanceof SubmissionError
            ? error.status
            : error instanceof z.ZodError
              ? 400
              : 503,
        headers: walletHeaders,
      },
    );
  }
}
