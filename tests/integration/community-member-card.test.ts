import { describe, expect, it } from "vitest";
import { createTestDatabase } from "../helpers/local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { googleProtocol } from "../helpers/google-protocol.ts";
import {
  verifyAndGrantMemberCard,
  getMemberCardByToken,
} from "../../src/modules/community/application/community-service.ts";
import { requestCommunityGooglePass } from "../../src/modules/wallet/application/google-service.ts";

describe("Topluluk Üye Kartı Entegrasyon Testi", () => {
  it("Üye doğrulama, token üretimi ve Google Wallet save bağlantısı akışı", async () => {
    const proto = await googleProtocol();
    const local = await createTestDatabase();
    process.env.DATABASE_URL = local.url;
    await migrateEmptyDatabase();

    try {
      // Test üyesi ekle
      await local.sql`insert into community_members(full_name, normalized_name, email, faculty_department, registration_date, period, role, status)
        values('AHMET AKKUŞ', 'ahmet akkus', 'a.ak16@hotmail.com', 'Eğitim Fakültesi', '17.06.2026', '2026 - 2027', 'member', 'active')`;

      // 1. Olmayan e-posta sorgusu
      const failRes = await verifyAndGrantMemberCard({
        fullName: "Bilinmeyen Kişi",
        email: "olmayan@uludag.edu.tr",
      });
      expect(failRes).toEqual({
        success: false,
        error: "MEMBER_NOT_FOUND",
      });

      // 1b. Yanlış isim sorgusu
      const wrongNameRes = await verifyAndGrantMemberCard({
        fullName: "Farklı Kişi",
        email: "a.ak16@hotmail.com",
      });
      expect(wrongNameRes).toEqual({
        success: false,
        error: "MEMBER_NOT_FOUND",
      });

      // 2. Başarılı sorgu (Türkçe karakter ve harf büyüklüğü toleranslı)
      const successRes = await verifyAndGrantMemberCard({
        fullName: "Ahmet Akkuş",
        email: "a.ak16@hotmail.com",
      });
      expect(successRes.success).toBe(true);
      if (!successRes.success) return;

      expect(successRes.grantToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(successRes.member.fullName).toBe("AHMET AKKUŞ");

      // 3. Token ile kart okuma
      const grant = await getMemberCardByToken(successRes.grantToken);
      expect(grant.member.fullName).toBe("AHMET AKKUŞ");
      expect(grant.member.email).toBe("a.ak16@hotmail.com");
      expect(grant.member.status).toBe("active");

      // 4. Google Wallet bağlantısı üretimi
      const walletRes = await requestCommunityGooglePass(successRes.grantToken);
      expect(walletRes.url).toMatch(/^https:\/\/pay\.google\.com\/gp\/v\/save\//);

      // 5. Geçersiz token
      await expect(
        getMemberCardByToken("a".repeat(43)),
      ).rejects.toThrow("Kart bulunamadı");
    } finally {
      await local.cleanup();
      await proto.cleanup();
    }
  });
});
