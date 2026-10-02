import { z } from "zod";
import {
  fieldIdSchema,
  displayTypes,
  isEmpty,
  parseAnswer,
  type Answers,
} from "./field-types.ts";
import type { ValidFormDefinition } from "./form-version.ts";
export type Scalar = string | number | boolean;
export type Condition =
  | { op: "and" | "or"; conditions: Condition[] }
  | {
      op:
        | "eq"
        | "neq"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "contains"
        | "in"
        | "is_empty";
      fieldId: string;
      value?: Scalar | Scalar[];
    };
const scalar = z.union([
  z.string().max(5000),
  z.number().finite(),
  z.boolean(),
]);
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({
      op: z.enum(["and", "or"]),
      conditions: z.array(conditionSchema).min(1).max(10),
    }),
    z.strictObject({
      op: z.enum([
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "in",
        "is_empty",
      ]),
      fieldId: fieldIdSchema,
      value: z.union([scalar, z.array(scalar).min(1).max(50)]).optional(),
    }),
  ]),
);
function leaves(c: Condition): Extract<Condition, { fieldId: string }>[] {
  return "conditions" in c ? c.conditions.flatMap(leaves) : [c];
}
export function validateConditions(d: ValidFormDefinition): void {
  const byId = new Map(d.fields.map((f) => [f.id, f]));
  for (const f of d.fields) {
    if (!f.condition) continue;
    for (const c of leaves(f.condition)) {
      const ref = byId.get(c.fieldId);
      if (!ref || displayTypes.includes(ref.type))
        throw Error("Koşul alan referansı geçersiz");
      if (c.op === "is_empty") {
        if (c.value !== undefined) throw Error("is_empty değer alamaz");
        continue;
      }
      if (c.value === undefined) throw Error("Koşul değeri gerekli");
      if (["gt", "gte", "lt", "lte"].includes(c.op)) {
        if (
          !["number", "rating"].includes(ref.type) ||
          typeof c.value !== "number"
        )
          throw Error("Koşul türü uyuşmuyor");
      } else if (c.op === "contains") {
        if (
          !["multiple_choice", "short_text", "long_text"].includes(ref.type) ||
          typeof c.value !== "string"
        )
          throw Error("Koşul türü uyuşmuyor");
        if (
          ref.type === "multiple_choice" &&
          !ref.options!.some((o) => o.value === c.value)
        )
          throw Error("Bilinmeyen koşul seçeneği");
      } else {
        if (
          ref.type === "multiple_choice" ||
          (Array.isArray(c.value) && c.op !== "in") ||
          (c.op === "in" && !Array.isArray(c.value))
        )
          throw Error("Koşul türü uyuşmuyor");
        for (const v of Array.isArray(c.value) ? c.value : [c.value])
          parseAnswer(ref, v);
      }
    }
  }
  const visiting = new Set<string>(),
    done = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw Error("Koşul döngüsü");
    if (done.has(id)) return;
    visiting.add(id);
    const f = byId.get(id)!;
    if (f.condition) for (const c of leaves(f.condition)) visit(c.fieldId);
    visiting.delete(id);
    done.add(id);
  }
  for (const f of d.fields) visit(f.id);
}
export type VisibleFieldIds = string[];
export function evaluateVisibility(
  d: ValidFormDefinition,
  answers: Answers,
): VisibleFieldIds {
  const byId = new Map(d.fields.map((f) => [f.id, f])),
    memo = new Map<string, boolean>();
  function visible(id: string): boolean {
    if (memo.has(id)) return memo.get(id)!;
    const f = byId.get(id)!;
    const v = !f.condition || check(f.condition);
    memo.set(id, v);
    return v;
  }
  function check(c: Condition): boolean {
    if ("conditions" in c)
      return c.op === "and"
        ? c.conditions.every(check)
        : c.conditions.some(check);
    if (!visible(c.fieldId)) return false;
    const a = answers[c.fieldId],
      v = c.value;
    if (c.op === "is_empty") return isEmpty(a);
    if (isEmpty(a)) return false;
    switch (c.op) {
      case "eq":
        return a === v;
      case "neq":
        return a !== v;
      case "gt":
        return typeof a === "number" && a > (v as number);
      case "gte":
        return typeof a === "number" && a >= (v as number);
      case "lt":
        return typeof a === "number" && a < (v as number);
      case "lte":
        return typeof a === "number" && a <= (v as number);
      case "contains":
        return (
          (typeof a === "string" || Array.isArray(a)) && a.includes(v as string)
        );
      case "in":
        return (v as Scalar[]).includes(a as Scalar);
    }
  }
  return d.fields.filter((f) => visible(f.id)).map((f) => f.id);
}
