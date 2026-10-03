import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { listSubmissions } from "../../src/modules/forms/application/submission-admin";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { enforceRateLimit } from "../../src/lib/security/rate-limit";
it("SQL metacharacters stay data; concurrent rate increments are atomic and identities are hashed", async () => {
  const x = await ulujamFixture();
  try {
    await submitUlujam(x.input(), randomUUID());
    expect(
      (await listSubmissions(x.actor, x.form.id, null, { q: "' OR 1=1; --" }))
        .items,
    ).toEqual([]);
    const outcomes = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        enforceRateLimit("form_submit", "synthetic@test.invalid", {
          limit: 3,
          windowSeconds: 60,
        }),
      ),
    );
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    const rows = await x.sql`select key_hash from rate_limits`;
    expect(JSON.stringify(rows)).not.toContain("synthetic@test.invalid");
  } finally {
    await x.cleanup();
  }
});
