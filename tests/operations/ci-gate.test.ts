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
