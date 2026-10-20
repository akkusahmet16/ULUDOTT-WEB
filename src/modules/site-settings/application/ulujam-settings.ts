import "server-only";
import { eq } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import { forms } from "../../../db/schema/forms.ts";
import { events } from "../../../db/schema/content.ts";
import { siteSettings } from "../../../db/schema/site-settings.ts";
import type { Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { assertSiteAsset } from "../../media/application/site-assets.ts";
import { getPublicForm } from "../../forms/application/public-form-service.ts";
import {
  defaultUlujamSettings,
  ulujamSettingsSchema,
  youtubeVideoId,
  type UlujamPresentation,
} from "../domain/ulujam.ts";
import { readSetting, writeSetting } from "./store.ts";
export const getUlujamSettings = () =>
  readSetting(
    "ulujam-presentation",
    ulujamSettingsSchema,
    defaultUlujamSettings,
  );
export async function saveUlujamSettings(
  actor: Actor,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "publication.write");
  const data = ulujamSettingsSchema.parse(input);
  await assertSiteAsset(data.videoCover, "ulujam", "image");
  return writeSetting(
    actor,
    "ulujam-presentation",
    data,
    expectedRevision,
    async (tx) => {
      const [previous] = await tx
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, "ulujam-presentation"));
      const previousData = previous
        ? ulujamSettingsSchema.parse(previous.data)
        : defaultUlujamSettings;
      data.managedFormIds = [
        ...new Set([
          ...previousData.managedFormIds,
          ...(previousData.formId ? [previousData.formId] : []),
          ...(data.formId ? [data.formId] : []),
        ]),
      ];
      if (data.managedFormIds.length > 100)
        throw Error("Yönetilen başvuru formu sınırı aşıldı");
      if (!data.formId) return;
      const [form] = await tx
        .select({
          kind: events.kind,
          status: forms.status,
          version: forms.currentVersionId,
        })
        .from(forms)
        .innerJoin(events, eq(events.id, forms.eventId))
        .where(eq(forms.id, data.formId));
      if (!form || form.kind !== "ulujam")
        throw Error("UluJam başvuru formu bulunamadı");
      if (
        data.applicationPublished &&
        (form.status !== "published" || !form.version)
      )
        throw Error(
          "Başvuru formunu önce Form oluşturucu üzerinden yayımlayın",
        );
    },
  );
}
export async function ulujamEditorData(actor: Actor) {
  requirePermission(actor, "publication.write");
  const [setting, options] = await Promise.all([
    getUlujamSettings(),
    getDatabase()
      .select({
        id: forms.id,
        eventId: forms.eventId,
        title: forms.title,
        slug: forms.slug,
        status: forms.status,
        eventTitle: events.title,
        opensAt: forms.opensAt,
        closesAt: forms.closesAt,
      })
      .from(forms)
      .innerJoin(events, eq(events.id, forms.eventId))
      .where(eq(events.kind, "ulujam")),
  ]);
  const canEditForm = (eventId: string | null) => {
    try {
      requirePermission(actor, "forms.write", eventId ?? undefined);
      return true;
    } catch {
      return false;
    }
  };
  return {
    ...setting,
    forms: options.map(({ eventId, ...form }) => ({
      ...form,
      canEdit: canEditForm(eventId),
    })),
    canCreateForms: actor.eventScopes.some(canEditForm),
  };
}
export async function getUlujamPresentation(): Promise<UlujamPresentation> {
  const { data } = await getUlujamSettings();
  const [form] = data.formId
    ? await getDatabase()
        .select({ slug: forms.slug })
        .from(forms)
        .where(eq(forms.id, data.formId))
    : [];
  const publicForm =
    data.applicationPublished && form ? await getPublicForm(form.slug) : null;
  const open = publicForm?.state === "open" && !!publicForm.version;
  return {
    ...data,
    videoId: data.videoPublished ? youtubeVideoId(data.videoUrl) : null,
    application: {
      open,
      url: open && form ? `/basvuru/${form.slug}` : null,
      title: data.applicationTitle,
      description: data.applicationDescription,
      buttonLabel: data.applicationButtonLabel,
      message:
        data.applicationPublished && publicForm && publicForm.state !== "open"
          ? publicForm.state
          : data.applicationClosedMessage,
    },
  };
}
