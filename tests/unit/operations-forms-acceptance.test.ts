import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { safeCell, serializeExport } from "../../src/modules/forms/application/export-submissions.ts";
import { evaluateVisibility } from "../../src/modules/forms/domain/condition.ts";
import { validateFormDefinition } from "../../src/modules/forms/domain/form-version.ts";
import { validateSubmission } from "../../src/modules/forms/application/form-validator.ts";
import { WebCard } from "../../src/modules/cards/ui/web-card.tsx";
import { TeamLogin, TeamLogout } from "../../src/modules/teams/ui/team-page.tsx";
import { ReceiptView } from "../../src/modules/forms/ui/receipt-view.tsx";
import { CreditConsent } from "../../src/modules/games/ui/credit-consent.tsx";
import {
  adaptUiErrorMessage,
  adaptFieldErrors,
  KNOWN_UI_ERROR_KEYS,
} from "../../src/i18n/error-adapter.ts";
import { getTranslator } from "../../src/i18n/translate.ts";
import { I18nProvider } from "../../src/i18n/client.tsx";
import { CLIENT_NAMESPACES, type Locale } from "../../src/i18n/config.ts";
import { getDictionarySlice } from "../../src/i18n/server.ts";
import type { CardView } from "../../src/modules/cards/application/card-service.ts";

function renderWithI18n(locale: Locale, node: React.ReactNode): string {
  const slice = getDictionarySlice(locale, CLIENT_NAMESPACES);
  return renderToStaticMarkup(
    createElement(I18nProvider, { locale, dictionary: slice, children: node }),
  );
}

