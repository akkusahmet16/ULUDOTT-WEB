import { it, expect } from "vitest";
import {
  nextStar,
  flipCard,
  matchCards,
} from "../../src/modules/community/game-logic";
it("yıldız sonraki hedefe geçer ve 9 hücre içinde kalır", () => {
  expect(nextStar(0)).toBe(4);
  expect(nextStar(8)).toBe(3);
});
it("eşleşmiş/açık kart ve üçüncü kart tekrar açılamaz", () => {
  const deck = [1, 2, 3, 2, 1, 3];
  expect(flipCard([], [], 1, deck)).toEqual([1]);
  expect(flipCard([1], [], 1, deck)).toEqual([1]);
  expect(flipCard([0, 1], [], 2, deck)).toEqual([0, 1]);
  expect(flipCard([], [1], 1, deck)).toEqual([]);
  expect(flipCard([], [], -1, deck)).toEqual([]);
});
it("yalnız farklı iki eş kart eşleşir", () => {
  const d = [1, 2, 3, 2, 1, 3];
  expect(matchCards([0, 4], d)).toBe(true);
  expect(matchCards([0, 0], d)).toBe(false);
  expect(matchCards([0, 1], d)).toBe(false);
});
