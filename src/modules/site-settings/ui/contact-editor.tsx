"use client";
import { useState, type FormEvent } from "react";
import type { ContactSettings, SocialAccount } from "../domain/contact";
import { socialIcons } from "../domain/contact";
import { formRequest } from "../../forms/ui/admin-fetch";
import { SocialIcon } from "./social-icon";
import styles from "../../admin/ui/content-workspace.module.css";
export function ContactEditor({
  initial,
}: {
  initial: { data: ContactSettings; revision: number };
}) {
  const [data, setData] = useState(initial.data),
    [revision, setRevision] = useState(initial.revision),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const change = <K extends keyof ContactSettings>(
    key: K,
    value: ContactSettings[K],
  ) => setData((current) => ({ ...current, [key]: value }));
  const social = (index: number, update: Partial<SocialAccount>) =>
    change(
      "socials",
      data.socials.map((item, i) =>
        i === index ? { ...item, ...update } : item,
      ),
    );
  function move(index: number, delta: number) {
    const next = [...data.socials];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    change("socials", next);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const saved = await formRequest("/api/admin/contact-settings", {
        input: data,
        expectedRevision: revision,
      });
      setData(saved.data);
      setRevision(saved.revision);
      setMessage("İletişim bilgileri ve alt bağlantılar kaydedildi.");
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
      const response = await fetch("/api/admin/contact-settings", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setData(result.data);
      setRevision(result.revision);
      setMessage("Güncel ayarlar alındı.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ayarlar alınamadı");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.workspace} aria-label="İletişim ayarları">
      <p role="status" className={styles.status}>
        {message}
      </p>
      <button type="button" disabled={busy} onClick={() => void refresh()}>
        Ayarları yenile
      </button>
      <form className={styles.form} onSubmit={(event) => void save(event)}>
        <section className={styles.card}>
          <h2>İletişim sayfası</h2>
          <label className="field">
            Sayfa başlığı
            <input
              value={data.title}
              onChange={(event) => change("title", event.target.value)}
              required
              maxLength={160}
            />
          </label>
          <label className="field">
            Giriş metni
            <textarea
              value={data.description}
              onChange={(event) => change("description", event.target.value)}
              maxLength={3000}
            />
          </label>
          <label className="field">
            İletişim alanı başlığı
            <input
              value={data.channelsTitle}
              onChange={(event) => change("channelsTitle", event.target.value)}
              required
              maxLength={160}
            />
          </label>
          <div className={styles.row}>
            <label className="field">
              E-posta adresi
              <input
                type="email"
                value={data.email}
                onChange={(event) => change("email", event.target.value)}
                maxLength={250}
              />
              <small>Boş bırakılırsa e-posta kartı gizlenir.</small>
            </label>
            <label className="field">
              Telefon
              <input
                type="tel"
                value={data.phone}
                onChange={(event) => change("phone", event.target.value)}
                maxLength={40}
              />
              <small>Boş bırakılırsa telefon kartı gizlenir.</small>
            </label>
          </div>
        </section>
        <section className={styles.card}>
          <h2>Sayfanın alt bölümü</h2>
          <label className="field">
            Topluluk açıklaması
            <input
              value={data.footerDescription}
              onChange={(event) =>
                change("footerDescription", event.target.value)
              }
              maxLength={300}
            />
          </label>
          <label className="field">
            Alt bölüm mesajı
            <input
              value={data.footerTagline}
              onChange={(event) => change("footerTagline", event.target.value)}
              maxLength={500}
            />
          </label>
        </section>
        <section className={styles.card} aria-label="Sosyal bağlantılar">
          <h2>Sosyal medya ve bağlantılar</h2>
          <p>
            Her bağlantının nerede görüneceğini seçin. Sıra hem iletişim
            ekranında hem alt bölümde korunur.
          </p>
          {data.socials.map((item, index) => (
            <fieldset className={styles.card} key={item.id}>
              <legend style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: "8px" }}>
                <span>{index + 1}. {item.title || "Bağlantı"}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {item.icon === "text" ? (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "100px",
                        border: "1px solid var(--color-edb2e4aa)",
                        background: "var(--color-edb2e420)",
                        color: "var(--color-fff2b7)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.title || "YAZI BAĞLANTISI"} ↗
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "1px solid var(--color-ffffff20)",
                        background: "var(--color-ffffff08)",
                      }}
                    >
                      <SocialIcon icon={item.icon} size={16} />
                    </span>
                  )}
                </span>
              </legend>
              <label className="field">
                Bağlantı adı
                <input
                  value={item.title}
                  onChange={(event) =>
                    social(index, { title: event.target.value })
                  }
                  maxLength={80}
                  required
                />
              </label>
              <label className="field">
                Bağlantı adresi
                <input
                  type="url"
                  value={item.url}
                  onChange={(event) =>
                    social(index, { url: event.target.value })
                  }
                  maxLength={2000}
                  required
                />
              </label>
              <label className="field">
                Bağlantı Türü / İkon
                <select
                  aria-label="Simge"
                  value={item.icon}
                  onChange={(event) =>
                    social(index, {
                      icon: event.target.value as SocialAccount["icon"],
                    })
                  }
                >
                  {socialIcons.map((icon) => (
                    <option key={icon} value={icon}>
                      {
                        {
                          instagram: "Instagram (Beyaz Logo)",
                          whatsapp: "WhatsApp (Beyaz Logo)",
                          x: "X / Twitter (Beyaz Logo)",
                          youtube: "YouTube (Beyaz Logo)",
                          discord: "Discord (Beyaz Logo)",
                          linkedin: "LinkedIn (Beyaz Logo)",
                          kick: "Kick (Beyaz Logo)",
                          link: "Diğer Bağlantı (Zincir İkon)",
                          text: "Özel Yazı Bağlantısı (Metin Buton)",
                        }[icon]
                      }
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.actions}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={item.contact}
                    onChange={(event) =>
                      social(index, { contact: event.target.checked })
                    }
                  />{" "}
                  İletişim sayfasında göster
                </label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={item.footer}
                    onChange={(event) =>
                      social(index, { footer: event.target.checked })
                    }
                  />{" "}
                  Alt bölümde göster
                </label>
              </div>
              <div className={styles.toolbar}>
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  Yukarı
                </button>
                <button
                  type="button"
                  disabled={busy || index === data.socials.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Aşağı
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    change(
                      "socials",
                      data.socials.filter((_, i) => i !== index),
                    )
                  }
                >
                  Bağlantıyı kaldır
                </button>
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={busy || data.socials.length >= 30}
            onClick={() =>
              change("socials", [
                ...data.socials,
                {
                  id: crypto.randomUUID(),
                  title: "",
                  url: "",
                  icon: "link",
                  contact: true,
                  footer: true,
                },
              ])
            }
          >
            Bağlantı ekle
          </button>
        </section>
        <button type="submit" disabled={busy}>
          {busy ? "Kaydediliyor…" : "İletişim ayarlarını kaydet"}
        </button>
      </form>
    </section>
  );
}
