"use client";
import Link from "next/link";
import { useState } from "react";
import type { Actor } from "../../../lib/logging/audit";
import type { DashboardView } from "../application/dashboard-service";
import { adminModulesFor, canCreateEvent } from "../domain/modules";
import styles from "./admin-workspace.module.css";
const statuses: Record<string, string> = {
  draft: "Taslak",
  scheduled: "Planlı",
  published: "Yayında",
  ended: "Bitti",
  cancelled: "İptal",
  archived: "Arşiv",
};
export function Dashboard({
  view,
  actor,
}: {
  view: DashboardView;
  actor: Actor;
}) {
  const [query, setQuery] = useState("");
  const modules = adminModulesFor(actor);
  const primary = modules.filter((item) =>
    [
      "/admin/etkinlikler",
      "/admin/people",
      "/admin/oyunlar",
      "/admin/ulujam",
      "/admin/iletisim",
      "/admin/medya",
    ].includes(item.href),
  );
  const events = view.events.filter((event) =>
    event.title
      .toLocaleLowerCase("tr-TR")
      .includes(query.toLocaleLowerCase("tr-TR")),
  );
  const peak = Math.max(1, ...view.analytics.daily.map((day) => day.count));
  return (
    <>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>İÇERİK STÜDYOSU</p>
          <h1>Birlikte yönet.</h1>
          <p className={styles.intro}>
            Etkinlikleri yayımla, topluluğun hikâyesini güncel tut.
          </p>
        </div>
        {canCreateEvent(actor) && (
          <Link className={styles.primaryLink} href="/admin/etkinlikler">
            Etkinlik oluştur <span aria-hidden="true">＋</span>
          </Link>
        )}
      </header>
      <section aria-label="İçerik yönetimi" className={styles.moduleGrid}>
        {primary.map((item, index) => (
          <Link key={item.href} href={item.href} className={styles.moduleCard}>
            <small>{String(index + 1).padStart(2, "0")} / YÖNETİM</small>
            <h3>{item.label}</h3>
            <p>{item.description}</p>
            <span>Düzenlemeye başla ↗</span>
          </Link>
        ))}
      </section>
      {view.events.length > 0 && (
        <section className={styles.section} aria-label="Etkinlik özeti">
          <div className={styles.sectionHead}>
            <h2>Etkinliklerine genel bakış</h2>
            <Link href="/admin/etkinlikler">Etkinlik yönetimine git ↗</Link>
          </div>
          <div className={styles.stats}>
            {[
              { label: "Toplam etkinlik", value: view.events.length },
              {
                label: "Yaklaşan etkinlik",
                value: view.events.filter((event) => event.upcoming).length,
              },
              {
                label: "Taslak",
                value: view.events.filter((event) => event.status === "draft")
                  .length,
              },
              {
                label: "Yeni başvuru",
                value: view.events.reduce(
                  (total, event) => total + (event.newSubmissions ?? 0),
                  0,
                ),
              },
            ].map((item) => (
              <div key={item.label} className={styles.stat}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.filters}>
            <label>
              Etkinlik ara
              <input
                type="search"
                value={query}
                maxLength={120}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Etkinlik adı…"
              />
            </label>
          </div>
          <div className={styles.eventRows}>
            {events.map((event) => (
              <article
                key={event.id}
                className={styles.eventRow}
                aria-label={event.title}
              >
                <div>
                  <h3>{event.title}</h3>
                  <span className={styles.tag} data-status={event.status}>
                    {statuses[event.status] ?? event.status}
                  </span>
                  {event.pendingTeams ? (
                    <p>{event.pendingTeams} takım onay bekliyor</p>
                  ) : null}
                </div>
                <Link href={`/admin/etkinlikler?event=${event.id}`}>
                  Etkinliği düzenle ↗
                </Link>
              </article>
            ))}
          </div>
          {!events.length && <p>Aramaya uygun etkinlik yok.</p>}
        </section>
      )}
      <section className={styles.section} aria-label="Yönetim kısayolları">
        <div className={styles.sectionHead}>
          <h2>Diğer yönetim araçları</h2>
        </div>
        <div className={styles.quickLinks}>
          {modules
            .filter(
              (item) =>
                item.href !== "/admin" &&
                !primary.some((primary) => primary.href === item.href),
            )
            .map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label} ↗
              </Link>
            ))}
        </div>
      </section>
      {actor.roles.includes("event_manager") && (
        <details className={`${styles.section} ${styles.report}`}>
          <summary>Katılım özeti ve başvuru akışı</summary>
          <p className={styles.intro}>
            Yetkili olduğunuz etkinliklerin kayıtları. Ziyaretçi verisi içermez.
          </p>
          <div className={styles.stats}>
            {[
              { label: "Toplam başvuru", value: view.analytics.total },
              { label: "İşlem bekleyen", value: view.analytics.waiting },
              { label: "Onaylanan", value: view.analytics.approved },
              {
                label: "Takım onayı bekleyen",
                value: view.analytics.pendingTeams,
              },
            ].map((item) => (
              <div className={styles.stat} key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.chart} aria-label="Son 14 günün başvuruları">
            <div className={styles.bars}>
              {view.analytics.daily.map((day) => (
                <div
                  key={day.day}
                  className={styles.bar}
                  title={`${day.day}: ${day.count} başvuru`}
                >
                  <span
                    style={{
                      height: `${Math.max(2, (day.count / peak) * 100)}%`,
                    }}
                  />
                  <span>{day.day.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.eventRows}>
            {view.forms.map((form) => (
              <article key={form.id} className={styles.eventRow}>
                <div>
                  <h3>{form.title}</h3>
                  <p>
                    {form.open ? "Başvuru alıyor" : "Kapalı / taslak"} ·{" "}
                    {form.used} / {form.capacity ?? "Sınırsız"}
                  </p>
                </div>
                <Link href={`/admin/formlar/${form.id}`}>Formu yönet ↗</Link>
              </article>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
