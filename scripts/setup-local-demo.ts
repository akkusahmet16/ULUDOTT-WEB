import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { localDemoEnabled } from "../src/lib/config/local-demo.ts";
import { closeDatabase } from "../src/lib/database/client.ts";
import { setPanelPassword } from "../src/modules/admin/application/panel-password.ts";
import { setupLocalDemo } from "../src/modules/applications/application/local-demo-setup.ts";

if (!localDemoEnabled()) throw new Error("Yerel demo yalnız yerel adreste açıktır");
const password = process.env.LOCAL_DEMO_PANEL_PASSWORD;
if (!password || password.length < 8) throw new Error("LOCAL_DEMO_PANEL_PASSWORD gerekli (en az 8 karakter)");
try {
  await setPanelPassword(password, true);
  const dir = join(process.cwd(), ".local");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const path = join(dir, "admin-panel-password.txt");
  await writeFile(path, `${password}\n`, { mode: 0o600 });
  await chmod(path, 0o600);
  const access = await setupLocalDemo();
  console.log(`Yerel DEMO hazır: /ulujam, /basvuru/demo-ulujam-yerel, /admin, ${access.team.url}`);
  console.log("Özel erişim bilgileri .local/ dizininde tutuldu.");
} finally {
  await closeDatabase();
}
