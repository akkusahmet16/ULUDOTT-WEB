import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import {
  listForms,
  formEvents,
} from "../../../modules/forms/application/form-service";
import { FormCreator } from "../../../modules/forms/ui/form-builder";
import { FormLinkPill } from "../../../modules/forms/ui/form-link-actions";

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
  const ulujamForms = items.filter((f) =>
    ulujamEvents.some((e) => e.id === f.eventId),
  );

  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 16px" }}>
      <p>
        <Link href="/admin">← Yönetime dön</Link>
      </p>
      <h1>Form Yönetimi</h1>
      <p style={{ opacity: 0.85, marginBottom: "32px" }}>
        Game Jam (UluJam) başvuru formunu ve sıfırdan oluşturulan tüm özel formları
        buradan yönetebilir, paylaşılabilir form linklerini alabilirsiniz.
      </p>

      {/* 01 / SABİT GAME JAM BAŞVURU FORMU */}
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
          01 / SABİT GAME JAM BAŞVURU FORMU
        </p>
        <h2 style={{ marginTop: "4px" }}>Game Jam (UluJam) Başvuruları</h2>
        <p style={{ opacity: 0.85 }}>
          UluJam etkinlikleri için sabit başvuru formu. Katılımcı bilgileri, katılım biçimi,
          5 seviyeli beceri derecelendirmesi ve takım seçenekleri hazır gelir.
        </p>

        {ulujamForms.length > 0 ? (
          <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
            {ulujamForms.map((f) => (
              <div
                key={f.id}
                style={{
                  background: "var(--ink)",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                    <Link href={"/admin/formlar/" + f.id}>{f.title}</Link>
                  </h3>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      background: f.status === "published" ? "var(--lime)" : "var(--line)",
                      color: "var(--ink)",
                    }}
                  >
                    {f.status === "published" ? "Yayında" : f.status}
                  </span>
                </div>
                {f.settings && typeof f.settings === "object" && "description" in f.settings && f.settings.description ? (
                  <p style={{ margin: "8px 0", fontSize: "14px", opacity: 0.85 }}>
                    {String(f.settings.description)}
                  </p>
                ) : null}
                <div style={{ marginTop: "10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--cream)", display: "block", marginBottom: "4px" }}>
                    Sabit Form Bağlantısı (Link):
                  </span>
                  <FormLinkPill slug={f.slug} status={f.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ opacity: 0.75, fontStyle: "italic" }}>
            Henüz UluJam için oluşturulmuş form bulunmuyor. Aşağıdaki form oluşturucudan UluJam etkinliğini seçerek oluşturabilirsiniz.
          </p>
        )}

        {ulujamEvents.map((e) => (
          <p key={e.id} style={{ marginTop: "16px" }}>
            <Link
              href={"/admin/ulujam-formu/" + e.id}
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
              {e.title} özel form önizlemesi →
            </Link>
          </p>
        ))}
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
          Sistemdeki her formun katılımcılara verilecek linkini ve durumunu buradan görebilirsiniz.
        </p>

        {items.length === 0 ? (
          <p style={{ opacity: 0.75 }}>Henüz hiç form oluşturulmadı.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
            {items.map((f) => (
              <div
                key={f.id}
                style={{
                  background: "var(--ink)",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                    <Link href={"/admin/formlar/" + f.id}>{f.title}</Link>
                  </h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                      {f.status === "published" ? "Yayında" : f.status === "draft" ? "Taslak" : f.status}
                    </span>
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
                  </div>
                </div>

                {f.settings && typeof f.settings === "object" && "description" in f.settings && f.settings.description ? (
                  <p style={{ margin: "8px 0", fontSize: "14px", opacity: 0.85 }}>
                    {String(f.settings.description)}
                  </p>
                ) : null}

                <div style={{ marginTop: "10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--cream)", display: "block", marginBottom: "4px" }}>
                    Form Bağlantısı (Link):
                  </span>
                  <FormLinkPill slug={f.slug} status={f.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 03 / SIFIRDAN FORM OLUŞTURMA */}
      <FormCreator events={events} />
    </main>
  );
}
