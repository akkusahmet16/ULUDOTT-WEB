# Birleşik uygulama planı — mimari ve Issue uyum analizi

**Tarih:** 21 Ekim 2026. **Hedef:** ULUDOTT v0.2. **Başlangıç:** b8578cf3546416dd88d8dc0c1cff81c59998caf7.
**Kapsam:** GitHub Issue #1, üst klasördeki 20 Ekim birleşik planı, v0.1/v0.2 ve ULUDOTT-WEB-batu-try kaynak karşılaştırması; yerel güvenli statik kontroller.
**Sonuç:** v0.2 teknik uygulama tabanı; görsel doğruluk kaynağı v0.1'in mevcut çalışma hâlidir. Eski planın yönü güçlü, yürütme ve kabul sözleşmesi yetersizdi. Revizyon 3 bu boşlukları işlere/kapılara dönüştürür; kodun tümünün doğrulandığı anlamına gelmez.

**İnceleme sonrası güncel uygulama durumu — 22 Ekim:** İş 0A ve 0B kabul edildi. Son paket 393 genel / 238 ayrı entegrasyon ve uygun ortamında 107 farklı E2E senaryosu geçti. İlk incelemenin aşağıdaki sonuçları tarihîdir; [0A kabulü](./2026-10-21-faz-0a-baslangic-kabulu.md) ve [0B cache kararı/matrisi](./2026-10-22-faz-0b-cache-kabulu.md) devamını taşır. Hassas oyun okumaları güncel SQL/service'i cache dışında kullanıyor. 0C görsel kabulü açık; Faz 1 başlamadı. v0.1 ve tema/görsel varlıklar değişmedi.

**Son kullanıcı talebi — kesin görsel kilit:** “v0.1 teması ve görsel dili vs. asla değişmemeli.” Revizyon 2'de önerilen görünür dil kontrolü, lightbox, yeni iletişim form bölümü ve görsel erişilebilirlik istisnaları kaldırıldı. Aşağıdaki güncel sonuçlar bu sınıra tabidir; tarihî test sonuçları değişmedi.

