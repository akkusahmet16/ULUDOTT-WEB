import "server-only";
import { readFileSync, statSync, realpathSync } from "node:fs";
import { resolve, relative, isAbsolute, sep } from "node:path";
import { createPrivateKey } from "node:crypto";
import { z } from "zod";
import { loadServerConfig } from "./server.ts";
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

export type GoogleConfig = {
  issuerId: string;
  clientEmail: string;
  privateKey: string;
  appOrigin: string;
};
export function loadGoogleConfig(): GoogleConfig {
  try {
    if (googleReadiness() === "unconfigured") throw Error("disabled");
    const input = process.env.GOOGLE_WALLET_CREDENTIALS_FILE!;
    if (!isAbsolute(input)) throw Error("path");
    const file = realpathSync(input),
      inside = relative(resolve(process.cwd()), file);
    if (
      inside !== ".." &&
      !inside.startsWith(".." + sep) &&
      !isAbsolute(inside)
    )
      throw Error("repository");
    const stat = statSync(file);
    if (!stat.isFile() || stat.size > 65536 || (stat.mode & 0o077) !== 0)
      throw Error("permissions");
    const creds = z
      .object({
        type: z.literal("service_account"),
        client_email: z.email().max(254),
        private_key: z.string().min(100).max(32768),
      })
      .parse(JSON.parse(readFileSync(file, "utf8")));
    const key = createPrivateKey(creds.private_key);
    if (
      key.asymmetricKeyType !== "rsa" ||
      (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
    )
      throw Error("key");
    return {
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID!,
      clientEmail: creds.client_email,
      privateKey: creds.private_key,
      appOrigin: new URL(loadServerConfig().appUrl).origin,
    };
  } catch {
    throw Error("GOOGLE_CONFIG_UNAVAILABLE");
  }
}
