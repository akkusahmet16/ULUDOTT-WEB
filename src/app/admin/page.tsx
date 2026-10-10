import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "../../lib/auth/session";
import { LoginForm, SessionActions } from "../../modules/admin/ui/login-form";
import { getDashboard } from "../../modules/admin/application/dashboard-service";
import { Dashboard } from "../../modules/admin/ui/dashboard";
import { localDemoEnabled } from "../../lib/config/local-demo";
import styles from "../../modules/admin/ui/dashboard.module.css";
export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await resolveSession(token) : null;
  return (
    <main className={styles.adminPage}>
      <header className={styles.adminHero}>
        <p className={styles.adminEyebrow}>ULUDOTT · YÖNETİM</p>
        <h1>Yönetim paneli</h1>
        {localDemoEnabled() && <span className={styles.demoBadge}>YEREL DEMO</span>}
      </header>
      {session ? (
        <>
          <Dashboard view={await getDashboard(session.actor)} />
          <div className={styles.sessionActions}><SessionActions /></div>
        </>
      ) : (
        <div className={styles.loginCard}><LoginForm /></div>
      )}
    </main>
  );
}
