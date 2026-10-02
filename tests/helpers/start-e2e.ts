import { randomUUID } from "node:crypto";
import { readFile, writeFile, cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type Server } from "node:https";
import { request as proxyRequest } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { createTestDatabase } from "./local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { seedUlujamComingSoon } from "../../src/db/seeds/ulujam-coming-soon.ts";
import { seed2026Results } from "../../src/db/seeds/2026-results.ts";
import { getDatabase, closeDatabase } from "../../src/lib/database/client.ts";
import {
  hashPassword,
  encryptMfaSecret,
  tokenHash,
} from "../../src/lib/auth/crypto.ts";

import { removePrivate } from "../../src/modules/media/infrastructure/object-store.ts";
const local = await createTestDatabase();
let child: ReturnType<typeof spawn> | undefined;
let cleanup: Promise<void> | undefined;
let productionDir: string | undefined;
const gateways: Server[] = [];
async function finish(code: number) {
  cleanup ??= (async () => {
    try {
      const [ready] =
        await local.sql`select to_regclass('public.media_assets') as t`;
      if (ready.t) {
        const keys =
          await local.sql`select original_key as key from media_assets union all select object_key as key from media_variants`;
        for (const row of keys) await removePrivate(row.key);
      }
    } finally {
      for (const gateway of gateways) {
        gateway.closeAllConnections();
        await new Promise<void>((resolve) => gateway.close(() => resolve()));
      }
      await closeDatabase();
      await local.cleanup();
      if (productionDir)
        await rm(productionDir, { recursive: true, force: true });
    }
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
  await seed2026Results(getDatabase());
  await seedUlujamComingSoon(getDatabase());
  const id = randomUUID();
  await local.sql`insert into admins(id,email,password_hash,mfa_secret_encrypted) values(${id},'admin-e2e@test.invalid',${await hashPassword("E2E-only-password-long-42")},${encryptMfaSecret("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP", id)})`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'system_admin')`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'content_editor')`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'event_manager')`;
  await local.sql`insert into admin_event_scopes(admin_id,event_id) select ${id},id from events`;
  await local.sql`update admins set recovery_code_hashes=${local.sql.json([tokenHash("11111111111111111111111111111111"), tokenHash("22222222222222222222222222222222"), tokenHash("33333333333333333333333333333333"), tokenHash("44444444444444444444444444444444"), tokenHash("55555555555555555555555555555555"), tokenHash("66666666666666666666666666666666")])} where id=${id}`;
  await closeDatabase();
  if (process.env.ULUDOTT_E2E_PRODUCTION === "1") {
    productionDir = await mkdtemp(join(tmpdir(), "uludott-standalone-"));
    await cp(".next/standalone", productionDir, { recursive: true });
    await cp(".next/static", join(productionDir, ".next/static"), {
      recursive: true,
    });
    await cp("public", join(productionDir, "public"), { recursive: true });
    await writeFile(
      join(productionDir, "tls.cnf"),
      "[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=localhost\n[ext]\nsubjectAltName=IP:127.0.0.1,DNS:localhost\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,digitalSignature,keyEncipherment\n",
    );
    const certPath = join(productionDir, "test-ca.pem"),
      keyPath = join(productionDir, "test-key.pem");
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "1",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-config",
        join(productionDir, "tls.cnf"),
      ],
      { stdio: "ignore" },
    );
    const key = await readFile(keyPath),
      cert = await readFile(certPath);
    for (const [port, targetPort] of [
      [3443, 3100],
      [9443, 9000],
    ]) {
      const gateway = createServer({ key, cert }, (req, res) => {
        const upstream = proxyRequest(
          {
            hostname: "127.0.0.1",
            port: targetPort,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, "x-forwarded-proto": "https" },
          },
          (response) => {
            res.writeHead(response.statusCode ?? 502, response.headers);
            response.pipe(res);
          },
        );
        upstream.on("error", () => {
          res.writeHead(502);
          res.end();
        });
        req.pipe(upstream);
      });
      await new Promise<void>((resolve, reject) => {
        gateway.once("error", reject);
        gateway.listen(port, "127.0.0.1", resolve);
      });
      gateways.push(gateway);
    }
    child = spawn(process.execPath, ["server.js"], {
      cwd: productionDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        APP_URL: "https://127.0.0.1:3443",
        OBJECT_STORAGE_ENDPOINT: "https://127.0.0.1:9443",
        NODE_EXTRA_CA_CERTS: certPath,
        PORT: "3100",
        HOSTNAME: "127.0.0.1",
      },
      detached: true,
    });
  } else {
    child = spawn("pnpm", ["dev", "--port", "3100"], {
      stdio: "inherit",
      env: process.env,
      detached: true,
    });
  }
  child.on("error", () => void finish(1));
  child.on("exit", (code, signal) => void finish(signal ? 0 : (code ?? 1)));
} catch {
  await finish(1);
}
