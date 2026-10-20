"use client";
import { useId, useState } from "react";
import Image from "next/image";
import type {
  SiteAsset,
  SiteAssetKind,
  SiteAssetScope,
} from "../domain/site-asset";
import styles from "../../admin/ui/content-workspace.module.css";

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
  const [items, setItems] = useState<SiteAsset[]>([]),
    [loaded, setLoaded] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [folder, setFolder] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/site-assets?scope=${scope}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error ?? "Dosyalar alınamadı");
      setItems(result.items);
      setLoaded(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Dosyalar alınamadı");
    } finally {
      setLoading(false);
    }
  }
  const available = items.filter((item) => item.kind === kind);
  const matches = available.filter(
    (item) =>
      (!folder || item.folder === folder) &&
      item.path.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <div className={styles.picker} role="group" aria-labelledby={id}>
      <p id={id} className={styles.pickerLabel}>
        {label}
      </p>
      {name && <input type="hidden" name={name} value={value} />}
      {value ? (
        <div className={styles.selected}>
          {kind === "image" ? (
            <Image
              src={value}
              alt={`${label} önizlemesi`}
              width={100}
              height={80}
              unoptimized
            />
          ) : (
            <video
              src={value}
              controls
              preload="none"
              aria-label={`${label} önizlemesi`}
            />
          )}
          <span className={styles.path}>{value.split("/").at(-1)}</span>
        </div>
      ) : (
        <p className={styles.path}>Henüz dosya seçilmedi.</p>
      )}
      <details
        onToggle={(event) => {
          if (event.currentTarget.open && !loaded && !loading) void load();
        }}
      >
        <summary>
          {kind === "image" ? "Klasörden görsel seç" : "Klasörden video seç"}
        </summary>
        <div className={styles.pickerControls}>
          <label className="field">
            Dosyalarda ara
            <input
              type="search"
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
              {[...new Set(available.map((item) => item.folder))].map(
                (path) => (
                  <option key={path} value={path}>
                    {path.split("/").slice(3).join(" / ") || path}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        {loading && <p role="status">Dosyalar hazırlanıyor…</p>}
        {error && <p role="alert">{error}</p>}
        <div className={styles.assetGrid} aria-label={`${label} dosyaları`}>
          {matches.map((asset) => (
            <button
              key={asset.path}
              type="button"
              className={styles.asset}
              disabled={disabled}
              aria-pressed={value === asset.path}
              onClick={() => onChange(asset.path)}
            >
              {kind === "image" ? (
                <Image
                  src={asset.path}
                  alt=""
                  loading="lazy"
                  width={160}
                  height={90}
                  style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "16 / 9",
                  }}
                  unoptimized
                />
              ) : (
                <span aria-hidden="true">▶ Video</span>
              )}
              <span>{asset.name}</span>
            </button>
          ))}
        </div>
        {loaded && !matches.length && (
          <p className={styles.empty}>Bu seçim için dosya bulunamadı.</p>
        )}
        <div className={styles.toolbar}>
          <button type="button" disabled={loading} onClick={() => void load()}>
            Dosyaları yenile
          </button>
          <span className={styles.path}>{matches.length} dosya</span>
        </div>
      </details>
      {value && (
        <button type="button" disabled={disabled} onClick={() => onChange("")}>
          Seçimi kaldır
        </button>
      )}
    </div>
  );
}
