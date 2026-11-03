# Faz 0A — Çalışma tabanı ve başlangıç kabulü

**Tarih:** 21 Ekim 2026. **Güncel durum:** İş 0A kabul edildi; aşağıda ilk kırmızı koşular ve bunların çözümü birlikte kayıtlıdır. 0B/0C başlamadı.
**Plan:** [Birleşik uygulama planı, revizyon 3](../design/2026-10-20-birlesik-uygulama-plani.md).
**Hedef:** Uludott Web v0.2, feat/unified-clean-v0.2, başlangıç b8578cf3546416dd88d8dc0c1cff81c59998caf7.
**Görsel doğruluk kaynağı:** v0.1'in mevcut çalışma hâli. Tema, stil, DOM, metin, public varlıklar ve iş kuralları değişmedi. v0.2'de mevcut form başarı mesajını koruyan tek React key satırı düzeltildi; kapsamı ve kırmızı/yeşil kanıtı devam bölümündedir.

## Çalışma sınırı ve ortam

Kullanıcı yalnız ilk adımı başlattı; 0B/cache düzeltmesi, 0C/görsel ekran referansı ve Faz 1 başlamadı. Adlandırılmış ayrı v0.2 checkout'u kullanıldı; v0.1 kullanıcı değişiklikleri korundu. Başlangıçtaki kirli dosyalar önceki konuşmada oluşturulan plan/kurallar/analiz/ilerleme belgeleriydi.

- Node 24.21.0, pnpm 11.19.0, Next 16.3.8, Playwright 1.63.0.
- Masaüstünün fallback pnpm aracı pm_on_fail=ignore ile 11.25.0'ı zorluyordu. Yalnız bu süreç değişkenini kaldıran yerel, gitignored .local/phase-0a/bin/pnpm sarmalayıcısı projenin packageManager sürümünü kullanıyor. Global kurulum/ayar ve manifest sürümleri değiştirilmedi; engine denetimi kapatılmadı.
- Doğru sürümle pnpm install --frozen-lockfile geçti; bağımlılık/lockfile farkı oluşmadı.
- Önceden durmuş uludott Colima profili ve mevcut yerel PostgreSQL konteyneri açıldı. Çalışma DB'si uludott_v02; yalnız loopback üzerinde.
- Test S3 için yeni uludott-v02-0a-storage konteyneri, geçici tmpfs, ayrı bucket ve yeni erişim anahtarları kullanıldı. Mevcut dosya deposu başlatılmadı veya değiştirilmedi. Test aracı yerel DB/S3/APP_URL ve bucket sahipliğini çalıştırmadan doğruluyor.
- Testlerde Google Wallet ve Turnstile kapalı; gerçek worker/sağlayıcı bildirimi yok. E2E yalnız izole fixture DB ve 127.0.0.1 portlarında çalışır.
- Test komutları kendi script adlarıyla çalıştırıldı. Tam komut/çıkış/süre kayıtları [results.jsonl](../../.local/phase-0a/results.jsonl), loglar [.local/phase-0a/logs](../../.local/phase-0a/logs) içindedir. Sırlar bu belgeye alınmadı.

## v0.1 ile kaynak ve görsel varlık envanteri

[Kaynak envanteri](../../.local/phase-0a/inventory/README.md) ve [aktarım kararı](../../.local/phase-0a/inventory/selected-transfer-list.json):

- Public altında 114 dosyanın tamamı SHA256 olarak aynı.
- 376 ortak kaynak dosyasında 349 aynı; 27 farklı dosya incelendi. Farklar cache/SEO/HTTP invalidation ve yerel demo kaldırılmasıyla açıklanıyor.
- 26 migration SQL, 26 snapshot, journal, 13 şema dosyası ve bağımlılık/lockfile içeriği aynı.
- Seçilecek eksik v0.1 aktarımı yok; dosya kopyalanmadı.
- Bu bir kaynak eşliği kanıtıdır. Tarayıcıda v0.1/v0.2 piksel eşliği bu adımda iddia edilmez; İş 0C'nin konusudur.

## Çalışma DB'si: salt okunur kabul

