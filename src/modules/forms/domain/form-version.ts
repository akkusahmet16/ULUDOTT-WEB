import { z } from "zod";
import { fieldSchema, validateField, type Field } from "./field-types.ts";
import {
  conditionSchema,
  validateConditions,
  type Condition,
} from "./condition.ts";
export type ValidFormDefinition = {
  schemaVersion: 1;
  fields: (Field & { condition?: Condition })[];
};
export type FormVersion = {
  id: string;
  formId: string;
  version: number;
  definition: ValidFormDefinition;
  publishedAt: Date | null;
};
// Preflight bounds run before recursive schema parsing; cycles, instances and exotic keys are forbidden.
export function boundedJson(input: unknown, maxBytes = 100_000): void {
  const seen = new Set<object>();
  let nodes = 0;
  function walk(v: unknown, depth: number) {
    if (++nodes > 10000 || depth > 16) throw Error("JSON sınırı aşıldı");
    if (v === null || typeof v !== "object") {
      if (
        !["string", "number", "boolean", "undefined"].includes(typeof v) ||
        (typeof v === "number" && !Number.isFinite(v))
      )
        throw Error("Geçersiz JSON");
      return;
    }
    if (seen.has(v)) throw Error("JSON döngüsü");
    if (
      !Array.isArray(v) &&
      Object.getPrototypeOf(v) !== Object.prototype &&
      Object.getPrototypeOf(v) !== null
    )
      throw Error("JSON nesnesi gerekli");
    seen.add(v);
    for (const [k, x] of Object.entries(v)) {
      if (["__proto__", "constructor", "prototype"].includes(k))
        throw Error("Geçersiz JSON anahtarı");
      walk(x, depth + 1);
    }
    seen.delete(v);
  }
  walk(input, 0);
  const s = JSON.stringify(input);
  if (!s || new TextEncoder().encode(s).length > maxBytes)
    throw Error("JSON boyutu aşıldı");
}
const definitionSchema = z.strictObject({
  schemaVersion: z.literal(1).default(1),
  fields: z
    .array(fieldSchema.extend({ condition: conditionSchema.optional() }))
    .min(1)
    .max(100),
});
export function validateFormDefinition(input: unknown): ValidFormDefinition {
  boundedJson(input);
  const d = definitionSchema.parse(input);
  if (new Set(d.fields.map((f) => f.id)).size !== d.fields.length)
    throw Error("Tekrarlı alan kimliği");
  for (const f of d.fields) validateField(f);
  validateConditions(d);
  return d;
}
