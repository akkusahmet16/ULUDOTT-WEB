import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { LoginForm, SessionActions } from "../../modules/admin/ui/login-form";
import { getDashboard } from "../../modules/admin/application/dashboard-service";
import { Dashboard } from "../../modules/admin/ui/dashboard";
import styles from "../../modules/admin/ui/admin-workspace.module.css";
export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await resolveSession(token) : null;
  if (!session)
    return (
      <main className={styles.loginPage}>
        <div className={styles.loginLayout}>
          <div className={styles.loginHero}>
            <p className={styles.eyebrow}>ULUDOTT / YÖNETİM</p>
            <h1>
              Topluluğu
              <br />
              birlikte yönet.
            </h1>
            <p>
              Etkinlikler, insanlar, oyunlar ve topluluğun bütün hikâyesi tek
              çalışma alanında.
            </p>
            <Link href="/">Siteye dön ↗</Link>
          </div>
          <section className={styles.loginCard} aria-label="Yönetim girişi">
            <h2>Yönetim paneli</h2>
            <LoginForm />
          </section>
        </div>
      </main>
    );
  return (
    <main>
      <Dashboard
        view={await getDashboard(session.actor)}
        actor={session.actor}
      />
      <section className={styles.sessionActions} aria-label="Oturum yönetimi">
        <SessionActions />
      </section>
    </main>
  );
}
