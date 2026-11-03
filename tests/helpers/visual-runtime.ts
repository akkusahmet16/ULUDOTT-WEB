import { realpath } from "node:fs/promises";
import { dirname, basename, join, relative, isAbsolute, sep } from "node:path";
import { request, type ClientRequest } from "node:http";
import type { ChildProcess } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { stripVTControlCharacters } from "node:util";

// Pin 2D software rasterization for exact pixel proofs. Default GPU raster
// changed native focus-edge samples; retain GPU composition and video decode.
export const VISUAL_BROWSER_ARGS = Object.freeze([
  "--disable-gpu-rasterization",
]);
// Match the native Retina capture grid; CSS viewport dimensions stay unchanged.
export const VISUAL_DEVICE_SCALE_FACTOR = 2;

function inside(parent: string, target: string) {
  const path = relative(parent, target);
  return (
    path === "" ||
    (!isAbsolute(path) && path !== ".." && !path.startsWith(".." + sep))
  );
}

export async function guardVisualPaths(
  source: string,
  candidate: string,
  baseline: string,
) {
  if (![source, candidate, baseline].every(isAbsolute))
    throw Error("ABSOLUTE_VISUAL_PATHS_REQUIRED");
  const sourceRoot = await realpath(source),
    candidateRoot = await realpath(candidate);
  const baselineDir = join(
    await realpath(dirname(baseline)),
    basename(baseline),
  );
  // Output is confined to the candidate's explicit artifact locations, including through symlinks.
  const allowed = [
    join(candidateRoot, ".local/phase-0c"),
    join(candidateRoot, "tests/e2e/__baseline-cinematic__"),
  ];
  if (
    inside(sourceRoot, candidateRoot) ||
    inside(candidateRoot, sourceRoot) ||
    inside(sourceRoot, baselineDir) ||
    inside(baselineDir, sourceRoot) ||
    !allowed.some(
      (parent) => inside(parent, baselineDir) && parent !== baselineDir,
    )
  )
    throw Error("OWNED_VISUAL_PATHS_REQUIRED");
  // Existing symlink outputs must not redirect writes after the lexical guard.
  try {
    const existing = await realpath(baselineDir);
    if (existing !== baselineDir) throw Error("BASELINE_SYMLINK_FORBIDDEN");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return { sourceRoot, baselineDir };
}

/**
 * Next 16.3.8 emits this canonical stdout line inside its server's listening
 * callback. Require that owned-child handshake before probing a shared port.
 * Keep only one bounded line; logs and possible sensitive output never escape.
 */
export function waitForVisualChildReady(
  child: ChildProcess,
  options: { timeoutMs: number; signal?: AbortSignal },
) {
  return new Promise<void>((resolve, reject) => {
    if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
      reject(Error("VISUAL_CHILD_READY_DEADLINE_REQUIRED"));
      return;
    }
    const stdout = child.stdout;
    if (!stdout) {
      reject(Error("VISUAL_CHILD_STDOUT_REQUIRED"));
      return;
    }
    const decoder = new StringDecoder("utf8");
    const readyLine = /^\s*✓ Ready in \d+(?:\.\d+)?(?:ms|s|min)\s*$/;
    let settled = false,
      line = "",
      discarding = false;
    const settle = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      options.signal?.removeEventListener("abort", aborted);
      child.removeListener("error", failed);
      child.removeListener("exit", exited);
      stdout.removeListener("data", output);
      stdout.removeListener("error", stdoutFailed);
      stdout.removeListener("end", exited);
      stdout.removeListener("close", exited);
      line = "";
      if (error) reject(error);
      else resolve();
    };
    const aborted = () => settle(Error("VISUAL_RUN_ABORTED"));
    const exited = () => settle(Error("VISUAL_CHILD_EXIT_BEFORE_READY"));
    const failed = () => settle(Error("VISUAL_CHILD_START_FAILED"));
    const stdoutFailed = () => settle(Error("VISUAL_CHILD_STDOUT_FAILED"));
    const output = (chunk: Buffer | string) => {
      const parts = decoder
        .write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        .split("\n");
      for (const [index, part] of parts.entries()) {
        if (!discarding) {
          if (line.length + part.length > 4096) {
            line = "";
            discarding = true;
          } else line += part;
        }
        if (index < parts.length - 1) {
          if (!discarding && readyLine.test(stripVTControlCharacters(line))) {
            settle();
            return;
          }
          line = "";
          discarding = false;
        }
      }
    };
    const deadline = setTimeout(
      () => settle(Error("VISUAL_CHILD_READY_TIMEOUT")),
      options.timeoutMs,
    );
    options.signal?.addEventListener("abort", aborted, { once: true });
    child.once("error", failed);
    child.once("exit", exited);
    stdout.on("data", output);
    stdout.once("error", stdoutFailed);
    stdout.once("end", exited);
    stdout.once("close", exited);
    if (options.signal?.aborted) aborted();
    else if (
      child.exitCode !== null ||
      child.signalCode !== null ||
      stdout.readableEnded ||
      stdout.destroyed
    )
      exited();
  });
}

export function waitForVisualServer(
  url: string,
  options: { timeoutMs: number; signal?: AbortSignal; child?: ChildProcess },
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false,
      retry: ReturnType<typeof setTimeout> | undefined,
      active: ClientRequest | undefined;
    const settle = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      clearTimeout(retry);
      active?.destroy();
      options.signal?.removeEventListener("abort", aborted);
      options.child?.removeListener("exit", exited);
      if (error) reject(error);
      else resolve();
    };
    const aborted = () => settle(Error("VISUAL_RUN_ABORTED"));
    const exited = () => settle(Error("VISUAL_SERVER_EXIT"));
    const deadline = setTimeout(
      () => settle(Error("VISUAL_SERVER_TIMEOUT")),
      options.timeoutMs,
    );
    const again = () => {
      if (!settled) retry = setTimeout(poll, 100);
    };
    const poll = () => {
      if (settled) return;
      active = request(url, (response) => {
        response.resume();
        if (response.statusCode === 200) settle();
        else again();
      });
      active.on("error", again);
      active.setTimeout(1000, () => active?.destroy());
      active.end();
    };
    options.signal?.addEventListener("abort", aborted, { once: true });
    options.child?.once("exit", exited);
    if (options.signal?.aborted) aborted();
    else if (
      options.child &&
      (options.child.exitCode !== null || options.child.signalCode !== null)
    )
      exited();
    else poll();
  });
}
