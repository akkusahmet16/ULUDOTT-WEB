"use client";
import { useEffect, useState } from "react";
import { Button } from "../../components/design-system/button";
import { useTranslator } from "../../i18n/client.tsx";
import { flipCard, matchCards } from "./game-logic";
const deck = [1, 2, 3, 2, 1, 3],
  symbols = ["", "★", "●", "◆"];
export function PairMatch() {
  const t = useTranslator();
  const [open, setOpen] = useState<number[]>([]),
    [matched, setMatched] = useState<number[]>([]);
  useEffect(() => {
    if (open.length !== 2) return;
    const timer = setTimeout(() => setOpen([]), 650);
    return () => clearTimeout(timer);
  }, [open]);
  function flip(index: number) {
    const next = flipCard(open, matched, index, deck);
    if (matchCards(next, deck)) {
      setMatched([...matched, ...next]);
      setOpen([]);
    } else setOpen(next);
  }
  return (
    <section
      aria-label={t("miniGames.memoryAria")}
      className="game-break memory-break"
    >
      <h3>{t("miniGames.memoryHeading")}</h3>
      <p>{t("miniGames.memoryCopy")}</p>
      <Button
        onClick={() => {
          setOpen([]);
          setMatched([]);
        }}
      >
        {t("miniGames.playAgain")}
      </Button>
      <p role="status" aria-live="polite">
        {matched.length / 2} / 3{" "}
        {matched.length === 6
          ? t("miniGames.completed")
          : open.length === 2
            ? t("miniGames.mismatchRetry")
            : ""}
      </p>
      <div className="memory-board">
        {deck.map((symbol, i) => {
          const visible = open.includes(i) || matched.includes(i);
          return (
            <button
              type="button"
              className={`button memory-card ${visible ? "is-revealed" : ""} ${matched.includes(i) ? "is-matched" : ""}`}
              aria-pressed={visible}
              key={i}
              aria-label={t("miniGames.cardAria", {
                index: i + 1,
                state: visible
                  ? symbols[symbol]
                  : t("miniGames.cardClosedState"),
              })}
              disabled={matched.includes(i) || open.length === 2}
              onClick={() => flip(i)}
            >
              {visible ? symbols[symbol] : "?"}
            </button>
          );
        })}
      </div>
      {open.length === 2 && (
        <Button onClick={() => setOpen([])}>
          {t("miniGames.closeCards")}
        </Button>
      )}
    </section>
  );
}
