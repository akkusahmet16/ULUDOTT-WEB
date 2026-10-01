import "server-only";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDatabase } from "./client.ts";

export async function migrateEmptyDatabase(): Promise<void> {
  // Adı boş kurulum kabulünü anlatır; mevcut DB'yi silmez, pending migration'ları uygular.
  await migrate(getDatabase(), {
    migrationsFolder: fileURLToPath(
      new URL("../../db/migrations/", import.meta.url),
    ),
  });
}
