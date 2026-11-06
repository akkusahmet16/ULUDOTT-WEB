import { waitForVisualFonts } from "./visual-fonts.ts";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import type { Sql } from "postgres";
import { randomUUID } from "node:crypto";
import { sql as drizzleSql } from "drizzle-orm";
import { getDatabase } from "../../src/lib/database/client.ts";
import { tokenHash } from "../../src/lib/auth/crypto.ts";
import {
  submitUlujam,
  type UlujamReceipt,
} from "../../src/modules/applications/application/submit-ulujam.ts";
import { ulujamFields as fields } from "../../src/modules/applications/domain/ulujam-input.ts";
import {
  approveRoster,
  rejectTeam,
} from "../../src/modules/teams/application/approval-service.ts";
import {
  loginTeam,
  TEAM_COOKIE,
} from "../../src/modules/teams/application/team-access.ts";
import {
  getGameEditor,
  saveGameDraft,
} from "../../src/modules/games/application/game-service.ts";
import { approvePublicationName } from "../../src/modules/games/application/credit-consent-service.ts";
import { VISUAL_FIXED_TIME } from "./visual-fixture.ts";
import { installFixedDate } from "./visual-clock-script.mjs";
import { captureVisualPng } from "./visual-capture.ts";
import { VISUAL_DEVICE_SCALE_FACTOR } from "./visual-runtime.ts";

type PrivateState =
  | "form-team-success"
  | "card-pending"
  | "card-active"
  | "card-revoked"
  | "team-login"
  | "team-login-error"
  | "team-authenticated"
  | "receipt"
  | "consent-pending"
  | "consent-approved"
  | "consent-closed";

export type PrivateVisualScene = {
  alias: PrivateState;
  /** Capability-bearing data: keep this object in memory; never serialize it. */
  path: string;
  session?: string;
  receipt?: UlujamReceipt;
};

export type PreparedPrivateVisualScenes = {
  scenes: PrivateVisualScene[];
  baseURL?: string;
};

function invariant(value: unknown, code: string): asserts value {
  if (!value) throw Error(code);
}

/**
 * Add private fixtures only after the public/admin baseline captures, or use a
 * separate owned full-profile database. Real services generate capabilities;
 * they must never enter the committed fixture descriptor or a disk artifact.
 */
