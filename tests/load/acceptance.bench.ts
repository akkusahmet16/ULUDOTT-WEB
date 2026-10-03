import { it, expect } from "vitest";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { googleProtocol } from "../helpers/google-protocol";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { ulujamFields as f } from "../../src/modules/applications/domain/ulujam-input";
import {
  createDraftForm,
  saveDraftForm,
  publishForm,
} from "../../src/modules/forms/application/form-service";
import { publicSubmit } from "../../src/modules/forms/application/public-http";
import { issueCsrf, CSRF_COOKIE } from "../../src/lib/auth/csrf";
import { handleSubmissions } from "../../src/modules/forms/application/submission-http";
import { createSession, SESSION_COOKIE } from "../../src/lib/auth/session";
import { withTransaction } from "../../src/lib/database/transaction";
import { approveSolo } from "../../src/modules/teams/application/approval-service";
import { requestGooglePass } from "../../src/modules/wallet/application/google-service";
import { processBatch } from "../../src/worker/handlers";
const execute = promisify(execFile);
it("isolated k6 correctness and recovery acceptance", async () => {
  const realFetch = globalThis.fetch;
  const x = await ulujamFixture(),
    p = await googleProtocol();
  const secret = randomUUID(),
    counts = { accepted: 0, limited: 0, raceAccepted: 0, raceConflict: 0 };
  const oldOrigin = process.env.APP_URL;
  process.env.APP_URL = "http://127.0.0.1:3000";
  const teams: NonNullable<Awaited<ReturnType<typeof submitUlujam>>["team"]>[] =
    [];
  let server: ReturnType<typeof createServer> | undefined;
  const queueObservations: {
    phase: number;
    pending: number;
    elapsedMs: number;
  }[] = [];
  try {
    await x.sql`update forms set capacity=500,settings=jsonb_set(settings,'{capacity}','500') where id=${x.form.id}`;
    for (let n = 0; n < 12; n++) {
      const r = await submitUlujam(
        x.input("new", undefined, { [f.teamName]: "DEMO race " + n }),
        randomUUID(),
      );
      teams.push(r.team!);
    }
    const genericEvent = randomUUID();
    await x.sql`insert into events(id,title,slug,kind,status) values(${genericEvent},'DEMO generic',${"demo-" + genericEvent},'general','draft')`;
    const genericActor = {
      ...x.actor,
      eventScopes: [...x.actor.eventScopes, genericEvent],
    };
    const form = await createDraftForm(genericActor, genericEvent, {
      title: "DEMO load form",
      slug: "load-" + randomUUID(),
      opensAt: "2020-01-01T00:00:00Z",
      closesAt: null,
      capacity: 500,
      waitlist: false,
      duplicatePolicy: "allow",
      thankYou: "DEMO",
      retentionDays: 1,
    });
    const field = randomUUID();
    await saveDraftForm(
      genericActor,
      form.id,
      {
        fields: [
          { id: field, type: "short_text", label: "DEMO", required: true },
        ],
      },
      1,
    );
    await publishForm(genericActor, form.id, 2);
    const [published] =
      await x.sql`select slug,current_version_id from forms where id=${form.id}`;
    await x.sql`insert into admin_roles(admin_id,role) values(${x.actor.adminId},'event_manager')`;
    await x.sql`insert into admin_event_scopes(admin_id,event_id) values(${x.actor.adminId},${x.eventId}),(${x.actor.adminId},${genericEvent})`;
    const session = await withTransaction((tx) =>
      createSession(tx, x.actor.adminId),
    );
    for (let n = 0; n < 16; n++) {
      const r = await submitUlujam(x.input(), randomUUID());
      const [a] =
        await x.sql`select id from applications where submission_id=${r.id}`;
      await approveSolo(x.actor, a.id, 1);
      p.setFailure(503);
      await requestGooglePass(r.card!.token).catch(() => {});
    }
    p.setFailure(503);
    const pending = new Map<
      number,
      { resolve: (r: { status: number }) => void; id: number }[]
    >();
    server = createServer(async (req, res) => {
      if (req.headers.authorization !== "Bearer " + secret) {
        res.writeHead(403).end();
        return;
      }
      const url = new URL(req.url!, "http://127.0.0.1");
      try {
        let status = 200;
        if (url.pathname === "/public") {
          const result = await realFetch(
            process.env.LOAD_PUBLIC_URL || "http://127.0.0.1:3100/",
          );
          const text = await result.text();
          const imagePath = text.match(/src="(\/media\/[^"?]+)"/)?.[1];
          const image = imagePath
            ? await realFetch("http://127.0.0.1:3100" + imagePath)
            : null;
          status =
            result.status === 200 &&
            text.includes("DEMO yük etkinliği") &&
            image?.status === 200
              ? 200
              : 500;
          if (image) await image.arrayBuffer();
        } else if (url.pathname === "/form") {
          const csrf = issueCsrf();
          const result = await publicSubmit(
            new Request(
              process.env.APP_URL + "/api/forms/" + published.slug + "/submit",
              {
                method: "POST",
                headers: {
                  origin: process.env.APP_URL!,
                  "x-csrf-token": csrf,
                  cookie: CSRF_COOKIE + "=" + csrf,
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  versionId: published.current_version_id,
                  idempotencyKey: randomUUID(),
                  answers: { [field]: "DEMO " + url.searchParams.get("id") },
                }),
              },
            ),
            published.slug,
          );
          status = result.status;
          if (status !== 201 && status !== 429)
            throw Error("LOAD_FORM_REJECTED_" + status);
          if (status === 201) counts.accepted++;
          if (status === 429) counts.limited++;
        } else if (url.pathname === "/admin") {
          const result = await handleSubmissions(
            new Request(
              process.env.APP_URL + "/api/admin/submissions?formId=" + form.id,
              { headers: { cookie: SESSION_COOKIE + "=" + session.token } },
            ),
          );
          status = result.status;
        } else if (url.pathname === "/race") {
          const id = Number(url.searchParams.get("id")),
            round = Math.floor(id / 2);
          const result = await new Promise<{ status: number }>((resolve) => {
            const pair = pending.get(round) || [];
            pair.push({ resolve, id });
            pending.set(round, pair);
            if (pair.length === 2) {
              pending.delete(round);
              for (const job of pair) {
                const input = {
                  ...x.input("existing"),
                  teamId: teams[round].id,
                  password: teams[round].password,
                };
                void submitUlujam(input, randomUUID()).then(
                  () => {
                    counts.raceAccepted++;
                    job.resolve({ status: 201 });
                  },
                  (e) => {
                    if (e.status === 409) counts.raceConflict++;
                    job.resolve({ status: e.status || 500 });
                  },
                );
              }
            }
          });
          status = result.status;
        } else if (url.pathname === "/queue") {
          const phase = Number(url.searchParams.get("id"));
          p.setFailure(phase < 2 ? 503 : null);
          await x.sql`update outbox set available_at=now() where status='pending'`;
          const start = performance.now();
          await processBatch("load-recovery", 50);
          const [remaining] =
            await x.sql`select count(*)::int n from outbox where status in ('pending','processing','dead')`;
          queueObservations.push({
            phase,
            pending: remaining.n,
            elapsedMs: performance.now() - start,
          });
        } else status = 404;
        res
          .writeHead(status, { "content-type": "application/json" })
          .end(JSON.stringify({ ok: status < 400 }));
      } catch (error) {
        console.error(
          "LOAD_BROKER_ERROR",
          error instanceof Error ? error.message : "UNKNOWN",
        );
        res.writeHead(500).end("{}");
      }
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    );
    const addr = server.address() as { port: number };
    await mkdir(".local/task28-load", { recursive: true });
    for (const name of ["public", "forms", "team-race", "wallet-queue"]) {
      const result = await execute(
        "k6",
        ["run", "--quiet", "tests/load/" + name + ".js"],
        {
          env: {
            ...process.env,
            LOAD_BASE: "http://127.0.0.1:" + addr.port,
            LOAD_SECRET: secret,
            LOAD_RESULT: ".local/task28-load/" + name + ".json",
          },
          maxBuffer: 1024 * 1024,
        },
      );
      await writeFile(
        ".local/task28-load/" + name + ".log",
        result.stdout + result.stderr,
      );
      expect(
        JSON.parse(
          await readFile(".local/task28-load/" + name + ".json", "utf8"),
        ).metrics.checks.values.rate,
      ).toBe(1);
    }
    const [rows] =
      await x.sql`select count(*)::int n from submissions where form_id=${form.id}`;
    expect(rows.n).toBe(counts.accepted);
    expect(counts.accepted + counts.limited).toBe(140);
    expect(counts.raceAccepted).toBe(12);
    expect(counts.raceConflict).toBe(12);
    const over =
      await x.sql`select team_id from memberships where left_at is null group by team_id having count(*)>2`;
    expect(over).toHaveLength(0);
    const [passes] =
      await x.sql`select count(*)::int n from wallet_passes where provider_state='active' and synced_revision=revision`;
    expect(passes.n).toBe(16);
    const [queue] =
      await x.sql`select count(*)::int n from outbox where status in ('pending','processing','dead')`;
    expect(queue.n).toBe(0);
    expect(queueObservations[1].pending).toBeGreaterThan(0);
    expect(queueObservations.some((item) => item.phase >= 2 && item.pending === 0)).toBe(true);
    await writeFile(
      ".local/task28-load/invariants.json",
      JSON.stringify(
        {
          ...counts,
          queueObservations,
          persisted: rows.n,
          activePasses: passes.n,
          unfinishedQueue: queue.n,
          overfullTeams: over.length,
        },
        null,
        2,
      ),
    );
  } finally {
    if (server)
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    await p.cleanup();
    await x.cleanup();
    process.env.APP_URL = oldOrigin;
  }
}, 240000);
