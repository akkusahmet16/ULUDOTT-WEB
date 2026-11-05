export type WidenDictionary<T> = {
  readonly [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Readonly<Record<string, unknown>>
      ? WidenDictionary<T[K]>
      : never;
};

export const trDictionary = {
  brand: {
    name: "Uludott",
    upperName: "ULUDOTT",
    tagline: "Dijital oyun tasarım topluluğu",
    motto: "Bir fikir. Bir takım. Bir oyun.",
    defaultDescription:
      "UluDOTT topluluk, etkinlik, başvuru ve UluJam dijital katılım platformu.",
  },
  nav: {
    home: "Ana sayfa",
    about: "Hakkımızda",
    ulujam: "UluJam",
    events: "Etkinlikler",
    games: "Oyunlar",
    contact: "İletişim",
    menuButton: "Menü",
    mainMenuAria: "Ana menü",
    homeLogoAria: "Uludott ana sayfa",
    skipToContent: "İçeriğe geç",
    discoverCaption: "Uludott / Keşfet",
    aboutSubmenuAria: "Topluluk alt menüsü",
    gamesSubmenuAria: "Oyunlar alt menüsü",
    aboutBoard: "Yönetim kurulu",
    aboutPlaces: "Mekânlar",
    gamesDegrees: "Dereceye giren oyunlar",
    gamesPublished: "Yayımlanan oyunlar",
  },
  footer: {
    socialsAria: "Sosyal medya",
    socialsEyebrow: "Sosyal medya",
  },
  meta: {
    home: {
      title: "Dijital Oyun Tasarım Topluluğu",
      description:
        "UluDOTT topluluk, etkinlik, başvuru ve UluJam dijital katılım platformu.",
    },
    about: {
      title: "Hakkımızda",
      description:
        "Uludott, Dijital Oyun Tasarım Topluluğu. Oyun tasarımına ilgi duyanları fikir, deneyim ve üretim etrafında buluşturur.",
    },
    ulujam: {
      title: "UluJam",
      description:
        "UluJam arşivleri, oyun sonuçları ve yeni dönem duyuruları.",
    },
    events: {
      title: "Etkinlikler",
      description: "Uludott yaklaşan ve geçmiş topluluk etkinlikleri.",
    },
    eventDetail: {
      title: "{title}",
      description: "{description}",
      notFoundTitle: "Etkinlik bulunamadı",
    },
    games: {
      title: "Oyunlar",
      description:
        "UluJam 2026'nın doğrulanmış derece ve itch.io bağlantıları.",
    },
    gameDetail: {
      title: "{title}",
      description: "Uludott topluluk oyunu detay sayfası.",
      notFoundTitle: "Oyun bulunamadı",
    },
    contact: {
      title: "İletişim",
      description: "Uludott iletişim kanalları ve sosyal medya hesapları.",
    },
    application: {
      title: "Başvuru",
      description: "Uludott ve UluJam başvuru formu.",
    },
    receipt: {
      title: "Başvuru makbuzu",
      description: "Başvuru makbuzu ve katılım bilgileri.",
    },
    privateCard: {
      title: "Özel katılım kartı",
      description: "Kişisel etkinlik katılım kartı.",
    },
    privateTeam: {
      title: "Takım erişimi",
      description: "UluJam takım yönetim ve durum alanı.",
    },
    privateConsent: {
      title: "Özel yapımcı yayın onayı",
      description: "Oyun yapımcı adı yayın onayı.",
    },
  },
  theme: {
    cinematic: "Sinematik gece",
    classic: "Klasik koyu",
  },
  common: {
    explore: "Keşfet",
    close: "İçeriği kapat",
    pageCount: "Sayfa {page} / {total}",
  },
} as const;

export type PublicDictionary = WidenDictionary<typeof trDictionary>;
