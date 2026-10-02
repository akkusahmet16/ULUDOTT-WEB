"use client";
import { useState, useRef, type FormEvent } from "react";
import type { ValidFormDefinition } from "../domain/form-version";
import type { Answers } from "../domain/field-types";
import { FormFields } from "./form-fields";
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
  if (!r.ok) throw Error(data.error ?? "İşlem tamamlanamadı");
  return data;
}
export function PublicForm({
  slug,
  versionId,
  definition,
}: {
  slug: string;
  versionId: string;
  definition: ValidFormDefinition;
}) {
  const [answers, setAnswers] = useState<Answers>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<{
      receiptToken: string;
      message: string;
      status: string;
    } | null>(null);
  const key = useRef<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    key.current ??= crypto.randomUUID();
    try {
      const data = await publicRequest("/api/forms/" + slug + "/submit", {
        answers,
        versionId,
        idempotencyKey: key.current,
        website: new FormData(e.currentTarget).get("website") ?? "",
      });
      setReceipt(data);
      setAnswers({});
      setMessage("");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Gönderim tamamlanamadı. Aynı yanıtla tekrar deneyebilirsiniz.",
      );
    } finally {
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
          onChange={(a) => {
            setAnswers(a);
            key.current = null;
          }}
        />
        <div style={{ display: "none" }} aria-hidden="true">
          <label>
            Web sitesi
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button className="button" disabled={busy}>
          {busy ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </button>
      </fieldset>
    </form>
  );
}
