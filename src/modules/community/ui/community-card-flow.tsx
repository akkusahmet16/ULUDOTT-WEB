"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslator } from "../../../i18n/client.tsx";

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
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <article
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "340px",
            aspectRatio: "690 / 1010",
            borderRadius: "var(--radius-16px)",
            overflow: "hidden",
            boxShadow: "var(--shadow-04)",
            border: "1px solid var(--color-edb2e466)",
            margin: "0px auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "clamp(20px, 5vw, 28px)",
          }}
          aria-label={t("communityCard.cardTitle")}
        >
          <Image
            src="/passes/community/background@2x.png"
            alt={t("communityCard.cardTitle")}
            fill
            sizes="340px"
            priority
            style={{
              objectFit: "cover",
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: "0px",
              background: "var(--gradient-31)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Image
              src="/passes/community/primaryLogo@2x.png"
              alt={t("communityCard.cardOrg")}
              width={34}
              height={34}
              priority
              style={{
                filter: "var(--shadow-05)",
              }}
            />
            <span
              style={{
                font: "600 13px var(--font)",
                letterSpacing: "0.18em",
                color: "var(--cream)",
                textTransform: "uppercase",
              }}
            >
              {t("communityCard.cardOrg")}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginTop: "auto",
              marginBottom: "auto",
              textAlign: "center",
              padding: "16px 0px",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--heading)",
                fontSize: "clamp(26px, 6vw, 34px)",
                letterSpacing: "0.06em",
                color: "var(--color-fff4df)",
                textTransform: "uppercase",
                margin: "0px 0px 6px",
                lineHeight: 1.1,
              }}
            >
              {t("communityCard.cardTitle")}
            </h2>
            <p
              style={{
                font: "500 13px var(--font)",
                letterSpacing: "0.04em",
                color: "var(--muted)",
                margin: "0px auto",
              }}
            >
              {t("communityCard.cardSubtitle")}
            </p>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              borderTop: "1px solid var(--line)",
              paddingTop: "14px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                font: "500 12px var(--font)",
                letterSpacing: "0.03em",
                color: "var(--cream)",
                margin: "0px auto",
              }}
            >
              {t("communityCard.cardMotto")}
            </p>
          </div>
        </article>

        {walletError && (
          <div role="alert" style={{ marginTop: "24px", textAlign: "center" }}>
            {walletError}
          </div>
        )}

        <div
          className="actions"
          style={{
            justifyContent: "center",
            marginTop: "32px",
            width: "100%",
          }}
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
            margin: "20px auto 0px",
            maxWidth: "480px",
            width: "100%",
            color: "var(--muted)",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {t("communityCard.walletNotice")}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0px auto", width: "100%" }}>
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
            disabled={busy || !fullName.trim() || !email.trim()}
            className="button"
          >
            {busy ? t("communityCard.verifying") : t("communityCard.submitButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
