import { getDatabase, closeDatabase } from "../src/lib/database/client.ts";
import { seed2026Results } from "../src/db/seeds/2026-results.ts";
try {
  await seed2026Results(getDatabase());
  console.log(
    "2026 editoryal derece bağlantıları yüklendi; kişi/takım oluşturulmadı.",
  );
} catch {
  console.error(
    "2026 seed başarısız. Şema, bağlantı ve çakışan editoryal kayıtları kontrol edin; mevcut içerik ezilmedi.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
