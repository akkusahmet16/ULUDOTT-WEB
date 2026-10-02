import {
  save,
  preview,
  list,
  transition,
  publicBySlug,
  publicList,
} from "../../publication/service.ts";
import type { Actor } from "../../../lib/logging/audit.ts";
export const saveAnnouncement = (
  actor: Actor,
  input: unknown,
  id?: string,
  revision?: number,
) => save("announcement", actor, input, id, revision);
export const publishAnnouncement = (
  id: string,
  actor: Actor,
  expectedRevision: number,
) => transition("announcement", id, actor, expectedRevision, "publish");
export const previewAnnouncement = (id: string, actor: Actor) =>
  preview("announcement", id, actor);
export const listAnnouncements = (actor: Actor) => list("announcement", actor);
export const archiveAnnouncement = (
  id: string,
  actor: Actor,
  revision: number,
) => transition("announcement", id, actor, revision, "archived");
export const getPublicAnnouncement = (slug: string, now = new Date()) =>
  publicBySlug("announcement", slug, now);
export const getPublicAnnouncements = (now = new Date()) =>
  publicList("announcement", now);
