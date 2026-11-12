import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createSliceTranslator } from "../../src/i18n/client.tsx";
import {
  ADMIN_LOCALE,
  CLIENT_NAMESPACES,
  isClientNamespace,
  type ClientNamespace,
} from "../../src/i18n/config.ts";
import {
  adminTrDictionary,
  type AdminDictionary,
} from "../../src/i18n/dictionaries/admin-tr.ts";
import { clientTrSlice } from "../../src/i18n/dictionaries/client-tr.ts";
import { enDictionary } from "../../src/i18n/dictionaries/en.ts";
import {
  trDictionary,
  type PublicDictionary,
} from "../../src/i18n/dictionaries/tr.ts";
import {
  adaptFieldErrors,
  adaptUiErrorMessage,
} from "../../src/i18n/error-adapter.ts";
import {
  extractLeafKeys,
  extractPlaceholders,
  PUBLIC_DICTIONARY_KEYS,
  type DictionaryKey,
} from "../../src/i18n/keys.ts";
import {
  getAdminDictionary,
  getDictionarySlice,
  getLocale,
  getRequestTranslator,
  resolveRequestLocaleFromContext,
} from "../../src/i18n/server.ts";

function flattenLeafMap(
  node: Readonly<Record<string, unknown>>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(node)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[pathKey] = value;
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.assign(
        result,
        flattenLeafMap(value as Readonly<Record<string, unknown>>, pathKey),
      );
    }
  }
  return result;
}

// Derleme zamanı (compile-time) tip eşitliği doğrulaması:
const _compileTimeTrCheck: PublicDictionary = trDictionary;
const _compileTimeEnCheck: PublicDictionary = enDictionary;
const _compileTimeAdminCheck: AdminDictionary = adminTrDictionary;
void _compileTimeTrCheck;
void _compileTimeEnCheck;
void _compileTimeAdminCheck;

const TURKISH_SPECIFIC_CHARS_REGEX = /[ğĞşŞıİöÖüÜçÇ]/;
const FORBIDDEN_PLACEHOLDER_TEXT_REGEX = /\b(?:TODO|FIXME|lorem ipsum|tbd)\b/i;

