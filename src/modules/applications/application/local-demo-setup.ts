import "server-only";
import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { eq } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import { localDemoEnabled, LOCAL_DEMO_FORM_SLUG } from "../../../lib/config/local-demo.ts";
import { events } from "../../../db/schema/content.ts";
import { forms } from "../../../db/schema/forms.ts";
import { applications, teams } from "../../../db/schema/ulujam.ts";
import { admins } from "../../../db/schema/admin.ts";
import { PANEL_ADMIN_EMAIL } from "../../admin/domain/panel-account.ts";
import { createDraftForm, saveDraftForm, publishForm } from "../../forms/application/form-service.ts";
import { buildUlujamFormDefinition, ulujamFields as f } from "../domain/ulujam-input.ts";
import { submitUlujam } from "./submit-ulujam.ts";

type Access = {
  eventId: string;
  formId: string;
  team: { id: string; token: string; password: string; url: string };
  receipts: { founder: string; member: string };
  cards: { founder: string; member: string };
};

async function saveAccess(path: string, value: Partial<Access>) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await chmod(path, 0o600);
}

export async function setupLocalDemo(
  accessPath = join(process.cwd(), ".local", "demo-access.json"),
): Promise<Access> {
  if (!localDemoEnabled()) throw new Error("Yerel demo yalnız yerel adreste açıktır");
  const db = getDatabase();
  let access: Partial<Access> = {};
  try { access = JSON.parse(await readFile(accessPath, "utf8")) as Partial<Access>; } catch { /* first setup */ }
  const [admin] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, PANEL_ADMIN_EMAIL));
  if (!admin) throw new Error("Önce yerel panel şifresi ayarlanmalı");
  let [event] = await db.select().from(events).where(eq(events.slug, LOCAL_DEMO_FORM_SLUG));
  if (!event) {
    [event] = await db.insert(events).values({
      title: "DEMO UluJam", slug: LOCAL_DEMO_FORM_SLUG, kind: "ulujam",
      startsAt: new Date("2030-01-01T12:00:00+03:00"),
      location: "Yerel DEMO", status: "published", maxTeamSize: 6,
      publishAt: new Date("2020-01-01T00:00:00Z"),
    }).returning();
  }
  const actor = { adminId: admin.id, roles: ["content_editor", "event_manager", "system_admin"], eventScopes: [event.id] };
  let [form] = await db.select().from(forms).where(eq(forms.slug, LOCAL_DEMO_FORM_SLUG));
  if (!form) {
    const draft = await createDraftForm(actor, event.id, {
      title: "DEMO UluJam Başvurusu", slug: LOCAL_DEMO_FORM_SLUG,
      opensAt: "2020-01-01T00:00:00Z", closesAt: null,
      capacity: 30, waitlist: false, duplicatePolicy: "reject",
      thankYou: "DEMO başvurunuz alındı.", retentionDays: 180,
    });
    await saveDraftForm(actor, draft.id, buildUlujamFormDefinition(event.id), 1);
    await publishForm(actor, draft.id, 2);
    [form] = await db.select().from(forms).where(eq(forms.id, draft.id));
  }
  if (!form.currentVersionId) throw new Error("DEMO formunun yayımlı sürümü yok");
  access.eventId = event.id; access.formId = form.id;
  let [team] = await db.select().from(teams).where(eq(teams.eventId, event.id));
  const founderEmail = "demo-kurucu@uludott.invalid";
  const [founder] = await db.select({ id: applications.id }).from(applications).where(eq(applications.email, founderEmail));
  if (!founder) {
    const result = await submitUlujam({
      slug: LOCAL_DEMO_FORM_SLUG, versionId: form.currentVersionId,
      answers: { [f.fullName]: "DEMO Kurucu", [f.email]: founderEmail,
        [f.phone]: "+905550000001", [f.mode]: "new", [f.skills]: ["software"],
        [f.levels.software]: 3, [f.teamName]: "DEMO Takım", [f.expectedSize]: 3 },
    }, "demo-founder-" + randomUUID());
    if (!result.team?.password || !result.card) throw new Error("DEMO kurucu erişimi oluşturulamadı");
    access.team = { id: result.team.id, token: result.team.token,
      password: result.team.password, url: `/takim/${result.team.token}` };
    access.receipts = { founder: result.receiptToken, member: "" };
    access.cards = { founder: result.card.token, member: "" };
    await saveAccess(accessPath, access);
    [team] = await db.select().from(teams).where(eq(teams.id, result.team.id));
  }
  if (!team || !access.team?.password || !access.team?.token || !access.receipts?.founder || !access.cards?.founder)
    throw new Error("DEMO takım erişim dosyası eksik; kayıtlar korunarak elle incelenmeli");
  const memberEmail = "demo-uye@uludott.invalid";
  const [member] = await db.select({ id: applications.id }).from(applications).where(eq(applications.email, memberEmail));
  if (!member) {
    // The published form must expose the new team to the actual public application UI.
    if (!form.currentVersionId || !access.receipts.member) {
      await saveDraftForm(actor, form.id, buildUlujamFormDefinition(event.id, [{ id: team.id, name: team.name }]), form.revision);
      await publishForm(actor, form.id, form.revision + 1);
      [form] = await db.select().from(forms).where(eq(forms.id, form.id));
    }
    const result = await submitUlujam({
      slug: LOCAL_DEMO_FORM_SLUG, versionId: form.currentVersionId,
      teamId: team.id, password: access.team.password,
      answers: { [f.fullName]: "DEMO Üye", [f.email]: memberEmail,
        [f.phone]: "+905550000002", [f.mode]: "existing", [f.skills]: ["software"],
        [f.levels.software]: 3, [f.teamId]: team.id },
    }, "demo-member-" + randomUUID());
    if (!result.card) throw new Error("DEMO üye kartı oluşturulamadı");
    access.receipts.member = result.receiptToken;
    access.cards.member = result.card.token;
    await saveAccess(accessPath, access);
  }
  return access as Access;
}
