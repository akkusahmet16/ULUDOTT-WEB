import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { LoginForm, SessionActions } from "../../modules/admin/ui/login-form";
import { getDashboard } from "../../modules/admin/application/dashboard-service";
import { Dashboard } from "../../modules/admin/ui/dashboard";
export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await resolveSession(token) : null;
  return (
    <main>
      <h1>Yönetim paneli</h1>
      {session ? (
        <>
          <p>Yönetim oturumu açık.</p>

          <Dashboard view={await getDashboard(session.actor)} />
          <SessionActions />
        </>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
