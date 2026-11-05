"use client";
import { useState, useEffect, useRef } from "react";
import { useLocale, useTranslator } from "../../../i18n/client.tsx";
import { adaptUiErrorMessage } from "../../../i18n/error-adapter.ts";
import { formatLocaleTimestamp } from "../../../i18n/format.ts";
import { publicRequest } from "./public-form";
export function ReceiptView() {
  const locale = useLocale();
  const t = useTranslator();
  const labels: Record<string, string> = {
    received: t("receipt.statusReceived"),
    waitlisted: t("receipt.statusWaitlisted"),
    pending: t("receipt.statusPending"),
    approved: t("receipt.statusApproved"),
    rejected: t("receipt.statusRejected"),
    withdrawn: t("receipt.statusWithdrawn"),
  };
  const [receipt, setReceipt] = useState<{
      status: string;
      formTitle: string;
      submittedAt: string;
      message: string;
    } | null>(null),
    [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    if (!token) {
      setError(t("receipt.useReceiptLinkError"));
      return;
    }
    void publicRequest("/api/submissions/receipt", { token })
      .then(setReceipt)
      .catch((e) =>
        setError(
          adaptUiErrorMessage(e.message, t, "errors.operationFailed", locale),
        ),
      );
  }, [locale, t]);
  return (
    <section aria-label={t("receipt.privateReceiptAria")}>
      <p role="status">{error}</p>
      {receipt && (
        <>
          <h2>{receipt.formTitle}</h2>
          <p>
            {t("receipt.statusPrefix", {
              status: labels[receipt.status] ?? receipt.status,
            })}
          </p>
          <p>
            {adaptUiErrorMessage(
              receipt.message,
              t,
              "receipt.statusReceived",
              locale,
            )}
          </p>
          <time dateTime={receipt.submittedAt}>
            {formatLocaleTimestamp(receipt.submittedAt, locale)}
          </time>
        </>
      )}
    </section>
  );
}
