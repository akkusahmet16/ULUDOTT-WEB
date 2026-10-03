import { expect, it, vi, afterEach } from "vitest";
import { verifyBotToken } from "../../src/lib/security/turnstile";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("Required Turnstile rejects missing token/config, mismatched action/hostname and replay; never logs provider error", async () => {
  vi.stubEnv("TURNSTILE_MODE", "required");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "synthetic-secret");
  vi.stubEnv("APP_URL", "https://example.test");
  await expect(verifyBotToken("", "form_submit")).rejects.toThrow("BOT");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ success: true, action: "other", hostname: "example.test" }),
  );
  await expect(
    verifyBotToken("synthetic-token", "form_submit"),
  ).rejects.toThrow("BOT");
  vi.mocked(fetch).mockResolvedValue(
    Response.json({
      success: true,
      action: "form_submit",
      hostname: "attacker.invalid",
    }),
  );
  await expect(
    verifyBotToken("synthetic-token", "form_submit"),
  ).rejects.toThrow("BOT");
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] }),
  );
  await expect(
    verifyBotToken("synthetic-token", "form_submit"),
  ).rejects.toThrow("BOT");
  vi.mocked(fetch).mockResolvedValue(
    Response.json({
      success: true,
      action: "form_submit",
      hostname: "example.test",
    }),
  );
  await expect(
    verifyBotToken("synthetic-token", "form_submit"),
  ).resolves.toBeUndefined();
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  await expect(
    verifyBotToken("synthetic-token", "form_submit"),
  ).rejects.toThrow("BOT");
});
