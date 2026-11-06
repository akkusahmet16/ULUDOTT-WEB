import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// 1. Fanzin Sayıları Tablosu (Issue)
export const fanzinIssues = pgTable("fanzin_issues", {
  id: varchar("id", { length: 64 }).primaryKey(),
  issueNumber: integer("issue_number").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  subtitle: text("subtitle"),
  season: varchar("season", { length: 32 }).notNull(), // 'Bahar', 'Güz', 'Kış' vb.
  year: integer("year").notNull(),
  description: text("description").notNull(),
  pageCount: integer("page_count").notNull().default(0),
  pdfAssetId: varchar("pdf_asset_id", { length: 64 }),
  pdfUrl: text("pdf_url").notNull(),
  pdfFileSize: varchar("pdf_file_size", { length: 32 }),
  coverAssetId: varchar("cover_asset_id", { length: 64 }),
  coverImageUrl: text("cover_image_url"),
  status: varchar("status", { length: 32 }).notNull().default("draft"), // 'draft' | 'published' | 'upcoming' | 'archived'
  downloadCount: integer("download_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. Fanzin Sayfa Detayları Tablosu (Flipbook & Okuyucu Kaynağı)
export const fanzinPages = pgTable("fanzin_pages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  issueId: varchar("issue_id", { length: 64 })
    .notNull()
    .references(() => fanzinIssues.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  pageType: varchar("page_type", { length: 32 }).notNull(), // 'cover' | 'editorial' | 'toc' | 'article' | 'gallery' | 'interview' | 'backcover'
  title: text("title"),
  subtitle: text("subtitle"),
  contentHtml: text("content_html"),
  author: text("author"),
  quote: text("quote"),
  itemsJson: jsonb("items_json"), // Alt başlıklar, künye veya içindekiler maddeleri
  galleryImagesJson: jsonb("gallery_images_json"), // Çizim/galeri verileri & renk paletleri
  pageImageAssetId: varchar("page_image_asset_id", { length: 64 }), // Render edilmiş sayfa WebP
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 3. Fanzin Öne Çıkan Yazıları & Dosyaları
export const fanzinArticles = pgTable("fanzin_articles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  issueId: varchar("issue_id", { length: 64 })
    .notNull()
    .references(() => fanzinIssues.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  startPage: integer("start_page").notNull(),
  pageSpan: integer("page_span").notNull().default(1),
  excerpt: text("excerpt").notNull(),
  highlightQuote: text("highlight_quote"),
  tags: jsonb("tags").$type<string[]>().default([]),
  displayOrder: integer("display_order").notNull().default(0),
});
