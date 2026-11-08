import { syncSksMembers } from "../src/modules/community/application/sks-sync.ts";
import { closeDatabase } from "../src/lib/database/client.ts";

try {
  console.log("BUÜ SKS Topluluk Üye Listesi senkronizasyonu başlatılıyor...");
  const res = await syncSksMembers();
  console.log(
    `Senkronizasyon tamamlandı (${res.source === "live" ? "Canlı SKS bağlantısı" : "Yerel snapshot yedeği"}): ${res.totalParsed} üye bulundu, ${res.insertedOrUpdated} kayıt güncellendi/eklendi.`,
  );
} catch (error) {
  console.error("SKS Senkronizasyonu başarısız:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