export async function preparePrivateVisualScenes(
  sql: Sql,
): Promise<PreparedPrivateVisualScenes> {
  try {
    const [identity] = await sql`select current_database() as name`;
    const configured = await getDatabase().execute(
      drizzleSql`select current_database() as name`,
    );
    invariant(
      /^uludott_test_[0-9a-f]{32}$/.test(String(identity.name)) &&
        configured[0]?.name === identity.name &&
        sql.options.host.length > 0 &&
        sql.options.host.every((host) =>
          ["127.0.0.1", "localhost"].includes(host),
        ),
      "OWNED_DATABASE_REQUIRED",
    );
    const [form] =
      await sql`select f.current_version_id,f.event_id,a.id as admin_id
      from forms f cross join admins a
      where f.slug='visual-ulujam' and a.id='0c000000-0000-4000-8000-000000000001'`;
    invariant(
      form?.current_version_id && form.event_id,
      "FULL_FIXTURE_REQUIRED",
    );
    const actor = {
      adminId: String(form.admin_id),
      roles: ["event_manager"],
      eventScopes: [String(form.event_id)],
    };
    const submit = (state: "pending" | "active" | "revoked") =>
      submitUlujam(
        {
          slug: "visual-ulujam",
          versionId: String(form.current_version_id),
          answers: {
            [fields.fullName]:
              state === "pending" ? "DEMO bekleyen kişi" : "DEMO kart sahibi",
            [fields.email]: `visual-private-${state}@test.invalid`,
            [fields.phone]: "+905551234567",
            [fields.mode]: state === "pending" ? "solo" : "new",
            [fields.skills]: ["software"],
            [fields.levels.software]: 3,
            ...(state === "pending"
              ? {}
              : {
                  [fields.teamName]:
                    state === "active"
                      ? "DEMO özel görsel takımı"
                      : "DEMO iptal takımı",
                  [fields.expectedSize]: 2,
                }),
          },
        },
        randomUUID(),
      );
    const pending = await submit("pending");
    const active = await submit("active");
    const revoked = await submit("revoked");
    invariant(
      pending.card &&
        active.card &&
        revoked.card &&
        active.team &&
        revoked.team,
      "PRIVATE_RECEIPT_REQUIRED",
    );
    for (const receipt of [active, revoked]) {
      const [team] =
        await sql`select roster_revision from teams where id=${receipt.team!.id}`;
      await approveRoster(
        actor,
        receipt.team!.id,
        Number(team.roster_revision),
      );
    }

    const credit = async (
      owner: typeof active,
      suffix: "pending" | "approved" | "closed",
    ) => {
      const [application] =
        await sql`select id from applications where submission_id=${owner.id}`;
      invariant(application && owner.team, "PRIVATE_APPLICATION_REQUIRED");
      const game = await saveGameDraft(actor, String(form.event_id), {
        title: "DEMO özel yayın oyunu",
        slug: `demo-private-visual-${suffix}`,
        description: "DEMO sentetik yayın onayı görünümü.",
        teamId: owner.team.id,
        mediaId: null,
        itchUrl: "https://demo-visual.itch.io/private-scene",
        credits: [
          {
            applicationId: String(application.id),
            publicationName: "DEMO yapımcı adı",
          },
        ],
      });
      const editor = await getGameEditor(actor, game.id);
      const token = editor.credits[0]?.token;
      invariant(token, "PRIVATE_CREDIT_REQUIRED");
      if (suffix !== "pending")
        await approvePublicationName(token, "DEMO yapımcı adı", true);
      return token;
    };
    const pendingCredit = await credit(active, "pending");
    const approvedCredit = await credit(active, "approved");
    const closedCredit = await credit(revoked, "closed");
    const [team] =
      await sql`select roster_revision from teams where id=${revoked.team!.id}`;
    await rejectTeam(
      actor,
      revoked.team!.id,
      "DEMO görsel iptal durumu",
      Number(team.roster_revision),
    );
    invariant(active.team!.password, "PRIVATE_TEAM_PASSWORD_REQUIRED");
    const session = await loginTeam(active.team!.token, active.team!.password);
    // Capture clocks are pinned, while PostgreSQL and the browser cookie store
    // retain real clocks. Extend only this disposable fixture's own records.
    await sql`update team_sessions set expires_at='2035-12-31T09:00:00Z'
      where token_hash=${tokenHash(session.token)} and team_id=${active.team!.id}`;
    for (const receipt of [pending, active, revoked])
      await sql`update submissions set created_at=${VISUAL_FIXED_TIME},expires_at='2035-12-31T09:00:00Z'
        where id=${receipt.id}`;

    return {
      scenes: [
        {
          alias: "form-team-success",
          path: "/basvuru/visual-ulujam",
          receipt: active,
        },
        { alias: "card-pending", path: `/kart/${pending.card!.token}` },
        { alias: "card-active", path: `/kart/${active.card!.token}` },
        { alias: "card-revoked", path: `/kart/${revoked.card!.token}` },
        { alias: "team-login", path: `/takim/${active.team!.token}` },
        { alias: "team-login-error", path: `/takim/${active.team!.token}` },
        {
          alias: "team-authenticated",
          path: `/takim/${active.team!.token}`,
          session: session.token,
        },
        { alias: "receipt", path: `/makbuz#token=${pending.receiptToken}` },
        { alias: "consent-pending", path: `/yayin-onayi/${pendingCredit}` },
        { alias: "consent-approved", path: `/yayin-onayi/${approvedCredit}` },
        { alias: "consent-closed", path: `/yayin-onayi/${closedCredit}` },
      ],
    };
  } catch {
    // Service/driver causes can contain tokens, submitted values or URLs.
    throw Error("PRIVATE_VISUAL_PREPARATION_FAILED");
  }
}

