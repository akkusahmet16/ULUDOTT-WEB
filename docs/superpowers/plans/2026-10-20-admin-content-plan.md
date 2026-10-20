# Yönetim Paneli Yenilemesi — Plan ve Uygulama Raporu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yedi içerik alanını panelden yönetilebilir hale getirmek; yedi işin tamamını uygulamak ve doğrulamak.

**Architecture:** Mevcut yayın, yetkilendirme ve PostgreSQL altyapısı korunur. Kişiler mevcut override tablosuyla, editoryal oyun kartları ayrı katalog tablosuyla yönetilir. Yerel medya seçici kişi, oyun ve UluJam editörlerinde paylaşılır. Video, başvuru, arşiv ve iletişim ayarları sürümlü `site_settings` tablosunda saklanır.

**Tech Stack:** Next.js 16.3.8, React 19.3.0, TypeScript, PostgreSQL, Drizzle, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-admin-content-design.md`

## İşlerin durumu

| İş                             | Durum      | Sonuç                                                                                            |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| 1. Duyurular                   | Tamamlandı | Afiş yükleme, önizleme, taslak/yayın/arşiv, genel liste/detay ve ana sayfa bağlantısı.           |
| 2. Hakkımızda                  | Tamamlandı | Kişi ekleme, düzenleme, silme, bölüm/sıra ve klasörden fotoğraf/video seçimi.                    |
| 3. Oyunlar                     | Tamamlandı | Mevcut kartları düzenleme, yeni oyun ekleme, klasörden kapak, önizleme ve taslak/yayın/kaldırma. |
| 4. Ana sayfa UluJam videosu    | Tamamlandı | Güvenli YouTube bağlantısı, klasörden kapak ve video yayını.                                     |
| 5. UluJam başvuruları          | Tamamlandı | Ortak form seçimi, metinler, yayın/kapatma ve sunucuda gönderim engeli.                          |
| 6. UluJam arşivleri            | Tamamlandı | Yıl, fotoğraf, derece oyunları, sıra, önizleme ve yayın yönetimi.                                |
| 7. İletişim ve alt bağlantılar | Tamamlandı | Ortak metin, e-posta, telefon ve sıralı sosyal bağlantılar.                                      |

## Global Constraints

- Yeni ürün bağımlılığı eklenmez; yerel Next.js belgeleri esas alınır.
- Kullanıcının mevcut değişiklikleri, genel site tasarımı ve başvuru/rıza akışları korunur.
- Kişi ve oyun medyası yalnız izinli, önceden yüklenmiş klasörlerden seçilir.
- Yazma işlemleri oturum, izin, CSRF, revision kontrolü ve audit gerektirir.
- Kullanıcının “kalan işlemleri tamamla” talimatıyla 4–7 de uygulanır; dağıtım ve toplu commit kapsam dışıdır.

## Review Focus

1. Silinen başlangıç kişisi veya oyunu fallback nedeniyle yeniden görünmemeli; ilgili entegrasyon testleri bunu kanıtlar.
2. Başka bölümdeki kişi taşındığında kimliği korunmalı, sıra deterministik olmalı; kişi entegrasyon testi bunu sınar.
3. Türkçe/boşluk içeren dosyalar seçilebilmeli; traversal ve symlink reddedilmeli; envanter testi bunu sınar.
4. İki yönetici aynı revision ile kaydettiğinde biri 409 almalı; kişi ve katalog testleri bunu sınar.
5. Duyuru, kişi ve oyun editörlerindeki hata/kayıt durumu erişilebilir olmalı; tarayıcı testleri ve mobil kontrol bunu sınar.

---

### Task 1: Duyuru yönetimi ve yayın

**Files:** Create `src/app/admin/duyurular/page.tsx`, `src/app/api/admin/announcements/route.ts`, `src/app/(public)/duyurular/page.tsx`, `src/app/(public)/duyurular/[slug]/page.tsx`; modify `src/modules/publication/ui/content-editor.tsx`, `src/modules/publication/domain.ts`, `src/modules/admin/ui/admin-navigation.tsx`, `src/components/layout/header.tsx`, `src/app/page.tsx`; test `tests/e2e/admin-content.spec.ts`.

**Interfaces:** Existing `handler("announcement")`, `getPublicAnnouncements()`, `getPublicAnnouncement(slug)`, `ContentView`, `ContentCard` are reused. Poster upload uses `/api/admin/media` with `purpose=poster`; announcement publication policy remains existing service policy.

- [x] Write browser acceptance test: login → create announcement → upload/select poster → save → preview → publish → find same title/body on public page → remove → public 404.
- [x] Run test and observe missing route failure.
- [x] Add protected management/API and public list/detail routes; connect navigation and home announcements; enable announcement poster upload and automatic slug.
- [x] Run publication integration tests and browser acceptance test; verify mobile editor layout.

### Task 2: Kişi ekleme, silme ve klasörden medya seçimi

**Files:** Create `src/modules/media/application/site-assets.ts`, `src/modules/media/ui/site-asset-picker.tsx`, `src/app/api/admin/site-assets/route.ts`, `src/modules/community/people-domain.ts`; modify `src/modules/community/people-content.ts`, `src/modules/community/people-editor.tsx`, `src/app/api/admin/people/route.ts`, `src/app/admin/people/page.tsx`; test `tests/integration/people-content.test.ts`, `tests/unit/site-assets.test.ts`, `tests/e2e/admin-content.spec.ts`.

**Interfaces:** `listSiteAssets(scope: "people" | "games" | "ulujam"): Promise<SiteAsset[]>`, `assertSiteAsset(path, scope, kind): Promise<void>`; `savePeopleMember(actor,input)` and `removePeopleMember(actor,slot,expectedRevision)` extend existing list/save/get functions without removing their signatures. `SiteAssetPicker` accepts scope, kind, value, onChange and label.

- [x] Add failing tests: create member in selected chapter; move/reorder member; delete default/new member permanently from public output; reject stale revision, invalid chapter and forbidden media path. Test local asset inventory, Unicode names and symlink rejection.
- [x] Run new tests and observe missing functionality failures.
- [x] Implement safe media inventory, protected API, reusable visual picker and dynamic person overrides with tombstones; preserve existing field edits.
- [x] Implement person creation/editing/removal, chapter/order controls and media pickers; update obsolete fixed-slot help.
- [x] Run people and asset tests; browser verifies new person appears at chosen placement and disappears after deletion.

### Task 3: Oyun kartları kataloğu

**Files:** Create `src/db/schema/site-games.ts`, generated migration, `src/modules/games/domain/site-games.ts`, `src/modules/games/application/site-game-service.ts`, `src/modules/games/ui/site-game-editor.tsx`, `src/modules/games/ui/site-game-card.tsx`, `src/app/api/admin/game-catalog/route.ts`; modify `src/db/schema/index.ts`, `src/app/admin/oyunlar/page.tsx`, `src/app/(public)/oyunlar/page.tsx`; test `tests/integration/site-games.test.ts`, `tests/e2e/admin-content.spec.ts`.

**Interfaces:** `listSiteGames(actor)`, `listPublishedSiteGames()`, `saveSiteGame(actor,input,id?,expectedRevision?)`, `removeSiteGame(actor,id,expectedRevision)`; `SiteGameCard({game})` renders existing public card design. Default No Time To Die/InFrame cards merge with DB overrides by stable ID.

- [x] Add failing integration tests: defaults match current cards; new draft hidden; published local-cover game visible; updates preserve ID/order; removed defaults do not resurrect; reject traversal, stale revision and unauthorized actor.
- [x] Run tests to observe missing catalog failure.
- [x] Add schema/migration, validated catalog service, audit and optimistic concurrency. Keep team-linked games and permissions separate.
- [x] Add visual game editor and shared public preview/card, replace static showcase array; retain current degree/results and advanced UluJam management.
- [x] Run game tests and browser create/edit/publish/remove flow.

### Task 4: Ana sayfa UluJam videosu

**Files:** `src/components/layout/story-panels.tsx`, `src/app/page.tsx`, `src/modules/site-settings/`, `src/app/admin/ulujam/page.tsx`, `/api/admin/ulujam-settings`; migration `0025_site_settings`.
**Interfaces:** `getUlujamPresentation()` returns video ID, cover, title, description and revision; admin mutation validates YouTube URL.

- [x] Test YouTube short/watch URLs, invalid host/protocol rejection and revision conflict.
- [x] Persist settings and expose protected admin editor with cover picker.
- [x] Replace hard-coded video/presentation with settings; verify popup behavior and saved URL on home page.

### Task 5: UluJam başvuru sayfası ve kolon yayını

**Files:** `src/modules/forms/application/public-form-service.ts`, `src/modules/events/ui/ulujam-coming-soon.tsx`, `src/components/layout/story-panels.tsx`, `src/app/(public)/basvuru/[formSlug]/page.tsx`; UluJam admin settings.
**Interfaces:** Presentation settings consume existing form `slug`, `state`, `version`, `eventId`; same published form state drives both public locations.

- [x] Test closed/open/expired/draft forms and rejection of submissions after closure.
- [x] Add admin selection of event/form, title, description, CTA and publication controls.
- [x] Apply public theme to application page; link only currently open forms from UluJam popup/page; verify full application flow remains intact.

### Task 6: Çok yıllı UluJam arşivi

**Files:** `src/app/(public)/ulujam/page.tsx`, `src/modules/events/ui/ulujam-archive.tsx`, `src/modules/site-settings/`, `src/app/admin/ulujam-arsivleri/page.tsx`, `/api/admin/ulujam-archives`.
**Interfaces:** `listPublishedArchives()` returns year, text, ordered gallery, ordered games; scope `ulujam` uses Task 2's asset picker.

- [x] Test two published years, unpublished year exclusion, same template output and independent gallery/game order.
- [x] Add year editor with preset photos and published game selection.
- [x] Remove 2026-only strings/assets from template; render each year with same layout; verify 2026 output preserved.

### Task 7: İletişim ve footer bağlantıları

**Files:** `src/app/(public)/iletisim/page.tsx`, `src/components/layout/footer.tsx`, `src/app/admin/linkler/page.tsx`, `src/modules/site-settings/`, `src/app/admin/iletisim/page.tsx`, `/api/admin/contact-settings`.
**Interfaces:** `getContactSettings()` supplies text, email, phone and ordered social accounts to both consumers.

- [x] Test shared updated URLs, removal without fallback resurrection, HTTPS/mailto/tel validation and revision conflicts.
- [x] Add admin contact editor and shared settings persistence.
- [x] Replace page/footer constants; preserve brand icons and Link Center behavior; browser verifies both surfaces after one update.

## Uygulama kaydı

- 20 Ekim 2026: Plan ve tasarım hazırlandı. Kullanıcı ilk üç işin doğrudan uygulanmasını istedi; ek plan onayı beklenmeden mevcut çalışma dalında uygulanacak. Aktif dal `codex/cinematic-theme`; kullanıcıya ait kaydedilmemiş değişiklikler korunacak, toplu commit yapılmayacak.
- Son durum: Kullanıcının devam talimatıyla 4–7 de uygulandı. Yedi içerik alanının tamamı panelden yönetilebilir.
- Başvuru: Sorular ve açılış/kapanış tarihleri mevcut Form oluşturucuda; seçili form ve yayın metinleri UluJam yönetiminde düzenlenir. Kapatılmış/eski seçili formların kimlik geçmişi sunucuda tutulur; seçim kaldırmak eski formu yeniden açmaz.
- Arşiv: Kaydedilmemiş varsayılan 2026 arşivi eski oyun yayın filtrelerini ve mevcut galeriyi korur. Arşiv editöründen kaydedildikten sonra yılın fotoğrafları/oyunları ve yayını bu yeni kayıttan yönetilir.
- İletişim: Footer ve iletişim sayfası ortak ayar kullanır; Bağlantı Merkezi ayrı kalır ve buradaki eski kayıtlar silinen sosyal hesapları geri getirmez.
- Son bağımsız incelemede bulunan iki konu giderildi: varsayılan 2026 oyunlarının eski yayın durumuna uyması ve kapalı başvuru mesajının her yerde aynı olması. Sosyal marka simgelerinin gecikmeli yükleme regresyonu da düzeltildi.
- Veritabanı: `0024_site_game_catalog` ve `0025_site_settings` yerel veritabanına uygulandı; seed/test içeriği eklenmedi. Önceki migration geçmişi korunur.
- Ortak seçici yalnız izinli klasörlerdeki önceden yüklenmiş dosyaları listeler; Türkçe karakter/boşluk, dosya türü ve klasör sınırı test edildi.
- İlk üç işin kod incelemesi: Bağımsız salt okunur incelemede kritik/önemli bulgu yok. İki küçük bulgu da giderildi: uzun başlık adreslerinin tireyle kesilmesi ve silme penceresinde hata duyurusu. Genel düğme stilinin galeri kartlarını bozması görsel kontrolde yakalanıp düzeltildi.
- Kullanım rehberi: `docs/operations/admin-content.md`.

## Doğrulama sonuçları

| Kontrol             | Sonuç                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tüm Vitest testleri | 65 dosyada 301 test geçti. Seçili açık forma gerçek gönderim kabulü ayrıca doğrulandı.                                                                                                                         |
| Tarayıcı kabulü     | 13 ilgili senaryo geçti: duyuru/kişi/oyun, UluJam video/başvuru/arşiv, ortak iletişim, oturum/CSRF, mobil/masaüstü ikonlar ve sunum panelleri. Ek takım CSRF testi de geçti; takım giriş akışındaki hata mesajı kontrolü aşağıda açıklanmıştır. |
| TypeScript          | `pnpm typecheck` başarılı.                                                                                                                                                                   |
| Lint                | `eslint . --max-warnings=0` başarılı.                                                                                                                                                        |
| Migration kontrolü  | `pnpm db:check` başarılı.                                                                                                                                                                    |
| Üretim derlemesi    | Başarılı; açık geliştirme sunucusu korunarak `.next/verification` içinde doğrulandı.                                                                                                         |

Derlemede mevcut `src/lib/config/wallet.ts:44` dosyasından tüm proje için dosya izleme uyarısı bulunuyor; derlemeyi engellemiyor. Bu görevde Wallet yapılandırması değiştirilmedi. Değiştirilen kaynaklarda whitespace kontrolü temiz; tüm çalışma ağacında önceden bulunan `tasarim-girdileri/03-hakkimizda/places/README.md` dosyasının sonundaki boş satır korunmuştur.

Masaüstü/telefon ekran görüntüleri `.local/admin-content-preview/` altında incelendi. Canlı sunucuya dağıtım, push veya toplu commit yapılmadı; kullanıcıya ait mevcut değişiklikler çalışma ağacında korundu.

## Ek takım testi sınırlaması

Ek olarak çalıştırılan `tests/e2e/team-page.spec.ts` başvuruyu ve yeni takım makbuzunu başarıyla oluşturdu; hatalı parolayla giriş adımında beklenen “Takım erişimi geçersiz” yerine “Alanları ve kuralları kontrol edin.” dönmesi nedeniyle durdu. Bu yüzden o tarayıcı senaryosunun sonraki giriş/çıkış adımları doğrulanmış sayılmaz. Takım giriş kaynak kodu ve bu eski test değiştirilmedi. Takım servisinin giriş, oturum izolasyonu, erişim yenileme ve hız limiti entegrasyon testi tüm test paketinde geçti.

Doğrulama kayıtları: `.superpowers/admin-remaining-tests-verified.log`, `.superpowers/admin-remaining-browser-verified.log`, `.superpowers/admin-application-open-submit.log`, `.superpowers/admin-remaining-build.log`.

## Yerel admin giriş hatası düzeltmesi

20 Ekim 2026: Safari `localhost:3001` üzerinden açılırken `APP_URL` değeri `127.0.0.1:3001` olduğu için imzalı giriş isteği origin kontrolünde reddediliyordu. Hata gerçek sunucuda ve yeni testlerde yeniden üretildi. Yalnız geliştirme ortamında, aynı HTTP portundaki bu iki loopback adresi kabul edilir; üretimde tam origin eşleşmesi, imza/çerez/oturum ve cross-site denetimleri korunur.

Doğrulama: 311 otomatik test, iki yerel adreste giriş/yenileme/çıkış dahil 7 tarayıcı testi, TypeScript, lint ve üretim derlemesi geçti. Safari'de de istek doğrulama hatasının kalktığı görüldü. Tanılama sırasında yerel hesap sayacına eklenen dört test denemesi geri alındı ve denetim kaydı bırakıldı; parola değiştirilmedi.
