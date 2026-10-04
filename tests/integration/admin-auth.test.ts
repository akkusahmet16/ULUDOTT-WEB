import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { TOTP } from "otpauth";
import {
  encryptMfaSecret,
  tokenHash,
  normalizeRecovery,
  newRecoveryCodes,
} from "../../src/lib/auth/crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { authenticateAdmin } from "../../src/modules/admin/application/auth-service";
import { setPanelPassword } from "../../src/modules/admin/application/panel-password";
import { requirePermission } from "../../src/modules/admin/domain/permissions";
import {
  resolveSession,
  renewSession,
  revokeSession,
} from "../../src/lib/auth/session";
import { issueCsrf, verifyCsrf } from "../../src/lib/auth/csrf";

// Yakalanan hatalar: parola/MFA bypass, sayaç rollback'i, replay, eski session kabulü,
// rolün tüm etkinliklere yayılması, CSRF'siz mutasyon ve yanıtta secret nesnesi sızıntısı.
let local: Awaited<ReturnType<typeof createTestDatabase>>;
let original: string | undefined;
beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
});
afterAll(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});
const password = "Test-only-long-password-42";
const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
const otp = () => new TOTP({ secret }).generate();
async function admin() {
  const id = randomUUID(),
    email = `${id}@test.invalid`;
  const passwordHash = await hash(password, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  await local.sql`insert into admins(id,email,password_hash,mfa_secret_encrypted) values(${id},${email},${passwordHash},${encryptMfaSecret(secret, id)})`;
  return { id, email };
}

describe("yönetici kimliği", () => {
  it("yanlış parola ve bilinmeyen hesap aynı genel hata ile reddedilir", async () => {
    const a = await admin();
    await expect(authenticateAdmin(a.email, "wrong", otp())).rejects.toThrow(
      "Giriş bilgileri doğrulanamadı",
    );
    await expect(
      authenticateAdmin("unknown@test.invalid", "wrong", otp()),
    ).rejects.toThrow("Giriş bilgileri doğrulanamadı");
  });
  it("parola doğru olsa bile MFA olmadan oturum vermez", async () => {
    const a = await admin();
    await expect(authenticateAdmin(a.email, password, "")).rejects.toThrow(
      "Giriş bilgileri doğrulanamadı",
    );
  });
  it("beş yanlış giriş kilitlenir ve doğru parola kilidi aşamaz", async () => {
    const a = await admin();
    for (let i = 0; i < 5; i++)
      await expect(authenticateAdmin(a.email, "wrong", otp())).rejects.toThrow(
        "Giriş bilgileri doğrulanamadı",
      );
    await expect(authenticateAdmin(a.email, password, otp())).rejects.toThrow(
      "Giriş bilgileri doğrulanamadı",
    );
    const [r] =
      await local.sql`select failed_attempts,locked_until from admins where id=${a.id}`;
    expect(r.failed_attempts).toBe(5);
    expect(r.locked_until.getTime()).toBeGreaterThan(Date.now());
  });
  it("sistem yöneticisi başvuruları otomatik okuyamaz, etkinlik yöneticisi kapsam dışını göremez", () => {
    const id = randomUUID(),
      scope = randomUUID();
    expect(() =>
      requirePermission(
        { adminId: id, roles: ["system_admin"], eventScopes: [] },
        "applications.read",
        scope,
      ),
    ).toThrow("Yetki yok");
    expect(() =>
      requirePermission(
        { adminId: id, roles: ["event_manager"], eventScopes: [scope] },
        "applications.read",
        randomUUID(),
      ),
    ).toThrow("Yetki yok");
    expect(() =>
      requirePermission(
        { adminId: id, roles: ["event_manager"], eventScopes: [scope] },
        "applications.read",
        scope,
      ),
    ).not.toThrow();
    expect(() =>
      requirePermission(
        { adminId: id, roles: ["content_editor"], eventScopes: [] },
        "content.write",
      ),
    ).not.toThrow();
  });
  it("eksik etkinlik veya bilinmeyen izin fail-closed olur", () => {
    const actor = {
      adminId: randomUUID(),
      roles: ["event_manager", "system_admin"],
      eventScopes: [randomUUID()],
    };
    expect(() => requirePermission(actor, "applications.read")).toThrow(
      "Yetki yok",
    );
    expect(() => requirePermission(actor, "unknown.permission")).toThrow(
      "Yetki yok",
    );
  });
  it("Origin ve CSRF eşleşmesini zorunlu tutar", () => {
    const origin = new URL(process.env.APP_URL!).origin;
    const token = issueCsrf();
    const request = (o: string, t: string) =>
      new Request(`${origin}/api/admin/login`, {
        method: "POST",
        headers: {
          Origin: o,
          "x-csrf-token": t,
          Cookie: `__Host-uludott_csrf=${token}`,
        },
      });
    expect(() => verifyCsrf(request(origin, token))).not.toThrow();
    expect(() => verifyCsrf(request("https://evil.invalid", token))).toThrow(
      "CSRF",
    );
    expect(() => verifyCsrf(request(origin, "fake"))).toThrow("CSRF");
    expect(() =>
      verifyCsrf(new Request(`${origin}/api/admin/login`, { method: "POST" })),
    ).toThrow("CSRF");
  });
  it("iptal ve bulunmayan oturum null döndürür", async () => {
    await expect(resolveSession("unknown")).resolves.toBeNull();
    await revokeSession(randomUUID());
  });
  it("yenileme geçersiz token ile session oluşturmaz", async () => {
    await expect(renewSession("unknown")).rejects.toThrow("Oturum geçersiz");
  });
});

describe("MFA ve oturum yaşam döngüsü", () => {
  it("Argon2id ve şifreli MFA ile girişte yalnızca hash saklar", async () => {
    const a = await admin();
    const s = await authenticateAdmin(a.email, password, otp());
    expect(s.actor.adminId).toBe(a.id);
    expect(await resolveSession(s.token)).toMatchObject({ id: s.id });
    const [u] =
      await local.sql`select password_hash,mfa_secret_encrypted from admins where id=${a.id}`;
    expect(u.password_hash).toMatch(/^\$argon2id\$/);
    expect(u.mfa_secret_encrypted).not.toContain(secret);
    const [r] =
      await local.sql`select token_hash from admin_sessions where id=${s.id}`;
    expect(r.token_hash).toBe(tokenHash(s.token));
    expect(r.token_hash).not.toBe(s.token);
  });
  it("aynı TOTP iki eşzamanlı girişte yalnızca bir defa kullanılabilir", async () => {
    const a = await admin(),
      code = otp();
    const results = await Promise.allSettled([
      authenticateAdmin(a.email, password, code),
      authenticateAdmin(a.email, password, code),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });
  it("kurtarma kodunu tek kullanımlık hash ile tüketir", async () => {
    const a = await admin(),
      code = newRecoveryCodes()[0];
    await local.sql`update admins set recovery_code_hashes=${local.sql.json([tokenHash(normalizeRecovery(code))])} where id=${a.id}`;
    const s = await authenticateAdmin(a.email, password, code);
    expect(await resolveSession(s.token)).not.toBeNull();
    await expect(authenticateAdmin(a.email, password, code)).rejects.toThrow(
      "Giriş bilgileri doğrulanamadı",
    );
    expect(
      (
        await local.sql`select recovery_code_hashes from admins where id=${a.id}`
      )[0].recovery_code_hashes,
    ).toEqual([]);
  });
  it("yenilemede eski token iptal olur, mutlak süre uzamaz ve logout yeni tokenı da kapatır", async () => {
    const a = await admin(),
      s = await authenticateAdmin(a.email, password, otp());
    const n = await renewSession(s.token);
    expect(n.token).not.toBe(s.token);
    expect(n.absoluteExpiresAt.getTime()).toBe(s.absoluteExpiresAt.getTime());
    expect(await resolveSession(s.token)).toBeNull();
    expect(await resolveSession(n.token)).not.toBeNull();
    await revokeSession(n.id);
    expect(await resolveSession(n.token)).toBeNull();
  });
  it("süresi dolmuş veya devre dışı yönetici oturumu kabul edilmez", async () => {
    const a = await admin(),
      s = await authenticateAdmin(a.email, password, otp());
    await local.sql`update admin_sessions set created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' where id=${s.id}`;
    expect(await resolveSession(s.token)).toBeNull();
    await expect(renewSession(s.token)).rejects.toThrow("Oturum geçersiz");
    const b = await admin(),
      t = await authenticateAdmin(b.email, password, otp());
    await local.sql`update admins set disabled_at=now() where id=${b.id}`;
    expect(await resolveSession(t.token)).toBeNull();
  });
  it("oturumdaki rol kapsamını her istekte DB'den yeniden okur", async () => {
    const a = await admin(),
      e = randomUUID();
    await local.sql`insert into events(id,title,slug,kind) values (${e},'Scope',${e},'general')`;
    await local.sql`insert into admin_roles(admin_id,role) values (${a.id},'event_manager')`;
    await local.sql`insert into admin_event_scopes(admin_id,event_id) values (${a.id},${e})`;
    const s = await authenticateAdmin(a.email, password, otp());
    expect(s.actor.eventScopes).toEqual([e]);
    await local.sql`delete from admin_event_scopes where admin_id=${a.id}`;
    expect((await resolveSession(s.token))?.actor.eventScopes).toEqual([]);
  });
  it("bir oturuma ait CSRF başka oturumda veya imzası bozukken geçmez", () => {
    const origin = new URL(process.env.APP_URL!).origin,
      session = "first",
      token = issueCsrf(session);
    const request = (s: string, t = token) =>
      new Request(`${origin}/api/admin/logout`, {
        method: "POST",
        headers: {
          Origin: origin,
          "x-csrf-token": t,
          Cookie: `__Host-uludott_csrf=${t}; __Host-uludott_admin=${s}`,
        },
      });
    expect(() => verifyCsrf(request(session))).not.toThrow();
    expect(() => verifyCsrf(request("other"))).toThrow("CSRF");
    expect(() =>
      verifyCsrf(request(session, token.slice(0, -1) + "X")),
    ).toThrow("CSRF");
  });
});

it("CLI kurulumu MFA doğrulanmadan admin oluşturmaz ve kurtarma kodlarını yalnızca hash saklar", async () => {
  const { bootstrapAdmin } =
    await import("../../src/modules/admin/application/bootstrap-admin");
  const email = `${randomUUID()}@test.invalid`;
  await expect(
    bootstrapAdmin({
      email,
      password,
      secret,
      code: "bad",
      roles: ["system_admin"],
      eventScopes: [],
    }),
  ).rejects.toThrow("MFA doğrulanamadı");
  expect(
    (
      await local.sql`select count(*)::int as count from admins where email=${email}`
    )[0].count,
  ).toBe(0);
  const a = await bootstrapAdmin({
    email,
    password,
    secret,
    code: otp(),
    roles: ["system_admin"],
    eventScopes: [],
  });
  expect(a.recoveryCodes).toHaveLength(8);
  const [r] =
    await local.sql`select recovery_code_hashes,mfa_secret_encrypted from admins where id=${a.id}`;
  expect(r.recovery_code_hashes).toHaveLength(8);
  expect(JSON.stringify(r)).not.toContain(a.recoveryCodes[0]);
  expect(r.mfa_secret_encrypted).not.toContain(secret);
});

it("nesne prototipi isimleri bilinmeyen izin olarak reddedilir", () => {
  const actor = {
    adminId: randomUUID(),
    roles: ["system_admin"],
    eventScopes: [],
  };
  for (const permission of ["__proto__", "constructor", "toString"])
    expect(() => requirePermission(actor, permission)).toThrow("Yetki yok");
});
it("kilit süresi dolunca doğru MFA ile giriş sayaçları sıfırlanır", async () => {
  const a = await admin();
  await local.sql`update admins set failed_attempts=5,locked_until=now()-interval '1 second' where id=${a.id}`;
  await authenticateAdmin(a.email, password, otp());
  const [r] =
    await local.sql`select failed_attempts,locked_until from admins where id=${a.id}`;
  expect(r.failed_attempts).toBe(0);
  expect(r.locked_until).toBeNull();
});
it("HTTP hata gövdeleri sır içermez ve boyut/type sınırı uygulanır", async () => {
  const { handleAdminRequest } =
    await import("../../src/modules/admin/application/http");
  const origin = new URL(process.env.APP_URL!).origin;
  const csrf = issueCsrf();
  const request = (body: string, type = "application/json") =>
    new Request(`${origin}/api/admin/login`, {
      method: "POST",
      headers: {
        Origin: origin,
        "x-csrf-token": csrf,
        Cookie: `__Host-uludott_csrf=${csrf}`,
        "content-type": type,
      },
      body,
    });
  for (const r of [
    request("{"),
    request("x".repeat(5000)),
    request("{}", "text/plain"),
  ])
    expect((await handleAdminRequest("login", r)).status).toBe(400);
  await setPanelPassword(password);
  const r = await handleAdminRequest(
    "login",
    request(JSON.stringify({ password: "wrong" })),
  );
  expect(r.status).toBe(401);
  expect(await r.json()).toEqual({ error: "Giriş bilgileri doğrulanamadı" });
});
it("HTTP başarılı giriş/oturum yanıtı parola, MFA, kurtarma kodu veya token içermez", async () => {
  const { handleAdminRequest } =
    await import("../../src/modules/admin/application/http");
  const origin = new URL(process.env.APP_URL!).origin,
    csrf = issueCsrf();
  await setPanelPassword(password);
  const r = await handleAdminRequest(
    "login",
    new Request(`${origin}/api/admin/login`, {
      method: "POST",
      headers: {
        Origin: origin,
        "x-csrf-token": csrf,
        Cookie: `__Host-uludott_csrf=${csrf}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ password }),
    }),
  );
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ ok: true });
  const cookie = r.cookies.get("__Host-uludott_admin")!;
  expect(cookie).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  const session = await handleAdminRequest(
    "session",
    new Request(`${origin}/api/admin/session`, {
      headers: { Cookie: `${cookie.name}=${cookie.value}` },
    }),
  );
  expect(session.status).toBe(200);
  const text = await session.text();
  expect(text).not.toContain(cookie.value);
  expect(text).not.toContain(password);
  expect(text).not.toContain(secret);
  expect(text).not.toMatch(/passwordHash|mfaSecret|recoveryCode|tokenHash/);
});
it("paylaşılan PostgreSQL giriş sayacı 120 denemeden sonrasını reddeder", async () => {
  const { loginRateAllowed } =
    await import("../../src/modules/admin/infrastructure/admin-repository");
  const { withTransaction } =
    await import("../../src/lib/database/transaction");
  const start = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  await local.sql`insert into rate_limits(scope,key_hash,window_starts_at,count,expires_at) values('admin_login_global','global',${start},120,${new Date(start.getTime() + 120_000)}) on conflict(scope,key_hash,window_starts_at) do update set count=120`;
  expect(await withTransaction(loginRateAllowed)).toBe(false);
});

it("sunucu config kontrolü eksik AUTH anahtarını değer sızdırmadan reddeder", async () => {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(
    process.execPath,
    ["--conditions=react-server", "scripts/check-config.ts"],
    { env: { ...process.env, AUTH_ENCRYPTION_KEY: "" }, encoding: "utf8" },
  );
  expect(r.status).toBe(1);
  expect(r.stderr).toContain("AUTH_ENCRYPTION_KEY");
  expect(r.stderr).not.toContain(process.env.DATABASE_URL!);
});
