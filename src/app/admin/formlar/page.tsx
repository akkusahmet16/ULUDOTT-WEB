import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import {
  listForms,
  formEvents,
} from "../../../modules/forms/application/form-service";
import { FormCreator } from "../../../modules/forms/ui/form-builder";
import {
  FormLinkPill,
  DeleteFormButton,
} from "../../../modules/forms/ui/form-link-actions";

export default async function Page() {
  const s = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!s) redirect("/admin");
  if (!s.actor.roles.includes("event_manager"))
    return (
      <main>
        <h1>Yetki yok</h1>
      </main>
    );
  const [items, events] = await Promise.all([
    listForms(s.actor),
    formEvents(s.actor),
  ]);

  const ulujamEvents = events.filter((e) => e.kind === "ulujam");
  const ulujamEventIds = new Set(ulujamEvents.map((e) => e.id));
  const primaryUlujamEvent =
    ulujamEvents.find(
      (e) => e.id === "90202700-0000-4000-8000-000000000001",
    ) ?? ulujamEvents[0];
  const creatorEvents = events
    .filter(
      (e) =>
        !(
          e.id === "80202600-0000-4000-8000-000000000001" &&
          ulujamEvents.length > 1
        ),
    )
    .map((e) =>
      primaryUlujamEvent && e.id === primaryUlujamEvent.id
        ? { ...e, title: "UluJam Formu" }
        : e,
    );

  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 16px" }}>
      <p>
        <Link href="/admin">← Yönetime dön</Link>
      </p>
      <h1>Form Yönetimi</h1>
      <p style={{ opacity: 0.85, marginBottom: "32px" }}>
        UluJam formunu ve sıfırdan oluşturulan tüm başvuru formlarını buradan
        yönetebilir, paylaşılabilir form linklerini alabilirsiniz.
      </p>

      {/* 01 / ULUJAM FORMU */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--admin-border)",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "36px",
        }}
      >
        <p className="eyebrow" style={{ color: "var(--purple)" }}>
          01 / ULUJAM FORMU
        </p>
        <h2 style={{ marginTop: "4px" }}>UluJam Formu</h2>
        <p style={{ opacity: 0.85 }}>
          UluJam başvuruları için kendine özel yapıya sahip genel UluJam formu.
          Katılımcı bilgileri, katılım biçimi, 5 seviyeli beceri derecelendirmesi ve
          takım seçenekleri hazır gelir. Oluştururken{" "}
          <strong>UluJam&apos;26</strong> veya <strong>UluJam&apos;27</strong> gibi
          bir başlık girerek diğer formlar gibi o başlık altında saklayabilirsiniz.
        </p>

        {primaryUlujamEvent ? (
          <p style={{ marginTop: "16px", marginBottom: 0 }}>
            <Link
              href={"/admin/ulujam-formu/" + primaryUlujamEvent.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--cream)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              UluJam formu önizlemesi →
            </Link>
          </p>
        ) : null}
      </section>

      {/* 02 / MEVCUT FORMLAR VE LİNKLERİ */}
      <section
        style={{
          background: "var(--panel)",
          border: "1px solid var(--admin-border)",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "36px",
        }}
      >
        <p className="eyebrow">02 / MEVCUT FORMLAR VE BAĞLANTILARI</p>
        <h2 style={{ marginTop: "4px" }}>Tüm Formlar ({items.length})</h2>
        <p style={{ opacity: 0.85 }}>
          Oluşturulan UluJam formları ve diğer tüm etkinlik formları verdikleri
          başlık altında burada listelenir. Bir form silindiğinde forma ait tüm
          cevaplar ve kayıtlar veritabanından kalıcı olarak silinir.
        </p>

        {items.length === 0 ? (
          <p style={{ opacity: 0.75 }}>Henüz hiç form oluşturulmadı.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
            {items.map((f) => {
              const isUlujamForm =
                !!f.eventId && ulujamEventIds.has(f.eventId);
              return (
                <div
                  key={f.id}
                  style={{
                    background: "var(--ink)",
                    padding: "18px 20px",
                    borderRadius: "14px",
                    border: "1px solid var(--admin-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                        <Link href={"/admin/formlar/" + f.id}>{f.title}</Link>
                      </h3>
                      {isUlujamForm && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "var(--purple)",
                            color: "var(--cream)",
                          }}
                        >
                          UluJam Formu
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background:
                            f.status === "published"
                              ? "var(--lime)"
                              : f.status === "draft"
                                ? "var(--coral)"
                                : "var(--line)",
                          color: "var(--ink)",
                        }}
                      >
                        {f.status === "published"
                          ? "Yayında"
                          : f.status === "draft"
                            ? "Taslak"
                            : f.status}
                      </span>
                      <Link
                        href={"/admin/formlar/" + f.id + "/basvurular"}
                        style={{
                          fontSize: "13px",
                          color: "var(--cream)",
                          textDecoration: "underline",
                        }}
                      >
                        Başvurular
                      </Link>
                      <Link
                        href={"/admin/formlar/" + f.id}
                        style={{
                          fontSize: "13px",
                          color: "var(--purple)",
                          textDecoration: "underline",
                        }}
                      >
                        Düzenle
                      </Link>
                      <DeleteFormButton formId={f.id} formTitle={f.title} />
                    </div>
                  </div>

                  {f.settings &&
                  typeof f.settings === "object" &&
                  "description" in f.settings &&
                  f.settings.description ? (
                    <p
                      style={{
                        margin: "8px 0",
                        fontSize: "14px",
                        opacity: 0.85,
                      }}
                    >
                      {String(f.settings.description)}
                    </p>
                  ) : null}

                  <div style={{ marginTop: "10px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--cream)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Form Bağlantısı (Link):
                    </span>
                    <FormLinkPill slug={f.slug} status={f.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 03 / SIFIRDAN FORM OLUŞTURMA */}
      <FormCreator events={creatorEvents} />
    </main>
  );
}
