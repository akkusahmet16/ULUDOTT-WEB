"use client";
import type { ExplainedRecommendation } from "../domain/recommendation";
import { useState } from "react";
import type { SeekerBoardData } from "../application/matching-service";
import { skillKeys, skillLabels } from "../domain/skills";
import { formRequest } from "../../forms/ui/admin-fetch";
export function SeekerBoard({
  events,
  initial,
}: {
  events: { id: string; title: string }[];
  initial: SeekerBoardData | null;
}) {
  const [eventId, setEvent] = useState(events[0]?.id ?? ""),
    [skill, setSkill] = useState(""),
    [level, setLevel] = useState(1),
    [data, setData] = useState(initial),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [participantCursor, setParticipantCursor] = useState<string | undefined>(),
    [teamCursor, setTeamCursor] = useState<string | undefined>();
  async function load(cursor?: string, tcursor?: string) {
    setBusy(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        eventId,
        minLevel: String(level),
        ...(skill ? { skill } : {}),
        ...(cursor ? { cursor } : {}),
        ...(tcursor ? { teamCursor: tcursor } : {}),
      });
      const response = await fetch("/api/admin/assignments?" + params, {
          cache: "no-store",
        }),
        result = await response.json();
      if (!response.ok) throw Error(result.error ?? "Liste alınamadı");
      setData(result);
      setParticipantCursor(cursor);
      setTeamCursor(tcursor);
    } catch (e) {
      setData(null);
      setMessage(e instanceof Error ? e.message : "Liste alınamadı");
    } finally {
      setBusy(false);
    }
  }
  async function command(
    action: "assign" | "undo",
    participantId: string,
    teamId: string,
    expectedRevision: number,
  ) {
    setBusy(true);
    setMessage("");
    try {
      await formRequest("/api/admin/assignments", {
        action,
        participantId,
        teamId,
        expectedRevision,
      });
      await load(participantCursor, teamCursor);
      setMessage(
        action === "assign" ? "Atama kaydedildi." : "Atama geri alındı.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setBusy(false);
    }
  }
  const renderTeam = (personId: string, team: ExplainedRecommendation) => (
    <section key={team.id} aria-label={team.name}>
      <h3>{team.name}</h3>
      <p>
        {team.memberCount}/{team.expectedSize} üye · katkı puanı {team.score}
      </p>
      <ul>
        {team.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <button
        disabled={busy}
        onClick={() =>
          void command("assign", personId, team.id, team.rosterRevision)
        }
      >
        Bu takıma ata
      </button>
    </section>
  );
  return (
    <section aria-label="Takım arayan paneli">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label className="field">
          Etkinlik
          <select
            value={eventId}
            onChange={(e) => {
              setEvent(e.target.value);
              setData(null);
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
          Beceri alanı
          <select
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              setData(null);
            }}
          >
            <option value="">Tüm alanlar</option>
            {skillKeys.map((s) => (
              <option key={s} value={s}>
                {skillLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          En düşük seviye
          <select
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value));
              setData(null);
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}/5
              </option>
            ))}
          </select>
        </label>
        <button disabled={busy || !eventId}>Filtrele</button>
      </form>
      <p role="status">{message}</p>
      <p>
        Öneriler bu sayfadaki takımlar arasında beceri çeşitliliği ve seviye
        katkısına göre sıralanır. Diğer adaylar için sonraki takım önerileri
        sayfasını açın. Atama katılım onayı vermez.
      </p>
      {data?.items.length === 0 && <p>Bu filtrelerde takım arayan yok.</p>}
      {data?.items.map((person) => (
        <article key={person.id} aria-label={person.fullName}>
          <h2>{person.fullName}</h2>
          <p>
            {person.skills
              .map((s) => `${skillLabels[s.skill]} ${s.level}/5`)
              .join(" · ")}
          </p>
          {person.assigned ? (
            <>
              <p>Atandığı takım: {person.assigned.name}</p>
              <button
                disabled={busy}
                onClick={() =>
                  void command(
                    "undo",
                    person.id,
                    person.assigned!.id,
                    person.assigned!.rosterRevision,
                  )
                }
              >
                Atamayı geri al
              </button>
            </>
          ) : (
            <>
              {person.recommendations.length === 0 && (
                <p>Bu sayfada uygun boş takım yok.</p>
              )}
              {person.recommendations
                .slice(0, 5)
                .map((team) => renderTeam(person.id, team))}
              {person.recommendations.length > 5 && (
                <details>
                  <summary>
                    Diğer uygun takımlar ({person.recommendations.length - 5})
                  </summary>
                  {person.recommendations
                    .slice(5)
                    .map((team) => renderTeam(person.id, team))}
                </details>
              )}
            </>
          )}
        </article>
      ))}
      {data && (
        <nav aria-label="Eşleştirme sayfaları">
          <button disabled={busy} onClick={() => void load()}>
            İlk sayfaya dön
          </button>
          {data.nextCursor && (
            <button
              disabled={busy}
              onClick={() => void load(data.nextCursor!, teamCursor)}
            >
              Sonraki katılımcılar
            </button>
          )}
          {data.nextTeamCursor && (
            <button
              disabled={busy}
              onClick={() => void load(participantCursor, data.nextTeamCursor!)}
            >
              Sonraki takım önerileri
            </button>
          )}
        </nav>
      )}
    </section>
  );
}
