# Uludott Web

GitHub deposu: [akkusahmet16/ULUDOTT-WEB](https://github.com/akkusahmet16/ULUDOTT-WEB).

Üretim platformunun adım adım geliştirildiği depo. **Görev 1–11 tamamlandı**: çalışma ortamı, veritabanı, yönetici kimliği, tasarım sistemi, özel medya, etkinlik/duyuru yayın akışı, bağlantı merkezi ve 2026 derece bağlantıları hazır. UluJam arşivi/2027 yakında ve mini oyunlar tamamlandı. Form şeması, koşul motoru ve değişmez sürümler hazır. Form yönetim paneli hazır. Sıradaki adım Görev 12 açık form gönderimi; başvuru ve Wallet özellikleri henüz uygulanmadı. Üretime hazır değildir.

## Önce okunacak belgeler

- [Uygulama planı](docs/design/2026-10-02-uygulama-plani.md)
- [İlerleme ve test raporu](docs/operations/progress.md)
- [Mimari](docs/design/2026-10-01-mimari-oneri.md)

Her işlem öncesi plan ve rapor okunur. Tamamlanma, test ve dosya inceleme kanıtıyla işaretlenir.

## Araçlar ve kurulum

Node **24.21.0 LTS**, pnpm **11.19.0**. `packageManager` ve lockfile sabittir; pnpm `devEngines.runtime` üzerinden proje komutlarını doğru Node ile çalıştırır. Sistem Node kurulumu değiştirilmez. Docker Engine/Desktop veya uyumlu bir daemon ve Compose eklentisi yerel veri hizmetleri için gereklidir. Bu Mac'te Homebrew ile Colima, Docker CLI, Compose ve Buildx kuruldu. Projeye özel VM: `colima start --profile uludott --cpu 2 --memory 4 --disk 20 --vm-type vz`; kapatma: `colima stop --profile uludott`. VM diski üst sınırdır; VDS kapasite kararı değildir. Homebrew kurulumu: `brew install colima docker docker-compose docker-buildx`. Global Docker ayarları değiştirilmedi; eklenti bulunmazsa `docker-compose` komutunu kullanın.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
```

`.env.local` içindeki yerel DB ve depo parolalarını değiştirin. `DATABASE_URL` parolası `LOCAL_POSTGRES_PASSWORD` ile eşleşmelidir; özel karakterler URL-encode edilmelidir. Gerçek sırları `.env.example` veya Git'e koymayın. Değişken adlarının açıklamaları örnek dosyadadır.

Garage yerel RPC sırrını yalnızca ilk kurulumda oluşturun; mevcut dosyanın üzerine yazmayın:

```sh
mkdir -p .local
(umask 077; set -C; openssl rand -hex 32 > .local/garage-rpc.secret)
```

Depo erişim kimliği `GK` + 32 hexadecimal karakter olmalıdır; `.env.local` içinde yalnızca yerel kurulum için belirleyin. Örnek sıfırlı kimlik gerçek sağlayıcı kimliği değildir.

```sh
pnpm config:check
docker-compose --env-file .env.local up -d
docker-compose --env-file .env.local ps
pnpm dev
```

Uygulama: http://127.0.0.1:3000 . Yerel PostgreSQL: 127.0.0.1:5432. S3 uyumlu Garage: 127.0.0.1:9000. Garage başlangıçta özel bucket ve yerel anahtarı oluşturur; API için path-style adresler ve `garage` region kullanılır. `docker-compose --env-file .env.local exec object-store /garage status` ile servis kontrol edilir. Tek düğümlü depo yalnızca geliştirme içindir; canlı depo sağlayıcısı seçilmedi. Compose ve Docker çalıştırma kabulü yerel ortamda geçti; raporda kanıtları bulunur. Resmî yerel kurulum: https://garagehq.deuxfleurs.fr/documentation/quick-start/

`config:check` yalnızca ayarları doğrular; servislerin erişilebilir olduğunu kanıtlamaz. Ana sayfa ve yayın listeleri artık DB okur; PostgreSQL servisi gerekir. Boş DB kabulü ayrıca entegrasyon testleriyle doğrulanır.

## Kontroller

```sh
pnpm test
pnpm test:integration
pnpm typecheck
pnpm lint
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Vitest yapılandırma yanında gerçek PostgreSQL bağlantısını ve S3 yükle/oku/sil ile anonim erişim reddini kontrol eder. Entegrasyon testleri çalışan yerel servisler ve `.env.local` gerektirir; servis yoksa testler atlanmaz, başarısız olur. Playwright kendi izole Next sunucusunu 3100 portunda açar/kapatır. Üretim build'inden sonra `pnpm start` kullanılabilir. Docker build: `docker build -t uludott-web:local .` (yerel ARM Linux konteynerinde doğrulandı).

`pnpm db:migrate` Drizzle migration'larını uygular, seed çalıştırmaz. 42 tabloyu kuran migration dosyaları hazırdır; komut gerçek PostgreSQL üzerinde iki kez başarıyla çalıştırıldı. `pnpm db:generate` yeni migration üretir, `pnpm db:check` metadata tutarlılığını kontrol eder. Üretilen SQL uygulanmadan önce incelenir; migration dağıtımda tek süreçten çalıştırılır. [ER diyagramı ve şema kararları](docs/architecture/database.md) burada kayıtlıdır. 2026 editoryal derece bağlantıları migration'dan ayrı `pnpm db:seed:2026` ile yüklenir; tekrar çalıştırılabilir ve kişi/takım oluşturmaz.

## Sırlar ve kaynak varlıklar

Wallet klasörü içeriği okunmadan `/Users/taklalie60/.uludott-secrets/web-v0.1/Wallet secrets` konumuna taşındı. Üst dizinler 0700; klasör Git ve Docker bağlamının dışında. Bu makineye özel yol uygulama tarafından okunmaz ve entegrasyon çalıştığı anlamına gelmez.

Ham `Media` ve `Uludott Logo Pack` varlıkları yerinde korunur, depoya alınmaz. İlgili görevlerde doğrulanmış ve optimize türevler kullanılır. `.dockerignore` allowlist'i sırlar, ham medya, yerel env ve raporları build bağlamından dışlar.

## Şu an açık kalanlar

Görev 1–11 tamamlandı. Yönetici kimliği, MFA, oturum/rol altyapısı, ortak arayüz, medya, etkinlik/duyuru yayın akışı, bağlantı merkezi ve 2026 derece bağlantıları hazır; UluJam arşivi/2027 yakında ve mini oyunlar hazır; form şeması/koşul motoru/değişmez sürümler hazır; form yönetimi hazır; sonraki adım Görev 12 açık form gönderimi. Sonraki ürün görevleri henüz uygulanmadı. Hukuk, gerçek etkinlik bilgileri, bildirim sağlayıcısı, Wallet hesap/sertifika/cihaz ve canlı hosting kabulü ayrı bağımlılıklardır. Ayrıntılı durum ilerleme raporundadır.

Yönetici girişi `/admin`; ilk kişi kurulumu ve izin matrisi: [Yönetici kimliği](docs/operations/admin-auth.md).

Medya kütüphanesi `/admin/medya`; sınırlar ve yayın/silme davranışı: [Medya işletme rehberi](docs/operations/media.md).

Etkinlik/duyuru panelleri `/admin/etkinlikler` ve `/admin/duyurular`; yayın kuralları, izinler ve form CTA bağımlılığı: [Yayın rehberi](docs/operations/publication.md).

Bağlantı merkezi `/linkler`, yönetim `/admin/linkler`; doğrulanmış adresler, sıralama, zaman penceresi, kopyalama ve QR: [Bağlantı rehberi](docs/operations/links.md).

2026 ilk üç sonuç `/oyunlar`; seed, boş alanlar ve yeni yıl istisnasının sınırı: [Tarihî sonuç rehberi](docs/operations/historical-results.md).

UluJam yılları için `pnpm db:seed:ulujam` 2026 editoryal bağlantılarını ve 2027 tarihsiz taslağını idempotent yükler. [Arşiv ve galeri işletme rehberi](docs/operations/ulujam-archive.md), [Aşama 1 kabulü](docs/operations/phase-1-acceptance.md).

[Form tanımları ve sürümleme sözleşmesi](docs/operations/form-definitions.md). Görev 10 çekirdek motoru sağlar; form yönetimi ve canlı başvuru kabulü sonraki adımlardadır.

[Form yönetim rehberi](docs/operations/form-management.md).
