# Sunum katmanı ilerleme raporu

## Faz 0 başlangıç

Tarih: 10 Ekim 2026 (Europe/Istanbul). Dal: `sunum/faz-0`.
Başlangıç commit'i: `b731d00`. İlk incelemede çalışma ağacı temizdi.

**Güncel durum:** 0.1 yeniden başlatıldı; migration, typecheck ve lint geçti,
`pnpm test` **135 geçti / 6 başarısız** sonucu verdi. Garage sır dosyası izinleri
ve eksik iki HEIC girdisi engel oluşturuyor. Ayrıntılar en alttaki yeniden
başlatma kaydında. Faz 0 tamamlanmadı; 0.2–0.6 başlatılmadı.

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
