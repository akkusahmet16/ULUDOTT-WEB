import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { authKey } from "../../../lib/config/auth.ts";
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonicalJson).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.entries(v)
        .filter(([, x]) => x !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => JSON.stringify(k) + ":" + canonicalJson(x))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
export function encryptReplay(value: unknown, scope: string) {
  const iv = randomBytes(12),
    c = createCipheriv("aes-256-gcm", authKey(), iv);
  c.setAAD(Buffer.from("form-replay:v1:" + scope));
  const data = Buffer.concat([
    c.update(JSON.stringify(value), "utf8"),
    c.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    c.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(".");
}
export function decryptReplay(encrypted: string, scope: string): unknown {
  const [v, iv, tag, data, ...rest] = encrypted.split(".");
  if (v !== "v1" || !iv || !tag || !data || rest.length)
    throw Error("Replay geçersiz");
  const c = createDecipheriv(
    "aes-256-gcm",
    authKey(),
    Buffer.from(iv, "base64url"),
  );
  c.setAAD(Buffer.from("form-replay:v1:" + scope));
  c.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(
    Buffer.concat([
      c.update(Buffer.from(data, "base64url")),
      c.final(),
    ]).toString("utf8"),
  );
}
