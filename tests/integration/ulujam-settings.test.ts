import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { defaultUlujamSettings } from "../../src/modules/site-settings/domain/ulujam";
import {
  getUlujamSettings,
  saveUlujamSettings,
  getUlujamPresentation,
  ulujamEditorData,
} from "../../src/modules/site-settings/application/ulujam-settings";
import { getPublicForm } from "../../src/modules/forms/application/public-form-service";
import {
  closeForm,
  getForm,
} from "../../src/modules/forms/application/form-service";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";

it("video ve başvuru ayarları ortak kaynaktan okunur, kapatma gerçek gönderimi durdurur", async () => {
  const x = await ulujamFixture();
  try {
    const actor = { ...x.actor, roles: ["content_editor"] };
    expect((await getUlujamSettings()).revision).toBe(0);
    const settings = {
      ...defaultUlujamSettings,
      videoUrl: "https://youtu.be/abcdefghijk",
      formId: x.form.id,
      applicationPublished: true,
      applicationTitle: "UluJam başvurusu",
      year: 2030,
    };
    const saved = await saveUlujamSettings(actor, settings, 0);
    const view = await getUlujamPresentation();
    expect(view.videoId).toBe("abcdefghijk");
    expect(view.application.url).toBe(`/basvuru/${x.input().slug}`);
    expect(view.application.open).toBe(true);
    expect(await submitUlujam(x.input(), randomUUID())).toBeTruthy();
    await expect(saveUlujamSettings(actor, settings, 0)).rejects.toThrow(
      "Sürüm çakışması",
    );
    const closed = await saveUlujamSettings(
      actor,
      { ...settings, applicationPublished: false, videoPublished: false },
      saved.revision,
    );
    expect((await getUlujamPresentation()).videoId).toBeNull();
    expect((await getUlujamPresentation()).application.url).toBeNull();
    expect((await getPublicForm(x.input().slug))?.state).not.toBe("open");
    await expect(submitUlujam(x.input(), randomUUID())).rejects.toThrow(
      /başvuru almıyor/,
    );
    const detached = await saveUlujamSettings(
      actor,
      { ...settings, formId: null, applicationPublished: false },
      closed.revision,
    );
    expect((await getPublicForm(x.input().slug))?.state).not.toBe("open");
    await saveUlujamSettings(actor, settings, detached.revision);
    await closeForm(x.actor, x.form.id, x.published.revision);
    expect((await getUlujamPresentation()).application.open).toBe(false);
    await expect(submitUlujam(x.input(), randomUUID())).rejects.toThrow();
    await expect(
      saveUlujamSettings({ ...actor, roles: ["system_admin"] }, settings, 3),
    ).rejects.toThrow("Yetki yok");
    await expect(
      saveUlujamSettings(actor, { ...settings, formId: randomUUID() }, 3),
    ).rejects.toThrow();
  } finally {
    await x.cleanup();
  }
});

it("başvuru tarih penceresi henüz açılmadığında ve dolduğunda CTA görünmez", async () => {
  const x = await ulujamFixture();
  try {
    await saveUlujamSettings(
      { ...x.actor, roles: ["content_editor"] },
      {
        ...defaultUlujamSettings,
        formId: x.form.id,
        applicationPublished: true,
      },
      0,
    );
    await x.sql`update forms set opens_at='2099-01-01',closes_at='2099-01-02' where id=${x.form.id}`;
    expect((await getUlujamPresentation()).application.url).toBeNull();
    await x.sql`update forms set opens_at='2020-01-01',closes_at='2020-01-02' where id=${x.form.id}`;
    expect((await getUlujamPresentation()).application.url).toBeNull();
    await expect(submitUlujam(x.input(), randomUUID())).rejects.toThrow();
  } finally {
    await x.cleanup();
  }
});

it("UluJam form düzenleme bağlantıları mevcut rol ve etkinlik kapsamına göre belirlenir", async () => {
  const x = await ulujamFixture();
  try {
    const editor = { ...x.actor, roles: ["content_editor"] };
    const contentOnly = await ulujamEditorData(editor);
    expect(
      contentOnly.forms.find((form) => form.id === x.form.id)?.canEdit,
    ).toBe(false);
    expect(contentOnly.canCreateForms).toBe(false);
    await expect(getForm(editor, x.form.id)).rejects.toThrow("Yetki yok");

    const manager = { ...x.actor, roles: ["content_editor", "event_manager"] };
    const scoped = await ulujamEditorData(manager);
    expect(scoped.forms.find((form) => form.id === x.form.id)?.canEdit).toBe(
      true,
    );
    expect(scoped.canCreateForms).toBe(true);
    expect((await getForm(manager, x.form.id)).id).toBe(x.form.id);

    const unscoped = await ulujamEditorData({ ...manager, eventScopes: [] });
    expect(unscoped.forms.find((form) => form.id === x.form.id)?.canEdit).toBe(
      false,
    );
    expect(unscoped.canCreateForms).toBe(false);
  } finally {
    await x.cleanup();
  }
});
