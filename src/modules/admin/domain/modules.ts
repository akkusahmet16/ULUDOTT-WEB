import type { Actor } from "../../../lib/logging/audit.ts";
export type AdminModule = {
  href: string;
  label: string;
  description: string;
  group: "PANEL" | "SİTE İÇERİKLERİ" | "ULUJAM" | "KATILIM" | "ARAÇLAR";
  publicHref?: string;
};
export const canCreateEvent = (actor: Actor) =>
  actor.roles.includes("content_editor");
export function adminModulesFor(actor: Actor): AdminModule[] {
  const editor = actor.roles.includes("content_editor");
  const manager = actor.roles.includes("event_manager");
  return [
    {
      href: "/admin",
      label: "Genel bakış",
      description: "İçeriklere ve bekleyen işlere ulaşın.",
      group: "PANEL",
    },
    ...(editor || manager
      ? ([
          {
            href: "/admin/analitik",
            label: "Site analitiği",
            description: "Ziyaretçi sayıları, popüler sayfalar ve fanzin indirmeleri.",
            group: "PANEL",
          },
          {
            href: "/admin/site-icerikleri",
            label: "Ana sayfa bölümleri",
            description: "İkili kolon ve Topluluğun Dünyası vitrini.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/",
          },
          {
            href: "/admin/etkinlikler",
            label: "Etkinlikler",
            description: "Etkinlik, afiş, tarih ve yayın yönetimi.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/etkinlikler",
          },
          {
            href: "/admin/people",
            label: "Hakkımızda & Mekanlar",
            description: "Kişiler, bölümler ve etkinlik mekanları.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/hakkimizda",
          },
          {
            href: "/admin/oyunlar",
            label: "Oyunlar & Dereceler",
            description: "Oyun kartları, kapaklar ve yapımcı bilgileri.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/oyunlar",
          },
          {
            href: "/admin/sponsorlar",
            label: "Sponsorlar",
            description: "Ana sayfa altındaki sponsor logoları ve bağlantılar.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/",
          },
          {
            href: "/admin/fanzin",
            label: "Fanzin",
            description: "Dijital fanzin sayıları, PDF yükleme ve flipbook yönetimi.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/fanzin",
          },
          {
            href: "/admin/iletisim",
            label: "İletişim & Sosyal Medya",
            description: "İletişim bilgileri ve resmi sosyal medya bağlantıları.",
            group: "SİTE İÇERİKLERİ",
            publicHref: "/iletisim",
          },
        ] as AdminModule[])
      : []),
    ...(editor
      ? ([
          {
            href: "/admin/ulujam",
            label: "UluJam yönetimi",
            description: "Ana sayfa, video ve başvuru yayını.",
            group: "ULUJAM",
            publicHref: "/ulujam",
          },
          {
            href: "/admin/ulujam-arsivleri",
            label: "UluJam arşivleri",
            description: "Yıllar, fotoğraflar ve derece oyunları.",
            group: "ULUJAM",
            publicHref: "/ulujam",
          },
        ] as AdminModule[])
      : []),
    ...(manager
      ? ([
          {
            href: "/admin/formlar",
            label: "Başvuru formları",
            description: "Soruları ve başvuru tarihlerini düzenleyin.",
            group: "KATILIM",
          },
          {
            href: "/admin/basvurular",
            label: "Başvurular",
            description: "Katılımcı kayıtlarını ve başvuruları inceleyin.",
            group: "KATILIM",
          },
          {
            href: "/admin/takim-arayanlar",
            label: "Takım arayanlar",
            description: "Katılımcıları bir araya getirin.",
            group: "KATILIM",
          },
          {
            href: "/admin/takim-onaylari",
            label: "Takım onayları",
            description: "Takımların katılım durumunu yönetin.",
            group: "KATILIM",
          },
          {
            href: "/admin/check-in",
            label: "Giriş kontrolü",
            description: "Etkinlikte QR ile katılım kontrolü.",
            group: "KATILIM",
          },
        ] as AdminModule[])
      : []),
    ...(editor || manager
      ? ([
          {
            href: "/admin/medya",
            label: "Medya kütüphanesi",
            description: "Afişler ve yüklenen görseller.",
            group: "ARAÇLAR",
          },
        ] as AdminModule[])
      : []),
    ...(actor.roles.includes("system_admin")
      ? ([
          {
            href: "/admin/sistem",
            label: "Sistem",
            description: "Entegrasyonlar ve işlem durumu.",
            group: "ARAÇLAR",
          },
        ] as AdminModule[])
      : []),
  ] as AdminModule[];
}
