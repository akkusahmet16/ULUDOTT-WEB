import "server-only";
import { createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { fanzinIssues, fanzinPages, fanzinArticles } from "../../../db/schema/fanzin.ts";
import { getDatabase } from "../../../lib/database/client.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import type { FanzinIssue, FanzinPageContent } from "../domain/fanzin-types.ts";

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
  });

export type FanzinIssueInput = z.infer<typeof fanzinIssueInputSchema>;

export async function getPublicFanzinData(): Promise<{
  activeIssue: FanzinIssue | null;
  issues: FanzinIssue[];
}> {
  try {
    const rows = await getDatabase()
      .select()
      .from(fanzinIssues)
      .where(inArray(fanzinIssues.status, ["published", "upcoming"]))
      .orderBy(desc(fanzinIssues.issueNumber));

    const mappedIssues: FanzinIssue[] = await Promise.all(
      rows.map(async (row) => {
        const pages = await getDatabase()
          .select()
          .from(fanzinPages)
          .where(eq(fanzinPages.issueId, row.id))
          .orderBy(fanzinPages.pageNumber);

        const fanzinPagesList: FanzinPageContent[] = pages.map((p) => {
          const rawAsset = p.pageImageAssetId;
          const imageUrl = rawAsset
            ? rawAsset.startsWith("/")
              ? rawAsset
              : `/uploads/fanzin/${rawAsset}`
            : undefined;

          return {
            pageNumber: p.pageNumber,
            imageUrl,
            title: p.title ?? undefined,
            type: (p.pageType === "cover" || p.pageType === "backcover" ? p.pageType : "page") as FanzinPageContent["type"],
          };
        });

        // Sayı 1 için veritabanında sayfa kaydı henüz yoksa veya eksikse diskteki sayfaları bağla
        let finalPages = fanzinPagesList;
        if (finalPages.length < 2 && row.issueNumber === 1) {
          finalPages = [
            { pageNumber: 1, imageUrl: "/uploads/fanzin/pages/page-1.webp", title: "Kapak", type: "cover" },
            { pageNumber: 2, imageUrl: "/uploads/fanzin/pages/page-2.webp", title: "İçerik", type: "page" },
            { pageNumber: 3, imageUrl: "/uploads/fanzin/pages/page-3.webp", title: "Arka Kapak", type: "backcover" },
          ];
        }

        return {
          id: row.id,
          issueNumber: row.issueNumber,
          title: row.title,
          slug: row.slug,
          subtitle: row.subtitle ?? "",
          season: row.season,
          year: row.year,
          description: row.description,
          pageCount: row.pageCount,
          pdfUrl: row.pdfUrl,
          pdfFileSize: row.pdfFileSize ?? "",
          coverImageUrl: row.coverImageUrl ?? "",
          accessType: "Açık Erişim",
          publishedAt: row.publishedAt ? row.publishedAt.toISOString().split("T")[0] : "",
          status: row.status as "published" | "upcoming",
          pages: finalPages,
        };
      })
    );

    const activeIssue = mappedIssues.find((i) => i.status === "published") ?? null;
    return { activeIssue, issues: mappedIssues };
  } catch (error) {
    console.error("Failed to load public fanzin data:", error);
    return { activeIssue: null, issues: [] };
  }
}

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
