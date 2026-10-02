# Uludott uygulama ilerleme raporu

Plan: `docs/design/2026-10-02-uygulama-plani.md`
Mimari: `docs/design/2026-10-01-mimari-oneri.md`
Başlangıç: 2 Ekim 2026. Kullanıcı planın yürütülmesine izin verdi.

**Güncel durum: Görev 1–10 tamamlandı. Aşama 1 kabul edildi; sıradaki adım Görev 11.** Aşağıdaki önceki açık durumlar çalışma geçmişidir; son kabul kaydı Görev 10 kapanışıdır.

## Çalışma disiplini

Her işlem öncesinde planın ilgili adımı ve bu rapor okunur. Her kutucuk sonunda ilgili dosyalar ve diff yeniden incelenir; doğrulama kanıtı olmadan tamamlandı işaretlenmez. Uygulama bu sohbet içinde yürütülür; implementasyon delege edilmez.

## Ön inceleme

- Uygulama ve Git deposu henüz yok; Görev 1 dosyaları oluşturulacak.
- Mevcut tasarım ve 29 görevli uygulama planı okundu; geçmiş tamamlanmış görev veya rapor bulunmadı.
- Paylaşılan arayüzler: 1 → 2 yapılandırma/komutlar; 2 → 3–24 transaction/şema/audit/outbox; 4 → 6–25 ortak UI; 6 → 10–14 etkinlik/form ilişkisi; 10–12 → 15–16 ortak form ve başvuru kuralları; 16 → 18 → 19 → 22 takım kadrosu onayı/kart uygunluğu; 2 → 21 → 23–24 outbox revision; 8 → 20 tarihî kısmi/yeni tam sonuç ayrımı. Görev 1 yürütmesini engelleyen arayüz çelişkisi bulunmadı.
- Makinedeki Node 26.9.0 LTS değil; proje için desteklenen Node 24 LTS kullanılacak. Sistem Node kurulumu değiştirilmeyecek.
- PATH üzerinde Docker, psql veya postgres bulunmuyor. Gerçek DB/depo ve konteyner kabulü ayrı doğrulanmadan geçti sayılmayacak.
- Wallet secrets içeriği açılmadı. Proje dışına taşınacak; gerçek entegrasyon doğrulaması yapılmayacak.
- Karar: henüz Git deposu olmadığından yeni worktree oluşturulamaz. Planın Görev 1 sırasıyla, sırlar ayrıldıktan sonra bu klasörde geliştirme dalıyla Git başlatılacak. Etkisi: mevcut varlıklar yerinde kalır; main/master üzerinde uygulama yapılmaz.

## Görev 1 — devam ediyor

İlk işlem: sırların güvenli ayrılması ve Git/build ignore kuralları.
Henüz hiçbir görev tamamlanmadı. Test/build kanıtları ilerledikçe aşağıya eklenecek.

### 1.1 Sırların ayrılması

- `Wallet secrets` → `/Users/taklalie60/.uludott-secrets/web-v0.1/Wallet secrets` taşındı; içerik veya dosya adları okunmadı. Koruyucu üst dizinlerin izinleri 0700.
- `.gitignore` sır dosyaları, yerel env, araçlar ve ham medyayı dışlar. `.dockerignore` yalnızca uygulama kaynakları ve gerekli yapılandırmalar için allowlist kullanır.
- `git check-ignore` Wallet klasörü, `.env.local`, `.local` ve ham medya için başarılı. Proje içinde Wallet secrets kalmadığı doğrulandı.
- Git `development/bootstrap` dalında başlatıldı. Henüz commit yok.

### 1.2 Sürüm/araç incelemesi

- Resmî Node kaynakları 24 LTS ve 26 Current gösteriyor: https://nodejs.org/en/about/previous-releases . Proje 24.21.0'a sabitlendi; resmî arşiv SHA256 kontrolünden geçti. Sistem kurulumu değişmedi.
- Next 16.3.8 resmî belge ve npm registry ile doğrulandı: https://nextjs.org/docs/app/getting-started/installation . React 19.3.0, Drizzle 0.45.3, Zod 4.6.5 registry ile doğrulandı.
- İlk kurulum TypeScript 7.0.2 ile strict peer kontrolünde durdu: typescript-eslint destek sınırı `<6.1.0`. TypeScript 6.0.3 desteklenen kararlı sürüm olarak seçildi. ESLint 9.39.5 kullanım dışı uyarısı verdi; desteklenen 10.11.0 seçildi. Peer denetimi kapatılmadı.
- Python 3.9 `tarfile.extractall(filter=...)` parametresini desteklemedi. SHA256 doğrulanmış resmî arşiv sistem `tar` ile açıldı; Node 24.21.0 sürüm kontrolü geçti. Bu geçici araç hatası ürün kodunu etkilemedi.
- pnpm 11.19.0 sabitlendi; `devEngines.runtime` proje komutlarına yerel Node verir: https://pnpm.io/package_json#devenginesruntime . Yeni lockfile doğrulaması bekleniyor.
- ESLint 10 için Next'in toplu `eslint-config-next` paketindeki React/import/a11y eklentileri peer uyumsuz çıktı. Desteklenen TypeScript ESLint 8.71.0 ve resmî Next 16.3.8 eklentisi doğrudan flat config ile kullanıldı. React hooks ve kapsamlı erişilebilirlik kuralları UI görevlerinin testleriyle ayrıca kurulacak; linter tek başına bunları doğrulamıyor.

### 1.3 Yapılandırma kırmızı/yeşil kanıtı

