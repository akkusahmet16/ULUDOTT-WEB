import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { UlujamEditor } from "../../src/modules/site-settings/ui/ulujam-editor";
import { defaultUlujamSettings } from "../../src/modules/site-settings/domain/ulujam";

const form = {
  id: "40000000-0000-4000-8000-000000000001",
  title: "UluJam başvurusu",
  slug: "ulujam-test",
  status: "published",
  eventTitle: "UluJam 2027",
  opensAt: null,
  closesAt: null,
};

it("yetkisiz seçili form için düzenleme bağlantısı yerine etkinlik yöneticisi açıklaması gösterilir", () => {
  const screen = renderToStaticMarkup(
    createElement(UlujamEditor, {
      initial: {
        data: { ...defaultUlujamSettings, formId: form.id },
        revision: 1,
        forms: [{ ...form, canEdit: false }],
        canCreateForms: false,
      },
    }),
  );
  expect(screen).not.toContain(`href="/admin/formlar/${form.id}"`);
  expect(screen).toContain("etkinlik yöneticisi");
  expect(screen).toContain("UluJam başvurusu");
});

it("yetkili seçili formun soruları ve tarihleri doğrudan düzenlenebilir", () => {
  const screen = renderToStaticMarkup(
    createElement(UlujamEditor, {
      initial: {
        data: { ...defaultUlujamSettings, formId: form.id },
        revision: 1,
        forms: [{ ...form, canEdit: true }],
        canCreateForms: true,
      },
    }),
  );
  expect(screen).toContain(`href="/admin/formlar/${form.id}"`);
});

it("form seçilmediğinde oluşturucu bağlantısı da yetkiye göre gösterilir", () => {
  const initial = {
    data: { ...defaultUlujamSettings, formId: null },
    revision: 1,
    forms: [],
    canCreateForms: false,
  };
  const denied = renderToStaticMarkup(createElement(UlujamEditor, { initial }));
  expect(denied).not.toContain('href="/admin/formlar"');
  expect(denied).toContain("etkinlik yöneticisi");
  const allowed = renderToStaticMarkup(
    createElement(UlujamEditor, {
      initial: { ...initial, canCreateForms: true },
    }),
  );
  expect(allowed).toContain('href="/admin/formlar"');
});
