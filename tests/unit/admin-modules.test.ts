import { expect, it } from "vitest";
import {
  adminModulesFor,
  canCreateEvent,
} from "../../src/modules/admin/domain/modules";
const actor = (roles: string[]) => ({
  adminId: "test",
  roles,
  eventScopes: [],
});
it("modüller rol izinlerine uyar; duyuru ve yinelenen galeri kısayolu sunmaz", () => {
  const editor = adminModulesFor(actor(["content_editor"])).map(
    (item) => item.href,
  );
  expect(editor).toEqual(
    expect.arrayContaining([
      "/admin/etkinlikler",
      "/admin/people",
      "/admin/oyunlar",
      "/admin/ulujam",
      "/admin/iletisim",
    ]),
  );
  for (const route of [
    "/admin/duyurular",
    "/admin/galeri",
    "/admin/sistem",
    "/admin/basvurular",
  ])
    expect(editor).not.toContain(route);
  const system = adminModulesFor(actor(["system_admin"])).map(
    (item) => item.href,
  );
  expect(system).toEqual(["/admin", "/admin/sistem"]);
  expect(
    adminModulesFor(actor(["event_manager"])).some(
      (item) => item.href === "/admin/formlar",
    ),
  ).toBe(true);
  expect(
    adminModulesFor(actor(["event_manager"])).some(
      (item) => item.href === "/admin/ulujam",
    ),
  ).toBe(false);
  expect(canCreateEvent(actor(["event_manager"]))).toBe(false);
  expect(canCreateEvent(actor(["content_editor"]))).toBe(true);
});