- İlk `pnpm exec vitest run tests/integration/bootstrap.test.ts`: 4/4 beklenen uygulama eksikliğiyle başarısız. Eksik ayar adı, geçerli yerel ayar, üretimde HTTPS zorunluluğu ve bozuk DB URL'sinde sır sızıntısı kontrolleri.
- `pnpm test:integration`: 4/4 geçti. `server-only` test shim'i yalnızca Node Vitest içindir; istemci sınırı gerçek Next build ile ayrıca denetlenecek.
- `.env.local` yokken `pnpm config:check`: beklenen exit 1, yalnızca eksik alan adları gösterildi; değer yazdırılmadı.
- İlk typecheck: native Node TS import'unda `.ts` uzantısı için TS5097; `noEmit` ile uyumlu `allowImportingTsExtensions` eklendi. Son doğrulama bekleniyor.
- Docker/DB/depo tercihi kullanıcıya soruldu; yanıt beklenirken bağımsız uygulama/test kurulumu sürüyor. Görev 2'ye geçilmeyecek.
- Kullanıcı altyapı girdisi verdi: Ubuntu VDS 40 GB disk / yaklaşık 15 GB mevcut kullanım / 4 GB RAM / 2 CPU (2000 MHz); bot boşta %2 RAM/%3 CPU, disk paneli %29. Plan ve mimari bu girdilerle güncellendi. `vds-assessment.md` artı/eksi, disk politikası ve ölçüm sınırlarını içeriyor. Karar: systemd + Linux standalone/ayrı worker + yerel PostgreSQL; medya ve kalıcı yedek dış S3. Bot DB taşınması kapsam dışı; yerel test altyapısı hâlâ yok.
- PostgreSQL gerçek bağlantı denemesi: ECONNREFUSED; yerel MinIO/S3 sağlık adresi erişilemedi. Gerçek boş DB veya S3 kabulü geçti sayılmadı.
- Tamamen bozuk 3 URL için yeni regresyon testleri RED: `Invalid URL` alan adı sözleşmesini bozdu. Kök neden Zod refine içinde korumasız URL constructor çağrısıydı; güvenli protocol parser eklendi. Son GREEN doğrulaması aşağıda izlenecek.
- İlk audit: 0 yüksek/kritik, 1 orta (`GHSA-67mh-4wv8-2f99`), yalnızca Drizzle Kit → eski esbuild geliştirici bağımlılığı. Çalışma alanı override'ı hedefli olarak esbuild 0.25.12'ye güncellendi; Drizzle CLI uyumluluğu ve yeni audit doğrulanacak. Bulgu gizlenmedi veya audit kontrolü kapatılmadı.
- Yerel depo düzeltmesi: MinIO'nun resmî deposu bakım almadığını açıkça bildiriyor (https://github.com/minio/minio); eski Compose imajı hiç çalıştırılmadan çıkarıldı. Yerel S3 için resmî quick-start'taki Garage v2.3.0 single-node/default-bucket akışı, özel RPC secret dosyası ve kalıcı volume yapılandırıldı (https://garagehq.deuxfleurs.fr/documentation/quick-start/). Yeni infrastructure/garage.toml dosyası plan/mimari ile birlikte eklendi. Gerçek konteyner/S3 testi hâlâ bekliyor.

### 1.4 Son doğrulama ve devam noktası

| Kontrol | Sonuç |
|---|---|
| `pnpm install --frozen-lockfile` | Geçti; strict peer denetimi açık |
| `pnpm exec node --version` | v24.21.0; sistem Node'u değiştirilmedi |
| `pnpm test` / `pnpm test:integration` | 7/7 geçti; üç bozuk URL regresyonu RED → GREEN |
| `pnpm typecheck` | Geçti |
| `pnpm lint` | Geçti; 0 lint uyarısı |
| `pnpm test:e2e` | 1/1 Chromium testi geçti; boş sayfada başlık bulunamadığı RED aşaması gözlendi |
| `pnpm build` | Next standalone production build geçti |
| `pnpm audit --json` | 0 kritik/yüksek/orta/düşük bulgu; eski esbuild override'ı uygulandı |
| `pnpm exec drizzle-kit --version` | 0.31.11 CLI açıldı; gerçek migration/generate uyumluluğu Görev 2'de ayrıca test edilir |
| `pnpm config:check` (.env.local yok) | Beklenen exit 1; alan adlarıyla güvenli eksik ayar hatası |
| `pnpm db:migrate` | Beklenen exit 1; Görev 2 migration dosyaları henüz yok, başarı taklidi yapılmadı |
| Kaynak + `.next/static` sınırlı private-key örüntü taraması | 0 bulgu; tam güvenlik denetimi veya pentest değildir |
| `.next/standalone` ve `.next/static` dosya adı taraması | Wallet, env, pem/p12/pfx/key dosyası bulunmadı |
| Gerçek yerel PostgreSQL / S3 | Erişilemiyor; Docker/daemon yok. Kabul bekliyor |
| Compose + Docker runtime build | Dosyalar hazır; gerçek daemon üzerinde henüz çalıştırılmadı |

Playwright alt süreçlerinde çalışma ortamından gelen NO_COLOR/FORCE_COLOR çakışma uyarısı var; ürün/test hatası değildir. Drizzle Kit'in iki esbuild-kit transitif paketi deprecated uyarısı veriyor; güvenlik bulgusu override sonrası kalmadı, upstream güncelleme takibi gerekir. Next dev'in otomatik oluşturduğu AGENTS.md ve CLAUDE.md okundu; framework belgelerine yönlendirmesi korundu. Build'in tsconfig/next-env üretimleri incelendi.

İncelenen dosyalar: .gitignore, .dockerignore, .node-version, .env.example, package.json, pnpm-workspace.yaml, pnpm-lock.yaml importer/override/runtime bilgileri; tsconfig.json, next-env.d.ts, next.config.ts, eslint.config.mjs, vitest.config.ts, playwright.config.ts; compose.yaml, infrastructure/garage.toml, Dockerfile; scripts/check-config.ts ve migrate.mjs; src/app/layout.tsx, page.tsx, src/lib/config/server.ts; tests/helpers/server-only.ts, tests/integration/bootstrap.test.ts ve tests/e2e/bootstrap.spec.ts; README, plan/mimari güncellemeleri ve VDS değerlendirmesi. Lockfile üretilmiş içeriği frozen kurulum ve audit ile doğrulandı.

**Görev 1 bütünü tamamlanmadı.** Sır ayrılması ve sürüm/lockfile adımları kanıtlı işaretlendi. Gerçek PostgreSQL ve Garage kurulumunun test edilmesi, boş DB ile ana sayfa kabulü ve Docker bağlamı/runtime provası açık. Sonraki görev atlanmaz: önce bu altyapı kabulü sağlanır, sonra Görev 2 şema/migration'a geçilir. VDS'ye bağlantı, dağıtım, ücretli kaynak oluşturma veya Discord botunda değişiklik yapılmadı.

Bu turdaki doğrulanmış başlangıç kaynakları küçük bir Git commit'ine alınır; görev kutularının açık olması çalışma kaybı olduğu anlamına gelmez.

## Görev 1 — altyapı kabulü (2 Ekim, ikinci çalışma)

- Kullanıcı eksik kurulumları ve Görev 1 → 2 yürütmesini açıkça yetkilendirdi. Homebrew ile Colima/Docker/Compose/Buildx kuruldu. `uludott` profili 2 CPU, 4 GiB RAM ve 20 GiB üst disk sınırıyla VZ üzerinde açıldı; VDS ve bot değiştirilmedi. Resmî kaynak: https://colima.run/docs/installation/ .
- Yerel `.env.local` ve RPC sırrı rastgele üretildi, mevcut dosyaya yazmama ve 0600 izinleri uygulandı; değerler çıktıya alınmadı. Global Docker config değiştirilmedi; Homebrew `docker-compose` kullanıldı.
- Gerçek altyapı testi ilk çalıştırmada eksik env ile durdu; env oluşturulduktan sonra 2/2 test ECONNREFUSED ile RED oldu. Compose başladıktan sonra 2/2 GREEN: PostgreSQL 17, S3 yaz/oku/sil ve anonim 403. Garage status sağlıklı v2.3.0.
- Ana sayfa browser kabulünden hemen önce PostgreSQL public tablo sayısı 0 doğrulandı; Playwright 1/1 geçti. Başlangıç ekranı henüz DB okumasına ihtiyaç duymaz; bu kanıt yalnızca boş DB ile başlangıç kabulüdür.
- `pnpm test`: 9/9, typecheck ve lint geçti. Docker build/runtime ve son tarama devam ediyor; Görev 1 kapanışı henüz yazılmadı.
- Docker imajı gerçek daemon üzerinde üretildi; runtime `USER node`, yaklaşık 93 MB. İlk anlık HTTP kontrolü startup yarışında ECONNREFUSED verdi; hazır olana kadar sınırlı bekleyen kontrol HTTP 200 ve Uludott metniyle geçti. Geçici web konteyneri kaldırıldı, veri servisleri çalışıyor.
- Build bağlamı yaklaşık 140 kB; runtime dosya adı ve kaynak/test/static private-key/AWS örüntü taraması 0 bulgu. Yerel sırlar Git ignore altında ve 0600. Bu sınırlı kontrol tam güvenlik kabulü değildir. Audit 0 bulgu, frozen install ve diff --check geçti. Değişen test/config/docs/lockfile ve diff incelendi.
- **Task 1: complete.** 9/9 test, 1/1 E2E, typecheck/lint, gerçek PostgreSQL/S3 ve Docker build/runtime kabulü geçti. Önceki açık durumlar yukarıda tarihsel kayıttır; artık Görev 2'ye geçilir. İlk başlangıç commit'i `50531fc`; altyapı kapanışı bu kayıtla commit edilir.

## Görev 2 — devam ediyor

Başlangıç commit'i `3f03eda`. İlgili plan ve mimarinin veri/tutarlılık bölümü yeniden okundu. Şema/client/transaction/audit/outbox dosyaları yoktu. Doğrudan yardımcı dosyalar plana eklendi; migration CLI aynı API'yi kullanmak için TypeScript'e taşınacak.

- İlk 10 gerçek PostgreSQL testi RED: `Görev 2 migration henüz uygulanmadı`. Her suite rastgele adlandırılan ayrı yerel test DB oluşturur; canlı/uzak DB'de çalışmayı reddeder, bitince yalnızca kendi DB'sini kaldırır.
- Kapsam: 40 çekirdek tablo; FK/CHECK/unique/timestamptz/index, seed içermeyen tekrar uygulanabilir migration, iş verisi+audit+outbox atomikliği. Takım kapasite/immutable snapshot gibi ileri domain kuralları ilgili Görev 11/16/18'de ayrıca sıkılaştırılıp test edilir; şema varlığı çalışan ürün akışı iddiası değildir.

### Görev 2 doğrulama ve kapanış

- Temel 10/10 test GREEN. Ek 7 izolasyon/güvenlik testi ilk çalıştırmada 4 RED / 13 GREEN gösterdi: farklı etkinlik game/award ilişkisi, çift aktif üyelik, form/event izolasyonu ve outbox kişi verisi. Bileşik FK, partial unique ve UUID payload allowlist eklendi. Son schema suite 17/17 GREEN.
- Drizzle `0001` SQL'inde parent unique child FK'den sonra üretildi; boş migration testi `42830` ile durdu. SQL incelendi, yalnızca `form_event_identity_unique` kurulumu FK'den önceye taşındı. Aynı gerçek boş DB testleri GREEN. Bu düzenleme üretilmiş SQL'in elle incelenmesinin neden gerekli olduğunu gösterir; snapshot semantiği değişmedi.
- `pnpm db:migrate` ana geliştirme DB'sinde iki defa exit 0; 40 public tablo / toplam 0 iş kaydı. Test fixture'ları yalnızca ayrı geçici DB'de; kalan test DB sayısı 0. Kişi/takım/admin/kart/2026 oyun seed'i yok.
- Son `pnpm test`: **26/26** (7 config + 2 gerçek altyapı + 17 şema); `pnpm test:e2e`: **1/1**. Typecheck, lint ve Next üretim build geçti. `db:check` geçti; `db:generate` “No schema changes” verdi. İlk görev audit 0 bulgu, yeni runtime bağımlılığı eklenmedi.
- Yerel DB/depo sırlarının birebir değerleri kaynak/scripts/tests ve `.next/static` içinde tarandı: 0 eşleşme; değerler çıktıya alınmadı. Önceki private-key dosya/örüntü taraması ve ignore sınırı korundu.
- İnceleme: 7 schema modülü + shared/index, client/transaction/migrate, audit/outbox, Drizzle config, CLI, yerel test DB yardımcısı, iki entegrasyon dosyası, README, plan, ER belge ve her iki migration SQL'i okundu; FK/CHECK/unique/time/index kararları belgeyle karşılaştırıldı. Üretilmiş iki snapshot JSON bütün olarak parse edildi: 40 tablo; son snapshot 53 FK ve 65 CHECK; metadata check/no-drift/gerçek migration ile doğrulandı. Kodlar Prettier 3.6.2 ile biçimlendirildi; formatter runtime bağımlılığı değildir.
- Kod inceleme becerisi kontrol listesiyle ayrı öz-inceleme yapıldı. Kullanıcının planındaki delege etmeme kuralı nedeniyle bağımsız reviewer çalıştırılmadı. Görev 1–2 kapsamında açık kritik/önemli bulgu kalmadı; sonraki domain görevlerinin kabulü bu incelemeye dahil edilmedi ve ER belgesinde açık listelendi. Bu bağımsız güvenlik denetimi değildir.
- **Task 2: complete.** ER/constraint kararları ve kırmızı test, tekrar migration/seed yokluğu, şema/transaction/audit/outbox, gerçek rollback/unique ihlali kabulü sağlandı. Görev 3 başlatılmadı. VDS'ye dağıtım veya botta değişiklik yok.

## Görev 3 — devam ediyor

Başlangıç `f6e8647`; plan, veri/güvenlik mimarisi, mevcut admin/session şeması ve Next'in paketle gelen route/cookie belgeleri okundu. Hedef modül/route/test dosyaları henüz yok. Var olan geliştirme dalı kullanılıyor; implementasyon delege edilmez.

Kararlar: Argon2id (19 MiB / t=2 / p=1), AES-256-GCM ile admin kimliğine bağlı TOTP sırrı, ±1 zaman adımı ve DB'de replay engeli; 5 hatada 15 dakika hesap kilidi; hashlenmiş tek kullanımlık 128-bit kurtarma kodları. Oturum token'ı 32 byte, DB'de SHA256; 30 dakika idle / 8 saat mutlak süre; yenilemede eski token iptal. Secure/HttpOnly/SameSite=Strict ve __Host- çerezleri. Mutasyonlarda APP_URL Origin + imzalı, süreli ve oturuma bağlı double-submit CSRF. İlk admin CLI'de TOTP doğrulanmadan kaydedilmez; gerçek admin/test kişi seed edilmez. Kaynaklar: https://github.com/hectorm/otpauth ve https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html .

- İlk 8 kimlik/yetki/CSRF testi eksik servislerle 8 RED → 8 GREEN. Oturum/MFA yaşam döngüsü ek testleri başarı yolunu geçici kapatan mutation ile 6 RED / 9 GREEN → 15 GREEN; bu ikinci setin kanıtı mutation kontrolüdür. Bootstrap MFA testi stub ile 1 RED / 15 GREEN → 16 GREEN. E2E admin akışları route/UI yokken 2 RED → 2 GREEN (başlangıç E2E ile toplam 3).
- Ek API/rol uç testleri: 1 RED / 20 GREEN; JavaScript nesne prototipi isimlerinde izin listesi lookup'ı TypeError üretiyordu. Own-property kontrolü eklendi, 21/21 GREEN. Boyut/type sınırı, genel hata/sır içermeyen yanıt, güvenli cookie, süresi dolan kilidin açılması ve paylaşılan rate-limit doğrulandı.
- Yerel AUTH anahtarı rastgele üretildi; yalnız ignore altındaki .env.local dosyasına yazıldı, değeri çıktılanmadı. Native Argon2 enum ambient const-enum izolasyon hatası paket tipinden doğrulanarak sayısal Argon2id değeriyle giderildi; şifreleme istemciye taşınmadı.
- İlk E2E testleri geçti fakat Playwright varsayılan zorla kapatma ayrı Next süreç grubunu ve test DB'sini açık bıraktı. Süreç ağacıyla kök neden doğrulandı; sadece o grubun süreçleri ve e-posta fixture'ı doğrulanan ayrı test DB'si temizlendi. gracefulShutdown SIGTERM eklendi; temiz kapanış yeniden doğrulanıyor.
- Kurulum CLI'si ve işletme yönergesi hazır. Gerçek admin oluşturulmadı; test fixture'ları ayrı DB'de. Son tam test/build, migration, sır taraması ve dosya/diff incelemesi henüz kapanmadı.


### Görev 3 doğrulama ve kapanış

- Config CLI eksik AUTH anahtarını henüz kontrol etmiyordu: ek test 1 RED / 21 GREEN. `authKey()` denetimi komuta eklendi; son admin suite 22/22 GREEN. Hata yalnız alan adını gösterir; gizli değer verilmez.
- Son `pnpm test`: **48/48** (7 config + 2 gerçek altyapı + 17 şema + 22 admin). `pnpm test:e2e`: **3/3**, exit 0; graceful shutdown sonrası kalan test DB sayısı **0**. Typecheck, lint ve Next standalone production build geçti. Yönetim sayfası ve tüm auth route'ları dinamik olarak derlendi.
- `pnpm db:migrate` iki kez exit 0, `db:check` geçti, `db:generate` değişiklik yok. Ana DB **40 public tablo / 0 iş kaydı**; gerçek admin veya etkinlik seed'i yok. Yeni migration SQL'i ve snapshot/journal incelendi; snapshot 40 tablo, admin/session alanları şemayla tutarlı.
- Frozen install ve audit geçti: **0 güvenlik bulgusu**. Yerel DB/S3/AUTH değerleri kaynak, scripts, tests ve `.next/static` içinde birebir tarandı: 65 dosya / **0 eşleşme**. `.env.local` 0600 ve Git ignore altında. Bu tarama tam güvenlik denetimi değildir.
- Dosya incelemesi: auth config/crypto/CSRF/session; admin izin matrisi, repository, giriş ve bootstrap servisleri, HTTP sınırı, client form; admin page/layout ve beş API route; CLI/config checker, E2E launcher/Playwright, iki test dosyası; admin schema/migration metadata; env örneği, Next headers, package/lockfile, README ve işletme belgesi. Prettier 3.6.2 uygulanıp diff --check geçti. Next'in ürettiği next-env route type yolları build sonrasında incelendi.
- Kod inceleme becerisinin kontrol listesiyle öz-inceleme yapıldı; planın delege etmeme kuralı nedeniyle bağımsız reviewer kullanılmadı. Görev 3 kabulünü engelleyen kritik/önemli bulgu kalmadı. İleriki endpoint'lerin izin kontrolü, edge trafik koruması, kayıt temizliği, yönetici sıfırlama işlemleri ve üretim kapasite/HTTPS kabulü ileriki görevlerdedir; bu kayıt bağımsız pentest iddiası değildir.
- **Task 3: complete.** Argon2id + kişisel TOTP, tek kullanımlık recovery, kilitlenme, hash'li ve dönen oturumlar, CSRF, event kapsamı ve CLI MFA kurulumu kanıtlandı. Planın üç kutusu kanıtlarla kapatıldı. Çalışma bu görev commit'iyle kaydedilir; Görev 4 başlatılmadı. VDS'ye dağıtım veya Discord botunda değişiklik yok.

## Görev 4 — devam ediyor

Başlangıç ce17080. Onaylı tasarım/plan geçerli; yeni tasarım onayı istenmez. Ruling: doğrulanmış içerik/URL yokken yalnız mevcut dört genel rota menüde; sonraki görev rotalarına kırık bağlantı açılmaz. Sistem fontları dış ağ/font isteği olmadan kullanılır. Gerçek beyaz logo SVG varyantı antrasit zemin için seçildi. Telefon/tablet/masaüstü, klavye ve axe testleri önce yazılıyor.

- İlk gezinme testleri 4 RED / 8 GREEN (eksik menü/CTA). Axe testlerine HTTP 200 şartı eklendi; 404 sayfasının axe geçmesi kabul sayılmaz. JSX kapanış yazımı typecheck'te yakalandı ve düzeltildi; yanlışlıkla eşzamanlı başlatılan E2E EADDRINUSE verdi, çalıştırmalar sıraya alındı. Ürün düzeltmesi sonrası 12/12 E2E ve 48/48 entegrasyon, typecheck/lint/build geçti.
- 390/768/1440 görüntüleri incelendi; ortak .button kuralı masaüstü .menu-toggle gizlemesini eziyordu ve admin body>main kuralı genel sayfayı daraltıyordu. CSS kapsamı/specificity düzeltmesi ve masaüstü gizli menü regresyonu ekleniyor.
- Masaüstü gizli menü regresyonu 2 RED → GREEN; son E2E 12/12 (5 axe, 4 gezinme, 3 önceki akış). 390/768/1440 ekranları tekrar gözle incelendi: taşma/çakışma yok, menü yalnız mobilde. 48/48 test, typecheck, lint ve üretim build geçti. CSS/token, 5 ortak bileşen, 3 kabuk bileşeni, root/home ve 3 genel sayfa; SVG gerçek paketle birebir, testler/Playwright/package diff'i incelendi. `git diff --check` temiz. Task 4: complete. Doğrulanmamış fotoğraf/tarih/URL eklenmedi.

## Görev 5 — devam ediyor

Başlangıç 3e2388f. Plan/medya şeması/güvenlik mimarisi tekrar okundu. Ruling: S3 bucket tüm nesnelerde özel kalır; yayınlanan türev /media/<variant UUID> üzerinden DB yayın kontrolüyle sunulur. Orijinal için public route/presigned URL yok. 8 MiB, 25 MP, tek kare, uzun kenar 1600; Node worker 20 saniye timeout, Sharp tek thread/cache kapalı ve PostgreSQL tek işleme kilidi VDS bütçesini sınırlar. Harici worker kuyruğu Görev 21'de; bu görevde yetkili küçük medya yüklemesi sınırlı senkron HTTP akışıdır.

Ruling: publishVariant ve attachMedia mutasyonları zorunlu Actor alacak; plana yazılan iki parametreli imza yetkiyi taşımadığından genişletilir. Desteklenen içerik FK'leri announcement/game/featured_slot; etkinlik/editör yetkisi kontrol edilir. Şema publication alanı varyantta zaten var, migration gerekmez. Alt metin zorunlu. Sahipliği bilinmeyen iki HEIC yalnız yerel decode/yön kabulünde kullanılacak; DB/S3/siteye yüklenmez. Sharp 0.35.5 ve libheif-js 1.23.2 sürümleri sabitlendi; S3 SDK runtime'a taşındı. @types/libheif-js registry'de yok (404); decoder izole worker içinde JS API ile kullanılacak, uygulama sınırı TypeScript tipli.
Kaynaklar: https://sharp.pixelplumbing.com/api-constructor/ , https://sharp.pixelplumbing.com/api-output/ , https://github.com/catdad-experiments/libheif-js .

Ruling: gerçek IMG_0427 5712×4284 (24.47 MP), IMG_1206 4032×2268; bu nedenle piksel sınırı 25 MP, bomba testi 30 MP. Yön beklentisi tahminden değil sips/HEIF display geometri kontrolünden alınır.
- İlk medya suite 6 RED / 1 GREEN → 7 GREEN; ek kapsam/silme/anonim erişim/rollback kontrolleriyle tam suite 58/58. İlk medya E2E route yokken 2 RED. HTTP/UI eklendikten sonra Node worker yollarının Turbopack tarafından runtime dışı kimliklere çevrildiği derlenmiş chunk ile doğrulandı; bound Node resolver + explicit tracing uygulanıyor. Geçici hata teşhisi yalnız hata adı/code yazdı, girdi/env değerleri yazılmadı; teşhis kodu kapanışta çıkarılır.
- Git'in macOS ignore-case ayarı köksüz Media/ örüntüsünü src/modules/media ve API medya klasörlerine de uyguluyordu; .gitignore /Media/ ve /Uludott Logo Pack/ olarak kökle sabitlendi. Ham medya hâlâ dışarıda; ürün kodu artık takip/formatter kapsamında. Test nesnelerine DB cleanup öncesi S3 cleanup eklendi.


## Görev 5 kapanışı — 2 Ekim 2026

- Özel S3 orijinal, UUID anahtarları, worker içinde doğrulanmış WebP/AVIF/JPEG türevleri, metadata temizliği, yön düzeltmesi, alt metin, yetkili özel önizleme, ayrı yayın onayı, içerik kapsamına göre attach ve silme etkisi tamamlandı. Yayın/silme/attach audit ve silmede outbox kaydı vardır. 8 MiB / 25 MP / tek kare / 20 saniye ve DB genel seri işleme sınırları uygulanır.
- Sharp 0.35.5, libheif-js 1.23.2 kuruldu; S3 SDK runtime bağımlılığına taşındı. Worker için bound runtime resolver kullanıldı. Geniş pnpm native tracing örüntüsü symlink dizininde build panic üretti; dosya uzantılarıyla daraltılarak üretim build'i başarıyla tamamlandı. Geçici hata teşhis kodu kaldırıldı. UI testi strict locator/diyalog kaldırılma beklentisi düzeltildi; ürün davranışı tekrar doğrulandı.
- Son doğrulama: Vitest **59/59** (5 dosya, gerçek PostgreSQL/S3; 11 medya testi), dev Playwright **14/14**, üretim standalone Playwright **14/14**. Üretim paketi depo dışındaki geçici dizine kopyalandı; uygulama ve S3 yerel TLS geçitleri, bir günlük yerel test CA'sı ile çalıştırıldı. NODE_ENV=production HTTPS kuralları korunarak upload/preview/publish/delete, MFA/oturum, responsive gezinme ve axe kontrolleri geçti. Test CA/anahtarı geçici dizinle temizlenir; canlı sertifika değildir.
- TypeScript, lint, build, migration metadata kontrolü ve git diff whitespace kontrolü geçti. pnpm audit: tüm önem seviyelerinde 0. Mobil medya ekranı .local/task5-mobile.png ile görsel olarak incelendi. Güncel src/scripts/tests ve tarayıcı çıktısında gerçek yerel sır eşleşmesi 0; standalone paketinde env/anahtar/HEIC dosyası 0; .env.local 0600.
- Temizlik kabulü: ana DB'de 40 public tablo, tüm ürün tablolarında toplam 0 satır; kalan geçici test DB'si 0; originals/variants prefix'lerinde nesne 0. İlk temizlik sorgusundaki varsayımsal participants tablo adı hatası, şemadan tablo envanteri okuyarak düzeltildi. Önceki 4 sentetik fixture nesnesi yalnız byte eşleşmesiyle kaldırıldı; testler artık DB/S3 temizliği yapar.
- İki gerçek HEIC yalnız bellek içi yerel dönüşüm testine girdi; aidiyet doğrulanmadığı için S3/DB/2026/public'e aktarılmadı. Dosyalar, izinler, HTTP sınırları, eşzamanlı kilitler, worker ve UI diff'i incelendi. Görev 4 ayrı commit 3e2388f ile kapandı; Görev 5 ayrı commit ile kapatılıyor. VDS'ye dağıtım yapılmadı; sonraki görev başlatılmadı.
- İşletme sınırları docs/operations/media.md içinde: S3 silme retry worker'ı Görev 21, özel orphan uzlaştırma ve VDS tepe bellek ölçümü dağıtım/operasyon kabulünde tamamlanacak. Bu bağımlılıklar mevcut görev kapsamını genişletmez.


## Görev 6 — devam ediyor

Başlangıç e06faad. Plan ve mimari onaylı; mevcut development/bootstrap dalı kullanılır, implementasyon delege edilmez. Etkinlik/duyuru durum, zaman penceresi, revision, scope, medya ve slug testleri önce yazılacak.
Ruling: Şemada etkinlik afiş/form/kısa metin/organizer, duyuru SEO/CTA ve eski slug kaydı eksik. Tipli alanlar ve tek redirect tablosu migration ile eklenecek; döngüsel form ilişkisi servis içinde aynı etkinlik FK doğrulamasıyla korunacak. Önceki 40 tablo kabulü tarihîdir, yeni toplam 41 olacaktır. Silme arşivleme olarak uygulanır; başvuru/FK/audit geçmişi kaybolmaz. Coffee Talk gerçek bilgi olmadan yalnız adminin oluşturduğu taslak kalır, otomatik seed yapılmaz. Form rotası Görev 14'te geleceğinden bu görevde form bağlantısı saklanır fakat başvuru CTA'sı sunulmaz. Planlı yayın worker beklemeden her public okumada UTC zaman penceresiyle değerlendirilir. Geçmiş/iptal içerik listede durumuyla görünebilir, ana sayfada yaklaşan olarak öne çıkarılmaz. İçerik yöneticisi yalnız atanmış etkinlikte yazabilir; genel oluşturma content_editor izni ister.

- İlk servis yüklemesinde import eksikliği görüldü; stub sözleşmeleriyle 6 davranış testi RED oldu. Servis sonrası 5/6 geçti; yayınlı içeriği kaydederken boş publishAt görünürlüğü kaldırıyordu. Yayın zamanını koruyan düzeltmeyle 6/6 geçti. İlk UI/API E2E üçü RED (rotalar eksik), UI sonrası 1/3 geçti. Dev HTTP Playwright APIRequest secure cookie göndermediği için testin browser-context cookie aktarımı düzeltiliyor; üretim çerez kuralları değiştirilmiyor.

- Scope/form FK/CTA için üç ek RED → 9/9 GREEN. Form composite FK migration 0004 ile DB'de farklı etkinlik bağlantısını engeller; döngüsel şema TypeScript çıkarımı AnyPgColumn callback anotasyonuyla çözüldü. Genel listeyi son 100 taslağın gizlemesi ve hasarlı afişin arşivlemeyi engellemesi incelemede bulundu; iki RED regresyon testiyle düzeltilecek. Tam tarayıcı suite 16/17; medya testinin “işleme meşgul” (429) yanıtı, iki sentetik upload fixture'ın seri decoder kilidini aynı anda istemesinden. Fixture testleri yalnız 429 için sınırlı yeniden deneme yapar; sunucu sınırı korunur.

- Son iki inceleme regresyonu RED → 11/11 GREEN; tam suite 70/70. Fixture retry yardımcı fonksiyonunda eksik async TypeScript tarafından yakalandı ve düzeltildi; dev E2E 17/17, ilk production build geçti. Teknik UUID metin alanları kategori ve aynı etkinliğin formunu adlarıyla seçen seçeneklere çevriliyor; seçeneklerin etkinlik kapsamı için bir RED test eklendi.

- Düzenleyici seçenekleri RED → 12/12 GREEN, tam suite 71/71; dev ve izole standalone HTTPS E2E 19/19 (7 genel axe + önceki akışlar + yayın/özel önizleme/afiş/İstanbul/XSS/308/arşiv akışı). Son yetki incelemesinde atanmış duyurunun eventId=null ile kapsam dışına taşınması için RED test eklendi; hedef kapsam artık null olduğunda da genel publication.write izni denetlenir.


## Görev 6 kapanışı — 2 Ekim 2026

- Etkinlik/duyuru oluşturma, okuma, sürümlü düzenleme, onaylı yayın/zamanlama, taslağa alma, iptal/bitti ve soft arşivleme tamamlandı. Görev 6 paylaşılmış servisleri aynı yayın çekirdeğini kullanır; yetki, medya kilidi, revision, slug geçmişi ve audit transaction içinde korunur. Event manager atanmış etkinlikte ve bağlı duyuruda yazabilir; genel duyuruya ayırma dahil hedef kapsam tekrar kontrol edilir. Son kapsam testi RED → GREEN, toplam **72/72** Vitest (6 dosya; 13 yayın entegrasyon testi).
- Genel liste/slug detayları, yayın penceresi, 308 eski adres yönlendirmesi, afiş/alt metin, İstanbul saat gösterimi, kategori/form seçenekleri, CTA hedef görünürlüğü, düz metin güvenliği ve canonical/OG/Twitter alanları tamamlandı. Ana sayfa sırası 0 birincil, diğerleri kart; geçmiş/başlamış/iptal etkinlik yaklaşan listesinde kalmaz. Coffee Talk gerçek tarih/konum olmadan yayımlanamaz; otomatik gerçek içerik seed edilmedi. Form bağlı olsa da başvuru CTA'sı Görev 14 kabulüne kadar gösterilmez.
- Dev Playwright **19/19**, son izole standalone/HTTPS Playwright **19/19**. Yedi genel sayfa axe, yayın ayrıntısı ve admin önizlemesi axe; özel önizlemenin gerçek afiş decode'u, 390/768/1440 taşma, İstanbul zamanı, XSS metni, yayın/slug/arşiv, önceki MFA ve medya akışları birlikte geçti. .local/task6-event-mobile.png, task6-event-desktop.png ve task6-editor-mobile.png gözle incelendi: taşma/çakışma yok. Görüntüler yalnız sentetik fixture içerir.
- Son typecheck/lint/build geçti. Migration 0003/0004 incelendi ve yerel ana DB'ye uygulandı; db:check başarılı, son db:generate “No schema changes”. Yeni toplam **41 public tablo**; ana ürün tabloları toplam 0 satır, kalan geçici test DB'si 0, özel originals/variants nesnesi 0. Fixture cleanup gerçek kullanıcı dosyalarına dokunmadı.
- Güncel src/scripts/tests/tarayıcı çıktısında yerel sır eşleşmesi 0; standalone'da env/PEM/key/HEIC dosyası 0, .env.local 0600. Build next-env.d.ts çıktısını önceki kanonik hâline getirdi; gereksiz generated diff kalmadı. Tüm görev dosyaları, iki migration ve metadata, ortak domain/repository/service/HTTP/UI, genel/admin rotalar, schema/permission/media reference ve test diff'leri incelendi; git diff --check temiz.
- Yayın/medya/admin/DB/README rehberleri güncellendi. Yeni paket gerekmedi; mevcut bağımlılıklar kullanıldı. VDS dağıtımı veya push yapılmadı; Görev 7 başlatılmadı. Tek commit ile Görev 6 kapanışı kaydedilir. Büyük envanter için pagination, form yayın/başvuru ve gerçek işletme girdileri ilgili sonraki görevlerdedir.


## Görev 7 — devam ediyor

Başlangıç c26b40b. Plan, rapor ve bağlantı mimarisi okundu. Var olan development/bootstrap dalında inline yürütülür; implementasyon delege edilmez. Genel hesap/tıklama izlemesi veya sosyal URL seed yok.
Ruling: Şemada link/group revision ve dış URL doğrulama zamanı eksik; migration ile eklenir. Kategori ve kategori içi sıra unique olur; reorder transaction içinde geçici boş sıra aralığı kullanır. saveLink güncellemede id/expectedRevision, reorderLinks üçüncü parametrede tam revision snapshot ister; eski ekran sessizce yeni sırayı ezmez. Public kısa adres /l/<UUID> ve PNG QR endpoint'i her okumada yayın/zaman/URL kontrolü yapar; keyfi URL veya Host başlığından QR/redirect üretmez. Site içi yalnız mevcut genel rotalar ve görünür etkinlik/duyuru detayları kabul edilir; /l yönlendirme döngüsü, admin/API/form kapalı rotalar reddedilir. Kopyalama başarısızsa seçilebilir adres gösterilir. QR qrcode sunucuda üretilir, jsQR testte bağımsız decode eder. Kayıtlar/kategoriler ilk aşamada 200/50 ile sınırlıdır; daha büyük envanter pagination işi gerektirir. İşaretlenmiş dış URL yayınında editör doğrulama onayı gerekir, sunucu dış hedefe HTTP isteği yapmaz.
Kaynaklar: https://github.com/soldair/node-qrcode , https://github.com/cozmo/jsQR . Registry sürümleri qrcode 1.5.4, @types/qrcode 1.5.6, jsqr 1.4.0 doğrulandı.

### 7.1 Servis ve tarayıcı kabulü — yürütülüyor

- Altı yeni entegrasyon testi önce stub servislerle RED, gerçek servislerle GREEN oldu. İlk hedef görünürlüğü fixture'ı SQL now() ile uygulama saati arasında sınırda kaldı; testin yayın zamanı sabit geçmiş UTC anına çekildi. Bu tanı tek başına saat kayması kanıtı değildir.
- İlk iki E2E testi eksik rotalarda RED; ekran/API sonrası iki test GREEN. Gerçek clipboard, başarısız clipboard yedeği, QR PNG decode, gizlemede kısa adres/QR 404, mobil/masaüstü taşma ve klavye odak dönüşü doğrulandı. QR penceresi açılmadan ağ isteği olmadığı kontrol edildi.
- Lint ham img uyarısını max-warnings=0 nedeniyle reddetti; QR Image unoptimized ile mevcut PNG endpoint'inden, lazy olarak gösteriliyor. ESLint ve typecheck geçti; tam Vitest 78/78 geçti.
- Dosya incelemesinde gizlenen seçili kaydın editör formunda eski yayın/revision kalabildiği görüldü. Ek E2E assert RED oldu (Yayımla işaretli kaldı). Gizleme sonucu seçili formu güncelliyor; Listeyi yenile seçimi temizliyor. Tam tarayıcı ve üretim kontrolleri sürüyor.

### 7.2 Son doğrulama ve kapanış — tamamlandı

- `pnpm install --frozen-lockfile`: geçti. `pnpm audit`: bilinen açık yok. QR/runtime ve test bağımlılıkları sabit sürümlüdür.
- `pnpm db:check`: geçti. `pnpm db:generate`: 41 tablo, değişiklik yok. İncelenen 0005 migration gerçek geliştirme PostgreSQL'inde iki kez başarıyla çalıştırıldı; ikinci koşu veri eklemedi.
- Son `pnpm typecheck`, `pnpm lint`, `git diff --check`: geçti. `pnpm test`: 7 dosya, 78/78 test. Geçersiz tarih aralığı, başlangıçsız bitiş ve bozuk tarih girdisi de reddedildi.
- Tam `pnpm test:e2e`: 22/22 (22.2 sn); son standalone build üzerinden `ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e`: 22/22 (11.3 sn). Sekiz genel rota axe kontrolü ve bağlantı akışındaki dolu ekran axe kontrolü ihlalsizdir. Seçili kaydı gizleyince formun yayın durumu güncellenmesi regression testi GREEN.
- `pnpm build`: başarılı; /linkler, /admin/linkler, yönetim API, QR ve kısa yönlendirme rotaları dinamik. 390px mobil ve 1440px masaüstü ekran görüntüleri görsel olarak incelendi; taşma yok. Kopyalama yedeği seçilebilir, QR Escape sonrası odağı geri verir.
- Kaynak, script, test, tarayıcı bundle ve standalone içindeki 1915 dosya yerel sır değerleriyle tarandı: 0 eşleşme. Standalone içinde env/PEM/key/HEIC özel dosyası: 0. Sırlar çıktıya yazılmadı.
- Son cleanup: 41 public tablo, 0 ürün satırı, 0 geçici test DB, 0 S3 medya nesnesi. Gerçek sosyal adres veya ürün seed'i eklenmedi.
- Şema/migration, domain/service/repository/HTTP/QR, public/admin ekranları, header/admin menüsü/CSS, helper ve testler dosya bazında incelendi. İşletme rehberi, DB kararları, izin rehberi, README ve plan güncellendi. Görev 7'nin üç kutucuğu kanıtla tamamlandı.
- Görev 8 başlatılmadı. VDS dağıtımı, canlı veri/alan adı, QR baskı boyutuna göre kullanım kabulü ve sonraki ürün görevleri kapsam dışındaki bağımlılıklar olarak duruyor; uygulama bütünü üretime hazır değildir.

## Görev 8 — devam ediyor

Başlangıç ba24d2b. Plan, rapor ve 2026 mimari kaydı okundu; inline development/bootstrap dalında ilerlenir.
Ruling: Mevcut games.historical_partial/published_at ve awards/event_years şeması yeterlidir; migration gerekmez. Yalnız verilen 2026 UluJam 1/2/3 URL envanteri kısmi istisnadan yararlanır; yıl/etkinlik kimliği/oyun kimliği/derece/URL yeniden doğrulanır. Başlık, takım, credits, görsel ve açıklama boş kalır; dış sayfa başlığı veya hesap adı içeri alınmaz. Tam sonuç yayını Görev 20'ye aittir. Tarihi/konumu bilinmeyen etkinlik kabuğu draft ve tarihleri NULL kalır; oyunların published_at değeri seed'in gerçek yayın anıdır. Genel etkinlik sayfası bu nedenle açılmaz. Seed ayrı açık CLI komutudur, migration ve sayfa okuması seed çalıştırmaz. Transaction+advisory lock ve sabit kimlikler tekrar/yarışta çift kayıt oluşturmaz; çelişen kayıt varsa sessizce ezmek yerine rollback olur. Gizlenmiş veya sonradan düzenlenmiş alanlar tekrar seed ile eski değere döndürülmez. Seed test DB'sinde ve ardından yerel geliştirme DB'sinde editoryal içerik olarak uygulanır; kişi/takım/kart oluşturmaz. Yanlışsa etkisi bu modülün editoryal başlangıç içeriğini yeniden değerlendirmektir.

### 8.1 İlk kabul kanıtları

Altı PostgreSQL entegrasyon testi stub seed/okuma servislerinde RED (boş liste ve çakışma reddinin eksikliği), uygulama sonrası GREEN oldu. Kısmi bayrakla 2027 eksik sonuç saklanabilse de public tarihî okuyucu bunu göstermiyor; yeni tam sonuç yayın servisi Görev 20'de ayrıca doğrulanacak. Yeni /oyunlar E2E önce 404 RED, rota/kart sonrası GREEN oldu. Tam Vitest 84/84 ve dev Playwright 24/24 geçti; yeni yıl istisnası, seed tekrarı/yarışı, rollback, gizlemenin korunması, boş kişi/takım/kart tabloları ve mobil/Tab/dış link/axe doğrulandı.

Araç notu: projede prettier binary'si yoktu; pnpm exec formatter çalışmadı, ürün/test çalışması etkilenmedi. Registry sürümü 3.9.9 doğrulanıp pnpm dlx prettier@3.9.9 ile yalnız yeni dosyalar biçimlendirildi; ürün bağımlılığı eklenmedi. Web erişim probunda üçüncü itch.io sayfası okunabildi, ilk iki adres araçtan açılamadı; bu hedeflerin kapalı olduğuna dair kanıt değildir. URL/derece kaynağı kullanıcının mimari kaydıdır; dış sayfa adı/kişi/görsel/veri içeri alınmadı. Bugünkü üçünün de erişilebilir olduğu iddia edilmez.

### 8.2 Son doğrulama ve kapanış — tamamlandı

- Son `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` ve `pnpm build` başarılı. Ürün bağımlılığı veya lockfile değişimi yok. db:check geçti; db:generate 41 tablo ve “No schema changes” döndürdü. Yeni migration yok.
- Tam Vitest 8 dosyada **84/84**; dev Playwright **24/24** (25.7 sn); son standalone/HTTPS Playwright **24/24** (12.6 sn). Dokuz genel rota axe ve dolu sonuç ekranı axe ihlalsiz. 390/768/1440 gezinme/taşma kontrolleri geçti. Son 390px ve 1440px sonuç ekranları görsel olarak incelendi; derece sırası ve kart düzeni doğru. Testte main odağı nedeniyle görülen çerçeve klavye odak stilidir.
- `pnpm db:seed:2026` yerel ana geliştirme DB'sinde iki kez başarılı: yalnız 1 draft etkinlik + 1 yıl ilişkisi + 3 NULL alanlı kısmi oyun + 3 derece, toplam **8 editoryal satır**. Kişisel veri tabloları boş: applications/teams/game_credits/cards 0; test kabulünde submissions/memberships/wallet_passes/finalists de 0. Genel event ayrıntısı gerçek tarih olmadan yayımlanmadı.
- Son cleanup **41 public tablo, 0 test DB, 0 S3 medya nesnesi**. Başlangıç ürün tablolarının boş olması kuralı, izinli üç 2026 editoryal sonuç dışındaki kayıtlar için sürer; test fixture'ları ana DB'ye yazılmadı.
- Src/scripts/tests/tarayıcı/standalone içindeki 1936 dosyada yerel sır eşleşmesi **0**; standalone env/PEM/key/HEIC özel dosyası **0**. Git diff whitespace kontrolü temiz. Sır içerikleri çıktıya yazılmadı.
- Domain, seed/CLI, repository/service, kart/rota, header/iç yol entegrasyonu, helper/testler ve rehberler dosya bazında incelendi. Planın üç kutucuğu kanıtla kapatıldı. Görev 9 başlatılmadı; VDS'ye deployment/push yapılmadı. Tam oyun yönetimi/yayın/rıza ve sonraki ürün görevleri kendi aşamalarında tamamlanacak.

## Görev 9 — devam ediyor

Başlangıç 8084cbc. Inline mevcut development/bootstrap dalı kullanılır; Görev 9 kapanmadan Görev 10 başlamaz.
Ruling: 2027 seed edilmez; yıl ilişkili yayımlı gerçek başlangıç varsa sayaç çalışır, kayıt/tarih geri çekilince Yakında olur. Başvuru/form kabulü Görev 14'e kadar CTA yoktur. Galeri için event_gallery ilişki tablosu (medya, konum, editörün doğrulama anı, revision) ve küçük yönetim ekranı eklenir; yalnız doğru UluJam 2026 ilişkisi ve yayımlanmış güvenli türev gösterilir. Media delete reference kontrolü yeni ilişkiyi kapsar. Bilinmeyen HEIC veya başka etkinlik fotoğrafı otomatik atanmaz. Finalist slotu derece kartlarından ayrıdır; veri/yayın yönetimi Görev 20’ye aittir, tam oyun/rıza yayın kontrolü Görev 20'ye kadar doğrulanmamış finalist yayımlanmaz. Mini oyunlar yalnız yerel state taşır; kimlik, ağ, puan kaydı yoktur. Yıldız 5 yakalamada biter; hafıza 3 çift içerir. Hareket tercihi CSS ile korunur. Aşama 1 kontrol kapısı aynı kapanışta kanıtlanır.

### 9.1 Arayüz incelemesi ve taslak yıl kararı

Sayaç/mini oyunlarda 5 RED + 2 temel durum PASS sonrasında 7 GREEN; galeri/yıl erişiminde üç PostgreSQL RED → GREEN. 2027 tarih/kayıt geri çekilmesi, özel/ilişkisiz medya ve yetki kontrolü geçti. E2E iki RED → iki GREEN oldu. Medya API GET cevabının {items} zarfı galeri editöründe liste gibi işleniyordu; ek yönetim E2E RED bunu yakaladı. Zarfın items alanı okunarak düzeltildi.

Ruling güncellemesi: 2027 yıl ilişkisi mevcut değilse yönetici sıradan etkinlik ekranından gerçek tarihi sayaçla ilişkilendiremiyor. Bu yüzden ayrı açık db:seed:ulujam komutu, 2026 sonuçları yanında yalnız başlığı/yılı bilinen UluJam 2027 draft kabuğunu ekler. Tarih/konum/publish_at NULL kalır; örnek tarih veya başvuru kaydı yoktur. Sonradan gerçek tarih ve konum mevcut etkinlik panelinden yayımlanınca sayaç açılır. İlk “2027 seed edilmez” kararı bu işletme gereksinimi nedeniyle revize edildi. Yeni taslak-yıl testinde önce RED görüldü. Main editoryal satır beklentisi 8'den 10'a, tablo sayısı galeri ile 42'ye çıkar. Finalist alanı bu aşamada boş slot olarak durur; tam yayın/rıza akışı Görev 20'dir.

Tam kontrol ilk koşuda 94/95 Vitest, 22/27 E2E döndürdü. Şema kabulünün tablo allowlist'ine event_gallery eklendi; schema testi kısıtları gevşetilmedi. Üç gezinme testi önceki kapalı başvuru cümlesinin noktasını bekliyordu; ürün metni “Başvurular henüz açılmadı.” olarak korundu. Galeri select'i snapshot'ta mevcut olsa da implicit label text'i option metinlerini içeriyordu; test açık accessible combobox adıyla seçim yapıyor. Coffee Talk akışı 30 sn üst sınırına yeni eşzamanlı derlemeler altında ulaştı; timeout artırılmadan E2E worker sayısı 2 CPU profiliyle eşleştirilip 2'ye sınırlandı. Bunlar rapora adlarıyla yazıldı; tam testler yeniden çalıştırılır.


### Görev 9 kapanış ve Aşama 1 kabulü

İncelenen değişiklikler: UluJam SSR sayfası, tarih/sayaç durumları, arşiv/finalist boş slotları, iki yerel mini oyun, doğrulanmış galeri şeması/0006 migration ve metadata, galeri servis/API/panel, medya referans koruması, ortak sınırlı JSON okuyucu, açık 2027 tarihsiz seed ve komutu, E2E launcher/2 worker ayarı, şema allowlist ve yeni unit/integration/E2E testleri; işletme ve mimari belgeleri. Mobil 390px ekran görüntüsü görsel incelendi; taşma yok.

Son kanıt: 95/95 Vitest; 27/27 geliştirme E2E; 27/27 production E2E (14.9 sn); typecheck/lint/build başarılı. db:check ve db:generate tutarlı, 42 tablo ve yeni şema farkı yok. Ana DB migration ve iki seed koşusu başarılı. Testlerden sonra 0 test DB, 0 medya nesnesi, 10 editoryal satır; kişi/takım/credit/kart 0. Gerçek sır değerleri src/scripts/tests/browser/standalone içinde bulunmadı; build içinde env/PEM/key/HEIC/Wallet secrets yok. Staged diff kontrolü commit öncesi tekrar yapılır.

Aşama 1 kanıtı docs/operations/phase-1-acceptance.md içinde. Gerçek 2026 galeri/finalist içeriği ve 2027 tarih/konum bilinmediğinden yayımlanmadı. Finalist slotunun tam sonuç/rıza yayını Görev 20'de; 2027 draft seed başvuru açmaz. Sayfa yeni istekte yayımlanmış tarihi okur; açık sekmede yayın geri çekmesini anlık poll etmez. VDS deployment yapılmadı. Görev 9 ve kapı kutuları işaretlendi; sıradaki Görev 10.


### Görev 10 başlangıç — sözleşme ve kapsam

Plan/mimari ve mevcut forms/form_versions/form_fields/form_rules/submission_answers FK'leri okundu. Sözleşme: UUID alan kimlikleri sürümler arasında korunur; definition schemaVersion=1, en çok 100 alan; bütün 15 tür kayıtlı; dosya türü yok. Alan koşulu izinli JSON AST (and/or, eq/neq/gt/gte/lt/lte/contains/in/is_empty), bilinmeyen referans/tip ve döngü reddi, boyut/derinlik sınırı. Gizli alan cevapları yok sayılmayıp reddedilir; gizli referans yaprakları false olur. Merkezi sunucu doğrulaması string-sayı dönüşümü yapmaz.

Yayınlanan version snapshot ve field/rule satırları DB trigger'larıyla değişmez; taslak yeni sürüm ayrı numara alır. Repository işlem katmanıdır, HTTP/panel/yetki/yayınlama servisi Görev 11'de bağlanır; burada form status açılmaz. Migration plandaki genel dosya adı yerine mevcut Drizzle journal ile 0007_form_versioning.sql custom olarak üretilir. Yeni ürün bağımlılığı yok. Önce unit ve gerçek PG testleri kırmızı, sonra uygulama.

Görev 10 RED: unit 29 failed/1 passed (eksik motor), gerçek PG 3/3 failed (eksik repository). Test kurulumu/migration başarılı; başarısızlık implementasyon stub çağrılarında. Şimdi izinli schema/validator/koşul ve trigger repository uygulanır.

Görev 10 ilk GREEN: 30/30 unit ve 3/3 gerçek PostgreSQL. İncelemede boşlukla zorunlu alanı geçme ve UUID büyük/küçük harfin PostgreSQL ile farklı kimlik oluşturma durumları için ek test RED görüldü; boş metin trim boşluk kontrolü ve bütün alan/ref/answer UUID anahtarları için canonical küçük harf zorunluluğu eklendi. Bütün operatör ve limit sınırları ile parent-lock yayın yarışı testleri genişletildi.

45/45 odak test geçti; lint ilk koşuda fieldRows destructuring içinde unused condition bildirdi. Config ayrı izinli anahtar filtresiyle üretildi, kural AST aynı kaldı. Parent lock yarışının ters sırası için de gerçek PG testi eklendi. İmplementasyon bu sohbet içinde dosya bazında incelenir; kullanıcı çalışma disiplini nedeniyle reviewer/implementer delegasyonu yapılmaz.


### Görev 10 kapanış

Dosya bazında incelendi: field-types kayıt/config/answer parser; form-version sıkı schema/JSON limitleri; condition izinli AST/referans tür kontrolü/döngü/visibility; server-only merkezi submission validator; server-only form repository ve canonical snapshot/field/rule aynası; 0007 SQL parent-lock trigger'ları; journal ve snapshot kimlik zinciri; unit ve gerçek PG fixture/cleanup testleri; form rehberi, mimari/veritabanı notları, plan ve README. Custom snapshot'ın 0006 ile id/prevId dışında tüm şema içeriği aynı olduğu programatik doğrulandı. Ürün bağımlılığı kurulmadı; kullanılan formatter pnpm dlx ile sabit sürümdür.

Son kanıt: 141/141 Vitest (13 dosya; 41 yeni unit + 5 yeni gerçek PG), 27/27 production E2E (16.7 sn), typecheck/lint/build başarılı. db:check tutarlı; db:generate 42 tablo ve yeni fark yok. 0007 ana DB'de uygulandı; ikinci migrate no-op başarılı. v1 etiketi/cevabı v2'den etkilenmez; yayımlı snapshot/child INSERT/UPDATE/DELETE SQLSTATE 23514 ile reddedilir; paralel yeni version numaraları tekil; publication ve child yazısının iki kilit sırası test edildi.

Son veri kontrolü: 42 tablo, 10 editoryal satır, 0 test DB, 0 medya nesnesi; kişi/takım/credit/kart 0. Ana DB'de form/submission seed yok. Gerçek sır src/scripts/tests/browser/standalone içinde bulunmadı; build'de env/PEM/key/HEIC/Wallet secrets yok. Staged diff sır kontrolü commit öncesi tekrar yapılır.

Görev 10 kutuları tamamlandı. Panel/yetki/audit/yayınlama iş akışı Görev 11, canlı submission kabulü Görev 12 ve sonraki görevlerdir. Mevcut repository iç katmandır; form status açmaz. Gerçek içerik/hukuk/sunucu/Wallet canlı kabulü henüz yapılmadı. Görev 11 başlatılmadı.

Görev 10 commit öncesi staged diff ve build/source sır kontrolü tekrar geçti: secretFileHits=0, forbiddenBuildFiles=0, stagedSecretHits=0; git diff --cached --check temiz. Görev 9 commit d9be96d; Görev 10 ayrı commit ile kaydedilir.
