import "server-only";
import { eq, sql } from "drizzle-orm";
import { forms } from "../../../db/schema/forms.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { readFormVersion } from "../infrastructure/form-repository.ts";
export async function getPublicForm(slug: string) {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  return withTransaction(async (tx) => {
    const [f] = await tx.select().from(forms).where(eq(forms.slug, slug));
    if (
      !f ||
      !f.currentVersionId ||
      f.status === "draft" ||
      f.status === "archived"
    )
      return null;
    const [{ now }] = await tx.execute(sql`select clock_timestamp() as now`);
    const date = new Date(now as string);
    if (
      f.status !== "published" ||
      !f.opensAt ||
      f.opensAt > date ||
      (f.closesAt && f.closesAt <= date)
    )
      return {
        title: f.title,
        state:
          f.opensAt && f.opensAt > date
            ? "Başvurular henüz açılmadı."
            : "Bu form şu anda başvuru almıyor.",
        version: null,
      };
    const v = await readFormVersion(tx, f.currentVersionId);
    return {
      title: f.title,
      state: "open",
      version: v.publishedAt ? { id: v.id, definition: v.definition } : null,
    };
  });
}
