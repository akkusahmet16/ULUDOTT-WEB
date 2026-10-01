import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import postgres from "postgres";

export async function createTestDatabase() {
  loadEnvFile(".env.local");
  const url = new URL(process.env.DATABASE_URL!);
  if (!["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error("DB testleri yalnızca yerel servis üzerinde çalışır.");
  const admin = postgres(url.toString(), { max: 1, onnotice: () => {} });
  const name = `uludott_test_${randomUUID().replaceAll("-", "")}`;
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
  return {
    url: url.toString(),
    sql,
    async cleanup() {
      await sql.end();
      await admin.unsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
      await admin.end();
    },
  };
}
