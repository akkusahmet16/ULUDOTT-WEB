import { migrateEmptyDatabase } from "../src/lib/database/migrate.ts";
import { closeDatabase } from "../src/lib/database/client.ts";
try {
  await migrateEmptyDatabase();
  console.log("Migration tamamlandı; seed çalıştırılmadı.");
} catch {
  console.error(
    "Migration başarısız. Yapılandırma, bağlantı ve migration durumunu kontrol edin; ham hata sır içerebileceğinden gösterilmedi.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
