# Sunum katmanı ilerleme raporu

## Faz 0 başlangıç

Tarih: 10 Ekim 2026 (Europe/Istanbul). Dal: `sunum/faz-0`.
Başlangıç commit'i: `b731d00`. İlk incelemede çalışma ağacı temizdi.

**Güncel durum (14 Ekim 2026): Faz 0 / 0.1–0.6 tamamlandı.** Son zincir:
typecheck/lint/build exit 0, 162/162 test, 95/95 integration, 37/37 e2e.
Üretim e2e ayrıca 37/37 ve izole sayaç testi 1/1. 16 görsel başlangıç/bitişte
birebir eşit. VDS ölçüm eşikleri kullanıcı tarafından onaylandı. Bitiş raporu,
rota karşılaştırması ve açık operasyon onayları dosyanın sonunda.
Önceki başarısız koşular aşağıda tarihsel kayıt olarak korunuyor.

**İlk deneme (tarihsel): 0.1 ortam kurulumu engellendi.** Referans
doğrulamalarına ve 0.2–0.6 adımlarına geçilmedi. Uygulama, arka uç, şema,
migration, kimlik doğrulama, UI ve test kaynakları değiştirilmedi. Push/merge,
canlı siteye erişim ve yedek hedefi erişimi yapılmadı.

### Ön okuma ve ortam

- `AGENTS.md`, `README.md`, `docs/operations/progress.md`, uygulama planının
  “Global kısıtlar” ve çalışma disiplini bölümleri, mimari öneri okundu.
- Başlangıçta `node_modules` bulunmadığı için Next.js rehberlerini okumak
  bağımlılık kurulumu sonrasına kaldı; rehberler okunmadan uygulama kodu yazılmadı.
  Kurulan Next.js **16.3.8** paketinde metadata/OG, `generate-metadata` başlık ve
  URL alanları, robots, sitemap, caching, revalidating, Cache Components
  kullanılmayan önbellek modeli, Route Handlers, `unstable_cache` ve
  `revalidateTag` belgeleri okundu. `generate-agent-files.js` içindeki yönetilen
  AGENTS bloğunun üretimi doğrulandı; blok korundu.
- Kök layout/ana sayfa/admin layout, `next.config.ts`, sunucu yapılandırması ve
  modüllerin `application/*-service.ts` dosyaları okundu. Kök `noindex`, mevcut
  admin meta/başlık koruması ve ana sayfadaki `force-dynamic` başlangıç hâlinde
  duruyor.
- `.env.local` örnekten, rastgele yerel DB/depo/AUTH sırlarıyla oluşturuldu.
  DB URL parolası Compose parolasıyla eşleşiyor. `.local/garage-rpc.secret`
  mevcut dosyanın üzerine yazılmadan oluşturuldu. Sır değerleri çıktılanmadı.
  `git check-ignore .env.local .local/garage-rpc.secret` iki dosyanın da Git
  dışında olduğunu doğruladı. Ana DB'ye migration veya seed uygulanmadı.

### Çalıştırılan komutlar ve çıktı özeti

| Komut / kontrol | Sonuç ve kanıt |
| --- | --- |
| `git status --short --branch` | Başlangıç dalı `batu's-version`; temiz çalışma ağacı. |
| `git switch -c sunum/faz-0` | Sandbox `.git` yazmasını reddetti; izinli tekrar exit 0, dal oluşturuldu. |
| `pnpm install --frozen-lockfile` | İlk sandbox denemesi npm registry `fetch failed` hatasıyla exit 1. İzinli tekrar **exit 0**, pnpm **11.19.0**, Node runtime **24.21.0**, 282 paket; lockfile çözümleme değişmedi. Yavaş indirme/yeniden deneme uyarıları vardı; kurulum 1 dk 54,4 sn içinde tamamlandı. |
| `git check-ignore .env.local .local/garage-rpc.secret` | Exit 0; iki yol da ignore kapsamında. |
| `docker-compose --env-file .env.local up -d` | **Exit 1**: `dockerDesktopLinuxEngine` named pipe bulunamadı; Docker motoru çalışmıyor. |
| `docker desktop start` | Başlatma denendi; motor hazır olmadı. Bekleyen bu komut sonradan iptal edildi. |
| `wsl --status` / `docker desktop status` | Sandbox WSL sorgusu `Wsl/E_ACCESSDENIED`; izinli durum denetimi WSL2 ve `docker-desktop` dağıtımını gösterdi. Docker Desktop durumu alınamadı. |
| Docker Desktop uygulamasını arka planda başlatma | Başlatıcı exit 0; motor başlangıç sırasında hata verip kapandı. Başlatıcının başarılı çıkışı servis sağlığı sayılmadı. |
| Compose yeniden denemeleri | Sandbox named pipe erişimi reddedildi; izinli tekrar da **exit 1**, named pipe bulunamadı. PostgreSQL/Garage sağlığı doğrulanamadı. |
| Docker günlüğü ve soket dosyası incelemesi | Başlangıç hata kaydı ve sıfır baytlık reparse point doğrulandı; ayrıntı aşağıda. |
| İzinli, tek dosyalık `Remove-Item -LiteralPath .../dockerInference -Force` | **Başarısız**: “Sistem dosyaya erişemiyor.” Dosya kaldırılamadı; recursive silme yapılmadı. |

### Engel, kök neden ve etkilenen dosyalar

Docker Desktop'ın 10 Ekim 2026 16:30:57 UTC (19:30:57 İstanbul) tarihli
`com.docker.backend.exe.log` kaydı başlangıcın şu noktada kesildiğini gösteriyor:

```text
starting services: initializing Inference manager:
listening on unix://<HOME>\AppData\Local\Docker\run\dockerInference:
remove ...\dockerInference: Sistem dosyaya erişemiyor.
(listener: Dosya adı, dizin adı veya birim etiketi sözdizimi hatalı.)
```

Doğrulanmış doğrudan neden: Docker'ın Inference manager çalışma soketini
kaldıramaması nedeniyle Linux motorunun başlayamaması. Soketin neden bu hâle
geldiği doğrulanmadı. WSL2'nin varlığı Docker motorunun sağlıklı olduğunu
kanıtlamıyor. İzinli dosya kaldırma da başarısız olduğundan sorun yalnızca
Codex sandbox erişim reddi olarak açıklanamaz.

- Depo dışındaki sorunlu yol:
  `C:\Users\Batuhan\AppData\Local\Docker\run\dockerInference`
  (0 bayt, `Archive, ReparsePoint`).
- Kanıt günlüğü:
  `C:\Users\Batuhan\AppData\Local\Docker\log\host\com.docker.backend.exe.log`.
- Etkilenen depo yapılandırması: `compose.yaml` içindeki yerel PostgreSQL ve
  Garage servislerinin başlatılması; `infrastructure/garage.toml` motor
  başlayamadığından çalışma zamanında doğrulanmadı. Bu dosyalarda uygulama
  hatası bulunduğu iddia edilmiyor; değiştirilmediler.
- Sonuç olarak DB/S3 kullanan entegrasyonlar, Playwright sunucusu ve DB okuyan
  sayfaların referans kabulü için gerekli yerel servisler hazır değil.
  Arka uç düzeltmesi veya test değişikliği yapılmadı.

### Referans doğrulama durumu

Kurulum önkoşulu sağlanamadığı için istenen sıradaki aşağıdaki komutlar henüz
çalıştırılmadı. Bunlar geçmiş rapordaki yeşil sonuçlardan devralınmadı ve bu
çalışmada **doğrulanmadı**.

| Komut | Durum |
| --- | --- |
| `pnpm config:check` | Çalıştırılmadı; Compose kurulumu engelli. |
| `pnpm db:migrate` | Çalıştırılmadı; yerel PostgreSQL hazır değil. |
| `pnpm typecheck` | Doğrulanmadı. |
| `pnpm lint` | Doğrulanmadı. |
| `pnpm test` | Doğrulanmadı. |
| `pnpm test:integration` | Doğrulanmadı. |
| `pnpm test:e2e` | Doğrulanmadı. |
| `pnpm build` | Doğrulanmadı. |

### Başlangıç/bitiş rota tablosu karşılaştırması

**Başlangıç rota tablosu henüz elde edilmedi:** `pnpm build` çalıştırılamadı.
Kaynak dosyalardan tahmin edilen statik/dinamik durumlar build kanıtı olarak
yazılmadı. Faz 0 bitiş tablosu da yok; karşılaştırma **doğrulanmadı**.

### Görsel regresyon referansı

`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/duyurular`, `/oyunlar`,
`/linkler`, `/destek` için 1280×800 ve 375×812 Playwright görüntüleri
**üretilmedi**. `tests/e2e/__baseline-classic__/` altında teslim edilmiş bir
baseline yok. Boş, migration uygulanmış izole DB ve dondurulmuş animasyon/saat
ile deterministik çekim, ortam düzeldikten sonra ve UI değişmeden yapılacak.

### Değişen dosyalar

- `docs/operations/sunum-katmani-ilerleme.md`: yalnızca bu başlangıç/engel
  raporu. Yerel, ignore kapsamındaki iki sır dosyası commit'e dahil edilmez.