async function waitForState(page: Page, state: PrivateState) {
  if (state === "form-team-success") {
    await page.getByRole("region", { name: "Başvuru makbuzu" }).waitFor();
    await page.getByRole("heading", { name: "Başvuru alındı" }).waitFor();
    await page.getByTestId("new-team-password").waitFor();
  } else if (state.startsWith("card-")) {
    const status =
      state === "card-active"
        ? "Aktif"
        : state === "card-pending"
          ? "Onay bekliyor"
          : "İptal";
    await page.getByText(`Kart durumu: ${status}`, { exact: true }).waitFor();
    const qr = page.getByRole("img", { name: "Etkinlik giriş QR kodu" });
    if (state === "card-active") await qr.waitFor();
    else invariant((await qr.count()) === 0, "UNEXPECTED_PRIVATE_QR");
  } else if (state === "team-authenticated") {
    await page
      .getByRole("heading", { name: "DEMO özel görsel takımı", exact: true })
      .waitFor();
    await page.getByRole("region", { name: "Takım kart özetleri" }).waitFor();
  } else if (state.startsWith("team-login")) {
    await page.getByLabel("Takım parolası", { exact: true }).waitFor();
    if (state === "team-login-error") {
      await page
        .getByLabel("Takım parolası", { exact: true })
        .fill("DEMO-wrong");
      await page.getByRole("button", { name: "Takıma giriş yap" }).click();
      await page.getByText("Takım erişimi geçersiz", { exact: true }).waitFor();
    }
  } else if (state === "receipt") {
    await page.getByText("Durum: Alındı", { exact: true }).waitFor();
    await page
      .getByRole("heading", { name: "DEMO UluJam başvurusu" })
      .waitFor();
  } else {
    await page.getByRole("heading", { name: "Yayın adı tercihiniz" }).waitFor();
    if (state === "consent-closed") {
      await page
        .getByText(
          "Yeni yayın onayı kapalıdır. Mevcut onayınızı aşağıdan geri çekebilirsiniz.",
        )
        .waitFor();
    } else {
      await page
        .getByLabel("Yayımlanacak yapımcı adı", { exact: true })
        .waitFor();
      const checkbox = page.getByRole("checkbox");
      invariant(
        (await checkbox.isChecked()) === (state === "consent-approved"),
        "PRIVATE_CONSENT_STATE_MISMATCH",
      );
    }
    if (state !== "consent-pending")
      await page
        .getByRole("button", { name: "Yayın onayımı geri çek" })
        .waitFor();
  }
}

async function settlePrivatePage(page: Page) {
  await waitForVisualFonts(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    if ([...document.fonts].some((font) => font.status === "error"))
      throw Error("PRIVATE_FONT_FAILED");
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    };
    for (const element of document.querySelectorAll(
      "body, h1, h2, p, input, button",
    )) {
      if (!visible(element)) continue;
      const font = getComputedStyle(element).font;
      if (!font) throw Error("PRIVATE_FONT_SHORTHAND_EMPTY");
      await document.fonts.load(font);
      if (!document.fonts.check(font)) throw Error("PRIVATE_FONT_NOT_LOADED");
    }
    for (const image of document.images)
      if (visible(image)) {
        await image.decode();
        if (!image.naturalWidth) throw Error("PRIVATE_IMAGE_FAILED");
      }
  });
  // Let the page's actual finite entrance/focus transitions finish. Keep normal
  // motion, CSS and rendered content intact; no screenshot-time masks.
  await page.waitForTimeout(1_250);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

/**
 * Return sensitive full-viewport PNGs only in memory. The caller compares the
 * two source versions, retains neutral counts/hashes, then releases buffers.
 * Do not attach results to Playwright, persist them, or enable context tracing.
 */
