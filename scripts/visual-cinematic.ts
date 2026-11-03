import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import { createServer } from "node:https";
import { request } from "node:http";
import { createWriteStream } from "node:fs";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
  access,
  appendFile,
  realpath,
  rename,
} from "node:fs/promises";
import { finished } from "node:stream/promises";
import { tmpdir, platform, arch, release } from "node:os";
import { resolve, join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
import {
  preparePrivateVisualScenes,
  capturePrivateVisualScenes,
} from "../tests/helpers/visual-private-scenes.ts";
import { comparePngPixels } from "../tests/helpers/visual-pixels.ts";
import { seedVisualMediaFixture } from "../tests/helpers/visual-media-fixture.ts";
import { captureVisualAdminBoundaries } from "../tests/helpers/visual-admin-boundaries.ts";
import { createTestDatabase } from "../tests/helpers/local-database.ts";
import { migrateEmptyDatabase } from "../src/lib/database/migrate.ts";
import { closeDatabase } from "../src/lib/database/client.ts";
import { seedVisualFixture } from "../tests/helpers/visual-fixture.ts";
import {
  copySourceSnapshot,
  createSourceManifest,
  assertSourceUnchanged,
} from "../tests/helpers/visual-reference.ts";
import { trackHttpsGateway } from "../tests/helpers/https-gateway.ts";
import {
  guardVisualPaths,
  waitForVisualServer,
  waitForVisualChildReady,
  VISUAL_BROWSER_ARGS,
  VISUAL_DEVICE_SCALE_FACTOR,
} from "../tests/helpers/visual-runtime.ts";

const root = process.cwd();
const args = process.argv.slice(2);
const mode = args.shift();
if (
  ![
    "record-reference",
    "compare",
    "compare-private",
    "compare-boundaries",
  ].includes(mode ?? "") ||
  args.length !== 2
)
  throw Error(
    "Usage: visual-cinematic.ts <record-reference|compare|compare-private|compare-boundaries> <v0.1-root> <baseline-dir>",
  );
const { sourceRoot, baselineDir } = await guardVisualPaths(
  resolve(args[0]),
  root,
  resolve(args[1]),
);
const cancellation = new AbortController();
const children = new Set<ReturnType<typeof spawn>>();
function terminate(child: ReturnType<typeof spawn>, signal: NodeJS.Signals) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null)
    return;
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EPERM") child.kill(signal);
    else if (code !== "ESRCH") throw error;
  }
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    cancellation.abort();
    for (const child of children) terminate(child, "SIGTERM");
    const force = setTimeout(() => {
      for (const child of children) terminate(child, "SIGKILL");
    }, 10_000);
    force.unref();
  });
function track(child: ReturnType<typeof spawn>) {
  children.add(child);
  child.once("close", () => children.delete(child));
  return child;
}
if (
  sourceRoot === root ||
  sourceRoot.startsWith(root + "/") ||
  root.startsWith(sourceRoot + "/")
)
  throw Error("INDEPENDENT_REFERENCE_SOURCE_REQUIRED");
const evidenceDir = resolve(".local/phase-0c");
await mkdir(evidenceDir, { recursive: true, mode: 0o700 });
if ((await realpath(evidenceDir)) !== evidenceDir)
  throw Error("EVIDENCE_SYMLINK_FORBIDDEN");
