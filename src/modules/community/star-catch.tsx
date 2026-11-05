"use client";
import { useState } from "react";
import { Button } from "../../components/design-system/button";
import { useTranslator } from "../../i18n/client.tsx";
import { nextStar } from "./game-logic";
export function StarCatch() {
  const t = useTranslator();
  const [score, setScore] = useState(0),
    [position, setPosition] = useState(0);
  return (
    <section
      aria-label={t("miniGames.starAria")}
      className="game-break star-break"
    >
      <h3>{t("miniGames.starHeading")}</h3>
      <p>{t("miniGames.starCopy")}</p>
      <Button
        onClick={() => {
          setScore(0);
          setPosition(0);
        }}
      >
        {t("miniGames.playAgain")}
      </Button>
      <p role="status" aria-live="polite">
        {score} / 5 {score === 5 ? t("miniGames.completed") : ""}
      </p>
      <div className="star-board">
        <button
          type="button"
          className="button star-target"
          aria-label={t("miniGames.starHeading")}
          disabled={score === 5}
          style={{
            left: `${(position % 3) * 33.333}%`,
            top: `${Math.floor(position / 3) * 33.333}%`,
          }}
          onClick={() => {
            if (score < 5) {
              setScore((s) => Math.min(s + 1, 5));
              setPosition(nextStar);
            }
          }}
        >
          ★
        </button>
      </div>
    </section>
  );
}
