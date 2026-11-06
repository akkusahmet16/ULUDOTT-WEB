import "server-only";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  sponsorsSettingsSchema,
  defaultSponsorsSettings,
} from "../domain/sponsors.ts";
import { readSetting, writeSetting } from "./store.ts";

export const getSponsorsSettings = () =>
  readSetting("sponsors", sponsorsSettingsSchema, defaultSponsorsSettings);

export async function saveSponsorsSettings(
  actor: Actor,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "content.write");
  return writeSetting(
    actor,
    "sponsors",
    sponsorsSettingsSchema.parse(input),
    expectedRevision,
  );
}
