import "server-only";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../../lib/database/client.ts";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { forms } from "../../../db/schema/forms.ts";
import { events } from "../../../db/schema/content.ts";
import {
  createDraftVersion,
  publishStoredVersion,
  readFormVersion,
} from "../infrastructure/form-repository.ts";
import { emailIdentity } from "../domain/email-identity.ts";
import { settingsSchema } from "../domain/form-settings.ts";
async function locked(tx: DbTx, actor: Actor, id: string, revision?: number) {
  z.uuid().parse(id);
  const [f] = await tx
    .select()
    .from(forms)
    .where(eq(forms.id, id))
    .for("update");
  if (!f) throw Error("Form bulunamadı");
  requirePermission(actor, "forms.write", f.eventId ?? undefined);
  if (
    revision !== undefined &&
    f.revision !== z.int().positive().parse(revision)
  )
    throw Error("Sürüm çakışması");
  return f;
}
function values(input: unknown) {
  const s = settingsSchema.parse(input);
  return {
    title: s.title,
    slug: s.slug,
    opensAt: s.opensAt ? new Date(s.opensAt) : null,
    closesAt: s.closesAt ? new Date(s.closesAt) : null,
    capacity: s.capacity,
    settings: s,
  };
}
export async function createDraftForm(
  actor: Actor,
  eventId: string,
  input: unknown,
) {
  z.uuid().parse(eventId);
  requirePermission(actor, "forms.write", eventId);
  const v = values(input);
  return withTransaction(async (tx) => {
    const [e] = await tx
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventId));
    if (!e) throw Error("Etkinlik bulunamadı");
    const [f] = await tx
      .insert(forms)
      .values({ ...v, eventId })
      .returning();
    await appendAudit(
      tx,
      actor,
      "form.created",
      { type: "form", id: f.id },
      { revision: f.revision, changedFields: ["title", "slug"] },
    );
    return { id: f.id, revision: f.revision };
  });
}
export async function saveDraftForm(
  actor: Actor,
  id: string,
  definition: unknown,
  revision: number,
) {
  return withTransaction(async (tx) => {
    await locked(tx, actor, id, revision);
    const v = await createDraftVersion(tx, id, definition);
    const [f] = await tx
      .update(forms)
      .set({ draftVersionId: v.id, revision: sql`${forms.revision}+1` })
      .where(eq(forms.id, id))
      .returning();
    await appendAudit(
      tx,
      actor,
      "form.saved",
      { type: "form", id },
      { revision: f.revision, changedFields: ["formVersion"] },
    );
    return { id, revision: f.revision };
  });
}
export async function saveFormSettings(
  actor: Actor,
  id: string,
  input: unknown,
  revision: number,
) {
  const v = values(input);
  return withTransaction(async (tx) => {
    const old = await locked(tx, actor, id, revision);
    if (
      old.currentVersionId &&
      v.settings.duplicatePolicy === "reject" &&
      !emailIdentity(
        (await readFormVersion(tx, old.currentVersionId)).definition,
      )
    )
      throw Error(
        "Tekrar politikası tek zorunlu koşulsuz e-posta alanı gerektirir",
      );
    if (old.slug !== v.slug && old.currentVersionId)
      throw Error("Yayımlı form adresi değiştirilemez");
    const [f] = await tx
      .update(forms)
      .set({ ...v, revision: sql`${forms.revision}+1` })
      .where(eq(forms.id, id))
      .returning();
    await appendAudit(
      tx,
      actor,
      "form.settings",
      { type: "form", id },
      {
        revision: f.revision,
        changedFields: ["capacity", "startsAt", "endsAt"],
      },
    );
    return { id, revision: f.revision };
  });
}
export async function publishForm(actor: Actor, id: string, revision: number) {
  return withTransaction(async (tx) => {
    const f = await locked(tx, actor, id, revision);
    const settings = settingsSchema.parse(f.settings);
    const candidate = f.draftVersionId ?? f.currentVersionId;
    if (
      candidate &&
      settings.duplicatePolicy === "reject" &&
      !emailIdentity((await readFormVersion(tx, candidate)).definition)
    )
      throw Error(
        "Tekrar politikası tek zorunlu koşulsuz e-posta alanı gerektirir",
      );
    if (!f.opensAt) throw Error("Başlangıç tarihi gerekli");
    if (f.closesAt && f.closesAt <= new Date())
      throw Error("Formun tarih penceresi geçmiş");
    let versionId = f.draftVersionId;
    if (versionId) {
      await publishStoredVersion(tx, versionId);
    } else versionId = f.currentVersionId;
    if (!versionId) throw Error("En az bir alan gerekli");
    const [saved] = await tx
      .update(forms)
      .set({
        status: "published",
        currentVersionId: versionId,
        draftVersionId: null,
        revision: sql`${forms.revision}+1`,
      })
      .where(eq(forms.id, id))
      .returning();
    await appendAudit(
      tx,
      actor,
      "form.published",
      { type: "form", id },
      {
        revision: saved.revision,
        status: "published",
        changedFields: ["formVersion"],
      },
    );
    return { id, revision: saved.revision };
  });
}
async function transition(
  actor: Actor,
  id: string,
  revision: number,
  status: "paused" | "closed",
) {
  return withTransaction(async (tx) => {
    const f = await locked(tx, actor, id, revision);
    if (!f.currentVersionId) throw Error("Form henüz yayımlanmadı");
    const [saved] = await tx
      .update(forms)
      .set({ status, revision: sql`${forms.revision}+1` })
      .where(eq(forms.id, id))
      .returning();
    await appendAudit(
      tx,
      actor,
      "form.status",
      { type: "form", id },
      { status, revision: saved.revision },
    );
    return { id, revision: saved.revision };
  });
}
export const pauseForm = (actor: Actor, id: string, revision: number) =>
  transition(actor, id, revision, "paused");
export const closeForm = (actor: Actor, id: string, revision: number) =>
  transition(actor, id, revision, "closed");
export async function getForm(actor: Actor, id: string) {
  return withTransaction(async (tx) => {
    const f = await locked(tx, actor, id);
    return {
      ...f,
      settings: settingsSchema.parse(f.settings),
      draft: f.draftVersionId
        ? await readFormVersion(tx, f.draftVersionId)
        : null,
      current: f.currentVersionId
        ? await readFormVersion(tx, f.currentVersionId)
        : null,
    };
  });
}
export async function listForms(actor: Actor) {
  if (!actor.roles.includes("event_manager")) throw Error("Yetki yok");
  if (!actor.eventScopes.length) return [];
  return getDatabase()
    .select({
      id: forms.id,
      title: forms.title,
      status: forms.status,
      eventId: forms.eventId,
    })
    .from(forms)
    .where(inArray(forms.eventId, actor.eventScopes))
    .orderBy(desc(forms.createdAt))
    .limit(200);
}
export async function formEvents(actor: Actor) {
  if (!actor.roles.includes("event_manager")) throw Error("Yetki yok");
  if (!actor.eventScopes.length) return [];
  return getDatabase()
    .select({ id: events.id, title: events.title, kind: events.kind })
    .from(events)
    .where(inArray(events.id, actor.eventScopes))
    .limit(200);
}