describe("Faz 3 / İş 3A — Sözlük eşliği (parity), dilim (slice) sınırı ve AdminDictionary testleri", () => {
  it("PublicDictionary (TR ve EN) anahtar kümesini, derinliğini ve {placeholder} imzalarını birebir eşitler", () => {
    const flatTr = flattenLeafMap(trDictionary);
    const flatEn = flattenLeafMap(enDictionary);

    const trKeys = extractLeafKeys(trDictionary).sort();
    const enKeys = extractLeafKeys(enDictionary).sort();

    expect(trKeys).toEqual(enKeys);
    expect(trKeys).toEqual([...PUBLIC_DICTIONARY_KEYS].sort());

    for (const key of PUBLIC_DICTIONARY_KEYS) {
      const trVal = flatTr[key];
      const enVal = flatEn[key];

      expect(typeof trVal).toBe("string");
      expect(typeof enVal).toBe("string");
      expect(trVal.trim().length, `Empty TR value at "${key}"`).toBeGreaterThan(
        0,
      );
      expect(enVal.trim().length, `Empty EN value at "${key}"`).toBeGreaterThan(
        0,
      );

      expect(
        FORBIDDEN_PLACEHOLDER_TEXT_REGEX.test(trVal),
        `Forbidden placeholder text in TR "${key}": ${trVal}`,
      ).toBe(false);
      expect(
        FORBIDDEN_PLACEHOLDER_TEXT_REGEX.test(enVal),
        `Forbidden placeholder text in EN "${key}": ${enVal}`,
      ).toBe(false);

      expect(
        TURKISH_SPECIFIC_CHARS_REGEX.test(enVal),
        `Untranslated Turkish diacritic in EN "${key}": ${enVal}`,
      ).toBe(false);

      expect(
        extractPlaceholders(trVal).sort(),
        `Placeholder mismatch at "${key}"`,
      ).toEqual(extractPlaceholders(enVal).sort());
    }
  });

  it("AdminDictionary tipini PublicDictionary'den bağımsız ve yalnız Türkçe (TR) olarak doğrular", () => {
    expect(ADMIN_LOCALE).toBe("tr");
    const adminDict = getAdminDictionary();
    expect(adminDict).toBe(adminTrDictionary);

    const flatAdmin = flattenLeafMap(adminDict);
    const adminKeys = Object.keys(flatAdmin);
    expect(adminKeys.length).toBeGreaterThan(0);

    for (const [key, value] of Object.entries(flatAdmin)) {
      expect(
        value.trim().length,
        `Empty AdminDictionary value at "${key}"`,
      ).toBeGreaterThan(0);
      expect(FORBIDDEN_PLACEHOLDER_TEXT_REGEX.test(value)).toBe(false);
    }

    // Admin anahtarları PublicDictionary'ye sızmaz
    for (const key of adminKeys) {
      expect((PUBLIC_DICTIONARY_KEYS as readonly string[]).includes(key)).toBe(
        false,
      );
    }
  });

  it("getDictionarySlice yalnız izinli CLIENT_NAMESPACES dilimlerini döndürür, clientTrSlice ile birebir eşleşir ve createSliceTranslator ile çalışır", () => {
    expect(CLIENT_NAMESPACES).toEqual([
      "brand",
      "nav",
      "common",
      "home",
      "about",
      "ulujam",
      "events",
      "miniGames",
      "links",
      "forms",
      "receipt",
      "cards",
      "teams",
      "consent",
      "errors",
      "communityCard",
      "sozluk",
    ]);
    expect(isClientNamespace("brand")).toBe(true);
    expect(isClientNamespace("nav")).toBe(true);
    expect(isClientNamespace("common")).toBe(true);
    expect(isClientNamespace("forms")).toBe(true);
    expect(isClientNamespace("errors")).toBe(true);
    expect(isClientNamespace("meta")).toBe(false);
    expect(isClientNamespace("footer")).toBe(false);
    expect(isClientNamespace("theme")).toBe(false);
    expect(isClientNamespace("games")).toBe(false);
    expect(isClientNamespace("contact")).toBe(false);
    expect(isClientNamespace("")).toBe(false);

    const trSlice = getDictionarySlice("tr", CLIENT_NAMESPACES);
    const enSlice = getDictionarySlice("en", CLIENT_NAMESPACES);

    expect(clientTrSlice).toEqual(trSlice);
    expect(Object.keys(trSlice).sort()).toEqual([...CLIENT_NAMESPACES].sort());
    expect(Object.keys(enSlice).sort()).toEqual([...CLIENT_NAMESPACES].sort());
    expect("meta" in trSlice).toBe(false);
    expect("footer" in trSlice).toBe(false);
    expect("theme" in trSlice).toBe(false);
    expect("games" in trSlice).toBe(false);
    expect("contact" in trSlice).toBe(false);

    const tTr = createSliceTranslator(trSlice);
    const tEn = createSliceTranslator(enSlice);

    expect(tTr("nav.about")).toBe("Hakkımızda");
    expect(tEn("nav.about")).toBe("About");
    expect(tTr("nav.menuButton")).toBe("Menü");
    expect(tEn("nav.menuButton")).toBe("Menu");

    // Dilimde bulunmayan anahtar (ör. meta.home.title) istemci çeviricisinde reddedilir
    expect(() => tTr("meta.home.title")).toThrow(
      /Missing key "meta\.home\.title" in client dictionary slice/,
    );
    expect(() => tTr("brand" as unknown as DictionaryKey)).toThrow(
      /not a leaf string/,
    );

    // İzinli olmayan namespace istemleri reddedilir
    expect(() =>
      getDictionarySlice("tr", "meta" as unknown as ClientNamespace),
    ).toThrow(/not allowed in CLIENT_NAMESPACES/);
    expect(() =>
      getDictionarySlice("tr", [] as unknown as readonly ClientNamespace[]),
    ).toThrow(/requires at least one ClientNamespace/);

    // Error adapter hem TR hem EN sözlük eşlemesini ve bilinmeyen metin geri dönüşünü doğrular
    expect(
      adaptUiErrorMessage(
        "İstek doğrulanamadı",
        tEn,
        "errors.operationFailed",
        "en",
      ),
    ).toBe("Request could not be verified");
    expect(
      adaptUiErrorMessage(
        "İstek doğrulanamadı",
        tTr,
        "errors.operationFailed",
        "tr",
      ),
    ).toBe("İstek doğrulanamadı");
    expect(
      adaptUiErrorMessage(
        "Özel CMS mesajı",
        tEn,
        "errors.operationFailed",
        "en",
      ),
    ).toBe("Özel CMS mesajı");
    expect(
      adaptFieldErrors(
        { email: "Bu alanı kontrol edin.", custom: "Özel hata" },
        tEn,
        "en",
      ),
    ).toEqual({
      email: "Please check this field.",
      custom: "Özel hata",
    });
  });

  it("istemci bileşenlerinin (client.tsx, header.tsx) tam sözlükleri veya server.ts'i bundle'a çekmediğini doğrular", () => {
    const clientFiles = [
      "src/i18n/client.tsx",
      "src/components/layout/header.tsx",
    ];

    for (const relPath of clientFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
      // Yalnız `import type` izinli; çalışma zamanı değer importu yasak
      const valueImports = source
        .split("\n")
        .filter(
          (line) =>
            /^\s*import\b/.test(line) && !/^\s*import\s+type\b/.test(line),
        )
        .join("\n");

      expect(
        valueImports,
        `${relPath} must not runtime-import full dictionaries or server i18n`,
      ).not.toMatch(/dictionaries\/(?:tr|en|admin-tr)|i18n\/translate|i18n\/server/);
    }
  });

  it("resolveRequestLocaleFromContext, getLocale ve getRequestTranslator fonksiyonlarını çerez, /admin zorlaması ve eşzamanlı çağrı izolasyonuyla doğrular", async () => {
    expect(resolveRequestLocaleFromContext({})).toBe("tr");
    expect(
      resolveRequestLocaleFromContext({
        pathname: "/hakkimizda",
        cookieLocale: "en",
      }),
    ).toBe("en");
    expect(
      resolveRequestLocaleFromContext({
        pathname: "/hakkimizda",
        cookieLocale: "de",
      }),
    ).toBe("tr");
    expect(
      resolveRequestLocaleFromContext({
        pathname: "/admin",
        cookieLocale: "en",
      }),
    ).toBe("tr");
    expect(
      resolveRequestLocaleFromContext({
        pathname: "/admin/etkinlikler",
        cookieLocale: "en",
      }),
    ).toBe("tr");

    // İstek bağlamı dışında getLocale güvenli şekilde varsayılan "tr" döner
    expect(await getLocale()).toBe("tr");

    // Eşzamanlı TR ve EN çevirici çağrıları birbirini etkilemez
    const [tTr, tEn] = await Promise.all([
      getRequestTranslator("tr"),
      getRequestTranslator("en"),
    ]);
    expect(tTr("meta.about.title")).toBe("Hakkımızda");
    expect(tEn("meta.about.title")).toBe("About");
  });
});
