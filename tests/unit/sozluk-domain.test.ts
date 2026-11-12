import { describe, expect, it } from "vitest";
import {
  normalizeSozlukNick,
  normalizeSozlukTitle,
  toSozlukSlug,
} from "../../src/modules/sozluk/domain/slug.ts";
import {
  extractBkzTargets,
  parseSozlukMarkup,
} from "../../src/modules/sozluk/domain/markup.ts";
import {
  authorRegisterSchema,
  createTopicSchema,
  voteEntrySchema,
} from "../../src/modules/sozluk/domain/validation.ts";

describe("Ulusözlük domain — slug ve normalizasyon", () => {
  it("Türkçe karakterleri tutarlı biçimde normalize eder ve slug üretir", () => {
    expect(normalizeSozlukTitle("  Ulujam   2026  İncelemesi ")).toBe(
      "ulujam 2026 incelemesi",
    );
    expect(normalizeSozlukNick("  Çağrı_Dev ")).toBe("çağrı_dev");
    expect(toSozlukSlug("Uludağ Üniversitesi Şenlikleri")).toBe(
      "uludag-universitesi-senlikleri",
    );
    expect(toSozlukSlug("C# / Unity İpuçları!")).toBe("c-unity-ipuclari");
  });
});

describe("Ulusözlük domain — güvenli bkz ve link ayrıştırıcı", () => {
  it("bkz, gizli bkz, güvenli link ve @yazar ifadelerini doğru tokenlara ayırır", () => {
    const input =
      "bkz (bkz: ulujam 2026), ayrıca `oyun tasarımı` ve [https://uludott.org topluluk] @yazar_1";
    const tokens = parseSozlukMarkup(input);

    expect(tokens).toEqual([
      { type: "text", value: "bkz " },
      { type: "bkz", target: "ulujam 2026", slug: "ulujam-2026" },
      { type: "text", value: ", ayrıca " },
      { type: "hidden_bkz", target: "oyun tasarımı", slug: "oyun-tasarimi" },
      { type: "text", value: " ve " },
      { type: "link", url: "https://uludott.org", label: "topluluk" },
      { type: "text", value: " " },
      { type: "mention", nick: "yazar_1" },
    ]);
    expect(extractBkzTargets(input)).toEqual(["ulujam 2026", "oyun tasarımı"]);
  });

  it("javascript: veya geçersiz protokolleri link olarak kabul etmez", () => {
    const tokens = parseSozlukMarkup("[javascript:alert(1) tıkla]");
    expect(tokens).toEqual([
      { type: "text", value: "[javascript:alert(1) tıkla]" },
    ]);
  });
});

describe("Ulusözlük domain — Zod doğrulama şemaları", () => {
  it("geçerli ve geçersiz yazar, başlık ve oy verilerini ayırt eder", () => {
    expect(
      authorRegisterSchema.safeParse({
        nick: "uludott_yazar",
        email: "yazar@uludott.org",
        password: "guclu-parola-123",
      }).success,
    ).toBe(true);

    expect(
      authorRegisterSchema.safeParse({
        nick: "a",
        email: "bozuk",
        password: "123",
      }).success,
    ).toBe(false);

    expect(
      createTopicSchema.safeParse({
        title: "ulujam 2026",
        content: "harika bir game jam deneyimiydi.",
      }).success,
    ).toBe(true);

    expect(voteEntrySchema.safeParse({ value: 1 }).success).toBe(true);
    expect(voteEntrySchema.safeParse({ value: 0 }).success).toBe(true);
    expect(voteEntrySchema.safeParse({ value: 2 }).success).toBe(false);
  });
});
