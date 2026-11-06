import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
import { requirePermission } from "../../../modules/admin/domain/permissions";
import { MediaManager } from "../../../modules/media/ui/media-manager";
import Link from "next/link";

export default async function MediaPage() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  requirePermission(session.actor, "content.write");

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--color-ffd1df)",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          ← Yönetim Paneline Dön
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-secondary, inherit)",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            color: "var(--color-white)",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          MEDYA VE DOSYA YÖNETİMİ (VDS)
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--color-8b94ae)",
            fontSize: 14,
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Sitenin tüm görsellerini, videolarını ve belgelerini yönetin,
          cihazınızdan yeni dosya yükleyin, alanlar arasında ortak kullanın veya
          sunucu diskinden kalıcı olarak silin.
        </p>
      </div>

      <MediaManager />
    </main>
  );
}
