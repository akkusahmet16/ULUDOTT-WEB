"use client";
export async function formRequest(url: string, body: unknown) {
  const c = await fetch("/api/admin/csrf", { cache: "no-store" });
  if (!c.ok) throw Error("İstek doğrulanamadı");
  const { csrfToken } = await c.json();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error ?? "İşlem tamamlanamadı");
  return d;
}
