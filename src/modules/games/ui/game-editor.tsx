"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formRequest } from "../../forms/ui/admin-fetch";
import type { GameEditorData, gameOptions } from "../application/game-service";
import { FinalistEditor } from "./finalist-editor";
type Options = Awaited<ReturnType<typeof gameOptions>>;
type Credit = {
  id?: string;
  applicationId: string | null;
  publicationName: string | null;
  consented?: boolean;
  token?: string | null;
};
export function GameEditor({
  events,
  initial,
  initialOptions,
}: {
  events: { id: string; title: string }[];
  initial?: GameEditorData;
  initialOptions?: Options;
}) {
  const router = useRouter(),
    [game, setGame] = useState(initial),
    [eventId, setEventId] = useState(initial?.eventId ?? events[0]?.id ?? ""),
    [options, setOptions] = useState<Options>(
      initialOptions ?? { teams: [], members: [], covers: [] },
    ),
    [title, setTitle] = useState(initial?.title ?? ""),
    [slug, setSlug] = useState(initial?.slug ?? ""),
    [description, setDescription] = useState(initial?.description ?? ""),
    [teamId, setTeamId] = useState(initial?.teamId ?? ""),
    [teamName, setTeamName] = useState(initial?.editorialTeamName ?? ""),
    [mediaId, setMediaId] = useState(initial?.mediaId ?? ""),
    [itch, setItch] = useState(initial?.itchUrl ?? ""),
    [partial, setPartial] = useState(initial?.historicalPartial ?? false),
    [credits, setCredits] = useState<Credit[]>(initial?.credits ?? []),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  useEffect(() => {
    if (initial || !eventId) return;
    let ignore = false;
    void fetch("/api/admin/games?options=1&eventId=" + eventId, {
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (!ignore) setOptions(d);
      })
      .catch(() => {
        if (!ignore) setMessage("Seçenekler alınamadı.");
      });
    return () => {
      ignore = true;
    };
  }, [eventId, initial]);
  async function reload() {
    if (!game) return;
    const r = await fetch("/api/admin/games/" + game.id, { cache: "no-store" }),
      d = await r.json();
    if (!r.ok) throw Error(d.error);
    const g = d.game as GameEditorData;
    setGame(g);
    setOptions(d.options);
    setTitle(g.title ?? "");
    setSlug(g.slug ?? "");
    setDescription(g.description ?? "");
    setTeamId(g.teamId ?? "");
    setTeamName(g.editorialTeamName ?? "");
    setMediaId(g.mediaId ?? "");
    setItch(g.itchUrl);
    setPartial(g.historicalPartial);
    setCredits(g.credits);
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const input = {
        title: title.trim() || null,
        slug: slug.trim() || null,
        description: description.trim() || null,
        teamId: teamId || null,
        mediaId: mediaId || null,
        itchUrl: itch.trim(),
        historicalPartial: partial,
        ...(game?.historic
          ? { editorialTeamName: teamName.trim() || null }
          : {}),
        credits: credits.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          applicationId: c.applicationId,
          publicationName: c.publicationName?.trim() || null,
        })),
      };
      const r = await formRequest(
        game ? "/api/admin/games/" + game.id : "/api/admin/games",
        game
          ? { action: "save", input, expectedRevision: game.revision }
          : { eventId, input },
      );
      if (!game) router.push("/admin/oyunlar/" + r.id);
      else {
        await reload();
        setMessage(
          "Taslak kaydedildi. Tam yayın için yapımcı onayları ve yayın işlemi gerekir.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Taslak kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }
  async function action(action: string, extra: Record<string, unknown> = {}) {
    if (!game) return;
    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/games/" + game.id, {
        action,
        expectedRevision: game.revision,
        ...extra,
      });
      await reload();
      setMessage(
        action === "publish"
          ? "Oyun yayımlandı."
          : action === "unpublish"
            ? "Oyun yayından kaldırıldı."
            : "Sonuç bilgisi kaydedildi.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  const members = options.members.filter((m) => m.teamId === teamId);
  return (
    <section aria-label="Oyun editörü">
      <p role="status">{message}</p>
      {game && (
        <p>
          Durum: {game.published ? "Yayımlanmış" : "Taslak"} · Sürüm:{" "}
          {game.revision}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy}>
          <legend>Oyun bilgileri</legend>
          <label className="field">
            Etkinlik
            <select
              value={eventId}
              disabled={!!game}
              onChange={(e) => {
                setEventId(e.target.value);
                setTeamId("");
                setCredits([]);
              }}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Oyun adı
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            Oyun adresi
            <input
              value={slug}
              maxLength={100}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
          <label className="field">
            Açıklama
            <textarea
              value={description}
              maxLength={10000}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="field">
            Takım
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setCredits([]);
              }}
            >
              <option value="">Takım seçilmedi</option>
              {options.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {game?.historic && (
            <>
              <label className="field">
                Doğrulanmış 2026 takım adı
                <input
                  value={teamName}
                  maxLength={200}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </label>
              <p>
                Arşivde gerçek katılımcı kayıtları bulunmuyorsa doğrulanmış
                takım adı burada tutulabilir.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={partial}
                  onChange={(e) => setPartial(e.target.checked)}
                />{" "}
                Kısmi 2026 arşiv kaydı olarak yayımla
              </label>
            </>
          )}
          <label className="field">
            Kapak
            <select
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
            >
              <option value="">Görsel yok</option>
              {options.covers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label ?? c.id}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            itch.io HTTPS oyun bağlantısı
            <input
              value={itch}
              maxLength={500}
              type="url"
              onChange={(e) => setItch(e.target.value)}
            />
          </label>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Yapımcı yayın adları</legend>
          <p>
            Başvuru adı otomatik eklenmez. Önerdiğiniz adın onayı sahibinin özel
            bağlantısından alınır. Ad değişirse önceki onay kaldırılır.
          </p>
          {credits.map((c, i) => (
            <div key={c.id ?? i} className="card">
              <label className="field">
                {i + 1}. yapımcı kaydı
                <select
                  value={c.applicationId ?? ""}
                  onChange={(e) =>
                    setCredits(
                      credits.map((row, n) =>
                        n === i
                          ? {
                              ...row,
                              applicationId: e.target.value || null,
                              consented: false,
                            }
                          : row,
                      ),
                    )
                  }
                >
                  <option value="">
                    {game?.historic ? "Arşiv yapımcısı" : "Üye seçin"}
                  </option>
                  {members.map((m, n) => (
                    <option key={m.id} value={m.id}>
                      {"label" in m
                        ? String(m.label)
                        : "Takım üyesi " + (n + 1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {i + 1}. önerilen yayın adı
                <input
                  value={c.publicationName ?? ""}
                  maxLength={160}
                  onChange={(e) =>
                    setCredits(
                      credits.map((row, n) =>
                        n === i
                          ? {
                              ...row,
                              publicationName: e.target.value,
                              consented: false,
                            }
                          : row,
                      ),
                    )
                  }
                />
              </label>
              <p>Yayın onayı: {c.consented ? "Alındı" : "Bekleniyor"}</p>
              {c.token && (
                <a
                  href={"/yayin-onayi/" + c.token}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {i + 1}. yapımcıya özel onay bağlantısı (yeni sekmede)
                </a>
              )}
              <p>
                <button
                  type="button"
                  onClick={() => setCredits(credits.filter((_, n) => n !== i))}
                >
                  Bu yapımcıyı kaldır
                </button>
              </p>
            </div>
          ))}
          <button
            type="button"
            disabled={credits.length >= 20}
            onClick={() =>
              setCredits([
                ...credits,
                {
                  applicationId: members[0]?.id ?? null,
                  publicationName: null,
                },
              ])
            }
          >
            Yapımcı ekle
          </button>
        </fieldset>
        <p>
          <button disabled={busy}>Oyun taslağını kaydet</button>
        </p>
      </form>
      <button disabled={busy} onClick={() => setPreview(!preview)}>
        Taslak önizlemesini {preview ? "kapat" : "göster"}
      </button>
      {preview && (
        <article aria-label="Taslak oyun önizlemesi" className="card">
          <h2>{title || "Oyun adı girilmedi"}</h2>
          <p>{options.teams.find((t) => t.id === teamId)?.name ?? teamName}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{description}</p>
          <p>
            Onaylı yapımcılar:{" "}
            {credits
              .filter((c) => c.consented)
              .map((c) => c.publicationName)
              .join(" · ") || "Yok"}
          </p>
          <p>{itch}</p>
          <p>Bu önizleme kamuya açık değildir.</p>
        </article>
      )}
      {game && (
        <>
          <p>
            <button
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void reload()
                  .then(() => setMessage("Kayıt yenilendi."))
                  .catch(() => setMessage("Kayıt alınamadı."))
                  .finally(() => setBusy(false));
              }}
            >
              Onayları ve kaydı yenile
            </button>
          </p>
          <FinalistEditor
            key={game.revision}
            finalist={game.finalist}
            rank={game.rank}
            busy={busy}
            onFinalist={(selected) => action("finalist", { selected })}
            onAward={(rank) => action("award", { rank })}
          />
          <p>
            Yayın işlemi kaydedilmiş sürümü kullanır. Önce taslağı kaydedin;
            adları ve bağlantıyı önizlemeden kontrol edin.
          </p>
          <button disabled={busy} onClick={() => void action("publish")}>
            Oyunu yayımla
          </button>
          <button
            disabled={busy || !game.published}
            onClick={() => void action("unpublish")}
          >
            Oyunu yayından kaldır
          </button>
          {game.published && game.slug && (
            <p>
              <a href={"/oyunlar/" + game.slug}>Genel oyun sayfasını aç</a>
            </p>
          )}
        </>
      )}
    </section>
  );
}
