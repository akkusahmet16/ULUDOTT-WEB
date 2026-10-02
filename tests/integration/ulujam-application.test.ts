import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { publicBySlug } from "../../src/modules/publication/service";
import { submitForm } from "../../src/modules/forms/application/submit-form";
import { ulujamFields as f } from "../../src/modules/applications/domain/ulujam-input";
it("UluJam atomik kayıt, replay, farklı gövde, normalize e-posta ve generic bypass", async () => {
  const x = await ulujamFixture();
  try {
    const input = x.input("solo", "DEMO@test.invalid"),
      key = randomUUID();
    const r = await submitUlujam(input, key);
    expect(r.receiptToken).toMatch(/^[\w-]{43}$/);
    expect(await submitUlujam(input, key)).toEqual(r);
    await expect(
      submitUlujam(
        { ...input, answers: { ...input.answers, [f.phone]: "+905559999999" } },
        key,
      ),
    ).rejects.toThrow();
    await expect(
      submitUlujam(x.input("solo", "demo@test.invalid"), randomUUID()),
    ).rejects.toThrow();
    expect((await x.sql`select count(*)::int n from applications`)[0].n).toBe(
      1,
    );
    expect(
      (await x.sql`select count(*)::int n from application_skills`)[0].n,
    ).toBe(1);
    await expect(
      submitForm(input.slug, input.answers, randomUUID(), {
        versionId: input.versionId,
      }),
    ).rejects.toThrow(/UluJam/);
    await expect(
      submitUlujam(
        { ...x.input(), answers: { ...x.input().answers, [f.phone]: "" } },
        randomUUID(),
      ),
    ).rejects.toThrow();
    expect((await x.sql`select count(*)::int n from cards where status<>'pending'`)[0].n).toBe(0);
  } finally {
    await x.cleanup();
  }
});
it("Kapanan etkinlikte başarılı isteğin makbuzu yeniden alınabilir", async () => {
  const x = await ulujamFixture();
  try {
    const input = x.input(), key = randomUUID();
    const receipt = await submitUlujam(input, key);
    await x.sql`update events set status='archived' where id=${x.eventId}`;
    expect(await submitUlujam(input, key)).toEqual(receipt);
    await expect(submitUlujam(x.input(), randomUUID())).rejects.toThrow(/açık değil/);
  } finally { await x.cleanup(); }
});

it("UluJam açık özel forma etkinlikten erişilebilir", async () => {
 const x=await ulujamFixture();
 try {
 await x.sql`update events set form_id=${x.form.id} where id=${x.eventId}`;
 const [e]=await x.sql`select slug from events where id=${x.eventId}`;
 expect((await publicBySlug("event",e.slug))?.applicationUrl).toBe("/basvuru/"+x.input().slug);
 } finally {await x.cleanup();}
});
