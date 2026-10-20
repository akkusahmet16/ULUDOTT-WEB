"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
  return (
    <div className={styles.workspace}>
      <a className={styles.skip} href="#admin-content">
        İçeriğe geç
      </a>
      <aside className={styles.sidebar}>
        <AdminNavigation actor={actor} />
      </aside>
      <div className={styles.workArea}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>
              Yönetim <span aria-hidden="true">/</span>{" "}
              {current?.label ?? "Çalışma alanı"}
            </p>
            <p className={styles.sessionNote}>Yönetim oturumu açık.</p>
          </div>
          <Link
            href={current?.publicHref ?? "/"}
            className={styles.outlineLink}
          >
            {current?.publicHref ? "Sayfayı sitede gör" : "Siteyi görüntüle"}{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <div id="admin-content" className={styles.content} tabIndex={-1}>
          {children}
        </div>
        <footer className={styles.workspaceFooter}>
          Uludott içerik yönetimi<span>Birlikte üretmek.</span>
        </footer>
      </div>
    </div>
  );
}
