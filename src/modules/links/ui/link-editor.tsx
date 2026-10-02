"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/design-system/button";
import { Field } from "../../../components/design-system/field";
import { icons, type LinkItem } from "../domain/link";
type Group = { id: string; title: string; position: number; revision: number };
const localTime = (v: Date | null) =>
  v
    ? new Date(new Date(v).getTime() + 3 * 3600000).toISOString().slice(0, 16)
    : "";
export function LinkEditor() {
  const [groups, setGroups] = useState<Group[]>([]),
    [items, setItems] = useState<LinkItem[]>([]),
    [link, setLink] = useState<LinkItem | null>(null),
    [group, setGroup] = useState<Group | null>(null),
    [chosenGroup, setChosenGroup] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const r = await fetch("/api/admin/links", { cache: "no-store" });
    if (!r.ok) throw Error("Liste alınamadı");
    const data = await r.json();
    setGroups(data.groups);
    setItems(data.links);
    if (!chosenGroup && data.groups.length) setChosenGroup(data.groups[0].id);
  }
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
  }, []);
  async function mutate(data: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const c = await fetch("/api/admin/csrf", { cache: "no-store" });
      if (!c.ok) throw Error("İstek doğrulanamadı");
      const { csrfToken } = await c.json();
      const r = await fetch("/api/admin/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      await refresh();
      const action = (data as { action: string }).action;
      if (action === "save_link") {
        setLink(result);
        setChosenGroup(result.groupId);
      }
      if (action === "save_group") setGroup(result);
      if (action === "hide") setLink((current) => current?.id === result.id ? result : current);
      if (action.startsWith("reorder")) {
        setLink(null);
        setGroup(null);
      }
      setMessage(
        action === "hide"
          ? "Gizlendi."
          : action.startsWith("reorder")
            ? "Sıra güncellendi."
            : "Kaydedildi.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  async function groupSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await mutate({
      action: "save_group",
      input: {
        title: String(f.get("title")),
        position: Number(f.get("position")),
        ...(group ? { id: group.id, expectedRevision: group.revision } : {}),
      },
    });
  }
  async function linkSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      str = (k: string) => String(f.get(k) ?? ""),
      date = (k: string) =>
        str(k) ? new Date(`${str(k)}:00+03:00`).toISOString() : null;
    await mutate({
      action: "save_link",
      input: {
        groupId: str("groupId"),
        title: str("title"),
        url: str("url"),
        description: str("description") || null,
        icon: str("icon"),
        position: Number(f.get("position")),
        published: f.has("published"),
        featured: f.has("featured"),
        verified: f.has("verified"),
        startsAt: date("startsAt"),
        endsAt: date("endsAt"),
        ...(link ? { id: link.id, expectedRevision: link.revision } : {}),
      },
    });
  }
  async function move(id: string, direction: number, category = false) {
    const rows = category
      ? groups
      : items.filter(
          (x) => x.groupId === items.find((x) => x.id === id)?.groupId,
        );
    const ids = rows.map((x) => x.id),
      i = ids.indexOf(id);
    if (i + direction < 0 || i + direction >= ids.length) return;
    [ids[i], ids[i + direction]] = [ids[i + direction], ids[i]];
    await mutate({
      action: category ? "reorder_groups" : "reorder_links",
      orderedIds: ids,
      expectedRevisions: Object.fromEntries(
        rows.map((x) => [x.id, x.revision]),
      ),
    });
  }
  const nextPosition = (rows: { position: number }[]) =>
    rows.length ? Math.max(...rows.map((x) => x.position)) + 1 : 0;
  return (
    <>
      <p role="status">{message}</p>
      <div className="actions">
        <Button
          disabled={busy}
          onClick={() => {
            setGroup(null);
            setMessage("");
          }}
        >
          Yeni kategori
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            setLink(null);
            setMessage("");
          }}
        >
          Yeni bağlantı
        </Button>
        <Button
          disabled={busy}
          onClick={() => void refresh().then(() => { setLink(null); setGroup(null); }).catch((e) => setMessage(e.message))}
        >
          Listeyi yenile
        </Button>
      </div>
      <section aria-label="Kategori düzenleyici">
        <h2>Kategori</h2>
        <form
          className="content-form"
          key={group ? `${group.id}-${group.revision}` : "new-group"}
          onSubmit={groupSubmit}
        >
          <Field
            id="group-title"
            label="Kategori başlığı"
            name="title"
            required
            maxLength={80}
            defaultValue={group?.title ?? ""}
          />
          <Field
            id="group-position"
            label="Kategori sırası"
            name="position"
            type="number"
            min={0}
            max={9999}
            required
            defaultValue={group?.position ?? nextPosition(groups)}
          />
          <Button disabled={busy}>Kategoriyi kaydet</Button>
        </form>
      </section>
      <section aria-label="Bağlantı düzenleyici">
        <h2>Bağlantı</h2>
        {!groups.length ? (
          <p>Önce kategori oluşturun.</p>
        ) : (
          <form
            className="content-form"
            key={
              link ? `${link.id}-${link.revision}` : `new-link-${chosenGroup}`
            }
            onSubmit={linkSubmit}
          >
            <label className="field">
              Kategori
              <select
                name="groupId"
                value={chosenGroup}
                onChange={(e) => setChosenGroup(e.target.value)}
                required
              >
                {groups.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
            <Field
              id="link-title"
              label="Bağlantı başlığı"
              name="title"
              required
              maxLength={150}
              defaultValue={link?.title ?? ""}
            />
            <Field
              id="link-url"
              label="Adres"
              name="url"
              required
              maxLength={2000}
              defaultValue={link?.url ?? ""}
              hint="Doğrulanmış HTTPS adresi veya mevcut genel site yolu."
            />
            <Field
              id="link-description"
              label="Açıklama"
              name="description"
              maxLength={500}
              defaultValue={link?.description ?? ""}
            />
            <label className="field">
              İkon
              <select name="icon" defaultValue={link?.icon ?? "link"}>
                {Object.entries(icons).map(([name, glyph]) => (
                  <option key={name} value={name}>
                    {glyph}{" "}
                    {
                      (
                        {
                          link: "Bağlantı",
                          community: "Topluluk",
                          calendar: "Takvim",
                          game: "Oyun",
                          video: "Video",
                          document: "Belge",
                        } as Record<string, string>
                      )[name]
                    }
                  </option>
                ))}
              </select>
            </label>
            <Field
              id="link-position"
              label="Bağlantı sırası"
              name="position"
              type="number"
              min={0}
              max={9999}
              required
              defaultValue={
                link?.position ??
                nextPosition(items.filter((x) => x.groupId === chosenGroup))
              }
            />
            <Field
              id="link-start"
              label="Başlangıç (İstanbul)"
              name="startsAt"
              type="datetime-local"
              defaultValue={localTime(link?.startsAt ?? null)}
            />
            <Field
              id="link-end"
              label="Bitiş (İstanbul)"
              name="endsAt"
              type="datetime-local"
              defaultValue={localTime(link?.endsAt ?? null)}
            />
            <label className="check-field">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={link?.featured ?? false}
              />
              Öne çıkar
            </label>
            <label className="check-field">
              <input
                name="published"
                type="checkbox"
                defaultChecked={link?.published ?? false}
              />
              Yayımla
            </label>
            <label className="check-field">
              <input name="verified" type="checkbox" />
              Dış adresi doğruladım
            </label>
            <Button disabled={busy}>Bağlantıyı kaydet</Button>
          </form>
        )}
      </section>
      <section aria-label="Bağlantı envanteri">
        <h2>Kayıtlar</h2>
        {groups.map((g, gi) => (
          <section key={g.id} aria-label={g.title} className="section">
            <h3>{g.title}</h3>
            <div className="actions">
              <Button disabled={busy} onClick={() => setGroup(g)}>
                Kategoriyi düzenle
              </Button>
              <Button
                disabled={busy || gi === 0}
                onClick={() => move(g.id, -1, true)}
              >
                Kategoriyi yukarı taşı
              </Button>
              <Button
                disabled={busy || gi === groups.length - 1}
                onClick={() => move(g.id, 1, true)}
              >
                Kategoriyi aşağı taşı
              </Button>
            </div>
            <div className="grid">
              {items
                .filter((l) => l.groupId === g.id)
                .map((item, i, array) => (
                  <article className="card" key={item.id}>
                    <h4>{item.title}</h4>
                    <p>
                      {item.published ? "Yayın açık" : "Gizli"} · Sürüm{" "}
                      {item.revision}
                    </p>
                    <p className="content-body">{item.url}</p>
                    <div className="actions">
                      <Button
                        disabled={busy}
                        onClick={() => {
                          setLink(item);
                          setChosenGroup(item.groupId);
                        }}
                      >
                        Düzenle
                      </Button>
                      <Button
                        disabled={busy || !item.published}
                        onClick={() =>
                          mutate({
                            action: "hide",
                            id: item.id,
                            expectedRevision: item.revision,
                          })
                        }
                      >
                        Gizle
                      </Button>
                      <Button
                        disabled={busy || i === 0}
                        onClick={() => move(item.id, -1)}
                      >
                        Yukarı taşı
                      </Button>
                      <Button
                        disabled={busy || i === array.length - 1}
                        onClick={() => move(item.id, 1)}
                      >
                        Aşağı taşı
                      </Button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </section>
    </>
  );
}
