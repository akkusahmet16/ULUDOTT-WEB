import { describe, expect, it } from "vitest";
import { THEME_REGISTRY } from "../../src/config/theme.config.ts";
import {
  ADMIN_LOCALE,
  APP_TIME_ZONE,
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_TAGS,
  LOCALE_URL_POLICY,
  LOCALES,
  resolveLocale,
} from "../../src/i18n/config.ts";
import { enDictionary } from "../../src/i18n/dictionaries/en.ts";
import { trDictionary } from "../../src/i18n/dictionaries/tr.ts";
import {
  extractLeafKeys,
  extractPlaceholders,
  isDictionaryKey,
  PUBLIC_DICTIONARY_KEYS,
  type DictionaryKey,
} from "../../src/i18n/keys.ts";
import { getDictionary, getTranslator } from "../../src/i18n/translate.ts";

describe("Faz 2 / İş 2A — Erken i18n çekirdeği", () => {
  it("desteklenen dilleri, varsayılan TR dilini ve cookie tabanlı URL politikasını tanımlar", () => {
    expect(LOCALES).toEqual(["tr", "en"]);
    expect(DEFAULT_LOCALE).toBe("tr");
    expect(ADMIN_LOCALE).toBe("tr");
    expect(APP_TIME_ZONE).toBe("Europe/Istanbul");
    expect(LOCALE_TAGS).toEqual({ tr: "tr-TR", en: "en-GB" });
    expect(LOCALE_URL_POLICY).toEqual({
      strategy: "cookie-only",
      prefixLocaleInPath: false,
      generateHreflangAlternates: false,
    });

    expect(isLocale("tr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);

    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("tr")).toBe("tr");
    expect(resolveLocale("fr")).toBe("tr");
    expect(resolveLocale(undefined)).toBe("tr");
  });

  it("TR ve EN sözlük yaprak anahtarlarının ve yer tutucularının (%100 eşlik) bire bir örtüştüğünü doğrular", () => {
    const trKeys = extractLeafKeys(trDictionary);
    const enKeys = extractLeafKeys(enDictionary);

    expect(trKeys.length).toBeGreaterThan(25);
    expect(enKeys).toEqual(trKeys);
    expect(PUBLIC_DICTIONARY_KEYS).toEqual(trKeys);

    const tTr = getTranslator("tr");
    const tEn = getTranslator("en");

    for (const key of PUBLIC_DICTIONARY_KEYS) {
      expect(isDictionaryKey(key)).toBe(true);
      const trPlaceholders = extractPlaceholders(
         resolveRaw(trDictionary, key),
      );
      const enPlaceholders = extractPlaceholders(
        resolveRaw(enDictionary, key),
      );
      expect(
        enPlaceholders,
        `Placeholder mismatch between TR and EN at key "${key}"`,
      ).toEqual(trPlaceholders);

      const sampleParams = Object.fromEntries(
        trPlaceholders.map((p, idx) => [p, `val_${idx + 1}`]),
      );
      const trValue = tTr(key, sampleParams);
      const enValue = tEn(key, sampleParams);

      expect(trValue.trim().length).toBeGreaterThan(0);
      expect(enValue.trim().length).toBeGreaterThan(0);
      expect(trValue).not.toMatch(/\b(?:TODO|FIXME|lorem ipsum)\b/i);
      expect(enValue).not.toMatch(/\b(?:TODO|FIXME|lorem ipsum)\b/i);
    }

    // Tema kayıtlarındaki labelKey değerleri sözlükte geçerli yaprak anahtar olmalıdır.
    for (const themeDef of Object.values(THEME_REGISTRY)) {
      expect(isDictionaryKey(themeDef.labelKey)).toBe(true);
    }
  });

  it("ara ad alanlarını (non-leaf) ve var olmayan anahtarları reddeder", () => {
    expect(isDictionaryKey("nav")).toBe(false);
    expect(isDictionaryKey("meta")).toBe(false);
    expect(isDictionaryKey("meta.home")).toBe(false);
    expect(isDictionaryKey("nav.nonExistent")).toBe(false);
    expect(isDictionaryKey("")).toBe(false);
    expect(isDictionaryKey(123)).toBe(false);

    const t = getTranslator("tr");
    expect(() => t("nav" as unknown as DictionaryKey)).toThrow(
      /Missing or non-leaf dictionary key/,
    );
    expect(() => t("meta.home" as unknown as DictionaryKey)).toThrow(
      /Missing or non-leaf dictionary key/,
    );
    expect(() => t("nav.unknownKey" as unknown as DictionaryKey)).toThrow(
      /Missing or non-leaf dictionary key/,
    );
  });

  it("getTranslator(locale) saf fonksiyon olarak TR/EN çeviri ve parametre enterpolasyonu yapar", () => {
    const tTr = getTranslator("tr");
    const tEn = getTranslator("en");

    expect(tTr("nav.home")).toBe("Ana sayfa");
    expect(tEn("nav.home")).toBe("Home");
    expect(tTr("nav.about")).toBe("Hakkımızda");
    expect(tEn("nav.about")).toBe("About");

    expect(tTr("common.pageCount", { page: 2, total: 5 })).toBe("Sayfa 2 / 5");
    expect(tEn("common.pageCount", { page: 2, total: 5 })).toBe("Page 2 of 5");

    expect(tTr("meta.eventDetail.title", { title: "Coffee Talk" })).toBe(
      "Coffee Talk",
    );
    expect(tEn("meta.eventDetail.title", { title: "Coffee Talk" })).toBe(
      "Coffee Talk",
    );

    // Eksik parametre çalışma anında açık hata fırlatır
    expect(() => tTr("common.pageCount")).toThrow(
      /Missing translation parameter "page"/,
    );
    expect(() => tTr("common.pageCount", { page: 1 })).toThrow(
      /Missing translation parameter "total"/,
    );

    // Geçersiz locale açık hata fırlatır
    expect(() => getDictionary("de" as "tr")).toThrow(/Unsupported locale/);
  });
});

function resolveRaw(
  dict: Readonly<Record<string, unknown>>,
  key: string,
): string {
  let curr: unknown = dict;
  for (const part of key.split(".")) {
    curr = (curr as Readonly<Record<string, unknown>>)[part];
  }
  return String(curr);
}
