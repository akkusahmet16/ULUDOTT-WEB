import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  getDashboard,
  getSystemStatus,
} from "../../src/modules/admin/application/dashboard-service";

it("Dashboard isolates personal counts and failed Wallet jobs by stored event relationships", async () => {
  const x = await ulujamFixture();
  try {
    await submitUlujam(x.input("new"), randomUUID());
    await x.sql`update events set capacity=1 where id=${x.eventId}`;
    await x.sql`update forms set capacity=1 where id=${x.form.id}`;
    const foreign = randomUUID();
    await x.sql`insert into events(id,title,slug,kind,status,starts_at) values(${foreign},'FOREIGN private event',${foreign},'ulujam','published','2031-01-01')`;
    await x.sql`insert into announcements(event_id,title,slug,body,status,publish_at) values(${x.eventId},'DEMO scheduled',${randomUUID()},'safe','scheduled','2030-01-01'),(${foreign},'FOREIGN scheduled',${randomUUID()},'safe','scheduled','2030-01-01')`;
    await x.sql`insert into applications(event_id,full_name,email,phone,mode) values(${foreign},'FOREIGN person','foreign@test.invalid','+905551234567','solo')`;
    const foreignForm = randomUUID(),
      foreignVersion = randomUUID();
    await x.sql`insert into forms(id,event_id,title,slug,status,opens_at) values(${foreignForm},${foreign},'FOREIGN form',${foreignForm},'published','2020-01-01')`;
    await x.sql`insert into form_versions(id,form_id,version,snapshot) values(${foreignVersion},${foreignForm},1,'{}')`;
    await x.sql`update forms set current_version_id=${foreignVersion} where id=${foreignForm}`;
    await x.sql`insert into submissions(form_id,version_id,event_id,snapshot,receipt_token_hash) values(${foreignForm},${foreignVersion},${foreign},'{}',${randomUUID()})`;
    const [card] = await x.sql`select id from cards`;
    await x.sql`insert into outbox(type,aggregate_id,revision,payload,status,last_error_code) values('wallet.requested',${card.id},1,${x.sql.json({ cardId: card.id, eventId: foreign })},'dead','PROVIDER_FAILED')`;
    const view = await getDashboard(x.actor);
    expect(view.events.map((e) => e.id)).toEqual([x.eventId]);
    expect(view.events[0]).toMatchObject({
      upcoming: true,
      openForms: 1,
      newSubmissions: 1,
      pendingTeams: 1,
      participants: 1,
      capacity: 1,
      full: true,
      failedWalletJobs: 1,
      scheduledAnnouncements: 1,
    });
    expect(view.forms[0]).toMatchObject({
      id: x.form.id,
      open: true,
      used: 1,
      capacity: 1,
      full: true,
    });
    expect(JSON.stringify(view)).not.toContain("FOREIGN");
    expect(JSON.stringify(view)).not.toContain("DEMO kişi");
    await expect(getDashboard(x.actor, foreign)).rejects.toThrow("Yetki yok");
    const scopedOther = await getDashboard({
      ...x.actor,
      eventScopes: [foreign],
    });
    expect(scopedOther.events[0].failedWalletJobs).toBe(0);
  } finally {
    await x.cleanup();
  }
});
it("Content editor and system-only admin receive no personal metrics or system secrets", async () => {
  const x = await ulujamFixture();
  try {
    await submitUlujam(x.input(), randomUUID());
    const editor = { ...x.actor, roles: ["content_editor"] };
    const view = await getDashboard(editor);
    expect(view.events[0].newSubmissions).toBeNull();
    expect(view.events[0].participants).toBeNull();
    expect(view.events[0].pendingTeams).toBeNull();
    expect(view.events[0].failedWalletJobs).toBeNull();
    expect(view.forms).toEqual([]);
    await expect(getSystemStatus(editor)).rejects.toThrow("Yetki yok");
    const system = { ...x.actor, roles: ["system_admin"] };
    expect((await getDashboard(system)).events).toEqual([]);
    const status = await getSystemStatus(system);
    expect(status.database).toBe("reachable");
    await expect(getSystemStatus(x.actor)).rejects.toThrow("Yetki yok");
    await x.sql`insert into outbox(type,aggregate_id,revision,payload,status,last_error_code) values('secret@test.invalid',${randomUUID()},1,${x.sql.json({ email: "secret@test.invalid", privateKey: "DO_NOT_SHOW" })},'dead','RAW_SENSITIVE_ERROR')`;
    const redacted = await getSystemStatus(system);
    expect(redacted.failedJobs[0].type).toBe("unknown");
    expect(JSON.stringify(redacted)).not.toContain("DO_NOT_SHOW");
    expect(JSON.stringify(redacted)).not.toContain("secret@test.invalid");
    expect(JSON.stringify(redacted)).not.toContain("RAW_SENSITIVE_ERROR");
    const encoded = JSON.stringify(status);
    for (const field of [
      "databaseUrl",
      "privateKey",
      "credentialsFile",
      "payload",
      "email",
      "leaseOwner",
      "objectId",
    ])
      expect(encoded).not.toContain(field);
  } finally {
    await x.cleanup();
  }
});
it("Empty scopes stay empty and withdrawn/rejected rows do not consume capacity", async () => {
  const x = await ulujamFixture();
  try {
    const empty = await getDashboard({ ...x.actor, eventScopes: [] });
    expect(empty.events).toEqual([]);
    expect(empty.forms).toEqual([]);
    await submitUlujam(x.input(), randomUUID());
    await x.sql`update applications set status='withdrawn'`;
    await x.sql`update submissions set status='rejected'`;
    await x.sql`update forms set closes_at='2021-01-01'`;
    const v = await getDashboard(x.actor, x.eventId);
    expect(v.events[0]).toMatchObject({
      participants: 0,
      full: false,
      openForms: 0,
      newSubmissions: 0,
      failedWalletJobs: 0,
      scheduledAnnouncements: 0,
    });
    expect(v.forms[0]).toMatchObject({ open: false, used: 0, full: false });
  } finally {
    await x.cleanup();
  }
});

it("Global scheduled announcements remain visible to content editors even without events", async () => {
  const x = await ulujamFixture();
  try {
    // This fixture owns an isolated disposable database, never the application database.
    await x.sql`truncate events cascade`;
    await x.sql`insert into announcements(title,slug,body,status,publish_at) values('DEMO global',${randomUUID()},'safe','scheduled','2030-01-01')`;
    const editor = { ...x.actor, roles: ["content_editor"] };
    const view = await getDashboard(editor);
    expect(view.events).toEqual([]);
    expect(view).toHaveProperty("globalScheduledAnnouncements", 1);
    expect(await getDashboard({ ...x.actor, eventScopes: [] })).toHaveProperty(
      "globalScheduledAnnouncements",
      null,
    );
  } finally {
    await x.cleanup();
  }
});
