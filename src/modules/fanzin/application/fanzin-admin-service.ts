import "server-only";
import { createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { fanzinIssues, fanzinPages, fanzinArticles } from "../../../db/schema/fanzin.ts";
import { getDatabase } from "../../../lib/database/client.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";

export const fanzinIssueInputSchema = z
  .strictObject({
    id: z.string().min(1).max(64),
    issueNumber: z.number().int().min(1).max(1000),
    title: z.string().trim().min(1, "Lütfen fanzin başlığını girin").max(255),
    slug: z.string().trim().min(1).max(255),
    subtitle: z.string().trim().max(500).optional().nullable(),
    season: z.string().trim().max(32).default("Bahar"),
    year: z.number().int().min(2020).max(2100).default(2026),
    description: z.string().trim().max(3000).default(""),
    pageCount: z.number().int().min(0).max(500).default(0),
    pdfUrl: z.string().trim().default(""),
    pdfFileSize: z.string().trim().max(32).optional().nullable(),
    coverImageUrl: z.string().trim().max(500).optional().nullable(),
    status: z.enum(["draft", "published", "upcoming", "archived"]).default("draft"),
  })
  .superRefine((data, ctx) => {
    if (data.status === "published") {
      if (!data.pdfUrl || data.pdfUrl === "#" || data.pdfUrl.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fanzini yayına almak için geçerli bir PDF dosyası yüklenmelidir",
          path: ["pdfUrl"],
        });
      }
    }
  });

export type FanzinIssueInput = z.infer<typeof fanzinIssueInputSchema>;

export async function listFanzinIssues() {
  return getDatabase()
    .select()
    .from(fanzinIssues)
    .orderBy(desc(fanzinIssues.issueNumber));
}

export async function getFanzinIssue(id: string) {
  const [issue] = await getDatabase()
    .select()
    .from(fanzinIssues)
    .where(eq(fanzinIssues.id, id));

  if (!issue) return null;

  const pages = await getDatabase()
    .select()
    .from(fanzinPages)
    .where(eq(fanzinPages.issueId, id))
    .orderBy(fanzinPages.pageNumber);

  const articles = await getDatabase()
    .select()
    .from(fanzinArticles)
    .where(eq(fanzinArticles.issueId, id))
    .orderBy(fanzinArticles.displayOrder);

  return { issue, pages, articles };
}

function toAuditUuid(rawId: string): string {
  if (z.uuid().safeParse(rawId).success) {
    return rawId;
  }
  const hex = createHash("sha256").update(`fanzin-issue:${rawId}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function upsertFanzinIssue(actor: Actor, input: unknown) {
  const data = fanzinIssueInputSchema.parse(input);

  return withTransaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(fanzinIssues)
      .where(eq(fanzinIssues.id, data.id));

    if (existing) {
      await tx
        .update(fanzinIssues)
        .set({
          ...data,
          publishedAt: data.status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(fanzinIssues.id, data.id));
    } else {
      await tx.insert(fanzinIssues).values({
        ...data,
        publishedAt: data.status === "published" ? new Date() : null,
      });
    }

    const auditStatus =
      data.status === "upcoming"
        ? "scheduled"
        : data.status === "published"
          ? "published"
          : data.status === "archived"
            ? "archived"
            : "draft";

    await appendAudit(
      tx,
      actor,
      "fanzin.issue_saved",
      { type: "fanzin_issue", id: toAuditUuid(data.id) },
      {
        status: auditStatus,
        changedFields: ["title", "status", "media"],
      },
    );

    revalidateTag("public:fanzin", { expire: 0 });
    revalidatePath("/fanzin");
    return data;
  });
}

export async function deleteFanzinIssue(actor: Actor, issueId: string) {
  return withTransaction(async (tx) => {
    await tx.delete(fanzinIssues).where(eq(fanzinIssues.id, issueId));

    await appendAudit(
      tx,
      actor,
      "fanzin.issue_deleted",
      { type: "fanzin_issue", id: toAuditUuid(issueId) },
      {},
    );

    revalidateTag("public:fanzin", { expire: 0 });
    revalidatePath("/fanzin");
  });
}

export async function incrementFanzinDownloadCount(issueId: string) {
  await getDatabase()
    .update(fanzinIssues)
    .set({ downloadCount: sql`${fanzinIssues.downloadCount} + 1` })
    .where(eq(fanzinIssues.id, issueId));
}
