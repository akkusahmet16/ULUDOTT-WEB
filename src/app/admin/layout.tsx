import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { AdminNavigation } from "../../modules/admin/ui/admin-navigation";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Uludott Yönetim",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  return (
    <>
      {session && <AdminNavigation actor={session.actor} />} {children}
    </>
  );
}
