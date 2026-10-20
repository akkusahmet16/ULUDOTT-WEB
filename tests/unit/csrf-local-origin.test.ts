import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CSRF_COOKIE, issueCsrf, verifyCsrf } from "../../src/lib/auth/csrf";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("APP_URL", "http://127.0.0.1:3001");
  vi.stubEnv("AUTH_ENCRYPTION_KEY", "12".repeat(32));
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@127.0.0.1:5432/test");
  vi.stubEnv("OBJECT_STORAGE_ENDPOINT", "http://127.0.0.1:9000");
  vi.stubEnv("OBJECT_STORAGE_REGION", "test-region");
  vi.stubEnv("OBJECT_STORAGE_BUCKET", "test-bucket");
  vi.stubEnv("OBJECT_STORAGE_ACCESS_KEY", "test-access");
  vi.stubEnv("OBJECT_STORAGE_SECRET_KEY", "test-secret");
});
afterEach(() => vi.unstubAllEnvs());

function request(origin: string, headers: Record<string, string> = {}) {
  const token = issueCsrf();
  return new Request("http://localhost:3001/api/admin/login", {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: `${CSRF_COOKIE}=${token}`,
      "x-csrf-token": token,
      ...headers,
    },
  });
}

it.each([
  ["http://127.0.0.1:3001", "http://localhost:3001"],
  ["http://localhost:3001", "http://127.0.0.1:3001"],
])(
  "yerel geliştirmede %s ayarıyla %s adresinin imzalı isteğini kabul eder",
  (configured, origin) => {
    vi.stubEnv("APP_URL", configured);
    expect(() => verifyCsrf(request(origin))).not.toThrow();
  },
);

it.each([
  "http://localhost:3002",
  "https://localhost:3001",
  "http://localhost.evil.invalid:3001",
  "http://evil.invalid:3001",
  "http://127.0.0.2:3001",
  "null",
])(
  "yerel istisna farklı port/protokol veya yabancı adresi kabul etmez: %s",
  (origin) => {
    expect(() => verifyCsrf(request(origin))).toThrow("CSRF");
  },
);

it("yerel adres takma adı cookie ve cross-site denetimini atlayamaz", () => {
  expect(() =>
    verifyCsrf(request("http://localhost:3001", { Cookie: "" })),
  ).toThrow("CSRF");
  expect(() =>
    verifyCsrf(
      request("http://localhost:3001", { "sec-fetch-site": "cross-site" }),
    ),
  ).toThrow("CSRF");
});

it("uzak geliştirme ve üretim adreslerinde yalnız yapılandırılmış origin kabul edilir", () => {
  vi.stubEnv("APP_URL", "http://dev.invalid:3001");
  expect(() => verifyCsrf(request("http://localhost:3001"))).toThrow("CSRF");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_URL", "https://127.0.0.1:3001");
  vi.stubEnv("OBJECT_STORAGE_ENDPOINT", "https://storage.invalid");
  expect(() => verifyCsrf(request("https://127.0.0.1:3001"))).not.toThrow();
  expect(() => verifyCsrf(request("https://localhost:3001"))).toThrow("CSRF");
});
