export const CACHE_TAGS = {
  events: "public:events",
  announcements: "public:announcements",
  links: "public:links",
  ulujam: "public:ulujam",
  historicalResults: "public:historical-results",
  media: "public:media",
  people: "public:people",
  siteGames: "public:site-games",
  games: "public:games",
  siteSettings: "public:site-settings",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Genel katalog okumalarında TTL yenilemesi SWR'dir; yönetici mutasyonu
// expire: 0 ile sonraki okumayı blocking yeniler. İzin/uygunluk/kişi adı içeren
// oyun ve tarihî sonuç okumaları bu TTL'yi kullanmaz; her istekte günceldir.
export const PUBLIC_READ_REVALIDATE_SECONDS = 30;
