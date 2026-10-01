import "server-only";
import { z } from "zod";

function hasProtocol(value: string, allowed: readonly string[]) {
  try {
    return allowed.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const httpUrl = z.url().refine((value) => hasProtocol(value, ["http:", "https:"]));
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: httpUrl,
  DATABASE_URL: z.url().refine((value) => hasProtocol(value, ["postgres:", "postgresql:"])),
  OBJECT_STORAGE_ENDPOINT: httpUrl,
  OBJECT_STORAGE_REGION: z.string().trim().min(1),
  OBJECT_STORAGE_BUCKET: z.string().trim().min(1),
  OBJECT_STORAGE_ACCESS_KEY: z.string().min(1),
  OBJECT_STORAGE_SECRET_KEY: z.string().min(1),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === "production") {
    for (const field of ["APP_URL", "OBJECT_STORAGE_ENDPOINT"] as const) {
      if (!hasProtocol(env[field], ["https:"])) {
        ctx.addIssue({ code: "custom", path: [field], message: "HTTPS gerekli" });
      }
    }
  }
});

export function loadServerConfig(env: Record<string, string | undefined> = process.env) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    // Zod'un ham issue değerleri/mesajları kullanıcı girdisi taşıyabilir; yalnızca izinli alan adları.
    const fields = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Sunucu yapılandırması eksik veya geçersiz: ${fields.join(", ")}.`);
  }
  const parsed = result.data;
  return {
    environment: parsed.NODE_ENV,
    appUrl: parsed.APP_URL,
    databaseUrl: parsed.DATABASE_URL,
    objectStorage: {
      endpoint: parsed.OBJECT_STORAGE_ENDPOINT,
      region: parsed.OBJECT_STORAGE_REGION,
      bucket: parsed.OBJECT_STORAGE_BUCKET,
      accessKey: parsed.OBJECT_STORAGE_ACCESS_KEY,
      secretKey: parsed.OBJECT_STORAGE_SECRET_KEY,
    },
  };
}
