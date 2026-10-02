import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import { listForms } from "../../../modules/forms/application/form-service";
import { SubmissionList } from "../../../modules/forms/ui/submission-list";
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
  const forms = await listForms(s.actor);
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Başvuru yönetimi</h1>
      <SubmissionList forms={forms} />
    </main>
  );
}
