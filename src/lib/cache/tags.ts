export const CACHE_TAGS = {
  events: "public:events",
  announcements: "public:announcements",
  links: "public:links",
  ulujam: "public:ulujam",
  historicalResults: "public:historical-results",
  media: "public:media",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Yayın pencereleri, etkinlik durumları ve geri sayım evreleri zamanla değişir.
// Mutasyon olmasa da 30 sn sonrasındaki okuma zaman tabanlı yenilemeyi tetikler.
// TTL yenilemesi SWR'dir; yönetici mutasyonu expire: 0 ile anında sona erdirir.
export const PUBLIC_READ_REVALIDATE_SECONDS = 30;
