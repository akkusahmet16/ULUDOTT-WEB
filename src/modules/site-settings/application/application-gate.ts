import "server-only";
import { sql } from "drizzle-orm";
import type { DbTx } from "../../../lib/database/transaction.ts";
export async function applicationEnabled(
  tx: DbTx,
  formId: string,
): Promise<boolean> {
  const [row] = await tx.execute(
    sql`select data from site_settings where key='ulujam-presentation' for share`,
  );
  const data = row?.data as
    | {
        formId?: string;
        managedFormIds?: string[];
        applicationPublished?: boolean;
      }
    | undefined;
  const managed =
    data?.formId === formId || data?.managedFormIds?.includes(formId);
  return managed
    ? data?.formId === formId && data.applicationPublished === true
    : true;
}
