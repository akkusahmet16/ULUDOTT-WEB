import "server-only";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../../lib/database/client.ts";
import {
  communityMembers,
  memberCardGrants,
} from "../../../db/schema/community.ts";
import { randomToken, tokenHash } from "../../../lib/auth/crypto.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { normalizeMemberName, verifyStudentViaSks } from "./sks-sync.ts";

export const memberTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Geçersiz kart anahtarı");

export const verifyMemberInputSchema = z.object({
  fullName: z.string().trim().min(2, "En az 2 karakter giriniz").max(100),
  email: z.string().trim().email("Geçerli bir e-posta giriniz").max(120),
});

export const verifySksLoginInputSchema = z.object({
  studentNumber: z.string().trim().min(4).max(30),
  password: z.string().min(1).max(120),
});

async function issueMemberGrant(memberId: string): Promise<string> {
  const token = randomToken();
  const hash = tokenHash(token);
  const db = getDatabase();

  await db.insert(memberCardGrants).values({
    memberId,
    tokenHash: hash,
    status: "active",
    lastAccessedAt: new Date(),
  });

  return token;
}

export interface CommunityMemberView {
  fullName: string;
  email: string;
  facultyDepartment: string | null;
  registrationDate: string | null;
  period: string;
  status: string;
}

export async function verifyAndGrantMemberCard(input: {
  fullName: string;
  email: string;
}) {
  const parsed = verifyMemberInputSchema.parse(input);
  const normalizedEmail = parsed.email.toLowerCase();
  const normalizedName = normalizeMemberName(parsed.fullName);
  const db = getDatabase();

  const [member] = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.email, normalizedEmail),
        eq(communityMembers.status, "active"),
      ),
    );

  if (!member || member.normalizedName !== normalizedName) {
    return {
      success: false as const,
      error: "MEMBER_NOT_FOUND" as const,
    };
  }

  const token = await issueMemberGrant(member.id);

  return {
    success: true as const,
    grantToken: token,
    member: {
      fullName: member.fullName,
      email: member.email,
      facultyDepartment: member.facultyDepartment,
      registrationDate: member.registrationDate,
      period: member.period,
      status: member.status,
    },
  };
}

export async function getMemberCardByToken(token: string): Promise<{
  grantId: string;
  token: string;
  member: CommunityMemberView;
}> {
  memberTokenSchema.parse(token);
  const hash = tokenHash(token);
  const db = getDatabase();

  const [record] = await db
    .select({
      grantId: memberCardGrants.id,
      grantStatus: memberCardGrants.status,
      fullName: communityMembers.fullName,
      email: communityMembers.email,
      facultyDepartment: communityMembers.facultyDepartment,
      registrationDate: communityMembers.registrationDate,
      period: communityMembers.period,
      memberStatus: communityMembers.status,
    })
    .from(memberCardGrants)
    .innerJoin(
      communityMembers,
      eq(communityMembers.id, memberCardGrants.memberId),
    )
    .where(
      and(
        eq(memberCardGrants.tokenHash, hash),
        eq(memberCardGrants.status, "active"),
        eq(communityMembers.status, "active"),
      ),
    );

  if (!record) {
    throw new SubmissionError(404, "Kart bulunamadı veya geçerliliğini yitirdi");
  }

  await db
    .update(memberCardGrants)
    .set({ lastAccessedAt: new Date() })
    .where(eq(memberCardGrants.id, record.grantId));

  return {
    grantId: record.grantId,
    token,
    member: {
      fullName: record.fullName,
      email: record.email,
      facultyDepartment: record.facultyDepartment,
      registrationDate: record.registrationDate,
      period: record.period,
      status: record.memberStatus,
    },
  };
}

export async function verifyAndGrantMemberCardViaSks(input: {
  studentNumber: string;
  password: string;
}) {
  const parsed = verifySksLoginInputSchema.parse(input);
  const sksResult = await verifyStudentViaSks(
    parsed.studentNumber,
    parsed.password,
  );

  if (sksResult.status !== "VERIFIED") {
    return {
      success: false as const,
      error: sksResult.status,
    };
  }

  const db = getDatabase();
  const normalizedName = normalizeMemberName(sksResult.fullName);
  const normalizedEmail = sksResult.email.toLowerCase();

  const [member] = await db
    .insert(communityMembers)
    .values({
      fullName: sksResult.fullName,
      normalizedName,
      email: normalizedEmail,
      period: "2026 - 2027",
      role: "member",
      status: "active",
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: communityMembers.email,
      set: {
        status: "active",
        lastSyncedAt: new Date(),
      },
    })
    .returning({ id: communityMembers.id });

  const grantToken = await issueMemberGrant(member.id);

  return {
    success: true as const,
    grantToken,
  };
}
