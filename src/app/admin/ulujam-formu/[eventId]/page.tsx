import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { getUlujamPreview } from "../../../../modules/applications/application/ulujam-preview";
import { UlujamForm } from "../../../../modules/applications/ui/ulujam-form";
export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  let preview;
  try {
    preview = await getUlujamPreview(session.actor, (await params).eventId);
  } catch {
    notFound();
  }
  return (
    <main>
      <Link href="/admin/formlar">Form listesine dön</Link>
      <h1>{preview.title} özel form önizlemesi</h1>
      <UlujamForm eventId={preview.eventId} definition={preview.definition} />
    </main>
  );
}
