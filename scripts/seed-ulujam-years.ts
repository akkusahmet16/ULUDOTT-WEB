import { getDatabase, closeDatabase } from "../src/lib/database/client.ts";
import { seed2026Results } from "../src/db/seeds/2026-results.ts";
import { seedUlujamComingSoon } from "../src/db/seeds/ulujam-coming-soon.ts";
try {
  await seed2026Results(getDatabase());
  await seedUlujamComingSoon(getDatabase());
  console.log(
    "2026 sonuçları ve 2027 tarihsiz taslağı hazır; kişi/takım oluşturulmadı.",
  );
} catch {
  console.error(
    "UluJam yıl seed başarısız; çakışan yıl/etkinlik kayıtlarını kontrol edin.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
