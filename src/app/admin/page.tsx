import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { LoginForm, SessionActions } from "../../modules/admin/ui/login-form";
export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await resolveSession(token) : null;
  return (
    <main>
      <h1>Uludott Yönetim</h1>
      {session ? (
        <>
          <p>Yönetim oturumu açık.</p>
          <p>Yönetim araçları sonraki adımlarda eklenecek.</p>
          <SessionActions />
        </>
      ) : (
        <LoginForm />
      )}
    </main>
  );
}
