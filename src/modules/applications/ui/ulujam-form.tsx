"use client";
import { BotChallenge, type BotConfig } from "../../forms/ui/bot-challenge";
import { useState, useRef } from "react";
import { z } from "zod";
import { useLocale, useTranslator } from "../../../i18n/client.tsx";
import { adaptUiErrorMessage } from "../../../i18n/error-adapter.ts";
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
  const locale = useLocale();
  const t = useTranslator();
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
        found[field.id] = t("errors.checkField");
      }
    }
    if (Object.keys(found).length) {
      setErrors(found);
      setMessage(t("errors.checkMarkedFields"));
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
      setMessage(publicForm ? "" : t("errors.previewValidatedNoSave"));
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
              ? t("errors.expectedSizeInt")
              : t("errors.checkField");
        }
      setErrors(found);
      setMessage(t("errors.ulujamValidationSummary"));
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
          ? adaptUiErrorMessage(
              e.message,
              t,
              "errors.submissionFailedRetry",
              locale,
            )
          : t("errors.submissionFailedRetry"),
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
      if (!response.ok) throw Error(t("errors.teamsLoadFailed"));
      setOptions([
        ...options,
        ...data.items.filter(
          (tItem: TeamOption) => !options.some((o) => o.id === tItem.id),
        ),
      ]);
      setCursor(data.nextCursor);
    } catch {
      setMessage(t("errors.teamsLoadFailed"));
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section aria-label={t("forms.receiptSectionAria")}>
        <h2>{t("forms.receiptHeading")}</h2>
        <p>
          {adaptUiErrorMessage(
            receipt.message,
            t,
            "forms.receiptHeading",
            locale,
          )}
        </p>
        <a href={"/makbuz#token=" + receipt.receiptToken}>
          {t("forms.viewReceiptAndStatusLink")}
        </a>
        {receipt.card && (
          <p>
            {t("forms.cardStorageNotice")}{" "}
            <a href={"/kart/" + receipt.card.token}>
              {t("forms.openPersonalCardLink")}
            </a>
          </p>
        )}
        {receipt.team && (
          <>
            <p>{t("forms.teamStorageNotice")}</p>
            <a href={"/takim/" + receipt.team.token}>
              {t("forms.openTeamPageLink")}
            </a>
            {receipt.team.password && (
              <p>
                {t("forms.newTeamPasswordPrefix")}{" "}
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
        publicForm ? t("forms.ulujamFormAria") : t("forms.ulujamPreviewAria")
      }
    >
      {!publicForm && (
        <>
          <p>{t("forms.previewDoesNotSaveNotice")}</p>
          <p>{t("forms.previewPasswordNotice")}</p>
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
          <legend>{t("forms.applicationInfoLegend")}</legend>
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
                  <label htmlFor="ulujam-team">
                    {t("forms.joinTeamLabel")}
                  </label>
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
                    <option value="">{t("common.selectOption")}</option>
                    {options.map((tItem) => (
                      <option key={tItem.id} value={tItem.id}>
                        {tItem.name}
                      </option>
                    ))}
                  </select>
                  {!options.length && (
                    <p>{t("forms.noAvailableTeamsNotice")}</p>
                  )}
                  {cursor && (
                    <button type="button" onClick={() => void more()}>
                      {t("forms.loadMoreTeamsButton")}
                    </button>
                  )}
                  {errors[f.teamId] && (
                    <p id="ulujam-team-error">{errors[f.teamId]}</p>
                  )}
                </div>
              )}
              <div className="field">
                <label htmlFor="ulujam-password">
                  {t("forms.teamPasswordRequiredLabel")}
                </label>
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
              ? t("forms.submittingButton")
              : publicForm
                ? t("forms.submitApplicationButton")
                : t("forms.checkFieldsButton")}
          </button>
        </fieldset>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
