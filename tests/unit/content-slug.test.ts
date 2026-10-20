import { it, expect } from "vitest";
import {
  slugifyContentTitle,
  slugSchema,
} from "../../src/modules/publication/domain";
it("Türkçe duyuru başlıkları ve kesme sınırındaki boşluk geçerli adres oluşturur", () => {
  expect(slugifyContentTitle("UluJam Öğrenci Buluşması")).toBe(
    "ulujam-ogrenci-bulusmasi",
  );
  const slug = slugifyContentTitle("a".repeat(99) + " b");
  expect(slugSchema.safeParse(slug).success).toBe(true);
  expect(slug.length).toBeLessThanOrEqual(100);
});
