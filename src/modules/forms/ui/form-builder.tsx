"use client";
import { buildUlujamFormDefinition } from "../../applications/domain/ulujam-input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  validateFormDefinition,
  type ValidFormDefinition,
} from "../domain/form-version";
import { fieldTypes, choiceTypes, displayTypes } from "../domain/field-types";
import type { Condition } from "../domain/condition";
import type { FormSettings as Settings } from "../domain/form-settings";
import { FormSettings, emptySettings } from "./form-settings";
import { FormPreview } from "./form-preview";
import { typeLabels } from "./form-fields";
import { formRequest } from "./admin-fetch";
import { FormLinkPill } from "./form-link-actions";
type Field = ValidFormDefinition["fields"][number];
type DraftQuestion = {
  id: string;
  type: Field["type"];
  label: string;
  required: boolean;
  helpText: string;
  choices: string;
};
const draftQuestion = (): DraftQuestion => ({
  id: crypto.randomUUID(),
  type: "short_text",
  label: "",
  required: true,
  helpText: "",
  choices: "",
});
function toField(question: DraftQuestion): Field {
  return {
    id: question.id,
    type: question.type,
    label: question.label.trim(),
    required: question.required,
    ...(question.helpText.trim() ? { helpText: question.helpText.trim() } : {}),
    ...(choiceTypes.includes(question.type)
      ? {
          options: question.choices
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((label, index) => ({ value: `secenek-${index + 1}`, label })),
        }
      : {}),
    ...(question.type === "file"
      ? { helpText: "PDF, PNG, JPEG veya WebP · en fazla 5 MiB" }
      : {}),
  };
}
export function FormCreator({
  events,
}: {
  events: { id: string; title: string; kind: string }[];
}) {
  const router = useRouter(),
    [eventId, setEvent] = useState(events[0]?.id ?? ""),
    [questions, setQuestions] = useState<DraftQuestion[]>([draftQuestion()]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const isUlujam =
    events.find((event) => event.id === eventId)?.kind === "ulujam";
  return (
    <section className="admin-form-creator">
      <p className="eyebrow">01 / FORM OLUŞTUR</p>
      <h2>Yeni form</h2>
      <p>
        Başvuru veya anket sorularını burada belirleyin. Taslak oluşturulduktan
        sonra gelişmiş koşullar ve önizleme düzenlenebilir.
      </p>
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
      {isUlujam ? (
        <section aria-label="UluJam başvuru şablonu">
          <h3>UluJam başvuru şablonu</h3>
          <p>
            Katılımcı bilgileri, beceriler ve takım seçenekleri hazır gelir.
            Taslağı oluşturduktan sonra soruları ve başvuru tarihlerini
            düzenleyebilirsiniz.
          </p>
          <FormPreview
            key={eventId}
            definition={buildUlujamFormDefinition(eventId)}
          />
        </section>
      ) : (
        <div className="admin-question-list">
          {questions.map((question, index) => (
            <fieldset key={question.id} className="admin-question-card">
              <legend>Soru {index + 1}</legend>
              <label className="field">
                Soru / alan başlığı
                <input
                  value={question.label}
                  maxLength={160}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((q) =>
                        q.id === question.id
                          ? { ...q, label: e.target.value }
                          : q,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                Yanıt türü
                <select
                  value={question.type}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((q) =>
                        q.id === question.id
                          ? { ...q, type: e.target.value as Field["type"] }
                          : q,
                      ),
                    )
                  }
                >
                  <optgroup label="Temel Soru Çeşitleri">
                    <option value="short_text">Kısa cevap yazma sorusu</option>
                    <option value="single_choice">Çoktan seçmeli soru</option>
                    <option value="multiple_choice">Çoklu seçim sorusu</option>
                  </optgroup>
                  <optgroup label="Diğer Soru Türleri">
                    {fieldTypes
                      .filter(
                        (type) =>
                          ![
                            "info",
                            "section",
                            "consent",
                            "short_text",
                            "single_choice",
                            "multiple_choice",
                          ].includes(type) &&
                          !(
                            type === "file" &&
                            events.find((event) => event.id === eventId)
                              ?.kind === "ulujam"
                          ),
                      )
                      .map((type) => (
                        <option key={type} value={type}>
                          {typeLabels[type]}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </label>
              {choiceTypes.includes(question.type) && (
                <label className="field">
                  Seçenekler (her satıra bir seçenek)
                  <textarea
                    value={question.choices}
                    onChange={(e) =>
                      setQuestions(
                        questions.map((q) =>
                          q.id === question.id
                            ? { ...q, choices: e.target.value }
                            : q,
                        ),
                      )
                    }
                  />
                </label>
              )}
              <label className="field">
                Yardımcı açıklama
                <input
                  value={question.helpText}
                  maxLength={500}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((q) =>
                        q.id === question.id
                          ? { ...q, helpText: e.target.value }
                          : q,
                      ),
                    )
                  }
                />
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((q) =>
                        q.id === question.id
                          ? { ...q, required: e.target.checked }
                          : q,
                      ),
                    )
                  }
                />{" "}
                Zorunlu yanıt
              </label>
              <button
                type="button"
                disabled={questions.length === 1}
                onClick={() =>
                  setQuestions(questions.filter((q) => q.id !== question.id))
                }
              >
                Soruyu kaldır
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() => setQuestions([...questions, draftQuestion()])}
          >
            + Soru ekle
          </button>
        </div>
      )}
      {events.length ? (
        <FormSettings
          initial={emptySettings}
          busy={busy}
          onSave={async (settings) => {
            setBusy(true);
            try {
              if (
                !isUlujam &&
                questions.some(
                  (question) =>
                    !question.label.trim() ||
                    (choiceTypes.includes(question.type) &&
                      !question.choices.trim()),
                )
              )
                throw Error("Soruların başlığını ve seçeneklerini doldurun.");
              const definition = isUlujam
                ? null
                : validateFormDefinition({
                    schemaVersion: 1,
                    fields: questions.map(toField),
                  });
              const r = await formRequest("/api/admin/forms", {
                eventId,
                settings,
              });
              if (definition)
                await formRequest("/api/admin/forms/" + r.id, {
                  action: "definition",
                  expectedRevision: r.revision,
                  input: definition,
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
        <p>
          Başvuru formu oluşturmak için önce Etkinlikler bölümünden bir etkinlik
          ekleyin.
        </p>
      )}
    </section>
  );
}
export function OptionsEditor({
  options,
  onChange,
}: {
  options: Field["options"];
  onChange: (options: NonNullable<Field["options"]>) => void;
}) {
  const items = options ?? [];
  function move(index: number, delta: number) {
    const next = [...items];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }
  return (
    <section aria-label="Seçenekler">
      <p>
        Seçenek metinlerini düzenleyin. Kayıtlı yanıtlar ve görünürlük kuralları
        korunur.
      </p>
      {items.map((option, index) => (
        <div className="admin-question-card" key={option.value}>
          <label className="field">
            {index + 1}. seçenek
            <input
              value={option.label}
              maxLength={160}
              onChange={(event) =>
                onChange(
                  items.map((item, i) =>
                    i === index ? { ...item, label: event.target.value } : item,
                  ),
                )
              }
            />
          </label>
          <div className="actions">
            <button
              type="button"
              aria-label={`${index + 1}. seçeneği yukarı taşı`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              Yukarı taşı
            </button>
            <button
              type="button"
              aria-label={`${index + 1}. seçeneği aşağı taşı`}
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              Aşağı taşı
            </button>
            <button
              type="button"
              aria-label={`${index + 1}. seçeneği kaldır`}
              disabled={items.length === 1}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Seçeneği kaldır
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= 50}
        onClick={() =>
          onChange([
            ...items,
            { value: crypto.randomUUID(), label: "Yeni seçenek" },
          ])
        }
      >
        Seçenek ekle
      </button>
    </section>
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
    eventId?: string | null;
    isUlujam?: boolean;
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
      {form.settings.slug && (
        <div
          style={{
            padding: "16px 20px",
            margin: "16px 0 24px",
            background: "var(--color-211a2f, #211a2f)",
            border: "1px solid var(--color-ffffff24, rgba(255,255,255,0.15))",
            borderRadius: "14px",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "12px",
              letterSpacing: "0.08em",
              fontWeight: 700,
              color: "var(--color-ffd1e1, #ffd1e1)",
              marginBottom: "6px",
            }}
          >
            FORM PAYLAŞIM BAĞLANTISI (LİNK)
          </span>
          <FormLinkPill slug={form.settings.slug} status={form.status} />
          <small style={{ display: "block", marginTop: "6px", opacity: 0.8 }}>
            {form.status === "published"
              ? "Form şu anda yayında! Katılımcılar bu link üzerinden formu doldurabilir."
              : "Form henüz yayında değil. Bağlantının ziyaretçilere açılması için aşağıdaki 'Yayımla / devam ettir' butonuna tıklayın."}
          </small>
        </div>
      )}
      {form.hasPublished && (
        <p>
          Alan değişiklikleri yeni form sürümü olarak yayımlanır. Önceki
          başvurular korunur.
        </p>
      )}
      {form.isUlujam && form.eventId && (
        <button
          disabled={busy}
          type="button"
          onClick={() => {
            setFields(buildUlujamFormDefinition(form.eventId!).fields);
            setMessage("UluJam şablonu yüklendi; alanları kaydedin.");
          }}
        >
          UluJam şablonunu yükle
        </button>
      )}
      <h2>Form ayarları</h2>
      <FormSettings
        key={form.revision}
        initial={form.settings}
        busy={busy}
        onSave={(s) => action("settings", s)}
      />
      <h2>Alanlar</h2>
      <p>
        PDF ve görsel dosya soruları özel depoda saklanır; indirmeye yalnız
        yetkili yöneticiler erişir.
      </p>
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
                {fieldTypes
                  .filter((t) => !(form.isUlujam && t === "file"))
                  .map((t) => (
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
