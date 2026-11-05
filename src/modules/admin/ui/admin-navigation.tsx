"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminTrDictionary } from "../../../i18n/dictionaries/admin-tr.ts";
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
  const nav = adminTrDictionary.navigation;
  return (
    <nav className={styles.navigation} aria-label={nav.ariaLabel}>
      <div className={styles.brandRow}>
        <Link href="/admin" className={styles.brand}>
          {nav.brandName}
          <span>{nav.brandStudio}</span>
        </Link>
        <button
          className={styles.menuToggle}
          type="button"
          aria-expanded={expanded}
          aria-controls="admin-module-links"
          aria-label={expanded ? nav.closeMenuAriaLabel : nav.openMenuAriaLabel}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? nav.closeMenuButton : nav.openMenuButton}
        </button>
      </div>
      <p className={styles.mobileCurrent}>
        {current?.label ?? nav.defaultMobileCurrent}
      </p>
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
        {nav.viewSite} <span aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}
