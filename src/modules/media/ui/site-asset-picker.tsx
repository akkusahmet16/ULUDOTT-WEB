"use client";
import { useId, useRef, useState } from "react";
import Image from "next/image";
import type {
  SiteAsset,
  SiteAssetKind,
  SiteAssetScope,
} from "../domain/site-asset";
import { sanitizeMediaSrc } from "../domain/sanitize-src";
import styles from "../../admin/ui/content-workspace.module.css";
import uploadStyles from "./site-asset-picker.module.css";

export function SiteAssetPicker({
  scope,
  kind = "image",
  label,
  name,
  value,
  onChange,
  disabled = false,
}: {
  scope: SiteAssetScope;
  kind?: SiteAssetKind;
  label: string;
  name?: string;
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeScope, setActiveScope] = useState<SiteAssetScope>("all");
  const [items, setItems] = useState<SiteAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deletingPath, setDeletingPath] = useState("");
  const [showManual, setShowManual] = useState(false);

  async function load(scopeToLoad: SiteAssetScope = activeScope) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/site-assets?scope=${scopeToLoad}`,
        {
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (!response.ok) throw Error(result.error ?? "Dosyalar alınamadı");
      setItems(result.items || []);
      setLoaded(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Dosyalar alınamadı");
    } finally {
      setLoading(false);
    }
  }

  function handleScopeChange(newScope: SiteAssetScope) {
    setActiveScope(newScope);
    void load(newScope);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const csrfResponse = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("İstek doğrulanamadı");
      const { csrfToken } = await csrfResponse.json();

      const formData = new FormData();
      formData.append("scope", scope === "all" ? "general" : scope);
      formData.append("file", file);

      const response = await fetch("/api/admin/site-assets", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Dosya yüklenemedi");
      }

      onChange(result.item.path);
      setUploadSuccess("Dosya başarıyla cihazdan yüklendi ve seçildi.");
      setItems((prev) => [
        result.item,
        ...prev.filter((i) => i.path !== result.item.path),
      ]);
      setLoaded(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Dosya yüklenemedi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(asset: SiteAsset, event: React.MouseEvent) {
    event.stopPropagation();
    const confirmed = window.confirm(
      `"${asset.name}" dosyasını sunucudan (VDS) kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem dosya diskten fiziksel olarak silinecektir ve geri alınamaz.`,
    );
    if (!confirmed) return;

    setDeletingPath(asset.path);
    try {
      const csrfResponse = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error("İstek doğrulanamadı");
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/admin/site-assets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ path: asset.path }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Dosya silinemedi");
      }

      setItems((prev) => prev.filter((i) => i.path !== asset.path));
      if (value === asset.path) {
        onChange("");
      }
      setUploadSuccess(`"${asset.name}" sunucudan kalıcı olarak silindi.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Dosya silinemedi");
    } finally {
      setDeletingPath("");
    }
  }

  const available = items.filter((item) =>
    kind === "document" ? item.kind === "document" : item.kind === kind,
  );
  const matches = available.filter(
    (item) =>
      (!folder || item.folder === folder) &&
      item.path.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
  );

  const acceptMime =
    kind === "image"
      ? "image/png,image/jpeg,image/webp,image/avif,image/svg+xml,image/gif"
      : kind === "video"
        ? "video/mp4,video/webm"
        : ".pdf,application/pdf";

  function formatBytes(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className={styles.picker} role="group" aria-labelledby={id}>
      <p id={id} className={styles.pickerLabel}>
        {label}
      </p>
      {name && <input type="hidden" name={name} value={value} />}

      {/* Selected Value Preview */}
      {value ? (
        <div className={styles.selected} style={{ alignItems: "center" }}>
          {kind === "image" ? (
            <div
              style={{
                position: "relative",
                width: 90,
                height: 60,
                borderRadius: 4,
                overflow: "hidden",
                background: "var(--color-0c0d1b)",
                border: "1px solid var(--color-ffffff16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sanitizeMediaSrc(value) ? (
                <Image
                  src={sanitizeMediaSrc(value)}
                  alt={`${label} önizlemesi`}
                  fill
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
              ) : (
                <span style={{ fontSize: 10, color: "var(--color-8b94ae)" }}>Önizleme yok</span>
              )}
            </div>
          ) : kind === "video" ? (
            <video
              src={sanitizeMediaSrc(value) || value}
              controls
              preload="none"
              style={{ width: 120, height: 70, borderRadius: 4 }}
              aria-label={`${label} önizlemesi`}
            />
          ) : (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 4,
                border: "1px solid var(--color-edb2e433)",
                background: "var(--color-edb2e420)",
                color: "var(--color-fff9cb)",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>📄 PDF BELGESİ</span>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--color-edb2e4)", textDecoration: "underline" }}
              >
                Görüntüle ↗
              </a>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              className={styles.path}
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              {value}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              style={{
                marginTop: 4,
                padding: "2px 8px",
                fontSize: 11,
                borderRadius: 3,
                border: "1px solid var(--color-8e526855)",
                background: "transparent",
                color: "var(--color-f7a9b8)",
                cursor: "pointer",
              }}
            >
              × Seçimi Kaldır
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.path}>Henüz dosya seçilmedi.</p>
      )}

      {/* Action Buttons: Device Upload & Manual toggle */}
      <div className={uploadStyles.uploadBlock}>
        <div className={uploadStyles.actionRow}>
          <label className={uploadStyles.uploadButton}>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptMime}
              disabled={disabled || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            <span>
              {uploading
                ? "Dosya yükleniyor…"
                : kind === "document"
                  ? "⬆ Cihazdan PDF Yükle"
                  : kind === "video"
                    ? "⬆ Cihazdan Video Yükle"
                    : "⬆ Cihazdan Görsel Yükle"}
            </span>
          </label>

          <button
            type="button"
            className={uploadStyles.toggleLibraryBtn}
            onClick={() => setShowManual(!showManual)}
          >
            {showManual ? "Yol girişini gizle" : "Elle yol gir"}
          </button>
        </div>

        {showManual && (
          <div className={uploadStyles.manualInputGroup}>
            <input
              type="text"
              placeholder="/uploads/... veya /community/..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={uploadStyles.manualInput}
            />
          </div>
        )}

        {uploadError && (
          <p role="alert" className={uploadStyles.pickerError}>
            {uploadError}
          </p>
        )}
        {uploadSuccess && (
          <p role="status" className={uploadStyles.pickerSuccess}>
            {uploadSuccess}
          </p>
        )}
      </div>

      {/* Library Drawer with Scope Tabs and Server Deletion */}
      <details
        onToggle={(event) => {
          if (event.currentTarget.open && !loaded && !loading) void load();
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          📁 Medya Kütüphanesinden Seç ({matches.length || "Yükleniyor…"})
        </summary>

        {/* Scope selector tabs for universal asset reuse */}
        <div className={uploadStyles.scopePills}>
          <button
            type="button"
            className={`${uploadStyles.scopePill} ${activeScope === "all" ? uploadStyles.scopePillActive : ""}`}
            onClick={() => handleScopeChange("all")}
          >
            Tüm Kütüphane (Ortak)
          </button>
          <button
            type="button"
            className={`${uploadStyles.scopePill} ${activeScope === "uploads" ? uploadStyles.scopePillActive : ""}`}
            onClick={() => handleScopeChange("uploads")}
          >
            Yüklemeler (/uploads)
          </button>
          {scope !== "all" && scope !== "uploads" && (
            <button
              type="button"
              className={`${uploadStyles.scopePill} ${activeScope === scope ? uploadStyles.scopePillActive : ""}`}
              onClick={() => handleScopeChange(scope)}
            >
              Bu Bölüm ({scope})
            </button>
          )}
        </div>

        <div className={styles.pickerControls}>
          <label className="field">
            Dosyalarda ara
            <input
              type="search"
              placeholder="Dosya adı ara…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            Klasör
            <select
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
            >
              <option value="">Tüm klasörler</option>
              {[...new Set(available.map((item) => item.folder))].map((path) => (
                <option key={path} value={path}>
                  {path.startsWith("/uploads")
                    ? `Yüklenenler: ${path}`
                    : path.split("/").slice(2).join(" / ") || path}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p role="status">Dosyalar sunucudan taranıyor…</p>}
        {error && <p role="alert">{error}</p>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "10px",
            marginTop: "12px",
            maxHeight: "360px",
            overflowY: "auto",
            padding: "4px",
          }}
          aria-label={`${label} dosyaları`}
        >
          {matches.map((asset) => {
            const isSelected = value === asset.path;
            const isDeleting = deletingPath === asset.path;
            return (
              <div
                key={asset.path}
                className={`${uploadStyles.assetCard} ${isSelected ? uploadStyles.assetCardSelected : ""}`}
              >
                <div className={uploadStyles.assetCardTop}>
                  {asset.kind === "image" ? (
                    <Image
                      src={asset.path}
                      alt=""
                      loading="lazy"
                      width={140}
                      height={90}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      unoptimized
                    />
                  ) : asset.kind === "video" ? (
                    <span style={{ fontSize: 13, color: "var(--color-fff9cb)" }}>▶ Video</span>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--color-edb2e4)" }}>📄 PDF</span>
                  )}

                  {/* VDS Permanent Delete Button */}
                  <button
                    type="button"
                    title="Bu dosyayı VDS diskinden kalıcı olarak sil"
                    className={uploadStyles.deleteBtn}
                    disabled={isDeleting}
                    onClick={(e) => handleDelete(asset, e)}
                  >
                    {isDeleting ? "…" : "×"}
                  </button>
                </div>

                <div className={uploadStyles.assetInfo}>
                  <span className={uploadStyles.assetName} title={asset.name}>
                    {asset.name}
                  </span>
                  <div className={uploadStyles.assetMeta}>
                    <span>{asset.folder.split("/").at(-1)}</span>
                    <span>{formatBytes(asset.size)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={uploadStyles.selectAssetBtn}
                  disabled={disabled}
                  onClick={() => onChange(asset.path)}
                >
                  {isSelected ? "✓ Seçili" : "Seç"}
                </button>
              </div>
            );
          })}
        </div>

        {loaded && !matches.length && (
          <p className={styles.empty}>Bu arama kriterine uygun dosya bulunamadı.</p>
        )}

        <div className={styles.toolbar} style={{ marginTop: 12 }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load(activeScope)}
          >
            Yenile
          </button>
          <span className={styles.path}>{matches.length} dosya listelendi</span>
        </div>
      </details>
    </div>
  );
}
