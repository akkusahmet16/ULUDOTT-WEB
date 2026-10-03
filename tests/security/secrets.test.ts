import { expect, it } from "vitest";
import { randomToken, tokenHash } from "../../src/lib/auth/crypto";
import { getSystemStatus } from "../../src/modules/admin/application/dashboard-service";
it("Capability tokens have 256 random bits and systems refuse metadata to an editor before configuration reads", async () => {
  const tokens = Array.from({ length: 100 }, randomToken);
  expect(new Set(tokens).size).toBe(100);
  expect(tokens.every((t) => Buffer.from(t, "base64url").length === 32)).toBe(
    true,
  );
  expect(tokenHash(tokens[0])).not.toContain(tokens[0]);
  await expect(
    getSystemStatus({
      adminId: "x",
      roles: ["content_editor"],
      eventScopes: [],
    }),
  ).rejects.toThrow("Yetki");
});
