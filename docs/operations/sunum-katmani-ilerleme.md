# Sunum katmanı ilerleme raporu

## Faz 0 başlangıç

Tarih: 10 Ekim 2026 (Europe/Istanbul). Dal: `sunum/faz-0`.
Başlangıç commit'i: `b731d00`. İlk incelemede çalışma ağacı temizdi.

**Durum: 0.1 ortam kurulumu engellendi; Faz 0 tamamlanmadı.** Referans
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
