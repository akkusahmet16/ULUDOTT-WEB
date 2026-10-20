import { it, expect } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import {
  getContactSettings,
  saveContactSettings,
} from "../../src/modules/site-settings/application/contact-settings";
it("iletişim ve footer ortak bilgileri korur; silinen sosyal bağlantılar yeniden eklenmez", async () => {
  const x = await ulujamFixture();
  try {
    const actor = { ...x.actor, roles: ["content_editor"] };
    const original = await getContactSettings();
    const fields = {
      ...original.data,
      email: "hello@uludott.test",
      phone: "+90 555 123 45 67",
      socials: [
        {
          ...original.data.socials[0],
          url: "https://instagram.com/updated-uludott",
        },
      ],
    };
    const saved = await saveContactSettings(actor, fields, 0);
    expect((await getContactSettings()).data.socials).toHaveLength(1);
    expect((await getContactSettings()).data.email).toBe("hello@uludott.test");
    await expect(saveContactSettings(actor, fields, 0)).rejects.toThrow(
      "Sürüm çakışması",
    );
    await saveContactSettings(
      actor,
      { ...fields, socials: [] },
      saved.revision,
    );
    expect((await getContactSettings()).data.socials).toEqual([]);
    for (const url of [
      "javascript:alert(1)",
      "http://instagram.com/test",
      "https://user:password@instagram.com/test",
    ])
      await expect(
        saveContactSettings(
          actor,
          { ...fields, socials: [{ ...fields.socials[0], url }] },
          2,
        ),
      ).rejects.toThrow();
    await expect(
      saveContactSettings(
        actor,
        { ...fields, email: "mailto:wrong@example.test" },
        2,
      ),
    ).rejects.toThrow();
    await expect(
      saveContactSettings(
        actor,
        { ...fields, phone: "javascript:alert(1)" },
        2,
      ),
    ).rejects.toThrow();
    await expect(
      saveContactSettings({ ...actor, roles: ["system_admin"] }, fields, 2),
    ).rejects.toThrow("Yetki yok");
  } finally {
    await x.cleanup();
  }
});
