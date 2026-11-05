import { cookies } from "next/headers";
import { ThemeProvider } from "../../components/theme/ThemeProvider.tsx";
import { ADMIN_THEME } from "../../config/theme.config.ts";
import { I18nProvider } from "../../i18n/client.tsx";
import { ADMIN_LOCALE, CLIENT_NAMESPACES } from "../../i18n/config.ts";
import {
  getAdminDictionary,
  getDictionarySlice,
} from "../../i18n/server.ts";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { AdminWorkspace } from "../../modules/admin/ui/admin-workspace";
import type { Metadata } from "next";
const adminDict = getAdminDictionary();
export const metadata: Metadata = {
  title: adminDict.workspace.title,
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
  const adminSlice = getDictionarySlice(ADMIN_LOCALE, CLIENT_NAMESPACES);
  return (
    <ThemeProvider forcedTheme={ADMIN_THEME}>
      <I18nProvider
        locale={ADMIN_LOCALE}
        forcedLocale={ADMIN_LOCALE}
        dictionary={adminSlice}
      >
        {session ? (
          <AdminWorkspace actor={session.actor}>{children}</AdminWorkspace>
        ) : (
          children
        )}
      </I18nProvider>
    </ThemeProvider>
  );
}
