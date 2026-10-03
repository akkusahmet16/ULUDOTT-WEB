"use client";
import { useState, useRef, type FormEvent } from "react";
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
  if (!c.ok) throw Error("İstek doğrulanamadı");
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
      data.error ?? "İşlem tamamlanamadı",
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
  const key = useRef<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    key.current ??= crypto.randomUUID();
    try {
      const data = await publicRequest("/api/forms/" + slug + "/submit", {
        botToken,
        answers,
        versionId,
        idempotencyKey: key.current,
        website: new FormData(e.currentTarget).get("website") ?? "",
      });
      setReceipt(data);
      setAnswers({});
      setMessage("");
    } catch (e) {
      setFieldErrors(e instanceof PublicRequestError ? e.fieldErrors : {});
      setMessage(
        e instanceof Error
          ? e.message
          : "Gönderim tamamlanamadı. Aynı yanıtla tekrar deneyebilirsiniz.",
      );
    } finally {
      setBotToken("");
      setBotReset((n) => n + 1);
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section aria-label="Başvuru makbuzu">
        <h2>Başvuru alındı</h2>
        <p role="status">{receipt.message}</p>
        <p>
          Makbuz bağlantınızı güvenli bir yerde saklayın. Bağlantıyı bilen kişi
          durumunuzu görebilir.
        </p>
        <a href={"/makbuz#token=" + receipt.receiptToken}>
          Makbuzu ve durumu görüntüle
        </a>
      </section>
    );
  return (
    <form className="content-form" onSubmit={submit}>
      <p role="alert">{message}</p>
      <p>* işaretli alanlar zorunludur.</p>
      <fieldset disabled={busy}>
        <legend>Başvuru bilgileri</legend>
        <FormFields
          definition={definition}
          answers={answers}
          fieldErrors={fieldErrors}
          onChange={(a) => {
            setAnswers(a);
            setFieldErrors({});
            key.current = null;
          }}
        />
        <div style={{ display: "none" }} aria-hidden="true">
          <label>
            Web sitesi
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
          {busy ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </button>
      </fieldset>
    </form>
  );
}
