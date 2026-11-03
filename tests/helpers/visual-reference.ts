import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

// Include the working files, including uncommitted inputs, rather than Git HEAD.
const sourceDirectories = ["src", "public", "scripts", "tests"] as const;
const rootFiles = [
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
] as const;
const excludedNames = new Set([
  ".DS_Store",
  ".git",
  ".next",
  ".local",
  ".superpowers",
  ".worktrees",
  "node_modules",
  // Generated visual evidence is an output, never an application build input.
  "__baseline-cinematic__",
]);
const excludedPatterns = [
  /^\.env/,
  /^(private|secrets?|credentials?|wallet[ -]secrets?)$/i,
  /\.(pem|key|p8|p12|pfx|pkpass|jwk)$/i,
  /(?:^|[._-])(credentials?|secrets?|service[._-]?account)\.json$/i,
];
const exclusions = [...excludedNames, ...excludedPatterns.map(String)];

export interface SourceFileRecord {
  path: string;
  bytes: number;
  mode: number;
  sha256: string;
}
export interface SourceManifest {
  version: 1;
  sourceRoot: string;
  inputs: { directories: string[]; rootFiles: string[] };
  exclusions: string[];
  files: SourceFileRecord[];
  digest: string;
}

function excluded(name: string) {
  return (
    excludedNames.has(name) ||
    excludedPatterns.some((pattern) => pattern.test(name))
  );
}
function digestManifest(
  manifest: Omit<SourceManifest, "sourceRoot" | "digest">,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: manifest.version,
        inputs: manifest.inputs,
        exclusions: manifest.exclusions,
        files: manifest.files,
      }),
    )
    .digest("hex");
}
function absolute(path: string, name: string) {
  if (!isAbsolute(path)) throw Error(`${name} must be an absolute path.`);
  return resolve(path);
}
async function requiredStat(path: string, displayPath: string) {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw Error(`Missing required source input: ${displayPath}.`);
    throw error;
  }
}
async function sourceDirectory(path: string, displayPath: string) {
  const metadata = await requiredStat(path, displayPath);
  if (metadata.isSymbolicLink())
    throw Error(`Source symlinks are not allowed: ${displayPath}.`);
  if (!metadata.isDirectory())
    throw Error(
      `Required source directory is not a directory: ${displayPath}.`,
    );
  return realpath(path);
}
async function sourceFile(path: string, displayPath: string) {
  const metadata = await requiredStat(path, displayPath);
  if (metadata.isSymbolicLink())
    throw Error(`Source symlinks are not allowed: ${displayPath}.`);
  if (!metadata.isFile())
    throw Error(`Required source file is not a regular file: ${displayPath}.`);
  // Do not follow a file replaced by a symlink between inspection and reading.
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const current = await handle.stat();
    if (!current.isFile())
      throw Error(`Source input is not a regular file: ${displayPath}.`);
    const data = await handle.readFile();
    return {
      data,
      record: {
        path: displayPath,
        bytes: data.length,
        mode: current.mode & 0o7777,
        sha256: createHash("sha256").update(data).digest("hex"),
      },
    };
  } finally {
    await handle.close();
  }
}

/** Hash only the explicit source/build inputs; this never loads environment files. */
export async function createSourceManifest(
  sourceRoot: string,
): Promise<SourceManifest> {
  const root = await sourceDirectory(
    absolute(sourceRoot, "Source root"),
    "root",
  );
  const files: SourceFileRecord[] = [];
  async function walk(directory: string) {
    await sourceDirectory(join(root, directory), directory);
    for (const name of (await readdir(join(root, directory))).sort()) {
      if (excluded(name)) continue;
      const path = `${directory}/${name}`;
      const metadata = await requiredStat(join(root, path), path);
      if (metadata.isSymbolicLink())
        throw Error(`Source symlinks are not allowed: ${path}.`);
      if (metadata.isDirectory()) await walk(path);
      else files.push((await sourceFile(join(root, path), path)).record);
    }
  }
  for (const directory of sourceDirectories) await walk(directory);
  for (const path of rootFiles)
    files.push((await sourceFile(join(root, path), path)).record);
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const content = {
    version: 1 as const,
    inputs: { directories: [...sourceDirectories], rootFiles: [...rootFiles] },
    exclusions: [...exclusions],
    files,
  };
  return { ...content, sourceRoot: root, digest: digestManifest(content) };
}

/** Also verifies snapshots: sourceRoot is provenance, not part of the digest. */
export async function assertSourceUnchanged(
  root: string,
  manifest: SourceManifest,
): Promise<void> {
  if (digestManifest(manifest) !== manifest.digest)
    throw Error("Invalid source manifest digest.");
  if ((await createSourceManifest(root)).digest !== manifest.digest)
    throw Error("Source inputs changed from the recorded manifest.");
}

function overlaps(first: string, second: string) {
  const path = relative(first, second);
  return (
    path === "" ||
    (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`))
  );
}

/**
 * Creates and owns an absent destination, verifies its copy, then verifies the
 * original again. Dependencies are deliberately a separate clone/copy step.
 */
export async function copySourceSnapshot(
  sourceRoot: string,
  destinationRoot: string,
): Promise<SourceManifest> {
  const source = await sourceDirectory(
    absolute(sourceRoot, "Source root"),
    "root",
  );
  const requestedDestination = absolute(destinationRoot, "Destination root");
  const destinationParent = await realpath(dirname(requestedDestination));
  const destination = join(destinationParent, basename(requestedDestination));
  if (overlaps(source, destination) || overlaps(destination, source))
    throw Error("Destination must not overlap the source root.");
  try {
    await lstat(destination);
    throw Error("Destination already exists; refusing to overwrite it.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const manifest = await createSourceManifest(sourceRoot);
  let owned = false;
  try {
    await mkdir(destination, { mode: 0o700 });
    owned = true;
    for (const directory of sourceDirectories)
      await mkdir(join(destination, directory), { mode: 0o700 });
    for (const expected of manifest.files) {
      const { data, record } = await sourceFile(
        join(source, expected.path),
        expected.path,
      );
      if (JSON.stringify(record) !== JSON.stringify(expected))
        throw Error("Source inputs changed while copying the snapshot.");
      const target = join(destination, expected.path);
      await mkdir(dirname(target), { recursive: true, mode: 0o700 });
      await writeFile(target, data, { flag: "wx", mode: expected.mode });
      await chmod(target, expected.mode);
    }
    await assertSourceUnchanged(destination, manifest);
    await assertSourceUnchanged(sourceRoot, manifest);
    return manifest;
  } catch (error) {
    if (owned) await rm(destination, { recursive: true, force: true });
    throw error;
  }
}
