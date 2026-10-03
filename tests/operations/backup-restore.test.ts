import { it, expect } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type postgres from "postgres";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { getDatabase, closeDatabase } from "../../src/lib/database/client";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  putPrivate,
  readPrivate,
  removePrivate,
} from "../../src/modules/media/infrastructure/object-store";
const execute = promisify(execFile);
const digest = (data: Buffer | string) =>
  createHash("sha256").update(data).digest("hex");
async function snapshot(sql: postgres.Sql) {
  const tables =
    await sql`select tablename from pg_tables where schemaname='public' order by tablename`;
  const result: Record<string, { count: number; hash: string }> = {};
  for (const { tablename } of tables) {
    // Table names come only from the local PostgreSQL catalog; quote identifiers.
    const rows = await sql.unsafe(
      `SELECT row_to_json(t)::text AS value FROM "${tablename.replaceAll('"', '""')}" t`,
    );
    result[tablename] = {
      count: rows.length,
      hash: digest(
        rows
          .map((r) => r.value)
          .sort()
          .join("\n"),
      ),
    };
  }
  return result;
}
it("restores a real paired PostgreSQL/S3 snapshot into a clean test database", async () => {
  const started = performance.now();
  const x = await ulujamFixture();
  const target = await createTestDatabase();
  const dir = await mkdtemp(join(tmpdir(), "uludott-restore-"));
  const tag = randomUUID();
  const keys = [
    "restore-test/" + tag + "/original",
    "restore-test/" + tag + "/variant",
  ];
  const backupKeys = keys.map((k) => "restore-test/backup/" + k);
  const bytes = [
    Buffer.from("DEMO original " + tag),
    Buffer.from("DEMO variant " + tag),
  ];
  try {
    await migrateEmptyDatabase();
    await seed2026Results(getDatabase());
    await seed2026Results(getDatabase());
    const clean = await snapshot(x.sql);
    for (const t of [
      "applications",
      "teams",
      "submissions",
      "cards",
      "wallet_passes",
      "game_credits",
    ])
      expect(clean[t].count).toBe(0);
    expect(clean.games.count).toBe(3);
    await submitUlujam(x.input("solo"), randomUUID());
    const assetId = randomUUID();
    await x.sql`insert into media_assets(id,original_key,mime_type,byte_size,status,alt_text) values(${assetId},${keys[0]},'application/octet-stream',${bytes[0].length},'ready','DEMO restore')`;
    await x.sql`insert into media_variants(asset_id,purpose,object_key,width,height,mime_type) values(${assetId},'card',${keys[1]},1,1,'application/octet-stream')`;
    for (let i = 0; i < keys.length; i++)
      await putPrivate(keys[i], bytes[i], "application/octet-stream");
    const before = await snapshot(x.sql);
    const dbname = new URL(x.url).pathname.slice(1),
      targetname = new URL(target.url).pathname.slice(1);
    for (const name of [dbname, targetname])
      expect(name).toMatch(/^uludott_test_[a-f0-9]{32}$/);
    let compose: string[] = ["compose"];
    try {
      await execute("docker", ["compose", "version"]);
    } catch {
      compose = [];
    }
    const cli = compose.length ? "docker" : "docker-compose";
    const { stdout } = await execute(cli, [
      ...compose,
      "--env-file",
      ".env.local",
      "ps",
      "-q",
      "postgres",
    ]);
    const container = stdout.trim();
    expect(container).toMatch(/^[a-f0-9]{12,64}$/);
    const { stdout: dump } = await execute(
      "docker",
      [
        "exec",
        container,
        "pg_dump",
        "-U",
        "uludott",
        "-d",
        dbname,
        "--format=custom",
        "--no-owner",
      ],
      { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 },
    );
    const dumpPath = join(dir, "database.dump");
    await writeFile(dumpPath, dump, { mode: 0o600, flag: "wx" });
    const dumpHash = digest(dump);
    for (let i = 0; i < keys.length; i++)
      await putPrivate(
        backupKeys[i],
        await readPrivate(keys[i]),
        "application/octet-stream",
      );
    const backupMs = performance.now() - started;
    // Simulated loss is restricted to this test's two UUID keys.
    for (const key of keys) await removePrivate(key);
    const restoreStarted = performance.now();
    expect(digest(await readFile(dumpPath))).toBe(dumpHash);
    // docker exec receives bytes via stdin; no URL/password or dump appears in logs.
    const { spawn } = await import("node:child_process");
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "docker",
        [
          "exec",
          "-i",
          container,
          "pg_restore",
          "-U",
          "uludott",
          "-d",
          targetname,
          "--no-owner",
          "--exit-on-error",
        ],
        { stdio: ["pipe", "ignore", "ignore"] },
      );
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error("TEST_RESTORE_FAILED")),
      );
      child.stdin.on("error", reject);
      child.stdin.end(dump);
    });
    for (let i = 0; i < keys.length; i++) {
      const restored = await readPrivate(backupKeys[i]);
      expect(digest(restored)).toBe(digest(bytes[i]));
      await putPrivate(keys[i], restored, "application/octet-stream");
    }
    expect(await snapshot(target.sql)).toEqual(before);
    for (let i = 0; i < keys.length; i++)
      expect(await readPrivate(keys[i])).toEqual(bytes[i]);
    await closeDatabase();
    process.env.DATABASE_URL = target.url;
    await migrateEmptyDatabase();
    expect(await snapshot(target.sql)).toEqual(before);
    await mkdir(".local", { recursive: true });
    await writeFile(
      ".local/task29-drill.json",
      JSON.stringify(
        {
          cleanPersonalRows: 0,
          editorialGames: clean.games.count,
          tableCount: Object.keys(before).length,
          tables: Object.fromEntries(
            Object.entries(before).map(([name, value]) => [name, value.count]),
          ),
          objects: keys.length,
          dumpBytes: dump.length,
          backupMs,
          restoreMs: performance.now() - restoreStarted,
          dataLoss: 0,
          pairedIntegrity: true,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const key of [...keys, ...backupKeys]) await removePrivate(key);
    await closeDatabase();
    await target.cleanup();
    await x.cleanup();
    await rm(dir, { recursive: true, force: true });
  }
}, 60000);
