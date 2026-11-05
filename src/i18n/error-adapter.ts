import { DEFAULT_LOCALE, type Locale } from "./config.ts";
import type { DictionaryKey } from "./keys.ts";
import type { TranslateFn } from "./translate.ts";

/**
 * Bilinen sabit sunucu/doğrulama hata mesajlarının sözlük anahtarı eşlemesi.
 * Sunucu/API yanıt gövdeleri ve alan yolları (`fieldErrors`) değiştirilmez;
 * istemci adaptörü bilinen sabit mesajları aktif dile çevirir.
 */
export const KNOWN_UI_ERROR_KEYS: Readonly<Record<string, DictionaryKey>> = {
  "Bu alanı kontrol edin.": "errors.checkField",
  "İşaretli alanları kontrol edin.": "errors.checkMarkedFields",
  "Toplam kişi sayısı tamsayı olmalıdır.": "errors.expectedSizeInt",
  "Telefon, beceri seviyeleri, açıklama ve takım alanlarını kontrol edin.":
    "errors.ulujamValidationSummary",
  "Önizleme doğrulandı; başvuru kaydedilmedi.": "errors.previewValidatedNoSave",
  "Gönderim tamamlanamadı. Aynı yanıtla tekrar deneyin.":
    "errors.submissionFailedRetry",
  "Gönderim tamamlanamadı. Aynı yanıtla tekrar deneyebilirsiniz.":
    "errors.submissionFailedCanRetry",
  "Gönderim tamamlanamadı": "errors.submissionFailedShort",
  "Takımlar yüklenemedi.": "errors.teamsLoadFailed",
  "İstek doğrulanamadı": "errors.requestNotVerified",
  "İşlem tamamlanamadı": "errors.operationFailed",
  "Makbuz bağlantısını kullanın.": "receipt.useReceiptLinkError",
  "Çıkış tamamlanamadı.": "teams.logoutError",
  "Onay kaydedilemedi": "consent.saveErrorFallback",
} as const;

export function adaptUiErrorMessage(
  rawMessage: unknown,
  t: TranslateFn,
  fallbackKey: DictionaryKey = "errors.operationFailed",
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
    return t(fallbackKey);
  }
  const trimmed = rawMessage.trim();
  const mappedKey = KNOWN_UI_ERROR_KEYS[trimmed];
  if (mappedKey) {
    return t(mappedKey);
  }
  // Bilinmeyen sunucu mesajı: varsayılan TR dilinde özgün sunucu mesajını korur,
  // diğer dillerde ise güvenli yerelleştirilmiş fallback veya sunucu mesajını sunar.
  return locale === "tr" ? rawMessage : rawMessage || t(fallbackKey);
}

export function adaptFieldErrors(
  fieldErrors: Readonly<Record<string, string>> | undefined | null,
  t: TranslateFn,
  locale: Locale = DEFAULT_LOCALE,
): Record<string, string> {
  if (!fieldErrors) return {};
  const adapted: Record<string, string> = {};
  for (const [fieldPath, rawMsg] of Object.entries(fieldErrors)) {
    adapted[fieldPath] = adaptUiErrorMessage(
      rawMsg,
      t,
      "errors.checkField",
      locale,
    );
  }
  return adapted;
}
