import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { loadServerConfig } from "../config/server.ts";
import { PUBLIC_READ_REVALIDATE_SECONDS, type CacheTag } from "./tags.ts";

// cacheComponents açılmadan kullanılan, Next 16'nın belgelenmiş veri önbelleği.
// İstek çerezleri/oturumlar bu fonksiyona veya anahtarlarına taşınmaz.
export function cachePublicRead<Args extends unknown[], Result>(
  key: string,
  tags: readonly CacheTag[],
  read: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return (...args) => {
    const config = loadServerConfig();
    // Aynı disk önbelleğini kullanan yerel/test DB'leri birbirine veri sızdırmaz.
    // Bağlantı dizesi ve kimlik bilgileri anahtara açık metin olarak yazılmaz.
    const namespace = createHash("sha256")
      .update(config.databaseUrl)
      .update(config.appUrl)
      .digest("hex");
    return unstable_cache(read, ["public-read-v1", namespace, key], {
      tags: [...tags],
      revalidate: PUBLIC_READ_REVALIDATE_SECONDS,
    })(...args);
  };
}
