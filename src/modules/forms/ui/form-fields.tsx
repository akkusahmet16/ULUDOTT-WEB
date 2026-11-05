"use client";
import { useTranslator } from "../../../i18n/client.tsx";
import { clientTrSlice } from "../../../i18n/dictionaries/client-tr.ts";
import type { ValidFormDefinition } from "../domain/form-version";
import { evaluateVisibility } from "../domain/condition";
import type { Answer, Answers } from "../domain/field-types";
export const typeLabels: Record<string, string> = {
  short_text: clientTrSlice.forms.typeShortText,
  long_text: clientTrSlice.forms.typeLongText,
  email: clientTrSlice.forms.typeEmail,
  phone: clientTrSlice.forms.typePhone,
  number: clientTrSlice.forms.typeNumber,
  date: clientTrSlice.forms.typeDate,
  file: clientTrSlice.forms.typeFile,
  single_choice: clientTrSlice.forms.typeSingleChoice,
  multiple_choice: clientTrSlice.forms.typeMultipleChoice,
  dropdown: clientTrSlice.forms.typeDropdown,
  checkbox: clientTrSlice.forms.typeCheckbox,
  radio: clientTrSlice.forms.typeRadio,
  rating: clientTrSlice.forms.typeRating,
  info: clientTrSlice.forms.typeInfo,
  section: clientTrSlice.forms.typeSection,
  consent: clientTrSlice.forms.typeConsent,
};
export function FormFields({
  definition,
  answers,
  onChange,
  prefix = "answer",
  readOnlyConsent = false,
  fieldErrors = {},
  onFileChange,
  fileNames = {},
}: {
  definition: ValidFormDefinition;
  answers: Answers;
  onChange: (a: Answers) => void;
  prefix?: string;
  readOnlyConsent?: boolean;
  fieldErrors?: Record<string, string>;
  onFileChange?: (id: string, file: File | null) => void;
  fileNames?: Record<string, string>;
}) {
  const t = useTranslator();
  const visible = new Set(evaluateVisibility(definition, answers));
  function change(id: string, value: Answer | undefined) {
    const a = { ...answers };
    if (value === undefined) delete a[id];
    else a[id] = value;
    const shown = new Set(evaluateVisibility(definition, a));
    for (const k of Object.keys(a)) if (!shown.has(k)) delete a[k];
    onChange(a);
  }
  return (
    <>
      {definition.fields
        .filter((f) => visible.has(f.id))
        .map((f) => {
          const id = prefix + "-" + f.id,
            help = id + "-help",
            errorId = id + "-error",
            error = fieldErrors[f.id],
            constraints =
              f.type === "phone"
                ? t("forms.phoneConstraint")
                : f.type === "multiple_choice"
                  ? t("forms.multiChoiceConstraint", {
                      min: f.minSelections ?? (f.required ? 1 : 0),
                      max: f.maxSelections ?? f.options?.length ?? 0,
                    })
                  : ["short_text", "long_text"].includes(f.type)
                    ? t("forms.maxLengthConstraint", {
                        max:
                          f.maxLength ?? (f.type === "long_text" ? 5000 : 200),
                      })
                    : "",
            helpText = [f.helpText, constraints].filter(Boolean).join(" "),
            describedBy =
              [helpText ? help : null, error ? errorId : null]
                .filter(Boolean)
                .join(" ") || undefined,
            label = f.label + (f.required ? " *" : ""),
            v = answers[f.id];
          if (f.type === "section") return <h2 key={f.id}>{f.label}</h2>;
          if (f.type === "info")
            return (
              <section key={f.id} aria-label={f.label}>
                <h2>{f.label}</h2>
                <p>{f.content}</p>
              </section>
            );
          if (["checkbox", "consent"].includes(f.type))
            return (
              <div key={f.id}>
                {f.content && <p>{f.content}</p>}
                <label className="check-field" htmlFor={id}>
                  <input
                    id={id}
                    type="checkbox"
                    disabled={readOnlyConsent && f.type === "consent"}
                    checked={v === true}
                    required={f.required}
                    aria-describedby={describedBy}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => change(f.id, e.target.checked)}
                  />
                  {label}
                </label>
                {helpText && <p id={help}>{helpText}</p>}
                {error && <p id={errorId}>{error}</p>}
              </div>
            );
          if (["radio", "single_choice", "multiple_choice"].includes(f.type))
            return (
              <fieldset
                key={f.id}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
              >
                <legend>{label}</legend>
                {f.options?.map((o) => (
                  <label className="check-field" key={o.value}>
                    <input
                      type={f.type === "multiple_choice" ? "checkbox" : "radio"}
                      name={id}
                      checked={
                        f.type === "multiple_choice"
                          ? Array.isArray(v) && v.includes(o.value)
                          : v === o.value
                      }
                      required={f.required && f.type !== "multiple_choice"}
                      onChange={(e) =>
                        change(
                          f.id,
                          f.type === "multiple_choice"
                            ? e.target.checked
                              ? [...(Array.isArray(v) ? v : []), o.value]
                              : (Array.isArray(v) ? v : []).filter(
                                  (x) => x !== o.value,
                                )
                            : o.value,
                        )
                      }
                    />
                    {o.label}
                  </label>
                ))}
                {helpText && <p id={help}>{helpText}</p>}
                {error && <p id={errorId}>{error}</p>}
              </fieldset>
            );
          const props = {
            id,
            required: f.required,
            "aria-describedby": describedBy,
            "aria-invalid": error ? (true as const) : undefined,
          };
          return (
            <div className="field" key={f.id}>
              <label htmlFor={id}>{label}</label>
              {f.type === "file" ? (
                readOnlyConsent ? (
                  <p>{String(v ?? t("forms.noFileValue"))}</p>
                ) : (
                  <input
                    id={id}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                    required={f.required}
                    aria-describedby={describedBy}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      onFileChange?.(f.id, file);
                      change(f.id, file?.name);
                    }}
                  />
                )
              ) : f.type === "long_text" ? (
                <textarea
                  {...props}
                  value={String(v ?? "")}
                  maxLength={f.maxLength ?? 5000}
                  onChange={(e) => change(f.id, e.target.value)}
                />
              ) : f.type === "dropdown" ? (
                <select
                  {...props}
                  value={String(v ?? "")}
                  onChange={(e) => change(f.id, e.target.value || undefined)}
                >
                  <option value="">{t("common.selectOption")}</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...props}
                  type={
                    f.type === "email"
                      ? "email"
                      : f.type === "phone"
                        ? "tel"
                        : f.type === "date"
                          ? "date"
                          : ["number", "rating"].includes(f.type)
                            ? "number"
                            : "text"
                  }
                  value={typeof v === "number" ? v : String(v ?? "")}
                  min={f.min ?? (f.type === "rating" ? 1 : undefined)}
                  max={f.max ?? (f.type === "rating" ? 5 : undefined)}
                  step={f.type === "rating" ? 1 : "any"}
                  maxLength={
                    f.type === "short_text" ? (f.maxLength ?? 200) : undefined
                  }
                  onChange={(e) =>
                    change(
                      f.id,
                      e.target.value === ""
                        ? undefined
                        : ["number", "rating"].includes(f.type)
                          ? Number(e.target.value)
                          : e.target.value,
                    )
                  }
                />
              )}{" "}
              {helpText && <small id={help}>{helpText}</small>}
              {f.type === "file" && !readOnlyConsent && (
                <small>
                  {t("forms.fileFormatHint", {
                    fileName: fileNames[f.id] ?? "",
                  })}
                </small>
              )}
              {error && <small id={errorId}>{error}</small>}
            </div>
          );
        })}
    </>
  );
}
