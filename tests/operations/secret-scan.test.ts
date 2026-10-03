import { it, expect } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
it("source scan rejects a JSON-escaped private key without echoing its contents", async () => {
  const dir = await mkdtemp(join(tmpdir(), "uludott-secret-scan-"));
  try {
    execFileSync("git", ["init", "-q", dir]);
    const synthetic =
      "-----BEGIN PRIVATE KEY-----\n" +
      "A".repeat(64) +
      "\n-----END PRIVATE KEY-----\n";
    await writeFile(
      join(dir, "credential.json"),
      JSON.stringify({ private_key: synthetic }),
    );
    const result = spawnSync(
      process.execPath,
      [resolve("scripts/check-secrets.ts")],
      { cwd: dir, env: { PATH: process.env.PATH, NODE_ENV: "test" }, encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ secretHits: 1 });
    expect(result.stdout).not.toContain("A".repeat(64));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
