import { it, expect } from "vitest";
import { validateFormDefinition } from "../../src/modules/forms/domain/form-version";
import {
  evaluateVisibility,
  type Condition,
} from "../../src/modules/forms/domain/condition";
import { validateSubmission } from "../../src/modules/forms/application/form-validator";
const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const options = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];
const fields = [
  { type: "short_text", answer: "Ada" },
  { type: "long_text", answer: "Uzun not" },
  { type: "email", answer: "ada@example.test" },
  { type: "phone", answer: "+905551234567" },
  { type: "number", answer: 3 },
  { type: "date", answer: "2028-02-29" },
  { type: "single_choice", options, answer: "a" },
  { type: "multiple_choice", options, answer: ["a", "b"] },
  { type: "dropdown", options, answer: "b" },
  { type: "checkbox", answer: true },
  { type: "radio", options, answer: "a" },
  { type: "rating", min: 1, max: 5, answer: 4 },
  { type: "info", content: "Bilgi" },
  { type: "section" },
  {
    type: "consent",
    content: "Test rıza metni",
    consentVersion: "test-v1",
    purpose: "test",
    answer: true,
  },
];
it.each(fields)(
  "$type alan türünü merkezi validator işler",
  ({ answer, ...config }) => {
    const d = validateFormDefinition({
      fields: [{ id: id(1), label: "Test", ...config }],
    });
    const answers = answer === undefined ? {} : { [id(1)]: answer };
    expect(validateSubmission({ definition: d }, answers)).toEqual(answers);
  },
);
it("bilinmeyen tür/config/operatör, referans ve döngüyü reddeder", () => {
  const base = { id: id(1), type: "short_text", label: "Ad" };
  for (const f of [
    { ...base, type: "file" },
    { ...base, script: "eval()" },
    { ...base, condition: { op: "execute", fieldId: id(1) } },
    { ...base, condition: { op: "eq", fieldId: id(2), value: "x" } },
  ])
    expect(() => validateFormDefinition({ fields: [f] })).toThrow();
  expect(() =>
    validateFormDefinition({
      fields: [
        { ...base, condition: { op: "eq", fieldId: id(2), value: "x" } },
        {
          ...base,
          id: id(2),
          condition: { op: "eq", fieldId: id(1), value: "x" },
        },
      ],
    }),
  ).toThrow();
  expect(() => validateFormDefinition({ fields: [base, base] })).toThrow();
  expect(() =>
    validateFormDefinition({
      fields: [
        base,
        {
          id: id(2),
          type: "short_text",
          label: "Not",
          condition: { op: "gt", fieldId: id(1), value: 2 },
        },
      ],
    }),
  ).toThrow();
});
it("gizli değer enjeksiyonunu reddeder ve gizli referanslar koşul sağlayamaz", () => {
  const d = validateFormDefinition({
    fields: [
      { id: id(1), type: "checkbox", label: "Takım" },
      {
        id: id(2),
        type: "short_text",
        label: "Takım adı",
        required: true,
        condition: { op: "eq", fieldId: id(1), value: true },
      },
      {
        id: id(3),
        type: "short_text",
        label: "Gizli zincir",
        condition: { op: "is_empty", fieldId: id(2) },
      },
    ],
  });
  expect(evaluateVisibility(d, { [id(1)]: false })).toEqual([id(1)]);
  expect(validateSubmission({ definition: d }, { [id(1)]: false })).toEqual({
    [id(1)]: false,
  });
  expect(() =>
    validateSubmission({ definition: d }, { [id(1)]: false, [id(2)]: "kaçak" }),
  ).toThrow();
  expect(() =>
    validateSubmission({ definition: d }, { [id(1)]: true }),
  ).toThrow();
  expect(
    validateSubmission({ definition: d }, { [id(1)]: true, [id(2)]: "Ada" }),
  ).toEqual({ [id(1)]: true, [id(2)]: "Ada" });
});
it.each([
  ["number", "3"],
  ["rating", 1.5],
  ["rating", 6],
  ["email", "x"],
  ["phone", "555123"],
  ["date", "2027-02-29"],
  ["checkbox", "true"],
  ["short_text", 123],
  ["single_choice", "c"],
  ["multiple_choice", ["a", "a"]],
  ["multiple_choice", "a"],
])("%s yanlış tip/değeri reddeder", (type, answer) => {
  const f = {
    id: id(1),
    type,
    label: "Test",
    ...(String(type).includes("choice") ? { options } : {}),
  };
  const d = validateFormDefinition({ fields: [f] });
  expect(() =>
    validateSubmission({ definition: d }, { [id(1)]: answer }),
  ).toThrow();
});
it("rıza, bilgi alanı, bilinmeyen cevap ve veri limitlerini korur", () => {
  const d = validateFormDefinition({
    fields: [
      {
        id: id(1),
        type: "consent",
        label: "Rıza",
        required: true,
        content: "Test",
        consentVersion: "v1",
        purpose: "test",
      },
      { id: id(2), type: "info", label: "Bilgi", content: "Test" },
    ],
  });
  for (const a of [
    {},
    { [id(1)]: false },
    { [id(1)]: true, [id(2)]: "x" },
    { [id(1)]: true, [id(3)]: "x" },
  ])
    expect(() => validateSubmission({ definition: d }, a)).toThrow();
  expect(() =>
    validateFormDefinition({
      fields: Array.from({ length: 101 }, (_, i) => ({
        id: id(i),
        type: "short_text",
        label: "Ad",
      })),
    }),
  ).toThrow();
  let c: Condition = { op: "eq", fieldId: id(1), value: true };
  for (let i = 0; i < 20; i++) c = { op: "and", conditions: [c] };
  expect(() =>
    validateFormDefinition({
      fields: [
        { id: id(1), type: "checkbox", label: "Ad" },
        { id: id(2), type: "short_text", label: "Not", condition: c },
      ],
    }),
  ).toThrow();
});
it("izinli grup, liste ve sayı koşullarını değerlendirir", () => {
  const d = validateFormDefinition({
    fields: [
      { id: id(1), type: "number", label: "Sayı" },
      { id: id(2), type: "multiple_choice", label: "Seçim", options },
      {
        id: id(3),
        type: "short_text",
        label: "Not",
        condition: {
          op: "and",
          conditions: [
            { op: "gte", fieldId: id(1), value: 2 },
            { op: "contains", fieldId: id(2), value: "b" },
          ],
        },
      },
    ],
  });
  expect(evaluateVisibility(d, { [id(1)]: 2, [id(2)]: ["b"] })).toEqual([
    id(1),
    id(2),
    id(3),
  ]);
  expect(evaluateVisibility(d, { [id(1)]: 1, [id(2)]: ["b"] })).toEqual([
    id(1),
    id(2),
  ]);
});

