export function nextStar(index: number) {
  return (index + 4) % 9;
}
export function flipCard(
  open: number[],
  matched: number[],
  index: number,
  deck: number[],
): number[] {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= deck.length ||
    open.length >= 2 ||
    open.includes(index) ||
    matched.includes(index)
  )
    return open;
  return [...open, index];
}
export function matchCards(open: number[], deck: number[]) {
  return (
    open.length === 2 &&
    open[0] !== open[1] &&
    open.every((i) => i >= 0 && i < deck.length) &&
    deck[open[0]] === deck[open[1]]
  );
}
