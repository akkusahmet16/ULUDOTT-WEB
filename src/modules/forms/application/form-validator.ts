import "server-only";
import {
  AnswerValidationError,
  answerErrorMessage,
} from "../domain/answer-errors.ts";
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
  const fieldErrors: Record<string, string> = {};
  for (const [id, v] of Object.entries(raw)) {
    const f = byId.get(id);
    if (!f) throw Error("Bilinmeyen alan yanıtı");
    try {
      answers[id] = parseAnswer(f, v);
    } catch {
      fieldErrors[id] = answerErrorMessage(f);
    }
  }
  const visible = new Set(evaluateVisibility(d, answers));
  for (const id of Object.keys(raw))
    if (!visible.has(id) && !fieldErrors[id])
      throw Error("Gizli alan yanıtı reddedildi");
  for (const f of d.fields)
    if (
      visible.has(f.id) &&
      f.required &&
      (isEmpty(answers[f.id]) ||
        (["checkbox", "consent"].includes(f.type) && answers[f.id] !== true))
    )
      fieldErrors[f.id] ??= "Bu zorunlu alanı doldurun veya onaylayın.";
  if (Object.keys(fieldErrors).length)
    throw new AnswerValidationError(fieldErrors);
  return answers;
}
