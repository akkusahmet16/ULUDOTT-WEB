<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Uludott Web — Ajan ve Geliştirici Kılavuzu (AGENTS.md)

Bu belge, bu depoda çalışan yapay zeka ajanları (Antigravity, Claude, Codex vb.) ve insan geliştiriciler için temel kuralları, mimari sınırları, komutları ve değişmez ilkeleri tanımlar.

---

## 1. Temel İlkeler ve Değişmezler (Invariants)

1. **Görsel Kilit (Visual Lock):**
   - v0.1'den gelen özgün ArtDeco ve sinematik tasarım kimliği kesinlikle korunur.
   - `tests/fixtures/golden-declarations.json` içinde tanımlı 2.889 CSS kuralı altın listedir.
   - CSS dosyalarında yerel renk tanımlanamaz; tüm renkler `src/styles/themes.css` içindeki tasarım tokenlarına bağlı olmalıdır. `theme-centralization.test.ts` ve `theme-parity.test.ts` testleri bunu denetler.
2. **Sunucu ve İstemci Sınırı (Server-Only Boundary):**
   - Veritabanı (`src/db`), kuyruk (`src/lib/queue`), kimlik doğrulama (`src/lib/auth`) ve dosya sistemi işlemleri `"server-only"` modülüyle korunur.
   - Sayfa ve bileşenler varsayılan olarak React Server Component (RSC) olarak yazılır. Yalnızca kullanıcı etkileşimi (form girdisi, modal, flipbook okuyucu vb.) gerektiren yerlerde `"use client"` kullanılır.
3. **Merkezi Rotalar (Route Centralization):**
   - Tüm rotalar `src/config/routes.config.ts` dosyasında `RouteDefinition` olarak tanımlanır.
   - Sayfa başlıkları, açıklamaları ve canonical URL politikaları bu yapılandırmadan okunur.
4. **Çok Dilli Sözlükler (i18n):**
   - Kullanıcıya görünen hiçbir metin bileşenler içerisine doğrudan (hardcoded) yazılamaz.
   - Tüm metinler `src/i18n/dictionaries/{tr,en,client-tr}.ts` sözlüklerine eklenir. `tests/unit/no-hardcoded-text.test.ts` AST bekçisi sıfır toleransla çalışır.
5. **İkon ve Görsel Standartları:**
   - Arayüzde hiçbir pictografik emoji (📖, 📄, 📁 vb.) kullanılmaz; bunun yerine `src/components/ui/icons/icon.tsx` kayıtlı SVG ikonlar veya tipografik semboller (`✦`, `+`, `[PDF]`) kullanılır.
   - Next.js `<Image />` bileşenlerinde `unoptimized` bayrağı genel arayüzde keyfi kullanılamaz; responsive kurallara ve `sizes` tanımlarına uyulur.

---

## 2. Teknoloji Yığını ve Sabit Sürümler

- **Node.js:** `24.21.0 LTS`
- **pnpm:** `11.19.0`
- **Next.js:** `16.3.8` (App Router, Turbopack)
- **React:** `19.3.0`
- **TypeScript:** `6.0.3` (Strict mode)
- **Drizzle ORM:** `0.45.3` / **PostgreSQL:** `17`
- **Vitest:** `5.0.3` / **Playwright:** `1.57.0`

---

## 3. Çalışma Komutları

```sh
# Geliştirme sunucusunu başlatır
pnpm dev

# Arka plan kuyruk işleyicisini (worker) başlatır
pnpm worker

# TypeScript tip denetimi (sıfır hata zorunludur)
pnpm typecheck

# ESLint denetimi (sıfır uyarı zorunludur)
pnpm lint

# Tüm birim testlerini çalıştırır (48 dosya / 309 test)
pnpm vitest run tests/unit

# Üretim derlemesini oluşturur (67 rota)
pnpm build

# Veritabanı migration kontrolü
pnpm db:check

# Veritabanına migration'ları uygular
pnpm db:migrate

# 2026 yılı tarihî oyun verilerini idempotent olarak ekler
pnpm db:seed:2026
```

---

## 4. Dizin Yapısı

- `src/app/`: Next.js App Router sayfaları (`(public)`, `admin`, `api`, `uploads`)
- `src/components/`: Yeniden kullanılabilir UI ve layout bileşenleri
- `src/config/`: Rota, boot betiği ve genel konfigürasyonlar
- `src/db/`: Drizzle şemaları (`src/db/schema/`) ve veritabanı istemcisi
- `src/i18n/`: TR/EN sözlükler, çeviri fonksiyonları ve hata adaptörleri
- `src/lib/`: Güvenlik (CSP, CSRF, rate limit), kuyruk (outbox), önbellek ve depolama
- `src/modules/`: Alan bazlı modüller (`fanzin`, `forms`, `events`, `games`, `teams`, `cards`, `wallet`, `links`, `analytics`, `site-settings`, `media`)
- `src/styles/`: Global CSS ve tema dosyaları (`themes.css`, `base.css`, `tokens.css`, `cinematic.css`, `fanzin.css`)
- `tests/`: Birim (`tests/unit`), entegrasyon (`tests/integration`), E2E (`tests/e2e`) ve operasyon testleri

---

## 5. Değişiklik ve Genişletme Sözleşmesi

- Yeni bir sayfa eklenirken:
  1. `src/config/routes.config.ts` içine rota tanımı eklenir.
  2. `src/i18n/keys.ts` ve sözlük dosyalarına (`tr.ts`, `en.ts`) başlık ve metinler girilir.
  3. Sayfa bileşeni `getLocale()` ve `buildMetadata()` ile oluşturulur.
  4. `pnpm typecheck` ve `pnpm vitest run tests/unit/routes-integrity.test.ts` çalıştırılır.
- Yeni bir stil eklenirken:
  1. Sabit renk/ölçü yazılmaz; `src/styles/themes.css` değişkenleri kullanılır.
  2. `pnpm vitest run tests/unit/theme-centralization.test.ts` ile doğrulanır.
