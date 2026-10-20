import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, resolveSession } from "../../../lib/auth/session";
export default async function Page() {
  const session = await resolveSession(
    (await cookies()).get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) redirect("/admin");
  redirect("/admin/ulujam-arsivleri");
}
