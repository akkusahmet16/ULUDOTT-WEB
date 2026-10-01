import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createTestDatabase } from "./local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { closeDatabase } from "../../src/lib/database/client.ts";
import { hashPassword, encryptMfaSecret } from "../../src/lib/auth/crypto.ts";

const local = await createTestDatabase();
let child: ReturnType<typeof spawn> | undefined;
let cleanup: Promise<void> | undefined;
async function finish(code: number) {
  cleanup ??= (async () => {
    await closeDatabase();
    await local.cleanup();
  })();
  await cleanup;
  process.exit(code);
}
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    if (child?.pid) {
      try {
        process.kill(-child.pid, signal);
      } catch {
        void finish(0);
      }
    } else void finish(0);
  });
try {
  process.env.DATABASE_URL = local.url;
  process.env.APP_URL = "http://127.0.0.1:3100";
  await migrateEmptyDatabase();
  const id = randomUUID();
  await local.sql`insert into admins(id,email,password_hash,mfa_secret_encrypted) values(${id},'admin-e2e@test.invalid',${await hashPassword("E2E-only-password-long-42")},${encryptMfaSecret("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP", id)})`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'system_admin')`;
  await closeDatabase();
  child = spawn("pnpm", ["dev", "--port", "3100"], {
    stdio: "inherit",
    env: process.env,
    detached: true,
  });
  child.on("error", () => void finish(1));
  child.on("exit", (code, signal) => void finish(signal ? 0 : (code ?? 1)));
} catch {
  await finish(1);
}
