import {
  createDraftForm,
  saveDraftForm,
  publishForm,
} from "../../src/modules/forms/application/form-service.ts";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam.ts";
import {
  buildUlujamFormDefinition,
  ulujamFields as u,
} from "../../src/modules/applications/domain/ulujam-input.ts";
import { seedCoffeeTalkDraft } from "../../src/db/seeds/development/coffee-talk-draft.ts";
import { submitForm } from "../../src/modules/forms/application/submit-form.ts";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type Server } from "node:https";
import { request as proxyRequest } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { createTestDatabase } from "./local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { seedUlujamComingSoon } from "../../src/db/seeds/ulujam-coming-soon.ts";
import { seed2026Results } from "../../src/db/seeds/2026-results.ts";
import { getDatabase, closeDatabase } from "../../src/lib/database/client.ts";
import {
  hashPassword,
  encryptMfaSecret,
  tokenHash,
} from "../../src/lib/auth/crypto.ts";

import { removePrivate } from "../../src/modules/media/infrastructure/object-store.ts";
const local = await createTestDatabase();
let child: ReturnType<typeof spawn> | undefined;
let cleanup: Promise<void> | undefined;
let productionDir: string | undefined;
const gateways: Server[] = [];
async function finish(code: number) {
  cleanup ??= (async () => {
    try {
      const [ready] =
        await local.sql`select to_regclass('public.media_assets') as t`;
      if (ready.t) {
        const keys =
          await local.sql`select original_key as key from media_assets union all select object_key as key from media_variants`;
        for (const row of keys) await removePrivate(row.key);
      }
    } finally {
      for (const gateway of gateways) {
        gateway.closeAllConnections();
        await new Promise<void>((resolve) => gateway.close(() => resolve()));
      }
      await closeDatabase();
      await local.cleanup();
      if (productionDir)
        await rm(productionDir, { recursive: true, force: true });
    }
  })();
  await cleanup;
  process.exit(code);
}
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    if (child?.pid) {
      try {
        process.kill(-child.pid, signal);
      } catch {
        void finish(0);
      }
    } else void finish(0);
  });
