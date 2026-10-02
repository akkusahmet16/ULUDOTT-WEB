import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { LoginForm, SessionActions } from "../../modules/admin/ui/login-form";
import Link from "next/link";
export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await resolveSession(token) : null;
  return (
    <main>
      <h1>Uludott Yönetim</h1>
      {session ? (
        <>
          <p>Yönetim oturumu açık.</p>

          {session.actor.roles.some((role) =>
            ["content_editor", "event_manager"].includes(role),
          ) && (
            <p>
              <Link href="/admin/medya">Medya yönetimi</Link>
              {" · "}
              <Link href="/admin/etkinlikler">Etkinlik yönetimi</Link>
              {" · "}
              <Link href="/admin/duyurular">Duyuru yönetimi</Link>
            </p>
          )}
          <SessionActions />
        </>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