[Başlangıç sayımı](../../.local/phase-0a/working-db-before.json), [izinli editoryal envanter kontrolü](../../.local/phase-0a/editorial-inventory.json):

- PostgreSQL 17.10; public şemada 47 tablo, drizzle journal'da 26 uygulanmış migration.
- Başvuru, takım, üyelik, kart, oturum, admin, form, dosya, outbox ve Wallet kayıtları 0.
- 2 etkinlik/yıl kaydı, 3 oyun, 3 ödül var. Kimlik, slug, yıl ilişkisi, itch URL ve derece kaynak envanteriyle eşleşti.
- 2026 ve 2027 etkinlikleri taslak ve tarihsiz; yeni tarih/kişi/takım üretilmedi.
- Çalışma DB'sine migration/seed/silme uygulanmadı. Testler kendi UUID adlı DB'lerinde migration/fixture oluşturdu.

## Başlangıçta bulunan ve test katmanında giderilen sorunlar

1. **DB URL query parametresi test DB adını geçersiz kılabiliyordu.** PostgreSQL sürücüsünde ?database= parametresi URL pathname'inden öncelikliydi. Yeni gerçek regresyon testi önce current_database() sonucunun çalışma DB'sine döndüğünü gösterdi; yalnız SELECT yapıldı. Yardımcı iki bağlantıdan önce query parametrelerini temizleyecek şekilde düzeltildi. Test daha sonra yalnız uludott_test_<UUID> bağlantısını kabul ederek geçti. Testin oluşturduğu UUID DB dışında DROP yoktu.
2. **HTTPS kimlik doğrulama testleri HTTP ortamına bağımlıydı.** İlk tam pakette aynı 4 test başarısız oldu; aynı 22 test HTTPS APP_URL girdisiyle geçti. admin-auth.test.ts artık HTTPS senaryosunu import öncesi kendi fixture'ında kurup iş sonunda önceki değeri geri koyuyor. Hiçbir güvenlik beklentisi veya uygulama kimlik doğrulama kodu değiştirilmedi; mevcut HTTP cookie-policy testleri korunuyor.

3. **Üretim TLS testlerinde sabit HTTP Origin kullanılıyordu.** Dört E2E dosyası CSRF yanıtının gerçek origin değerini kullanıyor. Yanlış origin ile yapılan temizlik başarısız oluyor, sonraki senaryolara ayar bırakıyordu. Uygulama CSRF denetimi gevşetilmedi. Etkilenen 13 test temiz üretim ortamında 13/13 geçti.
4. **Bazı E2E girdileri güncel v0.1'den eskiydi.** Etkinlik afişleri artık mevcut 1080×1350 / event-poster kuralına uyuyor; mobil yönetim menüsü açılıyor, güncel slug/tarih/afiş alanları ve etkinlik bağlantı adı kullanılıyor. Başvuru bağlantısı panel içeriğine daraltıldı; takım sayısı yine tam 1 / 2 olarak doğrulanıyor. Kişi başlıkları beş mevcut bölümü, video sayısı gizli referans video olmadan üç mevcut videoyu kontrol ediyor. Kapalı başvuru metni v0.1'in mevcut metniyle eşitlendi. Yeni ekran, medya veya metin uygulamaya eklenmedi; mahremiyet/güvenlik kontrolleri korunuyor. Eski ana sayfa sıra alanını dolduran kurulum satırı kaldırıldı; yayın/görünürlük beklentileri korundu.

Kırmızı/yeşil kanıtları: [DB kırmızı](../../.local/phase-0a/db-isolation-red.log), [DB yeşil](../../.local/phase-0a/db-isolation-green.log), [auth kırmızı](../../.local/phase-0a/logs/auth-http-red.log), [auth yeşil](../../.local/phase-0a/logs/auth-http-green.log).

## Komut sonuçları

