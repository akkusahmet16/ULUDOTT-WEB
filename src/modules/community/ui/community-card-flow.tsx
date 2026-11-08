"use client";

import { useState } from "react";
import { useTranslator } from "../../../i18n/client.tsx";
import styles from "../../cards/ui/web-card.module.css";

export function CommunityCardFlow() {
  const t = useTranslator();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [grantToken, setGrantToken] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || busy) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/community/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok || typeof data.grantToken !== "string") {
        if (data.error === "notFound") {
          setErrorMessage(t("communityCard.notFoundError"));
        } else {
          setErrorMessage(t("communityCard.genericError"));
        }
        return;
      }

      setGrantToken(data.grantToken);
    } catch {
      setErrorMessage(t("communityCard.genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddToGoogleWallet() {
    if (!grantToken || walletBusy) return;

    setWalletBusy(true);
    setWalletError(null);

    try {
      const res = await fetch("/api/wallet/google/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantToken }),
      });

      const data = await res.json();
      if (!res.ok || typeof data.url !== "string") {
        setWalletError(
          typeof data.error === "string"
            ? data.error
            : t("communityCard.genericError"),
        );
        return;
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setWalletError(t("communityCard.genericError"));
    } finally {
      setWalletBusy(false);
    }
  }

  if (grantToken) {
    return (
      <div>
        <article
          className={styles.ticket}
          aria-label={t("communityCard.cardTitle")}
        >
          <p className={styles.brand}>{t("communityCard.cardOrg")}</p>
          <h1>{t("communityCard.cardTitle")}</h1>
          <p className={styles.name}>{t("communityCard.cardSubtitle")}</p>
          <p className={styles.foot}>{t("communityCard.cardMotto")}</p>
        </article>

        {walletError && (
          <div role="alert" style={{ marginTop: "24px", textAlign: "center" }}>
            {walletError}
          </div>
        )}

        <div
          className="actions"
          style={{ justifyContent: "center", marginTop: "32px" }}
        >
          <button
            type="button"
            onClick={handleAddToGoogleWallet}
            disabled={walletBusy}
            className="button"
          >
            {walletBusy
              ? t("cards.googlePreparingButton")
              : t("communityCard.addToGoogleWallet")}
          </button>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="button secondary"
          >
            {t("communityCard.appleWalletSoon")}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "14px",
            marginTop: "16px",
          }}
        >
          {t("communityCard.walletNotice")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify}>
      <div className="field">
        <label htmlFor="member-fullname">
          {t("communityCard.fullNameLabel")}
        </label>
        <input
          id="member-fullname"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("communityCard.fullNamePlaceholder")}
          disabled={busy}
        />
      </div>

      <div className="field">
        <label htmlFor="member-email">{t("communityCard.emailLabel")}</label>
        <input
          id="member-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("communityCard.emailPlaceholder")}
          disabled={busy}
        />
        <small>{t("communityCard.emailHelp")}</small>
      </div>

      {errorMessage && (
        <div role="alert" style={{ marginBottom: "20px" }}>
          {errorMessage}
        </div>
      )}

      <div className="actions">
        <button
          type="submit"
          disabled={busy || !fullName.trim() || !email.trim()}
          className="button"
        >
          {busy ? t("communityCard.verifying") : t("communityCard.submitButton")}
        </button>
      </div>
    </form>
  );
}
