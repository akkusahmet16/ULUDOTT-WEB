import "server-only";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  homepageSettingsSchema,
  defaultHomepageSettings,
} from "../domain/homepage.ts";
import { readSetting, writeSetting } from "./store.ts";

export const getHomepageSettings = () =>
  readSetting("homepage", homepageSettingsSchema, defaultHomepageSettings);

export async function saveHomepageSettings(
  actor: Actor,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "content.write");
  return writeSetting(
    actor,
    "homepage",
    homepageSettingsSchema.parse(input),
    expectedRevision,
  );
}
