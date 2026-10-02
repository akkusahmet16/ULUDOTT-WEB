import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { getForm } from "../../../../modules/forms/application/form-service";
import { FormBuilder } from "../../../../modules/forms/ui/form-builder";
export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const s = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!s) redirect("/admin");
  let f;
  try {
    f = await getForm(s.actor, (await params).formId);
  } catch {
    notFound();
  }
  return (
    <main>
      <Link href="/admin/formlar">Form listesine dön</Link>
      <h1>{f.title}</h1>
      <FormBuilder
        key={f.revision}
        form={{
          id: f.id,
          eventId: f.eventId,
          isUlujam: f.eventKind === "ulujam",
          status: f.status,
          revision: f.revision,
          settings: f.settings,
          definition: f.draft?.definition ?? f.current?.definition ?? null,
          hasPublished: !!f.current,
        }}
      />
    </main>
  );
}
