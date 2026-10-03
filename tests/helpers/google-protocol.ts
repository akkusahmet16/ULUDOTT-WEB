import { loadEnvFile } from "node:process";
import { generateKeyPairSync, verify } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { vi } from "vitest";
export async function googleProtocol() {
  loadEnvFile(".env.local");
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const dir = await mkdtemp(join(tmpdir(), "uludott-google-protocol-"));
  const key = pair.privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
  const file = join(dir, "credentials.json");
  await writeFile(
    file,
    JSON.stringify({
      type: "service_account",
      client_email: "protocol@test.iam.gserviceaccount.com",
      private_key: key,
    }),
    { mode: 0o600 },
  );
  const previous = {
    issuer: process.env.GOOGLE_WALLET_ISSUER_ID,
    file: process.env.GOOGLE_WALLET_CREDENTIALS_FILE,
    mode: process.env.GOOGLE_WALLET_MODE,
  };
  process.env.GOOGLE_WALLET_ISSUER_ID = "123456789";
  process.env.GOOGLE_WALLET_CREDENTIALS_FILE = file;
  process.env.GOOGLE_WALLET_MODE = "demo";
  const objects = new Map<string, Record<string, unknown>>(),
    classes = new Set<string>();
  let requests = 0;
  let beforeRequest: (() => Promise<void>) | undefined;
  let failure: number | null = null,
    oauthValid = false;
  const transport: typeof fetch = async (input, init) => {
    const url = String(input),
      method = init?.method ?? "GET";
    if (url === "https://oauth2.googleapis.com/token") {
      const jwt = new URLSearchParams(String(init?.body))
        .get("assertion")!
        .split(".");
      oauthValid = verify(
        "RSA-SHA256",
        Buffer.from(jwt.slice(0, 2).join(".")),
        pair.publicKey,
        Buffer.from(jwt[2], "base64url"),
      );
      const claims = JSON.parse(Buffer.from(jwt[1], "base64url").toString());
      if (
        !oauthValid ||
        claims.scope !==
          "https://www.googleapis.com/auth/wallet_object.issuer" ||
        claims.aud !== "https://oauth2.googleapis.com/token"
      )
        return Response.json({ error: "invalid_grant" }, { status: 400 });
      return Response.json({
        access_token: "protocol-only-token",
        token_type: "Bearer",
        expires_in: 3600,
      });
    }
    if (
      !url.startsWith("https://walletobjects.googleapis.com/walletobjects/v1/")
    )
      throw Error("Unexpected endpoint");
    if (
      new Headers(init?.headers).get("authorization") !==
      "Bearer protocol-only-token"
    )
      return Response.json(
        { error: { message: "Invalid credentials" } },
        { status: 401 },
      );
    if (beforeRequest) await beforeRequest();
    requests++;
    if (failure)
      return Response.json(
        { error: { message: "private remote error +905551234567" } },
        { status: failure },
      );
    const path = new URL(url).pathname.split("/").slice(3),
      kind = path[0],
      id = decodeURIComponent(path[1] ?? "");
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (kind === "genericClass") {
      if (method === "POST") {
        if (classes.has(body.id))
          return Response.json({ error: { code: 409 } }, { status: 409 });
        classes.add(body.id);
        return Response.json(body);
      }
      return classes.has(id)
        ? Response.json({ id })
        : Response.json({ error: { code: 404 } }, { status: 404 });
    }
    if (kind === "genericObject") {
      if (method === "POST") {
        if (objects.has(body.id))
          return Response.json({ error: { code: 409 } }, { status: 409 });
        objects.set(body.id, body);
        return Response.json(body);
      }
      if (!objects.has(id))
        return Response.json({ error: { code: 404 } }, { status: 404 });
      if (method === "PATCH") objects.set(id, { ...objects.get(id), ...body });
      return Response.json(objects.get(id));
    }
    throw Error("Unknown method");
  };
  vi.stubGlobal("fetch", transport);
  return {
    objects,
    requests: () => requests,
    beforeRequest: (fn: () => Promise<void>) => {
      beforeRequest = fn;
    },
    classes,
    key,
    pair,
    file,
    setFailure: (s: number | null) => {
      failure = s;
    },
    oauthValid: () => oauthValid,
    cleanup: async () => {
      vi.unstubAllGlobals();
      for (const [name, value] of Object.entries({
        GOOGLE_WALLET_ISSUER_ID: previous.issuer,
        GOOGLE_WALLET_CREDENTIALS_FILE: previous.file,
        GOOGLE_WALLET_MODE: previous.mode,
      })) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
      await rm(dir, { recursive: true, force: true });
    },
  };
}
