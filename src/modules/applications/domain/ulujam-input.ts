import { z } from "zod";
import {
  skillsSchema,
  skillKeys,
  skillLabels,
} from "../../matching/domain/skills";
import {
  boundedJson,
  validateFormDefinition,
  type ValidFormDefinition,
} from "../../forms/domain/form-version";
import type { Condition } from "../../forms/domain/condition";
export const modes = [
  { value: "solo", label: "Tek başına katılıyorum" },
  { value: "seeking", label: "Takım arıyorum" },
  { value: "new", label: "Yeni takım kuruyorum" },
  { value: "existing", label: "Mevcut takıma katılıyorum" },
] as const;
const common = z.strictObject({
  eventId: z.uuid(),
  fullName: z.string().trim().min(1).max(160),
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/),
  skills: skillsSchema,
  skillDescription: z.string().trim().max(5000).optional(),
});
const schema = z
  .discriminatedUnion("mode", [
    common.extend({ mode: z.literal("solo") }),
    common.extend({ mode: z.literal("seeking") }),
    common.extend({
      mode: z.literal("new"),
      teamName: z.string().trim().min(1).max(100),
      expectedSize: z.int().min(1).max(100),
    }),
    common.extend({
      mode: z.literal("existing"),
      teamId: z.uuid(),
      password: z.string().min(1).max(128),
    }),
  ])
  .refine(
    (x) => x.skills.length === 1 || !!x.skillDescription,
    "Çoklu beceride açıklama gerekli",
  );
export type UlujamInput = z.infer<typeof schema>;
export function validateUlujamInput(raw: unknown): UlujamInput {
  boundedJson(raw);
  return schema.parse(raw);
}
// IDs belong to a form version, and stay stable across draft/publication snapshots.
const id = (n: number) =>
  "15000000-0000-4000-8000-" + String(n).padStart(12, "0");
export const ulujamFields = {
  fullName: id(1),
  email: id(2),
  phone: id(3),
  mode: id(4),
  skills: id(5),
  skillDescription: id(6),
  teamName: id(7),
  expectedSize: id(8),
  teamId: id(9),
  teamInfo: id(10),
  levels: Object.fromEntries(
    skillKeys.map((s, i) => [s, id(20 + i)]),
  ) as Record<(typeof skillKeys)[number], string>,
};
export type TeamOption = { id: string; name: string };
export function buildUlujamFormDefinition(
  eventId: string,
  teams: readonly TeamOption[] = [],
): ValidFormDefinition {
  z.uuid().parse(eventId);
  const choices = z
    .array(
      z.strictObject({ id: z.uuid(), name: z.string().trim().min(1).max(160) }),
    )
    .max(50)
    .parse(teams);
  if (new Set(choices.map((t) => t.id)).size !== choices.length)
    throw Error("Tekrarlı takım");
  const mode = (value: string): Condition => ({
    op: "eq",
    fieldId: ulujamFields.mode,
    value,
  });
  const contains = (value: string): Condition => ({
    op: "contains",
    fieldId: ulujamFields.skills,
    value,
  });
  const pairs: Condition[] = skillKeys.flatMap((a, i) =>
    skillKeys
      .slice(i + 1)
      .map(
        (b) =>
          ({ op: "and", conditions: [contains(a), contains(b)] }) as Condition,
      ),
  );
  return validateFormDefinition({
    schemaVersion: 1,
    fields: [
      {
        id: ulujamFields.fullName,
        type: "short_text",
        label: "Ad soyad",
        required: true,
        maxLength: 160,
      },
      {
        id: ulujamFields.email,
        type: "email",
        label: "E-posta",
        required: true,
      },
      {
        id: ulujamFields.phone,
        type: "phone",
        label: "Telefon",
        required: true,
      },
      {
        id: ulujamFields.mode,
        type: "radio",
        label: "Katılım biçimi",
        required: true,
        options: modes,
      },
      {
        id: ulujamFields.skills,
        type: "multiple_choice",
        label: "Beceri alanları",
        required: true,
        minSelections: 1,
        maxSelections: 5,
        options: skillKeys.map((value) => ({
          value,
          label: skillLabels[value],
        })),
      },
      ...skillKeys.map((skill) => ({
        id: ulujamFields.levels[skill],
        type: "rating",
        label: skillLabels[skill] + " seviyesi",
        required: true,
        min: 1,
        max: 5,
        condition: contains(skill),
      })),
      {
        id: ulujamFields.skillDescription,
        type: "long_text",
        label: "Becerilerinizin açıklaması",
        required: true,
        maxLength: 5000,
        helpText: "Seçtiğiniz alanlardaki deneyiminizi anlatın.",
        condition: { op: "or", conditions: pairs },
      },
      {
        id: ulujamFields.teamName,
        type: "short_text",
        label: "Takım adı",
        required: true,
        maxLength: 100,
        condition: mode("new"),
      },
      {
        id: ulujamFields.expectedSize,
        type: "number",
        label: "Beklenen toplam kişi sayısı",
        required: true,
        min: 1,
        max: 100,
        helpText:
          "Siz dahil toplam; etkinlik üst sınırı kayıt sırasında ayrıca kontrol edilir.",
        condition: mode("new"),
      },
      ...(choices.length
        ? [
            {
              id: ulujamFields.teamId,
              type: "dropdown",
              label: "Katılacağınız takım",
              required: true,
              options: choices.map((t) => ({ value: t.id, label: t.name })),
              condition: mode("existing"),
            },
          ]
        : [
            {
              id: ulujamFields.teamInfo,
              type: "info",
              label: "Takım seçimi",
              content: "Katılabileceğiniz bir takım henüz yok.",
              condition: mode("existing"),
            },
          ]),
    ],
  });
}