describe("Faz 6 / İş 6A — Form, başvuru ve operasyon modülleri kabul paketi", () => {
  describe("CSV Formül Enjeksiyonu Koruması (safeCell ve serializeExport)", () => {
    it("=, +, -, @ ve boşluk/kontrol karakteriyle başlayan hücreleri güvenli şekilde ' ile kaçar", () => {
      // Tehlikeli formül ve komut girdileri
      expect(safeCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(safeCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(safeCell("-10+5")).toBe("'-10+5");
      expect(safeCell("@SUM(1,2)")).toBe("'@SUM(1,2)");
      expect(safeCell("\t=1+1")).toBe("'\t=1+1");
      expect(safeCell("\n=1+1")).toBe("'\n=1+1");
      expect(safeCell("\r=1+1")).toBe("'\r=1+1");

      // Normal güvenli girdiler kaçılmamalıdır
      expect(safeCell("Uludott Topluluğu")).toBe("Uludott Topluluğu");
      expect(safeCell("ada@example.test")).toBe("ada@example.test");
      expect(safeCell(12345)).toBe("12345");
      expect(safeCell(true)).toBe("true");

      // Dizi ve boş değerler
      expect(safeCell(["Geliştirici", "Tasarımcı"])).toBe("Geliştirici, Tasarımcı");
      expect(safeCell(null)).toBe("");
      expect(safeCell(undefined)).toBe("");
    });

    it("serializeExport UTF-8 BOM, çift tırnak kaçışı ve satır sonu sözleşmesini üretir", async () => {
      const rows = [
        ["Ad Soyad", "E-posta", "Not"],
        ["Ali Veli", "ali@test.com", 'Normal "alıntılı" metin'],
        ["=Formül", "saldiri@test.com", "@cmd"],
      ];

      const csvBuffer = await serializeExport(rows, "csv");
      const csvContent = csvBuffer.toString("utf8");

      // UTF-8 BOM varlığı (\uFEFF)
      expect(csvContent.charCodeAt(0)).toBe(0xfeff);

      // Başlık ve satırlar çift tırnak içinde
      expect(csvContent).toContain('"Ad Soyad","E-posta","Not"');
      expect(csvContent).toContain('"Normal ""alıntılı"" metin"');

      // Kaçılmış formüller
      expect(csvContent).toContain('"' + "'=Formül" + '"');
      expect(csvContent).toContain('"' + "'@cmd" + '"');
    });

    it("serializeExport satır ve boyut sınırlarını aşan istekleri reddeder", async () => {
      const tooManyRows = Array.from({ length: 5002 }, () => ["test"]);
      await expect(serializeExport(tooManyRows, "csv")).rejects.toThrow(
        "Dışa aktarma sınırı aşıldı",
      );
    });
  });

  describe("Koşullu Alanlar ve Form Doğrulama Motoru", () => {
    const f1 = "10000000-0000-4000-8000-000000000001";
    const f2 = "10000000-0000-4000-8000-000000000002";
    const f3 = "10000000-0000-4000-8000-000000000003";

    it("evaluateVisibility operatörleri ve mantıksal zincirleri doğru değerlendirir", () => {
      const definition = validateFormDefinition({
        fields: [
          { id: f1, type: "single_choice", label: "Rol", options: [{ value: "solo", label: "Bireysel" }, { value: "team", label: "Takım" }] },
          { id: f2, type: "number", label: "Kişi Sayısı", condition: { op: "eq", fieldId: f1, value: "team" } },
          { id: f3, type: "short_text", label: "Takım Adı", condition: { op: "gt", fieldId: f2, value: 1 } },
        ],
      });

      // f1 = "solo" -> f2 gizli, f3 de f2'ye bağlı olduğu için gizli
      const soloVisible = evaluateVisibility(definition, { [f1]: "solo" });
      expect(soloVisible).toContain(f1);
      expect(soloVisible).not.toContain(f2);
      expect(soloVisible).not.toContain(f3);

      // f1 = "team", f2 = 1 -> f2 görünür, ama f3 (f2 > 1) henüz gizli
      const teamSmallVisible = evaluateVisibility(definition, { [f1]: "team", [f2]: 1 });
      expect(teamSmallVisible).toContain(f1);
      expect(teamSmallVisible).toContain(f2);
      expect(teamSmallVisible).not.toContain(f3);

      // f1 = "team", f2 = 3 -> hem f2 hem f3 görünür
      const teamLargeVisible = evaluateVisibility(definition, { [f1]: "team", [f2]: 3 });
      expect(teamLargeVisible).toContain(f1);
      expect(teamLargeVisible).toContain(f2);
      expect(teamLargeVisible).toContain(f3);
    });

    it("validateFormDefinition ve validateSubmission koşula bağlı gizlenen alan enjeksiyonunu reddeder", () => {
      const definition = validateFormDefinition({
        fields: [
          { id: f1, type: "single_choice", label: "Rol", options: [{ value: "solo", label: "Bireysel" }, { value: "team", label: "Takım" }] },
          {
            id: f2,
            type: "short_text",
            label: "Takım Adı",
            required: true,
            condition: { op: "eq", fieldId: f1, value: "team" },
          },
        ],
      });

      // Bireysel seçildiğinde yanıt listesinde f2 gönderilirse gizli alan enjeksiyonu olarak reddedilir (güvenlik sözleşmesi)
      const injectedAnswers = { [f1]: "solo", [f2]: "Kaçak Takım Adı" };
      expect(() => validateSubmission({ definition }, injectedAnswers)).toThrow(
        "Gizli alan yanıtı reddedildi",
      );

      // Bireysel seçildiğinde yalnızca geçerli görünür alanlar gönderilirse başarıyla kabul edilir
      const validSoloAnswers = { [f1]: "solo" };
      expect(validateSubmission({ definition }, validSoloAnswers)).toEqual(validSoloAnswers);

      // Takım seçildiğinde takım adı zorunludur; eksikse reddedilir, doluysa kabul edilir
      expect(() => validateSubmission({ definition }, { [f1]: "team" })).toThrow();
      const validTeamAnswers = { [f1]: "team", [f2]: "Şampiyonlar" };
      expect(validateSubmission({ definition }, validTeamAnswers)).toEqual(validTeamAnswers);
    });
  });

  describe("Katılımcı Kartları ve Bilet Durumları (WebCard & PendingCard)", () => {
    const baseCard: CardView = {
      id: "card-uuid-0000-0001",
      eventTitle: "UluJam 2026",
      name: "Ali Veli",
      teamName: "Yıldız Takımı",
      status: "active",
      startsAt: "2026-04-20T10:00:00+03:00",
      revision: 1,
      qr: "/api/check-in/qr-code-token",
    };

    it("aktif kartı QR görseli, saat dilimli tarih ve takım bilgisi ile TR ve EN dillerinde render eder", () => {
      const trHtml = renderWithI18n("tr", createElement(WebCard, { card: baseCard, locale: "tr" }));
      expect(trHtml).toContain("UluJam 2026");
      expect(trHtml).toContain("Ali Veli");
      expect(trHtml).toContain("Yıldız Takımı");
      expect(trHtml).toContain("Kart durumu:");
      expect(trHtml).toContain("Aktif");
      expect(trHtml).toContain('alt="Etkinlik giriş QR kodu"');
      expect(trHtml).toContain('src="/api/check-in/qr-code-token"');
      expect(trHtml).toContain("Bireysel katılım kartı");

      const enHtml = renderWithI18n("en", createElement(WebCard, { card: baseCard, locale: "en" }));
      expect(enHtml).toContain("Card status:");
      expect(enHtml).toContain("Active");
      expect(enHtml).toContain('alt="Event entry QR code"');
    });

    it("beklemede ve iptal edilmiş biletlerde QR gizlenir ve uygun durum mesajları verilir", () => {
      const pendingCard: CardView = { ...baseCard, status: "pending", qr: null };
      const trPendingHtml = renderWithI18n("tr", createElement(WebCard, { card: pendingCard, locale: "tr" }));
      expect(trPendingHtml).not.toContain('alt="Etkinlik giriş QR kodu"');
      expect(trPendingHtml).toContain("Onay bekleniyor");
      expect(trPendingHtml).toContain("Başvurunuz alındı.");

      const revokedCard: CardView = { ...baseCard, status: "revoked", qr: null };
      const trRevokedHtml = renderWithI18n("tr", createElement(WebCard, { card: revokedCard, locale: "tr" }));
      expect(trRevokedHtml).not.toContain('alt="Etkinlik giriş QR kodu"');
      expect(trRevokedHtml).toContain("Katılım hakkı kapalı");

      const enRevokedHtml = renderWithI18n("en", createElement(WebCard, { card: revokedCard, locale: "en" }));
      expect(enRevokedHtml).toContain("Participation pass inactive");
    });
  });

  describe("Takım, Makbuz ve Rıza Arayüzleri (TeamLogin, ReceiptView, CreditConsent)", () => {
    it("TeamLogin ve TeamLogout erişilebilir form etiketleri ve role='alert' içerir", () => {
      const trHtml = renderWithI18n("tr", createElement(TeamLogin, { token: "sample-token" }));
      expect(trHtml).toContain('for="team-password"');
      expect(trHtml).toContain('type="password"');
      expect(trHtml).toContain('role="alert"');
      expect(trHtml).toContain("Takım parolası");
      expect(trHtml).toContain("Takıma giriş yap");

      const logoutHtml = renderWithI18n("tr", createElement(TeamLogout));
      expect(logoutHtml).toContain("<button");
      expect(logoutHtml).toContain("Takımdan çıkış yap");
    });

    it("ReceiptView özel makbuz aria-label'ı ve status paragrafı ile başlar", () => {
      const trHtml = renderWithI18n("tr", createElement(ReceiptView));
      expect(trHtml).toContain('aria-label="Özel makbuz"');
      expect(trHtml).toContain('role="status"');

      const enHtml = renderWithI18n("en", createElement(ReceiptView));
      expect(enHtml).toContain('aria-label="Private receipt"');
    });

    it("CreditConsent rıza onay/çekme kontrollerini ve aria etiketlerini sunar", () => {
      const sampleInitial = {
        title: "Kayıp Parçalar",
        event: "UluJam 2026",
        publicationName: "Ali Veli",
        consented: true,
        canApprove: true,
        revision: 2,
        updatedAt: "2026-04-20T10:00:00Z",
      };

      const trHtml = renderWithI18n(
        "tr",
        createElement(CreditConsent, {
          token: "sample-consent-token",
          initial: sampleInitial,
        }),
      );

      expect(trHtml).toContain('aria-label="Yapımcı yayın onayı"');
      expect(trHtml).toContain("Yayımlanacak yapımcı adı");
      expect(trHtml).toContain('value="Ali Veli"');
      expect(trHtml).toContain("Yayın adımı onayla");
      expect(trHtml).toContain("Yayın onayımı geri çek");
    });
  });

  describe("Sunucu Hata Adaptasyonu (adaptUiErrorMessage ve adaptFieldErrors)", () => {
    const tTr = getTranslator("tr");
    const tEn = getTranslator("en");

    it("bilinen sunucu hata anahtarlarını aktif dile çevirir", () => {
      for (const [serverMsg, dictKey] of Object.entries(KNOWN_UI_ERROR_KEYS)) {
        const localizedTr = adaptUiErrorMessage(serverMsg, tTr, "errors.operationFailed", "tr");
        const localizedEn = adaptUiErrorMessage(serverMsg, tEn, "errors.operationFailed", "en");

        // Ham sunucu mesajı olmamalı, sözlükten yerelleştirilmiş olmalıdır
        expect(localizedTr).toBe(tTr(dictKey as Parameters<typeof tTr>[0]));
        expect(localizedEn).toBe(tEn(dictKey as Parameters<typeof tEn>[0]));
      }
    });

    it("boş veya tanımsız sunucu hata mesajlarında güvenli geri dönüş anahtarını kullanır", () => {
      const safeTr = adaptUiErrorMessage("", tTr, "errors.operationFailed", "tr");
      expect(safeTr).toBe("İşlem tamamlanamadı");

      const safeEn = adaptUiErrorMessage(null, tEn, "errors.operationFailed", "en");
      expect(safeEn).toBe("Operation could not be completed");
    });

    it("adaptFieldErrors alan yollarını koruyarak alan hatalarını yerelleştirir", () => {
      const rawErrors = {
        email: "Bu alanı kontrol edin.",
        general: "İşlem tamamlanamadı",
      };

      const adapted = adaptFieldErrors(rawErrors, tTr, "tr");
      expect(adapted).toHaveProperty("email");
      expect(adapted).toHaveProperty("general");
      expect(adapted.email).toBe("Bu alanı kontrol edin.");
      expect(adapted.general).toBe("İşlem tamamlanamadı");
    });
  });
});
