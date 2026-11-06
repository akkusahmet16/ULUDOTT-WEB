import type { FanzinIssue } from "./fanzin-types.ts";

export const FANZIN_ISSUE_01: FanzinIssue = {
  id: "fanzin-issue-01",
  issueNumber: 1,
  title: "Vice & Pixels",
  slug: "sayi-01-vice-and-pixels",
  subtitle: "Bursa'dan Oyun Dünyasına Bağımsız Fikirler ve Retro-Fütürizm",
  season: "Bahar",
  year: 2026,
  description:
    "Uludott topluluğunun ilk resmi fanzini. Vice City neon estetiği, bağımsız oyun geliştirme süreçleri ve pixel art kültürü bu sayıda buluşuyor.",
  pageCount: 3,
  pdfUrl: "/uploads/fanzin/uludott-fanzin-sayi-01.pdf",
  pdfFileSize: "66 KB",
  coverImageUrl: "/uploads/fanzin/cover-01.webp",
  accessType: "Açık Erişim",
  publishedAt: "2026-04-15",
  status: "published",
  pages: [
    {
      pageNumber: 1,
      imageUrl: "/uploads/fanzin/pages/page-1.webp",
      type: "cover",
    },
    {
      pageNumber: 2,
      imageUrl: "/uploads/fanzin/pages/page-2.webp",
      type: "page",
    },
    {
      pageNumber: 3,
      imageUrl: "/uploads/fanzin/pages/page-3.webp",
      type: "page",
    },
  ],
};

export const FANZIN_ISSUE_02: FanzinIssue = {
  id: "fanzin-issue-02",
  issueNumber: 2,
  title: "Neon Nights & Game Audio",
  slug: "sayi-02-neon-nights",
  subtitle: "Oyun Müziği, Synthwave Tasarımı ve Prosedürel Dünyalar",
  season: "Güz",
  year: 2026,
  description:
    "Etkileyici oyun müzikleri, dinamik ses tasarımı ve yerel stüdyolarla röportajlar içeren özel sonbahar sayısı.",
  pageCount: 16,
  pdfUrl: "#",
  pdfFileSize: "Yakında",
  coverImageUrl: "/uploads/fanzin/cover-01.webp",
  accessType: "Açık Erişim",
  publishedAt: "2026-10-30",
  status: "upcoming",
  pages: [],
};

export const ALL_FANZIN_ISSUES: readonly FanzinIssue[] = [
  FANZIN_ISSUE_01,
  FANZIN_ISSUE_02,
];
