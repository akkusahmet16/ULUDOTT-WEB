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
  },
  status: {
    saved: "Kaydedildi",
    published: "Yayında",
    draft: "Taslak",
    archived: "Arşivlendi",
  },
} as const;

export type AdminDictionary = WidenDictionary<typeof adminTrDictionary>;
