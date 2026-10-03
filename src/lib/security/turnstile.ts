import "server-only";
import { SubmissionError } from "../../modules/forms/domain/submission-error.ts";
export function botConfiguration() {
  return {
    required: process.env.TURNSTILE_MODE === "required",
    siteKey:
      process.env.TURNSTILE_MODE === "required"
        ? (process.env.TURNSTILE_SITE_KEY ?? "")
        : "",
  };
}
export async function verifyBotToken(
  token: string | undefined,
  action: string,
): Promise<void> {
  if (process.env.TURNSTILE_MODE !== "required") {
    if (process.env.TURNSTILE_MODE && process.env.TURNSTILE_MODE !== "disabled")
      throw new SubmissionError(503, "BOT_CONFIG_UNAVAILABLE");
    return;
  }
  try {
    if (
      !token ||
      token.length > 2048 ||
      !process.env.TURNSTILE_SECRET_KEY ||
      !process.env.APP_URL
    )
      throw Error();
    if (!/^[a-z_]{1,40}$/.test(action)) throw Error();
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      },
    );
    if (!response.ok) throw Error();
    const result = await response.json();
    if (
      result.success !== true ||
      result.action !== action ||
      result.hostname !== new URL(process.env.APP_URL).hostname
    )
      throw Error();
  } catch {
    throw new SubmissionError(
      403,
      "BOT doğrulaması tamamlanamadı. Yeniden deneyin.",
    );
  }
}