- Uygulama, şema/migration, kimlik doğrulama, UI, test, bağımlılık listesi ve
  lockfile içeriğinde değişiklik yapılmadı. Kurulum sonrası `package.json` için
  Git'in gösterdiği stat/satır sonu işareti içerik farkı üretmedi
  (`git diff --numstat` boş).

### Kabul ölçütleri

| Ölçüt | Sonuç | Kanıt |
| --- | --- | --- |
| Referans hat sonuçları ve ekran görüntüsü baseline'ı kayıtlı | ✗ | Ortam kurulumu engelli; altı doğrulama, rota tablosu ve 16 görüntü henüz yok. |
| Genel sayfalarda noindex yok; admin/API admin noindex | ✗ | Başlangıç kök noindex korunuyor; değişiklik/e2e yapılmadı. |
| Robots/sitemap doğru; taslak içerik sitemap dışında | ✗ | 0.3 başlatılmadı; doğrulanmadı. |
| Ana sayfa force-dynamic değil; yayınla/yayından kaldır görünürlüğü | ✗ | 0.4 başlatılmadı; doğrulanmadı. |
| Typecheck/lint/test/integration/e2e/build yeşil | ✗ | Bu çalışmada doğrulanmadı. |
| Kalıcı sunum katmanı kural belgesi oluşturuldu | ✗ | 0.2 başlatılmadı. |

### Açık sorular ve onay bekleyenler

- Yerel Docker Desktop'ın çalışma soketi/başlangıç hatası giderilmeli ve Linux
  motorunun erişilebilirliği kanıtlanmalı. Daha ileri makine onarımı bu raporda
  önerilen veya gerçekleştirilmiş bir değişiklik değildir.
- Kurulum kırmızı olduğu için kullanıcının durma kuralı uygulanıyor; devam
  onayı olmadan 0.2–0.6'ya geçilmeyecek. Ortam düzeldiğinde 0.1'e Compose
  adımından devam edilerek bütün referans kontrolleri sırayla çalıştırılacak.
- Yedek sağlayıcısı ve VDS kabul eşikleri henüz kararlaştırılmadı; 0.6
  başlatılmadığından onaylanmış kapasite/sağlayıcı iddiası yok.

## 0.1 yeniden başlatma — 10 Ekim 2026

Kullanıcı Docker soket sorununu manuel çözdüğünü, motorun sağlıklı olduğunu
bildirdi ve Compose adımından devam edilmesini onayladı. Başlangıç:
`sunum/faz-0`, `07ce585`, temiz çalışma ağacı. Önceki Docker motoru engeli
bu denemede tekrar oluşmadı; aşağıdaki yeni engeller ayrı kaydedildi.

### Komutlar ve çıktı özeti

| Sıra | Komut / kontrol | Sonuç |
| --- | --- | --- |
| 1 | `docker-compose --env-file .env.local up -d` | Sandbox named pipe erişimini reddetti; izinli tekrar **exit 0**. PostgreSQL/Garage imajları hazırlandı, yerel ağ/volume/konteynerler oluşturulup başlatıldı. |
| 2 | `docker-compose --env-file .env.local ps` ve `ps -a` | PostgreSQL **healthy**. Garage **Exited (1)**; Compose başlatma çıkışı tek başına servis sağlığı kabul edilmedi. |
| 3 | `docker-compose --env-file .env.local exec -T object-store /garage status` | Exit 1; object-store servisi çalışmıyor. |
| 4 | `docker-compose --env-file .env.local logs --no-color --tail 70 object-store` | Garage RPC sır dosyasının `0100777` izinleri nedeniyle başlamayı reddetti; beklenen `0600`. |
| 5 | `pnpm config:check` | **Exit 0**, sunucu yapılandırması geçerli. Sandbox içinde çıktı vermeden bekleyen ilk deneme iptal edilip izinli tekrar çalıştırıldı. Bu kontrol servis bağlantılarını doğrulamıyor. |
| 6 | `pnpm db:migrate` | **Exit 0**, migration tamamlandı; seed çalıştırılmadı. Şema/migration kaynakları değiştirilmedi. |
| 7 | `pnpm typecheck` | **Exit 0**, `tsc --noEmit` geçti. |
| 8 | `pnpm lint` | **Exit 0**, `eslint . --max-warnings=0` geçti. |
| 9 | `pnpm test` | **Exit 1**. Vitest 5.0.3: **13 dosya, 11 geçti / 2 başarısız; 141 test, 135 geçti / 6 başarısız**. Süre **6,97 sn**. |
| 10 | `pnpm test:integration` | **Çalıştırılmadı / doğrulanmadı**; ilk kırmızı referans kontrolünden sonra durma kuralı uygulandı. `pnpm test` entegrasyon dosyalarını da çalıştırdı, ancak ayrı komutun geçtiği iddia edilmiyor. |
| 11 | `pnpm test:e2e` | **Çalıştırılmadı / doğrulanmadı**; aynı durma kuralı. |
| 12 | `pnpm build` | **Çalıştırılmadı / doğrulanmadı**; aynı durma kuralı. |

Kontroller tabloda gösterilen sırayla çalıştırıldı. pnpm komutları normal
kullanıcı önbelleği/runtime erişimiyle izinli çalıştırıldı. Ham pnpm çıktıları
Git dışında `.local/faz0-reference-{config,migrate,typecheck,lint,test}.log`
dosyalarında saklandı.

### Kırmızı testler, kök nedenler ve etkilenen dosyalar

| Başarısız test | Gözlenen hata ve neden |
| --- | --- |
| `tests/integration/infrastructure.test.ts`: özel S3 yükle/oku/anonim erişim | `ECONNREFUSED ::1:9000` ve `127.0.0.1:9000`; Garage çalışmıyor. |
| `tests/integration/media.test.ts`: özel orijinal/yayın/silme akışı | Aynı S3 bağlantı reddi. |
| `tests/integration/media.test.ts`: orijinal/yayınlanmamış türev anonim erişim | Aynı S3 bağlantı reddi. |
| `tests/integration/media.test.ts`: `IMG_0427.heic` yön/metadata | Satır 91'de `ENOENT`; `Media/IMG_0427.heic` bulunmuyor. `Test-Path` da `False` verdi. |
| `tests/integration/media.test.ts`: `IMG_1206.heic` yön/metadata | Satır 91'de `ENOENT`; `Media/IMG_1206.heic` bulunmuyor. `Test-Path` da `False` verdi. |
| `tests/integration/media.test.ts`: eşzamanlı upload | Satır 191'de başarılı upload sayısı beklenen **1**, gerçekleşen **0**. S3 kullanan upload akışında, aynı kapalı Garage koşulunda oluştu; dolaylı S3 etkisi değerlendirmesi çıkarımdır. Garage düzeldikten sonra yeniden doğrulanmalı. |

**Garage'ın doğrudan başlangıç nedeni**, konteyner günlüğünde açıkça:

```text
Error: File /run/secrets/garage-rpc is world-readable!
(mode: 0100777, expected 0600)
```

`compose.yaml`, Windows'taki `.local/garage-rpc.secret` dosyasını salt okunur
bind mount ile `/run/secrets/garage-rpc` yoluna sunuyor;
`infrastructure/garage.toml` bu yolu `rpc_secret_file` olarak okuyor.
Konteynerin gördüğü `0777` izinleri Garage'ın `0600` koşulunu sağlamıyor.
Bu, önceki Docker Desktop soket hatasından farklı bir yerel kurulum engeli.
Garage'ın izin denetimi devre dışı bırakılmadı; Compose/config/arka uç
kaynakları değiştirilmedi.

HEIC testleri Git dışında bırakılan gerçek yerel `Media/` girdilerine doğrudan
bağlı. İki dosya bu checkout'ta yok; yerine görsel üretilmedi, testler
atlanmadı veya zayıflatılmadı. Etkilenen test satırları ve servis başlangıcı
incelendi; mevcut kanıtla arka uç uygulama hatası iddiası yapılmıyor.

### Test sonrası yerel veri kontrolü

Yerel konteynerde `psql -v ON_ERROR_STOP=1` ile salt okunur sorgular geçti:

- **42** public tablo.
- `uludott_test_%` adlı kalan geçici test DB sayısı **0**.
- Ana DB'de `admins`, `events`, `announcements`, `games` tablolarının her biri
  **0** kayıt. Bu dört tablonun sayımı tüm ürün tablolarının sayımı olarak
  sunulmuyor.

### Rota tablosu, görsel baseline ve kabul

