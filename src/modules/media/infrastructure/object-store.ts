import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { loadServerConfig } from "../../../lib/config/server.ts";
function client() {
  const c = loadServerConfig().objectStorage;
  return {
    bucket: c.bucket,
    s3: new S3Client({
      endpoint: c.endpoint,
      region: c.region,
      forcePathStyle: true,
      maxAttempts: 2,
      credentials: { accessKeyId: c.accessKey, secretAccessKey: c.secretKey },
    }),
  };
}
export async function putPrivate(key: string, data: Buffer, mime: string) {
  const { bucket, s3 } = client();
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: mime,
      }),
    );
  } finally {
    s3.destroy();
  }
}
export async function readPrivate(key: string): Promise<Buffer> {
  const { bucket, s3 } = client();
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!r.Body) throw new Error("Nesne yok");
    return Buffer.from(await r.Body.transformToByteArray());
  } finally {
    s3.destroy();
  }
}
export async function removePrivate(key: string) {
  const { bucket, s3 } = client();
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), {
      abortSignal: AbortSignal.timeout(20_000),
    });
  } finally {
    s3.destroy();
  }
}
