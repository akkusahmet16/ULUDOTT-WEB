# Uludott Web v0.2 — GitHub Issue #1 (Faz 0–7) Uyumlu Master Uygulama Planı

**Tarih:** 20 Ekim 2026  
**Çalışma Dizini:** `/Users/taklalie60/Desktop/ULUDOTT/Uludott Web v0.2`  
**Git Dalı (Branch):** `feat/unified-clean-v0.2`  
**Referans Mimari Belgesi:** [`docs/design/github-issue-1-mimari-plan.md`](./github-issue-1-mimari-plan.md) (`akkusahmet16/ULUDOTT-WEB#1`)  
**Temel Kural Belgesi:** [`docs/design/sunum-katmani-kurallari.md`](./sunum-katmani-kurallari.md)  
**Canlıya Alma Kuralı:** **ASLA canlıya (VDS) alınmayacak.** Tüm fazlar tamamlanıp yerel ortamda (`127.0.0.1`) uçtan uca doğrulanana kadar yalnızca yerelde test edilecek.

---

## 1. Mimari Sentez ve Kilitli İlkeler

1. **Görsel Tasarım Sadakati (`Uludott Web v0.1` — Sıfır Tasarımsal Değişiklik):**
   - Sitenin mevcut sinematik/ArtDeco görsel dili (`ArtDeco` font ailesi, `StoryPanels`, `PeopleStory` scroll-scrubbing video/portre akışı, yaklaşan/geçmiş etkinlik karuseli, derece oyunları vitrini, `AdminWorkspace` ve `public/community/` varlıkları) **piksel ve düzen olarak birebir korunur**.
   - GitHub Issue #1'de tarif edilen "Arcade (`#0b0b16`, Press Start 2P, PressStartIntro, ArcadeCabinetMenu)" görsel giydirmesi **uygulanmaz**; bunun yerine Issue #1'deki **tüm teknik ve mimari merkezileştirme kuralları** mevcut sinematik tasarımın altına inşa edilir.
2. **Ürün ve Arka Uç Tamlığı (`v0.1`'in `batu-try`'da Eksik Kalan Tüm Özellikleri):**
   - 26 veritabanı migration'ı (`0000`–`0025`), genel ve UluJam form oluşturucu (`forms`, `form_versions`, `form_fields`), dosya yüklemeli başvurular (`submission_files`), takım oluşturma/onay/eşleştirme (`/takim/[token]`), katılımcı kartı (`/kart/[token]`), yayın onayı (`/yayin-onayi/[token]`), Google Wallet, QR Check-in (`/admin/check-in`), arka plan işçisi (`src/worker/main.ts`) ve yeni yönetim modülleri (`people`, `game-catalog`, `contact-settings`, `ulujam-settings`, `ulujam-archives`) eksiksiz korunur.
3. **Sıfır Demo / Sıfır Test Verisi (`uludott_v02`):**
   - Kod tabanındaki tüm yerel demo (`LOCAL_DEMO_MODE`, `demo-ulujam-yerel`, `setup-local-demo.ts`) kaldırılmıştır.
   - Yerel PostgreSQL `uludott_v02` veritabanında kişisel/demo/test verisi `0` satırdır; yalnızca UluJam 2026 gerçek derece oyunları ve 2027 tarihsiz taslağı mevcuttur.
