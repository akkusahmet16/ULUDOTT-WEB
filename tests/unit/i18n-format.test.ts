import { describe, expect, it } from "vitest";
import { APP_TIME_ZONE, LOCALE_TAGS, type Locale } from "../../src/i18n/config.ts";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  selectPlural,
} from "../../src/i18n/format.ts";

describe("Faz 3 / İş 3A — Tarih, saat, sayı, göreli zaman ve çoğullama (format.ts) testleri", () => {
  it("sabit Europe/Istanbul saat dilimi ve LOCALE_TAGS (tr-TR / en-GB) yapılandırmasını doğrular", () => {
    expect(APP_TIME_ZONE).toBe("Europe/Istanbul");
    expect(LOCALE_TAGS).toEqual({
      tr: "tr-TR",
      en: "en-GB",
    });
  });

  it("formatDate ve formatDateTime fonksiyonlarını UTC gece yarısı sınırında dahi Europe/Istanbul saat dilimiyle deterministik çalıştırır", () => {
    // 20 Ekim 2026 22:30 UTC -> Europe/Istanbul (UTC+3) içinde 21 Ekim 2026 01:30'dur.
    const utcBoundaryIso = "2026-10-20T22:30:00.000Z";

    const dateTr = formatDate(utcBoundaryIso, "tr");
    const dateEn = formatDate(utcBoundaryIso, "en");

    expect(dateTr).toBe("21 Ekim 2026");
    expect(dateEn).toBe("21 October 2026");

    const dateTimeTr = formatDateTime(new Date(utcBoundaryIso), "tr");
    const dateTimeEn = formatDateTime(Date.parse(utcBoundaryIso), "en");

    expect(dateTimeTr).toContain("21 Ekim 2026");
    expect(dateTimeTr).toContain("01:30");
    expect(dateTimeEn).toContain("21 October 2026");
    expect(dateTimeEn).toContain("01:30");

    // Çağıran başka bir timeZone geçmeye çalışsa bile APP_TIME_ZONE korunur
    const forcedTzAttempt = formatDate(utcBoundaryIso, "tr", {
      timeZone: "America/New_York",
    });
    expect(forcedTzAttempt).toBe("21 Ekim 2026");
  });

  it("formatNumber ve formatRelativeTime fonksiyonlarını TR ve EN yerel kurallarına göre biçimlendirir", () => {
    expect(formatNumber(12500, "tr")).toBe("12.500");
    expect(formatNumber(12500, "en")).toBe("12,500");

    expect(formatNumber(98.5, "tr", { minimumFractionDigits: 1 })).toBe("98,5");
    expect(formatNumber(98.5, "en", { minimumFractionDigits: 1 })).toBe("98.5");

    const relTr = formatRelativeTime(-3, "day", "tr");
    const relEn = formatRelativeTime(-3, "day", "en");
    expect(relTr).toBe("3 gün önce");
    expect(relEn).toBe("3 days ago");

    expect(formatRelativeTime(-1, "day", "tr")).toBe("dün");
    expect(formatRelativeTime(-1, "day", "en")).toBe("yesterday");
  });

  it("selectPlural fonksiyonunu Intl.PluralRules ve biçimlendirilmiş {count} ile çalıştırır", () => {
    const gameFormsTr = {
      one: "{count} oyun",
      other: "{count} oyun",
    };
    const gameFormsEn = {
      one: "{count} game",
      other: "{count} games",
    };

    expect(selectPlural(0, gameFormsTr, "tr")).toBe("0 oyun");
    expect(selectPlural(1, gameFormsTr, "tr")).toBe("1 oyun");
    expect(selectPlural(1250, gameFormsTr, "tr")).toBe("1.250 oyun");

    expect(selectPlural(0, gameFormsEn, "en")).toBe("0 games");
    expect(selectPlural(1, gameFormsEn, "en")).toBe("1 game");
    expect(selectPlural(2, gameFormsEn, "en")).toBe("2 games");
    expect(selectPlural(1250, gameFormsEn, "en")).toBe("1,250 games");
  });

  it("geçersiz tarih, sayı veya desteklenmeyen dil parametrelerini deterministik olarak reddeder", () => {
    expect(() => formatDate("not-a-date", "tr")).toThrow(/Invalid date value/);
    expect(() => formatDate("   ", "tr")).toThrow(/Empty date string/);
    expect(() => formatDate(new Date("invalid"), "tr")).toThrow(
      /Invalid Date instance/,
    );
    expect(() => formatDate("2026-10-20T12:00:00Z", "de" as Locale)).toThrow(
      /Unsupported locale/,
    );

    expect(() => formatNumber(Number.NaN, "tr")).toThrow(/Invalid number/);
    expect(() => formatNumber(Number.POSITIVE_INFINITY, "en")).toThrow(
      /Invalid number/,
    );
    expect(() => formatRelativeTime(Number.NaN, "day", "tr")).toThrow(
      /Invalid value/,
    );
    expect(() =>
      selectPlural(Number.NaN, { other: "{count}" }, "tr"),
    ).toThrow(/Invalid count/);
  });
});
