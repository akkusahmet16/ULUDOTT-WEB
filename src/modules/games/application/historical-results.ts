import "server-only";
import {
  historical2026,
  type HistoricalResult,
} from "../domain/historical-result.ts";
import { historicalGameRecords } from "../infrastructure/game-repository.ts";
export async function listPublicHistoricalResults(
  year: number,
): Promise<HistoricalResult[]> {
  if (year !== 2026) return [];
  const rows = await historicalGameRecords(year, new Date());
  return rows.flatMap((row) => {
    const source = historical2026.results.find(
      (item) =>
        item.id === row.id &&
        item.rank === row.rank &&
        item.itchUrl === row.itchUrl,
    );
    if (!source) return [];
    return [
      {
        id: row.id,
        year,
        rank: source.rank,
        itchUrl: source.itchUrl,
        status: "historical_partial" as const,
        title: null,
        team: null,
        credits: null,
        image: null,
        description: null,
      },
    ];
  });
}
