import { z } from "zod";
import { eq } from "drizzle-orm";
import { parseArgs } from "node:util";
import { getDatabase, closeDatabase } from "../src/lib/database/client.ts";
import { withTransaction } from "../src/lib/database/transaction.ts";
import { admins } from "../src/db/schema/admin.ts";
import { actorFor } from "../src/modules/admin/infrastructure/admin-repository.ts";
import { purgeExpiredSubmissions } from "../src/modules/forms/application/submission-admin.ts";
const { values } = parseArgs({
  options: { "admin-id": { type: "string" }, "form-id": { type: "string" } },
  strict: true,
});
try {
  const adminId = z.uuid().parse(values["admin-id"]),
    formId = z.uuid().parse(values["form-id"]);
  const [admin] = await getDatabase()
    .select({ disabledAt: admins.disabledAt })
    .from(admins)
    .where(eq(admins.id, adminId));
  if (!admin || admin.disabledAt) throw Error("Etkin yönetici gerekli");
  const actor = await withTransaction((tx) => actorFor(tx, adminId));
  const result = await purgeExpiredSubmissions(actor, formId);
  process.stdout.write(JSON.stringify(result) + "\n");
} catch {
  process.stderr.write(
    "Temizleme başarısız. Yönetici/etkinlik yetkisini ve form kimliğini kontrol edin.\n",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
