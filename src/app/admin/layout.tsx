import type { Metadata } from "next";
import { ADMIN_THEME } from "../../config/theme.config.ts";
export const metadata: Metadata = {
  title: "Uludott Yönetim",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-shell" data-theme={ADMIN_THEME}>{children}</div>;
}