| Ölçüt | Sonuç | Kanıt |
| --- | --- | --- |
| Docker motoruna erişim ve PostgreSQL hazır | ✓ | İzinli Compose çalıştı; PostgreSQL healthy, migration başarılı. |
| Garage/S3 hazır | ✗ | Garage Exited (1), RPC secret `0777`/`0600` hatası; S3 bağlantıları reddediliyor. |
| Yapılandırma, migration, typecheck, lint | ✓ | İlgili dört komut exit 0. |
| `pnpm test` yeşil | ✗ | 135 geçti / 6 başarısız. |
| Ayrı integration, e2e ve build kontrolleri | ✗ | Durma kuralı nedeniyle çalıştırılmadı; doğrulanmadı. |
| Faz 0 başlangıç rota tablosu | ✗ | Build çalıştırılmadı; statik/dinamik tablo yok. Bitiş tablosu ve karşılaştırma da doğrulanmadı. |
| 16 klasik masaüstü/mobil ekran görüntüsü | ✗ | İlk kırmızı kontrolde duruldu; baseline üretilmedi. |
| Faz 0'ın diğer kabul ölçütleri | ✗ | 0.2–0.6 başlatılmadı; önceki kabul tablosundaki indeksleme/önbellek/kural belgesi maddeleri açık. |

### Değişen dosyalar ve devam koşulu

- Tek takip edilen değişiklik: `docs/operations/sunum-katmani-ilerleme.md`
  (bu kayıt ve güncel durum özeti). Uygulama, test, şema/migration,
  kimlik doğrulama, UI, bağımlılık ve lockfile kaynakları değiştirilmedi.
- Referans hattı yeşile dönmeden 0.2–0.6'ya geçilmeyecek. Garage'a RPC sır
  dosyasının `0600` olarak sunulması ve testlerin beklediği iki gerçek HEIC
  dosyasının yerel `Media/` altında sağlanması gerekiyor. Yerel kurulum
  uyarlaması ve kırmızı kontrol sonrası devam kullanıcı onayı bekliyor.
- Sonraki denemede ilgili kırmızı kontrol yeniden doğrulanacak; kalan
  referans komutları sırayla çalıştırılacak. Push/merge, canlı sistem ve yedek
  hedefine erişim yapılmadı.

## Faz 0 başlangıç — kabul (14 Ekim 2026)

Kullanıcı mevcut sırları koruyarak 0.1'in tekrarını ve yeşil olduğunda 0.2–0.6'nın
kesintisiz yürütülmesini onayladı. Başlangıç dalı `sunum/faz-0`, commit `c9cb08b`.

### Yerel kurulum ve girdi kararları

- Docker motoru çalışıyor. Windows bind mount `0777` sorunu, yalnızca ignore
  kapsamındaki `.local/compose.windows.yaml` ile çözüldü: mevcut RPC sırrı
  Linux volume'a kopyalanıp `0600` yapılıyor; Garage `GARAGE_RPC_SECRET_FILE`
  ile bu kopyayı okuyor. İzin kontrolü kapatılmadı, yeni imaj/bağımlılık yok.
  Komut: `docker-compose --env-file .env.local -f compose.yaml -f .local/compose.windows.yaml up -d`.
  Init exit 0; PostgreSQL healthy; `/garage status` sağlıklı düğüm gösterdi.
- `.env.local` ve `.local/garage-rpc.secret` SHA256 değerleri önce/sonra eşit;
  içerikleri ve mevcut anahtarlar korundu. Bu değerler rapora/çıktıya yazılmadı.
- Kullanıcı özgün HEIC'lerin mevcut olmadığını bildirdi ve açık örneklerin
  indirilmesini onayladı. Mevcut iki farklı boyut beklentisini korumak için
  iki uygun örnek kullanıldı; test kaynakları/beklentileri değiştirilmedi.
  `Media/` Git dışında; örnekler gerçek topluluk fotoğrafı olarak sunulmadı,
  public'e veya ürün DB'sine aktarılmadı. Özgün iPhone dosyalarının cihaz/yön
  davranışı bu örneklerle yeniden kanıtlanmış sayılmaz.

