import {
  save,
  preview,
  list,
  transition,
  publicBySlug,
  publicList,
  featured,
} from "../../publication/service.ts";
import type { Actor } from "../../../lib/logging/audit.ts";
export const saveEvent = (
  actor: Actor,
  input: unknown,
  id?: string,
  revision?: number,
) => save("event", actor, input, id, revision);
export const publishEvent = (
  id: string,
  actor: Actor,
  expectedRevision: number,
) => transition("event", id, actor, expectedRevision, "publish");
export const previewEvent = (id: string, actor: Actor) =>
  preview("event", id, actor);
export const listEvents = (actor: Actor) => list("event", actor);
export const archiveEvent = (id: string, actor: Actor, revision: number) =>
  transition("event", id, actor, revision, "archived");
export const changeEventStatus = (
  id: string,
  actor: Actor,
  revision: number,
  status: "draft" | "ended" | "cancelled",
) => transition("event", id, actor, revision, status);
export const getPublicEvent = (slug: string, now = new Date()) =>
  publicBySlug("event", slug, now);
export const getPublicEvents = (now = new Date()) => publicList("event", now);
export const getFeaturedEvents = featured;
