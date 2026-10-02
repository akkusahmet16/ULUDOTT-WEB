import { z } from "zod";
export const fieldIdSchema = z
  .uuid()
  .refine((id) => id === id.toLowerCase(), "Alan UUID küçük harf olmalı");
export const fieldTypes = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "number",
  "date",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "checkbox",
  "radio",
  "rating",
  "info",
  "section",
  "consent",
] as const;
export type FieldType = (typeof fieldTypes)[number];
export type Answer = string | number | boolean | string[];
export type Answers = Record<string, Answer>;
export const choiceTypes: readonly FieldType[] = [
  "single_choice",
  "multiple_choice",
  "dropdown",
  "radio",
];
export const displayTypes: readonly FieldType[] = ["info", "section"];
export const fieldSchema = z.strictObject({
  id: fieldIdSchema,
  type: z.enum(fieldTypes),
  label: z.string().trim().min(1).max(160),
  required: z.boolean().default(false),
  options: z
    .array(
      z.strictObject({
        value: z.string().min(1).max(100),
        label: z.string().trim().min(1).max(160),
      }),
    )
    .min(1)
    .max(50)
    .optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  maxLength: z.int().min(1).max(5000).optional(),
  minSelections: z.int().min(0).max(50).optional(),
  maxSelections: z.int().min(1).max(50).optional(),
  content: z.string().trim().min(1).max(5000).optional(),
  consentVersion: z.string().trim().min(1).max(100).optional(),
  purpose: z.string().trim().min(1).max(100).optional(),
});
export type Field = z.infer<typeof fieldSchema>;
export function validateField(f: Field): void {
  const allowed: Partial<Record<keyof Field, readonly FieldType[]>> = {
    options: choiceTypes,
    min: ["number", "rating"],
    max: ["number", "rating"],
    maxLength: ["short_text", "long_text"],
    minSelections: ["multiple_choice"],
    maxSelections: ["multiple_choice"],
    content: ["info", "consent"],
    consentVersion: ["consent"],
    purpose: ["consent"],
  };
  for (const [key, types] of Object.entries(allowed))
    if (f[key as keyof Field] !== undefined && !types.includes(f.type))
      throw Error("Alan yapılandırması türle uyuşmuyor");
  if (choiceTypes.includes(f.type) && !f.options)
    throw Error("Seçenekler gerekli");
  if (
    f.options &&
    new Set(f.options.map((o) => o.value)).size !== f.options.length
  )
    throw Error("Tekrarlı seçenek");
  if (f.min !== undefined && f.max !== undefined && f.min > f.max)
    throw Error("Geçersiz sayı aralığı");
  if (
    f.type === "rating" &&
    (!Number.isInteger(f.min ?? 1) ||
      !Number.isInteger(f.max ?? 5) ||
      (f.min ?? 1) < 1 ||
      (f.max ?? 5) > 10 ||
      (f.min ?? 1) > (f.max ?? 5))
  )
    throw Error("Geçersiz derecelendirme aralığı");
  if (
    f.type === "multiple_choice" &&
    ((f.minSelections ?? 0) > (f.maxSelections ?? f.options!.length) ||
      (f.maxSelections ?? 1) > f.options!.length)
  )
    throw Error("Geçersiz seçim aralığı");
  if (displayTypes.includes(f.type) && f.required)
    throw Error("Bilgi alanı zorunlu olamaz");
  if ((f.type === "info" || f.type === "consent") && !f.content)
    throw Error("Metin gerekli");
  if (f.type === "consent" && (!f.consentVersion || !f.purpose))
    throw Error("Rıza metni sürümü ve amacı gerekli");
}
export function isEmpty(v: unknown): boolean {
  return (
    v === undefined ||
    (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0)
  );
}
export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return (
    Number.isFinite(d.getTime()) &&
    d.toISOString().slice(0, 10) === s &&
    s >= "0001-01-01"
  );
}
// No coercion: numeric strings, truthy strings and unknown choice values stay invalid.
export function parseAnswer(f: Field, input: unknown): Answer {
  if (displayTypes.includes(f.type)) throw Error("Bilgi alanı yanıt alamaz");
  if (f.type === "checkbox" || f.type === "consent")
    return z.boolean().parse(input);
  if (f.type === "number" || f.type === "rating") {
    const n = z.number().finite().parse(input),
      min = f.min ?? (f.type === "rating" ? 1 : -Infinity),
      max = f.max ?? (f.type === "rating" ? 5 : Infinity);
    if (n < min || n > max || (f.type === "rating" && !Number.isInteger(n)))
      throw Error("Sayı aralık dışında");
    return n;
  }
  if (f.type === "multiple_choice") {
    const a = z
      .array(z.string())
      .max(f.maxSelections ?? f.options!.length)
      .parse(input);
    if (
      a.length < (f.minSelections ?? 0) ||
      new Set(a).size !== a.length ||
      a.some((v) => !f.options!.some((o) => o.value === v))
    )
      throw Error("Geçersiz çoklu seçim");
    return a;
  }
  const s = z
    .string()
    .max(
      f.type === "long_text"
        ? (f.maxLength ?? 5000)
        : f.type === "short_text"
          ? (f.maxLength ?? 200)
          : 254,
    )
    .parse(input);
  if (choiceTypes.includes(f.type) && !f.options!.some((o) => o.value === s))
    throw Error("Geçersiz seçenek");
  if (f.type === "email") z.email().parse(s);
  if (f.type === "phone" && !/^\+[1-9]\d{7,14}$/.test(s))
    throw Error("Telefon E.164 olmalı");
  if (f.type === "date" && !validDate(s)) throw Error("Geçersiz tarih");
  return s;
}
