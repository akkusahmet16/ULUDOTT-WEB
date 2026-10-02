export type HistoricalResult = {
  id: string;
  year: number;
  rank: 1 | 2 | 3;
  itchUrl: string;
  status: "historical_partial";
  title: string | null;
  team: string | null;
  credits: string[] | null;
  image: string | null;
  description: string | null;
};

export const historical2026 = {
  eventId: "80202600-0000-4000-8000-000000000001",
  yearId: "80202600-0000-4000-8000-000000000002",
  slug: "ulujam-2026",
  results: [
    {
      id: "80202600-0000-4000-8000-000000000011",
      rank: 1,
      itchUrl: "https://subzero-41.itch.io/lost-pieces",
    },
    {
      id: "80202600-0000-4000-8000-000000000012",
      rank: 2,
      itchUrl: "https://kmevciman.itch.io/lostchildsoul",
    },
    {
      id: "80202600-0000-4000-8000-000000000013",
      rank: 3,
      itchUrl: "https://kairosthegeek.itch.io/project-sw",
    },
  ],
} as const;
