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
import {
  forms,
  formVersions,
  formFields,
  formRules,
  submissions,
  submissionAnswers,
  submissionFiles,
  submissionStatusHistory,
  consents,
} from "../../../db/schema/forms.ts";
import { events, games, gameCredits } from "../../../db/schema/content.ts";
import {
  applications,
  applicationSkills,
  memberships,
  teams,
  teamApprovals,
  teamAccess,
  teamSessions,
} from "../../../db/schema/ulujam.ts";
import {
  cards,
  walletPasses,
  appleRegistrations,
} from "../../../db/schema/wallet.ts";
import { idempotencyRecords } from "../../../db/schema/operations.ts";
import { siteSettings } from "../../../db/schema/site-settings.ts";
import { removePrivate } from "../../media/infrastructure/object-store.ts";
import {
  createDraftVersion,
  publishStoredVersion,
  readFormVersion,
} from "../infrastructure/form-repository.ts";
import { emailIdentity } from "../domain/email-identity.ts";
import { validateFormDefinition } from "../domain/form-version.ts";
import { settingsSchema } from "../domain/form-settings.ts";
import { buildUlujamFormDefinition } from "../../applications/domain/ulujam-input.ts";
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
      .select({ id: events.id, kind: events.kind })
      .from(events)
      .where(eq(events.id, eventId));
    if (!e) throw Error("Etkinlik bulunamadı");
    const [f] = await tx
      .insert(forms)
      .values({ ...v, eventId })
      .returning();
    if (e.kind === "ulujam") {
      const version = await createDraftVersion(
        tx,
        f.id,
        buildUlujamFormDefinition(eventId),
      );
      await tx
        .update(forms)
        .set({ draftVersionId: version.id })
        .where(eq(forms.id, f.id));
    }
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
    const form = await locked(tx, actor, id, revision);
    if (form.eventId) {
      const [event] = await tx
        .select({ kind: events.kind })
        .from(events)
        .where(eq(events.id, form.eventId));
      if (
        event?.kind === "ulujam" &&
        validateFormDefinition(definition).fields.some(
          (field) => field.type === "file",
        )
      )
        throw Error("UluJam formunda dosya alanı kullanılamaz");
    }
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
export async function deleteForm(
  actor: Actor,
  id: string,
  revision?: number,
) {
  const objectKeys = await withTransaction(async (tx) => {
    const f = await locked(tx, actor, id, revision);
    await tx.update(events).set({ formId: null }).where(eq(events.formId, id));
    const [ulujamSetting] = await tx
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "ulujam-presentation"))
      .for("update");
    if (
      ulujamSetting &&
      ulujamSetting.data &&
      typeof ulujamSetting.data === "object"
    ) {
      const d = ulujamSetting.data as Record<string, unknown>;
      const managed = Array.isArray(d.managedFormIds)
        ? d.managedFormIds.filter((fid) => fid !== id)
        : [];
      const isCurrent = d.formId === id;
      if (
        isCurrent ||
        (Array.isArray(d.managedFormIds) &&
          managed.length !== d.managedFormIds.length)
      ) {
        await tx
          .update(siteSettings)
          .set({
            data: {
              ...d,
              ...(isCurrent
                ? { formId: null, applicationPublished: false }
                : {}),
              managedFormIds: managed,
            },
            revision: sql`${siteSettings.revision}+1`,
          })
          .where(eq(siteSettings.key, "ulujam-presentation"));
      }
    }
    const subRows = await tx
      .select({ id: submissions.id })
      .from(submissions)
      .where(eq(submissions.formId, id))
      .for("update");
    const subIds = subRows.map((r) => r.id);
    const keys: string[] = [];
    if (subIds.length > 0) {
      const files = await tx
        .select({ objectKey: submissionFiles.objectKey })
        .from(submissionFiles)
        .where(inArray(submissionFiles.submissionId, subIds));
      keys.push(...files.map((file) => file.objectKey));
      const appRows = await tx
        .select({ id: applications.id })
        .from(applications)
        .where(inArray(applications.submissionId, subIds))
        .for("update");
      const appIds = appRows.map((a) => a.id);
      if (appIds.length > 0) {
        const cardRows = await tx
          .select({ id: cards.id })
          .from(cards)
          .where(inArray(cards.applicationId, appIds));
        const cardIds = cardRows.map((c) => c.id);
        if (cardIds.length > 0) {
          const passRows = await tx
            .select({ id: walletPasses.id })
            .from(walletPasses)
            .where(inArray(walletPasses.cardId, cardIds));
          const passIds = passRows.map((p) => p.id);
          if (passIds.length > 0) {
            await tx
              .delete(appleRegistrations)
              .where(inArray(appleRegistrations.passId, passIds));
            await tx
              .delete(walletPasses)
              .where(inArray(walletPasses.id, passIds));
          }
          await tx.delete(cards).where(inArray(cards.id, cardIds));
        }
        const memRows = await tx
          .select({ teamId: memberships.teamId })
          .from(memberships)
          .where(inArray(memberships.applicationId, appIds));
        const affectedTeamIds = [...new Set(memRows.map((m) => m.teamId))];
        await tx
          .delete(memberships)
          .where(inArray(memberships.applicationId, appIds));
        await tx
          .delete(applicationSkills)
          .where(inArray(applicationSkills.applicationId, appIds));
        await tx
          .delete(gameCredits)
          .where(inArray(gameCredits.applicationId, appIds));
        await tx
          .delete(applications)
          .where(inArray(applications.id, appIds));
        for (const teamId of affectedTeamIds) {
          const [remaining] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(memberships)
            .where(eq(memberships.teamId, teamId));
          if (!remaining || remaining.count === 0) {
            await tx
              .update(games)
              .set({ teamId: null })
              .where(eq(games.teamId, teamId));
            await tx
              .delete(teamSessions)
              .where(eq(teamSessions.teamId, teamId));
            await tx.delete(teamAccess).where(eq(teamAccess.teamId, teamId));
            await tx
              .delete(teamApprovals)
              .where(eq(teamApprovals.teamId, teamId));
            await tx.delete(teams).where(eq(teams.id, teamId));
          }
        }
      }
      await tx
        .delete(submissionFiles)
        .where(inArray(submissionFiles.submissionId, subIds));
      await tx
        .delete(idempotencyRecords)
        .where(inArray(idempotencyRecords.resourceId, subIds));
      await tx
        .delete(submissionAnswers)
        .where(inArray(submissionAnswers.submissionId, subIds));
      await tx
        .delete(consents)
        .where(inArray(consents.submissionId, subIds));
      await tx
        .delete(submissionStatusHistory)
        .where(inArray(submissionStatusHistory.submissionId, subIds));
      await tx.delete(submissions).where(inArray(submissions.id, subIds));
    }
    await tx
      .delete(idempotencyRecords)
      .where(inArray(idempotencyRecords.scope, [`form:${id}`, `ulujam:${id}`]));
    await tx
      .update(forms)
      .set({ draftVersionId: null, currentVersionId: null })
      .where(eq(forms.id, id));
    const verRows = await tx
      .select({ id: formVersions.id })
      .from(formVersions)
      .where(eq(formVersions.formId, id));
    const verIds = verRows.map((v) => v.id);
    if (verIds.length > 0) {
      await tx.execute(
        sql`alter table form_rules disable trigger form_rule_immutable`,
      );
      await tx.execute(
        sql`alter table form_fields disable trigger form_field_immutable`,
      );
      await tx.execute(
        sql`alter table form_versions disable trigger form_version_immutable`,
      );
      await tx.delete(formRules).where(inArray(formRules.versionId, verIds));
      await tx.delete(formFields).where(inArray(formFields.versionId, verIds));
      await tx.delete(formVersions).where(inArray(formVersions.id, verIds));
      await tx.execute(
        sql`alter table form_versions enable trigger form_version_immutable`,
      );
      await tx.execute(
        sql`alter table form_fields enable trigger form_field_immutable`,
      );
      await tx.execute(
        sql`alter table form_rules enable trigger form_rule_immutable`,
      );
    }
    await tx.delete(forms).where(eq(forms.id, id));
    await appendAudit(
      tx,
      actor,
      "form.deleted",
      { type: "form", id },
      { revision: f.revision },
    );
    return keys;
  });
  await Promise.allSettled(objectKeys.map(removePrivate));
  return { deleted: true, id };
}
export async function getForm(actor: Actor, id: string) {
  return withTransaction(async (tx) => {
    const f = await locked(tx, actor, id);
    return {
      ...f,
      eventKind: f.eventId
        ? (
            await tx
              .select({ kind: events.kind })
              .from(events)
              .where(eq(events.id, f.eventId))
          )[0]?.kind
        : null,
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
      slug: forms.slug,
      status: forms.status,
      eventId: forms.eventId,
      settings: forms.settings,
      createdAt: forms.createdAt,
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
