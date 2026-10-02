import "server-only";
import { z } from "zod";
import {
  boundedJson,
  validateFormDefinition,
  type ValidFormDefinition,
} from "../domain/form-version.ts";
import {
  fieldIdSchema,
  parseAnswer,
  isEmpty,
  type Answers,
} from "../domain/field-types.ts";
import { evaluateVisibility } from "../domain/condition.ts";
export type ValidatedAnswers = Answers;
export function validateSubmission(
  version: { definition: ValidFormDefinition },
  input: unknown,
): ValidatedAnswers {
  const d = validateFormDefinition(version.definition);
  boundedJson(input);
  const raw = z.record(fieldIdSchema, z.unknown()).parse(input),
    byId = new Map(d.fields.map((f) => [f.id, f]));
  const answers: Answers = {};
  for (const [id, v] of Object.entries(raw)) {
    const f = byId.get(id);
    if (!f) throw Error("Bilinmeyen alan yanıtı");
    answers[id] = parseAnswer(f, v);
  }
  const visible = new Set(evaluateVisibility(d, answers));
  for (const id of Object.keys(raw))
    if (!visible.has(id)) throw Error("Gizli alan yanıtı reddedildi");
  for (const f of d.fields)
    if (
      visible.has(f.id) &&
      f.required &&
      (isEmpty(answers[f.id]) ||
        (["checkbox", "consent"].includes(f.type) && answers[f.id] !== true))
    )
      throw Error("Zorunlu alan yanıtı eksik");
  return answers;
}
