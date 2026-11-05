"use client";
import { useState } from "react";
import { useLocale, useTranslator } from "../../../i18n/client.tsx";
import { adaptUiErrorMessage } from "../../../i18n/error-adapter.ts";
import { publicRequest } from "../../forms/ui/public-form";
export function TeamLogin({ token }: { token: string }) {
  const locale = useLocale();
  const t = useTranslator();
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await publicRequest("/api/team/login", { token, password });
          setPassword("");
          location.reload();
        } catch (e) {
          setError(
            e instanceof Error
              ? adaptUiErrorMessage(
                  e.message,
                  t,
                  "errors.operationFailed",
                  locale,
                )
              : t("errors.operationFailed"),
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="team-password">{t("teams.passwordLabel")}</label>
      <input
        id="team-password"
        type="password"
        autoComplete="current-password"
        value={password}
        required
        maxLength={128}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={busy}>{t("teams.loginButton")}</button>
      <p role="alert">{error}</p>
    </form>
  );
}
export function TeamLogout() {
  const t = useTranslator();
  const [error, setError] = useState("");
  return (
    <>
      <button
        onClick={async () => {
          try {
            await publicRequest("/api/team/logout", {});
            location.reload();
          } catch {
            setError(t("teams.logoutError"));
          }
        }}
      >
        {t("teams.logoutButton")}
      </button>
      <p role="alert">{error}</p>
    </>
  );
}
