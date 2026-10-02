import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { CheckInPanel } from "../../../modules/cards/ui/check-in-panel";
export default async function Page() {
  const s = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!s) redirect("/admin");
  if (!s.actor.roles.includes("event_manager"))
    return (
      <main>
        <h1>Yetki yok</h1>
      </main>
    );
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Giriş QR kontrolü</h1>
      <p>
        Katılımcının QR kodunu okuyarak elde ettiğiniz içeriği girin. Doğrulama
        yalnız yetkili olduğunuz etkinliklerde geçerlidir.
      </p>
      <CheckInPanel />
    </main>
  );
}
