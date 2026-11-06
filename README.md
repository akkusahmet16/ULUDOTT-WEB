# Uludott Web

Repo: [akkusahmet16/ULUDOTT-WEB](https://github.com/akkusahmet16/ULUDOTT-WEB).

Görev 1–23 ve 25–27 yerel uygulama teslimleri mevcut;28 CI/yük/güvenlik otomasyonu ve29 dağıtım/restore/geliştirici rehberi bu teslimdedir. Apple Görev 24 kullanıcı kararıyla ertelendi. Gerçek ekran okuyucu/dış pentest, Google public/device, hukuk ve canlı VDS/domain kabulü açık. Site şu an yerelde; [son kabul matrisi](docs/operations/final-acceptance.md) açık işleri ve bütün aşamaları gösterir.

## Önce okunacaklar

Her işlem öncesi [uygulama planı](docs/design/2026-10-02-uygulama-plani.md) ve [ilerleme raporu](docs/operations/progress.md) okunur. İş başında yerel web/worker cwd doğrulanıp durdurulur, iş sonunda yeniden başlatılır. Next rehberleri kurulu `node_modules/next/dist/docs/` içinden okunur.

[Mimari](docs/architecture/overview.md) · [ER](docs/architecture/er-diagram.md) · [kararlar](docs/architecture/decision-log.md) · [rota/API](docs/product/routes.md) · [roller](docs/product/roles.md) · [değişiklik rehberi](docs/product/change-guide.md).

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

## Veri ve çalışma

```sh
pnpm db:migrate
pnpm db:seed:2026
# Tarihsiz 2027 taslağı da isteniyorsa: pnpm db:seed:ulujam
pnpm dev
# Ayrı terminal:
pnpm worker
```

Migration 43 public tabloyu boş açar; seed yalnız 3 verilen 2026 URL/ödül ve editoryal ilişkiler, kişi/takım/kart yaratmaz. Admin varsayılan parola yok: [bootstrap](docs/operations/admin-bootstrap.md). Test verileri yalnız izole UUID DB/S3 anahtarlarında; entegrasyon testleri servis yoksa atlanmaz.

## Doğrulama

```sh
pnpm ci:check
pnpm test:integration
pnpm test:load
```

`ci:check`: typegen/ts, lint, migration metadata, birim+gerçek PG/S3 entegrasyon+restore, build, üretim TLS Playwright/axe, production audit ve kaynak/Wallet paket sır taraması. Playwright chromium gerekir: `pnpm exec playwright install chromium`; k6 yük aracı ayrıca kuruludur. CI workflow aynı zincir ve k6'ı çalıştırır, başarısız verify paket işini durdurur; otomatik canlı deploy yok. [Yük](docs/operations/load-report.md), [güvenlik](docs/operations/security-test-report.md), [erişilebilirlik](docs/operations/accessibility-report.md).

### Tema Altın Liste (Faz 1 — İş 1A)
`tests/fixtures/golden-declarations.json` dosyası `1715682f396d1698871c6615766623cacb0d8405` commit'inden üretilmiş sabit altın listedir. `scripts/build-golden-declarations.ts` betiği yalnızca tek seferlik üretim içindir; açık izin ve onay olmadan yeniden üretilmez.

## Yeni Sayfa, Tema ve Dil Ekleme Rehberi (Genişleme Sözleşmesi)

Geliştiriciler sunum katmanını genişletirken v0.1 görsel kilit ve merkezileştirme sözleşmelerini izlemelidir:

### 1. Yeni Sayfa ve Rota Ekleme
1. **Rota Tanımı (`src/config/routes.config.ts`):** `ROUTE_IDS` dizisine yeni rota kimliğini ekleyin. `ROUTES` içine `RouteDefinition` kaydını oluşturun (`id`, `kind: "public-static"`, `path`, `visibility`, `canonical: { strategy: "self", basePath }`, `metadataKey`).
2. **Sözlük Anahtarları (`src/i18n/keys.ts`):** `meta.<sayfa>Title`, `meta.<sayfa>Description` ve arayüz metin anahtarlarını tanımlayın.
3. **Çok Dilli Metinler (`src/i18n/dictionaries/{tr,en}.ts`):** Hem `tr.ts` hem de `en.ts` içine tüm yaprak anahtarları bire bir ekleyin.
4. **Sayfa Bileşeni (`src/app/(public)/<yol>/page.tsx`):**
   ```tsx
   import { PublicShell } from "@/components/layout/public-shell";
   import { getLocale } from "@/i18n/server";
   import { getTranslator } from "@/i18n/translate";
   import { buildMetadata } from "@/seo/build-metadata";

   export async function generateMetadata() {
     return buildMetadata({ routeId: "yeniSayfa", locale: await getLocale() });
   }

   export default async function YeniSayfa() {
     const t = getTranslator(await getLocale());
     return (
       <PublicShell>
         <h1>{t("sayfa.baslik")}</h1>
       </PublicShell>
     );
   }
   ```
5. **Doğrulama:** `pnpm typecheck` ve `vitest run tests/unit/routes-integrity.test.ts tests/unit/no-hardcoded-text.test.ts`.

### 2. Yeni Tema Tokenı veya Profili Ekleme
1. **Tema Kaydı (`src/config/theme.config.ts`):** `THEMES` listesine yeni temanızı (örn. `"terminal"`) ekleyin ve `THEME_REGISTRY` içine tanımlayın.
2. **CSS Token Tanımları (`src/styles/themes.css`):**
   ```css
   [data-theme="yeni-tema"] {
     color-scheme: dark;
     --ink: #...;
     --panel: #...;
     --cream: #...;
     --muted: #...;
   }
   ```
3. **Doğrulama:** `vitest run tests/unit/theme-contrast.test.ts tests/unit/theme-centralization.test.ts`.

### 3. Yeni Dil (Locale) Ekleme
1. **Dil Konfigürasyonu (`src/i18n/config.ts`):** `LOCALES` dizisine dil kodunu (örn. `"de"`) ekleyin.
2. **Sözlük Dosyası (`src/i18n/dictionaries/<dil>.ts`):** `PublicDictionary` arayüzünü uygulayan dosyayı oluşturun.
3. **Çevirmen Bağlantısı (`src/i18n/translate.ts`):** Yeni sözlüğü `dictionaries` nesnesine ekleyin.
4. **Tarih Biçimlendirici (`src/i18n/format.ts`):** `LOCALE_TAGS` içine formatlama etiketini ekleyin (örn. `de: "de-DE"`).
5. **Doğrulama:** `vitest run tests/unit/i18n-parity.test.ts`.

Geliştirme sürecinde faz bazlı küçük commit ve etiketli yerel kabul noktaları önerilir; kullanıcı onayı olmadan push, merge veya canlıya alma işlemi yapılmaz.

## İşletme rehberleri

[Deploy/ortam](docs/operations/deploy.md) · [eşlenmiş yedek/restore](docs/operations/backup-restore.md) · [rollback](docs/operations/rollback.md) · [etkinlik/afiş](docs/operations/events.md) · [form/başvuru/export](docs/operations/forms.md) · [linkler](docs/operations/links.md) · [takımlar](docs/operations/teams.md) · [Wallet](docs/operations/wallet.md) · [veri hakları](docs/operations/data-rights.md) · [VDS değerlendirmesi](docs/operations/vds-assessment.md).

Docker: `docker build --target runtime -t uludott-web:local .` ve `docker build --target worker -t uludott-worker:local .`; her ikisi nonroot, web/worker ayrı süreç. Sırlar runtime env/read-only mount ile, image içine girmez. `.dockerignore`allowlist yerel env, ham Media, log/testdump/anahtarları dışlar. Kaynak varlıklar ve eski Wallet secret klasörü repo dışındadır; içeriği uygulama/test/rapora alınmaz.
