import { loadServerConfig } from "../src/lib/config/server.ts";

try {
  loadServerConfig();
  console.log("Sunucu yapılandırması geçerli. Servis bağlantıları bu kontrolle doğrulanmaz.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Sunucu yapılandırması geçersiz.");
  process.exitCode = 1;
}
