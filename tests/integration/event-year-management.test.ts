import { expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import {
  saveEvent,
  previewEvent,
  publishEvent,
  listEvents,
} from "../../src/modules/events/application/event-service";
import { publishedYearStart } from "../../src/modules/events/application/ulujam-service";
import { requirePermission } from "../../src/modules/admin/domain/permissions";

it("panelden UluJam yılı bağlanır ve geri sayım beslenir; yıl çakışması kayıtları ezmez", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const fields = {
      title: "UluJam 2034",
      slug: "ulujam-2034",
      kind: "ulujam",
      year: 2034,
      startsAt: "2034-01-01T12:00:00Z",
      endsAt: "2034-01-02T12:00:00Z",
      location: "Test salonu",
    };
    const event = await saveEvent(actor, fields);
    expect(event.year).toBe(2034);
    expect((await previewEvent(event.id, actor)).year).toBe(2034);
    expect(
      (await listEvents(actor)).find((row) => row.id === event.id)?.year,
    ).toBe(2034);
    await publishEvent(event.id, actor, event.revision);
    expect((await publishedYearStart(2034))?.toISOString()).toBe(
      "2034-01-01T12:00:00.000Z",
    );
    await expect(
      saveEvent(actor, { ...fields, slug: "other-jam" }),
    ).rejects.toThrow("başka etkinliğe bağlı");
    const current = await previewEvent(event.id, actor);
    const { year: _year, ...withoutYear } = fields;
    expect(_year).toBe(2034);
    await saveEvent(actor, withoutYear, event.id, current.revision);
    expect((await previewEvent(event.id, actor)).year).toBe(2034);
  } finally {
    await fixture.cleanup();
  }
});

it("UluJam yılı taşınır, açıkça kaldırılır ve genel etkinliğe dönüşümde korunmaz", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const fields = {
      title: "Yıl düzenlemesi",
      slug: "year-edit",
      kind: "ulujam",
      year: 2036,
    };
    const event = await saveEvent(actor, fields);
    const moved = await saveEvent(
      actor,
      { ...fields, year: 2037 },
      event.id,
      event.revision,
    );
    expect(moved.year).toBe(2037);
    expect(
      await fixture.sql`select year from event_years where event_id=${event.id}`,
    ).toEqual([{ year: 2037 }]);
    const unlinked = await saveEvent(
      actor,
      { ...fields, year: null },
      event.id,
      moved.revision,
    );
    expect(unlinked.year).toBeNull();
    expect(
      await fixture.sql`select year from event_years where event_id=${event.id}`,
    ).toEqual([]);
    const relinked = await saveEvent(
      actor,
      fields,
      event.id,
      unlinked.revision,
    );
    const general = await saveEvent(
      actor,
      { title: fields.title, slug: fields.slug, kind: "general" },
      event.id,
      relinked.revision,
    );
    expect(general.year).toBeNull();
    expect((await previewEvent(event.id, actor)).year).toBeNull();
    expect(
      await fixture.sql`select year from event_years where event_id=${event.id}`,
    ).toEqual([]);
  } finally {
    await fixture.cleanup();
  }
});

it("yıl çakışması ve eski revizyon hiçbir etkinliğin yılını veya içeriğini ezmez", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const first = await saveEvent(actor, {
      title: "Birinci",
      slug: "first-year",
      kind: "ulujam",
      year: 2040,
    });
    const secondFields = {
      title: "İkinci",
      slug: "second-year",
      kind: "ulujam",
      year: 2041,
    };
    const second = await saveEvent(actor, secondFields);
    await expect(
      saveEvent(
        actor,
        { ...secondFields, title: "Ezilmemeli", year: 2040 },
        second.id,
        second.revision,
      ),
    ).rejects.toThrow("başka etkinliğe bağlı");
    expect((await previewEvent(first.id, actor)).year).toBe(2040);
    expect(await previewEvent(second.id, actor)).toMatchObject({
      title: "İkinci",
      year: 2041,
      revision: second.revision,
    });
    const updated = await saveEvent(
      actor,
      { ...secondFields, year: 2042 },
      second.id,
      second.revision,
    );
    await expect(
      saveEvent(
        actor,
        { ...secondFields, year: null },
        second.id,
        second.revision,
      ),
    ).rejects.toThrow("Sürüm çakışması");
    expect((await previewEvent(second.id, actor)).year).toBe(2042);
    expect(updated.year).toBe(2042);
  } finally {
    await fixture.cleanup();
  }
});

