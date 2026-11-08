import "server-only";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { communityMembers } from "../../../db/schema/community.ts";
import sksMembersSnapshot from "../../../db/seeds/sks-members-snapshot.json" with { type: "json" };

export interface SksMemberRecord {
  fullName: string;
  normalizedName: string;
  facultyDepartment: string;
  email: string;
  registrationDate: string;
}

export interface SyncSksResult {
  totalParsed: number;
  insertedOrUpdated: number;
  source: "live" | "snapshot";
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function normalizeMemberName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchSksRoster(
  username = process.env.BUU_SKS_USERNAME ?? "062590004",
  password = process.env.BUU_SKS_PASSWORD ?? "062590004Aa!",
  periodId = process.env.BUU_SKS_PERIOD_ID ?? "1245",
): Promise<SksMemberRecord[]> {
  const cookieJar = new Map<string, string>();

  function updateCookies(res: Response) {
    const raw = res.headers.getSetCookie();
    for (const c of raw) {
      const parts = c.split(";")[0].split("=");
      cookieJar.set(parts[0].trim(), parts.slice(1).join("=").trim());
    }
  }

  function getCookieHeader(): string {
    return Array.from(cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  const userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const initialRes = await fetch("https://topluluk-etkinlik.uludag.edu.tr/", {
    headers: { "User-Agent": userAgent },
  });
  updateCookies(initialRes);
  const initialHtml = await initialRes.text();
  const tokenMatch = initialHtml.match(
    /name="__RequestVerificationToken" type="hidden" value="([^"]+)"/,
  );
  if (!tokenMatch) {
    throw new Error("SKS_ANTIFORGERY_TOKEN_NOT_FOUND");
  }

  const token = tokenMatch[1];
  const loginBody = new URLSearchParams({
    returnUrl: "",
    UserName: username,
    Password: password,
    __RequestVerificationToken: token,
  });

  const loginRes = await fetch(
    "https://topluluk-etkinlik.uludag.edu.tr/Account/Login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent,
        Cookie: getCookieHeader(),
        Referer: "https://topluluk-etkinlik.uludag.edu.tr/",
      },
      body: loginBody.toString(),
      redirect: "manual",
    },
  );
  updateCookies(loginRes);

  if (loginRes.status !== 302 && loginRes.status !== 200) {
    throw new Error("SKS_LOGIN_FAILED_HTTP_" + loginRes.status);
  }

  const uyelerRes = await fetch(
    `https://topluluk-etkinlik.uludag.edu.tr/Ogrenci/Uyeler?toplulukDonemId=${periodId}`,
    {
      headers: {
        "User-Agent": userAgent,
        Cookie: getCookieHeader(),
        Referer: "https://topluluk-etkinlik.uludag.edu.tr/Ogrenci/Index",
      },
    },
  );

  if (!uyelerRes.ok) {
    throw new Error("SKS_UYELER_FAILED_HTTP_" + uyelerRes.status);
  }

  const uyelerHtml = await uyelerRes.text();
  const table =
    uyelerHtml.match(/<table[^>]*id="myTable"[^>]*>([\s\S]*?)<\/table>/i)?.[1] ||
    "";
  const tbody = table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || table;
  const rows = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  const parsedMembers: SksMemberRecord[] = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (m) => decodeEntities(m[1].replace(/<[^>]+>/g, "").trim()),
    );
    // Cells: [0: Aday, 1: Adı Soyadı, 2: Fakülte/Bölüm, 3: Email, 4: Kayıt Tarihi]
    if (cells.length >= 5 && cells[1] && cells[3]) {
      const email = cells[3].toLowerCase().trim();
      const fullName = cells[1].trim();
      if (email.includes("@")) {
        parsedMembers.push({
          fullName,
          normalizedName: normalizeMemberName(fullName),
          facultyDepartment: cells[2] || "",
          email,
          registrationDate: cells[4] || "",
        });
      }
    }
  }

  return parsedMembers;
}

export async function syncSksMembers(
  username?: string,
  password?: string,
  periodId?: string,
): Promise<SyncSksResult> {
  let members: SksMemberRecord[] = [];
  let source: "live" | "snapshot" = "live";

  try {
    members = await fetchSksRoster(username, password, periodId);
  } catch (error) {
    console.warn(
      "Canlı SKS bağlantısı sağlanamadı (VDS ağ kısıtı / sunucu koruması), yerel onaylı üye verisi yedeği (snapshot) kullanılıyor:",
      error instanceof Error ? error.message : error,
    );
    members = sksMembersSnapshot as SksMemberRecord[];
    source = "snapshot";
  }

  if (members.length === 0) {
    members = sksMembersSnapshot as SksMemberRecord[];
    source = "snapshot";
  }

  if (members.length === 0) {
    return { totalParsed: 0, insertedOrUpdated: 0, source };
  }

  let count = 0;
  await withTransaction(async (tx) => {
    for (const m of members) {
      await tx
        .insert(communityMembers)
        .values({
          fullName: m.fullName,
          normalizedName: m.normalizedName,
          email: m.email,
          facultyDepartment: m.facultyDepartment,
          registrationDate: m.registrationDate,
          period: "2026 - 2027",
          role: "member",
          status: "active",
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: communityMembers.email,
          set: {
            fullName: m.fullName,
            normalizedName: m.normalizedName,
            facultyDepartment: m.facultyDepartment,
            registrationDate: m.registrationDate,
            status: "active",
            lastSyncedAt: new Date(),
          },
        });
      count++;
    }
  });

  return { totalParsed: members.length, insertedOrUpdated: count, source };
}
