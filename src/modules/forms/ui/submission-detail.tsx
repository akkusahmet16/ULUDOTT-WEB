"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ValidFormDefinition } from "../domain/form-version";
import type { Answers } from "../domain/field-types";
import { FormFields } from "./form-fields";
import { formRequest } from "./admin-fetch";
import { statusLabels } from "./submission-list";
type Detail = {
  id: string;
  revision: number;
  status: string;
  expiresAt: string;
  version: { version: number; definition: ValidFormDefinition };
  answers: Answers;
  history: { status: string; createdAt: string }[];
  consents: {
    purpose: string;
    textVersion: string;
    grantedAt: string;
    withdrawnAt: string | null;
  }[];
};
export function SubmissionDetail({ submission: s }: { submission: Detail }) {
  const router = useRouter(),
    [answers, setAnswers] = useState(s.answers),
    [revision, setRevision] = useState(s.revision),
    [status, setStatus] = useState(s.status),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function run(action: string, input: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await formRequest("/api/admin/submissions/" + s.id, {
        action,
        expectedRevision: revision,
        ...input,
      });
      if (action === "delete") {
        router.push("/admin/basvurular");
      } else {
        setRevision(result.revision);
        setMessage("Kaydedildi.");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <p>
        Form sürümü: {s.version.version} · Durum: {statusLabels[s.status]}
      </p>
      <p>
        Saklama sonu:{" "}
        {new Date(s.expiresAt).toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
        })}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run("correct", { answers });
        }}
      >
        <fieldset disabled={busy}>
          <legend>Yanıtları düzelt</legend>
          <FormFields
            definition={s.version.definition}
            answers={answers}
            onChange={setAnswers}
            prefix="correction"
            readOnlyConsent
          />
          <p>
            Rıza cevapları değiştirilemez. Yanıtlar başvurunun ilk form sürümüne
            göre doğrulanır.
          </p>
          <button type="submit">Düzeltmeyi kaydet</button>
        </fieldset>
      </form>
      <fieldset disabled={busy}>
        <legend>Durum yönetimi</legend>
        <label className="field">
          Yeni durum
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(statusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void run("status", { status })}>
          Durumu kaydet
        </button>{" "}
        <button
          onClick={() => {
            if (
              window.confirm(
                "Bu başvuru, yanıtları ve makbuz erişimi kalıcı olarak silinecek. Devam edilsin mi?",
              )
            )
              void run("delete");
          }}
        >
          Başvuruyu sil
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <h2>Durum geçmişi</h2>
      <ol>
        {s.history.map((r, i) => (
          <li key={i}>
            {statusLabels[r.status]} ·{" "}
            {new Date(r.createdAt).toLocaleString("tr-TR", {
              timeZone: "Europe/Istanbul",
            })}
          </li>
        ))}
      </ol>
      <h2>Rıza kayıtları</h2>
      <ul>
        {s.consents.map((c) => (
          <li key={c.purpose + ":" + c.textVersion}>
            {c.purpose} · {c.textVersion} ·{" "}
            {c.withdrawnAt ? "Geri çekildi" : "Onaylandı"}
          </li>
        ))}
      </ul>
    </section>
  );
}
