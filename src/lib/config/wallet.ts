import "server-only";
export type ProviderReadiness =
  "unconfigured" | "demo" | "publishing_pending" | "published";
export function googleReadiness(
  env: NodeJS.ProcessEnv = process.env,
): ProviderReadiness {
  if (
    !/^\d{6,30}$/.test(env.GOOGLE_WALLET_ISSUER_ID ?? "") ||
    !env.GOOGLE_WALLET_CREDENTIALS_FILE
  )
    return "unconfigured";
  const mode = env.GOOGLE_WALLET_MODE;
  return mode === "demo" ||
    mode === "publishing_pending" ||
    mode === "published"
    ? mode
    : "unconfigured";
}
export function providerObjectId(provider: "google" | "apple", cardId: string) {
  if (provider === "apple") return "uludott_" + cardId.replaceAll("-", "");
  const issuer = /^\d{6,30}$/.test(process.env.GOOGLE_WALLET_ISSUER_ID ?? "")
    ? process.env.GOOGLE_WALLET_ISSUER_ID
    : "unconfigured";
  return issuer + ".uludott_" + cardId.replaceAll("-", "");
}
