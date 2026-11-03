import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, realpath } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { getEventListeners, once } from "node:events";
import {
  guardVisualPaths,
  waitForVisualChildReady,
  waitForVisualServer,
} from "../helpers/visual-runtime.ts";

async function withEchoChild(
  work: (child: ReturnType<typeof spawn>) => Promise<void>,
) {
  const child = spawn(process.execPath, [
    "-e",
    "process.stdin.pipe(process.stdout)",
  ]);
  const closed = once(child, "close");
  try {
    await work(child);
  } finally {
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGTERM");
    await closed;
  }
}

function readinessListeners(child: ReturnType<typeof spawn>) {
  return {
    error: child.listenerCount("error"),
    exit: child.listenerCount("exit"),
    data: child.stdout!.listenerCount("data"),
    stdoutError: child.stdout!.listenerCount("error"),
    end: child.stdout!.listenerCount("end"),
    close: child.stdout!.listenerCount("close"),
  };
}

async function echo(child: ReturnType<typeof spawn>, bytes: string | Buffer) {
  const output = once(child.stdout!, "data");
  child.stdin!.write(bytes);
  await output;
}

describe("visual runtime ownership", () => {
  it("permits only an owned baseline directory, never the immutable source", async () => {
    const dir = await mkdtemp(join(tmpdir(), "visual-guard-test-"));
    try {
      const source = join(dir, "v1"),
        candidate = join(dir, "v2");
      await mkdir(source);
      await mkdir(join(candidate, ".local/phase-0c"), { recursive: true });
      await expect(
        guardVisualPaths(source, candidate, join(source, "baseline")),
      ).rejects.toThrow();
      await expect(
        guardVisualPaths(source, candidate, candidate),
      ).rejects.toThrow();
      await expect(
        guardVisualPaths(
          source,
          candidate,
          join(candidate, ".local/phase-0c/baseline"),
        ),
      ).resolves.toEqual({
        sourceRoot: await realpath(source),
        baselineDir: join(
          await realpath(candidate),
          ".local/phase-0c/baseline",
        ),
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("readiness cancels hanging requests on timeout", async () => {
    const server = createServer(() => {});
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address() as { port: number };
    try {
      await expect(
        waitForVisualServer(`http://127.0.0.1:${address.port}/`, {
          timeoutMs: 30,
        }),
      ).rejects.toThrow("VISUAL_SERVER_TIMEOUT");
    } finally {
      server.closeAllConnections();
      await new Promise<void>((done) => server.close(() => done()));
    }
  });
  it("readiness ends immediately on abort and does not retain polls", async () => {
    const controller = new AbortController();
    const pending = waitForVisualServer("http://127.0.0.1:1/", {
      timeoutMs: 5000,
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toThrow("VISUAL_RUN_ABORTED");
  });
  it("readiness rejects a signal-killed child (exitCode stays null)", async () => {
    const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"]);
    const pending = waitForVisualServer("http://127.0.0.1:1/", {
      timeoutMs: 5000,
      child,
    });
    child.kill("SIGTERM");
    await expect(pending).rejects.toThrow("VISUAL_SERVER_EXIT");
    expect(child.signalCode).toBe("SIGTERM");
  });

  it("requires the child's complete canonical Next ready line across ANSI and UTF-8 chunks", async () => {
    await withEchoChild(async (child) => {
      const before = readinessListeners(child);
      let ready = false;
      const pending = waitForVisualChildReady(child, { timeoutMs: 5000 });
      void pending.then(
        () => (ready = true),
        () => {},
      );
      await echo(child, "diagnostic: ✓ Ready in 1ms\n");
      expect(ready).toBe(false);
      const checkmark = Buffer.from("✓");
      await echo(
        child,
        Buffer.concat([
          Buffer.from("\u001b[32m\u001b[1m"),
          checkmark.subarray(0, 1),
        ]),
      );
      await echo(child, checkmark.subarray(1));
      await echo(child, "\u001b[22m\u001b[39m Rea");
      await echo(child, "dy in 14ms");
      expect(ready).toBe(false);
      await echo(child, "\r\n");
      await expect(pending).resolves.toBeUndefined();
      expect(readinessListeners(child)).toEqual(before);
    });
  });

  it.each(["0ms", "3.2s", "2.5min"])(
    "accepts Next's %s duration without requiring a listening HTTP endpoint",
    async (duration) => {
      await withEchoChild(async (child) => {
        const pending = waitForVisualChildReady(child, { timeoutMs: 5000 });
        await echo(child, `✓ Ready in ${duration}\n`);
        await expect(pending).resolves.toBeUndefined();
      });
    },
  );

  it("discards an oversized diagnostic line rather than accepting its ready-shaped suffix", async () => {
    await withEchoChild(async (child) => {
      let ready = false;
      const pending = waitForVisualChildReady(child, { timeoutMs: 5000 });
      void pending.then(
        () => (ready = true),
        () => {},
      );
      await echo(child, "x".repeat(128 * 1024));
      await echo(child, "✓ Ready in 1ms\n");
      expect(ready).toBe(false);
      await echo(child, "✓ Ready in 1ms\n");
      await expect(pending).resolves.toBeUndefined();
    });
  });

  it("times out on unrelated child output and removes its listeners", async () => {
    await withEchoChild(async (child) => {
      const before = readinessListeners(child);
      const pending = waitForVisualChildReady(child, { timeoutMs: 40 });
      await expect(pending).rejects.toThrow("VISUAL_CHILD_READY_TIMEOUT");
      expect(readinessListeners(child)).toEqual(before);
    });
  });

  it.each([false, true])(
    "cancels child readiness when aborted (already aborted: %s)",
    async (already) => {
      await withEchoChild(async (child) => {
        const controller = new AbortController();
        if (already) controller.abort();
        const before = readinessListeners(child);
        const pending = waitForVisualChildReady(child, {
          timeoutMs: 5000,
          signal: controller.signal,
        });
        if (!already) controller.abort();
        await expect(pending).rejects.toThrow("VISUAL_RUN_ABORTED");
        expect(readinessListeners(child)).toEqual(before);
        expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
      });
    },
  );

  it("rejects a child exiting before its ready line", async () => {
    await withEchoChild(async (child) => {
      const pending = waitForVisualChildReady(child, { timeoutMs: 5000 });
      child.kill("SIGTERM");
      await expect(pending).rejects.toThrow("VISUAL_CHILD_EXIT_BEFORE_READY");
      expect(child.listenerCount("exit")).toBe(0);
      expect(child.stdout!.listenerCount("data")).toBe(0);
    });
  });

  it("rejects an already exited child without waiting for its timeout", async () => {
    const child = spawn(process.execPath, ["-e", ""]);
    await once(child, "close");
    await expect(
      waitForVisualChildReady(child, { timeoutMs: 5000 }),
    ).rejects.toThrow("VISUAL_CHILD_EXIT_BEFORE_READY");
  });

  it("rejects spawn failure without retaining error or stdout listeners", async () => {
    const child = spawn(process.execPath + "-visual-missing", []);
    // Observe the actual failed spawn independently of readiness's rejection.
    const observed = new Promise<void>((resolve) =>
      child.once("error", () => resolve()),
    );
    const closed = new Promise<void>((resolve) =>
      child.once("close", () => resolve()),
    );
    const pending = waitForVisualChildReady(child, { timeoutMs: 5000 });
    await expect(pending).rejects.toThrow("VISUAL_CHILD_START_FAILED");
    await observed;
    await closed;
    expect(child.listenerCount("error")).toBe(0);
    expect(child.stdout!.listenerCount("data")).toBe(0);
  });
});
