# Uludott platformu — tam uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking. The user requested file-by-file review with the assistant; do not delegate implementation.

Tarih: 2 Ekim 2026. Durum: kullanıcı başlatma talimatıyla yürütülüyor; Görev 1–23 tamamlandı (Google demo kabulü dahil); Google genel yayın erişimi bekliyor. Görev24 Apple Wallet kullanıcı kararıyla ertelendi; Görev25 birleşik yönetim paneli ve Görev26–27 güvenlik/veri yaşam döngüsü tamamlandı; sıradaki uygulanabilir kod görevi28. Bu dosyadaki kutular, ilgili adım kanıtla tamamlanmadan işaretlenmez.

**Goal:** Uludott topluluk sitesi, genel etkinlik/form/duyuru/link yönetimi, UluJam takım ve onay akışları, 2026 arşivi, 2027 “Yakında” alanı, derece oyunları ve onay sonrası Wallet kartlarını sıfırdan güvenli ve sürdürülebilir biçimde üretmek.

**Architecture:** Node üzerinde Next.js App Router ile modüler tek web uygulaması, PostgreSQL/Drizzle veri katmanı ve aynı depodan çalışan ayrı outbox worker kurulur. Medya S3 uyumlu depoda tutulur; harici hizmetler adapter arayüzlerinden çağrılır. Her aşama tek başına çalışan, test edilebilir bir ürün artışı üretir.

**Tech Stack:** Kararlı Next.js/React, desteklenen Node LTS, strict TypeScript, PostgreSQL, Drizzle, Zod, CSS Modules ve tasarım token'ları, S3 uyumlu nesne deposu, PostgreSQL outbox, Vitest, Playwright, axe, k6, CDN/WAF ve sunucuda doğrulanan Turnstile. Tam sürümler ilk görevde resmi kaynaklardan doğrulanıp lockfile'a sabitlenir. İlk aşamada Redis kullanılmaz.

**Spec:** docs/design/2026-10-01-mimari-oneri.md. Bu planı yürüten kişi her göreve başlamadan bu tasarımın ilgili bölümünü ve bu planın global kurallarını yeniden okur. Çelişkide kendiliğinden kapsam değiştirmez; plan/spek düzeltmesini incelemeye sunar.

## Global kısıtlar

- Genel ziyaretçi ve katılımcı için hesap açma/giriş yoktur; yalnızca yönetici hesapları, takım oturumları ve bireysel makbuz/kart erişimi vardır.
- Yeni üretim veritabanında kişi, başvuru, takım ve kart kayıtları sıfırdır. 2026 üç derece bağlantısı ayrı, kişisel veri içermeyen idempotent editoryal başlangıç içeriğidir. Sahte takım veya kişi seed edilmez.
- 2027 UluJam tarihi bilinmiyor: tarih yayımlanana kadar “Yakında” görünür, sayısal geri sayım ve başvuru açılmaz.
- 2026 derece sırası ve URL'ler: 1. https://subzero-41.itch.io/lost-pieces; 2. https://kmevciman.itch.io/lostchildsoul; 3. https://kairosthegeek.itch.io/project-sw. Oyun adı, takım, yapımcı, açıklama ve görsel bilinmiyorsa NULL kalır.
- UluJam formunda telefon zorunludur, oyuncu adı/takma ad alınmaz, seçilen her beceriye 1–5 seviye verilir, birden çok beceride açıklama zorunludur. Dört katılım modu vardır: solo, seeking, new, existing.
- Başvuru makbuzu hemen verilir. Aktif web kartı ve Apple/Google Wallet hakkı yalnızca yönetici tarafından onaylanan takım kadrosu veya bireysel katılım sonrasında açılır. Onaylı takıma geç gelen üye ayrıca onay bekler.
- Genel form oluşturucuda kısa/uzun metin, e-posta, telefon, sayı, tarih, tek/çoklu seçim, açılır liste, onay kutusu, radyo, derecelendirme, bilgi metni, bölüm başlığı ve açık rıza alanları vardır. Dosya alanı ilk sürümde kapalıdır.
- Gerçek tarih, konum, topluluk URL'si, 2026 fotoğrafının aidiyeti, yayın adı veya Wallet sağlayıcısı hazır oluşu uydurulmaz. Coffee Talk gerçek veri gelene kadar taslaktır.
- Kaynak klasördeki Wallet secrets içeriği bu plan için okunmaz; depo kurulmadan önce proje dışına alınır ve hiçbir commit, build veya istemci paketine girmez.
- Kesin barındırma sağlayıcısı, veri bölgesi ve ücretli kaynaklar bütçe/trafik/geri dönüş hedefleri belirlenmeden seçilmez veya oluşturulmaz. Yerel geliştirme bu girdiler olmadan ilerler.
- 2 Ekim ek girdisi: hedef Ubuntu VDS 40 GB diskli, yaklaşık 15 GB mevcut bot/servis verisi kullanıyor. Disk ve botla kaynak paylaşımı dikkate alınır; canlı aday yerleşim değerlendirmesi docs/operations/vds-assessment.md içindedir. RAM/vCPU ve gerçek kullanım ölçümü gelmeden canlı kapasite kabulü verilmez; yerel Compose canlı kurulum kararı değildir.
- Donanım netleştirmesi: 4 GB RAM, 2 CPU (2000 MHz); bot boşta yaklaşık %2 RAM/%3 CPU ve panelde %29 disk göstergesi. Başlangıç canlı yerleşimi systemd + standalone web/ayrı worker + yerel PostgreSQL, harici S3 medya ve harici yedektir. CPU/RAM tepe ölçümü ve disk `df` kontrolü canlı kabul koşuludur; bot DB'sini taşımak bu projenin kapsamına eklenmez.
- Güvenlik, hukuk, Apple sertifikası ve Google yayın erişimi dış bağımlılıkları açık statüyle raporlanır; kanıt yokken “tamamlandı” işaretlenmez.

## Review Focus — her biri ilgili görevde test edilir

1. Aynı idempotency anahtarıyla farklı başvuru gövdesi gelirse ikinci kayıt açılmadan 409 döner (Görev 12).
2. Onaylı takıma sonradan katılan üyenin Wallet hakkı, mevcut üyelerin hakkını bozmadan bekler (Görev 18 ve 22).
3. Eski outbox işi yeni derece/kart revision'ını geri alamaz (Görev 21).
4. 2027 tarihi boşken sayaç görünmez; tarih kaldırılınca tekrar “Yakında” görünür (Görev 9).
5. 2026 tarihî sonuçları yalnızca derece+URL ile görünür; yeni yılın eksik oyun kaydı tam sonuç gibi yayımlanamaz (Görev 8 ve 20).

## Her görevde zorunlu dosya kontrolü ve değişiklik disiplini

Bu protokol aşağıdaki bütün görevlerin ve her bir kutucuk adımının ilk ve son kontrolüdür; atlanamaz. Her kutucuğa başlamadan o adımın okuyacağı/değiştireceği dosyayı aç; kutucuğu kapatmadan aynı dosyanın son hâlini ve diff'ini yeniden oku. Bir görev birden çok kutucuk içeriyorsa dosya kontrolü yalnızca görev sonunda yapılmış sayılmaz.

1. **Başlamadan önce:** Bu planın global kısıtlarını ve görevin dayandığı mimari öneri bölümünü oku. Görevde listelenen mevcut dosyaları aç; yeni projede henüz yoksa yokluğunu kaydet. Önceki görevlerin çıktılarını ve çalışma ağacı durumunu kontrol et. Yalnızca görevin listelenen dosyalarına ve onların doğrudan gerektirdiği test/belge dosyalarına dokun.
2. **Kırmızı test:** Görevin beklenen davranışını kanıtlayan testi önce yaz; çalıştır ve hedef nedenle başarısız olduğunu gör. Sadece yapılandırma veya belge görevlerinde uygulanabilir kontrol komutu önce tanımlanır.
3. **En küçük uygulama:** Testi geçiren ve mimari sınırları koruyan kodu yaz. Doğrulama, yetki ve veritabanı kısıtını yalnızca UI'da bırakma.
4. **Dosya incelemesi:** Değişen her dosyanın tamamını ve diff'ini oku; isimler, import yönü, kişisel veri/sır sızıntısı, rol kontrolü, Türkçe metinler ve kapsam taşması açısından kontrol et. diff --check, typecheck, ilgili test ve gerektiğinde build çalıştır.
5. **Kapanış:** Dosya listesi, geçen komutlar, başarısız/bekleyen doğrulamalar ve kalan riskleri görev kaydına yaz; ancak sonra kutuyu işaretle. Git kurulduktan sonra yalnızca incelenmiş dosyaları anlamlı küçük commit ile kaydet. Sonraki göreve ancak bu kontrol tamamlandığında geç.

