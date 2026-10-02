"use client";
import { useState } from "react";
import { validateFormDefinition } from "../domain/form-version";
import type { Answers } from "../domain/field-types";
import { FormFields } from "./form-fields";
export function FormPreview({ definition }: { definition: unknown }) {
  const [answers, setAnswers] = useState<Answers>({}),
    [mobile, setMobile] = useState(false);
  let d;
  try {
    d = validateFormDefinition(definition);
  } catch {
    return <p>Önizleme için alanları ve kuralları tamamlayın.</p>;
  }
  return (
    <section aria-label="Taslak önizleme">
      <h2>Taslak önizleme</h2>
      <p>Bu önizleme yanıt kaydetmez.</p>
      <button
        className="button"
        type="button"
        onClick={() => setMobile(!mobile)}
      >
        {mobile ? "Masaüstü görünümü" : "Mobil görünüm"}
      </button>
      <div style={{ maxWidth: mobile ? 390 : 900 }}>
        <FormFields
          definition={d}
          answers={answers}
          onChange={setAnswers}
          prefix="preview"
        />
      </div>
    </section>
  );
}
