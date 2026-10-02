import type { ValidFormDefinition } from "./form-version.ts";
export function emailIdentity(d: ValidFormDefinition) {
  const fields = d.fields.filter(
    (f) => f.type === "email" && f.required && !f.condition,
  );
  return fields.length === 1 ? fields[0] : null;
}
