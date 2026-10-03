"use client";
import { useState } from "react";
import { Button } from "../../components/design-system/button";
import { flipCard, matchCards } from "./game-logic";
const deck = [1, 2, 3, 2, 1, 3],
  symbols = ["", "★", "●", "◆"];
export function PairMatch() {
  const [open, setOpen] = useState<number[]>([]),
    [matched, setMatched] = useState<number[]>([]);
  function flip(index: number) {
    const next = flipCard(open, matched, index, deck);
    if (matchCards(next, deck)) {
      setMatched([...matched, ...next]);
      setOpen([]);
    } else setOpen(next);
  }
  return (
    <section aria-label="Hafıza eşleştirme" className="game-break memory-break">
      <h3>Hafıza eşleştirme</h3>
      <p>
        Altı karttaki üç çifti bul. Kartları tıkla, dokun veya Enter/Boşluk ile
        aç. Süre sınırı yok.
      </p>
      <Button
        onClick={() => {
          setOpen([]);
          setMatched([]);
        }}
      >
        Yeniden oyna
      </Button>
      <p role="status">
        {matched.length / 2} / 3{" "}
        {matched.length === 6
          ? "Tamamlandı!"
          : open.length === 2
            ? "Eşleşmedi. Kartları kapatıp yeniden deneyin."
            : ""}
      </p>
      <div className="memory-board">
        {deck.map((symbol, i) => {
          const visible = open.includes(i) || matched.includes(i);
          return (
            <button
              className="button"
              key={i}
              aria-label={`Kart ${i + 1}: ${visible ? symbols[symbol] : "kapalı"}`}
              disabled={matched.includes(i) || open.length === 2}
              onClick={() => flip(i)}
            >
              {visible ? symbols[symbol] : "?"}
            </button>
          );
        })}
      </div>
      {open.length === 2 && (
        <Button onClick={() => setOpen([])}>Kartları kapat</Button>
      )}
    </section>
  );
}
