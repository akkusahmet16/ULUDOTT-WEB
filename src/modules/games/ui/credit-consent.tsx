"use client";
import { useState } from "react";
import { publicRequest } from "../../forms/ui/public-form";
import type { getPublicationConsent } from "../application/credit-consent-service";
export function CreditConsent({
  token,
  initial,
}: {
  token: string;
  initial: Awaited<ReturnType<typeof getPublicationConsent>>;
}) {
  const [name, setName] = useState(initial.publicationName),
    [checked, setChecked] = useState(initial.consented),
    [approved, setApproved] = useState(initial.consented),
    [revision, setRevision] = useState(initial.revision),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(consent: boolean) {
    setBusy(true);
    try {
      const r = await publicRequest("/api/cards/publication-consent", {
        token,
        publicationName: name,
        consent,
        expectedRevision: revision,
      });
      setRevision(r.revision);
      setApproved(r.consented);
      setChecked(r.consented);
      setMessage(
        consent
          ? "Yayın adınız için onay kaydedildi. Oyun yöneticisi artık yayını değerlendirebilir."
          : "Yayın onayınız geri çekildi. Oyun tam yayından kaldırıldı.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Onay kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Yapımcı yayın onayı">
      <h1>Yayın adı tercihiniz</h1>
      <h2>{initial.title}</h2>
      <p>{initial.event}</p>
      <p>
        Başvuru adınız kendiliğinden yayımlanmaz. Burada seçtiğiniz ad, yalnız
        bu oyunun genel sonuç sayfasında görünebilir. Bu özel bağlantıyı
        saklayarak onayınızı geri çekebilirsiniz.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(true);
        }}
      >
        <fieldset disabled={busy}>
          <label className="field">
            Yayımlanacak yapımcı adı
            <input
              value={name}
              maxLength={160}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />{" "}
            Bu adın bu oyunda herkese açık yayımlanmasına izin veriyorum.
          </label>
          <p>
            <button disabled={busy || !checked || !name.trim()}>
              Yayın adımı onayla
            </button>
          </p>
        </fieldset>
      </form>
      {approved && (
        <button disabled={busy} onClick={() => void submit(false)}>
          Yayın onayımı geri çek
        </button>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