it("boşluk yanıtı zorunlu metni karşılamaz; UUID küçük harf kimliği tutarlıdır", () => {
  const d = validateFormDefinition({
    fields: [{ id: id(1), type: "short_text", label: "Ad", required: true }],
  });
  expect(() =>
    validateSubmission({ definition: d }, { [id(1)]: "   " }),
  ).toThrow();
  expect(() =>
    validateFormDefinition({
      fields: [
        {
          id: "ABCDEF00-0000-4000-8000-000000000001",
          type: "short_text",
          label: "Ad",
        },
      ],
    }),
  ).toThrow();
});
it.each([
  ["eq", 2, 2, true],
  ["neq", 2, 3, true],
  ["gt", 3, 2, true],
  ["gte", 2, 2, true],
  ["lt", 1, 2, true],
  ["lte", 2, 2, true],
  ["in", 2, [1, 2], true],
  ["is_empty", undefined, undefined, true],
  ["neq", undefined, 3, false],
])("%s operatörü izinli anlamıyla işler", (op, answer, value, show) => {
  const d = validateFormDefinition({
    fields: [
      { id: id(1), type: "number", label: "Sayı" },
      {
        id: id(2),
        type: "short_text",
        label: "Not",
        condition: {
          op,
          fieldId: id(1),
          ...(value === undefined ? {} : { value }),
        },
      },
    ],
  });
  expect(
    evaluateVisibility(
      d,
      answer === undefined ? {} : { [id(1)]: answer },
    ).includes(id(2)),
  ).toBe(show);
});
it("OR, boş grup, yanlış liste türü ve yasak yapılandırmayı denetler", () => {
  const f = { id: id(1), type: "short_text", label: "Metin" };
  const d = validateFormDefinition({
    fields: [
      f,
      {
        id: id(2),
        type: "section",
        label: "Bölüm",
        condition: {
          op: "or",
          conditions: [
            { op: "contains", fieldId: id(1), value: "Ada" },
            { op: "is_empty", fieldId: id(1) },
          ],
        },
      },
    ],
  });
  expect(evaluateVisibility(d, { [id(1)]: "Ada burada" })).toEqual([
    id(1),
    id(2),
  ]);
  for (const c of [
    { op: "and", conditions: [] },
    { op: "in", fieldId: id(1), value: [1] },
    { op: "is_empty", fieldId: id(1), value: "x" },
  ])
    expect(() =>
      validateFormDefinition({
        fields: [
          f,
          { id: id(2), type: "short_text", label: "Not", condition: c },
        ],
      }),
    ).toThrow();
  for (const config of [{ min: 1 }, { options: [{ value: "x", label: "X" }] }])
    expect(() =>
      validateFormDefinition({ fields: [{ ...f, ...config }] }),
    ).toThrow();
  const limited = validateFormDefinition({ fields: [{ ...f, maxLength: 3 }] });
  expect(() =>
    validateSubmission({ definition: limited }, { [id(1)]: "uzun" }),
  ).toThrow();
});

it("bir amaç/sürüm için çelişen iki rıza alanını reddeder", () => {
  const consent = {
    type: "consent",
    label: "Rıza",
    content: "Metin A",
    purpose: "test",
    consentVersion: "v1",
  };
  expect(() =>
    validateFormDefinition({
      fields: [
        { ...consent, id: id(1) },
        { ...consent, id: id(2), content: "Metin B" },
      ],
    }),
  ).toThrow();
});
