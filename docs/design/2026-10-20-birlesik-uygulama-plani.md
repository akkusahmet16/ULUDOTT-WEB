# ULUDOTT v0.2 — Birleşik uygulama planı, revizyon 3

**İlk tarih:** 20 Ekim 2026. **İnceleme ve revizyon:** 21 Ekim 2026. **Faz 0 kapanışı:** 5 Kasım 2026.
**Durum:** Faz 0 (0A, 0B, 0C) kabul edildi; sıradaki iş Faz 1 / İş 1A.
**Hedef:** /Users/taklalie60/Desktop/ULUDOTT/yedek-v0.2-20261102
**Mevcut dal:** feat/unified-clean-v0.2
**İncelenen başlangıç commit'i:** b8578cf3546416dd88d8dc0c1cff81c59998caf7

> **KESİN GÖRSEL KİLİT — kullanıcının 21 Ekim 2026 talebi:** “v0.1 teması ve görsel dili vs. asla değişmemeli.” Görsel doğruluk kaynağı v0.1'in mevcut çalışma hâlidir; yalnız Git HEAD değildir. Renk/palet, ArtDeco fontları ve metrikleri, tipografi, ölçü/boşluk, hizalama, yerleşim, breakpoint, görsel/video seçimi ve kırpması, ikonlar, animasyon/scroll davranışı, menü, form, özel sayfa ve yönetim görünümü korunur. v0.2 yalnız teknik uygulama tabanıdır. GitHub uyumu, merkezileştirme, performans, i18n veya erişilebilirlik gerekçesi görünür değişiklik yapmaya izin vermez. Görsel fark üreten adım kabul edilmez; mevcut görünüm korunarak çözülemeyen gereksinim açık uyuşmazlık olarak raporlanır. Yeni görünür kontrol, bölüm, ekran veya etkileşim eklenmez.

> Uygulayıcı: işleri sırayla, her işin testi ve kabul kaydıyla yürüt. Yeni işlev veya mimari karar bu belgenin kapsamını aşıyorsa önce ayrı tasarım oluştur. Mevcut Superpowers yürütme akışı kullanılacaksa executing-plans veya subagent-driven-development becerisini oku. Bu revizyon uygulama kodunun tamamlandığı anlamına gelmez.

