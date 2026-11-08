import { describe, expect, it } from "vitest";
import {
  normalizeMemberName,
} from "../../src/modules/community/application/sks-sync.ts";
import {
  verifyMemberInputSchema,
} from "../../src/modules/community/application/community-service.ts";
import {
  buildCommunityClass,
  buildCommunityObject,
  googleCommunityClassId,
  googleCommunityObjectId,
} from "../../src/modules/wallet/google/google-pass.ts";

describe("Topluluk Üye Kartı (Community Pass) Birim Testleri", () => {
  it("normalizeMemberName Türkçe karakterleri ve boşlukları doğru normalleştirir", () => {
    expect(normalizeMemberName("AHMET AKKUŞ")).toBe("ahmet akkus");
    expect(normalizeMemberName("  Şeyma   ÖZTÜRK  ")).toBe("seyma ozturk");
    expect(normalizeMemberName("İSMAİL ÇAĞLAR")).toBe("ismail caglar");
  });

  it("verifyMemberInputSchema geçerli ve geçersiz girdileri doğrular", () => {
    const valid = verifyMemberInputSchema.safeParse({
      fullName: "Ahmet Akkuş",
      email: "ahmet@example.com",
    });
    expect(valid.success).toBe(true);

    const invalidEmail = verifyMemberInputSchema.safeParse({
      fullName: "Ahmet Akkuş",
      email: "not-an-email",
    });
    expect(invalidEmail.success).toBe(false);

    const emptyName = verifyMemberInputSchema.safeParse({
      fullName: " ",
      email: "ahmet@example.com",
    });
    expect(emptyName.success).toBe(false);
  });

  it("Google Wallet Community Pass şablonunda barkod/QR bulunmadığını ve tasarım metinlerini doğrular", () => {
    const classId = googleCommunityClassId("3388000000023208403");
    expect(classId).toBe("3388000000023208403.uludott_community_pass");

    const classDef = buildCommunityClass(
      "3388000000023208403",
      "https://uludott.com",
    );
    expect(classDef).toMatchObject({
      id: classId,
      genericType: "GENERIC_OTHER",
      hexBackgroundColor: "#19202B",
      header: { defaultValue: { value: "COMMUNITY PASS" } },
    });
    // Kesin kural: Üye kartında QR kod/barkod yer almayacak
    expect((classDef as { barcode?: unknown }).barcode).toBeUndefined();

    const objectId = googleCommunityObjectId("3388000000023208403", "grant_test_123");
    const objectDef = buildCommunityObject(
      "3388000000023208403",
      "https://uludott.com",
      "grant_test_123",
    );

    expect(objectDef).toMatchObject({
      id: objectId,
      classId,
      state: "ACTIVE",
      hexBackgroundColor: "#19202B",
      header: { defaultValue: { value: "COMMUNITY PASS" } },
      textModulesData: expect.arrayContaining([
        expect.objectContaining({
          id: "motto",
          body: "Sadece bir kart değil, ortak deneyim bileti",
        }),
      ]),
    });
    expect((objectDef as { barcode?: unknown }).barcode).toBeUndefined();
  });
});