4. **GitHub Issue #1 Teknik Merkezileştirme Standartları (Faz 0–7):**
   - **Merkezi Tema ve Token Sistemi (`src/styles/themes.css`):** Renk kodu (`#hex`, `rgb()`, `hsl()`, `oklch()`) içeren **tek** dosya `src/styles/themes.css` olur; `base.css` ve tüm CSS modülleri yalnızca `var(--...)` tüketir (`theme-centralization.test.ts` ve `theme-parity.test.ts` ile zorlanır).
   - **Merkezi Rota ve Navigasyon Kayıt Defteri (`src/config/routes.config.ts`):** `Header`, `Footer`, `sitemap.ts`, `robots.ts` ve sayfa metadata'sı (`src/seo/build-metadata.ts`) tek bir `ROUTES` dizisinden beslenir (`routes-integrity.test.ts` ve `seo.test.ts` ile zorlanır).
   - **Merkezi İkon Kayıt Defteri (`src/components/ui/icons/`):** Dağınık inline SVG'ler yerine merkezi `IconId` ve `<Icon />` bileşeni kullanılır.
   - **Merkezi Depolama ve Çerez Anahtarları (`src/config/storage-keys.ts`):** Tüm `localStorage`, `sessionStorage` ve `cookie` anahtar adları tek dosyada tanımlanır.
   - **%100 Merkezi i18n (`src/i18n/dictionaries/{tr,en}.ts`):** Genel yüzeydeki ve yönetim panelindeki tüm kullanıcıya görünür metinler (`JSX text`, `aria-label`, `alt`, `title`, `placeholder`, boş/hata durumları, metadata) sözlükten gelir; TypeScript derleyici API'siyle çalışan `no-hardcoded-text.test.ts` ve `i18n-parity.test.ts` ile sıfır hardcode metin kuralı zorlanır. Tarih/saat biçimlendirme yalnızca `src/i18n/format.ts` (`Intl.*` + `Europe/Istanbul`) üzerinden yapılır.
   - **Kalite Kapıları, Erişilebilirlik, 404/Hata Sayfaları ve CI (Faz 5 & Faz 7):** `src/app/not-found.tsx`, `src/app/error.tsx`, `tests/perf/budgets.ts`, Lighthouse/Axe/klavye/reflow testleri, `.github/workflows/ci.yml` ve operasyon/dağıtım kabul belgeleri tamamlanır.

---

## 2. Faz Faz Uygulama Planı (Faz 0 – Faz 7)

### FAZ 0 — Temel Hat, İndekslenebilirlik, Etiketli Önbellek, Operasyon Zemini ve Sıfır Demo DB ✅ *(Tamamlandı)*

- [x] **0.0 Klasör, Branch ve Sıfır Demo Temizliği:**
  - `/Users/taklalie60/Desktop/ULUDOTT/Uludott Web v0.2` oluşturuldu (`feat/unified-clean-v0.2` dalı).
  - `LOCAL_DEMO_MODE`, `setup-local-demo.ts`, `local-demo.ts` ve ilgili test/CSS/dokümanlar silindi.
  - Sıfır demo/test verili `uludott_v02` veritabanı kuruldu (`26 migration` + `seed-ulujam-years.ts`).
- [x] **0.2 Kalıcı Kural Belgesi:**
  - [`docs/design/sunum-katmani-kurallari.md`](./sunum-katmani-kurallari.md) birebir oluşturuldu.
