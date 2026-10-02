import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  createDraftForm,
  saveDraftForm,
  publishForm,
  pauseForm,
} from "../../src/modules/forms/application/form-service";
import { submitForm } from "../../src/modules/forms/application/submit-form";
import { getReceipt } from "../../src/modules/forms/application/receipt-service";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  old: string | undefined,
  formId: string,
  eventId: string,
  emailId: string,
  consentId: string,
  hiddenId: string;
const actor = {
  adminId: randomUUID(),
  roles: ["event_manager"],
  eventScopes: [] as string[],
};
beforeEach(async () => {
  local = await createTestDatabase();
  old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  eventId = randomUUID();
  emailId = randomUUID();
  consentId = randomUUID();
  hiddenId = randomUUID();
  actor.eventScopes = [eventId];
  await local.sql`insert into events(id,title,slug,kind) values(${eventId},'Test',${eventId},'general')`;
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'submit@test.invalid','not-login')`;
  const f = await createDraftForm(actor, eventId, {
    title: "Test",
    slug: "submit-test",
    opensAt: "2020-01-01T00:00:00Z",
    closesAt: null,
    capacity: 1,
    waitlist: true,
    duplicatePolicy: "reject",
    thankYou: "Teşekkürler",
    retentionDays: 180,
  });
  formId = f.id;
  await saveDraftForm(
    actor,
    formId,
    {
      fields: [
        { id: emailId, type: "email", label: "E-posta", required: true },
        {
          id: consentId,
          type: "consent",
          label: "İzin",
          content: "Test rıza",
          consentVersion: "test-v1",
          purpose: "test",
          required: true,
        },
        {
          id: hiddenId,
          type: "short_text",
          label: "Gizli",
          condition: {
            op: "eq",
            fieldId: emailId,
            value: "hidden@example.test",
          },
        },
      ],
    },
    1,
  );
  await publishForm(actor, formId, 2);
});
afterEach(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = old;
});
const answers = (email = "ada@example.test") => ({
  [emailId]: email,
  [consentId]: true,
});
it("makbuz token'ı hash, replay şifreli ve rıza sürümü atomik saklanır", async () => {
  const key = randomUUID(),
    r = await submitForm("submit-test", answers(), key, {});
  expect(r.status).toBe("received");
  const replay = await submitForm("submit-test", answers(), key, {});
  expect(replay).toEqual(r);
  const [s] = await local.sql`select receipt_token_hash,email from submissions`;
  expect(s.receipt_token_hash).not.toBe(r.receiptToken);
  expect(s.email).toBe("ada@example.test");
  const [c] = await local.sql`select purpose,text_version from consents`;
  expect(c).toEqual({ purpose: "test", text_version: "test-v1" });
  const [idem] =
    await local.sql`select response_encrypted from idempotency_records`;
  expect(idem.response_encrypted).not.toContain(r.receiptToken);
  expect(idem.response_encrypted).not.toContain("ada@example.test");
  const receipt = await getReceipt(r.receiptToken);
  expect(receipt.status).toBe("received");
  expect(receipt).not.toHaveProperty("email");
  expect(receipt).not.toHaveProperty("answers");
  await expect(getReceipt("x".repeat(43))).rejects.toThrow();
});
it("aynı key farklı gövde 409, aynı gövde tek satır; gizli yanıt reddi", async () => {
  const key = randomUUID();
  await submitForm("submit-test", answers(), key, {});
  await expect(
    submitForm("submit-test", answers("other@example.test"), key, {}),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    submitForm(
      "submit-test",
      { ...answers("new@example.test"), [hiddenId]: "kaçak" },
      randomUUID(),
      {},
    ),
  ).rejects.toThrow();
  const [n] = await local.sql`select count(*)::int as n from submissions`;
  expect(n.n).toBe(1);
});
it("paralel son koltukta yalnız bir received, diğerleri waitlisted", async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      submitForm(
        "submit-test",
        answers(`p${i}@example.test`),
        randomUUID(),
        {},
      ),
    ),
  );
  expect(results.filter((r) => r.status === "received")).toHaveLength(1);
  expect(results.filter((r) => r.status === "waitlisted")).toHaveLength(7);
});
it("kapalı/pencere/kapasite/tekrar ve eski form sürümü güvenli reddedilir", async () => {
  await local.sql`update forms set settings=settings || '{"waitlist":false}' where id=${formId}`;
  await submitForm("submit-test", answers(), randomUUID(), {});
  await expect(
    submitForm("submit-test", answers("second@example.test"), randomUUID(), {}),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    submitForm("submit-test", answers(), randomUUID(), {}),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    submitForm("submit-test", answers("third@example.test"), randomUUID(), {
      versionId: randomUUID(),
    }),
  ).rejects.toMatchObject({ status: 409 });
  await pauseForm(actor, formId, 3);
  await expect(
    submitForm("submit-test", answers("fourth@example.test"), randomUUID(), {}),
  ).rejects.toThrow();
  await local.sql`update forms set status='published',opens_at='2030-01-01' where id=${formId}`;
  await expect(
    submitForm("submit-test", answers(), randomUUID(), {}),
  ).rejects.toThrow();
});
it("tek key paralel retry, aynı receipt ve tek başvuru üretir", async () => {
  const key = randomUUID();
  const r = await Promise.all(
    Array.from({ length: 5 }, () =>
      submitForm("submit-test", answers(), key, {}),
    ),
  );
  expect(new Set(r.map((x) => x.receiptToken)).size).toBe(1);
  const [n] = await local.sql`select count(*)::int as n from submissions`;
  expect(n.n).toBe(1);
});

it("allow tekrar politikası çalışır, süresi dolan makbuz/replay iptal edilir", async () => {
  await local.sql`update forms set settings=settings || '{"duplicatePolicy":"allow"}' where id=${formId}`;
  const key = randomUUID(),
    r = await submitForm("submit-test", answers(), key, {});
  const again = await submitForm("submit-test", answers(), randomUUID(), {});
  expect(again.id).not.toBe(r.id);
  expect(again.status).toBe("waitlisted");
  await local.sql`update submissions set created_at=now()-interval '1 day',expires_at=now()-interval '1 hour' where id=${r.id}`;
  await expect(getReceipt(r.receiptToken)).rejects.toMatchObject({
    status: 404,
  });
  await expect(
    submitForm("submit-test", answers(), key, {}),
  ).rejects.toMatchObject({ status: 410 });
});
it("başvuru kapanınca aynı gövde retry önceki başarılı sonucu korur", async () => {
  const key = randomUUID(),
    r = await submitForm("submit-test", answers(), key, {});
  await pauseForm(actor, formId, 3);
  expect(await submitForm("submit-test", answers(), key, {})).toEqual(r);
  await local.sql`update forms set status='published',closes_at='2021-01-01' where id=${formId}`;
  await expect(
    submitForm("submit-test", answers("other@example.test"), randomUUID(), {}),
  ).rejects.toMatchObject({ status: 409 });
});
