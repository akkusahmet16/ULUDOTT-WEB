import "server-only";
import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { authKey } from "../config/auth.ts";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function hashPassword(password: string) {
  if (password.length < 14 || Buffer.byteLength(password) > 1024)
    throw new Error("Parola en az 14 karakter, en fazla 1024 byte olmalı.");
  return hash(password, {
    algorithm: 2 /* Argon2id, native binding enum değeri */,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}
export async function verifyPassword(encoded: string, password: string) {
  if (Buffer.byteLength(password) > 1024) return false;
  try {
    return await verify(encoded, password);
  } catch {
    return false;
  }
}
export function encryptMfaSecret(secret: string, adminId: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", authKey(), iv);
  cipher.setAAD(Buffer.from(`admin-mfa:v1:${adminId}`));
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(".");
}
export function decryptMfaSecret(encrypted: string, adminId: string) {
  const [version, iv, tag, data] = encrypted.split(".");
  if (version !== "v1" || !iv || !tag || !data)
    throw new Error("Geçersiz MFA kaydı");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    authKey(),
    Buffer.from(iv, "base64url"),
  );
  cipher.setAAD(Buffer.from(`admin-mfa:v1:${adminId}`));
  cipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    cipher.update(Buffer.from(data, "base64url")),
    cipher.final(),
  ]).toString("utf8");
}
export const normalizeRecovery = (code: string) =>
  code.replaceAll("-", "").toLowerCase();
export function newRecoveryCodes() {
  return Array.from({ length: 8 }, () =>
    randomBytes(16).toString("hex").match(/.{4}/g)!.join("-"),
  );
}
