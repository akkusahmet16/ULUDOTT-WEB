"use client";
import { useState, useEffect, type FormEvent } from "react";
import { Button } from "../../../components/design-system/button";
import { Field } from "../../../components/design-system/field";
import { Card } from "../../../components/design-system/card";
import { Dialog } from "../../../components/design-system/dialog";
type MediaItem = {
  id: string;
  altText: string;
  variants: {
    id: string;
    mimeType: string;
    width: number;
    height: number;
    published: boolean;
  }[];
};
async function mutate(
  body: FormData | { action: string; assetId: string; confirmed: true },
) {
  const c = await fetch("/api/admin/csrf", { cache: "no-store" });
  if (!c.ok) throw new Error("İstek doğrulanamadı");
  const { csrfToken } = await c.json();
  const form = body instanceof FormData;
  const r = await fetch("/api/admin/media", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
      ...(form ? {} : { "Content-Type": "application/json" }),
    },
    body: form ? body : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}
export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [effects, setEffects] = useState<Record<string, number>>({});
  async function refresh() {
    const r = await fetch("/api/admin/media", { cache: "no-store" });
    if (!r.ok) throw new Error("Medya listesi alınamadı");
    setItems((await r.json()).items);
  }
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
  }, []);
  async function action(body: Parameters<typeof mutate>[0]) {
    setBusy(true);
    setMessage("");
    try {
      await mutate(body);
      await refresh();
      setEffects({});
      setMessage("İşlem tamamlandı.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    await action(new FormData(form));
  }
  async function preview(id: string) {
    try {
      const r = await fetch(`/api/admin/media?deletion=${id}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("Silme etkisi alınamadı");
      setEffects({ ...effects, [id]: (await r.json()).references.length });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    }
  }
  return (
    <>
      <form onSubmit={upload}>
        <Field
          id="media-file"
          label="Görsel dosyası"
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif"
          required
          hint="En fazla 8 MiB, 25 megapiksel; tek kare."
        />
        <Field
          id="media-alt"
          label="Alt metin"
          name="altText"
          required
          maxLength={250}
          hint="Görselin içeriğini kısa ve anlaşılır anlatın."
        />
        <label className="field">
          Kullanım
          <select name="purpose">
            <option value="photo">Fotoğraf</option>
            <option value="poster">Afiş</option>
            <option value="game">Oyun</option>
            <option value="social">Paylaşım</option>
          </select>
        </label>
        <Button disabled={busy}>{busy ? "İşleniyor…" : "Yükle"}</Button>
      </form>
      <p role="status">{message}</p>
      <section aria-label="Medya kütüphanesi">
        <h2>Görseller</h2>
        {!items.length && <p className="empty">Henüz yüklenmiş görsel yok.</p>}
        <div className="grid">
          {items.map((item) => {
            const v = item.variants.find((x) => x.mimeType === "image/webp")!;
            return (
              <Card key={item.id}>
                <h3>{item.altText}</h3>
                {v && (
                  <picture>
                    <img
                      src={`/api/admin/media?preview=${v.id}`}
                      alt={item.altText}
                      width={v.width}
                      height={v.height}
                    />
                  </picture>
                )}
                <p>{v?.published ? "Yayında" : "Özel"}</p>
                {v?.published ? (
                  <a href={`/media/${v.id}`}>Yayımlanan görsel</a>
                ) : (
                  <Dialog title="Görsel yayını" trigger="Yayımla">
                    <p>
                      Görselin yayın hakkı ve kişilerin yayın izni
                      doğrulandıktan sonra türevleri herkese açın. Orijinal özel
                      kalır.
                    </p>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        action({
                          action: "publish",
                          assetId: item.id,
                          confirmed: true,
                        })
                      }
                    >
                      Türevleri yayımla
                    </Button>
                  </Dialog>
                )}
                <div className="actions">
                  <Button disabled={busy} onClick={() => preview(item.id)}>
                    Silme etkisini göster
                  </Button>
                </div>
                {effects[item.id] !== undefined && (
                  <>
                    <p>Bağlı içerik: {effects[item.id]}</p>
                    {effects[item.id] === 0 ? (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          action({
                            action: "delete",
                            assetId: item.id,
                            confirmed: true,
                          })
                        }
                      >
                        Silmeyi onayla
                      </Button>
                    ) : (
                      <p>Önce içerik bağlantılarını kaldırın.</p>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
