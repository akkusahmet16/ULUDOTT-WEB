"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formRequest } from "./admin-fetch";

export function CopyLinkButton({
  url,
  label = "Linki Kopyala",
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const fullUrl =
        typeof window !== "undefined" && url.startsWith("/")
          ? `${window.location.origin}${url}`
          : url;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access error fallback
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      style={{
        padding: "6px 14px",
        minHeight: "36px",
        fontSize: "14px",
        cursor: "pointer",
        borderRadius: "8px",
        border: "1px solid var(--admin-border)",
        background: copied ? "var(--lime)" : "var(--panel)",
        color: "var(--cream)",
        fontWeight: 600,
        transition: "background 0.2s",
      }}
    >
      {copied ? "Kopyalandı! ✓" : label}
    </button>
  );
}

export function FormLinkPill({
  slug,
  status,
}: {
  slug: string;
  status: string;
}) {
  const path = `/basvuru/${slug}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
        margin: "6px 0",
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "14px",
          background: "var(--ink)",
          padding: "6px 10px",
          borderRadius: "6px",
          color: "var(--cream)",
          border: "1px solid var(--admin-border)",
          wordBreak: "break-all",
        }}
      >
        {path}
      </span>
      <CopyLinkButton url={path} />
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "6px 14px",
          minHeight: "36px",
          fontSize: "14px",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "8px",
          border: "1px solid var(--purple)",
          background: "transparent",
          color: "var(--purple)",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {status === "published" ? "Formu Görüntüle ↗" : "Form Önizleme ↗"}
      </a>
    </div>
  );
}

export function DeleteFormButton({
  formId,
  formTitle,
}: {
  formId: string;
  formTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `"${formTitle}" formunu ve bu forma gelen tüm cevapları veritabanından kalıcı olarak silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await formRequest("/api/admin/forms/" + formId, { action: "delete" });
      router.refresh();
    } catch (e) {
      if (typeof window !== "undefined") {
        window.alert(e instanceof Error ? e.message : "Form silinemedi");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void remove()}
      style={{
        padding: "4px 10px",
        fontSize: "13px",
        cursor: busy ? "not-allowed" : "pointer",
        borderRadius: "8px",
        border: "1px solid var(--coral)",
        background: "transparent",
        color: "var(--coral)",
        fontWeight: 600,
      }}
    >
      {busy ? "Siliniyor..." : "Sil"}
    </button>
  );
}
