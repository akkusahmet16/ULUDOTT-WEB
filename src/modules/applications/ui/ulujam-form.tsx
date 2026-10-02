"use client";
import { useState } from "react";
import { FormFields } from "../../forms/ui/form-fields";
import type { ValidFormDefinition } from "../../forms/domain/form-version";
import { evaluateVisibility } from "../../forms/domain/condition";
import {
  isEmpty,
  parseAnswer,
  displayTypes,
  type Answers,
} from "../../forms/domain/field-types";
import { validateUlujamInput, ulujamFields as f } from "../domain/ulujam-input";
import type { Skill } from "../../matching/domain/skills";
export function UlujamForm({
  eventId,
  definition,
}: {
  eventId: string;
  definition: ValidFormDefinition;
}) {
  const [answers, setAnswers] = useState<Answers>({ [f.mode]: "solo" }),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({});
  function change(next: Answers) {
    if (
      next[f.mode] !== answers[f.mode] ||
      next[f.teamId] !== answers[f.teamId]
    )
      setPassword("");
    setAnswers(next);
    setMessage("");
    setErrors({});
  }
  function check() {
    const errors: Record<string, string> = {};
    const visible = new Set(evaluateVisibility(definition, answers));
    for (const field of definition.fields) {
      if (!visible.has(field.id) || displayTypes.includes(field.type)) continue;
      const value = answers[field.id];
      try {
        if (isEmpty(value)) {
          if (field.required) throw Error("required");
        } else parseAnswer(field, value);
      } catch {
        errors[field.id] = "Bu alanı kontrol edin.";
      }
    }
    setErrors(errors);
    if (Object.keys(errors).length) {
      setMessage("İşaretli alanları kontrol edin.");
      return;
    }
    const mode = answers[f.mode],
      selected = answers[f.skills];
    const raw = {
      eventId,
      fullName: answers[f.fullName],
      email: answers[f.email],
      phone: answers[f.phone],
      mode,
      skills: Array.isArray(selected)
        ? selected.map((skill) => ({
            skill,
            level: answers[f.levels[skill as Skill]],
          }))
        : [],
      ...(answers[f.skillDescription] !== undefined
        ? { skillDescription: answers[f.skillDescription] }
        : {}),
      ...(mode === "new"
        ? {
            teamName: answers[f.teamName],
            expectedSize: answers[f.expectedSize],
          }
        : {}),
      ...(mode === "existing" ? { teamId: answers[f.teamId], password } : {}),
    };
    try {
      validateUlujamInput(raw);
      setMessage("Önizleme doğrulandı; başvuru kaydedilmedi.");
    } catch {
      setMessage(
        "Telefon, beceri seviyeleri, açıklama ve takım alanlarını kontrol edin.",
      );
    }
  }
  return (
    <section aria-label="UluJam özel form önizlemesi">
      <p>Bu önizleme başvuru kaydetmez.</p>
      <p>
        Takım parolası yalnız geçici olarak bu ekranda tutulur; takım erişimi
        burada doğrulanmaz.
      </p>
      <form
        noValidate
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <FormFields
          definition={definition}
          answers={answers}
          onChange={change}
          prefix="ulujam"
          fieldErrors={errors}
        />
        {answers[f.mode] === "existing" && (
          <div className="field">
            <label htmlFor="ulujam-password">Takım parolası *</label>
            <input
              id="ulujam-password"
              type="password"
              autoComplete="off"
              required
              maxLength={128}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setMessage("");
              }}
            />
          </div>
        )}
        <button type="submit">Alanları kontrol et</button>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
