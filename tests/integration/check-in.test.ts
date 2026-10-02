import { it, expect } from "vitest";
import sharp from "sharp";
import jsQR from "jsqr";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { approveSolo } from "../../src/modules/teams/application/approval-service";
import { getOwnCard } from "../../src/modules/cards/application/card-service";
import {
  resolveCheckIn,
  rotateCheckIn,
} from "../../src/modules/cards/application/check-in-service";
import { decryptReplay } from "../../src/modules/forms/infrastructure/submission-repository";
it("QR ayrı iptal edilebilir kimlik; kapsam, pending/ret ve private token reddi", async () => {
  const x = await ulujamFixture();
  try {
    const r = await submitUlujam(x.input("solo"), randomUUID());
    const [c] =
      await x.sql`select c.* from cards c join applications a on a.id=c.application_id where a.submission_id=${r.id}`;
    const token = (
      decryptReplay(c.checkin_token_encrypted, "check-in:" + c.id) as {
        token: string;
      }
    ).token;
    expect(token).not.toBe(r.card!.token);
    await expect(resolveCheckIn(x.actor, token)).rejects.toThrow();
    await expect(resolveCheckIn(x.actor, r.card!.token)).rejects.toThrow();
    await approveSolo(x.actor, c.application_id, 1);
    expect((await resolveCheckIn(x.actor, token)).name).toBe("DEMO kişi");
    const qr = (await getOwnCard(r.card!.token)).qr!;
    const decoded = await sharp(Buffer.from(qr.split(",")[1], "base64"))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(
      jsQR(
        new Uint8ClampedArray(decoded.data),
        decoded.info.width,
        decoded.info.height,
      )?.data,
    ).toBe("uludott:check-in:" + token);
    await expect(
      resolveCheckIn({ ...x.actor, eventScopes: [] }, token),
    ).rejects.toThrow("Yetki yok");
    await rotateCheckIn(x.actor, c.id, 2);
    await expect(resolveCheckIn(x.actor, token)).rejects.toThrow();
    expect((await getOwnCard(r.card!.token)).status).toBe("active");
    await x.sql`update applications set status='withdrawn' where id=${c.application_id}`;
    expect((await getOwnCard(r.card!.token)).qr).toBeNull();
  } finally {
    await x.cleanup();
  }
});