try {
  process.env.DATABASE_URL = local.url;
  process.env.APP_URL = "http://127.0.0.1:3100";
  await migrateEmptyDatabase();
  await seed2026Results(getDatabase());
  await seedUlujamComingSoon(getDatabase());
  await seedCoffeeTalkDraft(getDatabase());
  const id = randomUUID();
  await local.sql`insert into admins(id,email,password_hash,mfa_secret_encrypted) values(${id},'admin-e2e@test.invalid',${await hashPassword("E2E-only-password-long-42")},${encryptMfaSecret("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP", id)})`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'system_admin')`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'content_editor')`;
  await local.sql`insert into admin_roles(admin_id,role) values(${id},'event_manager')`;
  await local.sql`insert into admin_event_scopes(admin_id,event_id) select ${id},id from events`;
  await local.sql`update admins set recovery_code_hashes=${local.sql.json([tokenHash("11111111111111111111111111111111"), tokenHash("22222222222222222222222222222222"), tokenHash("33333333333333333333333333333333"), tokenHash("44444444444444444444444444444444"), tokenHash("55555555555555555555555555555555"), tokenHash("66666666666666666666666666666666"), tokenHash("77777777777777777777777777777777"), tokenHash("88888888888888888888888888888888"), tokenHash("99999999999999999999999999999999"), tokenHash("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),tokenHash("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"), tokenHash("cccccccccccccccccccccccccccccccc")])} where id=${id}`;
  const [scopeEvent] =
    await local.sql`select event_id from event_years where year=2027`;
  await local.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values('15000000-0000-4000-8000-000000000090',${scopeEvent.event_id},'DEMO önizleme takımı','demo önizleme takımı',3)`;
  const formActor = {
    adminId: id,
    roles: ["event_manager"],
    eventScopes: ["c0ffee00-0000-4000-8000-000000000014"],
  };
  const registrationEvent = "16000000-0000-4000-8000-000000000001";
  await local.sql`insert into events(id,title,slug,kind,status,starts_at,location) values(${registrationEvent},'DEMO UluJam başvuru','ulujam-registration-test','ulujam','published','2030-01-01','DEMO yer')`;
  await local.sql`insert into admin_event_scopes(admin_id,event_id) values(${id},${registrationEvent})`;
  const registrationActor = {
    adminId: id,
    roles: ["event_manager"],
    eventScopes: [registrationEvent],
  };
  const registrationForm = await createDraftForm(
    registrationActor,
    registrationEvent,
    {
      title: "DEMO UluJam başvuru",
      slug: "e2e-ulujam",
      opensAt: "2020-01-01T00:00:00Z",
      closesAt: null,
      capacity: 30,
      waitlist: false,
      duplicatePolicy: "reject",
      thankYou: "DEMO başvuru alındı.",
      retentionDays: 1,
    },
  );
  await saveDraftForm(
    registrationActor,
    registrationForm.id,
    buildUlujamFormDefinition(registrationEvent),
    1,
  );
  await publishForm(registrationActor, registrationForm.id, 2);
  const publicForm = await createDraftForm(
    formActor,
    "c0ffee00-0000-4000-8000-000000000014",
    {
      title: "E2E genel form",
      slug: "e2e-public",
      opensAt: "2020-01-01T00:00:00Z",
      closesAt: null,
      capacity: 20,
      waitlist: true,
      duplicatePolicy: "reject",
      thankYou: "Test başvurusu alındı.",
      retentionDays: 180,
    },
  );
  const email = randomUUID(),
    phone = randomUUID(),
    toggle = randomUUID(),
    note = randomUUID(),
    consent = randomUUID();
  await saveDraftForm(
    formActor,
    publicForm.id,
    {
      fields: [
        { id: email, type: "email", label: "E-posta", required: true },
        { id: phone, type: "phone", label: "Telefon", required: true },
        { id: toggle, type: "checkbox", label: "Not ekle" },
        {
          id: note,
          type: "long_text",
          label: "Ek not",
          condition: { op: "eq", fieldId: toggle, value: true },
        },
        {
          id: consent,
          type: "consent",
          label: "Test rızası",
          content: "E2E test metni; gerçek hukuk metni değildir.",
          consentVersion: "test-v1",
          purpose: "test",
          required: true,
        },
      ],
    },
    1,
  );
  await publishForm(formActor, publicForm.id, 2);
  const adminForm = await createDraftForm(
    formActor,
    "c0ffee00-0000-4000-8000-000000000014",
    {
      title: "E2E başvuru yönetimi",
      slug: "e2e-admin",
      opensAt: "2020-01-01T00:00:00Z",
      closesAt: null,
      capacity: 2,
      waitlist: true,
      duplicatePolicy: "allow",
      thankYou: "Test alındı.",
      retentionDays: 180,
    },
  );
  const adminField = randomUUID();
  await saveDraftForm(
    formActor,
    adminForm.id,
    {
      fields: [
        { id: adminField, type: "short_text", label: "Not", required: true },
      ],
    },
    1,
  );
  await publishForm(formActor, adminForm.id, 2);
  await submitForm("e2e-admin", { [adminField]: "=1+1" }, randomUUID(), {});
  const [registrationVersion] =
    await local.sql`select current_version_id from forms where id=${registrationForm.id}`;
  await submitUlujam(
    {
      slug: "e2e-ulujam",
      versionId: registrationVersion.current_version_id,
      answers: {
        [u.fullName]: "DEMO onay üyesi",
        [u.email]: "approval-e2e@test.invalid",
        [u.phone]: "+905551234567",
        [u.mode]: "new",
        [u.skills]: ["software"],
        [u.levels.software]: 3,
        [u.teamName]: "DEMO onay takımı",
        [u.expectedSize]: 2,
      },
    },
    randomUUID(),
  );
  await submitUlujam(
    {
      slug: "e2e-ulujam",
      versionId: registrationVersion.current_version_id,
      answers: {
        [u.fullName]: "DEMO solo onay",
        [u.email]: "solo-approval-e2e@test.invalid",
        [u.phone]: "+905551234567",
        [u.mode]: "solo",
        [u.skills]: ["software"],
        [u.levels.software]: 3,
      },
    },
    randomUUID(),
  );
  const matchingTeam = "ffffffff-0000-4000-8000-000000000001",
    matchingPerson = randomUUID();
  await local.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values(${matchingTeam},${registrationEvent},'DEMO eşleştirme takımı','demo eşleştirme takımı',2)`;
  await local.sql`insert into applications(id,event_id,full_name,email,phone,mode) values(${matchingPerson},${registrationEvent},'DEMO arayan','matching-e2e@test.invalid','+905551234567','seeking')`;
  for (let candidate = 1; candidate <= 5; candidate++) {
    const candidateId =
      "17000000-0000-4000-8000-" + String(candidate).padStart(12, "0");
    await local.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values(${candidateId},${registrationEvent},${"DEMO aday " + candidate},${"demo aday " + candidate},2)`;
  }
  await local.sql`insert into application_skills(application_id,skill,level) values(${matchingPerson},'visual_art',4)`;
  await closeDatabase();
  if (process.env.ULUDOTT_E2E_PRODUCTION === "1") {
    productionDir = await mkdtemp(join(tmpdir(), "uludott-standalone-"));
    await cp(".next/standalone", productionDir, { recursive: true });
    await cp(".next/static", join(productionDir, ".next/static"), {
      recursive: true,
    });
    await cp("public", join(productionDir, "public"), { recursive: true });
    await writeFile(
      join(productionDir, "tls.cnf"),
      "[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=localhost\n[ext]\nsubjectAltName=IP:127.0.0.1,DNS:localhost\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,digitalSignature,keyEncipherment\n",
    );
    const certPath = join(productionDir, "test-ca.pem"),
      keyPath = join(productionDir, "test-key.pem");
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "1",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-config",
        join(productionDir, "tls.cnf"),
      ],
      { stdio: "ignore" },
    );
    const key = await readFile(keyPath),
      cert = await readFile(certPath);
    for (const [port, targetPort] of [
      [3443, 3100],
      [9443, 9000],
    ]) {
      const gateway = createServer({ key, cert }, (req, res) => {
        const upstream = proxyRequest(
          {
            hostname: "127.0.0.1",
            port: targetPort,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, "x-forwarded-proto": "https" },
          },
          (response) => {
            res.writeHead(response.statusCode ?? 502, response.headers);
            response.pipe(res);
          },
        );
        upstream.on("error", () => {
          res.writeHead(502);
          res.end();
        });
        req.pipe(upstream);
      });
      await new Promise<void>((resolve, reject) => {
        gateway.once("error", reject);
        gateway.listen(port, "127.0.0.1", resolve);
      });
      gateways.push(gateway);
    }
    child = spawn(process.execPath, ["server.js"], {
      cwd: productionDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        APP_URL: "https://127.0.0.1:3443",
        OBJECT_STORAGE_ENDPOINT: "https://127.0.0.1:9443",
        NODE_EXTRA_CA_CERTS: certPath,
        PORT: "3100",
        HOSTNAME: "127.0.0.1",
      },
      detached: true,
    });
  } else {
    child = spawn("pnpm", ["dev", "--port", "3100"], {
      stdio: "inherit",
      env: process.env,
      detached: true,
    });
  }
  child.on("error", () => void finish(1));
  child.on("exit", (code, signal) => void finish(signal ? 0 : (code ?? 1)));
} catch {
  await finish(1);
}
