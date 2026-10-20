"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Actor } from "../../../lib/logging/audit";
import { adminModulesFor } from "../domain/modules";
import styles from "./admin-workspace.module.css";
export function AdminNavigation({ actor }: { actor: Actor }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const entries = adminModulesFor(actor);
  const current = entries.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/admin" && pathname.startsWith(item.href + "/")),
  );
  return (
    <nav className={styles.navigation} aria-label="Yönetim modülleri">
      <div className={styles.brandRow}>
        <Link href="/admin" className={styles.brand}>
          ULUDOTT<span>İÇERİK STÜDYOSU</span>
        </Link>
        <button
          className={styles.menuToggle}
          type="button"
          aria-expanded={expanded}
          aria-controls="admin-module-links"
          aria-label={
            expanded ? "Yönetim menüsünü kapat" : "Yönetim menüsünü aç"
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Kapat ×" : "Menü ☰"}
        </button>
      </div>
      <p className={styles.mobileCurrent}>{current?.label ?? "Yönetim"}</p>
      <div
        id="admin-module-links"
        className={styles.moduleLinks}
        data-expanded={expanded}
      >
        {entries.map((entry, index) => (
          <div key={entry.href}>
            {(index === 0 || entries[index - 1].group !== entry.group) && (
              <p className={styles.navGroup}>{entry.group}</p>
            )}
            <Link
              href={entry.href}
              onClick={() => setExpanded(false)}
              aria-current={current?.href === entry.href ? "page" : undefined}
            >
              <span className={styles.navMark} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {entry.label}
            </Link>
          </div>
        ))}
      </div>
      <Link href="/" className={styles.siteLink}>
        Siteyi görüntüle <span aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}
