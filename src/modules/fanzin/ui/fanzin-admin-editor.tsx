"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formRequest } from "../../forms/ui/admin-fetch";
import { SiteAssetPicker } from "../../media/ui/site-asset-picker";
import type { FanzinIssueInput } from "../application/fanzin-admin-service";
import styles from "./fanzin-admin.module.css";
import editorStyles from "../../site-settings/ui/admin-editors.module.css";

export function FanzinAdminEditor({ issueId }: { issueId?: string }) {
  const router = useRouter();
  const isNew = !issueId || issueId === "yeni";

  const [form, setForm] = useState<FanzinIssueInput>({
    id: isNew ? "fanzin-" + Date.now() : issueId,
    issueNumber: 1,
    title: "",
    slug: "",
    subtitle: "",
    season: "Bahar",
    year: 2026,
    description: "",
    pageCount: 32,
    pdfUrl: "/uploads/fanzin/uludott-fanzin-sayi-01.pdf",
    pdfFileSize: "18.4 MB",
    coverImageUrl: "/community/02-ulujam/ulujam-vlog-kapak.webp",
    status: "draft",
  });

  const [activeTab, setActiveTab] = useState<"basic" | "pdf">("basic");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isNew && issueId) {
      async function load() {
        try {
          const res = await fetch(`/api/admin/fanzin/${issueId}`);
          if (res.ok) {
            const json = await res.json();
            if (json.issue) {
              setForm({
                id: json.issue.id,
                issueNumber: json.issue.issueNumber,
                title: json.issue.title,
                slug: json.issue.slug,
                subtitle: json.issue.subtitle ?? "",
                season: json.issue.season,
                year: json.issue.year,
                description: json.issue.description,
                pageCount: json.issue.pageCount,
                pdfUrl: json.issue.pdfUrl,
                pdfFileSize: json.issue.pdfFileSize ?? "",
                coverImageUrl: json.issue.coverImageUrl ?? "",
                status: json.issue.status,
              });
            }
          }
        } catch (err) {
          console.error("Failed to load issue:", err);
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [isNew, issueId]);

  async function handleSave(
    e?: React.FormEvent,
    overrideStatus?: "draft" | "published" | "upcoming",
  ) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage("");

    const targetStatus = overrideStatus ?? form.status;
    const cleanTitle = form.title.trim();

    if (!cleanTitle) {
      setMessage("Hata: Lütfen fanzin sayısı için bir başlık girin.");
      setSaving(false);
      return;
    }

    const cleanSlug =
      form.slug.trim() ||
      cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const payload: FanzinIssueInput = {
      ...form,
      title: cleanTitle,
      slug: cleanSlug,
      status: targetStatus,
    };

    try {
      await formRequest("/api/admin/fanzin", payload);
      setForm(payload);
      setMessage(
        targetStatus === "published"
          ? "Fanzin sayısı başarıyla yayımlandı ve okuyuculara açıldı."
          : targetStatus === "upcoming"
            ? "Fanzin sayısı 'Yakında' durumu ile kaydedildi."
            : "Fanzin taslağı başarıyla kaydedildi. Sitede gizli kalacaktır.",
      );
      if (isNew) {
        setTimeout(() => router.push("/admin/fanzin"), 1200);
      }
    } catch (err: unknown) {
      setMessage("Hata: " + ((err instanceof Error ? err.message : "Hata") || "Kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  function handleTitleChange(title: string) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setForm({ ...form, title, slug: form.slug ? form.slug : slug });
  }

  if (loading) return <div className={styles.loading}>Sayı yükleniyor...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            <Link href="/admin/fanzin" style={{ color: "inherit", textDecoration: "none" }}>
              ← FANZİN LİSTESİNE DÖN
            </Link>
          </span>
          <h1 className={styles.title}>
            {isNew ? "YENİ FANZİN SAYISI" : `SAYI #${String(form.issueNumber).padStart(2, "0")} DÜZENLE`}
          </h1>
          <p className={styles.subtitle}>
            Fanzin künye bilgilerini, PDF dijital baskı dosyasını ve yayın durumunu ayarlayın.
          </p>
        </div>
        <div className={editorStyles.tabs}>
          <button
            type="button"
            className={`${editorStyles.tabBtn} ${activeTab === "basic" ? editorStyles.tabActive : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            01 Temel Bilgiler & Künye
          </button>
          <button
            type="button"
            className={`${editorStyles.tabBtn} ${activeTab === "pdf" ? editorStyles.tabActive : ""}`}
            onClick={() => setActiveTab("pdf")}
          >
            02 PDF & Dijital Varlık
          </button>
        </div>
      </header>

      {message && (
        <div className={message.startsWith("Hata") ? editorStyles.alertError : editorStyles.alertSuccess}>
          {message}
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => void handleSave(e)}
        className={editorStyles.formGrid}
      >
        {activeTab === "basic" && (
          <div className={editorStyles.panelBox}>
            <div className={editorStyles.panelHeader}>
              <span className={editorStyles.panelNumber}>01</span>
              <h3>SAYI BİLGİLERİ & YAYIN DURUMU</h3>
            </div>

            <div className={editorStyles.fieldRow}>
              <div className={editorStyles.fieldGroup} style={{ maxWidth: "140px" }}>
                <label className={editorStyles.label}>Sayı Numarası</label>
                <input
                  type="number"
                  className={editorStyles.input}
                  value={form.issueNumber}
                  onChange={(e) => setForm({ ...form, issueNumber: parseInt(e.target.value, 10) || 1 })}
                  required
                  min={1}
                />
              </div>
              <div className={editorStyles.fieldGroup}>
                <label className={editorStyles.label}>Sayı Başlığı (Tema)</label>
                <input
                  type="text"
                  className={editorStyles.input}
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Örn: Vice & Pixels"
                  required
                />
              </div>
              <div className={editorStyles.fieldGroup}>
                <label className={editorStyles.label}>URL Slug</label>
                <input
                  type="text"
                  className={editorStyles.input}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="sayi-01"
                  required
                />
              </div>
            </div>

            <div className={editorStyles.fieldRow}>
              <div className={editorStyles.fieldGroup}>
                <label className={editorStyles.label}>Alt Başlık (Opsiyonel)</label>
                <input
                  type="text"
                  className={editorStyles.input}
                  value={form.subtitle || ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Retro-fütüristik neon dünyalar ve piksel sanatı"
                />
              </div>
              <div className={editorStyles.fieldGroup} style={{ maxWidth: "160px" }}>
                <label className={editorStyles.label}>Dönem / Sezon</label>
                <input
                  type="text"
                  className={editorStyles.input}
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  placeholder="Bahar, Güz, Kış..."
                  required
                />
              </div>
              <div className={editorStyles.fieldGroup} style={{ maxWidth: "120px" }}>
                <label className={editorStyles.label}>Yıl</label>
                <input
                  type="number"
                  className={editorStyles.input}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) || 2026 })}
                  required
                />
              </div>
            </div>

            <div className={editorStyles.fieldGroup}>
              <label className={editorStyles.label}>Editörden & Tanıtım Özeti</label>
              <textarea
                className={editorStyles.textarea}
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Bu sayıda topluluğumuzun ürettiği oyunlar, konsept çizimler ve söyleşiler yer alıyor..."
                required
              />
            </div>

            <div className={editorStyles.fieldGroup}>
              <label className={editorStyles.label}>Yayın Durumu</label>
              <div className={editorStyles.radioGroup} style={{ flexDirection: "row", gap: "24px" }}>
                <label className={editorStyles.radioOption}>
                  <input
                    type="radio"
                    name="status"
                    checked={form.status === "draft"}
                    onChange={() => setForm({ ...form, status: "draft" })}
                  />
                  <span>Taslak (Gizli)</span>
                </label>
                <label className={editorStyles.radioOption}>
                  <input
                    type="radio"
                    name="status"
                    checked={form.status === "published"}
                    onChange={() => setForm({ ...form, status: "published" })}
                  />
                  <span style={{ color: "var(--lime)", fontWeight: "700" }}>Yayında (Canlı)</span>
                </label>
                <label className={editorStyles.radioOption}>
                  <input
                    type="radio"
                    name="status"
                    checked={form.status === "upcoming"}
                    onChange={() => setForm({ ...form, status: "upcoming" })}
                  />
                  <span style={{ color: "var(--coral)" }}>Yakında</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pdf" && (
          <div className={editorStyles.panelBox}>
            <div className={editorStyles.panelHeader}>
              <span className={editorStyles.panelNumber}>02</span>
              <h3>PDF DİJİTAL BASKI & KAPAK GÖRSELİ</h3>
            </div>

            <div style={{ margin: "12px 0" }}>
              <SiteAssetPicker
                scope="fanzin"
                kind="document"
                label="Fanzin PDF Dosyası (Cihazdan Yükle veya Kütüphaneden Seç)"
                value={form.pdfUrl}
                onChange={(path) => setForm({ ...form, pdfUrl: path })}
              />
            </div>

            <div className={editorStyles.fieldRow}>
              <div className={editorStyles.fieldGroup} style={{ maxWidth: "180px" }}>
                <label className={editorStyles.label}>Tahmini Dosya Boyutu</label>
                <input
                  type="text"
                  className={editorStyles.input}
                  value={form.pdfFileSize || ""}
                  onChange={(e) => setForm({ ...form, pdfFileSize: e.target.value })}
                  placeholder="Örn: 18.4 MB"
                />
              </div>
              <div className={editorStyles.fieldGroup} style={{ maxWidth: "140px" }}>
                <label className={editorStyles.label}>Sayfa Sayısı</label>
                <input
                  type="number"
                  className={editorStyles.input}
                  value={form.pageCount}
                  onChange={(e) => setForm({ ...form, pageCount: parseInt(e.target.value, 10) || 0 })}
                  min={0}
                />
              </div>
            </div>

            <div style={{ margin: "12px 0" }}>
              <SiteAssetPicker
                scope="fanzin"
                kind="image"
                label="Kapak Görseli (Cihazdan Yükle veya Kütüphaneden Seç)"
                value={form.coverImageUrl || ""}
                onChange={(path) => setForm({ ...form, coverImageUrl: path })}
              />
            </div>

            {/* Kapak Önizleme */}
            <div style={{ marginTop: "12px", background: "var(--color-0005)", padding: "16px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "90px", height: "125px", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--color-ffffff20)", background: "var(--ink)" }}>
                <Image
                  src={form.coverImageUrl || "/community/02-ulujam/ulujam-vlog-kapak.webp"}
                  alt=""
                  width={90}
                  height={125}
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
              <div>
                <strong style={{ color: "var(--cream)" }}>DİJİTAL BASKI ÖNİZLEMESİ</strong>
                <p style={{ fontSize: "13px", color: "var(--admin-muted)", margin: "4px 0" }}>
                  PDF: <code>{form.pdfUrl}</code> ({form.pdfFileSize || "Boyut belirtilmedi"})
                </p>
                <p style={{ fontSize: "12px", color: "var(--purple)" }}>
                  Bu sayı kaydedildiğinde <code>/fanzin</code> rotasındaki Flipbook okuyucusu ile entegre çalışır.
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          className={editorStyles.formFooter}
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            disabled={saving}
            className={editorStyles.secondaryBtn}
            onClick={() => void handleSave(undefined, "draft")}
            style={{ minWidth: "160px" }}
          >
            {saving && form.status === "draft"
              ? "KAYDEDİLİYOR..."
              : "TASLAĞI KAYDET"}
          </button>
          <button
            type="button"
            disabled={saving}
            className={editorStyles.primaryBtn}
            onClick={() => void handleSave(undefined, "published")}
            style={{ minWidth: "180px" }}
          >
            {saving && form.status === "published"
              ? "YAYIMLANIYOR..."
              : "YAYIMLA & SİTEDE AÇ"}
          </button>
        </div>
      </form>
    </div>
  );
}
