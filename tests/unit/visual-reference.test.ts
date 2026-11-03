import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  assertSourceUnchanged,
  copySourceSnapshot,
  createSourceManifest,
} from "../helpers/visual-reference.ts";

let temporaryRoot: string;
let source: string;
let destination: string;
const requiredRootFiles = [
  ".node-version",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "next.config.ts",
  "tsconfig.json",
  "next-env.d.ts",
  "eslint.config.mjs",
  "drizzle.config.ts",
  "playwright.config.ts",
  "vitest.config.ts",
  "vitest.load.config.ts",
];
async function fixtureFile(path: string, data: string | Buffer) {
  const target = join(source, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
}
beforeEach(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "uludott-reference-unit-"));
  source = join(temporaryRoot, "source");
  destination = join(temporaryRoot, "snapshot");
  await mkdir(source);
  for (const directory of ["src", "public", "scripts", "tests"])
    await mkdir(join(source, directory));
  for (const file of requiredRootFiles) await fixtureFile(file, "{}\n");
  await fixtureFile("src/app/page.tsx", "initial");
  await fixtureFile("public/afiş.webp", Buffer.from([0, 127, 255, 1]));
  await fixtureFile("scripts/check.ts", "export {};\n");
  await fixtureFile("tests/example.test.ts", "export {};\n");
});
afterEach(async () => {
  await rm(temporaryRoot, { recursive: true, force: true });
});

