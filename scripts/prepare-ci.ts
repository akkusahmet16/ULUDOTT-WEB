import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
if (process.env.GITHUB_ACTIONS !== "true") throw Error("CI_ONLY");
await mkdir(".local", { recursive: true, mode: 0o700 });
const password = randomBytes(24).toString("hex");
const storage = randomBytes(24).toString("hex");
const env = {
  APP_URL: "http://127.0.0.1:3000",
  DATABASE_URL: `postgresql://uludott:${password}@127.0.0.1:5432/uludott`,
  LOCAL_POSTGRES_PASSWORD: password,
  OBJECT_STORAGE_ENDPOINT: "http://127.0.0.1:9000",
  OBJECT_STORAGE_REGION: "garage",
  OBJECT_STORAGE_BUCKET: "uludott-media",
  OBJECT_STORAGE_ACCESS_KEY: "GK" + randomBytes(16).toString("hex"),
  OBJECT_STORAGE_SECRET_KEY: storage,
  AUTH_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
  GOOGLE_WALLET_MODE: "disabled",
  TURNSTILE_MODE: "disabled",
};
await writeFile(
  ".env.local",
  Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  { mode: 0o600, flag: "wx" },
);
await writeFile(
  ".local/garage-rpc.secret",
  randomBytes(32).toString("hex") + "\n",
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Ephemeral CI configuration created; no live provider credentials.",
);
