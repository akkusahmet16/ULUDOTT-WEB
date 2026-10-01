import { describe, expect, it } from "vitest";
import { loadServerConfig } from "../../src/lib/config/server";

// Bu testlerin yakaladığı hata: eksik/bozuk env'nin kabulü veya hata çıktısına sır yazılması.
const localEnv = {
  NODE_ENV: "development",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://test_user:never-print-this@localhost:5432/uludott",
  OBJECT_STORAGE_ENDPOINT: "http://localhost:9000",
  OBJECT_STORAGE_REGION: "us-east-1",
  OBJECT_STORAGE_BUCKET: "uludott-media",
  OBJECT_STORAGE_ACCESS_KEY: "test-access-key",
  OBJECT_STORAGE_SECRET_KEY: "test-secret-never-print",
};

describe("sunucu başlangıç yapılandırması", () => {
  it.each(["APP_URL", "DATABASE_URL", "OBJECT_STORAGE_ENDPOINT"] as const)(
    "tamamen bozuk %s değerini alan adıyla reddeder",
    (field) => {
      expect(() => loadServerConfig({ ...localEnv, [field]: "never-print-this" })).toThrow(field);
    },
  );

  it("eksik yapılandırmayı alan adıyla açıklar", () => {
    expect(() => loadServerConfig({})).toThrow(/DATABASE_URL/);
  });

  it("geçerli yerel altyapı ayarlarını kabul eder", () => {
    expect(loadServerConfig(localEnv)).toMatchObject({
      appUrl: "http://localhost:3000",
      databaseUrl: localEnv.DATABASE_URL,
      objectStorage: { bucket: "uludott-media", endpoint: "http://localhost:9000" },
    });
  });

  it("üretimde HTTPS olmayan uygulama/depo adresini reddeder", () => {
    expect(() => loadServerConfig({ ...localEnv, NODE_ENV: "production" })).toThrow(/APP_URL/);
  });

  it("bozuk veritabanı şemasını reddeder ve sırları hataya yazmaz", () => {
    let message = "";
    try {
      loadServerConfig({ ...localEnv, DATABASE_URL: "https://never-print-this.invalid/db" });
    } catch (error) {
      message = error instanceof Error ? error.message : "";
    }
    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain("never-print-this");
    expect(message).not.toContain(localEnv.OBJECT_STORAGE_SECRET_KEY);
  });
});
