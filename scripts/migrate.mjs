import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const folder = fileURLToPath(new URL("../src/db/migrations/", import.meta.url));
if (!existsSync(folder)) {
  console.error("Migration dosyaları henüz yok: Görev 2 tamamlanmadan db:migrate çalışamaz.");
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error("Eksik sunucu yapılandırması: DATABASE_URL.");
  process.exitCode = 1;
} else {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: folder });
    console.log("Migration tamamlandı; seed çalıştırılmadı.");
  } catch {
    console.error("Migration başarısız. Bağlantı ve migration durumunu kontrol edin; ham hata sır içerebileceğinden gösterilmedi.");
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}