// Missing files, hashes or stable ordering would make source provenance ambiguous.
it("records exact bytes and file modes in a sorted, repeatable source manifest", async () => {
  await chmod(join(source, "src/app/page.tsx"), 0o640);
  const manifest = await createSourceManifest(source);
  expect(manifest.sourceRoot).toBe(await realpath(source));
  expect(manifest.version).toBe(1);
  expect(manifest.files.map((file) => file.path)).toEqual(
    [
      ...requiredRootFiles,
      "src/app/page.tsx",
      "public/afiş.webp",
      "scripts/check.ts",
      "tests/example.test.ts",
    ].sort(),
  );
  expect(
    manifest.files.find((file) => file.path === "src/app/page.tsx"),
  ).toEqual({
    path: "src/app/page.tsx",
    bytes: 7,
    mode: 0o640,
    sha256: createHash("sha256").update("initial").digest("hex"),
  });
  expect(manifest.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(await createSourceManifest(source)).toEqual(manifest);
});

// A hardlink or accidental write to the source would damage the user's reference.
it("copies independent files into a new owned directory and preserves the original", async () => {
  await chmod(join(source, "scripts/check.ts"), 0o750);
  const before = await createSourceManifest(source);
  const manifest = await copySourceSnapshot(source, destination);
  expect(manifest).toEqual(before);
  expect(await readFile(join(destination, "public/afiş.webp"))).toEqual(
    Buffer.from([0, 127, 255, 1]),
  );
  expect(
    (await lstat(join(destination, "scripts/check.ts"))).mode & 0o777,
  ).toBe(0o750);
  expect((await lstat(join(destination, "src/app/page.tsx"))).ino).not.toBe(
    (await lstat(join(source, "src/app/page.tsx"))).ino,
  );
  await expect(assertSourceUnchanged(source, before)).resolves.toBeUndefined();
  await expect(
    assertSourceUnchanged(destination, before),
  ).resolves.toBeUndefined();
  await writeFile(join(destination, "src/app/page.tsx"), "changed");
  expect(await readFile(join(source, "src/app/page.tsx"), "utf8")).toBe(
    "initial",
  );
  await expect(assertSourceUnchanged(destination, before)).rejects.toThrow(
    /changed/i,
  );
});

// Size-only verification would miss a same-length source edit.
it("detects changed source bytes even when the file size stays the same", async () => {
  const manifest = await createSourceManifest(source);
  await fixtureFile("src/app/page.tsx", "changed");
  await expect(assertSourceUnchanged(source, manifest)).rejects.toThrow(
    /changed/i,
  );
});

// An exact snapshot must detect new inputs, removed inputs and changed executable modes.
it.each(["added", "removed", "mode"] as const)(
  "detects a source input that is %s",
  async (change) => {
    const manifest = await createSourceManifest(source);
    if (change === "added") await fixtureFile("src/added.ts", "export {};\n");
    if (change === "removed") await rm(join(source, "src/app/page.tsx"));
    if (change === "mode") await chmod(join(source, "src/app/page.tsx"), 0o700);
    await expect(assertSourceUnchanged(source, manifest)).rejects.toThrow(
      /changed/i,
    );
  },
);

// Secrets and generated files must never enter the reference bundle.
it("keeps generated cinematic baselines outside application-source identity", async () => {
  const before = await createSourceManifest(source);
  await fixtureFile(
    "tests/e2e/__baseline-cinematic__/v0.1/manifest.json",
    "{}",
  );
  await fixtureFile(
    "tests/e2e/__baseline-cinematic__/v0.1/example.png",
    Buffer.from([1, 2, 3]),
  );
  await expect(assertSourceUnchanged(source, before)).resolves.toBeUndefined();
  await copySourceSnapshot(source, destination);
  await expect(
    lstat(join(destination, "tests/e2e/__baseline-cinematic__")),
  ).rejects.toMatchObject({ code: "ENOENT" });
});

it("excludes environment, private and generated inputs while retaining private route source", async () => {
  for (const file of [
    ".env.local",
    ".git/config",
    ".next/server.js",
    ".local/data",
    "README.md",
    "src/.DS_Store",
    "src/.env.production",
    "src/.git/config",
    "src/.next/cache",
    "src/.local/data",
    "src/private/test.txt",
    "src/Wallet secrets/wallet.json",
    "src/credentials/service.json",
    "public/test.pem",
    "public/signing.key",
    "public/pass.p12",
    "public/pass.pfx",
    "public/card.pkpass",
    "tests/node_modules/package/index.js",
  ])
    await fixtureFile(file, "synthetic excluded fixture");
  await fixtureFile("src/app/(private)/kart/page.tsx", "export {};\n");
  await fixtureFile("scripts/check-secrets.ts", "export {};\n");
  const manifest = await copySourceSnapshot(source, destination);
  expect(manifest.files).toHaveLength(requiredRootFiles.length + 6);
  expect(manifest.files.map((file) => file.path)).toContain(
    "src/app/(private)/kart/page.tsx",
  );
  expect(manifest.files.map((file) => file.path)).toContain(
    "scripts/check-secrets.ts",
  );
  for (const file of [
    ".env.local",
    "src/.env.production",
    "public/test.pem",
    "src/private/test.txt",
  ])
    await expect(lstat(join(destination, file))).rejects.toMatchObject({
      code: "ENOENT",
    });
});

// Following either a directory or file symlink can import private data from elsewhere.
it.each(["file", "directory", "root"] as const)(
  "rejects a source %s symlink",
  async (kind) => {
    if (kind === "file")
      await symlink(
        join(temporaryRoot, "outside.txt"),
        join(source, "src/linked.ts"),
      );
    if (kind === "directory")
      await symlink(temporaryRoot, join(source, "public/linked"));
    if (kind === "root") {
      const alias = join(temporaryRoot, "source-alias");
      await symlink(source, alias);
      source = alias;
    }
    await expect(copySourceSnapshot(source, destination)).rejects.toThrow(
      /symlink/i,
    );
    await expect(lstat(destination)).rejects.toMatchObject({ code: "ENOENT" });
  },
);

// Overlapping destinations could overwrite reference source or recurse into themselves.
it("rejects identical, nested, ancestral and relative destinations without touching the source", async () => {
  const before = await createSourceManifest(source);
  for (const unsafe of [
    source,
    join(source, "snapshot"),
    temporaryRoot,
    "relative-snapshot",
  ])
    await expect(copySourceSnapshot(source, unsafe)).rejects.toThrow(
      /destination|absolute|overlap/i,
    );
  await expect(assertSourceUnchanged(source, before)).resolves.toBeUndefined();
});

it("rejects a destination that enters the source through a parent symlink", async () => {
  const alias = join(temporaryRoot, "source-alias");
  await symlink(source, alias);
  await expect(
    copySourceSnapshot(source, join(alias, "snapshot")),
  ).rejects.toThrow(/destination|overlap/i);
  await expect(lstat(join(source, "snapshot"))).rejects.toMatchObject({
    code: "ENOENT",
  });
});

// Refusing even an empty existing output prevents cleanup from claiming another folder.
it("never overwrites or removes an existing destination", async () => {
  await mkdir(destination);
  await writeFile(join(destination, "owner.txt"), "existing owner");
  await expect(copySourceSnapshot(source, destination)).rejects.toThrow(
    /destination|exist/i,
  );
  expect(await readFile(join(destination, "owner.txt"), "utf8")).toBe(
    "existing owner",
  );
});

it.each(["package.json", "src", "public", "scripts", "tests"])(
  "rejects missing required input %s before creating output",
  async (missing) => {
    await rm(join(source, missing), { recursive: true });
    await expect(copySourceSnapshot(source, destination)).rejects.toThrow(
      /required|missing/i,
    );
    await expect(lstat(destination)).rejects.toMatchObject({ code: "ENOENT" });
  },
);
