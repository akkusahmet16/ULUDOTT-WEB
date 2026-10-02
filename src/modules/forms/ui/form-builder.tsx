"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ValidFormDefinition } from "../domain/form-version";
import { fieldTypes, choiceTypes, displayTypes } from "../domain/field-types";
import type { Condition } from "../domain/condition";
import type { FormSettings as Settings } from "../domain/form-settings";
import { FormSettings, emptySettings } from "./form-settings";
import { FormPreview } from "./form-preview";
import { typeLabels } from "./form-fields";
import { formRequest } from "./admin-fetch";
type Field = ValidFormDefinition["fields"][number];
export function FormCreator({
  events,
}: {
  events: { id: string; title: string }[];
}) {
  const router = useRouter(),
    [eventId, setEvent] = useState(events[0]?.id ?? ""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section>
      <h2>Yeni form</h2>
      <p role="status">{message}</p>
      <label className="field">
        Etkinlik
        <select value={eventId} onChange={(e) => setEvent(e.target.value)}>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </label>
      {events.length ? (
        <FormSettings
          initial={emptySettings}
          busy={busy}
          onSave={async (settings) => {
            setBusy(true);
            try {
              const r = await formRequest("/api/admin/forms", {
                eventId,
                settings,
              });
              router.push("/admin/formlar/" + r.id);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Kaydedilemedi");
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : (
        <p>Yetkili olduğunuz etkinlik bulunmuyor.</p>
      )}
    </section>
  );
}
function OptionsEditor({
  options,
  onChange,
}: {
  options: Field["options"];
  onChange: (options: NonNullable<Field["options"]>) => void;
}) {
  const [text, setText] = useState(
    options?.map((o) => o.value).join("\n") ?? "",
  );
  return (
    <label className="field">
      Seçenekler (her satıra bir değer)
      <textarea
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          onChange(
            raw
              .split("\n")
              .filter(Boolean)
              .map((value) => ({
                value,
                label: options?.find((o) => o.value === value)?.label ?? value,
              })),
          );
        }}
      />
    </label>
  );
}
export function FormBuilder({
  form,
}: {
  form: {
    id: string;
    status: string;
    revision: number;
    settings: Settings;
    definition: ValidFormDefinition | null;
    hasPublished: boolean;
  };
}) {
  const [fields, setFields] = useState<Field[]>(form.definition?.fields ?? []),
    [savedFields, setSavedFields] = useState<Field[]>(
      form.definition?.fields ?? [],
    ),
    [revision, setRevision] = useState(form.revision),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  function patch(index: number, updates: Partial<Field>) {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  }
  function move(i: number, delta: number) {
    const a = [...fields];
    [a[i], a[i + delta]] = [a[i + delta], a[i]];
    setFields(a);
  }
  async function action(action: string, input?: unknown) {
    if (
      action !== "definition" &&
      JSON.stringify(fields) !== JSON.stringify(savedFields)
    ) {
      setMessage("Önce alan değişikliklerini kaydedin.");
      return;
    }
    setBusy(true);
    try {
      const saved = await formRequest("/api/admin/forms/" + form.id, {
        action,
        input,
        expectedRevision: revision,
      });
      setRevision(saved.revision);
      if (action === "definition") setSavedFields(fields);
      setMessage("Kaydedildi.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  function leaf(i: number, op: string, refId: string, text: string) {
    const ref = fields.find((f) => f.id === refId);
    const scalar = (v: string) =>
      ["checkbox", "consent"].includes(ref?.type ?? "")
        ? v === "true"
        : ["number", "rating"].includes(ref?.type ?? "")
          ? Number(v)
          : v;
    patch(i, {
      condition: {
        op,
        fieldId: refId,
        ...(op === "is_empty"
          ? {}
          : {
              value: op === "in" ? text.split(",").map(scalar) : scalar(text),
            }),
      } as Condition,
    });
  }
  return (
    <>
      <p role="status">{message}</p>
      <p>
        Durum: {form.status} · Sürüm kontrolü: {form.revision}
      </p>
      {form.hasPublished && (
        <p>
          Alan değişiklikleri yeni form sürümü olarak yayımlanır. Önceki
          başvurular korunur.
        </p>
      )}
      <h2>Form ayarları</h2>
      <FormSettings
        key={form.revision}
        initial={form.settings}
        busy={busy}
        onSave={(s) => action("settings", s)}
      />
      <h2>Alanlar</h2>
      <p>Dosya yükleme bu sürümde desteklenmiyor.</p>
      {fields.map((f, i) => {
        const c = f.condition && "fieldId" in f.condition ? f.condition : null;
        return (
          <fieldset key={f.id} disabled={busy}>
            <legend>Alan {i + 1}</legend>
            <label className="field">
              Alan türü
              <select
                value={f.type}
                onChange={(e) => {
                  const type = e.target.value as Field["type"];
                  setFields(
                    fields.map((old, n) =>
                      n === i
                        ? {
                            id: old.id,
                            type,
                            label: old.label,
                            required: false,
                            ...(choiceTypes.includes(type)
                              ? {
                                  options: [
                                    { value: "seçenek", label: "Seçenek" },
                                  ],
                                }
                              : {}),
                            ...(type === "info" || type === "consent"
                              ? { content: "" }
                              : {}),
                            ...(type === "consent"
                              ? { consentVersion: "", purpose: "" }
                              : {}),
                          }
                        : old,
                    ),
                  );
                }}
              >
                {fieldTypes.map((t) => (
                  <option value={t} key={t}>
                    {typeLabels[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Alan etiketi
              <input
                value={f.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                maxLength={160}
              />
            </label>
            <label className="field">
              Yardımcı metin
              <input
                value={f.helpText ?? ""}
                onChange={(e) => patch(i, { helpText: e.target.value })}
                maxLength={500}
              />
            </label>
            {!displayTypes.includes(f.type) && (
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => patch(i, { required: e.target.checked })}
                />
                Zorunlu alan
              </label>
            )}
            {choiceTypes.includes(f.type) && (
              <OptionsEditor
                key={f.id + f.type}
                options={f.options}
                onChange={(options) => patch(i, { options })}
              />
            )}
            {(["number", "rating"].includes(f.type)
              ? ["min", "max"]
              : f.type === "multiple_choice"
                ? ["minSelections", "maxSelections"]
                : ["short_text", "long_text"].includes(f.type)
                  ? ["maxLength"]
                  : []
            ).map((k) => (
              <label className="field" key={k}>
                {
                  (
                    {
                      min: "En küçük sayı",
                      max: "En büyük sayı",
                      minSelections: "En az seçim",
                      maxSelections: "En çok seçim",
                      maxLength: "En çok karakter",
                    } as Record<string, string>
                  )[k]
                }
                <input
                  type="number"
                  value={(f[k as keyof Field] as number) ?? ""}
                  onChange={(e) =>
                    patch(i, {
                      [k]: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </label>
            ))}
            {(f.type === "info" || f.type === "consent") && (
              <label className="field">
                Alan metni
                <textarea
                  value={f.content ?? ""}
                  onChange={(e) => patch(i, { content: e.target.value })}
                />
              </label>
            )}
            {f.type === "consent" && (
              <>
                <label className="field">
                  Rıza metni sürümü
                  <input
                    value={f.consentVersion ?? ""}
                    onChange={(e) =>
                      patch(i, { consentVersion: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  Rıza amacı
                  <input
                    value={f.purpose ?? ""}
                    onChange={(e) => patch(i, { purpose: e.target.value })}
                  />
                </label>
              </>
            )}
            <label className="field">
              Görünürlük kuralı
              <select
                value={c?.fieldId ?? ""}
                onChange={(e) =>
                  e.target.value
                    ? leaf(i, "eq", e.target.value, "")
                    : patch(i, { condition: undefined })
                }
              >
                <option value="">Her zaman görünür</option>
                {fields
                  .filter(
                    (x) => x.id !== f.id && !displayTypes.includes(x.type),
                  )
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label || "Etiketsiz alan"}
                    </option>
                  ))}
              </select>
            </label>
            {f.condition && !c && (
              <p>Birleşik kural korunuyor. Değiştirmek için bir alan seçin.</p>
            )}
            {c && (
              <>
                <label className="field">
                  Kural işlemi
                  <select
                    value={c.op}
                    onChange={(e) =>
                      leaf(i, e.target.value, c.fieldId, String(c.value ?? ""))
                    }
                  >
                    {[
                      "eq",
                      "neq",
                      "gt",
                      "gte",
                      "lt",
                      "lte",
                      "contains",
                      "in",
                      "is_empty",
                    ].map((op) => (
                      <option key={op} value={op}>
                        {
                          (
                            {
                              eq: "Eşit",
                              neq: "Eşit değil",
                              gt: "Büyük",
                              gte: "Büyük veya eşit",
                              lt: "Küçük",
                              lte: "Küçük veya eşit",
                              contains: "İçerir",
                              in: "Listedekilerden biri",
                              is_empty: "Boş",
                            } as Record<string, string>
                          )[op]
                        }
                      </option>
                    ))}
                  </select>
                </label>
                {c.op !== "is_empty" && (
                  <label className="field">
                    Kural değeri
                    <input
                      value={String(c.value ?? "")}
                      onChange={(e) => leaf(i, c.op, c.fieldId, e.target.value)}
                    />
                    <small>
                      Onay için true/false; liste için virgülle ayırın.
                    </small>
                  </label>
                )}
              </>
            )}
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              Yukarı taşı
            </button>
            <button
              type="button"
              disabled={i === fields.length - 1}
              onClick={() => move(i, 1)}
            >
              Aşağı taşı
            </button>
            <button
              type="button"
              onClick={() => setFields(fields.filter((_, n) => n !== i))}
            >
              Alanı sil
            </button>
          </fieldset>
        );
      })}
      <button
        className="button"
        disabled={busy || fields.length >= 100}
        onClick={() =>
          setFields([
            ...fields,
            {
              id: crypto.randomUUID(),
              type: "short_text",
              label: "Yeni alan",
              required: false,
            },
          ])
        }
      >
        Alan ekle
      </button>
      <button
        className="button"
        disabled={busy}
        onClick={() => void action("definition", { schemaVersion: 1, fields })}
      >
        Alanları kaydet
      </button>
      <FormPreview definition={{ schemaVersion: 1, fields }} />
      <h2>Yayın yönetimi</h2>
      <button
        className="button"
        disabled={busy}
        onClick={() => void action("publish")}
      >
        Yayımla / devam ettir
      </button>
      <button
        className="button"
        disabled={busy || !form.hasPublished}
        onClick={() => void action("pause")}
      >
        Duraklat
      </button>
      <button
        className="button"
        disabled={busy || !form.hasPublished}
        onClick={() => void action("close")}
      >
        Kapat
      </button>
    </>
  );
}
