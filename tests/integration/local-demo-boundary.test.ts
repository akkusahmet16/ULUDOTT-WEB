import { afterEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { getPublicForm } from "../../src/modules/forms/application/public-form-service";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { LOCAL_DEMO_FORM_SLUG } from "../../src/lib/config/local-demo";

afterEach(() => vi.unstubAllEnvs());

it("hides the demo form and rejects direct submission outside the local demo", async () => {
  vi.stubEnv("LOCAL_DEMO_MODE", "true");
  vi.stubEnv("APP_URL", "https://uludott.com.tr");
  expect(await getPublicForm(LOCAL_DEMO_FORM_SLUG)).toBeNull();
  await expect(
    submitUlujam(
      { slug: LOCAL_DEMO_FORM_SLUG, versionId: randomUUID(), answers: {} },
      randomUUID(),
    ),
  ).rejects.toMatchObject({ status: 404 });
});