| Kontrol | Sonuç |
|---|---|
| frozen lockfile kurulumu | Geçti; pnpm 11.19.0. |
| config:check | Geçti. |
| Gerçek yerel PostgreSQL/S3 altyapı testi | 2/2 geçti; anonim özel nesne erişimi reddedildi. |
| typecheck | Geçti. |
| lint | Geçti. |
| İlk pnpm test | 376/380; HTTPS fixture'ı nedeniyle 4 hata. Gizlenmedi, yukarıda düzeltildi. |
| İlk test:integration | 222/226; aynı 4 fixture hatası. |
| Fixture düzeltmesi sonrası pnpm test | 77 dosya / 380 test geçti; komut çıkışı 0. |
| HTTPS kapanış regresyonu dahil son pnpm test | 78 dosya / 381 test geçti; komut çıkışı 0. |
| Fixture düzeltmesi sonrası test:integration | 43 dosya / 226 test geçti; komut çıkışı 0. |
| build | Geçti; mevcut Wallet dosya izleme uyarısı aşağıda kayıtlı. |
| İlk üretim TLS test:e2e | 70 geçti / 30 başarısız / 2 mevcut HTTP koşullu atlama; çıkış 1. |
| Origin düzeltmesi sonrası tam üretim TLS | 81 geçti / 19 başarısız / 2 HTTP koşullu atlama; çıkış 1. |
| Origin düzeltmesi hedefli doğrulama | 13/13 geçti; çıkış 0. |
| Güncel v0.1 test girdileri/alanları hedefli koşu | 27 senaryoda 23 geçti / 4 başarısız; iki eski ekran beklentisi ve iki ek locator sorunu. |
| Son etkinlik locator düzeltmeleri | 4/4 geçti; çıkış 0. |
| HTTP localhost + 127.0.0.1 giriş/yenileme/çıkış | 2/2 geçti; üretim TLS'de koşullu atlanan iki senaryo ayrıca doğrulandı. |
| Son tam üretim TLS içerik koşusu | 93 geçti / 7 başarısız / 2 mevcut HTTP koşullu atlama; çıkış 1. Bu koşudan sonra yalnız test kapanışı değişti; aşağıdaki 13/13 temiz kapanışla doğrulandı. |
| Son kapanış düzeltmesiyle üretim TLS | 13/13 geçti; 36.7sn, çıkış 0; yeni DB veya standalone klasörü kalmadı. |
| db:check | Geçti. |
| security:source | Son koşu: 805 dosya, 0 sır bulgusu, 0 yasak dosya; çıkış 0. İlk koşu 802 dosyaydı. |
| security:wallet | Geçti; üretim paketinde 3224 dosya, 0 sır bulgusu, 0 yasak dosya. |

## Derleme ve açık sınırlar

Üretim build'i 13.4 saniyede geçti. Tüm çıktı rota sınıfları dynamic (ƒ); public veri cache'i HTML'in statik üretildiği anlamına gelmiyor. Tam rota tablosu build logunda ve ilerleme kaydında saklanır.

Önceden bilinen src/lib/config/wallet.ts:44 dinamik dosya izleme uyarısı yeniden görüldü. Bu adımda Wallet/uygulama kodu değiştirilmedi. Kaynak sır taraması ve paket kontrolü ayrı kaydedilir; uyarı gizlenmez.

Başlangıç testlerinin geçmesi 0B cache uygunluk açığının düzeldiği veya 0C görsel baseline'ın alındığı anlamına gelmez. Canlıya erişim, push/merge/dağıtım, gerçek Wallet cihaz kabulü ve görsel tasarım değişikliği yapılmadı.

## İlk tam koşuda bulunan kabul engelleri (tarihî kayıt)

Bu hatalar başarıya çevirmek için assertion silinmedi, test atlanmadı, zaman aşımı/eşik yükseltilmedi. Test girdileri ve locator düzeltmelerini bağımsız inceleyen ajan uygulama/tema/görsel dosyasında değişiklik veya güvenlik beklentisinde gevşeme bulmadı.