- [x] **0.3 İndekslenebilirlik (`robots.ts`, `sitemap.ts`, Kanonik URL):**
  - [`src/app/layout.tsx`](../../src/app/layout.tsx) üzerinde kök `noindex` kaldırıldı, `metadataBase` (`loadServerConfig().appUrl`) ve `%s | ULUDOTT` başlık şablonu tanımlandı.
  - Tüm genel sayfalara (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/etkinlikler/[slug]`, `/oyunlar`, `/oyunlar/[slug]`, `/iletisim`) `canonical` URL eklendi; `/admin`, `/api`, `/l/` ve özel token rotalarında `noindex` korundu.
  - [`src/app/robots.ts`](../../src/app/robots.ts), [`src/app/sitemap.ts`](../../src/app/sitemap.ts) ve [`listIndexablePublications`](../../src/modules/publication/service.ts) eklendi.
- [x] **0.4 Veri Seviyesinde Etiketli Önbellek (`cachePublicRead` + `revalidateTag`):**
  - [`src/lib/cache/tags.ts`](../../src/lib/cache/tags.ts), [`src/lib/cache/public-read.ts`](../../src/lib/cache/public-read.ts) (30 sn TTL, SHA256 DB+APP_URL izolasyonu) ve [`src/modules/publication/ui/public-queries.ts`](../../src/modules/publication/ui/public-queries.ts) eklendi.
  - Tüm admin/mutasyon HTTP işleyicilerine transaction `COMMIT` sonrası `revalidateTag(tag, { expire: 0 })` eklendi.
  - [`UlujamComingSoon`](../../src/modules/events/ui/ulujam-coming-soon.tsx) içinde `await connection()` ile `initialNow` sapmasının $\le 1\text{ sn}$ olması sağlandı.
- [x] **0.5 & 0.6 Canlı Denetim Aracı ve Yedekleme/Ölçüm Belgeleri:**
  - [`scripts/live-audit.ts`](../../scripts/live-audit.ts) (`pnpm audit:live`), [`infrastructure/backup/pg-backup.sh`](../../infrastructure/backup/pg-backup.sh), [`.gitattributes`](../../.gitattributes) ve [`docs/operations/vds-olcum.md`](../operations/vds-olcum.md) eklendi.
  - `public-cache.test.ts`, `cache-invalidation.test.ts`, `live-audit.test.ts`, `sitemap-publications.test.ts` ve `indexability.spec.ts` testleri eklendi ve doğrulandı.
- [ ] **0.1 Görsel Regresyon Baseline Kaydı (`tests/e2e/__baseline-classic__/`):**
  - Faz 1'de CSS/token merkezileştirmesine geçmeden hemen önce mevcut sinematik tasarımın masaüstü (`1280×800`) ve mobil (`375×812`) deterministik ekran görüntüleri `tests/e2e/__baseline-classic__/` altına kaydedilecek; böylece Faz 1–7 boyunca görsel tasarımın 1 piksel bile bozulmadığı otomatik testle kanıtlanacak.

---

### FAZ 1 — %100 Merkezi Tema ve Token Sistemi (`themes.css` + Görsel Sadakat Koruma)

> **Amaç:** Mevcut sinematik/ArtDeco görsel tasarımını **hiç değiştirmeden**, tüm CSS dosyalarındaki (`tokens.css`, `cinematic.css`, `home.module.css`, `people-story.module.css`, `past-events-carousel.module.css`, `contact.module.css`, `admin-workspace.module.css`, `content-workspace.module.css`, `event-editor.module.css`) renk kodlarını ve tasarım sabitlerini tek bir merkezi `src/styles/themes.css` dosyasında toplamak.

- [ ] **1.1 Token ve Renk Envanteri:**
  - `src/**/*.{ts,tsx,css}` içindeki tüm hex/rgb/hsl/oklch renk değerleri, gölgeler, yarıçaplar, geçiş süreleri ve z-index katmanları çıkarılıp `docs/operations/sunum-katmani-ilerleme.md` içine kaydedilir.
- [ ] **1.2 `src/styles/themes.css` ve `src/styles/base.css`:**
  - `src/styles/themes.css`: Projede renk kodu içeren **tek** dosya olur. Mevcut sinematik/ArtDeco tasarımının tüm renk, tipografi (`--font-display`, `--font-body`, `--font-mono`), boşluk (`--space-*`), radius (`--radius-*`), gölge, hareket (`--motion-*`) ve katman (`--z-*`) değişkenlerini `:root, [data-theme="cinematic"], [data-theme="classic"]` altında eksiksiz tanımlar.
  - `src/styles/tokens.css` → `src/styles/base.css` olarak taşınır; `cinematic.css` ve tüm `*.module.css` dosyalarındaki literal renk kodları `var(--...)` referanslarına dönüştürülür.
- [ ] **1.3 Merkezi Konfigürasyon Dosyaları:**
  - `src/config/storage-keys.ts`: `STORAGE_KEYS` ve `COOKIE_KEYS` (`locale: "uludott-lang"` vb.) için tek doğruluk kaynağı.
  - `src/config/theme.config.ts`: `THEMES`, `ThemeId`, `DEFAULT_THEME`, `ADMIN_THEME`, `isThemeId`, `THEME_REGISTRY`.
  - `src/config/fonts.ts`: Mevcut yerel `ArtDeco` font tanımları (`bodyFont`, `displayFont`) `src/app/layout.tsx` içinden `src/config/fonts.ts` dosyasına taşınır.
  - `src/config/boot-script.ts` + `src/components/boot/BootScript.tsx` ve `src/components/theme/ThemeProvider.tsx` (`useSyncExternalStore` tabanlı, FOUC'suz).
- [ ] **1.4 Zorlayıcı Birim ve Görsel Regresyon Testleri:**
  - `tests/unit/theme-centralization.test.ts`: `src/styles/themes.css` dışında hiçbir `.ts`, `.tsx`, `.css` dosyasında hex/rgb/hsl/oklch renk kodu veya inline renk stili bulunmadığını doğrular.
  - `tests/unit/theme-parity.test.ts`: `src/**` içinde kullanılan her `var(--x)` değişkeninin `themes.css` içinde tanımlı olduğunu doğrular.
  - `tests/unit/theme-contrast.test.ts`: Temel metin/arka plan çiftlerinin WCAG 2.2 AA kontrast oranlarını doğrular.
  - `tests/e2e/visual-classic.spec.ts`: Faz 0.1'de alınan ekran görüntüleriyle karşılaştırarak görsel tasarımın değişmediğini (`maxDiffPixelRatio <= 0.01`) kanıtlar.
- [ ] **1.5 Faz 1 Doğrulama Ritüeli:**
  - `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration && pnpm test:e2e && pnpm build`.

---

### FAZ 2 — Config-Güdümlü Rotalar (`routes.config.ts`), Gezinme, SEO Merkezi ve İkon Kayıt Defteri

> **Amaç:** Menü (`Header`), alt bilgi (`Footer`), `/sitemap.xml`, `/robots.ts` ve sayfa metadata tanımlarını tek bir `src/config/routes.config.ts` kaynağından beslemek; tüm ikonları merkezi `src/components/ui/icons/` kayıt defterine taşımak.

- [ ] **2.1 Sözlük İskeleti (Faz 3 Temeli):**
  - `src/i18n/dictionaries/tr.ts`: `brand`, `nav`, `footer`, `meta`, `a11y` ad alanlarıyla mevcut Türkçe metinleri birebir taşır.
  - `src/i18n/keys.ts`: `DictionaryKey` özyinelemeli yaprak yolu tipi.
  - `src/i18n/translate.ts`: `getTranslator()` ve `{param}` enterpolasyonlu `TranslateFn`.
- [ ] **2.2 `src/config/routes.config.ts`:**
  - Mevcut genel rotalar (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/oyunlar`, `/iletisim`), alt menü kırılımları (`/hakkimizda#yonetim-kurulu`, `/hakkimizda#mekanlar`, `/oyunlar#derece-oyunlari`, `/oyunlar#yayinlanan-oyunlar`), `NON_INDEXABLE_PREFIXES` (`/admin`, `/api`, `/l/`, `/basvuru`, `/makbuz`, `/takim`, `/kart`, `/yayin-onayi`) ve `UNLISTED_ROUTES` (`/duyurular`, `/linkler`, `/destek` yönlendirme rotaları) tek merkezde tanımlanır.
- [ ] **2.3 Merkezi İkon Kayıt Defteri (`src/components/ui/icons/`):**
  - `IconId` tipi ve `<Icon />` bileşeni oluşturulur; `social-icon.tsx` ve `links` adaptörü bu kayıt defterine bağlanır.
- [ ] **2.4 Gezinme (`Header`, `Footer`, `PublicShell`) ve SEO Merkezi (`src/seo/build-metadata.ts`):**
  - Görsel tasarım ve DOM sınıfları (`site-header`, `menu-scene`, `site-nav`, `site-footer` vb.) **birebir korunarak** `Header` ve `Footer` rota listesini `routes.config.ts` ve `getTranslator()` üzerinden alır.
  - `src/seo/build-metadata.ts`: `buildMetadata(routeId)` ile tüm genel sayfaların `generateMetadata` çıktıları (başlık, açıklama, kanonik URL, OpenGraph/Twitter metin alanları) merkezileştirilir.
  - `src/app/sitemap.ts` ve `src/app/robots.ts` doğrudan `ROUTES` ve `NON_INDEXABLE_PREFIXES` sabitlerinden beslenir (`// FAZ-2` geçici işaretleri kaldırılır).
- [ ] **2.5 Zorlayıcı Testler:**
  - `tests/unit/routes-integrity.test.ts`: Dosya sistemindeki her genel `page.tsx` rotasının `ROUTES` veya `UNLISTED_ROUTES` içinde kayıtlı olduğunu ve sözlük anahtarlarının varlığını doğrular.
  - `tests/unit/seo.test.ts`: Sitemap ve robots çıktılarının `routes.config.ts` ile tam uyumunu doğrular.
- [ ] **2.6 Faz 2 Doğrulama Ritüeli:**
  - `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration && pnpm test:e2e && pnpm build`.

---

### FAZ 3 — %100 Merkezi i18n (TR/EN): Tek Sözlük, Sıfır Hardcode Metin ve `Intl` Biçimlendirme

> **Amaç:** Kullanıcıya görünen tüm sabit metinleri (`JSX text`, `aria-label`, `alt`, `title`, `placeholder`, boş/hata durumları) `src/i18n/dictionaries/{tr,en}.ts` içine taşımak, derleme zamanı TR/EN tip eşliğini sağlamak ve AST tabanlı `no-hardcoded-text.test.ts` ile kodda sabit metin yazılmasını engellemek.

- [ ] **3.1 Metin Envanteri ve Sözlük Mimarisi:**
  - `src/i18n/config.ts`: `LOCALES = ["tr", "en"] as const`, `DEFAULT_LOCALE = "tr"`, `LOCALE_BCP47`, `DISPLAY_TIME_ZONE = "Europe/Istanbul"`.
  - `src/i18n/dictionaries/tr.ts` (kaynak sözlük ve `Dictionary` tipi) + `src/i18n/dictionaries/en.ts` (`export const en: Dictionary` — eksik/fazla anahtar derleme hatası verir).
  - `src/i18n/server.ts` (`getLocale()`, `getTranslator()`, `getDictionarySlice()`), `src/i18n/client.tsx` (`I18nProvider`, `useTranslator()` — yalnızca istemci ad alanları dilimlenir, tam sözlük istemci bundle'ına girmez), `src/i18n/format.ts` (`Intl.DateTimeFormat` / `Intl.NumberFormat` + `Europe/Istanbul`), `src/i18n/actions.ts` (`setLocaleAction`).
- [ ] **3.2 Bileşen ve Sayfa Dönüşümü (Görsel Tasarım Değişmeden):**
  - Genel sayfalar (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/oyunlar`, `/iletisim`, `/basvuru/[formSlug]`, `/makbuz`, `/kart/[token]`, `/takim/[token]`, `/yayin-onayi/[token]`), `components/**`, `modules/*/ui/**` ve `modules/community/**` içindeki sabit metinler sözlüğe taşınır.
  - Yönetim paneli (`src/app/admin/**`, `modules/admin/ui/**`) `admin.*` ad alanından sabit TR olarak beslenir.
  - Dağınık `toLocaleDateString("tr-TR")` çağrıları `src/i18n/format.ts` yardımcılarına geçirilir.
- [ ] **3.3 Zorlayıcı AST ve Eşlik Testleri:**
  - `tests/unit/i18n-parity.test.ts`: Genel ad alanlarında TR ve EN anahtar kümelerinin ve `{param}` yer tutucularının birebir aynı olduğunu doğrular.
  - `tests/unit/no-hardcoded-text.test.ts`: TypeScript AST taramasıyla UI bileşenlerinde sözlük dışı sabit metin (`JsxText`, `alt`, `aria-label`, `placeholder`, `title`) bulunmadığını doğrular.
  - `tests/unit/i18n-unused.test.ts`: Kullanılmayan sözlük anahtarlarını raporlar.
- [ ] **3.4 Faz 3 Doğrulama Ritüeli:**
  - `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration && pnpm test:e2e && pnpm build`.

---

### FAZ 4 & FAZ 5 — Sunum Katmanı Bütünlüğü, 404/Hata Sayfaları (`not-found.tsx`, `error.tsx`) ve Erişilebilirlik

> **Amaç:** Mevcut sinematik ana sayfa (`StoryPanels`, `PastEventsCarousel`) ve alt sayfa kompozisyonlarını (`PeopleStory`, `DegreeGames`, `SiteGameCard`, `UlujamComingSoon`, `Contact`) koruyarak Faz 4–5'in teknik gereksinimlerini (özel 404/hata sayfaları, klavye/odak yönetimi, `prefers-reduced-motion`, semantik başlık hiyerarşisi) tamamlamak.

- [ ] **5.1 Özel 404 ve Hata Sayfaları:**
  - `src/app/not-found.tsx`: Sinematik tasarıma uygun, sözlük tabanlı (TR/EN), ana sayfaya dönüş bağlantılı ve `noindex` korumalı 404 sayfası.
  - `src/app/error.tsx`: Client Component; arka uç/sır ayrıntısını kullanıcıya sızdırmadan `errors` sözlük dilimiyle güvenli hata ekranı sunar.
- [ ] **5.2 Erişilebilirlik ve Etkileşim Kontrolleri:**
  - Tüm genel rotalarda tek `<h1>` ve doğru başlık seviyesi sırası (`h1` → `h2` → `h3`).
  - Diyalog/çekmece/karusel/video kontrollerinde klavye erişimi (`Escape`, odak iadesi, `:focus-visible`) ve `prefers-reduced-motion: reduce` uyumu.
  - Mini oyun (`pair-match`, `star-catch`) ve etkileşimli bileşenlerin birim/erişilebilirlik testlerinin doğrulanması.
- [ ] **5.3 Faz 4–5 Doğrulama Ritüeli:**
  - `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration && pnpm test:e2e && pnpm build`.

---

### FAZ 6 — Form Motoru, Başvurular, UluJam ve İletişim Modüllerinin Merkezileştirme Uyumu

> **Not:** Issue #1'in Faz 6'da talep ettiği Görev 11–14 (ve hatta 15–25) arka uç ve yönetim modülleri `Uludott Web v0.2` içinde zaten eksiksiz mevcuttur. Bu fazda mevcut modüllerin Faz 1–3 merkezileştirme kurallarıyla (`themes.css`, `routes.config.ts`, `i18n` sözlüğü, WCAG 2.2 AA form etiket/hata semantiği) %100 uyumu doğrulanır.

- [ ] **6.1 Form ve Başvuru Yüzeylerinin Kontrolü:**
  - `/basvuru/[formSlug]`, `/makbuz`, `/kart/[token]`, `/takim/[token]`, `/yayin-onayi/[token]` ve `/iletisim` sayfalarının `no-hardcoded-text`, `theme-centralization` ve `axe` erişilebilirlik testlerinden sıfır hatayla geçmesi.
  - İdempotency (`Review Focus #1`: aynı idempotency anahtarı + farklı gövde → `409`), CSRF, oturum ve izin matrisi testlerinin doğrulanması.
- [ ] **6.2 Faz 6 Doğrulama Ritüeli:**
  - `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration && pnpm test:e2e && pnpm build`.

---

### FAZ 7 — Sertleştirme, Kalite Kapıları (`budgets.ts`), CI İş Akışı ve Nihai Kabul Belgesi

- [ ] **7.1 Performans ve Bütçe Kapısı (`tests/perf/budgets.ts`):**
  - Kategori eşikleri, LCP ($\le 2.5\text{ sn}$), CLS ($\approx 0$), JS bundle bütçesi ve rota listesini içeren `tests/perf/budgets.ts` oluşturulur.
- [ ] **7.2 Erişilebilirlik, Klavye ve Reflow Kapısı:**
  - Tüm genel rotalarda masaüstü (`1280px`) ve mobil (`375px` / `320px` reflow) `axe` taraması (0 serious/critical) ve klavye gezinti doğrulaması.
- [ ] **7.3 Genişletilebilirlik Provası (Kanıtlı, Ardından Geri Alınan Prova):**
  - `routes.config.ts` içine geçici bir rota + `page.tsx` + sözlük girdisi eklenerek menü ve sitemap'e otomatik yansıdığı kanıtlanır ve geri alınır.
- [ ] **7.4 CI İş Akışı (`.github/workflows/ci.yml`) ve Dağıtım/Operasyon Dokümanları:**
  - Node `24.21.0` ve `pnpm 11.19.0` ile statik kontroller (`typecheck`, `lint`, `unit` + merkezileştirme bekçileri), PostgreSQL/S3 entegrasyon testleri, Playwright E2E ve `build` adımlarını içeren `.github/workflows/ci.yml` hazırlanır (içinde hiçbir sır veya VDS bilgisi yer almaz).
  - `README.md` ("Yeni sayfa ekle", "Yeni tema token'ı ekle", "Yeni dil ekle" rehberleriyle) güncellenir ve `docs/operations/sunum-katmani-kabul.md` nihai kabul tablosu oluşturulur.
