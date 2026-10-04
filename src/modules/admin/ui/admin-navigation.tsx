import Link from "next/link";
import type { Actor } from "../../../lib/logging/audit";
import styles from "./dashboard.module.css";
export function AdminNavigation({ actor }: { actor: Actor }) {
  const content = actor.roles.some((r) =>
    ["content_editor", "event_manager"].includes(r),
  );
  const event = actor.roles.includes("event_manager");
  const entries = [
    { href: "/admin", label: "Operasyon özeti" },
    ...(content
      ? [
          { href: "/admin/medya", label: "Medya" },
          { href: "/admin/people", label: "Yönetim kurulu" },
          { href: "/admin/etkinlikler", label: "Etkinlikler" },
          { href: "/admin/linkler", label: "Bağlantılar" },
          { href: "/admin/galeri", label: "Galeri" },
          { href: "/admin/oyunlar", label: "Oyunlar" },
        ]
      : []),
    ...(event
      ? [
          { href: "/admin/formlar", label: "Formlar" },
          { href: "/admin/basvurular", label: "Başvurular" },
          { href: "/admin/takim-arayanlar", label: "Takım arayanlar" },
          { href: "/admin/takim-onaylari", label: "Takım onayları" },
          { href: "/admin/check-in", label: "QR kontrolü" },
        ]
      : []),
    ...(actor.roles.includes("system_admin")
      ? [{ href: "/admin/sistem", label: "Sistem" }]
      : []),
  ];
  return (
    <nav className={styles.navigation} aria-label="Yönetim modülleri">
      {entries.map((e) => (
        <Link key={e.href} href={e.href}>
          {e.label}
        </Link>
      ))}
    </nav>
  );
}