it("yıl yalnız UluJam için tam sayı 2000–2200 aralığında kabul edilir", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    for (const year of [1999, 2201, 2034.5, "2034"]) {
      await expect(
        saveEvent(actor, {
          title: "Geçersiz",
          slug: "invalid-year",
          kind: "ulujam",
          year,
        }),
      ).rejects.toThrow();
    }
    await expect(
      saveEvent(actor, {
        title: "Genel",
        slug: "invalid-general",
        kind: "general",
        year: 2043,
      }),
    ).rejects.toThrow();
    for (const year of [2000, 2200]) {
      expect(
        (
          await saveEvent(actor, {
            title: "Sınır",
            slug: "boundary-" + year,
            kind: "ulujam",
            year,
          })
        ).year,
      ).toBe(year);
    }
  } finally {
    await fixture.cleanup();
  }
});

it("yeni etkinlik yalnız mevcut etkinlik yöneticisi oluşturucuya kapsam ekler; rol ve eski kapsamları korur", async () => {
  const fixture = await ulujamFixture();
  try {
    const creator = {
      ...fixture.actor,
      roles: ["content_editor", "event_manager"],
    };
    const otherId = randomUUID();
    const editorId = randomUUID();
    await fixture.sql`insert into admins(id,email,password_hash) values(${otherId},'other@test.invalid','not-a-login'),(${editorId},'editor@test.invalid','not-a-login')`;
    await fixture.sql`insert into admin_roles(admin_id,role) values(${creator.adminId},'content_editor'),(${creator.adminId},'event_manager'),(${otherId},'event_manager'),(${editorId},'content_editor')`;
    await fixture.sql`insert into admin_event_scopes(admin_id,event_id) values(${creator.adminId},${fixture.eventId}),(${otherId},${fixture.eventId})`;
    const fields = {
      title: "Yeni etkinlik",
      slug: "new-scoped-event",
      kind: "general",
    };
    const event = await saveEvent(creator, fields);
    const creatorScopes =
      await fixture.sql`select event_id from admin_event_scopes where admin_id=${creator.adminId} order by event_id`;
    expect(creatorScopes.map((scope) => scope.event_id).sort()).toEqual(
      [fixture.eventId, event.id].sort(),
    );
    expect(
      await fixture.sql`select event_id from admin_event_scopes where admin_id=${otherId}`,
    ).toEqual([{ event_id: fixture.eventId }]);
    expect(() =>
      requirePermission(
        {
          ...creator,
          eventScopes: creatorScopes.map((scope) => String(scope.event_id)),
        },
        "forms.write",
        event.id,
      ),
    ).not.toThrow();
    const editor = {
      adminId: editorId,
      roles: ["content_editor"],
      eventScopes: [],
    };
    const editorialEvent = await saveEvent(editor, {
      ...fields,
      slug: "editor-only-event",
    });
    expect(
      await fixture.sql`select event_id from admin_event_scopes where admin_id=${editorId}`,
    ).toEqual([]);
    expect(
      await fixture.sql`select role from admin_roles where admin_id=${editorId}`,
    ).toEqual([{ role: "content_editor" }]);
    expect(() =>
      requirePermission(editor, "forms.write", editorialEvent.id),
    ).toThrow("Yetki yok");
    await saveEvent(
      { ...creator, eventScopes: [editorialEvent.id] },
      { ...fields, slug: editorialEvent.slug },
      editorialEvent.id,
      editorialEvent.revision,
    );
    expect(
      await fixture.sql`select event_id from admin_event_scopes where admin_id=${creator.adminId} and event_id=${editorialEvent.id}`,
    ).toEqual([]);
  } finally {
    await fixture.cleanup();
  }
});
