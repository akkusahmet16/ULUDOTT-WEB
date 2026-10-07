import { expect, it } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import {
  getPeopleContent,
  listPeopleContent,
  savePeopleContent,
} from "../../src/modules/community/people-content";

it("People düzenleyicisi sabit ekip/kişi sırasını korur, metni yayımlar ve sürüm çakışmasını reddeder", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const initial = await listPeopleContent(actor);
    expect(initial.filter((item) => item.kind === "chapter")).toHaveLength(5);
    expect(initial.filter((item) => item.kind === "member")).toHaveLength(10);
    const member = initial.find((item) => item.slot === "member:baskan-yigit")!;
    const fields = { ...member.fields, quote: "Test alıntısı" };
    const saved = await savePeopleContent(
      actor,
      member.slot,
      fields,
      member.revision,
    );
    expect(saved.revision).toBe(1);
    expect((await getPeopleContent())[0].members[0].quote).toBe(
      "Test alıntısı",
    );
    await expect(
      savePeopleContent(actor, member.slot, fields, 0),
    ).rejects.toThrow("Sürüm çakışması");
    await expect(
      savePeopleContent(actor, "member:olmayan", fields, 0),
    ).rejects.toThrow("Bilinmeyen alan");
    await expect(
      savePeopleContent(
        { ...fixture.actor, roles: ["system_admin"] },
        member.slot,
        fields,
        1,
      ),
    ).rejects.toThrow("Yetki yok");
  } finally {
    await fixture.cleanup();
  }
});
