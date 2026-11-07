# Uludott Web (v0.2 Final Kabul Sürümü)

Uludott Oyun Geliştirme Topluluğu'nun resmî web platformu. Bu sürüm, v0.1'in ödüllü ve özgün sinematik ArtDeco görsel kimliğini %100 sadakatle korurken; arka planda Next.js 16 (App Router & Turbopack), PostgreSQL 17 (Drizzle ORM), çok dilli sözlük altyapısı (TR/EN i18n), dinamik form motoru, UluJam takım portalı, katılımcı kartları, dijital cüzdan entegrasyonu, Fanzin çevrimiçi okuyucu ve kapsamlı yönetim paneli sunar.

- **GitHub Deposu:** [akkusahmet16/ULUDOTT-WEB](https://github.com/akkusahmet16/ULUDOTT-WEB)
- **Aktif Dal:** `GeminiImplemente`

---

## 1. Mimari ve Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
|---|---|---|
| **Web Framework** | Next.js 16.3.8 | Turbopack, React Server Components (RSC), Server Actions |
| **Arayüz (UI)** | React 19.3.0 | CSS Modules, ArtDeco tasarım tokenları, `themes.css` |
| **Çalışma Zamanı** | Node.js 24.21.0 LTS | pnpm 11.19.0 (frozen lockfile & devEngines) |
| **Tip Sistemi** | TypeScript 6.0.3 | Strict mode, `noEmit` tam tip güvenliği |
| **Veritabanı** | PostgreSQL 17 / Drizzle 0.45.3 | 48 tablo, bileşik dış anahtarlar, transaction izolasyonu |
| **Nesne Depolama** | S3 Uyumlu (Garage / MinIO) | Optimize edilmiş görsel varyantları ve güvenli dosya saklama |
| **Test Paketi** | Vitest 5.0.3 / Playwright 1.57.0 | 48 birim test dosyası (309 test), entegrasyon ve TLS E2E testleri |

---

## 2. Temel İlkeler ve Değişmezler

1. **Görsel Kilit (Visual Lock):** v0.1 görsel stili `tests/fixtures/golden-declarations.json` içindeki 2.889 CSS bildirimiyle kilitlidir. Rastgele stil eklenemez; tüm renkler `src/styles/themes.css` tokenlarına bağlıdır.
2. **Server-Only Sınırı:** Veritabanı, kimlik doğrulama ve kuyruk işlemleri `"server-only"` modülüyle korunur; istemciye veri sızıntısı engellenir.
3. **i18n ve Sıfır Hardcode Metin:** Arayüzdeki tüm metinler `src/i18n/dictionaries/{tr,en,client-tr}.ts` sözlüklerine bağlıdır. AST bekçisi (`no-hardcoded-text.test.ts`) hardcoded metinleri engeller.
4. **Merkezi Rotalar:** Rotalar, metadata ve canonical politikaları `src/config/routes.config.ts` üzerinden tekil kaynaktan yönetilir.
5. **İkon ve Marka Ayrımı:** Arayüzde emoji kullanılmaz; tüm ikonlar `src/components/ui/icons/icon.tsx` kayıtlı SVG'ler veya tipografik sembollerdir (`✦`, `+`, `[PDF]`).

---

## 3. Kurulum ve Başlangıç

### 3.1. Ön Gereksinimler
- Node.js `24.21.0`
- pnpm `11.19.0`
- Docker & Docker Compose (yerel PostgreSQL ve Garage S3 için)

### 3.2. Adım Adım Kurulum

```sh
# Bağımlılıkları yükleyin
pnpm install --frozen-lockfile

# Ortam değişkenlerini oluşturun
cp .env.example .env.local

# Yerel Garage RPC sırrını oluşturun (yalnızca ilk kurulumda)
mkdir -p .local
(umask 077; set -C; openssl rand -hex 32 > .local/garage-rpc.secret)

# Yapılandırmayı doğrulayın
pnpm config:check

# Yerel veritabanı ve S3 servislerini başlatın
docker-compose --env-file .env.local up -d

# Veritabanı şemasını uygulayın
pnpm db:migrate

# 2026 yılı başlangıç ve tarihî oyun verilerini yükleyin
pnpm db:seed:2026

# Geliştirme sunucusunu başlatın
pnpm dev

# Ayrı bir terminalde kuyruk işleyicisini (worker) başlatın
pnpm worker
```

- **Uygulama:** http://127.0.0.1:3000
- **PostgreSQL:** 127.0.0.1:5432
- **Garage S3:** 127.0.0.1:9000

---

## 4. Test ve Doğrulama Komutları

```sh
# TypeScript strict tip denetimi (0 hata)
pnpm typecheck

# ESLint kod kalitesi denetimi (0 uyarı)
pnpm lint

# 48 birim test dosyasını çalıştırın (309/309 PASS)
pnpm vitest run tests/unit

# Üretim derlemesi oluşturun (67 rota)
pnpm build

# Entegrasyon testlerini çalıştırın
pnpm test:integration

# Tüm CI kalite kapılarını sırayla çalıştırın
pnpm ci:check
```

---

## 5. Modül ve Sayfa Yapısı

- **Genel Yüzey (Public):**
  - `/`: Sinematik açılış, kahraman hikaye panelleri, etkinlik karuseli ve mini oyunlar
  - `/hakkimizda`: Topluluk felsefesi ve ekip tanıtımı
  - `/ulujam`: UluJam oyun maratonu merkezi ve başvuru
  - `/etkinlikler` & `/etkinlikler/[slug]`: Etkinlik takvimi ve detayları
  - `/oyunlar` & `/oyunlar/[slug]`: Oyun kataloğu ve künye detayları
  - `/fanzin`: Uludott Fanzin arşivi ve interaktif sayfa çevirmeli flipbook okuyucu
  - `/iletisim`: İletişim adresleri ve sosyal medya bağlantıları
- **Özel / Katılımcı Alanı:**
  - `/basvuru/[formSlug]`: Dinamik form başvuru ekranı
  - `/makbuz`: Başvuru makbuzu ve takip özeti
  - `/kart/[token]`: Katılımcı dijital kimlik kartı ve check-in QR
  - `/takim/[token]`: UluJam takım yönetim portalı
  - `/yayin-onayi/[token]`: Oyun künyesi yayın onayı portalı
- **Yönetim Paneli (`/admin`):**
  - Analitik, Başvurular, Etkinlikler, Fanzin, Formlar, Galeri, Linkler, Medya, Oyunlar, Sponsorlar, Site İçerikleri CMS, Takım Onayları ve Sistem Sağlığı

---

## 6. Yeni Özellik ve Sayfa Ekleme Rehberi

1. **Rota Tanımı (`src/config/routes.config.ts`):** `ROUTE_IDS` dizisine yeni rota kimliğini ekleyin ve `ROUTES` altında rota yapılandırmasını (`id`, `kind`, `path`, `visibility`, `metadataKey`) tanımlayın.
2. **Sözlük Tanımları (`src/i18n/keys.ts` & `src/i18n/dictionaries/*`):** `tr.ts`, `en.ts` ve gerekiyorsa `client-tr.ts` dosyalarına yeni anahtarları bire bir ekleyin.
3. **Sayfa Bileşeni (`src/app/(public)/<sayfa>/page.tsx`):**
   ```tsx
   import { PublicShell } from "@/components/layout/public-shell";
   import { getLocale } from "@/i18n/server";
   import { getTranslator } from "@/i18n/translate";
   import { buildMetadata } from "@/seo/build-metadata";

   export async function generateMetadata() {
     return buildMetadata({ routeId: "yeniSayfa", locale: await getLocale() });
   }

   export default async function YeniSayfa() {
     const t = getTranslator(await getLocale());
     return (
       <PublicShell>
         <h1>{t("sayfa.baslik")}</h1>
       </PublicShell>
     );
   }
   ```
4. **Doğrulama:** `pnpm typecheck` ve `pnpm vitest run tests/unit` ile değişiklikleri doğrulayın.

---

## 7. Belgeler ve Detaylı Kılavuzlar

- [Nihai Kabul Raporu](docs/operations/final-acceptance.md)
- [Geliştirme ve İlerleme Raporu](docs/operations/progress.md)
- [Birleşik Uygulama Planı](docs/design/2026-10-20-birlesik-uygulama-plani.md)
- [Sunum Katmanı Kuralları](docs/design/sunum-katmani-kurallari.md)
- [Rota ve API Haritası](docs/product/routes.md)
- [Veritabanı Mimarisi](docs/architecture/database.md) & [ER Diyagramı](docs/architecture/er-diagram.md)
- [Yönetici Giriş ve Güvenlik](docs/operations/admin-auth.md)
- [Yedekleme ve Geri Yükleme](docs/operations/backup-restore.md)
- [Canlı Dağıtım Rehberi](docs/operations/deploy.md)
