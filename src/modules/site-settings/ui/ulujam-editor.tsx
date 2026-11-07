"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { formatLocaleTimestamp } from "../../../i18n/format.ts";
import type { UlujamSettings } from "../domain/ulujam";
import { formRequest } from "../../forms/ui/admin-fetch";
import styles from "../../admin/ui/content-workspace.module.css";
type FormOption = {
  id: string;
  title: string;
  slug: string;
  status: string;
  eventTitle: string;
  opensAt: Date | string | null;
  closesAt: Date | string | null;
  canEdit: boolean;
};
export function UlujamEditor({
  initial,
}: {
  initial: {
    data: UlujamSettings;
    revision: number;
    forms: FormOption[];
    canCreateForms: boolean;
  };
}) {
  const [data, setData] = useState(initial.data),
    [revision, setRevision] = useState(initial.revision),
    [forms, setForms] = useState(initial.forms),
    [canCreateForms, setCanCreateForms] = useState(initial.canCreateForms),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const change = <K extends keyof UlujamSettings>(
    key: K,
    value: UlujamSettings[K],
  ) => setData((current) => ({ ...current, [key]: value }));
  async function save(next = data) {
    setBusy(true);
    setMessage("");
    try {
      const result = await formRequest("/api/admin/ulujam-settings", {
        input: next,
        expectedRevision: revision,
      });
      setData(result.data);
      setRevision(result.revision);
      setMessage(
        "UluJam ayarları kaydedildi. Ana sayfa ve UluJam sayfası güncellendi.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ayarlar kaydedilemedi",
      );
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/ulujam-settings", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setData(result.data);
      setRevision(result.revision);
      setForms(result.forms);
      setCanCreateForms(result.canCreateForms);
      setMessage("Güncel ayarlar alındı.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ayarlar alınamadı");
    } finally {
      setBusy(false);
    }
  }
  const selected = forms.find((form) => form.id === data.formId);
  const date = (value: Date | string | null) =>
    value ? formatLocaleTimestamp(value, "tr") : "Belirlenmedi";
  return (
    <section className={styles.workspace} aria-label="UluJam ayarları">
      <p className={styles.status} role="status">
        {message}
      </p>
      <div className={styles.toolbar}>
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Ayarları yenile
        </button>
        <Link href="/admin/ulujam-arsivleri">UluJam arşivlerini yönet ↗</Link>
      </div>
      <form
        className={styles.form}
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void save();
        }}
      >
        <section className={styles.card} aria-label="Ana sayfa UluJam kolonu">
          <h2>Ana sayfadaki UluJam</h2>
          <div className={styles.row}>
            <label className="field">
              Güncel UluJam yılı
              <input
                type="number"
                value={data.year}
                min={2000}
                max={2200}
                onChange={(event) => change("year", Number(event.target.value))}
                required
              />
            </label>
            <label className="field">
              Kolon başlığı
              <input
                value={data.panelTitle}
                maxLength={100}
                onChange={(event) => change("panelTitle", event.target.value)}
                required
              />
            </label>
          </div>
          <label className="field">
            Kolon açıklaması
            <textarea
              value={data.panelDescription}
              maxLength={300}
              onChange={(event) =>
                change("panelDescription", event.target.value)
              }
              required
            />
          </label>
        </section>
        <section className={styles.card} aria-label="UluJam başvuru ayarları">
          <h2>Başvuru ekranı</h2>
          <p className={styles.intro}>
            Aynı başvuru durumu ana sayfa kolonunda, UluJam sayfasında ve
            başvuru ekranında kullanılır. Başvuruyu kapatmak yeni gönderimleri
            de durdurur.
          </p>
          <label className="field">
            UluJam başvuru formu
            <select
              aria-label="UluJam başvuru formu"
              value={data.formId ?? ""}
              onChange={(event) => change("formId", event.target.value || null)}
            >
              <option value="">Form seçilmedi</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title} · {form.eventTitle} · {form.status}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <div className={styles.card}>
              <p>
                Açılış: {date(selected.opensAt)} · Kapanış:{" "}
                {date(selected.closesAt)} (İstanbul)
              </p>
              {selected.canEdit ? (
                <Link href={`/admin/formlar/${selected.id}`}>
                  Form sorularını ve başvuru tarihlerini düzenle ↗
                </Link>
              ) : (
                <p>
                  Soruları ve başvuru tarihlerini düzenlemek için bu etkinliğe
                  yetkili bir etkinlik yöneticisi gerekir.
                </p>
              )}
            </div>
          ) : canCreateForms ? (
            <p>
              <Link href="/admin/formlar">Form oluşturucuya git ↗</Link>
            </p>
          ) : (
            <p>
              Başvuru formu oluşturmak için bu etkinliğe yetkili bir etkinlik
              yöneticisi gerekir.
            </p>
          )}
          <label className="field">
            Başvuru başlığı
            <input
              value={data.applicationTitle}
              maxLength={160}
              onChange={(event) =>
                change("applicationTitle", event.target.value)
              }
              required
            />
          </label>
          <label className="field">
            Başvuru açıklaması
            <textarea
              value={data.applicationDescription}
              maxLength={3000}
              onChange={(event) =>
                change("applicationDescription", event.target.value)
              }
            />
          </label>
          <label className="field">
            Başvuru butonu metni
            <input
              value={data.applicationButtonLabel}
              maxLength={80}
              onChange={(event) =>
                change("applicationButtonLabel", event.target.value)
              }
              required
            />
          </label>
          <label className="field">
            Başvurular kapalıyken gösterilecek metin
            <textarea
              value={data.applicationClosedMessage}
              maxLength={500}
              onChange={(event) =>
                change("applicationClosedMessage", event.target.value)
              }
              required
            />
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={data.applicationPublished}
              onChange={(event) =>
                change("applicationPublished", event.target.checked)
              }
            />{" "}
            Başvuruları yayımla
          </label>
          <p className={styles.intro}>
            Başvuru butonu, seçilen form yayımlanmış ve tarih aralığı açık
            olduğunda görünür. Sorular ve tarihler, etkinliğe yetkili yönetici
            tarafından Form oluşturucuda düzenlenir.
          </p>
        </section>
        <div className={styles.actions}>
          <button type="submit" disabled={busy}>
            {busy ? "Kaydediliyor…" : "UluJam ayarlarını kaydet"}
          </button>
          <button
            type="button"
            disabled={busy || !data.formId}
            onClick={() => void save({ ...data, applicationPublished: false })}
          >
            Başvuruları kapat
          </button>
        </div>
        <p>Değişiklikler kaydettiğinizde uygulanır.</p>
      </form>
    </section>
  );
}
