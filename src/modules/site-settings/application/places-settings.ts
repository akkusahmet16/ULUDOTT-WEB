import "server-only";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  placesSettingsSchema,
  defaultPlacesSettings,
} from "../domain/places.ts";
import { readSetting, writeSetting } from "./store.ts";

export const getPlacesSettings = () =>
  readSetting("places", placesSettingsSchema, defaultPlacesSettings);

export async function savePlacesSettings(
  actor: Actor,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "content.write");
  return writeSetting(
    actor,
    "places",
    placesSettingsSchema.parse(input),
    expectedRevision,
  );
}
