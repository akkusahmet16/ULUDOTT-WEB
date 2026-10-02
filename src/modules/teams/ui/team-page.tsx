"use client";
import { useState } from "react";
import { publicRequest } from "../../forms/ui/public-form";
export function TeamLogin({ token }: { token: string }) {
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
          setError(e instanceof Error ? e.message : "İşlem tamamlanamadı");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="team-password">Takım parolası</label>
      <input
        id="team-password"
        type="password"
        autoComplete="current-password"
        value={password}
        required
        maxLength={128}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={busy}>Takıma giriş yap</button>
      <p role="alert">{error}</p>
    </form>
  );
}
export function TeamLogout() {
  const [error, setError] = useState("");
  return (
    <>
      <button
        onClick={async () => {
          try {
            await publicRequest("/api/team/logout", {});
            location.reload();
          } catch {
            setError("Çıkış tamamlanamadı.");
          }
        }}
      >
        Takımdan çıkış yap
      </button>
      <p role="alert">{error}</p>
    </>
  );
}
