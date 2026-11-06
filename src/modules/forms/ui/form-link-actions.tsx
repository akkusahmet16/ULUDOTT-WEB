"use client";
import { useState } from "react";

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
        border: "1px solid var(--color-ffffff40, rgba(255,255,255,0.25))",
        background: copied ? "var(--color-22c55e, #15803d)" : "var(--color-352b47, #352b47)",
        color: "#fff",
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
          background: "var(--color-181424, #181424)",
          padding: "6px 10px",
          borderRadius: "6px",
          color: "var(--color-fff9cb, #fff9cb)",
          border: "1px solid var(--color-ffffff24, rgba(255,255,255,0.15))",
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
          border: "1px solid var(--color-ffd1e1, #ffd1e1)",
          background: "transparent",
          color: "var(--color-ffd1e1, #ffd1e1)",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {status === "published" ? "Formu Görüntüle ↗" : "Form Önizleme ↗"}
      </a>
    </div>
  );
}