| Yerel ad | Kaynak | SHA256 | İşlenmiş boyut |
| --- | --- | --- | --- |
| `Media/IMG_0427.heic` | [heic.fyi EXIF test chart](https://heic.fyi/samples/exif-gps-date.heic), [CC0 lisansı](https://heic.fyi/samples/LICENSE.txt) | `01fd9fa28d09885d8482d01a5b36d88dc89fde3b7cfeaca50b70f8314d2c63d1` | 1600×1200 |
| `Media/IMG_1206.heic` | [Pine & Birch 1920×1080 örneği](https://pnb-website-bucket.s3.us-east-2.amazonaws.com/samples/images/heic/sample-image-1920x1080.heic), [yeniden kullanım açıklaması](https://www.pine-and-birch.com/sample-files/images/heic) | `5a9cbaa3ca36b535dc9c2b100b7f595e819d8841ace6ea616778fd5254227bf4` | 1600×900 |

İki örnekte de mevcut `validateMedia` HEIC imzasını kabul etti; `processImage`
WebP/AVIF/JPEG üretti. Projeye bağımlılık eklenmedi.

### Sıralı referans doğrulama kanıtı

| Komut | Sonuç |
| --- | --- |
| `pnpm config:check` | Exit 0, yapılandırma geçerli. |
| `pnpm db:migrate` | Exit 0, migration tamamlandı; seed yok. |
| `pnpm typecheck` | Exit 0, strict TypeScript geçti. |
| `pnpm lint` | Exit 0, sıfır uyarı. |
| `pnpm test` | Exit 0, **13 dosya / 141 test**, 10,43 sn. |
| `pnpm test:integration` | Exit 0, **10 dosya / 93 test**, 9,29 sn. |
| `pnpm test:e2e` | Exit 0, **27/27**, 47,8 sn; mevcut davranış ve axe testleri. |
| `pnpm build` | Exit 0, Next 16.3.8 Turbopack; derleme 10,0 sn, TypeScript 4,6 sn. |

Ham çıktılar `.local/faz0-2026-10-14-*.log` altında. Chromium 1243 indirmesi
Node indiricisinde beş kez zaman aşımına uğradı; aynı resmî arşivler curl ile
alınıp geçici localhost sunucusundan Playwright'ın kendi kurucusuna sunuldu.
Chrome arşivinin MD5'i resmî HTTP başlığıyla eşleşti. Kurulan sürüm
153.0.8010.12; farklı browser revizyonu veya test muafiyeti kullanılmadı.

İlk e2e başlangıcı Windows `spawn("pnpm")` → `ENOENT` nedeniyle durdu. Mevcut
pnpm 11.19.0 `.CMD` dosyasını çağıran, sistem C# derleyicisiyle üretilmiş
`.local/pnpm-bin/pnpm.exe` adaptörü PATH'e yalnızca test koşusunda eklendi.
Başlatıcı/test/uygulama kaynakları korunarak aynı `pnpm test:e2e` geçti.
Windows kapanışında kalan tek test DB'si, UUID adı + yalnızca bilinen e2e
admini + boş katılım tabloları + izinli medya anahtarları doğrulanarak kendi
fixture medyasıyla temizlendi. Son kalan geçici test DB sayısı **0**.

### Başlangıç rota tablosu

```text
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/duyurular
├ ƒ /admin/etkinlikler
├ ƒ /admin/galeri
├ ƒ /admin/linkler
├ ƒ /admin/medya
├ ƒ /api/admin/announcements
├ ƒ /api/admin/csrf
├ ƒ /api/admin/events
├ ƒ /api/admin/gallery
├ ƒ /api/admin/links
├ ƒ /api/admin/login
├ ƒ /api/admin/logout
├ ƒ /api/admin/media
├ ƒ /api/admin/session
├ ƒ /api/admin/session/renew
├ ƒ /api/links/[id]/qr
├ ○ /destek
├ ƒ /duyurular
├ ƒ /duyurular/[slug]
├ ƒ /etkinlikler
├ ƒ /etkinlikler/[slug]
├ ○ /hakkimizda
├ ƒ /l/[id]
├ ƒ /linkler
├ ƒ /media/[variantId]
├ ƒ /oyunlar
└ ƒ /ulujam
○ Statik; ƒ istek anında sunucuda render.
```

### Klasik görsel referans ve boyutlar

- `tests/e2e/__baseline-classic__/`: **16 PNG + manifest + çekim README'si**.
  Sekiz istenen rota; 1280×800 ve 375×812; ayrı, migration uygulanmış ve
  42 tablosunun her biri boş DB; seed yok.
- Sabit saat `2026-10-10T09:00:01.000Z`; İstanbul/tr-TR; reduced motion;
  animasyon/transition/caret kapalı. Yalnızca Next geliştirme rozeti çekimde
  gizlendi. İlk taslak çekimde görülen rozet QA'da kaldırıldıktan sonra iki
  yeni bağımsız koşu karşılaştırıldı: **16/16 SHA256 birebir eşit**.
- Ana sayfa masaüstü/mobil ve UluJam mobil görüntüleri görsel incelendi.
  Gerçek UI kaynakları değiştirilmedi. Dev'in ürettiği `next-env.d.ts`
  import yolları başlangıçtaki üretim yollarına geri getirildi.
- Başlangıç üretim CSS: **5651 bayt**, gzip (zlib level 9) **1940 bayt**;
  SHA256 `5f2bd63bda302fb49a83f6fe9e9248de08f8ccb494495d46a077e8ab286b1ae1`.

### 0.1 kabul ve değişen dosyalar

| Ölçüt | Sonuç | Kanıt |
| --- | --- | --- |
| Referans komutların tamamı yeşil | ✓ | Sekiz komut exit 0; 141/93/27 test. |
| Başlangıç statik/dinamik rota tablosu | ✓ | Gerçek üretim build çıktısı yukarıda. |
| 16 deterministik klasik referans | ✓ | Manifest SHA256'ları, iki koşuda 16/16 eşitlik. |
| Mevcut sırlar ve arka uç/UI kaynakları korundu | ✓ | Sır hash'leri eşit; kaynak/test beklentisi diff'i yok. |
| Geçici test DB temizliği | ✓ | Doğrulanmış fixture temizliği sonrası 0. |

Takip edilen dosyalar: ilerleme raporu ve klasik baseline dizini. Yerel
kurulum adaptörleri, indirilen örnekler/arşivler ve ham loglar ignore altında.
0.1 tamamlandı; kullanıcı onayı doğrultusunda şimdi 0.2–0.6 uygulanacak.

## 0.2 — kalıcı kurallar (14 Ekim 2026)

- `docs/design/sunum-katmani-kurallari.md` oluşturuldu; kullanıcının dokuz
  maddesi kapsam, merkezileştirme, TypeScript, erişilebilirlik, performans,
  veri dürüstlüğü, doğrulama, tasarım ve rapor içeriği kısaltılmadan korundu.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`: exit 0; **141/141**, 6,54 sn.
- `git diff --check` temiz. Değişen dosyalar: kural belgesi ve bu rapor.
  0.2 kabulü **✓**; 0.3'e geçiliyor.

## 0.3 — uygulama öncesi kapsam kararı

- Mevcut genel yayın liste servisleri 100 kayıtla sınırlı; sitemap için tüm
  görünür slug'ları ve son düzenleme zamanını veren bir okuma yok. Şemada
  `updated_at` da yok. Zorunlu ve yalnızca eklemeli istisna:
  `src/modules/publication/service.ts` içine salt okunur
  `listIndexablePublications` eklenecek. Mevcut yayın görünürlüğü/zaman
  penceresi korunacak; `lastModified`, mevcut indeksli `audit_logs` tablosunda
  ilgili içerik nesnesinin son işlem zamanından, audit olmayan eski satırlarda
  gerçek `created_at` değerinden gelecek. Şema, migration veya mutasyonlara
  dokunulmayacak; güncelleme zamanı uydurulmayacak.
- Statik genel rotalarda güvenilir yayın/güncelleme tarihi olmadığı için
  `lastModified` yazılmayacak. Statik rota listesi Faz 2 taşıma işaretiyle
  geçici tutulacak. Kök için onaylı OG görseli yok; yeni görsel eklenmeyecek.
- Etkilenen doğrulamalar: yeni gerçek PG sitemap/görünürlük/100+ kayıt/audit
  zamanı testleri, yeni genel/admin indeksleme e2e kontrolleri ve mevcut
  `publication`, `featured-event`, `admin-login`, `shell` sözleşmeleri.

### 0.4 uygulama öncesi zorunlu entegrasyon istisnaları

- `src/lib/cache/tags.ts` ve küçük bir server-only cache yardımcısı yalnızca
  eklenir. Gerekçe: etiket adlarını tek dosyada tutmak ve farklı yerel test
  DB'lerinin kalıcı Next cache'ini paylaşmasını önlemek. Cache anahtarı DB
  bağlantısının SHA256 kimliğini kullanır; sır değeri cache anahtarına yazılmaz.
- Cache Components tüm projede açılmaz: mevcut admin/API/medya davranışını
  değiştirmemek için Next 16.3.8'in paket rehberinde belgelenen mevcut model
  `unstable_cache` kullanılır. Genel UI için yeni okuma sarmalayıcıları eklenir;
  mevcut uygulama/domain/repository okuma ve yazma mantıkları korunur.
- Zamana bağlı yayın/link/etkinlik/ULUJAM/historik görünürlük ve galeri için
  **30 sn** veri yenilemesi; ayrıca typed etiketler. Cache JSON dönüşümünde
  Date alanları Zod ile tekrar Date'e çevrilir. Sayaç `initialNow` değeri
  cache'e girmez; `connection()` sonrasında her istekte üretilir.
- HTTP katmanına minimum ekleme: `publication/http.ts`,
  `links/application/http.ts`, `media/application/http.ts` ve mevcut
  `/api/admin/gallery/route.ts` içine yalnızca başarılı servis await'i
  (transaction COMMIT) sonrasında `revalidateTag(tag, { expire: 0 })` çağrıları.
  Yayın/save/draft/archive, link/grup sıra/gizleme, medya yayın/attach/silme ve
  galeri değişimi kapsanır. Auth/CSRF/MFA ve transaction içi kod değişmez.
- Etkilenen kontroller: cache tarih serileştirme/TTL/etiket ve commit öncesi
  geçersiz kılmama unit testleri; mevcut yayın/link/medya/galeri entegrasyonları;
  sıcak cache ile yayınla→görünür, taslağa al→kaybolur, yeniden yayınla e2e;
  sayaç tazeliği/hidrasyon ve üretim build rota tablosu.

### 0.3 sonuç ve kanıt

- Kök `noindex` kaldırıldı; `metadataBase` yalnızca `loadServerConfig().appUrl`
  üzerinden. `%s | ULUDOTT` şablonu ve sekiz genel sayfanın kanonik adresleri
  eklendi. Mevcut özel SEO başlığının birebir korunması sözleşmesi için slug
  sayfalarında editörün açık SEO başlığı `title.absolute` kullanır; diğer
  başlıklar kök şablonu izler. Admin layout/HTTP başlıkları değişmedi.
- `robots.ts` genel `/` erişimini açıp `/admin`, `/api`, `/l/` engeller;
  `sitemap.ts` sekiz statik rota ve salt okunur servis slug'larını içerir.
  Taslak/arşiv/gelecek/sona ermiş pencereler hariç, 100+ kayıt ve audit'ten
  gerçek son değişiklik zamanı gerçek PG testleriyle doğrulandı.
- Önce iki yeni PG testi eksik fonksiyon nedeniyle **RED**; uygulama sonrası
  **143/143 Vitest GREEN**. Typecheck/lint exit 0. Yeni e2e ilk koşuda 35/37:
  özel SEO başlığı sözleşmesi ve Next'in kök URL son slash normalizasyonu
  bulundu. Mevcut test beklentisi korunarak SEO davranışı düzeltildi; yeni
  canonical testi standart URL normalizasyonuyla eşitlik ölçüyor. Son tam
  e2e **37/37**, 22,5 sn; admin/API noindex, genel başlık/meta/başlık şablonu,
  robots/sitemap ve publish→draft→publish görünürlüğü geçti.
- Değişenler: kök/genel metadata dosyaları, robots/sitemap, shared publication
  servisine tek salt okunur ekleme, yeni sitemap PG/indexability e2e testleri
  ve mevcut featured-event testine ek davranış assert'leri; bu rapor.
  OG görseli üretilmedi; genel UI/tema, şema/migration ve auth değişmedi.
  0.3 kabulü **✓**; 0.4 veri önbelleği uygulanacak.
### 0.4 üretim test düzeneği için ek gerekçe (uygulama öncesi)

Önbellekle birlikte `/oyunlar` gibi genel sayfalar build sırasında ön üretilebilir. Mevcut üretim e2e düzeneği, başka DB ile alınmış `.next/standalone` çıktısını sonradan oluşturduğu seed'li test DB'siyle çalıştırıyordu. Artık build'in de aynı izole DB'yi kullanması gerekir. `tests/helpers/start-e2e.ts` içine yalnızca `ULUDOTT_E2E_REBUILD=1` seçeneği eklenir; bu seçenek test seed'leri tamamlandıktan sonra mevcut Next CLI ile build alır. Playwright üretim webServer zaman aşımı bu seçenekte build için uzatılır. Mevcut senaryolar, beklentiler, kimlik mekanizmaları ve servisler değişmez. Etkilenen doğrulama: tüm üretim e2e senaryoları, özellikle tarihî sonuçlar ve sıcak önbellekte yayınlama/yayından kaldırma. Yerel üretim build'inde APP_URL ve depolama endpoint'i yalnızca komut ortamında yerel HTTPS geçidine ayarlanır; `.env.local` korunur.
0.4 üretim e2e ilk denemesinde build başarılı, fakat mevcut standalone kopyası Windows'ta `cp` symlink oluştururken `EPERM` verdi. Test düzeneğine yalnızca Windows'ta `dereference: true` eklenir; bağlantının hedefindeki aynı dosyalar kopyalanır. Uygulama, test beklentileri ve Linux üretim kopyalama davranışı korunur. Başlangıç hatasının kaybolmaması için düzeneğe hata mesajı da eklenir.
### 0.4 sonuç ve kanıt

- Genel okumalar `modules/publication/ui/public-queries.ts` üzerinden etiketli veri önbelleğine bağlandı. TTL **30 sn**; Next'in zaman tabanlı yenilemesi SWR olduğu için süre dolduktan sonraki ilk istek eski yanıtı alıp yenilemeyi tetikleyebilir. Yönetici değişiklikleri `{ expire: 0 }` ile sonraki okumayı yeni veri gelene kadar bekletir. Rota statikliği veri önbelleğinin şartı değildir.
- Etiketler tek typed sabit dosyasında; kaynak DB ve APP_URL SHA256 kimliği cache alanını ayırır. Tarihler cache-hit sonrasında Zod ile Date'e döner. Genel sayfalardaki `force-dynamic` kaldırıldı; `/ulujam` taze sayaç zamanı için `connection()` nedeniyle dinamik kalır, veri okumaları önbelleklidir. Sitemap metadata işleyicisi dinamik kalır.
- Geçersiz kılma yalnızca HTTP katmanında başarılı servis await'inden sonra: etkinlik/duyuru save ve tüm durumlar, bağlantı/grup save/sıra/gizleme, medya yükleme/yayın/silme, galeri save/silme. Mevcut ayrı bir medya attach API'si yoktur; yayın afiş değişimi publication save, galeri eki gallery save üzerinden ilgili etiketi yeniler. Transaction, izin, kimlik ve schema kodu değişmedi.
- `pnpm typecheck`, `pnpm lint`: exit 0. `pnpm test`: **157/157**, 16 dosya, 7,35 sn. Commit öncesi beklememe/başarısız transaction, bütün mutasyon yolları, kaynak ayrımı ve Date cache-hit sözleşmesi yeni unit testleriyle doğrulandı.
- `pnpm test:e2e`: **37/37**, 31,4 sn. Üretim (`ULUDOTT_E2E_PRODUCTION=1 ULUDOTT_E2E_REBUILD=1`): **37/37**, 1,5 dk. Sıcak boş ana sayfa/liste/404/sitemap → yayınla → görünür → draft → kaybolur → yeniden yayınla → görünür. Eski testler korunarak ek assert'ler eklendi.
- `pnpm test:e2e --config playwright.countdown.config.ts`: geliştirme **1/1**, 11,8 sn; aynı senaryo üretim **1/1**, 1,6 dk. İki sıcak cache isteğinde server `initialNow` istek zamanına ±1 sn içinde; tarayıcı sayacı gerçek saate **≤1 sn** sapmalı; Yakında/counting/started ve geri çekme doğru; hydration/pageerror listesi boş. Test kendi DB'sinde çalışır, normal e2e'nin tarihsiz 2027 sözleşmesini etkilemez. Yeni senaryonun ilk geliştirme koşusunda test isteğinin secure çerez aktarımı eksikti (403); mevcut testlerdeki browser CSRF + Cookie aktarım deseni uygulandı, uygulama kimlik kodu değişmedi.
- Ara `pnpm build`: exit 0; `/`, `/duyurular`, `/etkinlikler`, `/linkler`, `/oyunlar` **○ / 30s**; `/ulujam` **ƒ**. Faz sonundaki build ayrıca tam tabloya kaydedilecek. Loglar `.local/faz0-04-*`; her e2e sonrası doğrulanmış izole fixture DB/medyası temizlendi, kalan test DB **0**.
- Değişenler: yeni iki lib/cache dosyası, genel UI okuma sarmalayıcısı, dokuz genel page, sitemap, sayaç server bileşeni, dört HTTP giriş noktası, cache unit/e2e testleri, üretim test düzeneğinin ek seçenekleri ve bu rapor. UI markup/stil/metin değişmedi. 0.4 kabulü **✓**.
### 0.5 sonuç, kanıt ve elle çalıştırma talimatı

- `scripts/live-audit.ts` ve `audit:live` package script'i eklendi; yalnızca Node fetch/built-in araçları, yeni bağımlılık yok. Altı anonim GET: `/`, `/robots.txt`, `/sitemap.xml`, `/admin`, geçersiz kimlikli `/l/…` ve `/media/…`. Yönlendirmeler izlenmez; istek başına 10 sn ve yanıt başına 2 MiB sınırı. Durum, X-Robots-Tag, meta robots, title, canonical, lang, skip ve site-header Markdown tablosunda görünür. Boş 404 + işleyiciye özgü başlıklar yalnızca ipucu diye raporlanır; genel HTML 404 rota kanıtı sayılmaz. Ham ağ/URL hataları kimlik bilgisi sızdırmadan özetlenir.
- İlk yeni test eksik modülden RED. İlk uygulama koşusunda yeni test fixture'ında skip hedefi `main-content` eksikti; gerçek işaretçinin karşılığı fixture'a eklendi. Son `pnpm typecheck`, `pnpm lint`: exit 0; `pnpm test`: **162/162**, 17 dosya, 7,47 sn. Beş yeni test gerçek yerel HTTP sunucusu ve Node CLI ile argüman ayırıcısı, HTML parsing, script içindeki sahte meta, Markdown escaping, handler ipucu/genel 404 ayrımı ve ağ hatasını doğrular.
- **Canlıya karşı çalıştırılmadı.** Kullanıcının daha sonra kendi ortamında elle çalıştıracağı komut:

  ```sh
  pnpm audit:live -- --url https://uludott.com.tr
  ```

  Çıktı Markdown'dır; istenirse kullanıcı `> live-audit.md` ile saklayabilir. Exit 0 tüm altı kontrol uygun, exit 1 eksik/belirsiz kontrol veya geçersiz argüman demektir. İşaretçiler bu deponun canlıda olduğuna dair ipucudur; deploy/commit kimliğini tek başına kanıtlamaz. Gizli yönetim erişimi veya token keşfi yapmaz.
- Değişenler: yeni script, package.json script kaydı, yeni yerel test ve bu rapor. Lockfile/dependency sürümleri ve mevcut scripts değişmedi. 0.5 kabulü **✓**.
### 0.6 sonuç ve kanıt

- `infrastructure/backup/pg-backup.sh`: `pg_dump -Fc`, UTC tarih/random dosya, SHA256, hedef kilidi, başarılı yeni dump+hash sonrası yalnız kendi tam ad desenindeki eski normal dosya çiftlerinin temizliği. Hedef `BACKUP_TARGET`, süre `BACKUP_RETENTION_DAYS`; ikisi de açık verilmelidir. Sağlayıcı varsayımı yok: `TODO: sağlayıcı onayı bekliyor`. `.gitattributes` yalnız backup shell dosyalarını LF tutar; Windows autocrlf'nin Linux betiğini bozmasını önler.
- `docs/operations/backup-restore.md`: ayrı/boş prova DB, checksum/TOC, tek transaction `pg_restore`, migration/tablo/kayıt/index/constraint/orphan sorguları, medya/anahtar/global rol envanteri ve prova raporu. Dump/retention/restore veya hedef bağlantısı **çalıştırılmadı/doğrulanmadı**. `bash -n infrastructure/backup/pg-backup.sh`: exit 0; yalnız parse kontrolü, betik gövdesi çalışmaz.
- `docs/operations/vds-olcum.md`: 4 GB/2 vCPU ve botla ortak yük; free/df/vmstat/pidstat/systemd-cgtop/PG bağlantı ve shared_buffers kontrolleri, referans/tepe/toparlanma protokolü. RAM/swap/CPU/disk/bağlantı başlangıç ölçüm eşikleri önerildi; kullanıcı **14 Ekim 2026'da “Ölçüm eşiklerini onaylıyorum”** yanıtıyla onayladı. Canlı ölçüm ve kapasite kabulü hâlâ **doğrulanmadı**. Yedek sağlayıcısı, süre/şifreleme/RPO/RTO onayı ayrı olarak bekliyor.
- `pnpm typecheck`, `pnpm lint`: exit 0; `pnpm test`: **162/162**, 17 dosya, 7,11 sn. Belge/betik adımı için çalışma zamanı testi yapılmadı; yedek çalıştırmama kuralı korundu. Değişenler: yeni backup betiği, iki operasyon belgesi, dar LF kuralı ve bu rapor. 0.6 hazırlık kabulü **✓**.

## Faz 0 bitiş — kabul (14 Ekim 2026)

Dal: `sunum/faz-0`. Uygulama adımları yerel commit'lerle kayıtlı: 0.1 `363f2f7`, 0.2 `abd93fe`, 0.3 `3831e85`, 0.4 `3da7345`, 0.5 `539942e`, 0.6 `6632dfa`. Önceki ortam engeli kayıtları `07ce585`/`c9cb08b` tarihsel kanıttır. Push/merge yapılmadı. Bu bölüm son doğrulama sonrası ayrı rapor commit'iyle kaydedilir.

### Son doğrulama zinciri

Komutlar aşağıdaki sırada çalıştırıldı; her biri exit 0. Ham loglar `.local/faz0-final-*.log`, zaman/exit kaydı `.local/faz0-final-results.json`. Süreler komut duvar süresidir; kullanıcıya özel sırlar loglanmadı.

| Komut | Sonuç özeti | Süre |
|---|---|---|
| `pnpm typecheck` | tsc --noEmit, hata yok | 2,97 sn |
| `pnpm lint` | eslint --max-warnings=0, hata/uyarı yok | 3,66 sn |
| `pnpm test` | **162/162**, 17 dosya (Vitest 11,41 sn) | 13,71 sn |
| `pnpm test:integration` | **95/95**, 11 dosya, gerçek yerel PG/Garage (Vitest 11,73 sn) | 13,10 sn |
| `pnpm test:e2e` | **37/37**, 2 worker (Playwright 37,9 sn) | 40,23 sn |
| `pnpm build` | Next **16.3.8**, Turbopack; compile/TS/prerender başarılı | 13,55 sn |

Üretim config doğrulaması HTTPS istediğinden build komutunda yalnız süreç ortamına `APP_URL=https://127.0.0.1:3443`, `OBJECT_STORAGE_ENDPOINT=https://127.0.0.1:9443` verildi. Ana yerel DB kullanıldı; `.env.local` değiştirilmedi, canlıya istek gönderilmedi. Üretim e2e için bu portlarda mevcut test düzeneğinin yerel TLS geçitleri ve kendi seed'li izole DB'si kullanıldı. Üretim e2e **37/37**, ayrı sayaç üretim e2e **1/1** kanıtları 0.4 bölümünde; yerel Windows sonuçları Linux VDS kapasitesi/deploy kanıtı sayılmaz.

Ek son kontroller:

- Aynı çekim koşullarında ayrı boş DB ile `.local/baseline-faz0-finish/` üretildi. Kayıtlı klasik referansla **16/16 PNG SHA256 birebir eşit**. Başlangıç baseline'ı değiştirilmedi.
- Üretim CSS başlangıç/bitiş: **5651 / 5651 bayt**, gzip level 9 **1940 / 1940 bayt**, aynı SHA256 `5f2bd63bda302fb49a83f6fe9e9248de08f8ccb494495d46a077e8ab286b1ae1`. UI/tema değişimi yok.
- `.env.local` ve `.local/garage-rpc.secret` başlangıç/son SHA256 eşitliği **true / true** (sır/hash değerleri rapora yazılmadı).
- Son yerel DB kontrolü: **42 public tablo, 0 dolu tablo, 8 uygulanmış migration, 0 kalan test DB**. Ürün DB'sine test/HEIC/uydurma içerik seed edilmedi.
- Yerel Compose: PostgreSQL healthy, Garage Up, secret-init Exited(0). Windows'a özel ignore edilmiş overlay kullanıldı; takip edilen Compose ve secret dosyaları aynı.
- `git diff --check`: temiz. `src/db/**`, `drizzle.config.ts`, auth/oturum/CSRF/MFA, mevcut config/database altyapısı, l/media işleyicileri, mevcut scripts ve bağımlılık/lock sürümleri değişmedi. Önceden gerekçelendirilmiş eklemeler: salt okunur sitemap servisi, yeni cache altyapısı ve COMMIT sonrası HTTP etiket çağrıları.

### Bitiş rota tablosu (gerçek pnpm build çıktısı)

```text
Route (app)                   Revalidate  Expire
┌ ○ /                                30s      1y
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/duyurular
├ ƒ /admin/etkinlikler
├ ƒ /admin/galeri
├ ƒ /admin/linkler
├ ƒ /admin/medya
├ ƒ /api/admin/announcements
├ ƒ /api/admin/csrf
├ ƒ /api/admin/events
├ ƒ /api/admin/gallery
├ ƒ /api/admin/links
├ ƒ /api/admin/login
├ ƒ /api/admin/logout
├ ƒ /api/admin/media
├ ƒ /api/admin/session
├ ƒ /api/admin/session/renew
├ ƒ /api/links/[id]/qr
├ ○ /destek
├ ○ /duyurular                       30s      1y
├ ƒ /duyurular/[slug]
├ ○ /etkinlikler                     30s      1y
├ ƒ /etkinlikler/[slug]
├ ○ /hakkimizda
├ ƒ /l/[id]
├ ○ /linkler                         30s      1y
├ ƒ /media/[variantId]
├ ○ /oyunlar                         30s      1y
├ ○ /robots.txt
├ ƒ /sitemap.xml
└ ƒ /ulujam

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### Başlangıç / bitiş karşılaştırması

| Rota veya grup | Faz 0 başlangıç | Faz 0 bitiş | Gerekçe |
|---|---|---|---|
| `/` | ƒ, force-dynamic | ○, 30 sn | Öne çıkan veri etiketli; root force-dynamic kaldırıldı |
| `/etkinlikler`, `/duyurular` | ƒ | ○, 30 sn | Liste verisi önbellekli |
| `/linkler`, `/oyunlar` | ƒ | ○, 30 sn | Link pencereleri/hedefleri ve tarihî sonuçlar önbellekli |
| `/ulujam` | ƒ, force-dynamic | ƒ, connection() | Veri önbellekli; initialNow her istekte taze |
| Etkinlik/duyuru `[slug]` | ƒ, force-dynamic | ƒ | Dinamik parametre; detay verisi etiketli, force-dynamic yok |
| `/hakkimizda`, `/destek`, `/_not-found` | ○ | ○ | Statik davranış korunur |
| `/admin/**`, `/api/**`, `/l/[id]`, `/media/[variantId]` | ƒ | ƒ | Özel/HTTP okuma ve güvenlik davranışı korunur |
| `/robots.txt` | Yok | ○ | Yeni metadata rotası |
| `/sitemap.xml` | Yok | ƒ | Yeni metadata rotası; yayımlanmış slug verisi önbellekli |
| Toplam | 30 rota: **3 ○ / 27 ƒ** | 32 rota: **9 ○ / 23 ƒ** | Beş rota ön üretilir, iki metadata rotası eklenir |

Buradaki rota ön üretimi veri cache'inin sonucudur; page/layout seviyesinde yeni `revalidate` ayarı veya genel Cache Components geçişi yapılmadı. Gelecekte kök layout dil çerezi okuyup dinamik olduğunda bu DB okuma önbellekleri çalışmaya devam eder. Build'in `Expire 1y` sütunu zaman tabanlı SWR için framework varsayılanıdır; veri 30 sn revalidation kullanır, yönetici mutasyonunda `{ expire: 0 }` uygulanır.

### Kabul ölçütleri

| Ölçüt | Sonuç | Kanıt |
|---|---|---|
| Referans hat kayıtlı | ✓ | 0.1: config/migrate/type/lint/test/integration/e2e/build exit 0, **141/93/27** |
| 16 deterministik klasik görsel kayıtlı | ✓ | PNG + manifest + README; iki başlangıç koşusu ve bitişte **16/16 SHA eşit** |
| Genel sayfalarda HTTP/meta noindex yok | ✓ | Sekiz public rota indexability e2e; üretimde de 37/37 suite |
| `/admin` ve `/api/admin` noindex korunur | ✓ | Admin meta + yanıt başlığı, API session yanıt başlığı e2e |
| Robots/sitemap doğru, taslak dışarıda | ✓ | Gerçek PG sitemap testleri (taslak/arşiv/gelecek/bitmiş pencere/101+ kayıt/audit zamanı) + e2e |
| Ana sayfa force-dynamic değil | ✓ | Son kaynak + build `/` ○ / 30s |
| Yayınla → görünür; yayından kaldır → kaybolur | ✓ | Sıcak home/list/detail/sitemap cache ile featured-event e2e, geliştirme ve üretim |
| Veri cache'i ve COMMIT sonrası invalidation | ✓ | Typed etiketler, TTL 30, Date/cache kaynak ayrımı ve bütün mevcut HTTP mutasyonları unit + e2e |
| Countdown ≤1 sn sapma, hidrasyon uyarısı yok | ✓ | İzole gerçek tarayıcı testinde iki sıcak istek, üç evre ve draft sonrası Yakında; dev/prod 1/1 |
| Bütün zorunlu son komutlar yeşil | ✓ | Yukarıdaki sıralı zincir; **162 / 95 / 37**, build exit 0 |
| Kalıcı kural belgesi eksiksiz | ✓ | `docs/design/sunum-katmani-kurallari.md`, özgün dokuz madde |
| Denetim/yedek/kapasite hazırlığı | ✓ | Audit yerel HTTP/Node CLI testleri; backup yalnız bash -n; restore/VDS belgeleri, ölçüm eşikleri onaylı |
| Arka uç/domain/auth/schema ve görsel kaynak sınırları | ✓ | Diff kontrolü; yalnız raporlanmış salt okunur/performans HTTP eklemeleri; CSS ve 16 görsel eşit |

### Değişen dosyalar

Başlangıç `b731d00` → bitiş: **58 takip edilen dosya**, bunun 16'sı PNG. Tam dosya listesi (`*.png` satırı 16 referansı birlikte gösterir):

```text
.gitattributes
package.json
playwright.config.ts
playwright.countdown.config.ts
docs/design/sunum-katmani-kurallari.md
docs/operations/sunum-katmani-ilerleme.md
docs/operations/backup-restore.md
docs/operations/vds-olcum.md
infrastructure/backup/pg-backup.sh
scripts/live-audit.ts
src/app/layout.tsx
src/app/page.tsx
src/app/robots.ts
src/app/sitemap.ts
src/app/(public)/destek/page.tsx
src/app/(public)/hakkimizda/page.tsx
src/app/(public)/ulujam/page.tsx
src/app/(public)/oyunlar/page.tsx
src/app/(public)/linkler/page.tsx
src/app/(public)/etkinlikler/page.tsx
src/app/(public)/etkinlikler/[slug]/page.tsx
src/app/(public)/duyurular/page.tsx
src/app/(public)/duyurular/[slug]/page.tsx
src/app/api/admin/gallery/route.ts
src/lib/cache/tags.ts
src/lib/cache/public-read.ts
src/modules/publication/service.ts
src/modules/publication/http.ts
src/modules/publication/ui/public-queries.ts
src/modules/events/ui/ulujam-coming-soon.tsx
src/modules/links/application/http.ts
src/modules/media/application/http.ts
tests/e2e/__baseline-classic__/README.md
tests/e2e/__baseline-classic__/manifest.json
tests/e2e/__baseline-classic__/*.png (16)
tests/e2e/indexability.spec.ts
tests/e2e/featured-event.spec.ts
tests/cache-e2e/countdown.spec.ts
tests/helpers/start-e2e.ts
tests/integration/sitemap-publications.test.ts
tests/unit/cache-invalidation.test.ts
tests/unit/public-cache.test.ts
tests/unit/live-audit.test.ts
```

### Açık operasyon konuları / onay bekleyenler

- **Yedek sağlayıcısı/erişim/şifreleme/saklama süresi/RPO/RTO/zamanlama:** onay bekliyor. Betik veya hedefe erişim, dump/restore ve VDS yük testi çalıştırılmadı; çalışma zamanı/kapasite **doğrulanmadı**. VDS başlangıç ölçüm eşikleri onaylıdır; bu onay canlı işlem izni değildir.
- **Canlı audit:** kullanıcı daha sonra 0.5'teki komutla çalıştıracak; bu faz canlı siteye erişmedi. Canlı deploy/indexlenme durumu **doğrulanmadı**.
- **Genel OG görseli:** onaylı kaynak verilmediği için eklenmedi/üretilmedi. Mevcut içerik detayındaki onaylı yayımlanmış medya davranışı korunur.
- **Özgün HEIC dosyaları:** kullanıcıda yok; açık izinle indirilen geçerli örnekler yalnız ignore edilen `Media/` altında. Kapsanan test geometrileri gerçek decoder ile doğrulandı; orijinal telefon dosyalarının kanıtı değildir. Kaynak/lisans/ölçü/hashes 0.1'de kayıtlı, ürün medyası yapılmadı.
- **Sonraki fazlar:** sitemap statik listesi `FAZ-2` işaretiyle taşınmayı bekler. İleride token'lı sayfalar eklendiğinde kendi explicit noindex meta/HTTP korumaları gerekir; şu an böyle bir sayfa uygulanmış değildir. Tarihî sonuçlarda mevcut HTTP yazma yolu yoktur; CLI seed değişikliği TTL ile yenilenir, gelecekte HTTP yönetim yolu eklendiğinde ilgili etiketi COMMIT sonrası geçersiz kılmalıdır.

Faz 0 uygulama ve yerel kabul ölçütleri **tamamlandı**. Faz 1 UI/tema/i18n çalışması bu faza eklenmedi.
## Faz 1 başlangıç — 14 Ekim 2026

Dal: `sunum/faz-1`, başlangıç `dba0f64`. Faz 0 son kabul tablosu ✓; 16 baseline ve CSS gzip referansı mevcut. AGENTS, Next 16.3.8 font/root layout/flash-before-hydration rehberleri, kural belgesinin tamamı, bu rapor ve mevcut CSS/layout/tasarım sistemi okundu. Çalışma ağacında kullanıcıya ait bağımsız `ULUDOTT-WEB/` Git checkout'u var (başlangıç `b731d00`); bu dizine dokunulmaz ve commit'e alınmaz. Uygulama bu deponun kök `src/` ağacıdır.

### 1.1 envanter ve anlamsal eşleme (uygulama öncesi)

`src/**/*.{ts,tsx,css}` taraması **201 kullanım kaydı**, 12 farklı eski özel özellik, 11 farklı renk yazımı, 53 farklı ölçü/hareket yazımı çıkardı. Tam dosya/satır/kullanım envanteri `.local/faz1-inventory.json`; tekrar üretme yardımcısı `.local/faz1-inventory.mjs` (Git dışında). `ms` literal'i yok; animasyonda `2s` var. JSX'teki tek mevcut inline style oyun grid konumudur, renk değildir. UI dışındaki tek TS renk sabiti JPEG rasterizasyon arka planıdır.

| Eski değişken / literal | Yeni anlamsal token | Classic davranışı |
|---|---|---|
| `--ink` | `--color-bg`, `--color-text-inverse`, kontrast tokenları | Mevcut koyu değer aynı |
| `--panel` | `--color-surface`, `--color-bg-elevated` | Mevcut panel aynı |
| `--cream` | `--color-text` | Mevcut metin aynı |
| `--muted` | `--color-text-muted` | Mevcut ikincil metin aynı |
| `--line` | `--color-border` | Dekoratif border aynı; yeni güçlü UI sınırı ayrı |
| `--lime` | `--color-primary`, `--color-focus` | Mevcut vurgu aynı |
| `--purple` | `--color-secondary`, seçim/status tokenları | Mevcut ikincil vurgu aynı |
| `--coral` | `--color-accent` | Mevcut vurgu aynı |
| `--radius` | `--radius-card` | 18px korunur |
| `--space` | `--space-gutter` | clamp(20px, 5vw, 80px) korunur |
| `--font`, `--mono` | `--font-body`, `--font-display`, `--font-label`, `--font-mono` | Arial / Courier New eşlemesi korunur |
| `#000a` dialog backdrop | `--color-overlay` | Aynı alpha |
| QR `white` | `--color-qr-bg` | QR için opak açık yüzey korunur |
| Yıldız rgba gölgesi | `--glow-primary` | Mevcut 18px efekt, yalnız izinli harekette |
| `1px`, `3px`, `5px`, `-1px` | border/outline/underline/tracking tokenları | Mevcut ölçüler aynı |
| `6/8/10/12/16/18/20/24/28/30/32/36/40/48/56/64/68/80px` | space scale + bölüm/hero/control tokenları | Her bağlamın ölçüsü korunur; sayısal takma ad yerine anlam |
| `12/14/18/20/22/24/30/32/36/48/52/76/120px` | text scale, display/heading/label/link/control tokenları | Eski hesaplanan font ölçüleri korunur |
| `44/48/70/84/106px` | touch target, board row, header yüksekliği tokenları | Touch hedefleri 48px'e tamamlanır; header kompozisyonu korunur |
| `390/560/800/1000/1360px`, `65ch`, `90vw` | preview/dialog/profile/heading/layout/measure tokenları | Aynı layout sınırları |
| `100/999px` | status/control/pill radius tokenları | Mevcut pill görünümleri |
| `2s`, easing, z-index ve birimsiz oranlar | motion/ease/layer/opacity/layout tokenları | Hareket reduced-motion altında kısalır |
| `699/700/900/1100px` | base.css başındaki tek breakpoint belge bloğu | Mobil sınırı 700, grid 900, tablet üst sınırı 1100; CSS media literal istisnası |

Eski değişken adları base.css'te takma ad olarak bırakılmaz. Yeni özel özelliklerin tamamı themes.css'te tanımlanır. Next/font yüz adları için aynı token kümesinde `inherit` tanımları + named layer kullanımı araştırıldı; derleyicinin katmansız `.variable` sınıfları gerçek yüzleri sağlar. Tema ekleme registry kümesi ve CSS bloğuyla yürür. Yeni görünür metin/çeviri/rota config veya tema seçici eklenmez; mevcut metinler bu fazda taşınmaz.

### Uygulama öncesi teknik kararlar ve etkilenen doğrulamalar

- **Dokunulmaz JPEG sabiti:** `src/modules/media/infrastructure/process-image.ts:34` içindeki flatten arka planı UI teması değil, kalıcı görüntü çıktısı sözleşmesidir. Backend'e dokunmama ile mutlak sıfır literal hedefi burada çatışır. Tercih kullanıcıya sunulacak; sonuç merkezi renk testinde açık, bağlama bağlı gerekçeyle ve raporda kayıtlı olmalı. Tüm infrastructure ağacını sessizce hariç tutmak yasaktır.
- **Font preload:** Next root layout'ta `preload: true` bütün temalarda koşulsuz ağ isteği üretir; localStorage classic tercihi sunucuya görünmez. Classic sıfır-font için üç loader'da preload:false gerekir. Arcade'in doğal CSS font yüklemesi ile koşullu kritik preload seçenekleri kullanıcıya sunulacak; ağ kanıtı üretim cold-cache e2e ile alınır. Font loader yüz değişkenleri ve font/subset boyutları da raporlanır.
- **Kontrast:** Eski classic border/bg ≈1,93; arcade istenen güçlü border/bg ≈2,38. Dekoratif classic border değeri korunur; yeni güçlü border tokenı aynı ton ailesinde yeterince açılır. Renklerin diğer zorunlu çiftleri ölçülecek, düşük çiftler ayarlanıp kaydedilecek.
- **Admin alt ağaç:** Klasik wrapper, font/zemin/metin tokenlarını kendisi tüketir; root arcade'den hesaplanan font-family mirasının yönetimi değiştirmesi önlenir. Eski body > main stilleri yeni wrapper'a uyarlanır. Kimlik/oturum işleyicileri değişmez.
- Etkilenen doğrulamalar: merkezi literal/özel özellik/kontrast unit testleri, boot ve store testleri, sekmeler arası tema ve engellenmiş storage e2e, iki temada axe, boş DB classic 16 baseline karşılaştırması, font ağ/preload ve Türkçe glif kanıtları, mevcut backend davranış testleri.
### 1.1 yerel doğrulama kapsamı düzeltmesi (uygulama öncesi)

İlk envanter sonrası `pnpm typecheck` geçti; `pnpm lint` **319 parsing error** verdi. Nedeni tema kodu değil: kökte sonradan bulunan bağımsız `ULUDOTT-WEB/` checkout'unun ikinci eslint/tsconfig kökü olarak taranması. `pnpm test` lint kırmızı olduğundan bu ilk zincirde çalıştırılmadı. Kullanıcı dizini taşınmaz/silinmez/değiştirilmez. Minimum doğrulama config düzeltmesi: kök `eslint.config.mjs` içine parser için `tsconfigRootDir: import.meta.dirname` ve yalnız bu bağımsız checkout için açıklamalı global ignore eklenir. Kök uygulamanın src/tests/scripts/config taraması veya kuralları daraltılmaz. Etkilenen kontrol `pnpm lint`; ardından typecheck/lint/test zinciri tekrarlanır. Test beklentisi veya backend değişikliği değildir.
### 1.1 sonuç ve kullanıcı kararı

Lint kapsam düzeltmesi sonrası `pnpm typecheck`, `pnpm lint`: exit 0; `pnpm test`: **162/162**, 17 dosya, 7,78 sn. Envanter ve eski→anlamsal eşleme tamamlandı. 14 Ekim 2026 kullanıcı JPEG sabitini **yalnız ilgili kullanıma özel gerekçeli istisna** olarak korumayı onayladı; backend dosyası değişmeyecek. Renk kabulü bu açık kararla “themes.css dışında 0 UI renk literal'i; 1 dokunulmaz JPEG işleme sabiti” olarak ölçülür. Font preload seçeneği yanıtı beklenirken bağımsız token/CSS işi ilerler.
### 1.2 sonuç ve kontrast kanıtı

`themes.css` iki eş özel özellik kümesiyle (**tema başına 140 token**) oluşturuldu; selector'lar `:root, [data-theme="arcade"]` ve `[data-theme="classic"]`, ikisi de dark color-scheme. Temanın bütün renk/tipografi/ölçü/hareket/katman değerleri bu dosyada. Named layer, next/font'un katmansız yüz sınıflarının root'ta üstün gelmesini ve alt ağaçlarda inherit ile gerçek yüzün korunmasını sağlar. Classic ana renkler/radius/Arial-Courier değerleri korundu; güçlü kontrol sınırı ayrı token olarak eklendi.

Önce 24 yeni test eksik themes.css nedeniyle RED; sonra `pnpm typecheck`, `pnpm lint`: exit 0; `pnpm test`: **186/186**, 18 dosya, 6,87 sn. Renkler aşağıda WCAG sRGB luminance formülüyle ölçüldü; yuvarlama yalnız rapor içindir, test ham oranı karşılaştırır.

| Çift | Classic | Arcade | Eşik |
|---|---:|---:|---:|
| text / bg | 14,802 | 17,963 | 4,5 |
| text / surface | 13,114 | 16,559 | 4,5 |
| text-muted / bg | 8,954 | 7,100 | 4,5 |
| text-muted / surface | 7,934 | 6,545 | 4,5 |
| primary-contrast / primary | 14,346 | 5,423 | 4,5 |
| secondary-contrast / secondary | 7,690 | 14,665 | 4,5 |
| accent-contrast / accent | 8,469 | 17,041 | 4,5 |
| primary / bg | 14,346 | 5,423 | 3 |
| secondary / bg | 7,690 | 14,665 | 3 |
| focus / bg | 14,346 | 17,041 | 3 |
| border-strong / bg | 3,500 | 3,279 | 3 |
| border-strong / surface (ek gerçek kontrol sınırı) | 3,101 | 3,022 | 3 |

Arcade istenen border-strong tonu #4a4a7a → #5f5f8f olarak açıldı (bg oranı 2,377 → 3,279). Classic dekoratif border #494a50 aynıdır; yeni güçlü sınır #707177, mevcut dekoratif görünümün yerine geçirilmez. Değişenler: themes.css ve kontrast test/helper dosyaları, bu rapor. Henüz uygulama CSS import'u değiştirilmedi.
### 1.3 sonuç ve kanıt

`git mv src/styles/tokens.css src/styles/base.css` yapıldı. Eski 12 takma ad kaldırıldı; bütün renk, font ölçüsü, boşluk, radius, border, gölge, süre ve katman değerleri `var(--…)` tüketir. Root layout import sırası themes.css → base.css. Base dosyasındaki px literal'leri yalnız başta belgelenen 700/900/1100 breakpoint sorgularında bulunur. 699/700 ayrımı aynı 700 sınırını kullanan modern range syntax'e çevrildi. Reduced-motion süre/iteration tokenlarıyla kısalır; mevcut yıldız animasyonu yalnız no-preference altında olduğundan eski reduced-motion “animationName none” sözleşmesi korunur.

`pnpm typecheck`, `pnpm lint`: exit 0; `pnpm test`: **186/186**, 18 dosya, 10,29 sn. `rg` taramasında base.css'te renk/ölçü literal'i kalmadı (yalnız belgeli media px istisnası); eski değişken yok. Classic görsel regresyonu boot/font adımları sonrasındaki özel boş-DB koşusunda doğrulanacak, henüz iddia edilmiyor. Değişenler: CSS taşıması/içeriği, root import'ları ve rapor.
### 1.4 kaynak/derleme kanıtı

Üç `next/font/google` tanımı yalnız `src/config/fonts.ts` içinde: Press Start 2P (400), Space Grotesk (variable), VT323 (400); latin+latin-ext, display:swap, ayrı face değişkenleri. Root yalnız `.variable` sınıflarını taşır; hangi yüzün kullanıldığını themes.css seçer. Koşulsuz preload classic sıfır-font şartına aykırı olduğundan preload:false seçildi; arcade doğal CSS yüklemesi kullanır, **preload listesi boş**. Kullanıcı font alternatifi sorusuna ayrı yanıt vermeden Faz 1'i kesintisiz bitirmeyi istedi; minimum doğal CSS seçeneğiyle ilerlenir. Yeni bağımlılık yok.

Önce eksik font config nedeniyle RED; sonra `pnpm typecheck`, `pnpm lint`: exit 0; `pnpm test`: **187/187**, 19 dosya, 6,85 sn. Gerçek Google font indirmeleriyle `pnpm build`: exit 0, compile 5,2 sn / TS 5,3 sn; Faz 0 rota statiklik tablosu korunur. Mock/fallback dosyasıyla derleme geçirme yapılmadı. Classic ağ sıfırı ve Türkçe glif ekran kanıtı, boot sonrası üretim e2e'de alınacak; henüz görsel kanıt iddiası yok. Değişenler: fonts.ts, root font sınıfları, AST tabanlı font sözleşmesi testi ve rapor.

### Faz 1 / 1.5 — Tema tercihi ve ilk boyama

- `THEMES` birleşim tipi, tam `THEME_REGISTRY`, doğrulayıcı, varsayılan Arcade ve admin Classic tanımlandı. Storage/çerez anahtarlarının tek kaynağı `src/config/storage-keys.ts`.
- Next 16 `preventing-flash-before-hydration` rehberine uygun senkron `head` betiği merkezi sabitlerden üretilir; erişilemeyen/geçersiz localStorage varsayılana döner. HTML hydration uyarısı yalnız kök attribute için bastırılır.
- `useSyncExternalStore` DOM attribute, MutationObserver ve sekmeler arası storage olayını izler. Layout effect yalnız Next dev/StrictMode attribute sıfırlamasını ilk boyamadan önce onarır. Tema değiştirici UI eklenmedi.
- Admin sarmalayıcısı Classic tokenlarını font/color/background üzerinde yeniden tüketir; hesaplanmış Arcade body fontunu miras almaz. Backend ve admin robots metadata değişmedi.
- Kanıt: önce yeni iki test modül eksikliğinde kırmızı; ardından `pnpm typecheck`, `pnpm lint` çıkış 0, `pnpm test`: 21 dosya / 197 test geçti (12.28 sn). Gerçek tarayıcı FOUC/ağ/admin kanıtları 1.8'de tamamlanacak.
