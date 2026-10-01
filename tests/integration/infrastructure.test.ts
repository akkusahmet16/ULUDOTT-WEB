import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import postgres from "postgres";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { loadServerConfig } from "../../src/lib/config/server";

// Gerçek servis kapalıysa veya özel nesne herkese açıksa bu kontroller başarısız olur.
loadEnvFile(".env.local");
const config = loadServerConfig(process.env);
const sql = postgres(config.databaseUrl, { max: 1, connect_timeout: 3 });
const s3 = new S3Client({
  endpoint: config.objectStorage.endpoint, region: config.objectStorage.region,
  forcePathStyle: true, maxAttempts: 1,
  credentials: { accessKeyId: config.objectStorage.accessKey, secretAccessKey: config.objectStorage.secretKey },
});
afterAll(async () => { await sql.end(); s3.destroy(); });

describe("gerçek yerel altyapı", () => {
  it("PostgreSQL bağlantısını ve sunucu sürümünü doğrular", async () => {
    const [row] = await sql`select current_setting('server_version_num')::int as version`;
    expect(row.version).toBeGreaterThanOrEqual(170000);
  });
  it("özel S3 nesnesini yükler, okur ve anonim erişimi reddeder", async () => {
    const key = `acceptance/${randomUUID()}.txt`;
    try {
      await s3.send(new PutObjectCommand({ Bucket: config.objectStorage.bucket, Key: key, Body: "uludott-infrastructure-proof" }));
      const object = await s3.send(new GetObjectCommand({ Bucket: config.objectStorage.bucket, Key: key }));
      expect(await object.Body?.transformToString()).toBe("uludott-infrastructure-proof");
      const anonymous = await fetch(`${config.objectStorage.endpoint}/${config.objectStorage.bucket}/${key}`);
      expect(anonymous.status).toBe(403);
    } finally {
      await s3.send(new DeleteObjectCommand({ Bucket: config.objectStorage.bucket, Key: key }));
    }
  });
});
