"use client";
import { useState } from "react";
import { Button } from "../../components/design-system/button";
import { nextStar } from "./game-logic";
export function StarCatch() {
  const [active, setActive] = useState(false),
    [score, setScore] = useState(0),
    [position, setPosition] = useState(0);
  return (
    <section aria-label="Yıldız yakalama" className="card">
      <h3>Yıldızı yakala</h3>
      <p>
        Beş yıldızı yakala. Yıldıza dokun, tıkla veya odaktayken Enter/Boşluk
        kullan. Süre sınırı yok.
      </p>
      <Button
        onClick={() => {
          setActive(true);
          setScore(0);
          setPosition(0);
        }}
      >
        Başlat
      </Button>
      <p role="status">
        {score} / 5 {score === 5 ? "Tamamlandı!" : ""}
      </p>
      {active && (
        <div className="star-board">
          <button
            className="button star-target"
            aria-label="Yıldızı yakala"
            disabled={score === 5}
            style={{
              gridColumn: (position % 3) + 1,
              gridRow: Math.floor(position / 3) + 1,
            }}
            onClick={() => {
              if (score < 5) {
                setScore(score + 1);
                setPosition(nextStar(position));
              }
            }}
          >
            ★
          </button>
        </div>
      )}
    </section>
  );
}
