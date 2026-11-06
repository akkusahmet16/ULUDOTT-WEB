"use client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formRequest<T = any>(
  url: string,
  body: unknown = {},
  method: string = "POST",
): Promise<T> {
  const c = await fetch("/api/admin/csrf", { cache: "no-store" });
  if (!c.ok) throw Error("İstek doğrulanamadı");
  const { csrfToken } = await c.json();
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error ?? "İşlem tamamlanamadı");
  return d as T;
}