[Revize ana plan](../design/2026-10-20-birlesik-uygulama-plani.md) · [Kapsam kuralları](../design/sunum-katmani-kurallari.md) · [Güncel ilerleme](./sunum-katmani-ilerleme.md) · [Gerçek Issue #1](https://github.com/akkusahmet16/ULUDOTT-WEB/issues/1).

## 1. Neyi karşılaştırdık?

- GitHub bağlantısı üzerinden Issue #1'in güncel gövdesi ve yorumları okundu: açık; son güncelleme 10 Ekim 2026; yorum yok. Yerel github-issue-1-mimari-plan.md içindeki gövde aynı gereksinimi taşıyor.
- Üst klasör ve v0.2/docs/design içindeki eski birleşik planlar birebir aynıydı. Üst klasördeki göreli doküman bağlantıları bozuktu.
- v0.2 çalışma ağacı inceleme başında temizdi. v0.1 çok sayıda mevcut kaydedilmemiş değişiklik içeriyordu; bu işler değiştirilmedi.
- batu-try klasöründe .git ve node_modules yok. Kaynak anlık görüntüsü olarak incelendi; gerçek branch/commit geçmişi veya çalışır ortam kabul edilmedi.
- Kaynak ve migration karşılaştırması bayt/özet eşliğiyle yapıldı. DB'ye bağlanılmadı; canlı site/VDS, dış sağlayıcı, worker, seed veya migration çalıştırılmadı.

## 2. Mimari uyum: aynı aile, farklı olgunluk

Sayım src altındaki dosyalarda .DS_Store hariçtir. Test sayısı tests altındaki .ts/.tsx dosyalarıdır; test case sayısı değildir.

| Ölçüt | batu-try | v0.1 | v0.2 |
|---|---:|---:|---:|
| Kaynak dosyası | 141 | 379 | 381 |
| TS/TSX kaynak | 123 | 307 | 309 |
| page.tsx | 16 | 33 | 33 |
| route.ts | 13 | 41 | 41 |
| CSS dosyası | 1 | 11 | 11 |
| SQL migration | 8 | 26 | 26 |
| Test dosyası | 31 | 120 | 122 |
| Üst düzey modül | 9 | 15 | 15 |

Üç kaynak da Next 16.3.8, React 19.3.0, TypeScript strict, Drizzle/PostgreSQL ve application/domain/infrastructure/ui ayrımına dayanıyor. Bu yüzden teknoloji veya temel katman mimarisi çatışması yok.

Ancak batu-try ile v0.2'nin 133 ortak kaynak yolunun yalnız 67'si birebir aynı; 66'sı farklı. v0.2'de ayrıca 248 kaynak dosyası var. Ortak bir dosya adının bulunması, eski dosyanın güvenle kopyalanabileceği anlamına gelmez.

v0.1 ile v0.2 arasında 376 ortak dosyanın 349'u aynı, 27'si farklı. v0.1'e özgü üç gerçek kaynak demo ile ilgili; v0.2'ye özgü beş kaynak Faz 0 robots/sitemap/cache/public-queries parçalarıdır. Bu tablo v0.2'nin v0.1 ürününün devamı olduğunu destekler. Gelecekte v0.1'deki yeni değişiklikler için başlangıç diff'i tekrar alınmalıdır.

### Migration uyumu

- batu-try içindeki 0000–0007 dosyaları v0.1/v0.2 ile SHA256 olarak aynı.
- v0.1 ve v0.2 içindeki 26 SQL migration'ın tamamı aynı.
- v0.2, batu-try'a göre 0008–0025 arasında 18 ilave migration içeriyor.
- Bu, dosya tarihçesinin uyumudur; herhangi bir DB'ye doğru uygulanmış olduklarını kanıtlamaz.

Örnek olarak v0.2 [form şeması](../../src/db/schema/forms.ts) sürüm, yayın durumu, ayarlar ve dosya alanlarını içeriyor. batu-try'ın erken form deposunu, şemasını veya next.config.ts dosyasını üstüne almak daha yeni ürün ve gizlilik davranışlarını geri götürür.

### batu-try ne kadar ileri?

batu-try ileri merkezi tema/rota/i18n uygulamasının referansı değil. Orada src/config, src/i18n, src/seo, themes.css, merkezi ikon kaydı veya tema sağlayıcısı bulunmuyor. Header yerel sabit bağlantı dizisini kullanıyor; sitemap hâlâ Faz 2'de routes.config'e taşınacak notunu taşıyor; root lang ve UI metinleri sabit Türkçe.

Gerçek katkısı Faz 0: APP_URL canonical/SEO, robots/sitemap, DB+APP_URL ayrılmış 30sn veri cache'i, Date dönüşümü, COMMIT sonrası invalidation yaklaşımı, sayaç tazeliği ve denetim/yedek araçları. Bunların önemli bölümü v0.2'ye zaten alınmış.

| Alınabilecek referans | Nasıl kullanılmalı? |
|---|---|
| tests/cache-e2e/countdown.spec.ts | Sıcak cache, zaman sapması ve durum geçişi senaryosu güncel admin/API akışına uyarlanmalı; standart test listesine alınmalı. |
| Faz 0 rapor biçimi | Ortam/başlangıç/sonuç/çalıştırılmayan kontrol ayrımı örnek alınmalı. |
| Baseline üretim yöntemi | Sabit saat/font/viewport/manifest yöntemi alınmalı; eski PNG'ler taşınmamalı. |
| Mevcut cache/audit/backup kodu | v0.2'de zaten bulunan karşılığı yeniden kopyalanmamalı; bağımlılık kapsamı yeniden test edilmeli. |

Batu'nun baseline'ları eski sade görünüm ve Windows tarayıcısı içindir. Sinematik v0.2'nin görsel kabul kanıtı olamaz. Batu raporundaki 14 Ekim başarılı testleri de bugünkü v0.2 ortamının kabulü değildir.

## 3. GitHub Issue ile gerçek uyum

Issue sunum katmanını arcade olarak yeniden kurmayı tarif ediyor. Birleşik plan sinematik v0.1 görünümünü korumayı seçiyor. Bu makul bir ürün kararıdır; “tam uyum” diye adlandırılması doğru değildir.

| Konu | Issue #1 | Eski birleşik plan | Revizyon 2 kararı |
|---|---|---|---|
| Genel görsel dil | Arcade; yeni intro/kabin menüsü | Sinematik/ArtDeco korunur | Bilinçli fark; mevcut tasarım ana hedef |
| Tema matrisi | Genel arcade/classic | cinematic/classic aynı tanımda belirsiz | v0.1'in gerçek public/admin görünümü ve varsayılanları aynen; profil adı yeni palet izni değil |
| Arka uç 15–24 | Önemli kısımlar ertelenir | Tümü eksiksiz mevcut denir | Kod korunur; test/ayar/gerçek sağlayıcı kabulü ayrı |
| Genel URL'ler | /duyurular, /linkler, /destek de var | Olmayan yönlendirmeler varsayılır | Gerçekte uygulanmamış legacy URL; sitemap/nav dışında; eşdeğer hedef olmadan 301 yok |
| Form indeksleme | Yayınlı ve uygun form indekslenebilir | /basvuru bütünü özel | Mevcut noindex/no-store/no-referrer korunur; açık fark |
| i18n | Sabit UI TR/EN; backend/DB istisna | “Tüm metin” sınırı belirsiz | UI sözlüğü ile CMS verisi ve API sözleşmesi ayrılır |
| İletişim | Yayınlı iletisim formu varsa göster | Mevcut kanallar yeterli varsayılır | Yeni bölüm görsel kilit nedeniyle kapsam dışı; 6B uygulanmayacak fark kaydı |
| CSP | Report-Only ile başla | Entegrasyon işi eksik | Mevcut enforced nonce CSP korunur |
| Lightbox | Açılınca yüklenen ayrı chunk | Kaybolmuş | Yeni ekran/etkileşim görsel kilit nedeniyle kapsam dışı; mevcut mozaik aynen korunur |
| CI/performans | Gerçek ölçüm, eşik ve artifact | Genel başlıklar | Mevcut CI genişletilir; başarısız ölçüm kapıyı durdurur |
| Genişleme provası | Rota + üçüncü tema + üçüncü dil | Yalnız rota | Üçü de geri alınan provaya döner |

Issue'daki bütün görsel reçeteyi yeni plana eklemek kullanıcı hedefiyle çelişirdi. Doğru yaklaşım: görsel yeniden tasarımı dışarıda tutup erişilebilirlik, performans, veri dürüstlüğü ve ürün regresyonlarını korumak. Kararlar ana plandaki K1–K8 tablosunda görünür hâle getirildi.

## 4. Öncelikli bulgular

### P1 — Oyun görünürlüğü cache'i tüm bağımlılıklarını izlemiyor

[public-queries.ts](../../src/modules/publication/ui/public-queries.ts), satır 156–164: readPublicGames/readPublicGame yalnız games ve media etiketleriyle cache'leniyor. Ancak [game-repository.ts](../../src/modules/games/infrastructure/game-repository.ts), satır 41–64 içindeki SQL; etkinlik durumu, takım durumu, başvuru/üyelik/onay, yayın izni ve saklama süresine de bağlı.

[publication/http.ts](../../src/modules/publication/http.ts), satır 102 etkinlik değişiminde events etiketini sona erdiriyor. [approval-http.ts](../../src/modules/teams/application/approval-http.ts), satır 42–61 takım onay/reddetme sonrasında oyun cache'ini geçersiz kılmıyor.

Sonuç: kaynak uygunluğu artık reddetse bile önceden cache'lenmiş oyun ve kredi adları sonraki yenilemeye kadar gösterilebilir. Bu kaynak incelemesiyle saptanan bağımlılık açığıdır; bu oturumda üretim HTTP davranışı yeniden üretilmedi. Yalnız 30sn TTL, anlık yayından kaldırmayı sağlamaz; SWR ilk sonraki isteğe eski veriyi de sunabilir.

Tarihî sonuç okumasında events; varsayılan arşiv okumasında events/historicalResults bağımlılığı da eksik. Saat dolması veya worker değişikliği yalnız HTTP etiketleri eklenerek tamamen çözülemez.

**Düzeltme:** Faz 0B'ye ayrı engelleyici iş eklendi. Önce sıcak cache testleri; sonra bağımlılık/mutasyon matrisi. Hassas yayın uygunluğu gerekirse cache dışında yeniden denetlenmeli veya bu okuma cache'lenmemeli.

### P1 — Faz 0 tamam kabulü kanıtı aşıyor

Eski plan Faz 0 “tamamlandı” başlığında görsel baseline'ı boş bırakıyordu. v0.2'de beklenen baseline dizini ve sunum-katmani-ilerleme.md yoktu. Yeni DB'nin tablo sayımları, uygulanmış migration durumu, restore ve tam v0.2 E2E/build kabulü bu incelemede doğrulanmadı.

26 migration ve seed kaynaklarının varlığı kesin; “uludott_v02 sıfır kişisel/demo/test veri içeriyor” sonucu buradan çıkmaz. Public referans kişilerle DB'deki yapay kayıtlar da aynı kategori değildir.

**Düzeltme:** Faz 0 “kısmi / yeniden kabul gerekli” oldu. Ortam, cache doğruluğu ve görsel referans olmak üzere 0A–0C çıkış kapısı eklendi.

### P1 — Ürün kodunun varlığı tam kabul sayılmış

Form, dosya, takım, kart, worker, Google Wallet ve check-in geniş ölçüde mevcut. Bununla birlikte gerçek sağlayıcı/cihaz kabulü ayrı. [progress.md](./progress.md), “Proje sonunda gözden geçirilecek ek gereksinim” bölümü iOS okuyucu→kalıcı check-in→Wallet QR kaldırma zincirinin henüz uygulanmadığını açıkça söylüyor. Apple Wallet da ayrı erteleme durumunda.

**Düzeltme:** Faz 6 form yayın/gönderim/makbuz, kapasite/idempotency, CSV, silme/anonimleştirme, dosya yetkisi, takım/kart/yayın onayı ve worker regressions için ayrı kabul listesi taşıyor. “Tümü eksiksiz mevcut” kaldırıldı.

### P2 — Standart yerel komutlar sürüm kapısında duruyor

package.json pnpm 11.19.0 istiyor; bu oturumdaki pnpm 11.25.0. pnpm typecheck ve pnpm lint, kod incelemesine başlamadan ERR_PNPM_UNSUPPORTED_ENGINE ile durdu.

Shell Node 26.9.0 görünse de pnpm exec node --version yönetilen Node 24.21.0 döndürdü. Bu yüzden tek başına shell Node sürümünü hatanın nedeni ilan etmek yanlış olur.

**Düzeltme:** Faz 0A'da doğru package manager ile standart scriptlerin çalışması zorunlu. Engine denetimini kapatmak çözüm sayılmıyor. Eşdeğer alt komutların başarısı aşağıda ayrı kaydedildi.

### P2 — Görsel koruma testinin tanımı çelişkiliydi

“Bir piksel bile değişmez” sözüyle maxDiffPixelRatio=0.01 aynı hedef değil: ikincisi %1 piksel farkına izin verir. Ayrıca boş DB referansı, dolu form/etkinlik/takım/galeri akışını kapsamaz. Animasyon, video karesi ve font yüklenmesi sabitlenmezse test anlamlı olmaz.

**Düzeltme:** v0.1'in mevcut çalışma hâline sabitlenmiş referans; boş/dolu/onaylı içerik, sabit tarayıcı/OS/DPR/saat, genel/özel/admin ekran ve etkileşim durumları. Kararlı alanda sıfır fark kabul kapısı; raster belirsizliği tasarım değişikliğine izin değildir. Yeni dil kontrolü ve görsel a11y istisnası yoktur; görünümü koruyarak çözülemeyen bulgu açık kalır.

### P2 — Merkezi tema kuralı tasarım sabitleriyle çalışma anı verisini karıştırıyordu

[header.tsx](../../src/components/layout/header.tsx), satır 140 --menu-index gibi dinamik değer kullanıyor. Scroll/oyun konumları da çalışma anı verisi. Bunları themes.css içinde sabit bir token'a çevirmek işlevi bozar. Backend görsel işleme/QR/Wallet renkleri de site tema rengi değildir.

Font tanımları aynı --font-body adını üretirken tema token'ının aynı adı kendisine bağlaması CSS döngüsü yaratabilir.

**Düzeltme:** Tasarım token'ı, font-face değişkeni ve dinamik custom property ayrıldı. Guard için dar gerekçeli istisna ve yanlış pozitif/kaçak fixture testleri istendi; bütün modules/lib dizinlerini hariç tutma yasaklandı.

### P2 — i18n sözlüğü, yönetilebilir içeriğin yerine geçemez

İletişim başlığı/footer/social başlıkları DB ayarlarından; People alıntıları ve oyun/arşiv içerikleri kendi kaynaklarından geliyor. Bunları statik TR/EN sözlüğüne taşımak panel düzenlemesini etkisiz kılar. TR'yi as const olarak aynen Dictionary tipi yapmak da EN değerlerini aynı Türkçe literal'e zorlayabilir. Admin yalnız TR iken tüm sözlüğe EN eşliği istemek başka bir çelişkidir.

**Düzeltme:** Public sözlük yapısı/placeholder eşliği; ayrı admin TR sözlüğü; CMS içeriğinin özgün dilde korunması; tiplerin string olarak genişletilmesi; locale/lang/canonical/cache politikası ve bundle/TTFB kanıtı. Varsayılan TR ve mevcut görünüm korunur; yeni dil kontrolü/noscript formu eklenmez. EN altyapısı test girdisiyle doğrulanır; çeviri için geometri/font değiştirilmez.

Backend API hata gövdeleri Issue'da i18n taramasından muaftır. Kullanıcıya gösteren UI için bilinen durumların çeviri adaptörü ve güvenli fallback gerekir; API string/enum/DB kimlikleri dil değiştirildiğinde değişmemelidir.

### P2 — URL/metadata planı gerçek rota ağacıyla tam örtüşmüyor

/duyurular, /linkler ve /destek v0.2'de page veya redirect olarak yok. Config'e unlisted diye eklemek bunları çalışan yönlendirme yapmaz. Mevcut sitemap altı statik rota ve etkinlik detaylarını kapsıyor; mevcut /oyunlar/[slug] için sitemap genişlemesi gerekiyor.

Footer navigasyon listesi değil, yönetilen iletişim/sosyal verisi tüketiyor. Merkezileştirme adına yeni menü eklemek veya sosyal URL'leri routes.config'e taşımak görsel/ürün davranışını değiştirir.

**Düzeltme:** URL varlığı, menü görünürlüğü, sitemap ve privacy sınıfları ayrı alanlar; gerçek anchor kontrolü, detay canonical, uygun oyunların tamamını kapsayan pagination, başlıkta tekrarlı marka denetimi.

### P2 — Güvenlik ve performans birbirinden kopuk tarif edilmişti

[src/proxy.ts](../../src/proxy.ts) her istekte nonce üretiyor. [security/headers.ts](../../src/lib/security/headers.ts) enforced CSP ve public/private HTML no-store uyguluyor. Bu varken yeni BootScript'in nonce bağlantısı olmadan çalışması beklenemez. “Cache var” HTML'in statik veya CDN cache'lenebilir olduğu anlamına da gelmez; DB cache ayrı katmandır.

Issue'daki Report-Only başlangıcını körlemesine uygulamak mevcut CSP'yi gevşetir. Private no-referrer üzerine genel referrer kuralı yazmak da regresyon yaratabilir.

**Düzeltme:** Mevcut enforced politika korunur; nonce/başlık/hydration testleri zorunlu; HSTS taşınmaz; DB cache, HTML response ve client/router davranışı ayrı ölçülür.

### P2 — Kalite başlıkları otomatik kapıya yeterince dönüşmemişti

Eski planda bütçe dosyası vardı; komutun eşiğin altında nonzero dönmesi, her rota matrisi, JS ölçüm kapsamı, cold cache/tekrar sayısı ve CI artifact'leri somut değildi. .github/workflows/ci.yml ise zaten mevcut; sıfırdan yazılırsa worker/image/load/security kontrolleri kaybolabilir.

**Düzeltme:** perf:lighthouse işi; dört kategori ≥90, LCP ≤2500ms, CLS ≤0.1/hedef 0, TBT ≤200ms, ilk yük toplam first-party JS gzip <150KiB; üç ölçüm medyanı; mevcut CI'ın korunarak genişletilmesi. Private noindex rotaların SEO puanı public kabulüne karıştırılmıyor. Axe tek başına WCAG tam uygunluk iddiasına dönüşmüyor.

## 5. Plan ne kadar sağlam?

Bu değerlendirme mühendislik yargısıdır; ölçülmüş bir kalite puanı değildir.

| Boyut | Eski plan değerlendirmesi | Gerekçe |
|---|---|---|
| Ürün yönü | Güçlü | Tasarım ve gelişmiş mevcut ürünü koruyor, büyük yeniden yazımı önlüyor. |
| Temel mimari | Güçlü | Katman ayrımı ve merkezileştirme hedefleri mevcut yapıya uyuyor. |
| Issue izlenebilirliği | Orta | Bilinçli görsel farklarla kazara kaybolan kabul ölçütleri ayrılmamış. |
| İşlerin uygulanabilirliği | Orta-altı | Faz başlıkları var; somut bağımlılık, arayüz, test ve geri dönüş tanımı eksik. |
| Tamamlanma kanıtı | Zayıf | Faz 0 ve “eksiksiz mevcut” iddiaları güncel kanıtı aşıyor. |
| Regresyon güvenliği | Yetersiz | Cache bağımlılıkları ve görsel/ürün matrisleri başlangıçta kapatılmalı. |

**Pratik hüküm:** Önceki belgeyi olduğu gibi bir kod ajanına verip Faz 1'den başlatmak güvenilir değildi. Revize plan daha denetlenebilir; ürünün uygulamaya hazır kabul edilmesi yine 0A–0C'nin geçmesine bağlı. Belgeleri düzeltmek bu kontrolleri geçmiş saymaz.

### Yaklaşım seçenekleri

1. **v0.2 üzerinden kademeli merkezileştirme — önerilen:** Mevcut davranışlar korunur, her katman küçük diff ile taşınır. Maliyeti test/kanıt işidir; geri dönüş sınırları açıktır.
2. **batu-try'ı ana taban yapmak:** Eksik 18 migration ve çok sayıda ürün akışını tekrar birleştirmeyi gerektirir. Bu hedef için gereksiz geriye taşıma riski taşır.
3. **Sunum katmanını tamamen yeniden yazmak:** Daha serbest mimari kurar, ancak sinematik görsel ve etkileşim koruma maliyeti çok daha yüksektir. Bu talep için uygun değil.

Sabit gün/saat tahmini vermek için baseline süreleri ve 3B'deki gerçek metin envanteri eksik. En büyük iş yalnız CSS renklerini taşımak değil; i18n hata/CMS sınırı, mevcut akışların iki dilde regresyonu ve cache doğruluğudur.

## 6. Bu oturumdaki doğrulama

| Komut / işlem | Sonuç | Neyi kanıtlamaz? |
|---|---|---|
| GitHub Issue ve yorum okuma | Issue #1 gövdesi ve sıfır yorum doğrulandı | Issue'ın bütün gereklerinin üründe yapıldığını |
| Kaynak/migration karşılaştırması | Yukarıdaki dosya sayıları ve eşlikler | DB'ye uygulanmış şema / çalışan ürün |
| pnpm typecheck | Engine uyumsuzluğu nedeniyle başlamadı | TypeScript hatası olduğunu |
| pnpm lint | Engine uyumsuzluğu nedeniyle başlamadı | ESLint hatası olduğunu |
| pnpm exec next typegen && pnpm exec tsc --noEmit | Çıkış 0 | Standart script kapısının geçtiğini |
| pnpm exec eslint . --max-warnings=0 | Çıkış 0 | Entegrasyon/E2E/build kabulünü |
| pnpm exec vitest run tests/unit tests/security/cache.test.ts tests/operations/ci-gate.test.ts tests/operations/secret-scan.test.ts tests/operations/load-target.test.ts | İlk koşu 25 dosya / 131 test, 7.72sn; belge düzenlemeleri sonrası tekrar 25/131, 7.57sn, çıkış 0 | DB/S3/üretim cache/gerçek tarayıcı ve sağlayıcı kabulünü |
| Tam entegrasyon, E2E, build, DB sayımı/restore, Lighthouse | Çalıştırılmadı / doğrulanmadı | Tam yerel hazır olmayı |

typegen'in next-env.d.ts üzerinde ürettiği geçici değişiklik eski içeriğine geri kondu. Kaynak kodu, altyapı, DB, çalışan servis, GitHub issue ve canlı sistem değiştirilmedi. Hedefli testler kendi geçici HTTP fixture'larını kullandı.

Worker açılışı retention/outbox/Wallet uzlaştırması yapabilir; yalnız analiz veya ekran referansı almak için varsayılan olarak başlatılmamalı. Google dış sağlayıcı modu ayrı, Apple kapalı/ertelenmiş; dış iletişim yapan testler devre dışı adaptörle çalışmalı.

## 7. Yapılan belge düzeltmeleri ve sıradaki somut iş

1. Ana plan “tam uyumlu” iddiasından açık karar kayıtlı uyarlamaya çevrildi. Revizyon 3'te 15 aktif iş ve 1 kapsam dışı kayıt (6B) var; görünür ekler uygulama sırasından çıkarıldı.
2. Sunum kuralları yeni kapsam/istisna sözleşmesiyle eşitlendi; tarihî Issue kaydı korunuyor.
3. Güncel ilerleme dosyası oluşturuldu; uygulama yapılmış gibi kutu işaretlenmedi.
4. Üst klasördeki plan tek doğruluk kaynağına yönlendiren giriş belgesi oldu. Böylece iki tam planın zamanla farklılaşması ve bozuk bağlantılar önlendi. Eski üst dosyanın kopyası .local/audit-2026-10-21/birlesik-plan-rev1.md içinde korundu.

**İlk uygulama:** 0A: doğru pnpm ile izole yerel başlangıç kabulü. Sonra 0B cache doğruluğu ve 0C sinematik baseline. Tema taşıması ancak bu üç işin kanıtı tamamlandığında başlamalı.
