import { spawn, execFileSync, execFile } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { createServer } from "node:net";
import { createTestDatabase } from "./local-database.ts";

export default async function visualSetup() {
  const local = await createTestDatabase();
  let server: ReturnType<typeof spawn> | undefined;
  let stopped: Promise<void> | undefined;
  mkdirSync(".local", { recursive: true });
  const log = createWriteStream(".local/faz1-visual-server.log");
  const cleanup = async () => {
    // Yalnız bu closure'ın başlattığı PID ağacı ve UUID DB temizlenir.
    if (server?.pid && server.exitCode === null && server.signalCode === null) {
      if (process.platform === "win32") await promisify(execFile)("taskkill", ["/pid", String(server.pid), "/t", "/f"]);
      else { try { process.kill(-server.pid, "SIGTERM"); } catch { /* Zaten sonlanmış olabilir. */ } }
      let timer: ReturnType<typeof setTimeout> | undefined;
      try { await Promise.race([stopped, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error("Görsel sunucu sonlandırılamadı")), 10_000); })]); }
      finally { clearTimeout(timer); }
    }
    log.end();
    await local.cleanup();
  };
  try {
    // Başka sunucunun HTTP 200 yanıtı fixture hazır sanılmamalıdır.
    const port = createServer();
    await new Promise<void>((resolve, reject) => { port.once("error", reject); port.listen(3200, "127.0.0.1", () => port.close(error => error ? reject(error) : resolve())); });
    const env = { ...process.env, DATABASE_URL: local.url, APP_URL: "http://127.0.0.1:3200", NODE_ENV: "development" as const };
    execFileSync(process.execPath, ["--conditions=react-server", "scripts/migrate.ts"], { env, stdio: "inherit", timeout: 60_000 });
    const tables = await local.sql`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'`;
    if (tables.length !== 42) throw Error("Görsel fixture şema tabanı değişti; inceleme gerekli");
    for (const table of tables) {
      const [row] = await local.sql`select count(*)::int as count from ${local.sql(table.table_name)}`;
      if (row.count !== 0) throw Error("Görsel fixture yalnız boş DB kullanabilir");
    }
    server = spawn(process.execPath, [join(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3200"], { env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let spawnError: Error | undefined;
    stopped = new Promise<void>(resolve => { server?.once("close", () => resolve()); server?.once("error", error => { spawnError = error; resolve(); }); });
    let ready = false;
    server.stdout?.on("data", (chunk: Buffer) => { if (/Ready in/.test(chunk.toString())) ready = true; });
    server.stdout?.pipe(log, { end: false });
    server.stderr?.pipe(log, { end: false });
    const deadline = Date.now() + 90_000;
    while (true) {
      try { if (ready && server.exitCode === null && (await fetch(env.APP_URL, { signal: AbortSignal.timeout(3000) })).ok) break; } catch { /* İlk derleme beklenir. */ }
      if (spawnError || Date.now() > deadline || server.exitCode !== null) throw Error("Görsel sunucu hazır olmadı; .local/faz1-visual-server.log");
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return cleanup;
  } catch (error) {
    await cleanup();
    throw error;
  }
}
