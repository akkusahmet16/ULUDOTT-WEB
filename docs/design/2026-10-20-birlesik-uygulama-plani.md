# Birleşik ve Temiz Uludott Web v0.2 — Uygulama Planı ve Doğrulama Raporu

**Tarih:** 20 Ekim 2026  
**Çalışma Dizini:** `/Users/taklalie60/Desktop/ULUDOTT/Uludott Web v0.2`  
**Git Dalı (Branch):** `feat/unified-clean-v0.2`  
**Canlıya Alma Kuralı:** **ASLA canlıya (VDS) alınmadı ve alınmayacak.** Tüm geliştirme, veritabanı kurulumu ve doğrulamalar yalnızca yerel ortamda (`127.0.0.1`) yürütüldü.

---

## 1. Hedef ve Mimari İlkeler

1. **Tasarımsal Sadakat (`Uludott Web v0.1`):**
   - Sinematik arayüz (`src/styles/cinematic.css`, `src/styles/home.module.css`, özel `ArtDeco` font ailesi), ana sayfa etkileşimli hikâye panelleri (`StoryPanels`), yaklaşan/geçmiş etkinlik karuseli, Hakkımızda sayfasındaki `PeopleStory` (scroll-scrubbing video ve portre bölümleri), `public/community/` altındaki tüm gerçek topluluk görselleri/videoları ve yenilenmiş yönetim paneli (`AdminWorkspace`) **hiçbir tasarımsal değişikliğe uğramadan** korundu.
2. **Ürün Tamlığı (`Uludott Web v0.1`'in `batu-try`'da Eksik Kalan Tüm Modülleri):**
   - 26 veritabanı migration'ı (`0000`–`0025`), genel ve UluJam form oluşturucu, dosya yüklemeli başvurular (`submission_files`), takım oluşturma/onay/arama (`/takim/[token]`), katılımcı kartı (`/kart/[token]`), yayın onayı (`/yayin-onayi/[token]`), Google Wallet entegrasyonu, QR Check-in (`/admin/check-in`), arka plan işçisi (`src/worker/main.ts`), People/Oyun/İletişim/UluJam yönetim modülleri eksiksiz korundu.
