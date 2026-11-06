# ULUDOTT FANZİN — ADMİN PANELİ GELİŞTİRME PROMPTU VE MİMARİ ŞARTNAMESİ

> **Geliştirici / Ajan İçin Not:** Bu doküman, Uludott Web platformu üzerindeki `/fanzin` yayınının yönetimini üstlenecek **Admin Paneli Modülü**'nün (`/admin/fanzin`) uçtan uca eksiksiz geliştirilmesi için hazırlanmış ana uygulama promptudur.

---

## 🎯 GÖREV VE BAĞLAM (CONTEXT & GOAL)

Uludott topluluğunun dijital fanzini için kullanıcıya açık `/fanzin` sayfası (GTA VI Vice City sinematik teması, etkileşimli 3D çift sayfa çevirmeli flipbook okuyucusu, makale/dosya listeleri, PDF indirme ve arşiv yapısı) canlıya alınmıştır.

Şimdi bu sayfada yer alan fanzin sayılarını, sayfalarını ve öne çıkan yazılarını yönetmek üzere **Admin Paneli** entegrasyonu gerçekleştirilecektir.

---

## 🏗️ 1. MİMARİ VE VERİ TABANI ŞEMASI (DRIZZLE ORM)

`src/db/schema/fanzin.ts` dosyasını oluşturarak aşağıdaki PostgreSQL tablolarını tanımlayın:

```typescript
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

// 1. Fanzin Sayıları Tablosu
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
  pageImageAssetId: varchar("page_image_asset_id", { length: 64 }), // İsteğe bağlı render edilmiş sayfa WebP
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
```

---

## 🛠️ 2. ADMIN ROTALARI VE KULLANICI ARAYÜZÜ (UI/UX)

Aşağıdaki rotalar `src/app/admin/fanzin` altında kurgulanmalıdır:

### 2.1. Sayı Listesi Sayfası (`/admin/fanzin/page.tsx`)
- **Başlık & Buton:** "Fanzin Yönetimi" ve sağ üstte "+ Yeni Sayı Ekle" butonu.
- **İstatistik Kartları:** Toplam Sayı, Yayındaki Sayı, Toplam Okunma, Toplam PDF İndirilme.
- **Tablo / Liste:**
  - Kapak Küçük Resmi
  - Sayı No & Başlık (ör. `Sayı #01: Vice & Pixels`)
  - Dönem / Yıl (ör. `Bahar 2026`)
  - Sayfa Sayısı
  - PDF Dosya Boyutu
  - Durum Rozeti: `Yayında` (Yeşil/Mavi Neon), `Taslak` (Sarı), `Yakında` (Turuncu)
  - Aksiyonlar: `Düzenle`, `Sayfaları Yönet`, `Önizle`, `Yayından Kaldır / Sil`

### 2.2. Sayı Düzenleme & Oluşturma Sayfası (`/admin/fanzin/[id]/page.tsx` & `/admin/fanzin/yeni/page.tsx`)
Tablı arayüz:
1. **Sekme 1 — Temel Bilgiler:**
   - Sayı Numarası (Sıralama için)
   - Başlık & Alt Başlık
   - Slug (Otomatik üretim destekli)
   - Dönem & Yıl seçiciler
   - Tanıtım / Editör Özeti metin alanı
   - Yayın Durumu (`draft`, `published`, `upcoming`, `archived`)
2. **Sekme 2 — PDF ve Dijital Varlık Yükleme:**
   - Sürükle & Bırak PDF Yükleyici (Maks. 50 MB, PDF header & MIME kontrolü).
   - Yüklenen PDF'in S3 / Media depolamasına aktarılması.
   - Otomatik sayfa algılama (PDF sayfa adedini okuma ve `pageCount` alanına yazma).
   - Kapak Görseli Seçici / Yükleyici.
3. **Sekme 3 — Sayfalar ve İçerik Editörü:**
   - Sayfa sıralama listesi (Sürükle-bırak sayfa sırası değiştirme).
   - Her sayfa için `Sayfa Tipi` seçici (`Kapak`, `Editörden`, `İçindekiler`, `Makale`, `Galeri`, `Söyleşi`, `Arka Kapak`).
   - Rich Text / Markdown / HTML editörü.
   - Alıntı kutusu ve yazar adı tanımlayıcıları.
