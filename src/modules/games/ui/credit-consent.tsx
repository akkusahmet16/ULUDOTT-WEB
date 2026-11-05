"use client";
import { useState } from "react";
import { useLocale, useTranslator } from "../../../i18n/client.tsx";
import { adaptUiErrorMessage } from "../../../i18n/error-adapter.ts";
import { publicRequest } from "../../forms/ui/public-form";
import type { getPublicationConsent } from "../application/credit-consent-service";
export function CreditConsent({
  token,
  initial,
}: {
  token: string;
  initial: Awaited<ReturnType<typeof getPublicationConsent>>;
}) {
  const locale = useLocale();
  const t = useTranslator();
  const [name, setName] = useState(initial.publicationName),
    [checked, setChecked] = useState(initial.consented),
    [approved, setApproved] = useState(initial.consented),
    [revision, setRevision] = useState(initial.revision),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(consent: boolean) {
    setBusy(true);
    try {
      const r = await publicRequest("/api/cards/publication-consent", {
        token,
        publicationName: name,
        consent,
        expectedRevision: revision,
      });
      setRevision(r.revision);
      setApproved(r.consented);
      setChecked(r.consented);
      setMessage(
        consent
          ? t("consent.approvedSuccessMessage")
          : t("consent.withdrawnSuccessMessage"),
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? adaptUiErrorMessage(e.message, t, "consent.saveErrorFallback", locale)
          : t("consent.saveErrorFallback"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label={t("consent.sectionAria")}>
      <h1>{t("consent.heading")}</h1>
      <h2>{initial.title}</h2>
      <p>{initial.event}</p>
      <p>{t("consent.privacyCopy")}</p>
      {initial.canApprove ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(true);
          }}
        >
          <fieldset disabled={busy}>
            <label className="field">
              {t("consent.creatorNameLabel")}
              <input
                value={name}
                maxLength={160}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />{" "}
              {t("consent.allowPublicCheckbox")}
            </label>
            <p>
              <button disabled={busy || !checked || !name.trim()}>
                {t("consent.approveButton")}
              </button>
            </p>
          </fieldset>
        </form>
      ) : (
        <p>{t("consent.closedNewConsentCopy")}</p>
      )}
      {approved && (
        <button disabled={busy} onClick={() => void submit(false)}>
          {t("consent.withdrawButton")}
        </button>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
