import "server-only";
import { getDatabase, type Database } from "./client.ts";
export type DbTx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export async function withTransaction<T>(
  work: (tx: DbTx) => Promise<T>,
): Promise<T> {
  return getDatabase().transaction(work);
}
