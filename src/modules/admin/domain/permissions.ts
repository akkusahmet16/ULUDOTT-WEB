import type { Actor } from "../../../lib/logging/audit.ts";
export const roles = [
  "content_editor",
  "event_manager",
  "system_admin",
] as const;
const globalPermissions: Record<string, readonly string[]> = {
  "content.write": ["content_editor", "event_manager"],
  "links.write": ["content_editor", "event_manager"],
  "media.write": ["content_editor", "event_manager"],
  "games.edit": ["content_editor", "event_manager"],
  "admins.manage": ["system_admin"],
  "system.read": ["system_admin"],
};
const eventPermissions = new Set([
  "applications.read",
  "applications.write",
  "applications.export",
  "teams.read",
  "teams.write",
  "teams.approve",
  "games.publish",
  "cards.read",
  "wallet.support",
]);
export function requirePermission(
  actor: Actor,
  permission: string,
  eventId?: string,
): void {
  const allowed = Object.hasOwn(globalPermissions, permission)
    ? globalPermissions[permission]
    : undefined;
  if (allowed?.some((role) => actor.roles.includes(role))) return;
  if (
    eventPermissions.has(permission) &&
    eventId &&
    actor.roles.includes("event_manager") &&
    actor.eventScopes.includes(eventId)
  )
    return;
  throw new Error("Yetki yok");
}