| Senaryo | Kanıt ve gereken düzeltme |
|---|---|
| admin-operations ilk mobil senaryo | Eski Formlar/Operasyon özeti/Özet filtresi/upcoming arayüzünü bekliyor. Güncel v0.1/v0.2 arama ve özet yapısı farklı; eski filtreyi geri getirmek görsel kilidi ihlal eder. Senaryo güncel arama üzerinden yeniden yazılmalı; gerçek outbox önizleme/iptal/onay ve tek mutasyon kontrolleri korunmalı. İkinci senaryodaki Hakkımızda menü adı düzeltildi ve geçti. |
| form-builder ilk senaryo | Gerçek geri bildirim sorunu: kaydetme sonrası role=status boş. FormBuilder içindeki setMessage + router.refresh, sayfadaki key={f.revision} nedeniyle yeniden mount edilip mesajı sıfırlıyor. Beklenti yerinde bırakıldı. Veri kaydının başarısız olduğu sonucu çıkarılmaz; mevcut mesajın ömrü için ayrı minimal UI durum düzeltmesi ve regresyon kabulü gerekir. Stil/yerleşim yeniden tasarlanmaz. |
| games ilk senaryo | Mevcut UluJam takım yönetimi kapalı details içinde; yalnız bu bölümü açan teşhis koşusu gerçek düzenleme, rıza ve yayın akışını geçti, sonra mevcut olmayan Finalist oyunları arşiv bölgesinde başarısız oldu. Her iki tabanda FinalistList kullanılmıyor. Kalıcı yarım düzeltme bırakılmadı; son tam koşu orijinal testle yapılıyor. Yayın/izin geri çekme kontrolleri korunarak güncel arşiv sözleşmesi tanımlanmalı; eski bölüm eklenmez. |
| link-hub ilk senaryo | /admin/linkler kayıtlarının sosyal footer'a yansımasını bekliyor. Güncel footer readContactSettings kullanıyor; iletişim/footer yönetimi ayrı güncel E2E'de geçiyor. Bağlantı merkezi sıra/kısa URL/QR/gizleme kontrolleri ve footer yönetimi güncel kaynaklarına göre ayrılmalı; eski footer uygulanmaz. |
| supplied-media iki genişlik | Eski statik Coffee Talk ana sayfa kartını ve tarihini varsayıyor. Başlangıç fixture'ında Coffee Talk taslak. Testin dolu veri senaryosunu açıkça kendi izole fixture'ında kurması; gerçek varlık oranı/yerleşimi, a11y ve başkan medyası kontrollerini koruması gerekiyor. Çalışma DB'sine uydurma etkinlik/tarih eklenmez. |
| ulujam-years eski galeri yönetimi | /admin/galeri mevcut arşiv editörüne yönleniyor; Arşiv medyası ve Galeri slotunu kaydet eski arayüzünün çağıranı yok. Yeni mevcut arşiv akışına yönelik senaryo gerekir; eski galeri ekranı geri getirilmez. |

Tam 0A kabulü sağlanana kadar bu işler açık başlangıç düzeltmesi olarak kalır. Cache düzeltmesi, tema merkezileştirmesi ve görsel referans kabulü için başlangıç hataları görmezden gelinmez.

## Test kapanışı: sonradan bulunan ve giderilen izolasyon kusuru

Son kapanış kontrolünde 13 test DB'si bulundu. Salt okunur fixture zamanları bunların dokuzunun 4 Ekim'den kaldığını; dördünün bu oturumun E2E başlangıçlarıyla eşleştiğini gösterdi. Eskiler korunmuştur. İlgili başlangıç saati, E2E admin marker'ı, UUID adı ve standalone build kimliği üzerinden sahiplik manifesti çıkarıldı. Teşhis koşularının da ürettiği toplam sekiz bu-oturuma-ait DB ve sekiz geçici standalone klasörü yalnız bu manifestle temizlendi; DROP işleminde FORCE kullanılmadı. Çalışma DB'si bu listenin parçası değildi.

Üç bulgu ayrı doğrulandı:

1. Playwright'ın 10sn kapanış bütçesi, tek S3 silmenin mevcut 20sn sınırından kısaydı. Yalnız süreç kapanış bütçesi 60sn oldu; test gövdesi 60sn ve assertion 15sn sınırları aynı kaldı. Süre artırımı tek başına gerçek sorunu çözmedi; başarısız deneme kaydı korundu.
2. HTTPS closeAllConnections, TLS el sıkışması başlamamış ham soketleri kapsamıyor. Gerçek HTTPS sunucu + ham TCP istemci testi önce GATEWAY_CLOSE_TIMEOUT ile başarısız oldu, ham bağlantıları izleyip kapatan yardımcıyla geçti. Kapanış yinelenebilir ve idempotent.
3. Gerçek tarayıcı kapanış izi SIGTERM geldiğini, ancak child exit/finish aşamasına ulaşılamadığını gösterdi. Kurulu Next üretim sunucusu açık proxy isteklerinin bitmesini beklerken yardımcı child exit'i bekliyordu. Yardımcı artık önce gateway bağlantılarını kapatıp iptal edilen isteğin upstream bağlantısını sonlandırıyor, ardından kendi uygulama sürecine sinyal veriyor. Uygulamanın çalışma/üretim kodu değiştirilmedi. Geçici teşhis log satırları kaldırıldı.

Kanıtlar: [ham TCP kırmızı](../../.local/phase-0a/logs/https-gateway-red.log), [yeşil](../../.local/phase-0a/logs/https-gateway-green.log), [kapanış aşaması izi](../../.local/phase-0a/logs/e2e-cleanup-stage-trace.log), [son 13 senaryo](../../.local/phase-0a/logs/e2e-cleanup-order-fixed.log), [önce/sonra kaynak kümesi](../../.local/phase-0a/socket-cleanup-regression.json), [sahipli ilk altı kaynağın temizliği](../../.local/phase-0a/owned-resource-cleanup-first6.json), [son iki kaynağın temizliği](../../.local/phase-0a/owned-resource-cleanup.json).

Son gerçek koşuda 13/13 test geçti; sonrasında dokuz eski DB'nin kümesi birebir korundu, yeni DB sayısı 0, standalone klasörü 0, başka istemci bağlantısı 0. Genel paket yeni regresyonla 381/381 geçti. Kapanış sırası ve proxy iptali bağımsız incelendi; açık inceleme bulgusu kalmadı.

## İlk koşunun kapanışı (tarihî kayıt)

