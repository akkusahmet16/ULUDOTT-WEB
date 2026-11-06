import { it, expect } from "vitest";
import { mkdtemp, writeFile, chmod, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

it("CI gate stops after a failed check and never builds a release", async () => {
  const dir = await mkdtemp(join(tmpdir(), "uludott-ci-gate-"));
  try {
    const executable = join(dir, "pnpm"),
      log = join(dir, "calls");
    await writeFile(
      executable,
      '#!/bin/sh\nprintf "%s\\n" "$*" >> "$GATE_LOG"\n[ "$1" != "lint" ] || exit 7\n',
    );
    await chmod(executable, 0o700);
    const result = spawnSync("bash", ["scripts/ci-check.sh"], {
      env: {
        ...process.env,
        PATH: dir + ":" + process.env.PATH,
        GATE_LOG: log,
      },
      encoding: "utf8",
    });
    expect(result.status).toBe(7);
    expect((await readFile(log, "utf8")).trim().split("\n")).toEqual([
      "typecheck",
      "lint",
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it("CI check runs all quality, test, security and lighthouse gates sequentially", async () => {
  const dir = await mkdtemp(join(tmpdir(), "uludott-ci-gate-full-"));
  try {
    const executable = join(dir, "pnpm"),
      log = join(dir, "calls");
    await writeFile(
      executable,
      '#!/bin/sh\nprintf "%s\\n" "$*" >> "$GATE_LOG"\nexit 0\n',
    );
    await chmod(executable, 0o700);
    const result = spawnSync("bash", ["scripts/ci-check.sh"], {
      env: {
        ...process.env,
        PATH: dir + ":" + process.env.PATH,
        GATE_LOG: log,
      },
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect((await readFile(log, "utf8")).trim().split("\n")).toEqual([
      "typecheck",
      "lint",
      "db:check",
      "test",
      "build",
      "test:e2e",
      "audit --prod --audit-level=low",
      "security:source",
      "security:wallet",
      "perf:lighthouse --allow-unverified",
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it("GitHub Actions workflow preserves exact versions, frozen lockfile, ephemeral teardown, and artifact uploads", async () => {
  const content = await readFile(".github/workflows/ci.yml", "utf8");

  // Pinned versions and frozen lockfile
  expect(content).toContain("version: 11.19.0");
  expect(content).toContain("node-version: 24.21.0");
  expect(content).toContain("pnpm install --frozen-lockfile");

  // Branches include feat/**
  expect(content).toContain("'feat/**'");

  // Ephemeral services teardown
  expect(content).toContain("docker compose --env-file .env.local down -v");

  // Artifact uploads
  expect(content).toContain("Upload Lighthouse reports");
  expect(content).toContain("path: .local/lighthouse/");
  expect(content).toContain("Upload Playwright traces and results on failure");
  expect(content).toContain("playwright-results");

  // Two independent docker builds
  expect(content).toContain("docker build --target runtime -t uludott-web:acceptance .");
  expect(content).toContain("docker build --target worker -t uludott-worker:acceptance .");
});