3. **`ULUDOTT-WEB-batu-try` Sürümünün Tüm İyi Yönlerinin Entegrasyonu:**
   - **SEO ve İndekslenebilirlik:** Kök `src/app/layout.tsx` üzerindeki genel `noindex` engeli kaldırıldı; dinamik `generateMetadata` ile `metadataBase` ve başlık şablonu (`%s | ULUDOTT`) tanımlandı. Tüm genel sayfalara (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/oyunlar`, `/iletisim`) ve dinamik etkinlik/oyun detay sayfalarına `canonical` URL eklendi. Özel ve yönetim rotalarında (`/admin`, `/kart`, `/takim`, `/yayin-onayi`, `/basvuru`, `/makbuz`, `/l/`) hem meta `noindex` hem HTTP `X-Robots-Tag: noindex, nofollow` koruması sürdürüldü.
   - **`robots.ts` ve Dinamik `sitemap.ts`:** Arama motorları için `/robots.txt` ve yayımlanmış etkinlik/duyuru/oyun detaylarını gerçek `audit_logs` son değişiklik zamanıyla (`listIndexablePublications`) sunan `/sitemap.xml` eklendi.
   - **Etiketli Veri Önbelleği (`cachePublicRead` + `revalidateTag`):** `src/lib/cache/tags.ts`, `src/lib/cache/public-read.ts` (`unstable_cache`, 30 sn TTL, DB+APP_URL SHA256 izolasyonu) ve `src/modules/publication/ui/public-queries.ts` ile tüm genel sayfa veritabanı okumaları önbelleğe alındı. Admin panelindeki her kaydetme/yayınlama/silme işleminden sonra (`COMMIT` tamamlandıktan hemen sonra) `revalidateTag(tag, { expire: 0 })` ile ilgili önbellek anında temizleniyor.
   - **Taze Geri Sayım Zamanı (`initialNow`):** `/ulujam` sayfasındaki `UlujamComingSoon` bileşeninde veri önbellekten okunurken `initialNow` her istekte `await connection()` sonrasında taze üretilir ($\le 1\text{ sn}$ sapma garantisi).
   - **Canlı Denetim Aracı (`pnpm audit:live`):** `scripts/live-audit.ts` ile 6 temel uç noktada HTTP, `X-Robots-Tag`, `canonical`, `lang`, `skip` link ve `site-header` kontrollerini yapan salt okunur CLI aracı eklendi.
   - **Atomik PostgreSQL Yedekleme ve Operasyon Belgeleri:** `infrastructure/backup/pg-backup.sh`, `.gitattributes`, `docs/design/sunum-katmani-kurallari.md` ve `docs/operations/vds-olcum.md` projeye dahil edildi.
4. **Sıfır Demo, Sıfır Test Verisi (Temiz Başlangıç):**
   - Kod tabanındaki tüm yerel demo (`LOCAL_DEMO_MODE`, `demo-ulujam-yerel`, `scripts/setup-local-demo.ts`, `src/lib/config/local-demo.ts`, `src/modules/applications/application/local-demo-setup.ts`, `src/modules/events/ui/local-demo-application.tsx`, `.local-demo-application` CSS kuralları, `docs/operations/local-demo.md` ve `local-demo` testleri) tamamen kaldırıldı.
   - Yerel PostgreSQL üzerinde tamamen yeni ve izole **`uludott_v02`** veritabanı oluşturuldu; içinde hiçbir demo başvuru, test etkinliği veya test görseli bulunmuyor.

---

## 2. Adım Adım Uygulama Planı ve Tamamlanma Durumu

### Adım 1 — İzole Proje Klasörü ve Git Dalı Kurulumu
- [x] `/Users/taklalie60/Desktop/ULUDOTT/Uludott Web v0.2` klasörünün oluşturulması.
- [x] `feat/unified-clean-v0.2` dalının (branch) açılması.
- [x] Bağımlılıkların (`node_modules`) yerel pnpm store üzerinden kurulması.

### Adım 2 — Demo/Test Kodlarının Temizlenmesi ve Varsayılan İçerik Eşitlemesi
- [x] `src/lib/config/local-demo.ts`, `src/modules/applications/application/local-demo-setup.ts`, `src/modules/events/ui/local-demo-application.tsx`, `scripts/setup-local-demo.ts`, `docs/operations/local-demo.md`, `tests/integration/local-demo-boundary.test.ts`, `tests/integration/local-demo-setup.test.ts`, `tests/unit/local-demo.test.ts` dosyalarının silinmesi.
- [x] `src/app/(public)/ulujam/page.tsx`, `src/styles/cinematic.css`, `src/modules/forms/application/public-form-service.ts`, `src/modules/applications/application/submit-ulujam.ts`, `src/modules/admin/application/panel-password.ts`, `package.json` ve `.env.example` içinden tüm `LOCAL_DEMO` / `demo:setup` referanslarının kaldırılması.
- [x] `src/modules/community/people-reference-data.ts` dosyasının sıfır `people_overrides` tablosuyla tüm referans topluluk verilerini eksiksiz sunmasının doğrulanması.

### Adım 3 — `batu-try` SEO, Kanonik URL, `robots.ts` ve `sitemap.ts` Entegrasyonu
- [x] `src/app/layout.tsx`: `generateMetadata` ile `metadataBase` ve `title` şablonunun tanımlanması; kök `robots: { index: false, follow: false }` ayarının kaldırılması.
- [x] Genel sayfalara (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/oyunlar`, `/iletisim`) ve detay sayfalarına `alternates: { canonical }` ve sayfa başlıklarının eklenmesi.
- [x] `src/modules/publication/service.ts` içine `listIndexablePublications` fonksiyonunun eklenmesi.
- [x] `src/app/robots.ts` ve `src/app/sitemap.ts` dosyalarının 6 genel rota (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/oyunlar`, `/iletisim`), yayımlanmış etkinlikler, duyurular ve oyunlarla uyumlu olarak eklenmesi.

### Adım 4 — `batu-try` Etiketli Veri Önbelleği (`cachePublicRead`) ve `revalidateTag` Entegrasyonu
- [x] `src/lib/cache/tags.ts` ve `src/lib/cache/public-read.ts` dosyalarının tüm genel veri alanlarını (`events`, `announcements`, `links`, `ulujam`, `historicalResults`, `media`, `people`, `siteGames`, `games`, `siteSettings`) kapsayacak şekilde eklenmesi.
- [x] `src/modules/publication/ui/public-queries.ts` dosyasının oluşturulması ve `Date` nesnesi dönüşümleriyle birlikte tüm genel okuma fonksiyonlarını sarmalaması.
- [x] Genel sayfaların (`src/app/page.tsx`, `/hakkimizda`, `/etkinlikler`, `/etkinlikler/[slug]`, `/oyunlar`, `/oyunlar/[slug]`, `/ulujam`, `/iletisim`, `Footer`) `public-queries.ts` üzerinden okuma yapması ve `UlujamComingSoon` içinde `await connection()` ile taze sayaç zamanının korunması.
- [x] Tüm admin ve yayın mutasyon HTTP işleyicilerine (`src/modules/publication/http.ts`, `src/modules/links/application/http.ts`, `src/modules/media/application/http.ts`, `src/app/api/admin/gallery/route.ts`, `src/app/api/admin/people/route.ts`, `src/app/api/admin/game-catalog/route.ts`, `src/modules/games/application/game-http.ts`, `src/modules/site-settings/application/http.ts`, `src/modules/forms/application/admin-http.ts`, `src/app/api/cards/publication-consent/route.ts`) `COMMIT` sonrası `revalidateTag(..., { expire: 0 })` çağrılarının eklenmesi.

### Adım 5 — `batu-try` Operasyonel Araçları, Yedekleme ve Testlerinin Entegrasyonu
- [x] `scripts/live-audit.ts` ve `package.json` `"audit:live"` script'inin eklenmesi.
- [x] `infrastructure/backup/pg-backup.sh`, `.gitattributes`, `docs/design/sunum-katmani-kurallari.md` ve `docs/operations/vds-olcum.md` dosyalarının eklenmesi.
- [x] `tests/unit/public-cache.test.ts`, `tests/unit/cache-invalidation.test.ts`, `tests/unit/live-audit.test.ts`, `tests/integration/sitemap-publications.test.ts` ve `tests/e2e/indexability.spec.ts` testlerinin birleşik mimariye uyarlanarak eklenmesi.

### Adım 6 — Sıfır Veritabanı (`uludott_v02`) Kurulumu ve Tam Yerel Doğrulama
- [x] Yerel PostgreSQL üzerinde sıfır `uludott_v02` veritabanının oluşturulması ve `.env.local` dosyasının bu temiz veritabanına yönlendirilmesi (`LOCAL_DEMO_MODE` olmadan).
- [x] `pnpm config:check`, `pnpm db:migrate` (26 migration) ve `pnpm db:seed:ulujam` (yalnızca 2026 gerçek derece sonuçları ve 2027 tarihsiz UluJam taslağı) komutlarının çalıştırılması; veritabanında 0 demo/test verisi olduğunun doğrulanması.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test` (76 dosya / 379 test), `pnpm build`, `pnpm security:wallet`, `pnpm security:source`, `pnpm audit:live` ve Playwright E2E testlerinin çalıştırılıp tümünün yeşil (`PASS`) olduğunun kanıtlanması.

---

## 3. Doğrulama Kanıtları ve Sonuç Raporu

### 3.1. Temiz Veritabanı (`uludott_v02`) Durumu
- **Kişisel / Demo / Test Kayıtları:** `admins=0`, `applications=0`, `submissions=0`, `submission_answers=0`, `submission_files=0`, `teams=0`, `forms=0`, `cards=0`, `wallet_passes=0`, `media_assets=0`, `people_overrides=0`, `site_game_entries=0`, `site_settings=0`, `links=0`, `announcements=0`.
- **Editoryal Temel Kayıtlar (`pnpm db:seed:ulujam`):**
  - `events=2` (`ulujam-2026` ve `ulujam-2027`, her ikisi `draft` statüsünde; yayınlanmamış UluJam taslağı `/sitemap.xml` ve `/etkinlikler` listesine sızmaz).
  - `games=3`, `awards=3` (UluJam 2026 gerçek derece oyunları: *Dream Fever*, *Masquerade*, *Shift Happens*).

### 3.2. Çalıştırılan Doğrulama Komutları ve Özeti

| Doğrulama | Komut | Sonuç | Kanıt Özeti |
|---|---|---|---|
| Sunucu Yapılandırması | `pnpm config:check` | ✓ PASS | `Sunucu yapılandırması geçerli.` |
| Tip Kontrolü | `pnpm typecheck` | ✓ PASS | `next typegen && tsc --noEmit` — 0 hata |
| Kod Kalitesi (Lint) | `pnpm lint` | ✓ PASS | `eslint . --max-warnings=0` — 0 hata, 0 uyarı |
| Birim + Entegrasyon + Güvenlik + Operasyon Testleri | `pnpm test` | ✓ PASS | **76 test dosyası, 379 test geçti** (`public-cache`, `cache-invalidation`, `live-audit`, `sitemap-publications`, `home-events`, `media`, `backup-restore` dahil) |
| Üretim Derlemesi | `pnpm build` | ✓ PASS | Next.js 16.3.8 (Turbopack) derlemesi 0 hatayla tamamlandı (`/robots.txt` ve `/sitemap.xml` dahil) |
| Cüzdan & Kaynak Sır Taraması | `pnpm security:wallet && pnpm security:source` | ✓ PASS | `{"files":3220,"secretHits":0,"forbiddenFiles":0}` ve `{"files":816,"secretHits":0,"forbiddenFiles":0}` |
| E2E İndeksleme & Genel Sayfa Testleri | `pnpm playwright test tests/e2e/indexability.spec.ts tests/e2e/public-pages.spec.ts tests/e2e/event-sections.spec.ts` | ✓ PASS | **10/10 E2E testi geçti** (6 genel rotada kanonik URL, `title`, `noindex` yokluğu; `/admin` ve `/api` üzerinde `noindex`; `/robots.txt` ve `/sitemap.xml` doğrulaması) |
| Canlı / Yerel Denetim CLI | `pnpm audit:live -- --url http://127.0.0.1:3002` | ✓ PASS | **6/6 uç nokta (` /`, `/robots.txt`, `/sitemap.xml`, `/admin`, `/l/__audit_invalid_id__`, `/media/__audit_invalid_id__`) `✓` ile geçti** |