- [Çalışma DB'si önce/sonra](../../.local/phase-0a/working-db-comparison.json): 47 tablo sayımı ve 26 migration kaydı birebir aynı. Son editoryal kontrolün tüm karşılaştırmaları da doğru. Fixture çalışma DB'sine karışmadı.
- [Son kaynak hash kontrolü](../../.local/phase-0a/final-source-recheck.json): v0.1'in envanterdeki 646 dosyası değişmedi; v0.2'nin 495 src/public dosyası değişmedi, bu alanlara dosya eklenmedi/silinmedi. 114 public varlık birebir aynı. Yeni değişiklikler test/ortam ve belgelerdedir.
- Next'in ürettiği next-env.d.ts başlangıç içeriğine geri kondu; kalıcı ürün farkı bırakılmadı.
- Bu oturuma ait geçici S3 konteyneri silindi. Mevcut PostgreSQL konteyneri ve Colima profili başlangıçtaki durmuş durumlarına döndürüldü; mevcut depo/volume silinmedi. Dokuz eski test DB'si yerinde bırakıldı.
- Push, merge, dağıtım, gerçek sağlayıcı/worker veya görsel tasarım değişikliği yapılmadı.

**İlk koşunun kararı:** Ortam ve başlangıç envanteri kanıtlıdır; o koşuda 0A tam kabulü yedi E2E senaryosu nedeniyle açık kaldı. Bunlardan altısı eski ekran/veri sözleşmeleriyle ilişkilidir; biri form kaydetme geri bildirimidir. Başarısızlıklar beklenti silerek veya yeni görünüm ekleyerek gizlenmedi. Aşağıdaki devam kaydı bu engellerin güncel durumunu gösterir.

## 21 Ekim devamı — yedi engelin çözümü ve kapsam eşlemesi

Kullanıcının devam talebi üzerine yalnız 0A kabulü sürdürüldü. Güncel v0.1 ekranları esas alındı; eski ekran/bölüm/kontrol uygulamaya eklenmedi. Testler kaldırılmadı veya atlanmadı; bağımsız link/footer sözleşmelerinin ayrılması toplam senaryo sayısını 102'den 103'e çıkardı.

| Önceki engel | Güncel doğrulama ve korunan kapsam |
|---|---|
| Mobil yönetim | Mevcut menü, sıfır/tek/çok sonuçlu etkinlik araması ve yaklaşan etkinlik sayacı. 320/390 taşma kontrolü; sistem sayfasındaki yedi metrik önce sayılıyor, sonra ölçülüyor. Gerçek retry önizleme → iptal → sıfır mutasyon → onay → HTTP 200 → tam bir POST korunuyor. |
| Form kaydetme | Sunucu sürümü arttıktan sonra başarı mesajının silinmesi yeniden kırmızı doğrulandı. Tek üretim satırı key={f.revision} → key={f.id}; form kimliği sabit, farklı formun kimliği farklıdır. Aynı test kaydetme mesajını, yenileme sonrası veriyi, tekrar kaydetmeyi, yayın/duraklat/devam/kapat durumlarını, klavye ve a11y kontrollerini geçiriyor. DOM, CSS, metin ve iş kuralı değişmedi. |
| Oyun yayın ve rıza | Mevcut kapalı yönetim bölümü açılıyor. Eksik rızayla yayın reddi, gerçek özel onay bağlantısı, finalist API/detay göstergesi, oyun listesi ve detayındaki yapımcı/itch/metadata/a11y korunuyor. Rıza geri çekilince detay 404 ve liste kartı yok. Editoryal arşivdeki üç onaylı oyun başlığı/adresi bağımsız kalıyor. |
| Link yönetimi ve footer | Unique sahipli kategoride sıra, iç/dış kısa URL 307, gerçek PNG QR çözümü, iki linkin gizlenmesi ve kısa URL/QR 404 doğrulanıyor. Yayımlı linklerin footer'a sızmadığı da kontrol ediliyor. Footer ayrı contact-settings kaynağında mevcut bağlantıları koruyarak sıra, hedef/rel, mobil/masaüstü taşma, a11y ve gizlemeyi doğruluyor. |
| Kaynak afiş, iki genişlik | Gerçek mevcut 1080×1350 afiş gerçek medya yükleme/yayın hattından geçiyor. Yalnız izole fixture DB'de unique DEMO etkinliği; 2099 tarihi açıkça sentetik test girdisidir. Ana sayfa ve Etkinlikler'de kaynak boyutu, 1.25 oran, konumlandırma, İstanbul saatleri, link, taşma ve a11y; mevcut başkan videosu/fotoğrafı korunuyor. Gerçek Coffee Talk taslağı değiştirilmedi. |
| Galeri yönlendirmesi | /admin/galeri → /admin/ulujam-arsivleri yönlendirmesi. Yeni sentetik 2025 taslağında mevcut klasör görseli seçiliyor; kayıt/yenileme sonrası açıklama ve dosya yolu aynı, taslak genel sitede görünmüyor. Mevcut 2026 arşivi değişmiyor; mobil/a11y ve anonim API 403 korunuyor. |

Hedefli koşular: form/yönetim/arşiv 8/8, oyun 2/2, kaynak medya 2/2, link/footer/API 3/3 geçti. Link testindeki yeni kategori locator'ı ilk denemede bekledi; trace, seçicinin çözülmediğini gösterdi. Mevcut combobox'ın erişilebilir adına geçilince 3/3 geçti. Test gövdesi ve assertion zaman aşımı/eşiği değişmedi. İlk oyun cleanup denemesinde CSRF alanı/token ömrü hatası görüldü; tüm yardımcı yazımları her istekte güncel csrfToken ve yanıt Origin'i alıyor. Güvenlik denetimi gevşetilmedi.

Temizlik sözleşmesi: linkler yalnız sahipli kategoride gizlenir; contact-settings özgün verisi güncel revision ile geri yüklenir. Afiş fixture'ı arşivlenir, mediaId ayrılır, sonra medya silinir. Oyun özgün kısmi yayın durumuna, başlık/finalist/derece ve boş yapımcılarına döner. İlk yayın slug'ı kilitlediğinden ayrılmış test slug'ı UUID DB kapanana kadar kalır; birebir satır restorasyonu iddia edilmez. Silme API'si olmayan taslak/sahipli kayıtlar yalnız harness'in UUID DB'siyle kaldırılır.

[Kaynak hash kanıtı](../../.local/phase-0a/followup-source-recheck.json): v0.1 kayıtlı 646/646 dosya aynı; v0.2 src/public 495 dosyadan 494'ü aynı, yalnız yukarıdaki form anahtarı satırı farklı. Public 114/114, 11 stil dosyası, 6 font, 95 görsel ve 15 video değişmedi. Manifest dışında kalan Finder metadata'sı ve iki önceden mevcut güvenlik testi için başlangıç bayt eşliği iddia edilmiyor. Bu kaynak kanıtıdır; piksel eşliği kabulü hâlâ 0C'dir.

Bağımsız son inceleme, üretim form kimliği, test kapsamı, DB izolasyonu, fixture temizliği ve gateway yaşam döngüsünde açık Critical/Important bulgu bırakmadı.

## Devamın nihai kabulü

| Güncel kontrol | Sonuç / kanıt |
|---|---|
| pnpm test | 78 dosya / 381 geçti, 93.2sn; [log](../../.local/phase-0a/logs/followup-test.log). |
| pnpm test:integration | 43 dosya / 226 geçti, 83.4sn; genel paketin alt kümesidir, toplamda ikinci kez sayılmaz. [Log](../../.local/phase-0a/logs/followup-integration.log). |
| Tam üretim TLS test:e2e | 103 senaryodan 101 geçti, 0 başarısız, mevcut 2 HTTP koşullu atlama; 170.7sn, çıkış 0. [Log](../../.local/phase-0a/logs/followup-e2e-full.log). |
| HTTP ek koşu | localhost ve 127.0.0.1 giriş/oturum yenileme/çıkış 2/2 geçti, 16.2sn. Böylece toplam 103 farklı E2E senaryosu uygun ortamında geçti. [Log](../../.local/phase-0a/logs/followup-e2e-http.log). |
| typecheck / lint | Her ikisi geçti. Next'in ürettiği next-env.d.ts özgün hâline konduktan sonra tsc --noEmit de geçti. |
| build | Tek üretim satırı düzeltmesiyle 9.3sn, çıkış 0; 77 dinamik rota. Önceden kayıtlı Wallet tracing uyarısı sürüyor. [Log](../../.local/phase-0a/logs/followup-form-build.log). |
| config:check / db:check | İkisi de geçti; çalışma DB'sine migration uygulanmadı. |
| pnpm audit --prod --audit-level=low | Çıkış 0; bilinen güvenlik açığı bulunmadı. [Log](../../.local/phase-0a/logs/followup-audit.log). |
| security:source / security:wallet | 805 kaynak ve 3227 üretim paketi dosyasında 0 sır bulgusu / 0 yasak dosya. |
| Çalışma DB'si ve kaynak temizliği | 47 tablo sayımı ve 26 migration birebir aynı; izinli editoryal envanter doğru. Dokuz eski test DB'sinin tam kümesi korundu. Yeni test DB'si, standalone klasörü ve başka istemci bağlantısı 0. [Karşılaştırma](../../.local/phase-0a/followup-resource-audit.json). |

Tam komut/çıkış/süre özeti [followup-verification.json](../../.local/phase-0a/followup-verification.json), bütün tarihî koşular [results.jsonl](../../.local/phase-0a/results.jsonl) içindedir. Başarısız teşhis denemeleri korunmuştur; son yeşil sonuçlar onları geçmişten silmez.

**Karar:** 0A kabul edildi. Başlangıçtaki yedi E2E engeli kapandı; uygulama görsel dili değişmeden mevcut ürün/test sözleşmeleri uzlaştırıldı. Geçici test deposu kaldırıldı; PostgreSQL/Colima başlangıçtaki durmuş durumlarına döndürüldü. Mevcut volume ve dokuz eski DB korundu. [Servis kapanış kaydı](../../.local/phase-0a/followup-services-final.json). Bu kabul 0B cache düzeltmesini, 0C piksel eşliğini, Faz 1'i veya canlıya hazır olmayı kapsamaz. Sıradaki iş 0B'dir; bu tur başlatılmadı.
