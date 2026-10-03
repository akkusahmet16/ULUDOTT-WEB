import { loadEnvFile } from "node:process";
import { expect, it } from "vitest";
import { requireCsrf } from "../../src/lib/security/headers";
import { issueCsrf, CSRF_COOKIE } from "../../src/lib/auth/csrf";
it("Signed CSRF rejects cross-origin, forged cookie pair and session rebinding", () => {
  loadEnvFile(".env.local");
  const token = issueCsrf(),
    origin = new URL(process.env.APP_URL!).origin;
  const req = (value: string, from = origin) =>
    new Request(origin + "/api/forms/a/submit", {
      method: "POST",
      headers: {
        origin: from,
        "x-csrf-token": value,
        cookie: CSRF_COOKIE + "=" + value,
      },
    });
  expect(() => requireCsrf(req(token))).not.toThrow();
  expect(() => requireCsrf(req(token, "https://attacker.invalid"))).toThrow();
  expect(() => requireCsrf(req("fake.fake.fake.fake"))).toThrow();
});
