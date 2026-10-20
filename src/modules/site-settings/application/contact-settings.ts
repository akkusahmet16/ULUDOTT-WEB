import "server-only";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { contactSchema, defaultContactSettings } from "../domain/contact.ts";
import { readSetting, writeSetting } from "./store.ts";
export const getContactSettings = () =>
  readSetting("contact", contactSchema, defaultContactSettings);
export async function saveContactSettings(
  actor: Actor,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "links.write");
  return writeSetting(
    actor,
    "contact",
    contactSchema.parse(input),
    expectedRevision,
  );
}
