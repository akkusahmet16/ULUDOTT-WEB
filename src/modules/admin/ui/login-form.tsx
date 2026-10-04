"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
async function mutate(path: string, body?: unknown) {
  const csrf = await fetch("/api/admin/csrf", { cache: "no-store" });
  if (!csrf.ok) throw new Error("İstek doğrulanamadı");
  const { csrfToken } = await csrf.json();
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "İşlem tamamlanamadı");
}
export function LoginForm() {
  const router = useRouter(),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form);
    setError("");
    setPending(true);
    try {
      await mutate("/api/admin/login", {
        password: data.get("password"),
      });
      form.reset();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş tamamlanamadı");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <p>Yönetim paneli için özel şifreyi girin.</p>
      <p>
        <label>
          Özel şifre{" "}
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
          />
        </label>
      </p>
      <p role="alert">{error}</p>
      <button disabled={pending}>
        {pending ? "Doğrulanıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
export function SessionActions() {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  async function action(renew: boolean) {
    setPending(true);
    setMessage("");
    try {
      await mutate(renew ? "/api/admin/session/renew" : "/api/admin/logout");
      setMessage(renew ? "Oturum yenilendi." : "");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button disabled={pending} onClick={() => action(true)}>
        Oturumu yenile
      </button>{" "}
      <button disabled={pending} onClick={() => action(false)}>
        Çıkış yap
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
