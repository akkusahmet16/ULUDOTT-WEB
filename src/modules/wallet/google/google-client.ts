import "server-only";
import { sign } from "node:crypto";
import { z } from "zod";
import type { GoogleConfig } from "../../../lib/config/wallet.ts";
export class GoogleWalletError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code =
      /^GOOGLE_(HTTP_(400|401|403|404|409|429|500|502|503|504)|PROTOCOL|UNAVAILABLE|IDENTITY_CHANGED)$/.test(
        code,
      )
        ? code
        : "GOOGLE_UNAVAILABLE";
    this.message = this.code;
  }
}
export function signJwt(payload: Record<string, unknown>, key: string) {
  const parts = [{ alg: "RS256", typ: "JWT" }, payload].map((v) =>
    Buffer.from(JSON.stringify(v)).toString("base64url"),
  );
  const body = parts.join(".");
  return (
    body +
    "." +
    sign("RSA-SHA256", Buffer.from(body), key).toString("base64url")
  );
}
export class GoogleClient {
  private access?: { token: string; expiresAt: number };
  private readonly config: GoogleConfig;
  private readonly transport: typeof fetch;
  constructor(config: GoogleConfig, transport: typeof fetch = fetch) {
    this.config = config;
    this.transport = transport;
  }
  private async accessToken() {
    if (this.access && this.access.expiresAt > Date.now() + 60000)
      return this.access.token;
    const now = Math.floor(Date.now() / 1000);
    const assertion = signJwt(
      {
        iss: this.config.clientEmail,
        scope: "https://www.googleapis.com/auth/wallet_object.issuer",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      },
      this.config.privateKey,
    );
    const res = await this.transport("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
      cache: "no-store",
    });
    if (!res.ok) throw new GoogleWalletError("GOOGLE_HTTP_" + res.status);
    const parsed = z
      .object({
        access_token: z.string().min(1).max(16384),
        expires_in: z.number().positive().max(86400),
        token_type: z.literal("Bearer"),
      })
      .safeParse(await res.json());
    if (!parsed.success) throw new GoogleWalletError("GOOGLE_PROTOCOL");
    this.access = {
      token: parsed.data.access_token,
      expiresAt: Date.now() + parsed.data.expires_in * 1000,
    };
    return this.access.token;
  }
  async request(
    kind: "genericClass" | "genericObject",
    method: "GET" | "POST" | "PATCH",
    id?: string,
    body?: Record<string, unknown>,
    conflictAllowed = false,
  ): Promise<{ conflict: boolean; data: Record<string, unknown> }> {
    try {
      const res = await this.transport(
        "https://walletobjects.googleapis.com/walletobjects/v1/" +
          kind +
          (id ? "/" + encodeURIComponent(id) : ""),
        {
          method,
          headers: {
            Authorization: "Bearer " + (await this.accessToken()),
            "Content-Type": "application/json",
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          signal: AbortSignal.timeout(15000),
          redirect: "error",
          cache: "no-store",
        },
      );
      if (res.status === 409 && conflictAllowed)
        return { conflict: true, data: {} };
      if (!res.ok) throw new GoogleWalletError("GOOGLE_HTTP_" + res.status);
      const value = z
        .record(z.string(), z.unknown())
        .safeParse(await res.json());
      if (!value.success) throw new GoogleWalletError("GOOGLE_PROTOCOL");
      return { conflict: false, data: value.data };
    } catch (e) {
      if (e instanceof GoogleWalletError) throw e;
      throw new GoogleWalletError("GOOGLE_UNAVAILABLE");
    }
  }
}
