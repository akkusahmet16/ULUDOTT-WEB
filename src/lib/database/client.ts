import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema/index.ts";
import { loadServerConfig } from "../config/server.ts";

function createClient() {
  const sql = postgres(loadServerConfig().databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 5,
    onnotice: () => {},
  });
  return { sql, db: drizzle(sql, { schema }) };
}
type Client = ReturnType<typeof createClient>;
let client: Client | undefined;
export function getDatabase() {
  return (client ??= createClient()).db;
}
export async function closeDatabase() {
  const current = client;
  client = undefined;
  if (current) await current.sql.end({ timeout: 5 });
}
export type Database = ReturnType<typeof getDatabase>;
