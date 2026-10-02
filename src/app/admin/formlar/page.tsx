import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../lib/auth/session";
import {
  listForms,
  formEvents,
} from "../../../modules/forms/application/form-service";
import { FormCreator } from "../../../modules/forms/ui/form-builder";
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
  const [items, events] = await Promise.all([
    listForms(s.actor),
    formEvents(s.actor),
  ]);
  return (
    <main>
      <Link href="/admin">Yönetime dön</Link>
      <h1>Form yönetimi</h1>
      <ul>
        {items.map((f) => (
          <li key={f.id}>
            <Link href={"/admin/formlar/" + f.id}>{f.title}</Link> · {f.status}
          </li>
        ))}
      </ul>
      <FormCreator events={events} />
    </main>
  );
}
