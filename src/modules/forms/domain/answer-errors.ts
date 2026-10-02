import type { Field } from "./field-types.ts";
export class AnswerValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super("İşaretli alanları düzeltin.");
    this.name = "AnswerValidationError";
    this.fieldErrors = fieldErrors;
  }
}
// Fixed messages only: never carry parser errors or submitted values across HTTP.
export function answerErrorMessage(f: Field): string {
  switch (f.type) {
    case "phone":
      return "Telefonu ülke koduyla, boşluksuz yazın (örnek: +905551234567).";
    case "email":
      return "Geçerli bir e-posta adresi yazın.";
    case "date":
      return "Geçerli bir tarih seçin.";
    case "multiple_choice":
      return "İzinli seçeneklerden belirtilen sayıda seçim yapın.";
    case "dropdown":
    case "radio":
    case "single_choice":
      return "Listeden geçerli bir seçenek seçin.";
    case "number":
    case "rating":
      return "Belirtilen aralıkta geçerli bir sayı girin.";
    case "checkbox":
    case "consent":
      return "Onay kutusunu kontrol edin.";
    default:
      return "Metni belirtilen karakter sınırına göre düzenleyin.";
  }
}
