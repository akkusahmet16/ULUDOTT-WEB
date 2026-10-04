import { randomBytes } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setPanelPassword } from "../src/modules/admin/application/panel-password.ts";
import { closeDatabase } from "../src/lib/database/client.ts";

const output = join(process.cwd(), ".local", "admin-panel-password.txt");
const password = randomBytes(24).toString("base64url");
try {
  await setPanelPassword(password);
  await mkdir(join(process.cwd(), ".local"), { recursive: true, mode: 0o700 });
  await writeFile(output, `${password}\n`, { mode: 0o600 });
  await chmod(output, 0o600);
  console.log(`Özel şifre yenilendi. Yalnız yerel dosya: ${output}`);
} finally {
  await closeDatabase();
}
