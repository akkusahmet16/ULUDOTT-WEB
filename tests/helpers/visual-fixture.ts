import type { JSONValue, Sql, TransactionSql } from "postgres";
import { sql as drizzleSql } from "drizzle-orm";
import { getDatabase } from "../../src/lib/database/client.ts";
import { loadServerConfig } from "../../src/lib/config/server.ts";
import { setPanelPassword } from "../../src/modules/admin/application/panel-password.ts";
import { PANEL_ADMIN_EMAIL } from "../../src/modules/admin/domain/panel-account.ts";
import { historical2026 } from "../../src/modules/games/domain/historical-result.ts";
import { siteGameInput } from "../../src/modules/games/domain/site-games.ts";
import { settingsSchema } from "../../src/modules/forms/domain/form-settings.ts";
import {
  validateFormDefinition,
  type ValidFormDefinition,
} from "../../src/modules/forms/domain/form-version.ts";
import { buildUlujamFormDefinition } from "../../src/modules/applications/domain/ulujam-input.ts";
import {
  defaultUlujamSettings,
  ulujamSettingsSchema,
} from "../../src/modules/site-settings/domain/ulujam.ts";

export type VisualProfile = "empty" | "static-approved" | "full";

// This password belongs only to disposable visual-fixture databases. Never use
// an environment's configured credentials or return private route capabilities.
export const VISUAL_PANEL_PASSWORD = "DEMO-visual-fixture-only-password-42";
export const VISUAL_FIXED_TIME = "2026-10-22T09:00:00.000Z";
const publishedAt = "2020-01-01T00:00:00.000Z";
const expiresAt = "2035-12-31T09:00:00.000Z";
const id = (value: number) =>
  `0c000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const ids = {
  adminId: id(1),
  eventId: id(10),
  pastEventId: id(11),
  pastSecondEventId: id(12),
  ulujamEventId: id(13),
  formId: id(20),
  formVersionId: id(21),
  ulujamFormId: id(22),
  ulujamVersionId: id(23),
  submissionId: id(30),
  teamId: id(40),
  applicationId: id(41),
  seekingApplicationId: id(42),
  membershipId: id(43),
  gameId: historical2026.results[0].id,
  creditId: id(50),
  siteGameId: id(51),
  jobId: id(60),
} as const;

const slugs = {
  event: "demo-visual-future",
  pastEvent: "demo-visual-past",
  pastSecondEvent: "demo-visual-past-second",
  ulujamEvent: "demo-visual-ulujam",
  form: "visual-public",
  ulujamForm: "visual-ulujam",
  game: "demo-visual-game",
} as const;

export const visualFields = {
  name: id(100),
  email: id(101),
  phone: id(102),
  toggle: id(103),
  note: id(104),
  consent: id(105),
  choice: id(106),
} as const;

function descriptor(profile: VisualProfile) {
  return {
    profile,
    ids: { ...ids },
    slugs: { ...slugs },
    paths: {
      eventDetail: `/etkinlikler/${slugs.event}`,
      gameDetail: `/oyunlar/${slugs.game}`,
      form: `/basvuru/${slugs.form}`,
      ulujamForm: `/basvuru/${slugs.ulujamForm}`,
      adminFormDetail: `/admin/formlar/${ids.formId}`,
      adminSubmissionDetail: `/admin/basvurular/${ids.submissionId}`,
      adminGameDetail: `/admin/oyunlar/${ids.gameId}`,
      adminUlujamPreview: `/admin/ulujam-formu/${ids.ulujamEventId}`,
    },
    available: {
      approvedStatics: profile !== "empty",
      syntheticDetails: profile === "full",
      adminLogin: profile !== "empty",
    },
  };
}

const json = (value: unknown): JSONValue =>
  JSON.parse(JSON.stringify(value)) as JSONValue;

async function insertForm(
  tx: TransactionSql,
  formId: string,
  versionId: string,
  eventId: string,
  title: string,
  slug: string,
  definition: ValidFormDefinition,
) {
  const settings = settingsSchema.parse({
    title,
    slug,
    opensAt: publishedAt,
    closesAt: null,
    capacity: 30,
    waitlist: true,
    duplicatePolicy: "reject",
    thankYou: "DEMO başvuru alındı.",
    retentionDays: 3650,
  });
  await tx`insert into forms(id,event_id,title,slug,status,opens_at,capacity,settings,created_at)
    values(${formId},${eventId},${title},${slug},'published',${publishedAt},30,${tx.json(json(settings))},${VISUAL_FIXED_TIME})`;
  // Fields/rules must be inserted before sealing the published snapshot.
  await tx`insert into form_versions(id,form_id,version,snapshot,created_at)
    values(${versionId},${formId},1,${tx.json(json(definition))},${VISUAL_FIXED_TIME})`;
  for (const [position, field] of definition.fields.entries()) {
    const { id: fieldId, type, label, condition, ...config } = field;
    await tx`insert into form_fields(version_id,field_key,type,label,position,config)
      values(${versionId},${fieldId},${type},${label},${position},${tx.json(json(config))})`;
    if (condition)
      await tx`insert into form_rules(id,version_id,ast)
        values(${id((formId === ids.formId ? 200 : 300) + position)},${versionId},${tx.json(json({ fieldId, condition }))})`;
  }
  await tx`update form_versions set published_at=${publishedAt} where id=${versionId}`;
  await tx`update forms set draft_version_id=${versionId},current_version_id=${versionId} where id=${formId}`;
}

/**
 * Seed only a fresh, migrated database owned by createTestDatabase(). The caller
 * points the application's database client at that same DB before invoking this
 * helper and is responsible for closing it and dropping its own DB afterward.
 * "empty" performs no writes. "static-approved" reproduces the existing seeds,
 * including the draft Coffee Talk row that suppresses the legacy fallback card;
 * it therefore deliberately differs from a literal empty business database.
 */
export async function seedVisualFixture(sql: Sql, profile: VisualProfile) {
  if (!["empty", "static-approved", "full"].includes(profile))
    throw Error("Unknown visual fixture profile");
  const configuredUrl = new URL(loadServerConfig().databaseUrl);
  const databaseName = decodeURIComponent(configuredUrl.pathname.slice(1));
  const ownedName = /^uludott_test_[0-9a-f]{32}$/;
  const localHosts = ["127.0.0.1", "localhost"];
  if (
    !localHosts.includes(configuredUrl.hostname) ||
    !ownedName.test(databaseName) ||
    configuredUrl.search !== "" ||
    !sql.options.host.length ||
    sql.options.host.some((host) => !localHosts.includes(host))
  )
    throw Error("Visual fixtures require a fresh owned local test database");
  // Validate the client connection, not inet_server_addr(): a Docker service
  // published on loopback legitimately reports its internal container address.
  const [identity] = await sql`select current_database() as name,
    (select count(*) from events)+(select count(*) from admins)+
    (select count(*) from forms)+(select count(*) from applications)+
    (select count(*) from site_settings)+(select count(*) from site_game_entries) as records`;
  if (!ownedName.test(String(identity.name)) || Number(identity.records) !== 0)
    throw Error("Visual fixtures require a fresh owned local test database");
  if (identity.name !== databaseName)
    throw Error("Visual fixture and application database identities differ");
  if (profile === "empty") return descriptor(profile);

  // The password service uses the application client. Check its identity before
  // any writes so a stale singleton cannot reach the working database.
  const configured = await getDatabase().execute(
    drizzleSql`select current_database() as name`,
  );
  if (configured[0]?.name !== identity.name)
    throw Error("Visual fixture and application database identities differ");

  await sql.begin(async (tx) => {
    // The application clock is pinned, while PostgreSQL now() stays real.
    // Keep session creation timestamps in this OWNED fixture on the same day;
    // otherwise its real creation time can exceed the pinned 30-minute expiry.
    await tx`alter table admin_sessions alter column created_at set default '2026-10-22T09:00:00.000Z'::timestamptz`;
    await tx`alter table team_sessions alter column created_at set default '2026-10-22T09:00:00.000Z'::timestamptz`;
    await tx`insert into admins(id,email,password_hash,created_at)
      values(${ids.adminId},${PANEL_ADMIN_EMAIL},'DEMO-not-a-login-hash',${VISUAL_FIXED_TIME})`;
    await tx`insert into events(id,title,slug,kind,created_at) values
      (${historical2026.eventId},'UluJam 2026',${historical2026.slug},'ulujam',${VISUAL_FIXED_TIME}),
      ('90202700-0000-4000-8000-000000000001','UluJam 2027','ulujam-2027','ulujam',${VISUAL_FIXED_TIME}),
      ('c0ffee00-0000-4000-8000-000000000014','Coffee Talk: Tanışma Etkinliği','coffee-talk','general',${VISUAL_FIXED_TIME})`;
    await tx`insert into event_years(id,event_id,year) values
      (${historical2026.yearId},${historical2026.eventId},2026),
      (${id(2)},'90202700-0000-4000-8000-000000000001',2027)`;
    for (const result of historical2026.results) {
      await tx`insert into games(id,event_id,itch_url,historical_partial,published_at,created_at)
        values(${result.id},${historical2026.eventId},${result.itchUrl},true,${publishedAt},${VISUAL_FIXED_TIME})`;
      await tx`insert into awards(id,event_id,game_id,rank)
        values(${id(3 + result.rank)},${historical2026.eventId},${result.id},${result.rank})`;
    }
    if (profile !== "full") return;

    for (const event of [
      {
        eventId: ids.eventId,
        title: "DEMO gelecek buluşma",
        slug: slugs.event,
        kind: "general",
        start: "2035-05-10T09:00:00Z",
        end: "2035-05-10T13:00:00Z",
      },
      {
        eventId: ids.pastEventId,
        title: "DEMO geçmiş buluşma",
        slug: slugs.pastEvent,
        kind: "general",
        start: "2025-05-10T09:00:00Z",
        end: "2025-05-10T13:00:00Z",
      },
      {
        eventId: ids.pastSecondEventId,
        title: "DEMO önceki buluşma",
        slug: slugs.pastSecondEvent,
        kind: "general",
        start: "2025-04-10T09:00:00Z",
        end: "2025-04-10T13:00:00Z",
      },
      {
        eventId: ids.ulujamEventId,
        title: "DEMO UluJam buluşması",
        slug: slugs.ulujamEvent,
        kind: "ulujam",
        start: "2035-06-10T09:00:00Z",
        end: "2035-06-12T13:00:00Z",
      },
    ])
      await tx`insert into events(id,title,slug,kind,description,excerpt,organizer,location,starts_at,ends_at,publish_at,status,capacity,created_at)
        values(${event.eventId},${event.title},${event.slug},${event.kind},'DEMO birlikte üretme buluşması.','DEMO etkinlik özeti.','DEMO topluluk','DEMO topluluk salonu',${event.start},${event.end},${publishedAt},'published',30,${VISUAL_FIXED_TIME})`;
    await tx`insert into event_years(id,event_id,year) values(${id(14)},${ids.ulujamEventId},2035)`;
    const definition = validateFormDefinition({
      schemaVersion: 1,
      fields: [
        {
          id: visualFields.name,
          type: "short_text",
          label: "Ad soyad",
          required: true,
        },
        {
          id: visualFields.email,
          type: "email",
          label: "E-posta",
          required: true,
        },
        {
          id: visualFields.phone,
          type: "phone",
          label: "Telefon",
          required: true,
        },
        { id: visualFields.toggle, type: "checkbox", label: "Not ekle" },
        {
          id: visualFields.note,
          type: "long_text",
          label: "Ek not",
          condition: { op: "eq", fieldId: visualFields.toggle, value: true },
        },
        {
          id: visualFields.consent,
          type: "consent",
          label: "DEMO rızası",
          required: true,
          content: "DEMO sentetik test metni; gerçek hukuk metni değildir.",
          purpose: "visual-fixture",
          consentVersion: "DEMO-v1",
        },
        {
          id: visualFields.choice,
          type: "dropdown",
          label: "Katılım alanı",
          options: [
            { value: "software", label: "Yazılım" },
            { value: "art", label: "Görsel sanat" },
          ],
        },
      ],
    });
    await insertForm(
      tx,
      ids.formId,
      ids.formVersionId,
      ids.eventId,
      "DEMO genel başvuru",
      slugs.form,
      definition,
    );
    await insertForm(
      tx,
      ids.ulujamFormId,
      ids.ulujamVersionId,
      ids.ulujamEventId,
      "DEMO UluJam başvurusu",
      slugs.ulujamForm,
      buildUlujamFormDefinition(ids.ulujamEventId, [
        { id: ids.teamId, name: "DEMO görsel takımı" },
      ]),
    );
    await tx`update events set form_id=${ids.formId} where id=${ids.eventId}`;
    await tx`update events set form_id=${ids.ulujamFormId} where id=${ids.ulujamEventId}`;
    const presentation = ulujamSettingsSchema.parse({
      ...defaultUlujamSettings,
      year: 2035,
      formId: ids.ulujamFormId,
      managedFormIds: [ids.ulujamFormId],
      applicationPublished: true,
      applicationTitle: "DEMO UluJam başvuruları",
      applicationDescription: "DEMO birlikte üretme başvurusu.",
    });
    await tx`insert into site_settings(key,data,revision)
      values('ulujam-presentation',${tx.json(json(presentation))},1)`;
    await tx`insert into submissions(id,form_id,version_id,event_id,full_name,email,phone,status,snapshot,expires_at,receipt_token_hash,created_at)
      values(${ids.submissionId},${ids.formId},${ids.formVersionId},${ids.eventId},'DEMO başvuran','demo-visual@test.invalid','+905551234567','pending',${tx.json({ formTitle: "DEMO genel başvuru", thankYou: "DEMO başvuru alındı." })},${expiresAt},'DEMO-not-a-redeemable-receipt-hash',${VISUAL_FIXED_TIME})`;
    const answers: Record<string, JSONValue> = {
      [visualFields.name]: "DEMO başvuran",
      [visualFields.email]: "demo-visual@test.invalid",
      [visualFields.phone]: "+905551234567",
      [visualFields.toggle]: true,
      [visualFields.note]: "DEMO düzenlenebilir başvuru notu.",
      [visualFields.consent]: true,
      [visualFields.choice]: "software",
    };
    for (const [fieldId, value] of Object.entries(answers))
      await tx`insert into submission_answers(submission_id,version_id,field_key,value)
        values(${ids.submissionId},${ids.formVersionId},${fieldId},${tx.json(value)})`;
    await tx`insert into submission_status_history(id,submission_id,status,created_at)
      values(${id(31)},${ids.submissionId},'pending',${VISUAL_FIXED_TIME})`;
    await tx`insert into consents(id,submission_id,purpose,text_version,granted_at)
      values(${id(32)},${ids.submissionId},'visual-fixture','DEMO-v1',${VISUAL_FIXED_TIME})`;
    await tx`insert into teams(id,event_id,name,normalized_name,expected_size,created_at)
      values(${ids.teamId},${ids.ulujamEventId},'DEMO görsel takımı','demo görsel takımı',3,${VISUAL_FIXED_TIME})`;
    for (const application of [
      {
        applicationId: ids.applicationId,
        name: "DEMO takım üyesi",
        email: "demo-member@test.invalid",
        mode: "new",
        skill: "software",
      },
      {
        applicationId: ids.seekingApplicationId,
        name: "DEMO takım arayan",
        email: "demo-seeker@test.invalid",
        mode: "seeking",
        skill: "visual_art",
      },
    ]) {
      await tx`insert into applications(id,event_id,full_name,email,phone,mode,created_at)
        values(${application.applicationId},${ids.ulujamEventId},${application.name},${application.email},'+905551234567',${application.mode},${VISUAL_FIXED_TIME})`;
      await tx`insert into application_skills(application_id,skill,level)
        values(${application.applicationId},${application.skill},3)`;
    }
    await tx`insert into memberships(id,event_id,team_id,application_id,joined_at)
      values(${ids.membershipId},${ids.ulujamEventId},${ids.teamId},${ids.applicationId},${VISUAL_FIXED_TIME})`;
    await tx`update games set title='DEMO görsel oyun',slug=${slugs.game},description='DEMO birlikte üretilmiş oyun açıklaması.',editorial_team_name='DEMO oyun takımı',historical_partial=false,slug_locked=true where id=${ids.gameId}`;
    await tx`insert into game_credits(id,game_id,publication_name,consented_at)
      values(${ids.creditId},${ids.gameId},'DEMO yapımcı',${VISUAL_FIXED_TIME})`;
    await tx`insert into finalists(id,event_id,game_id,position)
      values(${id(52)},${historical2026.eventId},${ids.gameId},0)`;
    const siteGame = siteGameInput.parse({
      title: "DEMO yayımlanmış oyun",
      label: "DEMO topluluk oyunu",
      credit: "DEMO oyun ekibi",
      description: "DEMO sentetik oyun kartı açıklaması.",
      image: "/community/06-oyunlar/yayimlanan/no-time-to-die.webp",
      alt: "DEMO oyun kapak görseli",
      href: "https://demo-visual.itch.io/demo-game",
      position: 0,
      published: true,
    });
    await tx`insert into site_game_entries(id,data,revision) values(${ids.siteGameId},${tx.json(json(siteGame))},1)`;
    await tx`insert into outbox(id,type,aggregate_id,revision,payload,status,attempts,last_error_code,available_at,created_at)
      values(${ids.jobId},'wallet.requested',${ids.applicationId},1,'{}','dead',5,'PROVIDER_FAILED',${VISUAL_FIXED_TIME},${VISUAL_FIXED_TIME})`;
  });
  await setPanelPassword(VISUAL_PANEL_PASSWORD);
  // The existing service generates an internal audit id/time; normalize only the
  // fresh fixture's own row so both source versions start with identical data.
  await sql`update audit_logs set id=${id(70)},created_at=${VISUAL_FIXED_TIME}
    where actor_id=${ids.adminId} and action='admin.password_changed'`;
  return descriptor(profile);
}
