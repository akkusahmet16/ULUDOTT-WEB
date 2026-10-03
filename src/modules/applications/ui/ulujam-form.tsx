"use client";
import { BotChallenge, type BotConfig } from "../../forms/ui/bot-challenge";
import { useState, useRef } from "react";
import { z } from "zod";
import { FormFields } from "../../forms/ui/form-fields";
import { publicRequest } from "../../forms/ui/public-form";
import type { ValidFormDefinition } from "../../forms/domain/form-version";
import { evaluateVisibility } from "../../forms/domain/condition";
import {
  isEmpty,
  parseAnswer,
  displayTypes,
  type Answers,
} from "../../forms/domain/field-types";
import {
  validateUlujamInput,
  ulujamFields as f,
  type TeamOption,
} from "../domain/ulujam-input";
import type { UlujamReceipt } from "../application/submit-ulujam";
import type { Skill } from "../../matching/domain/skills";
export function UlujamForm({
  eventId,
  botConfig,
  definition,
  publicForm,
  teamOptions,
}: {
  eventId: string;
  botConfig?: BotConfig;
  definition: ValidFormDefinition;
  publicForm?: { slug: string; versionId: string };
  teamOptions?: { items: TeamOption[]; nextCursor: string | null };
}) {
  const [answers, setAnswers] = useState<Answers>({ [f.mode]: "solo" }),
    [password, setPassword] = useState(""),
    [teamId, setTeamId] = useState(""),
    [options, setOptions] = useState(teamOptions?.items ?? []),
    [cursor, setCursor] = useState(teamOptions?.nextCursor ?? null),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<UlujamReceipt | null>(null);
  const [botToken, setBotToken] = useState(""),
    [botReset, setBotReset] = useState(0);
  const key = useRef<string | null>(null);
  const rendered = publicForm
    ? {
        ...definition,
        fields: definition.fields.filter(
          (x) => ![f.teamId, f.teamInfo].includes(x.id),
        ),
      }
    : definition;
  function change(next: Answers) {
    if (
      next[f.mode] !== answers[f.mode] ||
      next[f.teamId] !== answers[f.teamId]
    ) {
      setPassword("");
      setTeamId("");
    }
    setAnswers(next);
    setMessage("");
    setErrors({});
    key.current = null;
  }
  function check() {
    const found: Record<string, string> = {},
      visible = new Set(evaluateVisibility(rendered, answers));
    for (const field of rendered.fields) {
      if (!visible.has(field.id) || displayTypes.includes(field.type)) continue;
      const value = answers[field.id];
      try {
        if (isEmpty(value)) {
          if (field.required) throw Error("required");
        } else parseAnswer(field, value);
      } catch {
        found[field.id] = "Bu alanı kontrol edin.";
      }
    }
    if (Object.keys(found).length) {
      setErrors(found);
      setMessage("İşaretli alanları kontrol edin.");
      return false;
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
      ...(mode === "existing"
        ? { teamId: publicForm ? teamId : answers[f.teamId], password }
        : {}),
    };
    try {
      validateUlujamInput(raw);
      setErrors({});
      setMessage(
        publicForm ? "" : "Önizleme doğrulandı; başvuru kaydedilmedi.",
      );
      return true;
    } catch (e) {
      if (e instanceof z.ZodError)
        for (const issue of e.issues) {
          const prop = String(issue.path[0]);
          const target =
            prop === "password"
              ? "password"
              : prop === "teamId"
                ? f.teamId
                : prop === "expectedSize"
                  ? f.expectedSize
                  : prop === "teamName"
                    ? f.teamName
                    : prop === "phone"
                      ? f.phone
                      : prop === "skills"
                        ? f.skills
                        : f.skillDescription;
          found[target] =
            prop === "expectedSize"
              ? "Toplam kişi sayısı tamsayı olmalıdır."
              : "Bu alanı kontrol edin.";
        }
      setErrors(found);
      setMessage(
        "Telefon, beceri seviyeleri, açıklama ve takım alanlarını kontrol edin.",
      );
      return false;
    }
  }
  async function submit() {
    if (!check() || !publicForm) return;
    setBusy(true);
    key.current ??= crypto.randomUUID();
    try {
      const result = await publicRequest("/api/ulujam/apply", {
        botToken,
        slug: publicForm.slug,
        versionId: publicForm.versionId,
        answers,
        ...(answers[f.mode] === "existing" ? { teamId, password } : {}),
        idempotencyKey: key.current,
        website: "",
      });
      setReceipt(result);
      setAnswers({});
      setPassword("");
      setTeamId("");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Gönderim tamamlanamadı. Aynı yanıtla tekrar deneyin.",
      );
    } finally {
      setBotToken("");
      setBotReset((n) => n + 1);
      setBusy(false);
    }
  }
  async function more() {
    if (!publicForm || !cursor) return;
    setBusy(true);
    try {
      const response = await fetch(
        "/api/ulujam/teams?slug=" +
          encodeURIComponent(publicForm.slug) +
          "&cursor=" +
          encodeURIComponent(cursor),
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw Error("Takımlar yüklenemedi.");
      setOptions([
        ...options,
        ...data.items.filter(
          (t: TeamOption) => !options.some((o) => o.id === t.id),
        ),
      ]);
      setCursor(data.nextCursor);
    } catch {
      setMessage("Takımlar yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section aria-label="Başvuru makbuzu">
        <h2>Başvuru alındı</h2>
        <p>{receipt.message}</p>
        <a href={"/makbuz#token=" + receipt.receiptToken}>
          Makbuzu ve durumu görüntüle
        </a>
        {receipt.card && (
          <p>
            Kart bağlantınızı güvenli bir yerde saklayın.{" "}
            <a href={"/kart/" + receipt.card.token}>Bireysel kartımı aç</a>
          </p>
        )}
        {receipt.team && (
          <>
            <p>Takım bağlantınızı güvenli bir yerde saklayın.</p>
            <a href={"/takim/" + receipt.team.token}>Takım sayfasını aç</a>
            {receipt.team.password && (
              <p>
                Yeni takım parolası:{" "}
                <code data-testid="new-team-password">
                  {receipt.team.password}
                </code>
              </p>
            )}
          </>
        )}
      </section>
    );
  return (
    <section
      aria-label={
        publicForm ? "UluJam başvuru formu" : "UluJam özel form önizlemesi"
      }
    >
      {!publicForm && (
        <>
          <p>Bu önizleme başvuru kaydetmez.</p>
          <p>
            Takım parolası yalnız geçici olarak bu ekranda tutulur; takım
            erişimi burada doğrulanmaz.
          </p>
        </>
      )}
      <form
        noValidate
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (publicForm) void submit();
          else check();
        }}
      >
        <fieldset disabled={busy}>
          <legend>Başvuru bilgileri</legend>
          <FormFields
            definition={rendered}
            answers={answers}
            onChange={change}
            prefix="ulujam"
            fieldErrors={errors}
          />
          {answers[f.mode] === "existing" && (
            <>
              {publicForm && (
                <div className="field">
                  <label htmlFor="ulujam-team">Katılacağınız takım *</label>
                  <select
                    id="ulujam-team"
                    value={teamId}
                    required
                    aria-invalid={errors[f.teamId] ? true : undefined}
                    aria-describedby={
                      errors[f.teamId] ? "ulujam-team-error" : undefined
                    }
                    onChange={(e) => {
                      setTeamId(e.target.value);
                      setPassword("");
                      setMessage("");
                      setErrors({});
                      key.current = null;
                    }}
                  >
                    <option value="">Seçin</option>
                    {options.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {!options.length && (
                    <p>Katılabileceğiniz bir takım henüz yok.</p>
                  )}
                  {cursor && (
                    <button type="button" onClick={() => void more()}>
                      Daha fazla takım yükle
                    </button>
                  )}
                  {errors[f.teamId] && (
                    <p id="ulujam-team-error">{errors[f.teamId]}</p>
                  )}
                </div>
              )}
              <div className="field">
                <label htmlFor="ulujam-password">Takım parolası *</label>
                <input
                  id="ulujam-password"
                  type="password"
                  autoComplete="off"
                  required
                  maxLength={128}
                  value={password}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? "ulujam-password-error" : undefined
                  }
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage("");
                    key.current = null;
                  }}
                />
                {errors.password && (
                  <p id="ulujam-password-error">{errors.password}</p>
                )}
              </div>
            </>
          )}
          {publicForm && (
            <BotChallenge
              config={botConfig}
              action="ulujam_apply"
              onToken={setBotToken}
              resetKey={botReset}
            />
          )}
          <button
            type="submit"
            disabled={!!publicForm && botConfig?.required && !botToken}
          >
            {busy
              ? "Gönderiliyor…"
              : publicForm
                ? "Başvuruyu gönder"
                : "Alanları kontrol et"}
          </button>
        </fieldset>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