const source = await createSourceManifest(sourceRoot);
const candidateSource = await createSourceManifest(root);
const epoch = Date.parse("2026-10-22T12:00:00Z");
const sha = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
const require = createRequire(import.meta.url);
const playwrightRequire = createRequire(require.resolve("@playwright/test"));
const coreRequire = createRequire(
  playwrightRequire.resolve("playwright/package.json"),
);
const captureInputs = [
  "scripts/visual-cinematic.ts",
  "playwright.visual.config.ts",
  "tests/e2e/visual-cinematic.spec.ts",
  "tests/helpers/visual-fixture.ts",
  "tests/helpers/visual-clock.mjs",
  "tests/helpers/visual-clock-script.mjs",
  "tests/helpers/visual-motion-scenes.ts",
  "tests/helpers/visual-page-readiness.ts",
  "tests/helpers/visual-pixels.ts",
  "tests/helpers/visual-capture.ts",
  "tests/helpers/visual-fonts.ts",
  "tests/helpers/visual-state-scenes.ts",
  "tests/helpers/visual-media-fixture.ts",
  "tests/helpers/visual-additional-scenes.ts",
  "tests/helpers/visual-content-scenes.ts",
  "tests/helpers/visual-private-scenes.ts",
  "tests/helpers/visual-admin-boundaries.ts",
  "tests/helpers/visual-runtime.ts",
  "tests/helpers/visual-reference.ts",
  "tests/helpers/https-gateway.ts",
  "tests/helpers/local-database.ts",
];
const captureInputHashes = Object.fromEntries(
  await Promise.all(
    captureInputs.map(async (path) => [path, sha(await readFile(path))]),
  ),
);
const runtime = {
  captureInputHashes,
  browserExecutableSha256: sha(await readFile(chromium.executablePath())),
  platform: platform(),
  arch: arch(),
  release: release(),
  node: process.version,
  playwright: JSON.parse(
    await readFile("node_modules/@playwright/test/package.json", "utf8"),
  ).version,
  browser: JSON.parse(
    await readFile(
      join(
        dirname(coreRequire.resolve("playwright-core/package.json")),
        "browsers.json",
      ),
      "utf8",
    ),
  ).browsers.find((b: { name: string }) => b.name === "chromium"),
  lockSha256: sha(await readFile("pnpm-lock.yaml")),
  epoch,
  locale: "tr-TR",
  timezone: "Europe/Istanbul",
  dpr: VISUAL_DEVICE_SCALE_FACTOR,
  screenshotScale: "device",
  reducedMotion: "no-preference",
  serverClock:
    "Date(), new Date(), Date.now() fixed; browser login cookie Expires omitted in-memory only",
  browserChannel: "chromium",
  browserLaunchArgs: [...VISUAL_BROWSER_ARGS],
};
let manifest: Record<string, unknown>;
if (mode === "record-reference") {
  try {
    await access(baselineDir);
    throw Error("BASELINE_DESTINATION_ALREADY_EXISTS");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(baselineDir, { recursive: true });
  manifest = { version: 1, source, runtime, captures: {}, complete: false };
  await writeFile(
    join(baselineDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
} else if (["compare-private", "compare-boundaries"].includes(mode!)) {
  manifest = { source, runtime, captures: {} };
} else {
  manifest = JSON.parse(
    await readFile(join(baselineDir, "manifest.json"), "utf8"),
  );
  if (
    !manifest.complete ||
    JSON.stringify(manifest.source) !== JSON.stringify(source)
  )
    throw Error("REFERENCE_SOURCE_CHANGED_OR_INCOMPLETE");
  if (JSON.stringify(manifest.runtime) !== JSON.stringify(runtime))
    throw Error("VISUAL_RUNTIME_MISMATCH");
}
// Read only local configuration, then pass only synthetic test credentials to children.
process.loadEnvFile(".env.local");
const databaseUrl = process.env.DATABASE_URL!;
if (!["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname))
  throw Error("LOCAL_DATABASE_REQUIRED");
const testEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: process.env.TMPDIR,
  DATABASE_URL: databaseUrl,
  AUTH_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
  APP_URL: "https://127.0.0.1:3443",
  NODE_ENV: "production",
  TZ: "Europe/Istanbul",
  OBJECT_STORAGE_ENDPOINT: "https://127.0.0.1:9443",
  OBJECT_STORAGE_REGION: "garage",
  OBJECT_STORAGE_BUCKET: "uludott-0c-unused",
  OBJECT_STORAGE_ACCESS_KEY: "GK" + randomBytes(16).toString("hex"),
  OBJECT_STORAGE_SECRET_KEY: randomBytes(32).toString("hex"),
  GOOGLE_WALLET_MODE: "disabled",
  TURNSTILE_MODE: "disabled",
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, testEnv);

async function run(
  command: string,
  commandArgs: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  label: string,
) {
  cancellation.signal.throwIfAborted();
  const log = createWriteStream(join(evidenceDir, label + ".log"), {
    mode: 0o600,
  });
  const child = track(
    spawn(command, commandArgs, {
      cwd,
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  child.stdout!.pipe(log, { end: false });
  child.stderr!.pipe(log, { end: false });
  const code = await new Promise<number>((resolveCode, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolveCode(code ?? 1));
  });
  log.end();
  await finished(log);
  cancellation.signal.throwIfAborted();
  if (code !== 0)
    throw Error(label + " failed; inspect owned local log (exit " + code + ")");
}

async function start(applicationRoot: string, env: NodeJS.ProcessEnv) {
  const dir = await mkdtemp(join(tmpdir(), "uludott-visual-"));
  await appendFile(
    join(evidenceDir, "owned-resources.jsonl"),
    JSON.stringify({ kind: "standalone", path: dir }) + "\n",
    { mode: 0o600 },
  );
  let child: ReturnType<typeof spawn> | undefined;
  let closeGateway: (() => Promise<void>) | undefined;
  let stopping: Promise<void> | undefined;
  let stopRequested = false;
  let unexpectedExit = false;
  const stop = () =>
    (stopping ??= (async () => {
      stopRequested = true;
      await closeGateway?.();
      if (child && child.exitCode === null && child.signalCode === null) {
        const exited = new Promise<void>((done) =>
          child!.once("exit", () => done()),
        );
        terminate(child, "SIGTERM");
        const timer = setTimeout(
          () => child && terminate(child, "SIGKILL"),
          10_000,
        );
        await exited;
        clearTimeout(timer);
      }
      await rm(dir, { recursive: true, force: true });
      if (unexpectedExit && !cancellation.signal.aborted)
        throw Error("VISUAL_OWNED_SERVER_EXITED_DURING_CAPTURE");
    })());
  try {
    cancellation.signal.throwIfAborted();
    await cp(join(applicationRoot, ".next/standalone"), dir, {
      recursive: true,
    });
    await cp(join(applicationRoot, ".next/static"), join(dir, ".next/static"), {
      recursive: true,
    });
    await cp(join(applicationRoot, "public"), join(dir, "public"), {
      recursive: true,
    });
    const key = join(dir, "test-key.pem"),
      cert = join(dir, "test-cert.pem");
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
        "-subj",
        "/CN=localhost",
        "-keyout",
        key,
        "-out",
        cert,
      ],
      { stdio: "ignore" },
    );
    const gateway = createServer(
      { key: await readFile(key), cert: await readFile(cert) },
      (req, res) => {
        const upstream = request(
          {
            hostname: "127.0.0.1",
            port: 3100,
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
          if (!res.destroyed && !res.writableEnded) {
            if (!res.headersSent) res.writeHead(502);
            res.end();
          }
        });
        req.once("aborted", () => upstream.destroy());
        res.once("close", () => upstream.destroy());
        req.pipe(upstream);
      },
    );
    closeGateway = trackHttpsGateway(gateway);
    await new Promise<void>((done, reject) => {
      gateway.once("error", reject);
      gateway.listen(3443, "127.0.0.1", done);
    });
    const output = createWriteStream(join(evidenceDir, "server.log"), {
      flags: "a",
      mode: 0o600,
    });
    cancellation.signal.throwIfAborted();
    child = track(
      spawn(
        process.execPath,
        [
          "--import",
          pathToFileURL(resolve("tests/helpers/visual-clock.mjs")).href,
          "server.js",
        ],
        {
          cwd: dir,
          env: {
            ...env,
            PORT: "3100",
            HOSTNAME: "127.0.0.1",
            ULUDOTT_VISUAL_EPOCH: String(epoch),
          },
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
        },
      ),
    );
    child.once("exit", () => {
      if (!stopRequested) unexpectedExit = true;
    });
    const ownedReady = waitForVisualChildReady(child, {
      timeoutMs: 30_000,
      signal: cancellation.signal,
    });
    child.stdout!.pipe(output, { end: false });
    child.stderr!.pipe(output, { end: false });
    child.once("close", () => output.end());
    await ownedReady;
    await waitForVisualServer("http://127.0.0.1:3100/admin", {
      timeoutMs: 30_000,
      child,
      signal: cancellation.signal,
    });
    return stop;
  } catch (error) {
    await stop();
    throw error;
  }
}

const comparedLedger = join(evidenceDir, "compared-files.txt");
if (mode === "compare") await writeFile(comparedLedger, "", { mode: 0o600 });
async function visualFixtureFingerprint(
  local: Awaited<ReturnType<typeof createTestDatabase>>,
) {
  const digest = createHash("sha256");
  const tables =
    await local.sql`select tablename from pg_tables where schemaname='public' order by tablename`;
  for (const { tablename } of tables) {
    const [row] =
      tablename === "admins"
        ? await local.sql`select coalesce(jsonb_agg(to_jsonb(t)-'password_hash' order by to_jsonb(t)-'password_hash'),'[]'::jsonb) as records from admins t`
        : await local.sql`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)),'[]'::jsonb) as records from ${local.sql(String(tablename))} t`;
    digest.update(String(tablename));
    digest.update(JSON.stringify(row.records));
  }
  return digest.digest("hex");
}
const snapshots: string[] = [];
const resultPath = join(
  evidenceDir,
  mode === "compare"
    ? "comparison-result.json"
    : mode === "record-reference"
      ? "reference-record-result.json"
      : mode === "compare-boundaries"
        ? "admin-boundary-comparison-result.json"
        : "private-comparison-result.json",
);
const resultIdentity = {
  runId: randomBytes(16).toString("hex"),
  startedAt: new Date().toISOString(),
  sourceDigest: source.digest,
  candidateSourceDigest: candidateSource.digest,
  runtime,
};
async function writeResult(result: Record<string, unknown>) {
  const temporary = resultPath + "." + resultIdentity.runId + ".tmp";
  try {
    await writeFile(
      temporary,
      JSON.stringify({ ...resultIdentity, ...result }, null, 2) + "\n",
      { mode: 0o600, flag: "wx" },
    );
    await rename(temporary, resultPath);
  } finally {
    await rm(temporary, { force: true });
  }
}
let completedResult: Record<string, unknown> = {};
await writeResult({ passed: false, status: "running" });
async function buildSnapshot(applicationRoot: string, label: string) {
  cancellation.signal.throwIfAborted();
  const ownedParent = await mkdtemp(join(tmpdir(), "uludott-reference-"));
  snapshots.push(ownedParent);
  await appendFile(
    join(evidenceDir, "owned-resources.jsonl"),
    JSON.stringify({ kind: "snapshot", path: ownedParent }) + "\n",
    { mode: 0o600 },
  );
  const app = join(ownedParent, "app");
  await copySourceSnapshot(applicationRoot, app);
  execFileSync("cp", [
    "-cR",
    join(applicationRoot, "node_modules"),
    join(app, "node_modules"),
  ]);
  await run(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    app,
    testEnv,
    label + "-build",
  );
  return app;
}
try {
  const application = await buildSnapshot(
    mode === "compare" ? root : sourceRoot,
    mode === "compare" ? "candidate" : "reference",
  );
  if (["compare-private", "compare-boundaries"].includes(mode!)) {
    const candidate = await buildSnapshot(root, "private-candidate");
    const local = await createTestDatabase();
    await appendFile(
      join(evidenceDir, "owned-resources.jsonl"),
      JSON.stringify({
        kind: "database",
        name: new URL(local.url).pathname.slice(1),
      }) + "\n",
      { mode: 0o600 },
    );
    let stop: (() => Promise<void>) | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      browser = await chromium.launch({
        channel: "chromium",
        headless: true,
        args: [...VISUAL_BROWSER_ARGS],
      });
      cancellation.signal.addEventListener(
        "abort",
        () => void browser?.close().catch(() => undefined),
        { once: true },
      );
      process.env.DATABASE_URL = local.url;
      await migrateEmptyDatabase();
      await seedVisualFixture(local.sql, "full");
      const prepared = await preparePrivateVisualScenes(local.sql);
      await closeDatabase();
      const env = { ...testEnv, DATABASE_URL: local.url };
      stop = await start(application, env);
      const reference =
        mode === "compare-private"
          ? await capturePrivateVisualScenes(browser, prepared, epoch)
          : new Map<string, Buffer>();
      for (const [alias, png] of await captureVisualAdminBoundaries(
        browser,
        local.sql,
        epoch,
      ))
        reference.set(alias, png);
      await stop();
      stop = undefined;
      stop = await start(candidate, env);
      const actual =
        mode === "compare-private"
          ? await capturePrivateVisualScenes(browser, prepared, epoch)
          : new Map<string, Buffer>();
      for (const [alias, png] of await captureVisualAdminBoundaries(
        browser,
        local.sql,
        epoch,
      ))
        actual.set(alias, png);
      if (
        JSON.stringify([...reference.keys()].sort()) !==
        JSON.stringify([...actual.keys()].sort())
      )
        throw Error("PRIVATE_CAPTURE_SET_MISMATCH");
      const results = [];
      for (const [alias, png] of reference) {
        const comparison = await comparePngPixels(png, actual.get(alias)!);
        results.push({ alias, ...comparison });
        if (!comparison.equal)
          throw Error(alias + ": PRIVATE_PIXEL_DIFFERENCE");
      }
      reference.clear();
      actual.clear();
      prepared.scenes.length = 0;
      completedResult = { persistedPrivatePngs: 0, results };
      console.log(
        "Private pixel comparisons completed; screenshot buffers released; no private PNGs persisted.",
      );
    } finally {
      try {
        await browser?.close();
        await stop?.();
      } finally {
        try {
          await closeDatabase();
        } finally {
          await local.cleanup();
          process.env.DATABASE_URL = databaseUrl;
        }
      }
    }
  } else {
    for (const profile of ["full", "static-approved", "empty"] as const) {
      cancellation.signal.throwIfAborted();
      const local = await createTestDatabase();
      await appendFile(
        join(evidenceDir, "owned-resources.jsonl"),
        JSON.stringify({
          kind: "database",
          name: new URL(local.url).pathname.slice(1),
        }) + "\n",
        { mode: 0o600 },
      );
      let stop: (() => Promise<void>) | undefined;
      try {
        process.env.DATABASE_URL = local.url;
        await migrateEmptyDatabase();
        const basicFixture = await seedVisualFixture(local.sql, profile);
        const fixture = {
          ...basicFixture,
          media:
            profile === "full" ? await seedVisualMediaFixture(local.sql) : null,
        };
        const fingerprint = await visualFixtureFingerprint(local);
        const baselineManifest = JSON.parse(
          await readFile(join(baselineDir, "manifest.json"), "utf8"),
        );
        if (mode === "record-reference") {
          baselineManifest.fixtureFingerprints ??= {};
          baselineManifest.fixtureFingerprints[profile] = fingerprint;
          await writeFile(
            join(baselineDir, "manifest.json"),
            JSON.stringify(baselineManifest, null, 2) + "\n",
          );
        } else if (
          baselineManifest.fixtureFingerprints?.[profile] !== fingerprint
        )
          throw Error("VISUAL_FIXTURE_DATA_MISMATCH");
        await closeDatabase();
        const env = { ...testEnv, DATABASE_URL: local.url };
        stop = await start(application, env);
        await run(
          process.execPath,
          [
            "node_modules/@playwright/test/cli.js",
            "test",
            "--config",
            "playwright.visual.config.ts",
          ],
          root,
          {
            ...env,
            ULUDOTT_VISUAL_RUN: mode,
            ULUDOTT_VISUAL_LEDGER: comparedLedger,
            ULUDOTT_VISUAL_BASELINE: baselineDir,
            ULUDOTT_VISUAL_FIXTURE: JSON.stringify(fixture),
            ULUDOTT_VISUAL_EPOCH: String(epoch),
          },
          profile + "-" + mode,
        );
        console.log(profile + ": " + mode + " passed");
      } finally {
        try {
          await stop?.();
        } finally {
          try {
            await closeDatabase();
          } finally {
            await local.cleanup();
            process.env.DATABASE_URL = databaseUrl;
          }
        }
      }
    }
  }
  await assertSourceUnchanged(sourceRoot, source);
  await assertSourceUnchanged(root, candidateSource);
  if (mode === "compare") {
    const seen = (await readFile(comparedLedger, "utf8"))
      .trim()
      .split("\n")
      .sort();
    const expected = Object.keys(
      manifest.captures as Record<string, unknown>,
    ).sort();
    if (JSON.stringify(seen) !== JSON.stringify(expected))
      throw Error("APPROVED_CAPTURE_SET_NOT_FULLY_COMPARED");
    completedResult = { pixelsDifferent: 0, captures: seen.length };
  }
} catch (error) {
  await writeResult({
    passed: false,
    status: cancellation.signal.aborted ? "interrupted" : "failed",
  });
  throw error;
} finally {
  for (const path of snapshots)
    await rm(path, { recursive: true, force: true });
  await assertSourceUnchanged(sourceRoot, source);
  await assertSourceUnchanged(root, candidateSource);
}
if (mode === "record-reference") {
  // Neither an incomplete profile nor a failed teardown can approve a record.
  manifest = JSON.parse(
    await readFile(join(baselineDir, "manifest.json"), "utf8"),
  );
  manifest.complete = true;
  await writeFile(
    join(baselineDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  completedResult = {
    captures: Object.keys(manifest.captures as Record<string, unknown>).length,
  };
}
await writeResult({ ...completedResult, passed: true, status: "completed" });
console.log(
  "Visual run passed; original and candidate sources unchanged; owned resources cleaned.",
);
