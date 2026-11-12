import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema/index.ts";
import { loadServerConfig } from "../config/server.ts";

function buildPgClient(databaseUrl: string) {
  const isSupabase =
    databaseUrl.includes("supabase.co") || databaseUrl.includes("supabase.com");
  const isTransactionPooler = databaseUrl.includes(":6543");

  const sql = postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: isSupabase ? 15 : 5,
    prepare: isTransactionPooler ? false : true,
    ssl: isSupabase ? "require" : undefined,
    onnotice: () => {},
  });
  return { sql, db: drizzle(sql, { schema }) };
}

type Client = ReturnType<typeof buildPgClient>;
let client: Client | undefined;
let sozlukClient: Client | undefined;

export function getDatabase() {
  return (client ??= buildPgClient(loadServerConfig().databaseUrl)).db;
}

export function getSozlukDatabase() {
  const sozlukUrl =
    process.env.SOZLUK_DATABASE_URL?.trim() || loadServerConfig().databaseUrl;
  return (sozlukClient ??= buildPgClient(sozlukUrl)).db;
}

export async function closeDatabase() {
  const current = client;
  client = undefined;
  if (current) await current.sql.end({ timeout: 5 });
  const currentSozluk = sozlukClient;
  sozlukClient = undefined;
  if (currentSozluk) await currentSozluk.sql.end({ timeout: 5 });
}

export type Database = ReturnType<typeof getDatabase>;
