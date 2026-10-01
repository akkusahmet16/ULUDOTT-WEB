import { loadServerConfig } from "../src/lib/config/server.ts";

import { authKey } from "../src/lib/config/auth.ts";

try {
  loadServerConfig();
  authKey();
  console.log(
    "Sunucu yapılandırması geçerli. Servis bağlantıları bu kontrolle doğrulanmaz.",
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Sunucu yapılandırması geçersiz.",
  );
  process.exitCode = 1;
}
