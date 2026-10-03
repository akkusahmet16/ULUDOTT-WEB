import { readdir, readFile, lstat } from "node:fs/promises";
import { join } from "node:path";
import { googleReadiness, loadGoogleConfig } from "../src/lib/config/wallet.ts";
const sensitive: string[] = [];
if (googleReadiness() !== "unconfigured") {
  const c = loadGoogleConfig();
  sensitive.push(c.privateKey, c.privateKey.split("\n")[1], c.clientEmail);
}
let files = 0,
  hits = 0;
async function scan(dir: string) {
  for (const name of await readdir(dir)) {
    const path = join(dir, name),
      stat = await lstat(path);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) await scan(path);
    else if (stat.isFile()) {
      files++;
      const bytes = await readFile(path);
      if (
        sensitive.some(
          (v) => v.length > 10 && bytes.includes(Buffer.from(v)),
        ) ||
        /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\\n]+[A-Za-z0-9+/]{64}/.test(
          bytes.toString(),
        )
      )
        hits++;
    }
  }
}
await scan(".next/static");
await scan(".next/standalone");
console.log(JSON.stringify({ files, secretHits: hits }));
if (hits) process.exitCode = 1;