4. **Sekme 4 — Öne Çıkan Başlıklar & Dosyalar:**
   - Sayı içindeki kritik makaleleri tanımlama (Başlık, Kategori, Başlangıç Sayfası, Sayfa Adedi, Kısa Özet, Etiketler).
   - Flipbook içi doğrudan sayfa atlama (`jumpToPage`) eşleştirmesi.

### 2.3. Canlı Önizleme Çekmecesi / Modalı (Live Preview)
- Taslak halindeki sayı verilerini doğrudan `FlipbookReader` bileşenine besleyerek adminin değişiklikleri anlık olarak test etmesini sağlayın.

---

## ⚡ 3. SERVER ACTIONS VE İŞ AKIŞLARI (BUSINESS LOGIC)

`src/modules/fanzin/application/fanzin-admin-service.ts` içinde:

1. **`upsertFanzinIssue(data: FanzinIssueInput): Promise<Result>`**
   - Zod doğrulamasını çalıştırır.
   - Otomatik slug çakışmalarını çözer.
   - Veritabanına kaydeder veya günceller.
   - `revalidateTag("fanzin")` ve `revalidatePath("/fanzin")` çağrısı yaparak genel sayfadaki önbelleği temizler.

2. **`uploadFanzinPdfAction(issueId: string, file: File): Promise<Result>`**
   - Dosya türünü `application/pdf` ve magic bytes (`%PDF-`) seviyesinde doğrular.
   - Dosyayı `src/modules/media/application/asset-service.ts` veya doğrudan S3 istemcisine aktarır.
   - Sayfa adedini ve dosya boyutunu (`pdfFileSize`) hesaplar.

3. **`updateFanzinPagesOrder(issueId: string, pageIds: string[]): Promise<Result>`**
   - Sayfaların sıra numaralarını günceller.

4. **`incrementFanzinDownloadCount(issueId: string): Promise<void>`**
   - İndirme sayacını atomik olarak artırır (`sql\`download_count = download_count + 1\``).

---

## 🔒 4. GÜVENLİK, YETKİLENDİRME VE DENETİM (SECURITY & AUDIT)

- Tüm `/admin/fanzin/*` rotaları ve Server Action'ları `requireAdminSession()` kontrolünden geçmelidir.
- Her sayı yayınlama, yayından kaldırma veya silme işlemi `auditLogger.log()` ile sistem günlüğüne kaydedilmelidir:
  - `action: "FANZIN_PUBLISH"`
  - `target: issueId`
  - `actor: adminUser.id`
- Yüklenen PDF dosyaları doğrudan istemciye sunulurken `Content-Disposition: inline` veya `attachment` başlıkları ve CSP politikası korunmalıdır.

---

## 📋 5. KULLANIMA HAZIR PROMPT (COPY-PASTE PROMPT FOR CURSOR / CLAUDE)

Aşağıdaki bloğu doğrudan bir AI asistanına ileterek admin panelini kodlatabilirsiniz:

```markdown
Sen kıdemli bir Full-Stack mühendisisin.
Uludott Web platformu (/Users/taklalie60/Desktop/ULUDOTT/yedek-v0.2-20261102) projesinde çalışıyoruz.
Kullanıcıya açık `/fanzin` sayfası ve Flipbook okuyucusu hazırlandı.

GÖREV:
Admin paneli için `/admin/fanzin` modülünü geliştir.

YAPILACAK ADIMLAR:
1. `src/db/schema/fanzin.ts` dosyasında `fanzinIssues`, `fanzinPages` ve `fanzinArticles` Drizzle tablolarını tanımla. Drizzle migration dosyasını üret veya mevcut şema yapısına entegre et.
2. `src/modules/fanzin/application/fanzin-admin-service.ts` içinde CRUD ve Server Actions mantığını oluştur (Zod şemaları, revalidateTag("fanzin"), PDF yükleme desteği).
3. `src/app/admin/fanzin/page.tsx` altında sayıların listelendiği, durumlarının (Taslak/Yayında/Yakında) görülebildiği tabloyu oluştur.
4. `src/app/admin/fanzin/[id]/page.tsx` ve `yeni/page.tsx` altında sekmeli sayı düzenleyicisini (Temel Bilgiler, PDF/Medya, Sayfalar & İçerik, Öne Çıkan Başlıklar) inşa et.
5. AdminWorkspace stiline (`admin-workspace.module.css`) ve mevcut admin tasarım sistemine (`src/components/design-system/`) tam uyum sağla.
6. `tests/unit/routes-integrity.test.ts` ve admin birim testlerinin yeşilde kaldığını doğrula.
```
