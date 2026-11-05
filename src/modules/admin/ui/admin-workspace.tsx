"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { adminTrDictionary } from "../../../i18n/dictionaries/admin-tr.ts";
import type { Actor } from "../../../lib/logging/audit";
import { adminModulesFor } from "../domain/modules";
import { AdminNavigation } from "./admin-navigation";
import styles from "./admin-workspace.module.css";
export function AdminWorkspace({
  actor,
  children,
}: {
  actor: Actor;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = adminModulesFor(actor).find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/admin" && pathname.startsWith(item.href + "/")),
  );
  const w = adminTrDictionary.workspace;
  return (
    <div className={styles.workspace}>
      <a className={styles.skip} href="#admin-content">
        {w.skipToContent}
      </a>
      <aside className={styles.sidebar}>
        <AdminNavigation actor={actor} />
      </aside>
      <div className={styles.workArea}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>
              {w.breadcrumbRoot} <span aria-hidden="true">/</span>{" "}
              {current?.label ?? w.defaultModuleLabel}
            </p>
            <p className={styles.sessionNote}>{w.sessionActive}</p>
          </div>
          <Link
            href={current?.publicHref ?? "/"}
            className={styles.outlineLink}
          >
            {current?.publicHref ? w.viewPageOnSite : w.viewSite}{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <div id="admin-content" className={styles.content} tabIndex={-1}>
          {children}
        </div>
        <footer className={styles.workspaceFooter}>
          {w.footerBrand}
          <span>{w.footerMotto}</span>
        </footer>
      </div>
    </div>
  );
}
