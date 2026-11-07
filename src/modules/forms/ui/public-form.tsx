"use client";
import { useState, useRef, type FormEvent } from "react";
import { useLocale, useTranslator } from "../../../i18n/client.tsx";
import { clientTrSlice } from "../../../i18n/dictionaries/client-tr.ts";
import {
  adaptFieldErrors,
  adaptUiErrorMessage,
} from "../../../i18n/error-adapter.ts";
import type { ValidFormDefinition } from "../domain/form-version";
import type { Answers } from "../domain/field-types";
import { BotChallenge, type BotConfig } from "./bot-challenge";
import { FormFields } from "./form-fields";
class PublicRequestError extends Error {
  fieldErrors: Record<string, string>;
  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}
export async function publicRequest(url: string, body: unknown) {
  const c = await fetch("/api/forms/csrf", { cache: "no-store" });
  if (!c.ok) throw Error(clientTrSlice.errors.requestNotVerified);
  const { csrfToken } = await c.json();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json();
  if (!r.ok)
    throw new PublicRequestError(
      data.error ?? clientTrSlice.errors.operationFailed,
      data.fieldErrors,
    );
  return data;
}
export function PublicForm({
  slug,
  versionId,
  definition,
  botConfig,
}: {
  botConfig?: BotConfig;
  slug: string;
  versionId: string;
  definition: ValidFormDefinition;
}) {
  const locale = useLocale();
  const t = useTranslator();
  const [answers, setAnswers] = useState<Answers>({}),
    [message, setMessage] = useState(""),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<{
      receiptToken: string;
      message: string;
      status: string;
    } | null>(null);
  const [botToken, setBotToken] = useState(""),
    [botReset, setBotReset] = useState(0);
  const files = useRef<Record<string, File>>({});
  const key = useRef<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    key.current ??= crypto.randomUUID();
    try {
      const payload = {
        botToken,
        answers,
        versionId,
        idempotencyKey: key.current,
        website: new FormData(e.currentTarget).get("website") ?? "",
      };
      let data;
      if (definition.fields.some((field) => field.type === "file")) {
        const csrf = await fetch("/api/forms/csrf", { cache: "no-store" });
        if (!csrf.ok) throw Error(t("errors.requestNotVerified"));
        const { csrfToken } = await csrf.json();
        const body = new FormData();
        body.set("payload", JSON.stringify(payload));
        for (const [id, file] of Object.entries(files.current)) {
          if (answers[id] !== undefined) {
            body.set("file:" + id, file);
          }
        }
        const response = await fetch("/api/forms/" + slug + "/submit", {
          method: "POST",
          headers: { "x-csrf-token": csrfToken },
          body,
          cache: "no-store",
        });
        data = await response.json();
        if (!response.ok)
          throw new PublicRequestError(
            data.error ?? t("errors.submissionFailedShort"),
            data.fieldErrors,
          );
      } else
        data = await publicRequest("/api/forms/" + slug + "/submit", payload);
      setReceipt(data);
      setAnswers({});
      files.current = {};
      setMessage("");
    } catch (e) {
      setFieldErrors(
        e instanceof PublicRequestError
          ? adaptFieldErrors(e.fieldErrors, t, locale)
          : {},
      );
      setMessage(
        e instanceof Error
          ? adaptUiErrorMessage(
              e.message,
              t,
              "errors.submissionFailedCanRetry",
              locale,
            )
          : t("errors.submissionFailedCanRetry"),
      );
    } finally {
      setBotToken("");
      setBotReset((n) => n + 1);
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section aria-label={t("forms.receiptSectionAria")}>
        <h2>{t("forms.receiptHeading")}</h2>
        <p role="status">
          {adaptUiErrorMessage(
            receipt.message,
            t,
            "forms.receiptHeading",
            locale,
          )}
        </p>
        <p>{t("forms.receiptStorageNotice")}</p>
        <a href={"/makbuz#token=" + receipt.receiptToken}>
          {t("forms.viewReceiptAndStatusLink")}
        </a>
      </section>
    );
  return (
    <form className="content-form" onSubmit={submit}>
      <p role="alert">{message}</p>
      <p>{t("forms.requiredFieldsNote")}</p>
      <fieldset disabled={busy}>
        <legend>{t("forms.applicationInfoLegend")}</legend>
        <FormFields
          definition={definition}
          answers={answers}
          fieldErrors={fieldErrors}
          onChange={(a) => {
            setAnswers(a);
            setFieldErrors({});
            key.current = null;
          }}
          onFileChange={(id, file) => {
            if (file) files.current[id] = file;
            else delete files.current[id];
            setFieldErrors({});
            key.current = null;
          }}
        />
        <div style={{ display: "none" }} aria-hidden="true">
          <label>
            {t("forms.honeypotWebsiteLabel")}
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <BotChallenge
          config={botConfig}
          action="form_submit"
          onToken={setBotToken}
          resetKey={botReset}
        />
        <button
          className="button"
          disabled={busy || (!!botConfig?.required && !botToken)}
        >
          {busy
            ? t("forms.submittingButton")
            : t("forms.submitApplicationButton")}
        </button>
      </fieldset>
    </form>
  );
}
