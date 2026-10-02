import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { resolveSession, SESSION_COOKIE } from "../../../../lib/auth/session";
import { getSubmission } from "../../../../modules/forms/application/submission-admin";
import { SubmissionDetail } from "../../../../modules/forms/ui/submission-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const s = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!s) redirect("/admin");
  let submission;
  try {
    submission = await getSubmission(s.actor, (await params).submissionId);
  } catch {
    notFound();
  }
  return (
    <main>
      <Link href="/admin/basvurular">Başvuru listesine dön</Link>
      <h1>Başvuru ayrıntısı</h1>
      <SubmissionDetail
        submission={{
          ...submission,
          expiresAt: submission.expiresAt.toISOString(),
          history: submission.history.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          })),
          consents: submission.consents.map((c) => ({
            ...c,
            grantedAt: c.grantedAt.toISOString(),
            withdrawnAt: c.withdrawnAt?.toISOString() ?? null,
          })),
        }}
      />
    </main>
  );
}