export async function capturePrivateVisualScenes(
  browser: Browser,
  prepared: PreparedPrivateVisualScenes,
  epoch: number,
): Promise<Map<string, Buffer>> {
  const captures = new Map<string, Buffer>();
  const baseURL = prepared.baseURL ?? "https://127.0.0.1:3443";
  invariant(
    Number.isFinite(epoch) &&
      ["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname),
    "PRIVATE_VISUAL_LOCAL_ORIGIN_REQUIRED",
  );
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 375, height: 812 },
  ]) {
    for (const scene of prepared.scenes) {
      let context: BrowserContext | undefined;
      const alias = `private-${scene.alias}-${viewport.width}x${viewport.height}`;
      let stage = "context";
      try {
        context = await browser.newContext({
          baseURL,
          ignoreHTTPSErrors: true,
          viewport,
          deviceScaleFactor: VISUAL_DEVICE_SCALE_FACTOR,
          locale: "tr-TR",
          timezoneId: "Europe/Istanbul",
          colorScheme: "dark",
          forcedColors: "none",
          reducedMotion: "no-preference",
          isMobile: false,
          hasTouch: false,
        });
        context.setDefaultTimeout(15_000);
        if (scene.session)
          await context.addCookies([
            {
              name: TEAM_COOKIE,
              value: scene.session,
              url: baseURL,
              secure: true,
              httpOnly: true,
              sameSite: "Lax",
            },
          ]);
        const page = await context.newPage();
        await page.addInitScript(installFixedDate, epoch);
        if (scene.receipt) {
          // Replay the same real-service receipt for both UIs. No second write,
          // capability serialization to disk, trace or raw-value assertion.
          await page.route("**/api/ulujam/apply", (route) =>
            route.fulfill({ status: 201, json: scene.receipt }),
          );
        }
        await page.mouse.move(viewport.width - 1, viewport.height - 1);
        stage = "navigation";
        const response = await page.goto(scene.path);
        invariant(response?.status() === 200, "PRIVATE_HTTP_STATE_MISMATCH");
        if (scene.alias === "form-team-success") {
          stage = "fill-form";
          await page
            .getByLabel("Ad soyad *", { exact: true })
            .fill("DEMO kart sahibi");
          await page
            .getByLabel("E-posta *", { exact: true })
            .fill("visual-private-active@test.invalid");
          await page
            .getByLabel("Telefon *", { exact: true })
            .fill("+905551234567");
          await page.getByLabel("Yazılım", { exact: true }).check();
          await page
            .getByLabel("Yazılım seviyesi *", { exact: true })
            .selectOption("3");
          await page
            .getByLabel("Yeni takım kuruyorum", { exact: true })
            .check();
          await page
            .getByLabel("Takım adı *", { exact: true })
            .fill("DEMO özel görsel takımı");
          await page
            .getByLabel("Beklenen toplam kişi sayısı *", { exact: true })
            .fill("2");
          stage = "submit-form";
          await page
            .getByRole("button", { name: "Başvuruyu gönder", exact: true })
            .click();
        }
        stage = "expected-state";
        await waitForState(page, scene.alias);
        stage = "settle";
        await settlePrivatePage(page);
        stage = "screenshot";
        const png = await captureVisualPng(page);
        await page.waitForTimeout(100);
        const repeat = await captureVisualPng(page);
        stage = "stability";
        invariant(png.equals(repeat), "PRIVATE_SCENE_NOT_STABLE");
        captures.set(alias, png);
      } catch (error) {
        captures.clear();
        const safeCode = [
          "PRIVATE_FONT_SHORTHAND_EMPTY",
          "PRIVATE_FONT_FAILED",
          "PRIVATE_FONT_NOT_LOADED",
          "PRIVATE_IMAGE_FAILED",
          "PRIVATE_SCENE_NOT_STABLE",
        ].find(
          (code) => error instanceof Error && error.message.includes(code),
        );
        throw Error(
          `${alias}: PRIVATE_VISUAL_CAPTURE_FAILED (${stage}${safeCode ? ":" + safeCode : ""})`,
        );
      } finally {
        // Never propagate a Playwright close cause containing a private URL.
        await context?.close().catch(() => undefined);
      }
    }
  }
  return captures;
}
