import { expect, it } from "vitest";
import { Children, isValidElement, type ReactNode } from "react";
import { PeopleStory } from "../../src/modules/community/people-story";
import { SceneVideo } from "../../src/components/layout/scene-video";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import {
  getPeopleContent,
  listPeopleContent,
  savePeopleContent,
  savePeopleMember,
  removePeopleMember,
} from "../../src/modules/community/people-content";

it("Çaycı 2ce'nin kişisi silinmiş olsa da bölümün açılış videosu sitede kalır", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const entries = await listPeopleContent(actor);
    const chapter = entries.find(
      (entry) => entry.slot === "chapter:cayci-2ce",
    )!;
    await savePeopleContent(
      actor,
      chapter.slot,
      {
        ...chapter.fields,
        video:
          "/community/03-hakkimizda/people/cayci-tuce/cayci-tugce-acilis.mp4",
        title: "Çaycı 2ce",
      },
      0,
    );
    await removePeopleMember(actor, "member:cayci-2ce", 0);
    const publicChapter = (await getPeopleContent()).find(
      (entry) => entry.slug === "cayci-2ce",
    );
    expect(publicChapter?.title).toBe("Çaycı 2ce");
    expect(publicChapter?.video).toContain("cayci-tugce-acilis.mp4");
    expect(publicChapter?.members).toEqual([]);
  } finally {
    await fixture.cleanup();
  }
});

it("People düzenleyicisi sabit ekip/kişi sırasını korur, metni yayımlar ve sürüm çakışmasını reddeder", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const initial = await listPeopleContent(actor);
    expect(initial.filter((item) => item.kind === "chapter")).toHaveLength(5);
    expect(initial.filter((item) => item.kind === "member")).toHaveLength(11);
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

it("yeni kişi eklenir, başka bölüme taşınır ve silinen başlangıç kişisi geri gelmez", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const created = await savePeopleMember(actor, {
      name: "Yeni Ekip Üyesi",
      role: "Tasarımcı",
      quote: "Birlikte üret.",
      details: ["Oyun tasarımı"],
      photo: "",
      chapterSlug: "etkinlik-ekip",
      position: 0,
    });
    expect(created.revision).toBe(1);
    expect(
      (await getPeopleContent()).find((c) => c.slug === "etkinlik-ekip")
        ?.members[0].name,
    ).toBe("Yeni Ekip Üyesi");
    await savePeopleContent(
      actor,
      created.slot,
      { ...created.fields, chapterSlug: "sosyal-medya-ekip", position: 0 },
      1,
    );
    expect(
      (await getPeopleContent()).find((c) => c.slug === "sosyal-medya-ekip")
        ?.members[0].name,
    ).toBe("Yeni Ekip Üyesi");
    await expect(removePeopleMember(actor, created.slot, 1)).rejects.toThrow(
      "Sürüm çakışması",
    );
    await removePeopleMember(actor, created.slot, 2);
    await removePeopleMember(actor, "member:baskan-yigit", 0);
    expect(
      (await listPeopleContent(actor)).some(
        (e) => e.slot === created.slot || e.slot === "member:baskan-yigit",
      ),
    ).toBe(false);
    expect(
      (await getPeopleContent())
        .flatMap((c) => c.members)
        .some((m) => m.name === "Yeni Ekip Üyesi" || m.slug === "baskan-yigit"),
    ).toBe(false);
    await expect(
      savePeopleMember(actor, { ...created.fields, chapterSlug: "olmayan" }),
    ).rejects.toThrow();
    await expect(
      savePeopleMember({ ...actor, roles: ["system_admin"] }, created.fields),
    ).rejects.toThrow("Yetki yok");
  } finally {
    await fixture.cleanup();
  }
});

it("henüz medyası teslim edilmeyen üye ve bölüm boş medya ile kaydedilebilir", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const entries = await listPeopleContent(actor);
    const member = entries.find(
      (entry) => entry.slot === "member:baskan-yigit",
    )!;
    const chapter = entries.find(
      (entry) => entry.slot === "chapter:baskan-yigit",
    )!;
    await savePeopleContent(
      actor,
      member.slot,
      { ...member.fields, photo: "" },
      0,
    );
    await savePeopleContent(
      actor,
      chapter.slot,
      { ...chapter.fields, video: "", poster: "" },
      0,
    );
    const [content] = await getPeopleContent();
    expect(content.video).toBe("");
    expect(content.members[0].photo).toBe("");
    await expect(
      savePeopleContent(
        actor,
        member.slot,
        { ...member.fields, photo: "https://invalid.test/photo.webp" },
        1,
      ),
    ).rejects.toThrow();
  } finally {
    await fixture.cleanup();
  }
});

it("sosyal medya videosu gizlenir, dosya kaydı ve kişiler korunup bölüm başlığı gösterilir", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const entry = (await listPeopleContent(actor)).find(
      (item) => item.slot === "chapter:sosyal-medya-ekip",
    )!;
    if (entry.kind !== "chapter") throw Error("Bölüm kaydı bekleniyor");
    const saved = await savePeopleContent(
      actor,
      entry.slot,
      { title: "Sosyal Medya", videoVisible: false },
      entry.revision,
    );
    expect(saved.fields).toMatchObject({
      video: entry.fields.video,
      videoVisible: false,
    });
    const chapter = (await getPeopleContent()).find(
      (item) => item.slug === "sosyal-medya-ekip",
    )!;
    expect(chapter.video).toBe("");
    expect(
      chapter.members.some((member) => member.name === "Ahmet Akkuş"),
    ).toBe(true);
    function nodes(
      node: ReactNode,
    ): React.ReactElement<{ children?: ReactNode }>[] {
      return Children.toArray(node).flatMap((child) =>
        isValidElement<{ children?: ReactNode }>(child)
          ? [child, ...nodes(child.props.children)]
          : [],
      );
    }
    const story = nodes(PeopleStory({ chapters: [chapter] }));
    expect(story.filter((node) => node.type === SceneVideo)).toHaveLength(0);
    expect(
      story.some(
        (node) => node.type === "h2" && node.props.children === "Sosyal Medya",
      ),
    ).toBe(true);
    const restored = await savePeopleContent(
      actor,
      entry.slot,
      { videoVisible: true },
      saved.revision,
    );
    expect(restored.fields).toMatchObject({
      video: entry.fields.video,
      videoVisible: true,
    });
    expect(
      (await getPeopleContent()).find(
        (item) => item.slug === "sosyal-medya-ekip",
      )?.video,
    ).toBe(entry.fields.video);
  } finally {
    await fixture.cleanup();
  }
});
