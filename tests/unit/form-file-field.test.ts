import { expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { validateFormDefinition } from "../../src/modules/forms/domain/form-version";
import { validateSubmission } from "../../src/modules/forms/application/form-validator";

it("accepts a required file question and rejects an empty answer", () => {
  const id = randomUUID();
  const definition = validateFormDefinition({ schemaVersion: 1, fields: [
    { id, type: "file", label: "Portfolyo", required: true },
  ] });
  expect(validateSubmission({ definition }, { [id]: "portfolyo.pdf" })[id]).toBe("portfolyo.pdf");
  expect(() => validateSubmission({ definition }, {})).toThrow();
});

it("limits file questions to the multipart upload capacity", () => {
  expect(() => validateFormDefinition({ schemaVersion: 1, fields: Array.from({ length: 4 }, (_, index) => ({
    id: randomUUID(), type: "file", label: `Dosya ${index + 1}`,
  })) })).toThrow("en fazla 3 dosya");
});
