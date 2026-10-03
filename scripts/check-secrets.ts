import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const files = execFileSync("git", [
  "ls-files",
  "-z",
  "--cached",
  "--others",
  "--exclude-standard",
])
  .toString()
  .split("\0")
  .filter(Boolean);
const values = Object.entries(process.env)
  .filter(
    ([k, v]) =>
      /^(AUTH_ENCRYPTION_KEY|OBJECT_STORAGE_SECRET_KEY|LOCAL_POSTGRES_PASSWORD|TURNSTILE_SECRET_KEY|ORIGIN_SHARED_SECRET)$/.test(
        k,
      ) &&
      v &&
      v.length >= 16 &&
      !v.startsWith("replace-"),
  )
  .map(([, v]) => v!);
let hits = 0,
  forbidden = 0;
for (const file of new Set(files)) {
  const prohibited =
    file !== ".env.example" &&
    (/(^|\/)(Wallet secrets|Media)\//.test(file) ||
      /(^|\/)\.env(?:\.|$)|\.(pem|key|p12|pfx|pkpass)$/i.test(file));
  if (prohibited) {
    forbidden++;
    continue;
  }
  let content: Buffer;
  try {
    content = await readFile(file);
  } catch {
    continue;
  }
  if (
    values.some((v) => content.includes(Buffer.from(v))) ||
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/]{64}/.test(
      content.toString().replace(/\\+(?:n|r)/g, "\n"),
    )
  )
    hits++;
}
console.log(
  JSON.stringify({
    files: new Set(files).size,
    secretHits: hits,
    forbiddenFiles: forbidden,
  }),
);
if (hits || forbidden) process.exitCode = 1;
