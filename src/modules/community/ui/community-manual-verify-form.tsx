"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslator } from "../../../i18n/client.tsx";

const MEMBER_GRANT_STORAGE_KEY = "uludott_member_grant";

export function CommunityManualVerifyForm() {
  const t = useTranslator();
  const router = useRouter();

  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentNumber.trim() || !password || busy) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/community/verify-sks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: studentNumber.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok || typeof data.grantToken !== "string") {
        if (data.error === "invalidCredentials") {
          setErrorMessage(t("communityCard.manualInvalidCredentials"));
        } else if (data.error === "notMember") {
          setErrorMessage(t("communityCard.manualNotMember"));
        } else if (data.error === "sksUnavailable") {
          setErrorMessage(t("communityCard.manualSksUnavailable"));
        } else {
          setErrorMessage(t("communityCard.genericError"));
        }
        return;
      }

      window.sessionStorage.setItem(MEMBER_GRANT_STORAGE_KEY, data.grantToken);
      router.push("/uye-karti");
    } catch {
      setErrorMessage(t("communityCard.manualSksUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0px auto", width: "100%" }}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="sks-student-number">
            {t("communityCard.manualStudentNumberLabel")}
          </label>
          <input
            id="sks-student-number"
            type="text"
            inputMode="numeric"
            required
            autoComplete="username"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder={t("communityCard.manualStudentNumberPlaceholder")}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="sks-password">
            {t("communityCard.manualPasswordLabel")}
          </label>
          <input
            id="sks-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("communityCard.manualPasswordPlaceholder")}
            disabled={busy}
          />
          <small>{t("communityCard.manualPrivacyNotice")}</small>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{ marginBottom: "20px", textAlign: "center" }}
          >
            {errorMessage}
          </div>
        )}

        <div className="actions" style={{ justifyContent: "center" }}>
          <button
            type="submit"
            disabled={busy || !studentNumber.trim() || !password}
            className="button"
          >
            {busy
              ? t("communityCard.manualVerifying")
              : t("communityCard.manualSubmitButton")}
          </button>

          <Link href="/uye-karti" className="button secondary">
            {t("communityCard.manualBackButton")}
          </Link>
        </div>
      </form>
    </div>
  );
}
