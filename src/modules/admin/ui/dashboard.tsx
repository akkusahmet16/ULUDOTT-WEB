"use client";
import Link from "next/link";
import { useState } from "react";
import type { DashboardView } from "../application/dashboard-service";
import styles from "./dashboard.module.css";
export function Dashboard({ view }: { view: DashboardView }) {
  const [query, setQuery] = useState(""),
    [eventId, setEvent] = useState(""),
    [filter, setFilter] = useState("all");
  const matches = (text: string) =>
    text
      .toLocaleLowerCase("tr-TR")
      .includes(query.trim().toLocaleLowerCase("tr-TR"));
  const events = view.events.filter(
    (e) =>
      (!eventId || eventId === e.id) &&
      matches(e.title) &&
      (filter === "all" ||
        (filter === "upcoming" && e.upcoming) ||
        (filter === "attention" &&
          (e.full ||
            (e.pendingTeams ?? 0) > 0 ||
            (e.failedWalletJobs ?? 0) > 0))),
  );
  const forms = view.forms.filter(
    (f) =>
      (!eventId || eventId === f.eventId) &&
      matches(f.title) &&
      (filter === "all" || (filter === "attention" && f.full)),
  );
  return (
    <section aria-labelledby="dashboard-title" className={styles.panel}>
      <h2 id="dashboard-title">Operasyon özeti</h2>
      <p>
        Başvuru ve takım sayıları yalnızca yetkili olduğunuz etkinlikler için
        gösterilir.
      </p>
      <div className={styles.filters}>
        <label className="field">
          Etkinlik veya form ara
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={120}
            type="search"
          />
        </label>
        <label className="field">
          Etkinlik kapsamı
          <select value={eventId} onChange={(e) => setEvent(e.target.value)}>
            <option value="">Tüm görünür etkinlikler</option>
            {view.events.map((e) => (
              <option value={e.id} key={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Özet filtresi
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="upcoming">Yaklaşan etkinlikler</option>
            <option value="attention">İşlem bekleyen / dolu</option>
          </select>
        </label>
      </div>
      <h3>Etkinlikler</h3>
      {!events.length && <p>Filtreye uygun etkinlik yok.</p>}
      <div className={styles.grid}>
        {events.map((e) => (
          <article className={styles.card} key={e.id} aria-label={e.title}>
            <h3>{e.title}</h3>
            <p>{e.upcoming ? "Yaklaşan etkinlik" : "Etkinlik kaydı"}</p>
            <dl className={styles.metrics}>
              {e.newSubmissions !== null && (
                <>
                  <dt>Açık form</dt>
                  <dd>{e.openForms}</dd>
                  <dt>Yeni başvuru</dt>
                  <dd>{e.newSubmissions}</dd>
                  <dt>Takım onayı bekleyen</dt>
                  <dd>{e.pendingTeams}</dd>
                  <dt>Kontenjan kullanımı</dt>
                  <dd>
                    {e.participants} / {e.capacity ?? "Sınırsız"}
                    {e.full ? " · Dolu" : ""}
                  </dd>
                  <dt>Başarısız Wallet işi</dt>
                  <dd>{e.failedWalletJobs}</dd>
                </>
              )}
            </dl>
            {e.newSubmissions !== null && (
              <p>
                <Link href="/admin/basvurular">Başvuruları incele</Link>
                {" · "}
                <Link href="/admin/takim-onaylari">Onay kuyruğunu aç</Link>
              </p>
            )}
          </article>
        ))}
      </div>
      {!!view.forms.length && (
        <>
          <h3>Formlar</h3>
          <div className={styles.grid}>
            {forms.map((f) => (
              <article key={f.id} className={styles.card} aria-label={f.title}>
                <h3>{f.title}</h3>
                <p>
                  {f.open ? "Açık" : "Kapalı / taslak"} · Kontenjan: {f.used} /{" "}
                  {f.capacity ?? "Sınırsız"}
                  {f.full ? " · Dolu" : ""}
                </p>
                <Link href={`/admin/formlar/${f.id}`}>Formu yönet</Link>
              </article>
            ))}
          </div>
          {!forms.length && <p>Filtreye uygun form yok.</p>}
        </>
      )}
    </section>
  );
}