Geliştirme sırasında istek değişirse, yeni gereksinimi kodun içine sessizce ekleme veya var olan gereksinimi çıkarma. Önce mimari öneri ve bu planın ilgili görevi aynı değişiklikle güncellenir, etki açıklanır ve yeni metin incelenir. Güvenlik açığı gibi zorunlu düzeltmeler de kapsam ve test gerekçesiyle kaydedilir.

## Dosya haritası ve arayüz sınırları

Proje henüz boş olduğundan aşağıdaki yollar hedef dosya haritasıdır. İsim değişikliği uygulanmadan önce plan dosyasında aynı adımla güncellenir.

- package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, eslint.config.mjs, .gitignore, .env.example, compose.yaml, Dockerfile: tekrar üretilebilir yerel/üretim çalışma ortamı.
- src/app/page.tsx, src/app/(public)/hakkimizda/page.tsx, src/app/(public)/ulujam/page.tsx, src/app/(public)/etkinlikler/page.tsx, src/app/(public)/duyurular/page.tsx, src/app/(private)/takim/[token]/page.tsx, src/app/(private)/kart/[token]/page.tsx, src/app/admin/page.tsx ve görevlerde adlandırılan route.ts dosyaları: yalnızca sayfa ve ince HTTP girişleri.
- src/components/design-system/*, src/components/layout/*, src/styles/tokens.css: ortak erişilebilir arayüz ve marka kuralları.
- src/modules/{events,announcements,forms,applications,teams,matching,cards,wallet,games,links,media,admin,community}/{domain,application,infrastructure,ui}: her ürün alanının kuralları, işlemleri, veri adapter'ları ve ekranları; mini oyunların saf mantığı community modülündedir.
- src/lib/{auth,security,database,queue,config,logging,validation}: yalnızca modüller arası altyapı.
- src/db/schema/*, src/db/migrations/*, src/db/seeds/2026-results.ts: ilişkiler, migration ve kişisel veri içermeyen tarihî içerik.
- src/worker/*: outbox tüketicisi, görsel/bildirim/Wallet işleri.
- tests/{unit,integration,e2e,accessibility,security,load}/*: katmana göre kanıt.
- docs/{architecture,product,operations,security}/*: geliştirici ve işletme belgeleri.

Ortak sözleşmeler ilk görevlerde sabitlenir: Actor = {adminId, roles, eventScopes}; CommandResult<T> = success(value) veya domainError(code); Clock.now() UTC; EventId, TeamId, ParticipantId ve FormId opak kimliktir. Sayfa ve API dosyaları modül servislerini çağırır; doğrudan SQL, imzalama anahtarı veya Wallet HTTP işlemi içermez. Servisler transaction sınırını açıkça belirler. Her modül dışa yalnızca public index üzerinden tip ve kullanım fonksiyonu verir.

## Aşama 1 — temel, güvenli yönetim ve halka açık içerik

### Görev 1 — depo, sırların ayrılması ve çalışma ortamı

**Dosyalar:** Oluştur: .gitignore, package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, eslint.config.mjs, .env.example, compose.yaml, Dockerfile, README.md, src/lib/config/server.ts, src/app/layout.tsx, src/app/page.tsx, tests/integration/bootstrap.test.ts. İncele: mimari öneri ve mevcut Media/Logo Pack dosya listesi; Wallet secrets içeriği açılmaz.

Görev 1 yardımcı dosyaları: .dockerignore, .node-version, pnpm-workspace.yaml, vitest.config.ts, playwright.config.ts, scripts/{check-config.ts,migrate.mjs}, tests/helpers/server-only.ts, tests/e2e/bootstrap.spec.ts, tests/integration/infrastructure.test.ts, infrastructure/garage.toml ve docs/operations/{progress,vds-assessment}.md. Yerel S3 depo Garage v2.3.0'dır; bakım almayan eski MinIO Community imajı kullanılmaz. Gerçek Docker/DB/S3 kabulü tamamlanmadan görev kapatılmaz.

**Arayüz:** Üretir: pnpm dev, pnpm test, pnpm test:integration, pnpm test:e2e, pnpm typecheck, pnpm lint, pnpm build, pnpm db:migrate komutları; yalnızca sunucuda kullanılan yapılandırma yükleyicisi src/lib/config/server.ts.

- [x] Gizli klasörün proje dışına alınacağı güvenli konumu ve ignore kurallarını belirle; dosya içeriğini yazdırmadan Git/build kapsamı dışı olduğunu kontrol et. Kanıt: docs/operations/progress.md §1.1.
- [x] Desteklenen kararlı Node/Next/React/Drizzle/Zod sürümlerini doğrula; package manager ve lockfile'ı sabitle. Kanıt: docs/operations/progress.md §1.2 ve §1.4, frozen lockfile kurulumu.
- [x] Yerel PostgreSQL ve S3 uyumlu depo için compose, env.example ve kurulum testi yaz; ilk çalıştırmada beklenen eksik yapılandırma hatasını doğrula.
- [x] En küçük Next.js uygulamasını ve komutları kur; boş veritabanıyla açılan ana sayfa testini geçir.
- [x] Gizli klasör proje dışına alınıp ignore doğrulandıktan sonra Git deposunu başlat; bütün oluşturulan dosyaları ve build çıktısını sır taramasından geçir; README'ye ilk gün kurulumunu ekle; global dosya kontrolünü uygula ve commit et.

### Görev 2 — veritabanı omurgası, transaction ve denetim kaydı

**Dosyalar:** Oluştur: src/lib/database/client.ts, src/lib/database/transaction.ts, src/lib/queue/outbox.ts, src/db/schema/{admin,content,forms,ulujam,wallet,links,operations}.ts, src/db/migrations/*, src/lib/logging/audit.ts, tests/integration/schema.test.ts. Doğrudan yardımcı dosyalar: src/db/schema/{shared,index}.ts, src/lib/database/migrate.ts, scripts/migrate.ts (migrate.mjs yerine), drizzle.config.ts, tests/helpers/local-database.ts, docs/architecture/database.md.

**Arayüz:** Üretir: withTransaction<T>(work: (tx: DbTx) => Promise<T>): Promise<T>; appendAudit(tx, actor, action, object, redactedChanges): Promise<void>; enqueue(tx,type,aggregateId,revision,payload): Promise<void>; migrateEmptyDatabase(): Promise<void>. Görev 21 bu kayıtların işlenmesini ekler.

- [x] Şemadaki FK, CHECK, unique, zaman ve indeks kararlarını ER diyagramında yaz; kişisel veri tablolarının boş açılacağını doğrulayan kırmızı test ekle.
- [x] Aynı migration'ı boş veritabanına uygulama ve ikinci kurulumda beklenmeyen kişisel seed olmaması testini çalıştır.
- [x] Şema, transaction yardımcısı ve migration'ları uygula; testleri geçir.
- [x] Gerçek PostgreSQL ile rollback ve unique ihlali testlerini çalıştır; dosyaları ve migration SQL'ini satır satır inceleyip commit et.

### Görev 3 — yönetici kimliği, roller ve oturumlar

**Dosyalar:** Oluştur: src/modules/admin/{domain/permissions.ts,application/auth-service.ts,infrastructure/admin-repository.ts,ui/login-form.tsx}, src/lib/auth/{session.ts,csrf.ts}, src/app/admin/{page.tsx,layout.tsx}, src/app/api/admin/{login,logout}/route.ts, tests/integration/admin-auth.test.ts, tests/e2e/admin-login.spec.ts.

Görev 3 doğrudan yardımcı dosyaları: src/lib/config/auth.ts, src/lib/auth/crypto.ts, src/modules/admin/{index.ts,application/bootstrap-admin.ts,application/http.ts}, src/app/api/admin/{csrf,session,session/renew}/route.ts, scripts/admin-bootstrap.ts, tests/helpers/start-e2e.ts ve docs/operations/admin-auth.md; next.config.ts, playwright.config.ts ve package.json, scripts/check-config.ts güncellemeleri. Mevcut admin/session şeması migration ile kilitlenme, TOTP replay ve mutlak oturum süresi alanlarına genişletilir.

**Arayüz:** Üretir: authenticateAdmin(email,password,mfaCode): Promise<AdminSession>; requirePermission(actor,permission,eventId?): void; revokeSession(sessionId): Promise<void>. İlk admin kurulumu CLI/işletme yönergesiyle yapılır; genel kayıt endpoint'i açılmaz.

- [x] Yanlış parola, kilitlenme, oturum yenileme/iptal, CSRF ve başka etkinlik verisine erişim reddi testlerini yazıp kırmızı durumunu gör.
- [x] Argon2id parola, kişiye özel admin, TOTP tabanlı MFA ve hash'lenmiş tek kullanımlık kurtarma kodları, HttpOnly/Secure/SameSite oturum ve açık izin matrisini uygula.
- [x] API ve UI testlerini geçir; çerez, gizli yanıt ve rol kapsamını dosya incelemesinde kontrol edip commit et.

### Görev 4 — tasarım sistemi, kabuk ve erişilebilir gezinme

**Dosyalar:** Oluştur: src/styles/tokens.css, src/components/design-system/{button,field,card,dialog,status}.tsx ve stilleri, src/components/layout/{header,footer,public-shell}.tsx, src/app/(public)/{hakkimizda/page.tsx,ulujam/page.tsx,destek/page.tsx}, tests/e2e/navigation.spec.ts, tests/accessibility/shell.spec.ts. Değiştir: Görev 1'de oluşturulan src/app/page.tsx ve src/app/layout.tsx; ikinci bir kök page.tsx oluşturma.

**Arayüz:** Üretir: ortak Button, Field, Card, Status ve PublicShell bileşenleri; sunum bileşenleri veri/SQL bilmez.

- [x] Menü, tüm CTA'lar, mobil gezinme, klavye odak sırası ve boş sayfa durumlarını testle tanımla; kırmızı sonucu gör.
- [x] Antrasit/krem/mor/lime/sınırlı mercan token'larını, tipografi, odak ve reduced-motion kurallarını uygula; gerçek logo paketinin uygun varyantını yerleştir.
- [x] Playwright ve axe kontrollerini geçir; telefon/tablet/masaüstü ekranlarını elle incele; dosyaları okuyup commit et.

### Görev 5 — medya yükleme ve görsel yayını

**Dosyalar:** Oluştur: src/modules/media/{domain/media-policy.ts,application/media-service.ts,infrastructure/object-store.ts,ui/media-library.tsx}, src/app/api/admin/media/route.ts, tests/integration/media.test.ts, docs/operations/media.md.

**Arayüz:** Üretir: uploadMedia(actor,file,purpose): Promise<MediaAsset>; publishVariant(assetId,actor): Promise<PublicMediaUrl>; attachMedia(actor,content,assetId): Promise<void>. Mutasyonlar Actor ile yetkilendirilir. Yardımcı dosyalar: process-image.ts, media-repository.ts, HTTP servis/index, admin/medya/page.tsx, media/[variantId]/route.ts, tests/e2e/media.spec.ts; Next serverExternalPackages/tracing, .gitignore kök medya örüntüsü, admin ana sayfa bağlantısı ve test launcher güncellenir.

- [x] Sahte MIME, büyük/decompression riski, EXIF, HEIC yönü ve yayına çıkmamış orijinalin okunamaması testlerini yaz.
- [x] Özel orijinal, rastgele object key, doğrulanmış optimize WebP/AVIF/JPEG türevleri, alt metin ve silme etki önizlemesini uygula.
- [x] İki mevcut HEIC dosyasını aidiyet doğrulanmadan 2026'ya bağlama; medya testlerini ve mobil görsel kontrolünü geçir; dosyaları inceleyip commit et.

### Görev 6 — etkinlik ve duyuru yayın akışı

**Dosyalar:** Oluştur: src/modules/events/{domain/event.ts,application/event-service.ts,infrastructure/event-repository.ts,ui/event-card.tsx,ui/event-editor.tsx}, src/modules/announcements/{domain/announcement.ts,application/announcement-service.ts,infrastructure/announcement-repository.ts,ui/announcement-card.tsx,ui/announcement-editor.tsx}, src/app/(public)/{etkinlikler/page.tsx,etkinlikler/[slug]/page.tsx,duyurular/page.tsx,duyurular/[slug]/page.tsx}, src/app/admin/{etkinlikler/page.tsx,duyurular/page.tsx}, src/app/api/admin/{events,announcements}/route.ts, tests/integration/publication.test.ts, tests/e2e/featured-event.spec.ts.

**Arayüz:** Üretir: publishEvent(id,actor,expectedRevision), publishAnnouncement(id,actor,expectedRevision), getFeaturedEvents(now), getPublicAnnouncement(slug,now). Tüm zamanlar UTC saklanır, İstanbul saatinde gösterilir. Ortak destek: src/modules/publication/{domain.ts,repository.ts,service.ts,http.ts,ui/*}; schema/content.ts ve forms.ts, migrations 0003/0004, medya silme referansları, header/home/admin bağlantıları, yayın rehberi ve ilgili test yardımcıları.

- [x] Taslak/planlı/yayımlı/bitti/iptal/arşiv, slug yönlendirmesi, önizleme ve yayın zaman penceresi testlerini yaz.
- [x] Etkinlik ve duyuru CRUD, medya/CTA ilişkisi, SEO/sosyal alanlar ve ana sayfa öne çıkarma akışını uygula.
- [x] Coffee Talk'u gerçek tarih/konum yokken taslak tut; yayımlanan etkinliğin afişini göster ama yayınlanmış form yokken çalışmayan başvuru CTA'sı üretme. Form bağlı tam akış Görev 14'te test edilir; dosyaları inceleyip commit et.

### Görev 7 — Uludott bağlantı merkezi

**Dosyalar:** Oluştur: src/modules/links/{domain/link.ts,application/link-service.ts,infrastructure/link-repository.ts,ui/link-hub.tsx}, src/app/(public)/linkler/page.tsx, src/app/admin/linkler/page.tsx, tests/integration/links.test.ts, tests/e2e/link-hub.spec.ts.

**Destek dosyaları:** ui/link-editor.tsx, application/{http.ts,link-qr.ts}, /api/admin/links, /api/links/[id]/qr ve /l/[id] rotaları; links schema ve 0005 migration/snapshot; header/admin menüsü, CSS, QR bağımlılıkları ve E2E helper; docs/operations/links.md, database/admin-auth/progress/README.

**Arayüz:** Üretir: saveLink(actor,input), reorderLinks(actor,orderedIds,expectedRevisions), getPublishedLinks(now): Promise<LinkGroup[]>.

- [x] Geçersiz şema/URL, kategori-sıra, zamanlı görünürlük, gizleme, kopyalama ve QR testlerini yaz.
- [x] Doğrulanmış iç/dış bağlantıları, ikon ve öne çıkarma düzenini uygula; bilinmeyen sosyal URL seed etme.
- [x] Mobil ve klavye görünümünü, dış link güvenliğini ve görev dosyalarını kontrol edip commit et.

### Görev 8 — 2026 tarihî sonuç bağlantıları

**Dosyalar:** Oluştur: src/modules/games/{domain/historical-result.ts,application/historical-results.ts,infrastructure/game-repository.ts,ui/result-card.tsx}, src/db/seeds/2026-results.ts, src/app/(public)/oyunlar/page.tsx, tests/integration/historical-results.test.ts, tests/e2e/2026-results.spec.ts.

**Destek dosyaları:** scripts/seed-2026.ts ve db:seed:2026 komutu; header/Oyunlar bağlantısı, link domain iç yol listesi, E2E seed helper ve axe listesi; tarihî sonuç işletme rehberi, README, DB belgesi ve ilerleme raporu. Migration gerekmez.

**Arayüz:** Üretir: seed2026Results(db): Promise<void>; listPublicHistoricalResults(year): Promise<HistoricalResult[]>; HistoricalResult eksik title/team/credits/image/description için null kabul eder.

- [x] Üç URL'nin 1/2/3 sırasını, seed tekrarında çift kayıt olmamasını ve kişi/takım tablosunun boş kalmasını test et.
- [x] “Kısmi editoryal kayıt” durumunu ve derece + itch.io linki gösteren, eksik bilgi uydurmayan kartı uygula.
- [x] Yeni yılların eksik tam sonuç kaydını bu istisnadan yararlandırmayan testi geçir; dosyaları inceleyip commit et.

### Görev 9 — UluJam 2026 arşivi, 2027 yakında ve mini oyunlar

**Dosyalar:** Oluştur: src/modules/events/ui/{ulujam-archive,ulujam-coming-soon,countdown}.tsx, src/modules/games/ui/finalist-list.tsx, src/modules/community/{star-catch,pair-match,game-logic}.tsx, tests/unit/countdown.test.ts, tests/unit/mini-games.test.ts, tests/e2e/ulujam-years.spec.ts. Değiştir: Görev 4'teki src/app/(public)/ulujam/page.tsx.

**Arayüz:** Üretir: countdownState(publishedStartAt,now): ComingSoon | Counting | Started; arşiv görselleri yalnızca doğrulanmış medya ilişkisinden gelir.

- [x] Tarih null, tarih geri çekilmiş, yayımlı gelecek tarih ve etkinlik başlamış durumlarını test et; boş tarihte sayı görünmediğini kanıtla.
- [x] 2026 galeri/finalist slotları ile 2027 “Yakında” alanını uygula; gerçek tarih yayımlanana kadar başvuru CTA'sı açma.
- [x] Kısa yıldız/hafıza oyunlarının fare-dokunmatik-klavye ve reduced-motion testlerini geçir; arşive doğrulanmamış HEIC atama; dosyaları inceleyip commit et.

### Aşama 1 kontrol kapısı

- [x] Boş PostgreSQL kurulumu, editoryal 2026 üç sonuç linki, 2027 “Yakında”, menü/rotalar, medya ve içerik/link yönetimi testleri geçer.
- [x] Admin dışında hesap açma yolu, yanlışlıkla yayımlanan kişi/takım ve işlenmemiş sır dosyası yoktur.
- [x] Değişen dosyaların tamamı incelenir; Aşama 1 kanıtı docs/operations/phase-1-acceptance.md dosyasına yazılır.

## Aşama 2 — genel etkinlik formu altyapısı

### Görev 10 — form şeması, alan tipleri ve koşul motoru

**Dosyalar:** Oluştur: src/modules/forms/{domain/field-types.ts,domain/form-version.ts,domain/condition.ts,application/form-validator.ts,infrastructure/form-repository.ts}, src/db/migrations/0007_form_versioning.sql (Drizzle custom/journal), tests/unit/form-conditions.test.ts, tests/integration/form-versions.test.ts.

**Arayüz:** Üretir: validateFormDefinition(input): ValidFormDefinition; evaluateVisibility(definition,answers): VisibleFieldIds; validateSubmission(version,answers): ValidatedAnswers. Yayınlanan FormVersion değişmezdir; alan ID'si sürümler arasında kararlıdır.

- [x] Şartnamedeki bütün alan türleri, tip uyuşmazlığı, döngü, olmayan alan referansı ve gizli koşullu alan değerinin reddi için testleri yazıp kırmızı sonucu gör.
- [x] Alan kayıtları, güvenli izinli operatörlü JSON koşulları ve merkezi sunucu doğrulamasını uygula; keyfi JavaScript/SQL yürütme yolu açma.
- [x] Form v1 yanıtının v2 etiket/alan değişikliğinden etkilenmediğini gerçek PostgreSQL'de doğrula; bütün dosyaları inceleyip commit et.

### Görev 11 — panelde form oluşturma, önizleme ve yayınlama

**Dosyalar:** Oluştur: src/modules/forms/{application/form-service.ts,ui/form-builder.tsx,ui/form-preview.tsx,ui/form-settings.tsx}, src/app/admin/formlar/{page.tsx,[formId]/page.tsx}, src/app/api/admin/forms/{route.ts,[formId]/route.ts}, tests/e2e/form-builder.spec.ts.

**Arayüz:** Üretir: createDraftForm(actor,eventId,settings), saveDraftForm(actor,formId,definition,expectedRevision), publishForm(actor,formId,expectedRevision), closeForm(actor,formId).

- [x] Yetkisiz editör, eksik zorunlu ayar, taslak önizleme, yeni sürüm bildirimi, yayımlama/duraklatma/kapatma ve tarih penceresi testlerini yaz.
- [x] Alan ekleme/sıralama/silme, etiket/yardımcı metin/kurallar, mobil-masaüstü önizleme, kapasite, tekrar politikası, bekleme listesi ve teşekkür metnini uygula.
- [x] Dosya alanı kontrolünü arayüzde etkin gösterme; Playwright, klavye ve sunucu yetki testlerini geçir; değişen dosyaları inceleyip commit et.

### Görev 12 — açık form gönderimi, makbuz ve kapasite

**Dosyalar:** Oluştur: src/modules/forms/{application/submit-form.ts,application/receipt-service.ts,infrastructure/submission-repository.ts,ui/public-form.tsx}, src/app/(public)/basvuru/[formSlug]/page.tsx, src/app/api/forms/[formSlug]/submit/route.ts, src/app/api/submissions/receipt/route.ts, tests/integration/form-submit.test.ts, tests/e2e/public-form.spec.ts.

**Arayüz:** Üretir: submitForm(formSlug,answers,idempotencyKey,requestContext): Promise<Receipt>; getReceipt(receiptToken): Promise<PrivateReceipt>. İstek anahtarı + gövde özeti atomik saklanır.

- [x] Kapalı form, görünmez koşullu alan, kapasite son koltuğu, bekleme listesi, tekrar başvuru ve aynı idempotency anahtarı/farklı gövde için 409 testlerini yaz.
- [x] Sunucu doğrulaması, transaction içinde kontenjan yeniden kontrolü, rıza sürümü, makbuz token hash'i ve ivedi ama güvenli yanıtı uygula.
- [x] Paralel gönderim testinde kapasite aşılmadığını, gizli yanıtların log/istemci paketine girmediğini ve hata metinlerinin anlaşılır olduğunu kontrol edip commit et.

### Görev 13 — başvuruları yönetme, dışa aktarma ve veri yaşam döngüsü

**Dosyalar:** Oluştur: src/modules/forms/{application/submission-admin.ts,application/export-submissions.ts,ui/submission-list.tsx,ui/submission-detail.tsx}, src/app/admin/basvurular/{page.tsx,[submissionId]/page.tsx}, src/app/api/admin/submissions/{route.ts,[submissionId]/route.ts,export/route.ts}, tests/integration/submission-admin.test.ts, tests/security/export-injection.test.ts, docs/operations/submissions.md.

**Arayüz:** Üretir: listSubmissions(actor,formId,cursor,filters), changeSubmissionStatus(actor,id,status), exportSubmissions(actor,formId,format). Kişisel veri erişimi etkinlik kapsamıyla sınırlandırılır.

- [x] Başka etkinliğin başvurusunu okuyamama, cursor sayfalama, durum geçmişi, CSV/XLSX formül enjeksiyonu ve export audit testlerini yaz.
- [x] Arama/filtre, durum geçişleri, güvenli indirme, düzeltme/silme/dışa aktarma iş akışı ve saklama süresi uygulamasını yap.
- [x] Büyük veri listesi ve farklı form sürümlerini dene; yalnızca yetkili alanların yanıtlandığını dosya/API incelemesinde doğrulayıp commit et.

### Görev 14 — Coffee Talk uçtan uca yayın örneği

**Dosyalar:** Oluştur: src/db/seeds/development/coffee-talk-draft.ts, tests/e2e/coffee-talk.spec.ts, docs/product/coffee-talk-workflow.md. Değiştir: ilgili etkinlik/form/ana sayfa bileşenleri.

**Arayüz:** Mevcut createDraftForm, publishForm ve publishEvent sözleşmelerini kullanır; yeni özel Coffee Talk kod yolu üretmez.

- [x] Taslakta tarih/konum uydurulmadığını ve ana sayfada yayımlı başvuru CTA'sı görünmediğini test et.
- [x] Test ortamında gerçek olmayan, açıkça demo diye işaretlenmiş tarih/konum ve afiş verisiyle editörün etkinlik + formu yayımlamasını test et.
- [x] Formun siteden doldurulup makbuz vermesini, kapanınca doğru durumu göstermesini ve UluJam takım alanlarının görünmemesini doğrula; dosyaları inceleyip commit et.

### Aşama 2 kontrol kapısı

- [x] Form oluşturucu, sürümleme, koşullar, sunucu doğrulaması, kapasite, makbuz, yönetici listesi ve güvenli export testleri geçer.
- [x] Coffee Talk akışı dış Google Forms bağı olmadan sitede tamamlanır; gerçek tarih/konum gelmeden canlı içerik yayımlanmaz.
- [x] Değişen dosyaların tamamı incelenir; docs/operations/phase-2-acceptance.md dosyasına kanıt yazılır.

## Aşama 3 — UluJam başvuruları, takımlar ve onaylı web kartları

### Görev 15 — UluJam özel form tanımı ve beceri doğrulaması

**Dosyalar:** Oluştur: src/modules/applications/{domain/ulujam-input.ts,ui/ulujam-form.tsx}, src/modules/matching/domain/skills.ts, tests/unit/ulujam-input.test.ts, tests/e2e/ulujam-form.spec.ts. UluJam başvurusunun atomik kaydı Görev 16'da takım servisleriyle birlikte yapılır.

**Arayüz:** Üretir: validateUlujamInput(raw): UlujamInput; buildUlujamFormDefinition(eventId): FormDefinition. Genel FormVersion altyapısına bağlanır; UluJam iş kuralını genel forma bulaştırmaz.

- [x] Zorunlu telefon, seçilen her alanda 1–5 seviye, çoklu alanda açıklama, oyuncu adı alanı bulunmaması ve dört mod testlerini yaz.
- [x] Genel form şablonunda dört modu ve koşullu alanları uygula; etkinlik bazında e-posta tekilliği, beceri kaydı ve makbuz transaction'ını Görev 16'nın sözleşmesine bırak.
- [x] Genel Coffee Talk formunun UluJam beceri/takım doğrulamasından etkilenmediğini test et; dosyaları inceleyip commit et.

### Görev 16 — takım oluşturma, katılma, kapasite ve erişim

**Dosyalar:** Oluştur: src/modules/teams/{domain/team.ts,application/team-service.ts,application/team-access.ts,infrastructure/team-repository.ts,ui/team-page.tsx}, src/modules/applications/{application/submit-ulujam.ts,infrastructure/application-repository.ts}, src/app/(private)/takim/[token]/page.tsx, src/app/api/ulujam/apply/route.ts, src/app/api/team/{login,logout}/route.ts, tests/integration/{ulujam-application,team-capacity,team-access}.test.ts, tests/e2e/team-page.spec.ts.

**Arayüz:** Üretir: createTeamWithFounder(tx,input), joinTeam(tx,teamId,participantId,password), submitUlujam(input,idempotencyKey): Promise<UlujamReceipt>, rotateTeamAccess(actor,teamId), requireTeamSession(request,teamId). Yeni takım ve kurucu tek transaction'dır.

- [x] Türkçe/NFKC isim çakışması, iki kişinin son kontenjan yarışı, yanlış parola/hız sınırı ve başka takımın üye verisini okuyamama testlerini yaz.
- [x] Bekleyen takım, hash'lenmiş güçlü parola, rastgele URL token'ı, kısa ömürlü takım oturumu ve erişim yenilemesini uygula.
- [x] Etkinlik bazında normalize e-posta tekilliği, beceri ve makbuz kaydı, son koltuk ve eski parolanın geçersizleşmesi testlerini gerçek PostgreSQL'de geçir. Genel form gönderim uç noktası UluJam'in telefon, takım parolası ve onay öncesi kart kurallarını atlatamamalıdır; bunu ayrı test et. Takım sayfasında telefon/e-posta/iç not/token sızmadığını inceleyip commit et.

### Görev 17 — takım arayanlar ve yönetici ataması

**Dosyalar:** Oluştur: src/modules/matching/{domain/recommendation.ts,application/matching-service.ts,ui/seeker-board.tsx}, src/app/admin/takim-arayanlar/page.tsx, src/app/api/admin/assignments/route.ts, tests/unit/recommendation.test.ts, tests/integration/assignment.test.ts.

**Arayüz:** Üretir: recommendTeams(seeker,availableTeams): ExplainedRecommendation[]; assignParticipant(actor,participantId,teamId,expectedRevision): Promise<AssignmentResult>. Öneri üyelik değiştirmez.

- [x] Alan/seviye filtreleri, dolu takımın önerilmemesi, açıklanabilir sıralama ve admin komutu olmadan üyelik değişmemesi testlerini yaz.
- [x] Takım arayan panelini ve transaction güvenli atamayı uygula; üçüncü taraf AI'ya kişisel veri göndermeyen deterministik öneriyle başla.
- [x] Atama/geri alma, kapasite ve audit kontrolünü geçir; dosyaları inceleyip commit et.

### Görev 18 — yönetici takım/kadro ve bireysel katılım onayı

**Dosyalar:** Oluştur: src/modules/teams/{domain/approval.ts,application/approval-service.ts,ui/approval-queue.tsx,ui/approval-detail.tsx}, src/app/admin/takim-onaylari/page.tsx, src/app/api/admin/approvals/route.ts, tests/integration/approvals.test.ts, tests/e2e/approvals.spec.ts.

**Arayüz:** Üretir: approveRoster(actor,teamId,expectedRosterRevision), requestRosterChanges(actor,teamId,reason), rejectTeam(actor,teamId,reason), approveSolo(actor,participantId). Bütün komutlar audit ve kart revizyonunu transaction içinde yazar.

- [x] Bekleyen/approved/rejected/changes_requested geçişleri, yetkisiz onay reddi, eski revision çatışması ve geç gelen üye için testleri yaz.
- [x] Onay kuyruğunda gerçek/beklenen kişi sayısı, beceriler, etkilenecek kart sayısı ve gerekçeli karar ekranını uygula.
- [x] Onaylı eski üyelerin hakkı korunurken yeni üyenin beklediğini; solo için sahte takım açılmadan onay verildiğini doğrula, dosyaları inceleyip commit et.

### Görev 19 — makbuz, bireysel web kartı ve takım kart özetleri

**Dosyalar:** Oluştur: src/modules/cards/{domain/card-eligibility.ts,application/card-service.ts,application/check-in-service.ts,infrastructure/card-repository.ts,ui/web-card.tsx,ui/pending-card.tsx}, src/app/(private)/kart/[token]/page.tsx, tests/integration/{card-access,check-in}.test.ts, tests/e2e/card-states.spec.ts.

**Arayüz:** Üretir: cardEligibility(participant,teamApproval): Pending | Active | Revoked; getOwnCard(privateToken): Promise<CardView>; getTeamCardSummaries(teamSession): Promise<CardSummary[]>.

- [x] Başvuru sonrası pending, takım/kadro onayı sonrası active, ret/iptal sonrası revoked ve başka üyenin bireysel kart token'ını alamama testlerini yaz.
- [x] Ana sayfadaki UluJam biletine uyumlu web kartı ve takımda yalnızca sınırlı özet gösteren ekranı uygula; QR'ı ayrı iptal edilebilir check-in kimliğine bağla.
- [x] no-store/noindex/no-referrer, log redaction, mobil görünüm ve kart erişim testlerini geçir; dosyaları inceleyip commit et.

### Aşama 3 kontrol kapısı

- [x] Dört UluJam modu, beceri ve telefon kuralları, takım erişimi, kapasite yarışı, eşleştirme önerisi, yönetici onayı ve web kartı durumları test edilir.
- [x] Onay öncesi aktif kart ve Wallet hakkı sunucudan reddedilir; onaylı takıma yeni gelen üye ayrıca bekler.
- [x] Değişen dosyaların tamamı incelenir; docs/operations/phase-3-acceptance.md dosyasına kanıt yazılır.

## Aşama 4 — oyun, sonuç ve Wallet sağlayıcıları

### Görev 20 — finalistler, derece ve oyun yayın yönetimi

**Dosyalar:** Oluştur: src/modules/games/{domain/game-publication.ts,application/game-service.ts,ui/game-editor.tsx,ui/finalist-editor.tsx,ui/public-game.tsx}, src/app/admin/oyunlar/{page.tsx,[gameId]/page.tsx}, src/app/api/admin/games/{route.ts,[gameId]/route.ts}, src/app/(public)/oyunlar/[slug]/page.tsx, tests/integration/game-publication.test.ts, tests/e2e/games.spec.ts. Değiştir: src/modules/games/infrastructure/game-repository.ts ve src/modules/games/ui/result-card.tsx.

**Arayüz:** Üretir: saveGameDraft(actor,eventId,input), markFinalist(actor,gameId), assignAward(actor,eventId,rank,gameId), publishGame(actor,gameId). 2026 tarihî kısmi kayıt ile yeni tam yayın doğrulaması ayrı durumlardır.

- [x] Aynı etkinlikte iki 1. sıra, yanlış itch.io hostname/şema, eksik yeni oyun bilgisi, gerçek adın izinsiz yayınlanması ve 2026 kısmi istisnası testlerini yaz.
- [x] Panelde oyun adı, açıklama, takım, finalist durumu, kapak, itch.io URL ve onaylı yapımcı yayın adlarını düzenleme/önizleme/yayımlama akışını uygula.
- [x] 2026'nın üç URL'si ve boş alanları korunurken daha sonra yönetici tarafından doldurulabildiğini; yayın değişikliğinin kart revision işi ürettiğini doğrula, dosyaları inceleyip commit et.

### Görev 21 — outbox ve ayrı worker

**Dosyalar:** Oluştur: src/lib/queue/{outbox.ts,job-types.ts}, src/worker/{main.ts,claim-job.ts,handlers.ts}, tests/integration/outbox.test.ts, tests/integration/worker-retry.test.ts, docs/architecture/outbox.md.

**Arayüz:** Görev 2'deki enqueue(tx,type,aggregateId,revision,payload) yazma sözleşmesini tüketir; claimJobs(workerId,limit), completeJob(jobId), retryOrDeadLetter(jobId,error) üretir. Worker web işlemiyle aynı repodan ayrı süreç olarak çalışır.

- [x] Transaction geri alındığında iş kalmaması, aynı işin tekrar teslimi, lease süresi bitmesi, azami deneme/dead-letter ve eski revision'ın güncel sonucu ezmemesi testlerini yaz.
- [x] Kısıtlı exponential backoff/jitter, idempotent handler ve yetkili manuel yeniden denemeyi uygula; iş payload'ında sır/telefon taşımamayı denetle.
- [x] İşçi kapalıyken temel başvuru/yayın işleminin tutarlı kaldığını ve açılınca kuyruğun işlendiğini doğrula; dosyaları inceleyip commit et.

### Görev 22 — ortak Wallet uygunluğu ve sağlayıcı durumu

**Dosyalar:** Oluştur: src/modules/wallet/{domain/pass-state.ts,application/wallet-service.ts,infrastructure/wallet-repository.ts,ui/wallet-actions.tsx}, src/app/api/wallet/status/route.ts, tests/integration/wallet-eligibility.test.ts, tests/e2e/wallet-gate.spec.ts.

**Arayüz:** Üretir: assertWalletEligible(participantId,provider): Eligibility; requestWalletPass(privateCardToken,provider): Promise<ProviderAction>; syncPassRevision(participantId,revision).

- [x] Pending/rejected/solo/seeking/geç üye/onaylı üye ve başkasının kartı için uygunluk testlerini yaz; onaysız kişinin API'yi doğrudan çağırmasının da reddedildiğini kanıtla.
- [x] Tek web kartı ve sağlayıcı başına tek pass kaydı, active/pending/revoked durumları, idempotent revizyon ve görünür “test/yayın bekliyor” açıklamasını uygula.
- [x] Onaylı takımın mevcut üyeleri ile yeni üyesinin ayrı hak durumunu, iptal sonrası kart pasifleştirme işini ve API yanıtlarını inceleyip commit et.

### Görev 23 — Google Wallet Generic Pass

**Dosyalar:** Oluştur: src/modules/wallet/google/{google-client.ts,google-pass.ts,google-adapter.ts}, src/app/api/wallet/google/[cardToken]/route.ts, tests/integration/google-wallet.test.ts, docs/operations/google-wallet.md.

**Arayüz:** Üretir: GoogleWalletAdapter.ensureClass(eventId), upsertPass(card,revision), createSaveLink(card,origin), deactivatePass(passId). Issuer ve servis anahtarı yalnızca server-only yapılandırmadan okunur.

- [x] Anahtarın istemci paketine girmemesi, onaysız kart isteğinin reddi, kararlı Object ID, 404'ün hata olması, 409/idempotent tekrar ve eski revision testlerini yaz.
- [x] Sunucuda imzalı ekleme bağlantısı, Generic Class/nesne, derece güncellemesi, sağlayıcı hata kaydı ve demo/yayın erişimi durumunu uygula.
- [x] Yetkili test Google hesabında gerçek ekleme/güncelleme kanıtı al; yayın erişimi yoksa herkese açık kabulü açıkça beklemede bırak; dosyaları ve sır taramasını kontrol edip commit et.

**Demo kabulü tamam (3 Ekim2026):** Onaylanan yeni servis hesabı anahtarı depo dışında0600 izinle kuruldu. Gerçek OAuth/Generic API nesne oluşturma, aynı Object ID üzerinde QR/derece güncelleme ve INACTIVE iptali doğrulandı. Safari'de kayıtlı test Google hesabına kart eklendi; aynı kartta2.sıra/revision4 görüldü. Kanıt docs/operations/google-wallet-live-acceptance.md. Google genel yayın erişimi 3 Ekim2026 kullanıcı onayıyla istendi; sağlayıcı onayı henüz alınmadı; herkese açık kullanım beklemede. Android cihaz/offline teslim ayrıca denenmedi.

### Görev 24 — Apple Wallet pass ve güncelleme servisi

**Kullanıcı kararı —3 Ekim2026:** Görev kapsamı gözden geçirildi. Ücretli Apple Developer hesabı bulunmadığından Apple Wallet uygulaması ve gerçek cihaz kabulü ertelendi. Aşağıdaki kutular açık kalır; görev tamamlandı sayılmaz. Sertifika/Pass Type ID/APNs ve iPhone testi sağlandığında devam edilir. Google Wallet kurulumu Apple hesabını beklemez.

**Dosyalar:** Oluştur: src/modules/wallet/apple/{apple-pass.ts,signing.ts,registration-service.ts,apple-adapter.ts}, src/app/api/wallet/apple/[cardToken]/route.ts, src/app/api/apple/v1/devices/[deviceId]/registrations/[passTypeId]/{route.ts,[serial]/route.ts}, src/app/api/apple/v1/passes/[passTypeId]/[serial]/route.ts, src/app/api/apple/v1/log/route.ts, tests/integration/apple-pass.test.ts, tests/integration/apple-registration.test.ts, docs/operations/apple-wallet.md.

**Arayüz:** Üretir: AppleWalletAdapter.buildPass(card): Promise<signedPkpass>; registerDevice(deviceId,passId,pushToken,authToken); listUpdatedPasses(deviceId,sinceTag); notifyPassChange(passId).

- [ ] Yanlış/eksik sertifika, onaysız katılımcı, geçersiz auth token, cihaz kaydı/çıkarma, aynı serial ile güncelleme ve imza doğrulama testlerini yaz.
- [ ] Pass Type ID, manifest, imza, görseller, cihaz kayıtları, güncelleme etiketi, APNs bildirimi ve eski cihaz kayıt temizliğini uygula.
- [ ] Apple Developer kimlikleri ve gerçek iPhone testi yoksa arayüzü “hazır değil” durumunda tut, görevi tamamlandı sayma; kimlikler sağlanınca gerçek cihazda ekleme ve derece güncellemesini doğrula, dosyaları inceleyip commit et.

### Aşama 4 kontrol kapısı

- [ ] 2026 tarihî üç bağlantı ve daha sonra eklenen alanlar doğru görünür; finalistler ve yeni etkinlik oyunları ayrı yayın kuralını izler.
- [ ] Yönetici onayı olmadan Google/Apple üretimi sunucuda reddedilir; onay ve derece değişikliği outbox/revision üzerinden kartlara tutarlı geçer.
- [ ] Google demo/yayın ve Apple sertifika/cihaz durumları ayrı kanıtla raporlanır; dış onay yoksa ilgili satır açıkça beklemededir.
- [ ] Değişen dosyaların tamamı incelenir; docs/operations/phase-4-acceptance.md dosyasına kanıt yazılır.

## Aşama 5 — güvenlik, kapasite ve canlı kabul

### Görev 25 — birleşik yönetim paneli ve operasyon görünürlüğü

**Dosyalar:** Oluştur: src/modules/admin/{application/dashboard-service.ts,ui/dashboard.tsx}, src/app/admin/sistem/page.tsx, tests/integration/dashboard-scope.test.ts, tests/e2e/admin-operations.spec.ts. Değiştir: Görev 3'teki src/app/admin/page.tsx.

**Arayüz:** Üretir: getDashboard(actor,eventScope): DashboardView; getSystemStatus(actor): IntegrationStatus. Kişisel veri sayıları etkinlik kapsamına göre verilir.

- [x] Yaklaşan etkinlik, açık form, yeni başvuru, takım onayı, dolu kontenjan, başarısız Wallet işi ve zamanlanmış duyuru için kapsam/boş durum testlerini yaz.
- [x] Panel modüllerini tek navigasyonda birleştir; başarı/hata/yüklenme, arama/filtre ve kritik işlem etki önizlemesini uygula.
- [x] Editörün sistem sırlarını veya yetkisiz etkinlik başvurularını görmediğini kontrol et; mobil yönetim akışını ve dosyaları inceleyip commit et.

### Görev 26 — güvenlik sertleştirme ve kötüye kullanım kontrolleri

**Dosyalar:** Oluştur: src/lib/security/{headers.ts,rate-limit.ts,turnstile.ts,url-policy.ts}, tests/security/{authorization,csrf,injection,xss,uploads,cache,secrets}.test.ts, docs/security/{threat-model,asvs-matrix,waf-rules}.md. Değiştir: ilgili API girişleri ve dağıtım yapılandırması.

**Arayüz:** Üretir: requireCsrf(request), enforceRateLimit(bucket,identity), verifyBotToken(token,action), validateExternalUrl(url,policy), securityHeaders(routeClass).

- [x] Yetkisiz nesne erişimi, SQLi/XSS/CSRF, token tahmini ve sızıntısı, kötü URL/dosya, büyük gövde, yanlış cache ve Turnstile eksikliği testlerini yaz.
- [x] CSP/HSTS/referrer/no-store kuralları, uygulama içi sınırlama, CDN/WAF rota bazlı ilk savunma ve origin erişim kısıtını uygulanabilir ortama göre kur.
- [x] OWASP ASVS matrisinde her uygulanabilir maddeye test/kanıt bağla; WAF yanlış pozitiflerini dene; bağımlılık ve sır taramasını geçir, dosyaları inceleyip commit et.

### Görev 27 — gizlilik, erişim kayıtları ve veri yaşam döngüsü

**Dosyalar:** Oluştur: src/modules/applications/application/data-rights-service.ts, src/worker/retention.ts, docs/security/{privacy-data-map,retention,incident-response}.md, docs/operations/data-rights.md, tests/integration/data-retention.test.ts. Doğrulanmış hukuki metinler sağlandığında oluştur: src/app/(public)/{gizlilik,aydinlatma,cerezler}/page.tsx.

**Arayüz:** Üretir: exportPersonData(actorOrVerifiedRequester,personId), correctPersonData(actorOrVerifiedRequester,personId,changes), deleteOrAnonymizeExpired(now), recordConsent(version,scope,subjectId,at).

- [x] Rıza sürümü/zamanı, etkinlik kapsamında veri erişimi, süresi dolan kaydın silinmesi/anonimleştirilmesi ve audit'te sır kalmaması testlerini yaz.
- [x] Veri haritası, saklama ve olay müdahale yönergesini hazırla; hukuk uzmanının onaylamadığı metni canlı hukuki beyan olarak yayımlama.
- [x] Gerçek kişi verisiyle olmayan testleri geçir; hak taleplerinin güvenli doğrulama adımlarını ve dosyaları inceleyip commit et.

### Görev 28 — CI, yük/stres, pentest ve erişilebilirlik kabulü

**Dosyalar:** Oluştur: .github/workflows/ci.yml, tests/load/{public,forms,team-race,wallet-queue}.js, docs/operations/{load-report,security-test-report,accessibility-report}.md, docs/security/pentest-scope.md.

**Arayüz:** pnpm typecheck, pnpm lint, pnpm test, pnpm test:integration, pnpm test:e2e, pnpm build ve k6 senaryoları CI/yerel kabul komutlarıdır.

- [x] CI'ya typecheck, lint, birim/entegrasyon/e2e, migration, bağımlılık ve sır taramasını bağla; başarısız kontrolde dağıtımın durduğunu doğrula.
- [x] Ana sayfa/afiş, yoğun form gönderimi, aynı son takım kontenjanı, admin listeleme ve Wallet kuyruğu için yük/stres senaryolarını çalıştır; p95/p99, hata, veri kaybı ve toparlanmayı raporla.
- [ ] Yetkili kapsamda güvenlik testi ve manuel klavye/ekran okuyucu incelemesi yap; kritik bulguları düzeltip tekrar test et. Dış pentest yapılmadıysa “geçti” yazma; açık bağımlılık olarak bırak.

Yerel CI/yük/güvenlik ve manuel klavye kanıtı raporlarda. Gerçek VoiceOver/NVDA incelemesi ve bağımsız dış pentest bekliyor; üçüncü kutu bu nedenle açık.

### Görev 29 — dağıtım, yedek, geri dönüş ve geliştirici rehberi

**Dosyalar:** Oluştur: docs/architecture/{overview,er-diagram,decision-log}.md, docs/product/{routes,roles,change-guide}.md, docs/operations/{deploy,backup-restore,rollback,admin-bootstrap,events,forms,links,teams,wallet}.md, docs/operations/final-acceptance.md. Değiştir: README.md, Dockerfile ve ortam yapılandırması.

**Arayüz:** Aynı repo web ve worker süreçlerini ayrı dağıtır; migration ve medya yedeği eşlenir; gizli değişkenler güvenli ortamdan sağlanır.

- [x] Geliştirme/test/canlı ortam ayrımı, boş DB migration, editoryal 2026 seed'i, smoke test ve geri dönüş komutlarını belgele; yerelde temiz kurulum prova et.
- [x] Yedek alma/geri yükleme tatbikatını gerçek test ortamında yap; RPO/RTO, maliyet, veri bölgesi ve trafik hedefleri netleşmeden üretim sağlayıcısını kesinleştirme.
- [x] “Bir form alanını, rengi, etkinliği, linki, takım kuralını ve Wallet kartını nereden değiştiririm?” rehberini yeni geliştirici gözünden uygula; bütün dosyaları incele ve son kabul matrisiyle eşleştir.

### Aşama 5 ve tüm ürün için son kabul kapısı

- [ ] Mimari önerinin her gereksinimi bu plandaki bir göreve ve çalışan/test edilmiş çıktıya eşlenmiştir; atlanan veya kapsam dışı bırakılan madde yoktur.
- [x] Ürün/API/rol haritası, ER diyagramı, mobil/erişilebilirlik, güvenlik ve stres raporları, yedek restore kanıtı ve açık risk listesi tamamdır.
- [ ] Google Wallet herkese açık yayın ve gerçek Android cihaz kabulü: başvuru 3 Ekim2026 gönderildi; sağlayıcı onayı/cihaz kanıtı bekliyor.
- [ ] Apple Wallet gerçek cihaz güncellemesi: kullanıcı kararıyla ertelendi; ücretli hesap/sertifika kanıtı olmadan tamamlandı sayılmaz.
- [x] Kullanıcıya teslim raporunda her aşamanın değişen dosyaları, test çıktıları, açık bağımlılıkları ve yayımlama durumu ayrı gösterilir.

Son inceleme: [kabul kararı](../operations/final-acceptance.md) ve [ayrıntılı kapsam denetimi](../operations/requirement-coverage.md). Yerel otomatik testler geçti; açık bağımlılıklar nedeniyle genel üretim kabulü henüz kapanmadı.

## Kapsam eşleme tablosu

| Mimari gereksinim | Görev |
|---|---|
| Boş üretim DB, güvenli başlangıç, klasör yapısı ve sürümler | 1–2 |
| Admin kimliği, RBAC, MFA, denetim | 2–3, 25–26 |
| Arcade tasarım, tüm rotalar, mobil/erişilebilir gezinme | 4, 9, 28 |
| Gerçek logo/fotoğraf, HEIC ve güvenli medya | 4–5 |
| Etkinlik/duyuru/afiş, Coffee Talk ana sayfa vitrini | 6, 14 |
| Linktree benzeri bağlantı merkezi | 7 |
| 2026 görselleri/finalistler/1–3 bağlantıları ve boş alanlar | 8–9, 20 |
| 2027 “Yakında” ve yalnızca gerçek tarihle sayaç | 9 |
| Genel form oluşturucu, sürüm, koşul, kapasite, makbuz, export | 10–14 |
| UluJam telefonu/becerileri/dört takım modu | 15–16 |
| Takım arayan önerisi ve yönetici ataması | 17 |
| Yönetici takım/kadro/solo onayı, geç üye | 18 |
| Bekleyen/aktif/iptal web kartı ve güvenli bireysel erişim | 19 |
| Oyunlar, yayın adları, derece tekilliği | 8, 20 |
| Outbox/revision/idempotency ve Wallet kapısı | 21–22 |
| Google ve Apple Wallet entegrasyonları | 23–24 |
| Yönetici genel bakış ve sistem durumu | 25 |
| SQLi, XSS, CSRF, DDoS/WAF, sır, dosya ve kişisel veri güvenliği | 1–3, 16, 26–28 |
| Test, stres, pentest, CI, yedek, dağıtım ve bakım belgeleri | 28–29 |

## Dış girdiler ve durma koşulları

2027 tarihi, Coffee Talk ve diğer gerçek etkinliklerin tarih/konumu, doğrulanmış sosyal bağlantılar, 2026 görselleri/finalistleri/yapımcı yayın adları, veri sorumlusu ve hukuk metinleri, domain/bütçe/veri bölgesi/trafik hedefleri, Google issuer yayın erişimi ve Apple Developer kimlikleri ayrı girdilerdir. Bu bilgiler olmadan ilgili canlı içerik/Wallet kabulü tamamlandı sayılamaz. Yerel mimari, panel ve boş durum çalışması sürer; bilgi uydurulmaz.

Planın dışına çıkılması, bir görevin atlanması veya yeni özellik eklenmesi gerekiyorsa değişiklik önce bu dosyada ve mimari öneride açıklanır. Dosya dosya inceleme ve kullanıcıya raporlama bundan sonraki uygulama turlarının zorunlu çalışma biçimidir.

Görev 29 yerel teslim kanıtı: docs/operations/final-acceptance.md ve backup-restore.md. Belge/rapor kutuları tamam; ürünün çalışan dış sağlayıcı ve canlı kabul kapıları açık bağımlılıklar çözülmeden kapanmaz.

## Tema denemesi — kullanıcı onayı 3 Ekim 2026

Kapsam: GTA VI resmi sayfasını renk/yerleşim/hareket referansı alarak bütün mevcut genel/özel/admin ekranlarını yenile; reddedilen imagegen önizlemesini kullanma. Ürün özellikleri, metinlerin bilgi doğruluğu, rota/API/veri/yetki/form/Wallet kuralları değişmez. Apple ertelenir. Görsel referans tüm kaynak varlıklarının birebir kopyalandığı anlamına gelmez; özel ArtDeco fontu yerine OFL Türkçe font, büyük tipografik açılış ve özgün CSS dekorasyonu kullanılır. Gerçek topluluk/video olmadığı için uydurma fotoğraf veya oynatıcı eklenmez.

- [x] Mevcut çalışma ağacını kaydet, backup/theme-before-20261003 ve theme-before-20261003 etiketiyle geri dönüş noktası oluştur; yerel bundle doğrula.
- [x] Menü tüm boyutlarda erişilebilir açılır düzen: mevcut linkler/CTA, Escape ve odak geri dönüşü; önce RED, sonra GREEN.
- [x] Ortak token/font/zemin/yerleşim, genel formlar/liste/tablo/dialog, admin CSS ve özel katılımcı kartını yenile; reduced-motion ve QR okunurluğunu koru.
- [x] Tam CI ve gerçek tarayıcı görsel/mobil kontrolünü tamamla; branch incelemesi, git kaydı ve yerel web/worker yeniden açılışı.

İnceleme odağı: özellik/CTA kaybı, panel mobil taşması, QR filtre/kontrast, menü klavye kullanımı, animasyon kapalıyken görünür içerik ve dış kaynak/sır sızıntısı.

## Referans klonu ve sayfaya gömülü oyunlar — 4 Ekim 2026

Kullanıcı ilk uygulamanın tasarımını reddetti; güncel Rockstar GTA VI sayfasının klonunu, menüsüz ana sayfa haritasını ve mevcut iki oyunun başlat ekranı olmadan doğal/rastgele bölüm molası olarak yerleşmesini açıkça istedi. Önceki Git yedeğiyle deneme onayı sürer. Mimari/API/veri/yetki/Wallet değişmez; oyunun sunumu için önceki özellik-eklememe sınırı kullanıcı tarafından genişletildi. Mevcut UI akışlarının sınırlı yeniden düzenlemesi; yeni altyapı yok. Referans canlı tarayıcıda açılış kolajı, iki medya paneli ve büyük yönlendirme bölümleri olarak incelendi. Yapay üretim görsel yok. Yerel klon denemesi için resmi referansın gerçek görselleri ve fontları kaynak atıflarıyla kullanılır; bunlar Uludott'a ait etkinlik/kişi görüntüsü olarak sunulmaz.

- [x] Menü kullanmadan bütün genel ana bölümlere ve görünür yayınlı içeriklere giriş; özel token sayfaları ve yetkili admin bölümleri erişim kurallarını korur.
- [x] Mevcut iki oyun doğrudan sayfada: ilk etkileşimle oynama, yeniden deneme; rastgelelik sadece oturumun mola sırası/yerine etki eder, gezinmeyi kesmez.
- [x] Gerçek referans oran/font/renk/medya yerleşimi ve kaydırma hareketleri; mobil/reduced-motion/QR korunur.
- [x] Regresyon RED/GREEN, tam CI, görsel karşılaştırma, bağımsız inceleme; rapor/Git kaydı ve yerel yeniden açılış.

## Sites tasarım önizlemesi — 4 Ekim 2026

Kullanıcı Sites yayınını istedi, sunucu uyumsuzluğu açıklanması ardından açıkça tasarım önizlemesini seçti. Tam uygulama mimarisi değiştirilmez. Ayrı statik checkout ve Sites kaynak deposu kullanılır; ana uygulama verisi, sırları, özel sayfa/API/worker içeriği taşınmaz.

- [x] Sekiz genel sayfanın kaynak322a458 görünümleri; yerel referans font/görseller, menü ve iki oyun.
- [x] Yönetim bağlantısı giriş/form yerine önizleme açıklaması; bütün sayfalarda kapsam bildirimi.
- [x] Yerel asset/rota doğrulama, script syntax, kart eşleştirme/kapatma ve yıldız tamamlanma, menü/Escape.
- [x] Kaynak push/archive/native private publication succeeded; bağlantı, rapor ve yerel tam uygulama açık.

## Header white text — 4 Ekim 2026

- [x] Kullanıcının logo paketindeki özgün ULUDOTT WHİTE TEXT.png header yazısı yerine kullanıldı; mevcut ikon korunur. PNG3000×390 byte-for-byte kopya,140px/orantılı yükseklik; erişilebilir ana sayfa adı aynı.
- [x] Yerel typecheck/lint/görsel kontrol; Sites9header güncelleme/kaynak push/arşiv/private yayın succeeded; rapor/Git ve yerel yeniden açılış.

## Video referanslı menü ve topluluk dünyası — 4 Ekim 2026

- [x] Video incelendi: solda görsel/wordmark, sağda tek sütun açılır menü; büyük başlıklar ve kademeli portre/mekân sahneleri.
- [x] Ana sayfa toplu rota şeridi kaldırıldı; iki ana panel UluJam ve derece oyunları oldu.
- [x] People yönetim kurulu, Places sponsor/kafe/salon yer tutucuları; özgün GTA VI geçici görselleri, sahte kişi/kurum kaydı yok.
- [x] Sosyal örnek kutuları ve mevcut iki oyuna çevrilme/hareket animasyonları; kurallar aynı.
- [x] Mobil/masaüstü, hareket azaltma ve normal hareket, klavye, mevcut akışların kabulü ve bağımsız inceleme.
- [x] Aynı özel Sites önizlemesinin etkileşimleriyle yayını succeeded; kaynak/Git kaydı ve yerel tam uygulama yeniden açıldı.

## Panel pencereleri ve tam People akışı — 4 Ekim 2026

Kullanıcının iki yeni kaydı ve altı maddesi: ikon/sayfa adı, UluJam vloglu pencereler, sekiz karakterin tüm fotoğraf/klip akışı, kaydırmayla renk değişimi, doğrudan mini oyun iyileştirmeleri. Gerçek kişi/kurum bilgisi uydurulmaz; GTA medyası geçici referanstır. Yanlış hafıza çifti otomatik kapanışı açık kullanıcı talebinin kapsamındadır.

- [x] Native erişilebilir panel pencereleri, vlog ve gerçek derece bağlantıları.
- [x] Sekiz sahne,36 fotoğraf,10 kaydırma klibi; mobil/reduced motion ve renk akışı.
- [x] Mini oyun akıcılığı; test/inceleme, aynı Sites önizlemesi ve yerel yeniden açılış.

Vlog oynatıcı bağlantısı kuruldu; gerçek tarayıcıda YouTube “This video is unavailable” döndürdü. Nedeni doğrulanmadı; YouTube’da izleme bağlantısı korunur. Görsel/etkileşim kabulü, sağlayıcı videosunun erişilebilir olduğu iddiası değildir.

## Kaydırma karesi ve sadeleştirme — 4 Ekim 2026

Kullanıcı beş yeni değişiklik istedi: ana sayfa header etiketsiz, Yönetim önizlemesi yalnız panel, cinematic video zaman çizelgesi kaydırmaya bağlı ileri/geri ve sabit kare, mini oyunların kaldırılması, People başına iki galeri fotoğrafı ve tüm sayfa/alanlar için ad/ölçü/adet eşleme klasörleri. Vlog kullanıcı kontrollü oynatıcıdır; otomatik başlangıç kapatılır. Topluluk tarafından üretilen oyun arşivi mini oyun kaldırma kapsamına dahil değildir. Gerçek yönetim işlevleri korunur, önizleme anlatımı sadeleşir.

- [x] Ana sayfa etiketi/mini oyunlar ve Yönetim önizleme metni.
- [x] İleri/geri scroll seek, durma ve reduced-motion kabulü; statik eş davranış.
- [x] Kişi başına iki fotoğraf kabulü son yönlendirmeyle bir açılış videosu + bir detay fotoğrafına çevrildi; alan adı/ölçü/adet manifesti ve kullanıcı yükleme klasörleri.
- [x] Test, inceleme, Git, aynı Sites yayını ve yerel yeniden açılış.

## Kullanıcı görsellerinin yerleşimi — 4 Ekim 2026

Son yönlendirme önceki People iki fotoğraf kabulünün yerini alır: kişi başına yalnız bir açılış videosu ve bir detay fotoğrafı. Başkan Yiğit dosyaları ilk sahneye; diğer üyeler dosya gelene kadar geçici referanstır. Eklenmiş ana sayfa/panel/vlog/2026 galeri/etkinlik/duyuru görselleri mevcut alanlara yerleşir. Etkinlik README talebi1080×1350 tam afiş, kırpılmaz. Afişler mevcut liste/ana sayfa tasarımında gösterilir; tarihler veya yeni DB başvuru/yayın kayıtları uydurulmaz.

- [x] Dosya eşleme, People1video+1fotoğraf, tam4:5 etkinlik afişi.
- [x] Test/bağımsız inceleme/statik yayın/Git/yerel yeniden açılış; manifest son düzene göre güncel.