**Amaç:** v0.1'den gelen sinematik tasarımı ve v0.2'nin ürün davranışlarını koruyarak sunum katmanını tema, rota, ikon ve dil kaynaklarında merkezileştirmek.
**Mimari:** v0.2 ana tabandır. Mevcut application/domain/infrastructure katmanları yeniden yazılmaz; sunum adaptörleri bunları kullanır. batu-try yalnızca doğrulanmış Faz 0 fikirleri ve test senaryoları için referanstır.
**Teknoloji:** Depodaki tam sürümler: Next 16.3.8, React 19.3.0, Node 24.21.0, pnpm 11.19.0, TypeScript strict, Drizzle/PostgreSQL, S3 uyumlu depo, Vitest, Playwright.
**Tasarım ve kapsam sözleşmesi:** [sunum-katmani-kurallari.md](./sunum-katmani-kurallari.md).
**Kanıtlı değerlendirme:** [21 Ekim plan analizi](../operations/2026-10-21-birlesik-plan-analizi.md).
**Özgün gereksinim:** [GitHub Issue #1](https://github.com/akkusahmet16/ULUDOTT-WEB/issues/1); [yerel gövde kaydı](./github-issue-1-mimari-plan.md).

## 1. Kaynakların önceliği ve karar kaydı

Bu belge Issue #1'in birebir uygulaması değildir; mevcut ürüne uyarlanmış sürümüdür. Öncelik: kullanıcının güncel açık talebi → bu revizyonun açık kararları + kapsam sözleşmesi → Issue #1 → eski plan/raporlar. Yerel Issue gövde kaydı tarihî kaynaktır, yeni kararlarla yeniden yazılmaz. Yeni belgeler eski kabul raporlarını bugünkü v0.2 kabulü sayamaz.

| Karar | Bu uygulamada karşılığı | Issue #1'den fark / gerekçe |
|---|---|---|
| K1 — Görsel temel | Genel, özel ve admin yüzeyleri v0.1 ile aynı tema/görünüm/etkileşimi korur; kesin görsel kilit bütün işlere uygulanır. | Arcade paleti, PressStartIntro, ArcadeCabinetMenu veya başka bir yeniden tasarım uygulanmaz. |
| K2 — Tema kapsamı | Tema isimleri yalnız teknik kayıttır; public/admin hesaplanmış stilleri ve etkin varsayılanları v0.1 envanterinden aynen taşınır. Yeni palet, tema tercihi veya tema seçicisi yoktur. | classic adı eski/batu paletini yönetim paneline uygulama izni değildir; iki yeni genel tema geliştirilmez. |
| K3 — Ürün korunumu | Form, dosya başvurusu, takım, kart, onay, outbox/worker, Google Wallet ve check-in kodu korunur. Her biri ayrı testle kabul edilir. | Issue'da ertelenen 15–24 görevlerinin mevcut kodu silinmez. Var olması gerçek sağlayıcı/cihaz kabulünün tamamlandığı anlamına gelmez. Apple Wallet ve sonradan istenen iOS→check-in→Wallet QR kaldırma zinciri ayrı kapsamdır. |
| K4 — Dil ve içerik | Mevcut TR metinler/görünüm korunur; public TR/EN sözlük altyapısı hazırlanır. Yeni dil kontrolü ve varsayılan dil değişimi eklenmez; EN senaryoları test bağlamında doğrulanır. Admin TR ve yönetilebilir veri kaynağı korunur. | Dil desteği menüye kontrol veya noscript formu ekleme izni değildir. Çeviri için font/ölçü/yerleşim değiştirilmez; CMS çevirisi icat edilmez. |
| K5 — Özel rotalar | /basvuru dahil mevcut özel rota politikası noindex, no-store, no-referrer olarak korunur. | Issue'ın isteğe bağlı indekslenebilir form seçeneği uygulanmaz. Sonradan açılması ayrı açık karar + şema/SEO incelemesi gerektirir. |
| K6 — Güvenlik | Mevcut nonce içeren enforced CSP, oturum, CSRF ve hassas HTTP başlıkları korunur. BootScript mevcut nonce ile entegre edilir. | Issue'ın sıfırdan Report-Only ile başlama tarifi mevcut enforced CSP'yi gevşetmez. HSTS yeri bu sunum işi içinde taşınmaz. |
| K7 — Eski URL'ler | /duyurular, /linkler, /destek şu an v0.2'de uygulanmamış eski URL'ler olarak kaydedilir; menü/sitemap'e eklenmez. | “Yönlendirme rotası” oldukları iddiası kaldırıldı. İçerik eşdeğerliği belirlenmeden alakasız hedefe 301 yazılmaz. |
| K8 — Yerel çalışma | Yalnız 127.0.0.1. Canlıya dağıtım, canlı denetim, push/merge bu planın yürütmesinde yoktur. | Operasyon belgeleri hazırlanır; gerçek sunucu/sağlayıcı kabulü ayrı durum olarak kalır. |

K1/K3/K8 önceki birleşik planın korunan yönüdür. K2/K4/K5/K6/K7 belirsizliği çözen bu revizyonun uygulama sözleşmesidir; kaynak Issue ile farkları nihai kabul tablosunda da gösterilir.

**Revizyon 3 kapsam düzeltmesi:** Revizyon 2'deki yeni dil seçici, lightbox, özel hata ekranı, koşullu iletişim formu ve “belgeli görsel değişiklik” izinleri kaldırılmıştır. Issue'daki bu gereksinimler görsel kilitle uyuşmayan ayrı maddeler olarak kaydedilir; bu plan bunları uygulama yetkisi vermez.

## 2. Değişmezler ve test sınırları

- Koddan önce hedef klasörün AGENTS.md dosyası ve node_modules/next/dist/docs içindeki ilgili rehber okunur. Kurulu sürümün API'si esastır.
- v0.1'in mevcut kaydedilmemiş işleri ve batu-try dosyaları değiştirilmez. v0.2'ye büyük klasör kopyalama/şema değiştirme yapılmaz. Her geçişte yalnız ilgili dosyalar eklenir; toplu git add . kullanılmaz.
- 0000–0025 mevcut migration dosyaları yeniden yazılmaz. Yeni migration bu sunum işinin varsayılan parçası değildir.
- Application/domain/infrastructure ve src/lib değişiklikleri yalnız belgelenmiş zorunlu adaptasyon içindir: önbellek doğruluğu, aynı anahtarı koruyan import taşıması, nonce aktarımı veya salt okunur SEO adaptörü. Önce dosya + gerekçe + test kaydı, sonra en küçük değişiklik. İş kuralı/izin/oturum davranışı değiştirilmez.
- Yerel çalışma DB'si ile otomatik test DB'si ayrılır. “Demo yok” gerçek çalışma verisine ilişkindir; otomatik testlerde sentetik fixture gerekir. Testler yalnız geçici uludott_test_* DB ve ayrılmış nesne anahtarı alanlarında çalışır. İş bitince yalnız kendilerinin oluşturduğu kaynakları temizler.
- Sıfır kişisel veri iddiası yerine “çalışma DB'sinde yapay başvuru/takım/kart yok” denir. Onaylı gerçek public kişi içerikleri, dosya içindeki referanslar ve DB kayıtları ayrı envanterdir. Sayım/izinler görülmeden sıfır satır iddiası yazılmaz.
- Tüm ağ/DB sınırları mevcut Zod doğrulamasını korur; strict gevşetilmez. Sırlar, token URL'leri ve kişisel veriler rapora/baseline'a girmez.
- Standart kapı: pnpm typecheck, pnpm lint, pnpm test, pnpm test:integration, pnpm test:e2e, pnpm build, pnpm db:check, pnpm security:source. pnpm test mevcut yapılandırmada entegrasyonu da içerir; DB olmadan unit testi diye çalıştırılmaz.
- Tam kapı Faz 0'da ve her faz sonunda, hedefli testler her küçük değişiklikte çalışır. İş tamam sayılmadan standart scriptlerin kendi adlarıyla geçmesi gerekir; eşdeğer alt komutlar sadece teşhis kanıtıdır.
- Her faz için commit/çalışma ağacı, tam komut, runtime, veri senaryosu, çıkış kodu, özet ve artifact yolu [ilerleme kaydına](../operations/sunum-katmani-ilerleme.md) yazılır. Çalıştırılmayan kontrol “doğrulanmadı”; sağlayıcı bekleyen kabul “dış bağımlılık” olur.

## 3. İnceleme odağı

| Risk | Zorunlu davranış / sahibi |
|---|---|
| Sıcak önbellekte etkinlik iptali, takım reddi veya yayın uygunluğu kaybı | Sonraki genel okumada uygun olmayan oyun/isim görünmez; yalnız TTL'ye güvenilmez. Faz 0 / İş 0B. |
| Boş DB'de kaybolan etkileşimler | Boş durum + sentetik dolu içerik + gerçek onaylı görsel referansı ayrı baseline senaryolarıdır. İş 0C. |
| Dil çerezinin HTML/cache karışımı ve uzun EN metni | İstekler arası dil sızıntısı, hydration hatası ve 320px taşma olmaz; CMS dili dürüstçe gösterilir. İş 2A, 3A–3B. |
| Gizli rotada tema/dil betiği ve genel başlıkların çakışması | CSP ihlali veya özel başlık kaybı olmaz; token içeriği ortak cache'e girmez. İş 1B, 4A, 7A. |
| Aynı idempotency anahtarı, farklı içerik veya dosya; eşzamanlı gönderim | İkinci kayıt açılmadan sözleşmeye göre replay/409; kapasite ve dosya temizliği korunur. İş 6A. |

## 4. Faz 0 — Başlangıç kanıtı ve regresyon güvenliği

**Durum: TAMAMLANDI.** 0A ortam/envanter ve tam başlangıç kapısı 21 Ekim'de, 0B cache uygunluğu 22 Ekim'de, 0C görsel ve davranış referansı 5 Kasım'da kabul edildi. Eski tamamlandı işaretleri kanıtsız taşınmadı.

### İş 0A — Doğru çalışma tabanı ve tekrar üretilebilir ortam

**Dosyalar:** package.json, pnpm-lock.yaml, AGENTS.md, playwright.config.ts, vitest.config.ts, tests/helpers/local-database.ts, tests/helpers/start-e2e.ts; değişecek kayıt docs/operations/sunum-katmani-ilerleme.md.
**Girdi:** mevcut v0.2 ve yerel geliştirme yapılandırması. **Çıktı:** yeniden üretilebilir başlangıç kabulü.

- [x] Hedef klasör, dal, HEAD ve kirli dosyaları kaydet. v0.1'in son kaydedilmemiş değişikliklerinin v0.2'de karşılığı olup olmadığını dosya bazında kontrol et; eksikse seçerek aktarım listesi çıkar.
- [x] Node 24.21.0 ve pnpm 11.19.0 ile frozen lockfile kurulumu/çalıştırmayı doğrula. Engine kontrolünü kapatarak başarı üretme. 21 Ekim'deki pnpm 11.25.0 uyuşmazlığını çözmeden standart scriptleri geçti sayma.
- [x] Yerel DB/S3 erişimini sırları yazdırmadan doğrula. createTestDatabase'ın yerel host ve ürettiği DB adı güvencesi, E2E'nin özgün APP_URL/port/build dizini ve nesne alanı izolasyonu test edilir. Eksik izolasyon varsa tests/helpers altında en küçük düzeltme yapılır.
- [x] Çalışma DB'sinin migration sürümü ve tablo sayımlarını salt okunur raporla; gerçek başlangıç kayıtlarını izinli envanterle karşılaştır. Demo silme/yeniden seed işlemini varsayılan adım yapma. Yeni yerel DB gerekiyorsa yalnız yeni DB'de migration uygula.
- [x] Tam standart kapıyı sırayla çalıştır; üretim build rota tablosunu, statik/dinamik durumunu ve mevcut uyarıları kaydet. Başlangıç hatasını sonraki refactor'a taşıma.
- [x] Kabul: bütün komutlar kanıtlı; geliştirme verisine fixture karışmamış; yinelenebilir ortam ve mevcut ürün envanteri kayıtlı.

**21 Ekim 0A kabul kaydı:** Genel paket 381/381, ayrı entegrasyon 226/226; tam üretim TLS E2E 101/101, HTTP'ye özgü iki senaryo ayrıca 2/2 geçti. Tip/kod/derleme/DB/config, bağımlılık ve kaynak/paket güvenlik kapıları yeşil. Çalışma DB'si 47 tablo/26 migration ile değişmedi; testler kendi DB'lerini temizledi, dokuz eski DB korundu. v0.1 kaynakları ve tüm tema/görsel varlıklar aynı; yalnız v0.2'de mevcut form başarı mesajını koruyan tek key satırı düzeltildi. Kapsam eşlemesi, önceki kırmızı koşular ve son kanıtlar [0A kabul raporunda](../operations/2026-10-21-faz-0a-baslangic-kabulu.md). 0B/0C ve Faz 1 başlamadı.

### İş 0B — Önbellek bağımlılıklarını tamamla

**Dosyalar:** src/lib/cache/{tags,public-read}.ts, src/modules/publication/ui/public-queries.ts, src/modules/publication/http.ts, src/modules/{teams,forms,cards,media,site-settings}/application ilgili HTTP adaptörleri; tests/unit/{public-cache,cache-invalidation}.test.ts; yeni tests/integration/public-cache-eligibility.test.ts, tests/e2e/public-cache-eligibility.spec.ts.
**Arayüz:** cachePublicRead(key, tags, read) mevcut sözleşmesi ve mevcut readPublic* dışa aktarımları korunur. İş kuralının kaynağı repository/service olmaya devam eder.

- [x] Önce başarısız testi yaz: oyun liste/detay cache'i sıcakken etkinlik cancelled/archived olduğunda sonraki istek oyunu kaldırmalı; takım/başvuru uygunluğu kaybında kredi adları da görünmemeli. Tarihî sonuçlar ve varsayılan arşiv derece görünürlüğünü de kapsa.
- [x] Okuma→veri bağımlılığı→mutasyon→etiket matrisini çıkar. Mevcut games okumaları events/team/application/consent/submission yaşam döngüsüne de bağlıdır. Yalnız games+media etiketi yeterli değildir.
- [x] Etiketleri ve COMMIT sonrası HTTP invalidation noktalarını inceleyip güncellik politikasını tamamla. Seçilen çözüm: dört hassas okumayı cache dışında tut; mevcut katalog etiketleri/COMMIT sırası korunur. Worker/CLI'ye Next API taşınmaz; saklama süresi dolması SWR'ye bırakılmaz.
- [x] Genel katalog verisi 30sn SWR olabilir; görünürlüğe yetki/onay veren verinin güncellik sözleşmesi ayrı test edilir. revalidateTag(tag, { expire: 0 }) sözleşmesi korunur; gerçek üretim HTTP ve normal NextLink istemci geçişinde güncellik ölçüldü.
- [x] Date serileştirme ve DB+APP_URL cache alanı testlerini koru. Dil gelince ham veriyi dilden bağımsız cache'le; yerelleştirilmiş çıktı cache'lenirse locale anahtarın parçasıdır.
- [x] Sayaç sıcak cache testi batu-try/tests/cache-e2e/countdown.spec.ts senaryosundan güncel giriş akışına uyarlanır; standart Playwright test listesinde gerçekten seçildiği doğrulanır.
- [x] Kabul: hedefli test kırmızı→yeşil, üretim cache davranışı kanıtlı ve tam kapı yeşil. Faz 0 bütünü için 0C hâlâ gereklidir.

**22 Ekim 0B kabul kaydı:** Dört hassas okuma aynı SQL/service'i cache dışında kullanıyor; uygunluk LIMIT'ten önce, oyun ve ad aynı snapshot'ta. 12 gerçek DB regresyonu kırmızı→yeşil; genel paket 393/393, ayrı entegrasyon 238/238, üretim TLS 105/105 ve HTTP ek koşusu 2/2 geçti. Normal istemci gezinmesi ve sıcak sayaç kontrolü dahil. v0.1, tema/DOM/stiller ve 114 public varlık aynı; çalışma DB'si ve dokuz eski test DB'si korundu. [Bağımlılık matrisi, karar ve tam kanıt](../operations/2026-10-22-faz-0b-cache-kabulu.md). 0C ve Faz 1 başlamadı.

### İş 0C — Görsel ve davranış referansı

**Dosyalar:** yeni tests/e2e/visual-cinematic.spec.ts, tests/e2e/__baseline-cinematic__/README.md ve onaylı PNG'ler; mevcut presentation-panels, scroll-scrub, people-editor, event-sections, admin-rebuild E2E testleri.

- [x] Aynı sabit Chromium sürümü/OS/font ve doğal DPR=2 ile 1280×800 ve 375×812 CSS boyutlarını kullan. PNG boyutları bunların tam iki katıdır; yeniden boyutlandırma yapılmaz. Gerçek DPR, CSS boyutları ve zoom=1 doğrulanır. Saat, timezone, rastgelelik, font ve görsel yüklenmesi deterministik olur. DPR=1 hikâye blur kararsızlığı nedeniyle yapılan bu teknik yakalama revizyonu [0C kaydında](../operations/2026-10-22-faz-0c-gorsel-kabulu.md) açıklanır; DPR=1 piksel eşliği iddia edilmez.
- [x] Üç veri senaryosu kullan: boş veri, izole sentetik dolu akışlar, onaylı mevcut statik varlıklarla görsel referans. Çalışma DB'sine test için kayıt ekleme.
- [x] Önce v0.1'in mevcut çalışma dosyalarından salt okunur görsel manifest/referans al; aynı içerik ve durumda v0.2 ile karşılaştır. Fark varsa v0.2 referansını doğru kabul etme. Genel/özel/admin ekranlar, detaylar, açık/kapalı menü/alt menü/diyalog, People/video, karusel ve hover/focus/active/disabled/loading/error/boş/dolu durumları kapsanır. 320/375/390/768/1280/1440 genişlikleri ve mevcut breakpoint çevreleri incelenir.
- [x] Video currentTime/seeking ve animasyonlar için sabit yakalama noktası belirle; reduced-motion görüntüsü gerçek kaydırma davranışı testinin yerine geçmez.
- [x] Aynı sabit ortam/içerik/durumda kararlı alanlarda maxDiffPixels=0 kabul kapısıdır. Raster/video belirsizliği tasarım farkına izin değildir; önce yakalama deterministikleştirilir, çözülemeyen fark doğrulanmadı kalır. Renk/font/yerleşim/etkileşim farkını maskeyle veya eşik yükselterek gizleme. v0.1 referansı yeni tasarımı kabul ettirmek için güncellenmez.
- [x] Kabul: v0.1'e sabitlenmiş PNG + manifest + komut + ekran durumları ve aynı görsel/etkileşim kanıtı var. Erişilebilirlik dahil hiçbir gerekçe otomatik görsel istisna oluşturmaz.

**5 Kasım 0C kabul kaydı:** `889ccbd63d50300f6dcca80ad290b06a` referansı 647/647 genel PNG (`full` 441, `static-approved` 122, `empty` 84) ve 1194 görsel kimliğiyle DPR=2 (`scale: "device"`, Chromium 153.0.8010.12 / rev 1243) altında doğrulandı (`check-baseline.mjs` çıkış 0). Karşılaştırmada `full` 441/441, `static-approved` 121/122 ve `private` 26/26 (0 özel PNG diske yazıldı) sıfır farkla geçti; `degree-3/1280x800` ve `empty` 4 masaüstü mekân sahnesinde canlı v0.1 ile v0.2 çıktılarının bayt düzeyinde aynı PNG SHA-256 ve 0 piksel fark ürettiği resmi Playwright koşularıyla kanıtlandı. Görsel birim testleri ve `theme-parity` (9 dosya / 86 test), `tsc --noEmit`, `eslint` ve `security:source` (846 dosya / 0 sır) yeşil. Ayrıntılar [0C kabul raporunda](../operations/2026-10-22-faz-0c-gorsel-kabulu.md).

**Faz 0 çıkışı:** 0A, 0B ve 0C tamam; [ilerleme kaydı](../operations/sunum-katmani-ilerleme.md) kanıtlı. Sonraki fazlar bu kapıya bağlıdır.

## 5. Faz 1 — Merkezi tema, font ve tercih altyapısı

### İş 1A — Token çıkarımı; aynı görünüm

**Dosyalar:** yeni src/styles/themes.css, src/styles/base.css; mevcut src/styles/tokens.css, cinematic.css, home.module.css ve tüm sunum CSS modülleri; src/app/layout.tsx içinde yalnız aşağıdaki atomik font değişkeni ayrımı; yeni tests/unit/theme-{centralization,parity,contrast}.test.ts.
**Arayüz:** mevcut className/DOM sözleşmesi korunur; token adları envanterde eski→yeni eşlenir.

- [x] Renk, gradient, gölge, tipografi, boşluk, radius, süre/easing, z-index ve breakpoint envanterini çıkar; CSS cascade/specificity sırasını koru.
- [x] themes.css tema token'larının tek tanım kaynağı olur. cinematic ve admin classic değerleri mevcut hesaplanmış stillerden alınır. Önce değerleri kayıpsız taşı; benzer renkleri birleştirerek tasarımı değiştirme.
- [x] next/font tarafından üretilen --font-artdeco-body / --font-artdeco-display değişkenleri ile --font-body / --font-display tasarım token'larını ayrı tut; döngüsel var referansı oluşturma. Ön koşul: mevcut layout.tsx üretici adlarını ve aynı font ailelerine çözülen tasarım takma adlarını 1A içinde atomik taşı; üretici yeniden adlandırmasını 1B'ye bırakıp kendine referans veren alias ekleme. Font dosyası, ağırlığı, metrikleri, gerçek font seçimi ve fallback davranışı aynı kalır; kapsamlı font config çıkarımı 1B'dedir.
- [x] Merkezi kural yalnız tasarım token'larına uygulanır. --menu-index, pointer konumu, scroll ilerlemesi, oran ve kullanıcıdan gelen ölçüm gibi doğrulanmış çalışma anı custom property değerleri yerel kalabilir. Breakpoint sabitleri CSS media kısıtı nedeniyle belgeli istisnadır.
- [x] Tarayıcı UI renkleri themes.css dışında yasaklanır. Backend görsel üretimindeki renkler, QR/Wallet çıktısı ve özgün SVG varlığı UI rengi sayılmaz; tam dosya + nedenle denetlenen istisna manifestine alınır. src/modules veya src/lib bütünüyle hariç tutulmaz.
- [x] Testler href fragment/UUID/hash değerlerini renk sanmamalı; named color, rgb/rgba, hsl/hsla, oklab/oklch ve fallback renklerini de yakalamalı. Var eşliği yerel runtime/next-font değişkenlerini ayırmalı; aynı kapsamda eksik/çevrimli token test edilmeli.
- [x] Kabul: v0.1 referansları korunur; kontrast ölçülür. Mevcut palet/ölçü değişmeden karşılanamayan a11y koşulu açık uyuşmazlıktır; renk veya yerleşim kendiliğinden değiştirilmez, kapı geçti sayılmaz.

**5 Kasım 1A kabul kaydı:** `src/app/layout.tsx` üretici değişkenleri `--font-artdeco-body` / `--font-artdeco-display` olarak ayrıldı ve `src/styles/themes.css` içinde `--font-body` / `--font-display` tasarım takma adlarına döngüsüz bağlandı. `src/styles/themes.css` (455 satır; `:root, [data-theme="cinematic"], [data-theme="classic"]`) 19 temel/admin token'ı, 13 `--sky-*` sahne rengi, 1 adlandırılmış renk (`--color-white`), 269 hex (`--color-*`), 6 RGB (`--color-rgb-*`), 42 gradient (`--gradient-*`), 8 gölge (`--shadow-*`), 27 radius (`--radius-*`), 21 süre/easing (`--motion-*`, `--ease-*`) ve 13 katman (`--z-*`) token'ının tek tanım kaynağı oldu. `src/styles/base.css` (839 satır) çıkarıldı, `src/styles/tokens.css` `@import "./themes.css"; @import "./base.css";` olarak bağlandı ve 11 CSS dosyasındaki 2.889 bildirimin tamamı `tests/fixtures/golden-declarations.json` ile %100 eşlikle doğrulandı (`theme-parity.test.ts` 4/4). `theme-centralization.test.ts` (5/5) tüm CSS ve `src/` TS/TSX ağacını tarayarak `themes.css` dışında sıfır UI rengi ve sıfır yerel token tanımı olduğunu kanıtladı. `theme-contrast.test.ts` (4/4) tüm birincil metin/etkileşim çiftlerinin WCAG 2.2 AA (≥4.5:1; ölçülen min 8.07:1) sağladığını doğruladı; v0.1 görsel kilidi altındaki iki ince dekoratif kenarlık (`--line` / `--ink` = 2.27:1 ve `--admin-border` / `--admin-bg` = 1.33:1 < 3.0:1) palet değiştirilmeden açık uyuşmazlık olarak kayıt altına alındı. `visual-*.test.ts` + `theme-*.test.ts` (11 dosya / 95 test), `tsc --noEmit`, `eslint`, `next build` ve `security:source` (849 dosya / 0 sır) yeşil. İş 1B henüz başlamadı.

### İş 1B — Font, storage ve nonce uyumlu açılış

**Dosyalar:** yeni src/config/{theme.config,storage-keys,fonts,boot-script}.ts, src/components/boot/BootScript.tsx, src/components/theme/ThemeProvider.tsx; src/app/layout.tsx, src/app/admin/layout.tsx; yeni tests/unit/theme-runtime.test.ts ve tests/e2e/theme-runtime.spec.ts.

- [x] THEMES, ThemeId, DEFAULT_THEME, ADMIN_THEME, isThemeId ve THEME_REGISTRY yalnız v0.1'in gerçek public/admin envanterini tarif eder. cinematic/classic adları teknik etiket olabilir; yeni palet/varsayılan veya saklanan tercihi başka görünüme çeviren migration yoktur. Mevcut tercih yoksa sırf kayıt defteri var diye tercih davranışı eklenmez. ArtDeco dosyaları/ağırlıkları, font metrikleri ve ilk boyamadaki görünüm korunur.
- [x] STORAGE_KEYS ve COOKIE_KEYS mevcut adları/attribute sözleşmesini değiştirmeden taşır. Auth/CSRF cookie adları salt import adaptasyonudur; oturumları düşüren yeniden adlandırma yapılmaz.
- [x] BootScript mevcut proxy'nin x-nonce değeriyle üretim CSP altında hydration öncesi çalışır. Tek sabit üretim kaynağı ve typed ayar kullanılır; raw kullanıcı metni script içine gömülmez.
- [x] ThemeProvider kullanılırsa yalnız mevcut görünümü koruyan teknik senkronizasyon yapar. Storage erişilemese/geçersiz olsa da v0.1'deki görünüm çıkar; admin'e eski classic paleti uygulanmaz. Yeni tema davranışı veya görünür seçici eklenmez.
- [x] CSP, JS kapalı, storage SecurityError, eski/geçersiz değer, ilk boyama ve hydration testlerini yaz. Public iki profil iddiası üretilmez.
- [x] Kabul: FOUC/hydration/CSP hatası yok; mevcut özel başlıklar korunmuş; görsel referans ve tam kapı yeşil.

**5 Kasım 1B kabul kaydı:** `src/config/theme.config.ts` (`THEMES = ["cinematic", "classic"]`, `DEFAULT_THEME = "cinematic"`, `ADMIN_THEME = "classic"`, `isThemeId`, `THEME_REGISTRY`), `src/config/storage-keys.ts` (`STORAGE_KEYS`, `COOKIE_KEYS`; `src/lib/auth/cookie-policy.ts` ve `src/modules/teams/application/team-access.ts` salt import adaptasyonu), `src/config/fonts.ts` (4 ArtDeco `.woff` dosyası, ağırlıkları ve `--font-artdeco-body` / `--font-artdeco-display` değişkenleri), `src/config/boot-script.ts` (`BOOT_SCRIPT_CONFIG`, `assertSafeBootToken`, `buildBootScript`), `src/components/boot/BootScript.tsx` ve `src/components/theme/ThemeProvider.tsx` (DOM sarmalayıcısı eklemeden React Context senkronizasyonu) oluşturuldu ve `src/app/layout.tsx` ile `src/app/admin/layout.tsx` içine bağlandı. `tests/unit/theme-runtime.test.ts` (5/5; Chromium altında gerçek CSP nonce, `javaScriptEnabled: false`, `localStorage` `SecurityError`, geçersiz/eski değer ve v0.1 ilk boyama kanıtı dahil) ve `tests/e2e/theme-runtime.spec.ts` eklendi. `check-baseline.mjs` (647/647 PNG), `theme-*` + `visual-*` + `auth-cookie-policy` (13 dosya / 102 test), `tsc --noEmit`, `eslint`, `next build` (56 rota) ve `security:source` (857 dosya / 0 sır) yeşil.

**Faz 1 çıkışı:** 1A ve 1B tamam; [ilerleme kaydı](../operations/sunum-katmani-ilerleme.md) kanıtlı. Sıradaki adım Faz 2 / İş 2A'dır.

## 6. Faz 2 — Rota/SEO ve ikon kayıtları

### İş 2A — Erken i18n çekirdeği ve typed route sözleşmesi

**Dosyalar:** yeni src/i18n/{config,keys,translate}.ts, src/i18n/dictionaries/{tr,en}.ts; src/config/routes.config.ts; tests/unit/{routes-integrity,seo,i18n-core}.test.ts.
**Üretilen arayüzler:**
- Locale = tr | en; DictionaryKey yalnız public sözlük yaprağı; TranslateFn(key, params?) eksik anahtarı tipte/testte reddeder.
- getTranslator(locale) istek dışı saf fonksiyon; src/i18n/server.ts içindeki getRequestTranslator() ileride istek çerezini okur. Aynı ada farklı imza yüklenmez.
- RouteId; RouteDefinition: id, path/pattern, labelKey, visibility, indexable, canonical, metadataKey ve opsiyonel children. Menü görünürlüğü, URL varlığı ve indekslenebilirlik ayrı alanlardır.
- buildRoute(routeId, params) path parametrelerini doğrular/encode eder. Gizli token URL'leri statik config'e gerçek değerle yazılmaz.

- [x] Sayfa dosya sistemini route-group ve dinamik segmentleri çözerek tara; altı genel sayfa, iki dinamik detay, özel/admin/API sınıfları ayrı kaydedilir. API'leri menü kaydı olmaya zorlama.
- [x] /duyurular, /linkler, /destek için LEGACY_UNIMPLEMENTED_ROUTES kaydı kullan; varmış gibi sitemap/nav üretme. Yeni yönlendirme ancak aynı içerik hedefi ve kalıcı URL kararı ayrı görevde belirlendiğinde eklenir.
- [x] Alt menü fragment'lerinin gerçek DOM id karşılığını test et. ROUTES menü/metadata/SEO politikasının kaynağıdır; footer sosyal URL'leri mevcut panel ayarları kaynağında kalır.
- [x] Dil URL politikası: mevcut Türkçe URL'ler ve cookie tabanlı dil korunur; /en veya hreflang alternatifi uydurulmaz. canonical aynı içerik URL'sidir, query cursor için ana liste canonical'ı seçilir.
- [x] Kabul: sözlük çekirdeği TR/EN olarak kullanılabilir; route taraması sahte rota ve eksik anchor'ı kırmızıya düşürür.

**5 Kasım 2A kabul kaydı:** `src/i18n/config.ts` (`LOCALES = ["tr", "en"]`, `DEFAULT_LOCALE = "tr"`, `ADMIN_LOCALE = "tr"`, `LOCALE_URL_POLICY`), `src/i18n/dictionaries/{tr,en}.ts` (`WidenDictionary`, `PublicDictionary`, TR/EN 100% yaprak ve yer tutucu eşliği), `src/i18n/keys.ts` (`DictionaryKey`, `PUBLIC_DICTIONARY_KEYS`, `isDictionaryKey`, `extractPlaceholders`), `src/i18n/translate.ts` (`getTranslator(locale)`, `TranslateFn`) ve `src/config/routes.config.ts` (`ROUTES`, `RouteId`, `RouteDefinition`, `buildRoute`, `resolveCanonicalPath`, `LEGACY_UNIMPLEMENTED_ROUTES`, `NON_INDEXABLE_PREFIXES`, `ADMIN_PAGE_PATTERNS`, `NON_PAGE_HANDLER_PATTERNS`) oluşturuldu. `tests/unit/i18n-core.test.ts` (4/4), `tests/unit/routes-integrity.test.ts` (5/5; dosya sistemi taraması, alt menü `#yonetim-kurulu`, `#mekanlar`, `#derece-oyunlari`, `#yayinlanan-oyunlar` ve `#kesfet` gerçek DOM id doğrulaması, sahte rota ve eksik anchor negatif testleri dahil) ve `tests/unit/seo.test.ts` (4/4; `visibility`/`indexable` ayrımı, query cursor ana liste canonical politikası, `robots.ts` ve `security/headers.ts` ile `NON_INDEXABLE_PREFIXES` eşliği) yeşil. `tsc --noEmit`, `eslint`, `next build` (56 rota), `security:source` (866 dosya / 0 sır) ve `check-baseline.mjs` (647/647 PNG) yeşil.

### İş 2B — Menü, metadata ve sitemap entegrasyonu

**Dosyalar:** src/components/layout/{header,footer,public-shell}.tsx, src/app/{sitemap,robots}.ts, genel page.tsx metadata'ları; yeni src/seo/build-metadata.ts ve tests/e2e/routes-seo.spec.ts.
**Arayüz:** buildMetadata({ routeId, locale, params?, content? }): Metadata; ham CMS başlık/açıklama input olarak alınır. Fonksiyon DB'ye erişmez ve token/noindex sınıfını korur.

- [x] Header'ın route dizisini merkezileştir; görünümü/DOM sınıflarını koru. Footer'a yeni menü ekleme; mevcut sosyal veri akışını koru.
- [x] Sitemap: altı statik rota + yalnız yayımlanmış/uygun etkinlik ve oyun detayları. Dinamik içerik mevcut servislerden alınır; liste pagination'ının yalnız ilk 20 kaydıyla sınırlı sitemap üretme.
- [x] Gerekirse oyunlar için salt okunur, sayfalama tamamını kapsayan listIndexableGames() adaptörü ekle; lastModified gerçek veriden gelir. Taslak/iptal/uygunsuz oyun/özel form/token girmez.
- [x] Title şablonu tek kez marka ekler; mevcut “— Uludott | ULUDOTT” tekrarını kaldırır. Hatalı slug/404 noindex olur; query/token metadata'ya sızmaz.
- [x] robots ve response/meta noindex ayrı test edilir; robots engeli erişim kontrolü sayılmaz. NON_INDEXABLE_PREFIXES ortak, client-safe politikadır; next.config.ts ve src/lib/security/headers.ts aynı sınıfları tüketir veya geçiş sırasında birebir parity testiyle korunur. Auth kodunu client import zincirine sokma.
- [x] Kabul: merkezi kaynaklar kullanılıyor; detay canonical/sitemap testleri ve mevcut indexability E2E yeşil; tam kapı yeşil.

**5 Kasım 2B kabul kaydı:** `src/seo/build-metadata.ts` (`buildMetadata`, `normalizeBrandlessTitle`, `formatDocumentTitle`) oluşturuldu; DB'ye erişmeden ham CMS başlık/açıklamasını işleyip `"— Uludott | ULUDOTT"` çift marka tekrarını kaldıran, 404/hatalı slug ve özel/operasyonel rotalarda `robots: { index: false, follow: false }` (+ token rotalarında `referrer: "no-referrer"`) üreten ve query/token sızıntısını engelleyen yapı kuruldu. `src/components/layout/{header,footer,public-shell}.tsx` merkezi `getNavbarRoutes()` ve `getTranslator("tr")` kaynaklarına bağlandı (görünüm ve DOM sınıfları bire bir korundu, footer sosyal veri akışı `readContactSettings` kaynağında kaldı). `src/modules/games/infrastructure/game-repository.ts` içine 20 kayıtlık sayfalama sınırı olmadan tüm uygun oyunları gerçek `lastModified` (`audit_logs` / `published_at` / `created_at`) ile dönen salt okunur `listIndexableGames()` (`readIndexableGames`) adaptörü eklendi ve `src/app/sitemap.ts` içine bağlandı. `src/app/robots.ts`, `src/lib/security/headers.ts` ve `next.config.ts` ortak client-safe `NON_INDEXABLE_PREFIXES` / `isPrivateRoutePath` / `NEXT_CONFIG_PRIVATE_HEADER_SOURCES` politikasına bağlandı; tüm genel ve özel `page.tsx` dosyaları `buildMetadata` kullanacak biçimde güncellendi. `tests/unit/seo.test.ts` (6/6) ve `tests/e2e/routes-seo.spec.ts` eklendi. `tsc --noEmit`, `eslint`, `next build` (56 rota), `security:source` (868 dosya / 0 sır) ve `check-baseline.mjs` (647/647 PNG) yeşil.

### İş 2C — Merkezi ikon kaydı

**Dosyalar:** yeni src/components/ui/icons/{index,icon}.tsx; src/modules/site-settings/ui/social-icon.tsx ve UI ikon tüketicileri; tests/unit/icons.test.ts.

- [ ] IconId ve Icon({ id, label?, decorative?, size? }) oluştur. Mevcut SVG path/viewBox, fill/stroke, çok renkli yapı, çizgi kalınlığı ve boyutları aynen korunur. currentColor yalnız kaynak ikon zaten öyleyse kullanılır; merkezileştirme ikonu yeniden çizme/değiştirme izni değildir.
- [ ] Dekoratif ikon aria-hidden, anlamlı ikon erişilebilir ad alır. Kullanıcı içeriği QR/SVG çıktısını ikon testiyle engelleme.
- [ ] Kabul: yeni emoji ikon yok; a11y adları/snapshot ve tam kapı yeşil.

## 7. Faz 3 — Arayüz TR/EN ve sunucu/istemci sınırı

### İş 3A — Dil altyapısı

**Dosyalar:** src/i18n/{server,format}.ts, src/i18n/client.tsx ve dictionaries; src/app/layout.tsx; yeni tests/unit/{i18n-parity,i18n-format}.test.ts ve tests/e2e/locale.spec.ts. Yeni LanguageToggle, noscript formu veya menü öğesi oluşturulmaz.

- [ ] getLocale(): Promise<Locale>, getRequestTranslator(), getDictionarySlice(locale, namespace), I18nProvider/useTranslator tanımla. Locale whitelist ile doğrulanır; varsayılan ve geçersiz değer tr. EN altyapısı test bağlamında locale/cookie girdisiyle denenir; yeni dil değiştirme akışı eklenmez.
- [ ] TR kaynak değerlerini literal string tipine kilitleme; yapıyı koruyan genişletilmiş public Dictionary tipi EN çeviriye izin verir. Admin sözlüğü ayrı TR tipidir; public TR/EN anahtar ve placeholder eşliği derlemede/testte zorlanır.
- [ ] <html lang> ve metadata çözümlenen dille eşleşir; admin kökü lang=tr olur. Locale okuması yalnız server.ts içindedir; oturum/CSRF cookie politikası değişmez. Tarayıcı diliyle otomatik EN açılmaz; mevcut TR görünümü değişmez.
- [ ] Görünür dil kontrolü bu kapsamdan çıkarılmıştır. JS açık/kapalı hâllerde v0.1'de olmayan kontrol eklenmediği test edilir. Metin çevirisi için font küçültme, boşluk/yerleşim/breakpoint değiştirme veya yeni kontrol ekleme yapılmaz; çözülemeyen EN taşma uyumsuzluk olarak raporlanır.
- [ ] Biçimlendirme yalnız format.ts, Intl, tr-TR/en-GB ve Europe/Istanbul üzerinden yapılır. formatDate, formatDateTime, formatNumber, formatRelativeTime ve selectPlural yardımcılarının locale açık parametresi vardır. Tarihsiz UluJam'a tarih icat etme; ISO saklama sözleşmesi değişmez.
- [ ] Client yalnız CLIENT_NAMESPACES kayıt listesinde gereken namespace dilimini alır. Tam sözlük veya server config client bundle'a girmez. İki locale eşzamanlı istek ve cookie değişimi cache/hydration testi yapılır; başlangıç/sonrası istemci JS ve üretim TTFB farkı raporlanır. EN çeviriler boş/TODO/lorem denetimi ve doğal dil incelemesinden geçer.
- [ ] Kabul: mevcut URL'ler değişmeden dil/metaveri/format doğru; standart kapı yeşil.

### İş 3B — Ekran dönüşümü ve doğrulama bekçileri

**Dosyalar:** src/app genel/özel/admin UI, src/components, modules UI ve community sunum dosyaları; yeni tests/unit/{no-hardcoded-text,i18n-unused}.test.ts, tests/unit/i18n-guard-fixtures/* ve docs/operations/i18n-content-policy.md.

- [ ] Önce ortak metinler; ardından genel sayfalar; sonra formlar/özel akışlar; en son admin olarak küçük dilimler halinde taşı. Her dilimde mevcut TR metin ve görünüm korunur.
- [ ] Panelden gelen form alanı/başlığı, kişi alıntısı, oyun adı/açıklaması, arşiv metni ve alt metinler CMS verisidir; sözlüğe taşınarak panel düzenlemesi devre dışı bırakılmaz. Çevirisi yoksa özgün metin korunur, uygun içerik lang=tr işaretlenir. “Tüm içerik İngilizce” iddiası yazılmaz.
- [ ] Backend hata mesajlarını doğrudan basan tüketicileri envanterle. Sabit statü/izin/doğrulama mesajlarını UI adaptöründe bilinen hata→anahtar eşlemesi ve güvenli yerelleştirilmiş fallback ile sun; alan yollarını koru. API yanıtı/DB enum değeri çevrilmez. Kararlı ek hata kodu zorunluysa kapsam istisnası + sözleşme testiyle eklenir.
- [ ] AST bekçisi JsxText/attribute yanında UI string değişkeni, object/array değeri, ternary, template expression ve toast/error/status akışını kapsar. Route label'ları, dekoratif boş alt, teknik ID/URL, marka/ad ve doğrulanmış CMS verisi için dar, gerekçeli istisnalar vardır.
- [ ] Bekçinin kendisi pozitif/negatif fixture ile test edilir; yalnız dizin hariç tutarak sıfır ihlal üretme. Dinamik sözlük anahtarlarını unused testinde referans manifestiyle açıkla.
- [ ] Tarih/etiket/Intl çağrılarını merkezileştir. EN uzun metin, Türkçe glif ve 320px reflow ile her yüzeyi test et.
- [ ] Kabul: public sözlük eşliği, hardcode bekçisi, metadata, TR baseline ve iki dil işlev testleri yeşil; CMS kaydet→genel sayfada görünür testi yeşil; tam kapı yeşil.

## 8. Faz 4 — Ortak sunum bütünlüğü

### İş 4A — Mevcut kompozisyon ve etkileşimleri koru

**Dosyalar:** src/app/page.tsx, src/components/layout/story-panels.tsx, src/modules/community/people-story.tsx, src/modules/events/ui/{past-events-carousel,ulujam-coming-soon}.tsx ve mevcut tasarım sistemi; ilgili mevcut E2E'ler.

- [ ] Issue Faz 4 arcade ana sayfa yerine mevcut intro/panel/karusel/People etkileşimlerinin aynı davranışını test et. Panel/kişiler/veri yönetiminin yeni merkezi katmanla çalıştığını kanıtla.
- [ ] Mevcut menü/diyalog odak, Escape, odak iadesi, skip bağlantısı ve reduced-motion davranışını doğrula. Semantik/ARIA düzeltmesi görünümü ve mevcut etkileşimi değiştirmiyorsa yapılabilir; yeni kontrol, farklı odak stili veya hareket tasarımı eklenmez. Görsel kilitle çözülemeyen erişilebilirlik bulgusu açık kaydedilir.
- [ ] Mouse/touch/klavye, kısa ekran ve scroll-scrub video hazır olmaması durumlarını test et. Dış embed ve boot betiği enforced CSP altında çalışmalı.
- [ ] Mini oyun mantığı değişmez; gerçek button, anlamlı ad, aria-pressed/aria-live, klavye alternatifi ve hareket azaltma doğrulanır.
- [ ] Kabul: görsel referans + eski işlev testleri + erişilebilirlik + tam kapı yeşil.

## 9. Faz 5 — Detay sayfaları, galeri ve hata yüzeyleri

### İş 5A — Mevcut galeri ve hata durumlarının korunması

**Dosyalar:** src/modules/events/ui/ulujam-archive.tsx ve mevcut hata yüzeyleri; tests/e2e/error-pages.spec.ts ve görsel referans testleri. Yeni lightbox/trigger veya farklı görünümlü hata sayfası oluşturulmaz.

- [ ] Galeri mozaik düzenini, görsel kırpmasını, başlık/alt metin konumunu ve mevcut etkileşimini v0.1 ile aynı tut.
- [ ] Issue'ın yeni lightbox gereği görsel/etkileşim kilidi nedeniyle bu kapsamda uygulanmaz; tamamlandı sayılmaz ve açık fark olarak raporlanır.
- [ ] Mevcut 404/hata yanıtlarının durum/noindex ve sır sızdırmama sözleşmesini doğrula. Mevcut görünümü değiştiren özel hata ekranı ekleme; böyle bir gereksinim açık uyuşmazlık olarak kaydedilir.
- [ ] Etkinlik/oyun detayları, UluJam tarihsiz/tarihli/başladı durumları ve bilinmeyen tarihî alanlar için boş/sınır durumlarını doğrula.
- [ ] Kabul: galeri/hata durumları v0.1 referansıyla aynı; mevcut klavye ve güvenlik sözleşmesi testli. Yeni lightbox/özel hata tasarımı nihai açık fark listesinde; varmış gibi test/kabul üretilmez.

## 10. Faz 6 — Ürün akışlarının regresyon kabulü

### İş 6A — Form, başvuru ve mevcut operasyon modülleri

**Dosyalar:** mevcut forms/teams/cards/check-in/games/outbox UI ve tests/integration + tests/e2e akışları; docs/operations/sunum-katmani-kabul.md.

- [ ] Form oluştur→önizle→yayınla→açık gönderim→makbuz→liste/detay/export/silme; değişmez sürümler, gerçek PublicForm ile önizleme, klavyeyle alan sıralama, koşullu/dosya alanları, kapasite/kapalı/sürüm değişimi, 409 ve özel dosya yetkisini mevcut testlerle doğrula. Eksik klavye alternatifi yeni görünür kontrol veya etkileşim tasarımı gerektiriyorsa açık bulgudur; otomatik eklenmez.
- [ ] Coffee Talk senaryosu sentetik izole fixture ile taslak→gerçek veri alanları dolu→yayın→ana sayfada afiş/tarih/form CTA zincirini doğrular. Gerçek çalışma verisine tarih/konum eklenmez. Eksik Turnstile/bildirim/hukuk bağımlılığı kapalı feature flag/adaptör kabulüyle ayrı kaydedilir.
- [ ] Aynı anahtar+aynı gövde replay; aynı anahtar+farklı gövde 409; dosyalı gönderimde içerik hash sözleşmesi ve eşzamanlı gönderimde tek kayıt/kapasite güvencesi test edilir. CSV formül kaçışı ve anonimleştirme/denetim kaydı korunur.
- [ ] Takım kurucu/üye, onay/reddetme, kart uygunluğu/iptali, yayın onayı ve oyun kredi görünürlüğü uçtan uca doğrulanır. Yetkisiz/CSRF reddi ve etkinlik bazlı izin matrisi korunur.
- [ ] Worker/outbox retry/idempotency, Google Wallet disabled/mock/gerçek sağlayıcı durumları ayrı kaydedilir. Gerçek sağlayıcı/Android cihaz kabulü yapılmadan “Google Wallet tamam” denmez; testler dış bildirim göndermeyen adaptörle çalışır.
- [ ] Check-in mevcut sunucu davranışı test edilir; iOS okuyucu ve Wallet'tan QR kaldırma otomatik olarak kapsamda sayılmaz. Apple Wallet mevcut erteleme/kapalı durumu korunur.
- [ ] İletişim mevcut yönetilen kanalları ve v0.1 düzenini aynen korur. Koşullu yeni form bölümü görsel kilit nedeniyle bu kapsamda uygulanmaz; 6B ayrı açık fark kaydıdır. Hukuk metni uydurulmaz.
- [ ] Her modül için durum: kaynak var / otomatik test geçti / gerçek dış kabul bekliyor / ayrı geliştirme. “Eksiksiz mevcut” toplu ifadesi kullanılmaz.
- [ ] Kabul: mevcut ürün zinciri iki genel dilde işlevsel, admin TR, hassas başlık/yetki/dosya davranışı korunmuş; tam kapı yeşil.

### İş 6B — Kapsam dışı kayıt: yeni iletişim formu

**Durum:** Uygulanmayacak; aktif uygulama sırasının dışındadır. Issue #1'deki koşullu iletişim formu mevcut v0.1 sayfasına yeni görünür bölüm ve akış ekler. Son kullanıcı talebi önceliklidir; form bölümü, yeni bağlantı veya seed oluşturulmaz. Mevcut iletişim görünümü ve işlevi korunur. Bu madde tamamlandı sayılmaz; nihai Issue farkları içinde kapsam dışı olarak açıklanır.

## 11. Faz 7 — Ölçülebilir kalite, mevcut CI ve yerel teslim

### İş 7A — Performans/erişilebilirlik kapıları

**Dosyalar:** yeni tests/perf/budgets.ts, scripts/perf-lighthouse.ts, package.json içindeki perf:lighthouse komutu; tests/accessibility; mevcut security/header/cache testleri.
**Tek eşik kaynağı:** public rota matrisi + temsilî dolu detaylar, gerçek izole fixture ile.

- [ ] Üretim build üzerinde mobil/masaüstü; public cinematic × TR/EN × 375/1280. Yönetim classic/TR ve özel akışlar a11y/işlev matrisinde ayrıca. 320px ve %200 reflow, reduced-motion ve forced-colors kapsanır.
- [ ] pnpm perf:lighthouse komutu izole 127.0.0.1 üretim sunucusunu kullanır; port/DB/build dizini çalışma ortamından ayrılır. JSON raporları .local/lighthouse/, özet tablo ilerleme kaydındadır. Eşik altı veya eksik ölçüm nonzero çıkış üretir; yeni araç gerekiyorsa tam sürüm ve gerekçe kaydedilir.
- [ ] Lighthouse dört kategori ≥90; LCP ≤2500ms, CLS ≤0.1 (hedef 0), TBT ≤200ms, ana sayfa ilk yük first-party JS toplam gzip <150×1024 byte. Donanım/throttle/Chromium sabit, 3 koşu medyanı; cold cache ölçülür. Eşikler ölçmeden gevşetilmez.
- [ ] JS bütçesi main bundle ile sınırlanmaz; ilk navigation'ın indirttiği runtime/framework/RSC istemci bağımlılıkları dahil, tekrar eden URL bir kez sayılır. Görsel/animasyon kaldırma, görsel kalite/kırpma veya font değiştirme ile bütçe tutturulmaz.
- [ ] Axe 0 serious/critical gerekli fakat WCAG tam kabulünün yerine geçmez: klavye/odak, screen-reader adı, kontrast ve dokunma hedefleri kontrol edilir. Görsel kilitle uyuşmayan bulgu raporlanır; eşik düşürme veya kendiliğinden tasarım değişimiyle başarı üretilmez. Görünümü koruyan çözüm bulunamazsa ilgili kabul açık kalır.
- [ ] Private noindex sayfaların Lighthouse SEO puanı public hedefe dahil edilmez; gerçek HTTP noindex/no-store/no-referrer ve CSP nonce testleri zorunludur. Mevcut enforced CSP zayıflatılmaz; HSTS bu kapsamda değiştirilmez.
- [ ] Kabul: her rota için JSON/özet ölçüm var. Araç çalışmadıysa “doğrulanmadı”; başarısız veya ölçülmemiş kalite kapısıyla nihai kabul verilemez.

### İş 7B — Mevcut CI'ı genişlet ve teslimi kaydet

**Dosyalar:** .github/workflows/ci.yml, scripts/ci-check.sh, tests/operations/ci-gate.test.ts, README.md, docs/operations/{sunum-katmani-kabul,deploy,rollback,backup-restore,vds-olcum}.md.

- [ ] Var olan Acceptance verify/package işlerini güncelle; sıfırdan yazıp image build, worker, audit, source/wallet security, db:check veya load güvencelerini düşürme.
- [ ] Tam sürümler/frozen lockfile, geçici PostgreSQL/S3, production E2E, merkezileştirme testleri, Lighthouse ve başarısızlıkta trace/screenshot/log artifact'leri zorunlu. Workflow yeni feat dalında manuel/PR ile seçilebilir olmalı; dal adı yanlışsa sessiz test yokluğu başarı sayılmaz.
- [ ] İzole CI yük testi korunur; VDS'ye yük/backup/live-audit komutu çalıştırılmaz. Backup provası yalnız yeni throwaway yerel DB/hedefe yapılır ve geri yükleme sayım/checksum kanıtı alınır.
- [ ] Üç bağımsız genişleme provası yalnız izole throwaway kopyada yapılır: route+page+sözlük, ek tema profili, ek public locale. Ana uygulamaya profil/palet/kontrol/varsayılan taşıma yoktur; prova sonunda ağaç ve v0.1 referansları değişmemiş olmalıdır.
- [ ] README yeni sayfa/token/dil ekleme adımları gerçek provadan üretilir. Faz bazlı küçük commit ve etiketli yerel kabul noktası önerilir; push/merge/dağıtım yapılmaz.
- [ ] deploy/rollback/worker/backup belgeleri mevcut yapı ile karşılaştırılır; DB+nesne deposu birlikte geri yükleme ve migration öncesi yedek politikası yer alır. Önceden onaylı VDS ölçüm eşikleri korunur; gerçek kapasite ölçülmemişse ayrı açık madde kalır.
- [ ] Nihai kabul: Faz 0–7 kutuları + komut/çıktı/artifact; Issue farkları K1–K8; sağlayıcı/cihaz/hukuk/görsel eksikleri. Yerel uygulama kabulü, dış hizmet kabulü ve canlıya alma izni ayrı kaydedilir.

## 12. Uygulama sırası ve kapanış ölçütü

0A → 0B → 0C → 1A → 1B → 2A → 2B → 2C → 3A → 3B → 4A → 5A → 6A → 7A → 7B. İş 6B aktif sıranın dışındadır. 15 aktif iş + 1 kapsam dışı kayıt vardır.

2C yalnız ikon bağımlılığı taşır; ortak bileşen dosyaları nedeniyle farklı fazlarla aynı anda yazılmaz. Test/okuma incelemeleri paralel yapılabilir. Her iş tek inceleme birimidir; büyük 3B ve 6A kendi içinde ekran/akış dilimlerine ayrılır, her dilim aynı kabul sözleşmesini taşır.

**Geri dönüş:** Her fazdan önce ilgili dosya diff'i ve son çalışan commit kaydedilir. Başarısız değişiklik yalnız kendi commit/dosya kümesiyle geri alınır; kullanıcı değişikliklerine reset/clean uygulanmaz. DB şeması bu işte değişmediği için şema rollback gerekmez; zorunlu ek migration ayrı tasarım ve geri yükleme planına bağlıdır.

**Plan hazırlığı bittiğinde uygulama bitmiş sayılmaz.** Faz 0 (0A, 0B ve 0C), Faz 1 (1A ve 1B), Faz 2 / İş 2A ve Faz 2 / İş 2B kabul edildi; sıradaki iş Faz 2 / İş 2C'dir.
