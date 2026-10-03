import { expect, it } from "vitest";
import { requirePermission } from "../../src/modules/admin/domain/permissions";
it("System role does not imply PII access, editor cannot retry Wallet, manager cannot access foreign events", () => {
  const actor = {
    adminId: "a",
    roles: ["system_admin"],
    eventScopes: ["owned"],
  };
  expect(() =>
    requirePermission(actor, "applications.read", "owned"),
  ).toThrow();
  expect(() =>
    requirePermission({ ...actor, roles: ["content_editor"] }, "system.read"),
  ).toThrow();
  expect(() =>
    requirePermission(
      { ...actor, roles: ["event_manager"] },
      "applications.read",
      "foreign",
    ),
  ).toThrow();
  expect(() =>
    requirePermission(
      { ...actor, roles: ["event_manager"] },
      "applications.read",
      "owned",
    ),
  ).not.toThrow();
});
