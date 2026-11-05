import type { WidenDictionary } from "./tr.ts";

/**
 * Yönetim paneli (admin) sözlüğü ayrı TR tipindedir.
 * Yönetim arayüzü her zaman sabit Türkçe (`lang="tr"`) çalışır.
 */
export const adminTrDictionary = {
  workspace: {
    title: "Uludott Yönetim",
    eyebrow: "Yönetim alanı",
    signOut: "Oturumu kapat",
    dashboard: "Genel bakış",
    skipToContent: "İçeriğe geç",
    breadcrumbRoot: "Yönetim",
    defaultModuleLabel: "Çalışma alanı",
    sessionActive: "Yönetim oturumu açık.",
    viewPageOnSite: "Sayfayı sitede gör",
    viewSite: "Siteyi görüntüle",
    footerBrand: "Uludott içerik yönetimi",
    footerMotto: "Birlikte üretmek.",
  },
  navigation: {
    ariaLabel: "Yönetim modülleri",
    brandName: "ULUDOTT",
    brandStudio: "İÇERİK STÜDYOSU",
    closeMenuAriaLabel: "Yönetim menüsünü kapat",
    openMenuAriaLabel: "Yönetim menüsünü aç",
    closeMenuButton: "Kapat ×",
    openMenuButton: "Menü ☰",
    defaultMobileCurrent: "Yönetim",
    viewSite: "Siteyi görüntüle",
  },
  status: {
    saved: "Kaydedildi",
    published: "Yayında",
    draft: "Taslak",
    archived: "Arşivlendi",
  },
} as const;

export type AdminDictionary = WidenDictionary<typeof adminTrDictionary>;
