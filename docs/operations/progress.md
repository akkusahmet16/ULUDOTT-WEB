# Uludott uygulama ilerleme raporu

Plan: `docs/design/2026-10-02-uygulama-plani.md`
Mimari: `docs/design/2026-10-01-mimari-oneri.md`
Başlangıç: 2 Ekim 2026. Kullanıcı planın yürütülmesine izin verdi.

**Güncel durum: Görev 1–17 tamamlandı. Görev 18 sıradaki adım.** Aşağıdaki önceki açık durumlar çalışma geçmişidir; son kabul kaydı Görev 15 kapanışıdır.

## Çalışma disiplini

Her işlem öncesinde planın ilgili adımı ve bu rapor okunur. Her kutucuk sonunda ilgili dosyalar ve diff yeniden incelenir; doğrulama kanıtı olmadan tamamlandı işaretlenmez. Uygulama bu sohbet içinde yürütülür; implementasyon delege edilmez.

Yerel önizleme disiplini (kullanıcı, 2 Ekim 2026): her görev/işlem bitiminde site yerelde başlatılır. Yeni göreve başlarken bu projeye ait önizleme sunucusu durdurulur; geliştirme ve kontroller tamamlanınca yeniden açılır. Kullanıcı şimdilik yerel önizlemeyle ilerlemeyi seçti; Sites yayın kapsamı sorusu beklenmez.

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


## GitHub deposuna aktarım — 2 Ekim 2026

Kullanıcı https://github.com/akkusahmet16/ULUDOTT-WEB deposunun temizlenip bu projeyle değiştirilmesini ve push edilmesini açıkça istedi. Plan/rapor, temiz çalışma ağacı, GitHub ref'leri ve mevcut main dosya listesi okundu. origin bu URL olarak tanımlandı; uzak depoda yalnız main vardı, tag yoktu. Eski main 9f5d4d0ca7b46756f827ce02af4f067a2e013d98 tam Git geçmişiyle .local/ULUDOTT-WEB-before-replacement-9f5d4d0.bundle içine yedeklendi; bundle verify başarılı, izin 0600, Git dışında. Eski kaynak bu projenin geçmişine birleştirilmedi.

Yayın öncesi yeni proje HEAD geçmişindeki 306 blob tarandı: gerçek env sırları/private-key içerik eşleşmesi 0, yasak env/anahtar/Wallet/raw medya yolu 0. pnpm test tekrar 141/141 geçti (13 dosya, 8.68 sn). gh CLI yoktu; mevcut osxkeychain Git yetkilendirmesiyle ek kurulum gerekmeksizin aktarım yapıldı.

Tam eski SHA'ya bağlı force-with-lease kullanılarak origin/main 9f5d4d0'dan 42475dd'ye başarıyla değiştirildi. Projenin Görev 1–10 commit geçmişi korundu, eski repo dosyaları main ağacından çıktı. Bu aktarım kaydı ayrı docs commit ile normal push edilir. .env.local, sırlar, node_modules/build çıktısı ve ham medya gönderilmedi. Bu işlem GitHub kaynak aktarımıdır; canlı VDS deployment değildir. Görev 11 henüz başlatılmadı.


## Görev 11–13 başlangıç — 2 Ekim 2026

Başlangıç b731d00, çalışma ağacı temiz. executing-plans ile 11→12→13 inline yürütülür; her görev ayrı RED/GREEN/inceleme/commit kapısından geçer. Next page/route/server-client belgeleri okundu: async params/cookies, GET dinamik/no-store, sunucu servisleri server-only.

Ruling: genel form mutlaka bir etkinliğe bağlı olur; forms.write yalnız event_manager+eventScopes, content_editor veya system_admin tek başına form/başvuru PII yetkisi almaz — mevcut izin matrisine uyar; maliyet: bağımsız etkinliksiz form desteklenmez. Ayarlar formda saklanır; published/draft version FK'leri aynı form kimliğine composite bağlanır. Yayın için başlangıç tarihi zorunlu, bitiş opsiyonel; teşekkür metni zorunlu; bekleme listesi, tekrar politikası ve 1–3650 gün saklama ayarı vardır. Görev 12'de waitlisted ayrı durum olacak; count yalnız received/pending/approved. Preview taslak yanıt göndermez. Görev 13'te veri silme receipt ve idempotency cevabını da iptal eder; audit yalnız metadata.

Görev 11 RED 3/3 PG stub, sonra 3/3 GREEN. İlk fixture event_kind community geçersizdi; general düzeltildi, izin/şema gevşetilmedi. Composite form-version FK döngüsünde Drizzle extra-config return type açık yazılarak TS inference düzeltildi. E2E ilk 1 failed/1 passed, form sayfaları eksik; şimdi rotalar ve panel bağlandı. API gövde sınırı form için 128 KiB, definition validator 100 KB kalır.

Görev 11 odak E2E 2/2 GREEN (12 sn); tüm Vitest 144/144; typecheck/lint/build başarılı. 0008 SQL incelendi; DB migration iki koşu ve db:check geçti. UI, alan/config, renderer/preview, async page/route ve server scoped servis incelendi. Birleşik koşullar UI içinde korunur; bu arayüz tek yaprak koşulu düzenler. Production tarayıcı ve sır/veri taraması kapanışta kontrol edilir.


### Görev 11 kapanış

144/144 Vitest, 29/29 production E2E (14.3 sn), 2/2 odak dev E2E; typecheck/lint/build/db:check ve iki migrate başarılı. Son kontrol 42 tablo, 10 editoryal satır, 0 test DB/medya nesnesi; PII tabloları boş. Source/browser/standalone sır eşleşmesi 0; yasak build dosyası 0. 0008 şema/migration/metadata, form servis/HTTP/scoped izin/audit, helperText/repository tx desteği, bounded JSON, UI/settings/fields/preview/builder, admin route/menu, PG/E2E ve fixture değişiklikleri dosya bazında incelendi. Birleşik koşul UI sınırlaması rehberde açık; mevcut gruplar korunur. Alan kaydetme yeni draft version oluşturur, eski published version değişmez. Plan kutuları tamamlandı; sonraki Görev 12.


### Görev 12 başlangıç

Ruling: tekrar reddi bir formdaki tek zorunlu, koşulsuz e-posta alanını kimlik kabul eder; böyle bir alan yoksa reject politikasıyla yayın reddedilir — ziyaretçi hesabı olmadan kimlik uydurulamaz; maliyet: e-posta istemeyen form allow seçmelidir. requestContext versionId ile eski sekme korunur; idempotency cevabı önce bulunur, same-key/different-body 409. Receipt 32-byte rastgele, DB SHA-256 hash, replay AES-GCM ayrı AAD ile şifreli ve 24 saat TTL; silme/expiry replay iptal edilir. Makbuz yalnız tarih/durum/teşekkür gösterir, yanıt/PII göstermez. Raw token URL fragment'ında, HTTP log/query dışındadır. DB form kilidi kapasite+duplicate+idempotency işlemlerini serileştirir. Form global dakika rate sınırı ve Origin/CSRF, honeypot perimeter eklenir; Turnstile tam kabulü Görev 25 kapsamıdır.

Görev 12 RED 5/5 PG ve 1 failed/1 passed E2E (public page yok). İlk implementasyonda Drizzle select-from olmadan clock çağrısı çalışmıyordu; tx.execute ile düzeltildi. Raw SQL param Date postgres-js encode hatası verdi; expiry karşılaştırmaları ORM gt ile kolon encoder'ına bağlandı. Hata sadece test fixture değerleri içeriyordu; HTTP genel hata döndürür, query/answer loglamaz. Yeni public/receipt route bağlandı, token fragment; noindex/no-referrer ve no-store API.

Görev 12 PG odak 8/8 ve dev E2E 2/2 GREEN. İncelemede aynı amaç/sürümde iki çelişen rıza alanı ve yayımlı e-postasız formun ayarını reject'e çevirme testleri RED görüldü; tanımda consent tuple tekilliği ve saveSettings current version kimlik kontrolü eklendi. Allow tekrar, expired receipt/replay 404/410 ve kapandıktan sonra güvenli aynı-body retry testleri eklendi.

Görev 12 bütün Vitest 154/154 (15 dosya), typecheck/lint/build/db:check ve iki migration başarılı. SQL 0009 incelendi; receipt snapshot yalnız başlık/teşekkür, replay ciphertext, hash ve expiration/resource ilişkisi; log/API safe hata yolları; public get yalnız active definition, noindex headers, CSRF/global rate/honeypot, fragment receipt ve client answer clear davranışı dosya bazında incelendi. Test fixture yalnız izole E2E DB'de demo form üretir. Production tarayıcı ve son veri/sır taraması kapanışta.


### Görev 12 kapanış

154/154 Vitest; 31/31 production E2E (14.8 sn), 2/2 odak dev E2E; typecheck/lint/build/db:check ve iki migrate geçti. Son kontrol: 42 tablo, 10 editoryal satır, 0 test DB/medya nesnesi, ana kişisel tablolar boş. Source/browser/standalone sır 0, yasak build dosyası 0; staged tekrar taranır. 0009, submission/replay/receipt servisleri, public HTTP/limiter/CSRF/honeypot, form yayın ve ayar kimlik kapısı, consent tuple doğrulaması, form-fields/public/receipt UI, public/admin routes/header, E2E fixture ve bütün test/belgeler incelendi. Görev 12 kutuları tamamlandı; Görev 13'e geçilir.


### Görev 13 başlangıç

ExcelJS 4.4.0 resmi npm registry/upstream doğrulandı ve exact kuruldu; server export writer, ziyaretçi XLSX upload/parser yok. İlk test dizini yoktu, oluşturulup gerçek RED koşusu alındı. Ruling: VDS sınırı için liste 25/en çok100; export en çok5000 satır, 1000 sürümlü alan, 250000 hücre/20 MB; fazla istek açık hata, sessiz truncation yok — maliyet: filtre ile daraltma gerekir. Ruling: admin correction eski version doğrular ve consent cevabını değiştiremez — maliyet: yeni rıza kişinin ayrı eylemini gerektirir. Ruling: bağlı UluJam application satırları generic delete/purge tarafından atlanır/blocked sayılır; gelecekte takım/kart yaşam döngüsü entegre bağlanmalı, FK bütünlüğü korunur. Cursor tam PG mikro-saniye UTC timestamp'ını saklar; JS Date truncation ile sayfa atlama yapılmaz.

Görev 13 PG/security odak 18/18 GREEN; microsecond cursor 206 kayıt, eski/yeni version etiketleri, kapsam reddi, revision/capacity, receipt+replay silme ve expiry purge doğrulandı. ExcelJS typedef eski Buffer'ı ArrayBuffer diye tanımladığı için testte gerçek Uint8Array.buffer kullanıldı; runtime writer string. İlk E2E başlangıcı Node strip-only constructor parameter property reddetti; SubmissionError eşdeğer explicit status özelliğine çevrildi. Retention CLI aktif DB yönetici/kapsamı doğrular; canlı günlük timer dağıtım aşamasında bağlanır. Yeni destek dosyaları submission-http, migration0010 form-email/replay-resource indeksleri, CLI ve izole E2E fixture doğrudan Görev13 kapsamını tamamlar. Tarih filtreleri UI'da açık UTC, detay İstanbul olarak etiketlidir.

172/172 Vitest ilk tam koşu geçti. Lint tek kullanılmayan import bildirdi, kaldırıldı. Bağımlılık audit uuid8.3.2 moderate bulundu; ExcelJS yalnız v4 kullandığı ve uuid11.1.1 require/import exportlarını koruduğu registry/kodla doğrulandı. Override pnpm11'in pnpm-workspace.yaml dosyasında 11.1.1 exact; son audit bütün seviyelerde 0. İlk yanlış package.json konumu pnpm uyarısıyla düzeltildi; çalışma dosyaları eski override'ı korur. E2E Form seçiminin implicit label metni option'ları da içeriyordu; açık aria-label eklendi. Ayrıntı yeniden yükleme revision key'i kaydetme mesajını sıfırlıyordu, aynı component yeni server revision alacak şekilde korundu.

Görev13 ilk production E2E 32/33: düzeltmeden hemen sonraki durum isteği RSC yenilemesini beklemeden eski expectedRevision gönderiyordu (409). Başarılı POST'un revision'ı client state'e hemen yazıldı; sunucu CAS koruması aynen korunur. Aynı tarayıcı testi gerçek üretim hatasını yeniden sınar. Dev odak E2E önce 2/2 geçmiştir.


### Görev 13 kapanış

172/172 Vitest; 33/33 production E2E (19.8 sn), 2/2 odak dev E2E; typecheck/lint/build/db:check/db:generate ve iki migrate başarılı. Migration0010 yalnız iki destek indeksidir; yeniden generation schema değişikliği yok. CLI yetkisiz UUID negatif koşu doğru exit1/güvenli hata. Dependency production audit 0. Son kontrol 42 tablo, 10 editoryal satır, 0 test DB/medya nesnesi; ana PII boş. Source/browser/standalone sır eşleşmesi0, yasak build dosyası0, staged yeniden taranır. Form scoped liste/detay/PII minimizasyonu, cursor/arama, eski sürüm correction, durum/capacity/CAS, receipt/replay/answer/consent/history silme, export/version/limits/audit/injection, bağlı kayıt guard/purge, UI/API/CLI ve bütün destek dosyaları/belgeleri incelendi. Plan Görev13 kutuları tamam; Görev14 başlatılmadı. 11–13 bütün dal son bağımsız incelemesi sıradadır.

Task 13: complete (commits 85975be..35d5f75, tests: pnpm test → 172/172; production pnpm test:e2e → 33/33; typecheck/lint/build/DB geçerli). Son bağımsız inceleme b731d00..35d5f75 aralığı, salt okunur; uygulama delege edilmez.

### Görev 11–13 bağımsız son inceleme ve tek düzeltme geçişi

b731d00..35d5f75 aralığı fresh-context gpt-6-astra tarafından salt okunur incelendi; kritik yok, iki Important, Minor yok. Dereceler etkilerine göre onaylandı: (1) options textarea Enter sonrası boş satırı normalize edip ikinci seçeneği ilkine yapıştırıyordu; (2) public doğrulama tüm alan hatalarını genel mesaja indiriyor, telefon E.164 ve çoklu seçim kısıtını kişi bulamıyordu. Klavye seçenek E2E RED “Birinciİkinci”; public telefon E2E RED fieldErrors undefined; unit RED safe UUID/message map yok. Raw seçenek metni editörde korunur, canonical seçenekler ayrı üretilir. AnswerValidationError yalnız bilinen alan UUID/fixed mesaj taşır; raw parser/input cevaba/loga çıkmaz. Telefon formatı, karakter ve seçim sınırı yardımında görünür; public hata aria-invalid/describedby ile alana bağlanır. Yardımın label metnine katılması ilk GREEN denemesinde exact Telefon locator'ını bozdu, label ve açıklama ayrı elemanlara ayrıldı. Tam GREEN kapısı beklenir, ikinci reviewer çağrılmaz.

Final: Ruling: geç katılan takım üyesi Wallet hakkı 18/22'de kalır — genel form kaydı Wallet uygunluğu oluşturmaz — maliyet: bu artışta takım/Wallet teslimi yok.
Final: Ruling: eski outbox revision ve kuyruk işleri 21'de kalır — bu değişiklik yeni worker işi üretmez — maliyet: otomatik iş/revision işletimi sonraki artışı bekler.
Final: Ruling: yeni yıl tam oyun/rıza yayını 20'de kalır — mevcut 2026 yalnız üç tarihî derece URL'si aynen korunur — maliyet: tam yeni yıl sonuç yayını bu artışta yok.
Final: Ruling: Turnstile/CDN 25'te kalır — şimdi CSRF/honeypot/global rate, ürün tam canlı kabul edilmez — maliyet: canlı trafik açılışı sertleştirme kabulünü bekler.
Final: Ruling: günlük canlı retention timer, yedek imhası ve VDS kapasite kabulü dağıtım işidir — silme servis/CLI çalışır, süre dolunca erişim hemen kapanır — maliyet: fiziksel otomatik imha ve yedek politikası dağıtımda ayrıca kurulmalı.
Final: Ruling: bağlı UluJam kayıtlarının yaşam döngüsü 15–19'da kalır — generic delete guard ve purge blocked sonucu FK/kişisel akışları sessiz parçalamaz — maliyet: bağlı kayıtlar ayrıca yönetilmeden fiziksel silinmez.
Final: Ruling: form UI yeni tek yaprak koşul düzenler, mevcut and/or korunur — motor birleşik koşulları doğrular ancak bu panel ileri grup editörü değildir — maliyet: yeni birleşik koşul panelden kurulamaz; ileride UI genişletilmelidir.
Final: Ruling: açık sekmenin sayaç değişikliği refresh sonrası görünür — önceki yıl yayın davranışı değişmedi, NULL tarih Yakında — maliyet: eski sekme yeni tarih için yenileme ister.

Son düzeltme odak dev E2E 4/4, unit43/43 ve tam Vitest173/173/type/lint geçti. İlk tam production sonrası hızlı alan kaydet→yayımla eski client revision/dirty state yarışını da ortaya çıkardı (32/33); aynı FormBuilder cevaptan revision ve kaydedilmiş alan baseline'ını hemen alacak şekilde düzeltildi. Server CAS ve henüz kaydedilmemiş alan koruması korunur; bu kabul kapısı tekrar yeşil olmadan kapanmaz.

Final: fixed seçenek textarea yeni satır kaybı — form-builder keyboard Enter test RED→GREEN, suite173/173, production33/33.
Final: fixed public alan doğrulama açıklaması — telefon HTTP/browser UUID+fixed mesaj+aria ve çoklu seçim safe error unit RED→GREEN, suite173/173, production33/33.
Final: fixed hızlı kaydet→yayımla eski revision/baseline yarışı — production form-builder32/33 RED→33/33 GREEN; suite173/173, type/lint/build geçti.
Final review: bir bağımsız reviewer, iki Important düzeltildi; Critical/Minor yok, ertelenen küçük bulgu yok. İkinci review yok; tek düzeltme geçişi TDD ile kapandı. 4/4 odak dev E2E, 173/173 Vitest (17 dosya), 33/33 production E2E (25.1 sn), typecheck/lint/build başarılı. Son ana veri kontrolü42 tablo/10 editoryal satır/0 PII/0 test DB/0 medya; source/browser/standalone sır0, yasak build dosyası0. Ledger geçmiş son sayıları değiştirmez; son kabul bu satırdır.
Task 11: complete (commits b731d00..0785089, tests144/144, production29/29); Task 12: complete (commits 0785089..85975be, tests154/154, production31/31). Görev13 35d5f75, ortak son düzeltmeler ayrı commit. Normal checkout/development/bootstrap korunur; merge/PR/push veya VDS dağıtımı bu görev dizisinde yapılmadı. Görev14 başlatılmadı.

## Görev 14–15 başlangıç

Başlangıç d17fd65, temiz checkout. Plan/mimari/rapor ve Next async page rehberi okundu; executing-plans inline, iki görev ayrı kapılarla yürütülür. Paylaşılan arayüz:14 mevcut event/form yayın servislerini,15 genel immutable form tanımı/koşul motorunu tüketir;16 özel atomik uygulama/team kaydını tüketir. Ruling: başvuru CTA yalnız aynı etkinliğe bağlı açık genel form için etkinleşir; UluJam özel gönderimi16'ya kadar CTA alamaz — generic submit takım kurallarını atlamasın — maliyet: UluJam gerçek başvuru bu görevde açılmaz. Coffee seed açık geliştirme çağrısıdır; otomatik ana DB başlangıcına eklenmez, tarih/konum/afiş bilinmez bırakılır.

### Görev 14 kapanışı

Seed/CTA PostgreSQL testi RED→GREEN; 174/174 unit+integration, typecheck/lint ve production build geçti. Coffee Talk E2E 1/1; tüm production TLS E2E 34/34 (tek worker: ortak yayın fixture çakışmasını önler). İlk E2E başarısızlıkları güvenli localhost cookie/API fixture aktarımı ve yayın isteği confirmed alanı eksikliğiydi; test gerçek API sözleşmesine düzeltildi. Kaynak, test ve diff dosyaları incelendi. Ana DB42 tablo/10 mevcut içerik satırı, kişisel kayıt0, test DB0, medya0; sır/build taraması0 ve production audit0. Aşama2 kanıtı phase-2-acceptance.md. Görev14 tamamlandı; Görev15 özel form tanımı sonraki adımdır.

### Görev 15 başlangıcı — BASE 2455757

Ruling: Görev15 formu yetkili etkinlik yöneticisine salt önizleme olarak sunulur; atomik kayıt/makbuz16'da yapılacağı için public başvuru açılmaz — maliyet: kullanıcılar16 tamamlanana kadar UluJam başvurusu gönderemez. Takım parolası genel FormVersion/answers alanı değildir; özel geçici credential olarak tutulur ve mod değişince silinir — aksi durumda genel export/snapshot parolayı açığa çıkarabilir. Takım seçimi için buildUlujamFormDefinition(eventId, teams = []) opsiyonel gerçek seçenek listesi alır; boş listede sahte takım üretmez. Önizleme mevcut event-scope ile okunur, yalnız isim/id alır; kayıt servisi eklenmez.

### Görev 15 kapanışı

Görev14 commit2455757 sonrası15 başladı. UluJam domain/template19 test, gerçek PG yetki/takım izolasyonu1 test ve dört mod/anonim erişim E2E2 test RED→GREEN. Toplam `pnpm test`194/194, typecheck/lint/production build başarılı; production TLS E2E36/36 tek worker başarılı. axe erişilebilirlik0; koşullu skill/team alanları ve parola/mod temizliği doğrulandı; browser storage yazımı0. Genel Coffee Talk E2E ve integration aynı suite'te geçer. Kaynak/test/belge/diff dosyaları tamamen incelendi. Test sonrası42 ana tablo/10 önceki içerik satırı, kişisel kayıt0, geçici DB0, medya0, sır/build taraması0. Yeni bağımlılık/migration yok. Domain, UI, scoped readonly preview ve yönetim listesi bağlantısı hazır; atomik kayıt/tekillik/kapasite/erişim/makbuz16'da, Wallet sonraki görevlerde. Son bağımsız14–15 diff incelemesi kalan kontrol.

### Son inceleme — 14–15

Bağımsız read-only reviewer d17fd65..0adbffc: Critical0, Important0, Minor3. Etki yeniden derecelendirmesi: ortak ana sayfadaki iki etkinliğin global selector çakışması CI/test güvenilirliği için Important; gerçek ikinci DEMO etkinlikle deterministik RED→GREEN yapılır. Domain hata alanının işaretlenmemesi ve README alt durum paragrafının13 demesi Minor olarak ertelendi. Kaynak iş kuralı değişmez.

Final: fixed ortak yayın testlerinde global link selector çakışması — ikinci gerçek DEMO etkinlik + açık Coffee formu ile regression RED (global Başvur1, beklenen0)→GREEN (kendi kartıyla kontrol/gezinme), suite194/194 ve default2-worker production E2E36/36. typecheck/lint geçti. Ürün kodu değişmediği için önceki production build geçerli; son testler bu standalone build'i kullandı. Tek fix pass; ikinci reviewer yok.

Final: minor (deferred): UluJam önizlemesinde domain hataları (kesirli kişi sayısı/boş takım parolası) ilgili alanı işaretlemek yerine genel mesaj verir.
Final: minor (deferred): README alt durum paragrafı sonraki görev13 der; üst durum/plan/rapor doğru şekilde16'yı gösterir.

Reviewer'ın kapsam dışında bıraktığı davranışlar için executor kararları:

Final: Ruling: atomik UluJam kayıt/e-posta tekilliği/beceri kalıcılığı/makbuz16'da — plan açıkça bu servisi16'ya bırakır; maliyet: bu aşamada public UluJam kayıt alınmaz.
Final: Ruling: takım normalizasyonu/gerçek uygunluk-kapasite/parola kontrolü/erişim üretme-döndürme/oturum16'da — salt önizleme bunların çalıştığını iddia etmez; maliyet: gerçek takım erişimi henüz yok.
Final: Ruling: genel submit üzerinden özel UluJam kurallarını atlama koruması16 entegrasyonunda — özel şablon bu çalışmada public yayımlanmaz ve UluJam CTA kapalıdır; maliyet:16 guard tamamlanmadan özel şablon genel endpoint'te yayımlanamaz.
Final: Ruling:50 üstü takım seçimi16 entegrasyonunda — önizleme ilk50 gerçek seçenekle sınırlıdır; maliyet:51. ve sonraki takım bu önizlemeden seçilemez.
Final: Ruling: özel şablonun kalıcı/live yayını16'da —15 kabulü yetkili, veri yazmayan önizlemedir; maliyet: katılımcılar bu formu henüz gönderemez.
Final: Ruling: onay/geç üye Wallet/kart/outbox revision/sonraki sonuç akışları sonraki görevlerde — bu aralık bunları değiştirmez; maliyet: bu özellikler için canlı kabul verilmez.
Final: Ruling: değişmeyen12 idempotency ve8–9 arşiv/sayaç davranışları yeni implementasyon olarak incelenmedi — mevcut regresyon testleri tüm suite'te geçti; maliyet: bu görevlerde ek sınır-durum kapsamı üretilmedi.

Son kabul: Görev14(2455757) ve15(0adbffc) sırasıyla tamam; bağımsız inceleme ve test izolasyonu fix'i tamam. Son veri kontrolü ana42 tablo/10 mevcut editoryal satır, kişisel kayıt0, test DB0, medya0. Plan kutuları/phase2 kabulü güncel. Mevcut development/bootstrap dalında tutulur;14–15 için push/merge/deploy yapılmadı.

## Görev16–17 başlangıcı

BASE ae6cd64 temiz checkout; executing-plans inline/TDD, plan16→17→tek son bağımsız review. Next page/route/server-client rehberleri okundu. Paylaşılan arayüz16 üyelik/kadro revision/transaction güvenliği17 deterministik öneri+atama tarafından tüketilir.18 onay üyeliğin approvedRevision alanını tüketir;16–17 yeni üyelik onaylı sayılmaz. Kullanıcı erken yayına çıkılsa da görev kapsamının değişmemesini istedi. Sites istendi; Node/native Argon2/PostgreSQL uygulamasını Workers/D1'a yeniden yazmak bu isteğe aykırıdır; genel sayfa yayını/tam uygulama ayrımı kullanıcıya soruldu, görev geliştirme sürer.

## Görev 16 — tamamlandı
Başvuru/makbuz/beceri/yeni takım/üyelik tek PostgreSQL transaction içinde; event e-posta tekilliği ve kapasite, son takım koltuğu kilidi+DB constraint trigger, NFKC Türkçe isim, Argon2id parola, 30dk Secure HttpOnly oturum, erişim yenileme, CSRF/rate limit, no-referrer/noindex özel sayfa uygulandı. Genel form UluJam bypass 409. Yönetici form editöründen özel şablon yükler; public takım seçenekleri canlı cursor sorgusundan gelir. Yeni/katılan makbuz özel takım linki verir; parolalar cevap snapshotına yazılmaz. Kart/onay işlemleri18–19 kapsamıdır.
RED: 3 backend not-implemented, HTTP404/CSRF ve replay/CTA testleri izlendi; GREEN:199/199 unit+gerçekPG (maxWorkers2),38/38 üretimTLS E2E, typecheck/lint/build/dbcheck geçti.0011–0012 ana DB migrate edildi;generate no changes. Genel galeri testi host saatine göre gelecekte verifiedAt yazıyordu; SQL now() ile önce başarısız test düzeltildi. Yoğun PG+E2E birlikte koşturulunca5s testtimeout görüldü; DB testleri ve tarayıcı süitleri sırayla koşturuldu. Browser Next route-announcer alert test locator main'e daraltıldı. Üretim kişisel kayıt yok, güvenlik taraması0.
Task16: Ruling: takım davet token'ı hash yanında AEAD şifreli saklanır — mevcut takıma doğru parolayla katılanın özel link alması gerekir — maliyet: replay şifre anahtarının korunması/rotasyonu gerekir.
Task16: Ruling: public takım seçimi sürümlü sabit options dışında canlı cursor listesi — yeni takımlar form yayımlandıktan sonra oluşur — maliyet: liste açıldıktan sonra dolan takıma katılım409 döner.
Task16: Ruling: özel UluJam kontenjanı dolunca atomik409; genel form waitlist akışı korunur — bekleme listesi henüz onaysız takım üyeliği yaratmaz — maliyet: UluJam waitlist ayarı bu akışta kayıt açmaz, daha sonraki ürün kararı gerekir.
Task16: Ruling: genel form testleri Coffee etkinliğine taşındı, yayın testleri ayrı2030 DEMO UluJam'dedir — özel bypass korumasını gevşetmeden generic regresyonu test eder — maliyet: fixture ayrımı sürdürülmelidir,2027 gerçek tarihleri değişmez.
Task16: complete (BASE ae6cd64; tests vitest --maxWorkers=2 199/199; E2E38/38).

## Görev 17 — tamamlandı
BASE0b832ac. Deterministik beceri çeşitliliği/seviye artışı puanı ve gerekçeleri; dolu takımlar sorguda ve domainde dışlanır. Yönetici paneli eventscope, beceri1–5 filtre, cursor katılımcı/takım sayfaları; telefon/e-posta/iç not göstermez. Öneri üyelik değiştirmez, kişisel veri AI servisine gönderilmez. Atama/taşıma/geri alma event→application→sıralıtakım kilitleriyle, roster revision, onaysız üyelik, kapasite ve audit tek transaction. Geri alınan üyelik tarihçedeleftAt ile kalır, kart oluşmaz.
RED: yeni recommendation/matching-service modülleri yok testleri izlendi; GREEN unit+PG202/202, üretimTLS tarayıcı40/40 (panel gerçek filtre+gerekçe+atama+undo+axe0), typecheck/lint/build geçti. İlk E2E getByLabel exact sarmalanan select seçenekleri nedeniyle bekledi; snapshot combobox doğru accessible name, locator getByRole ile düzeltildi. Kapalı/yabancı takıma başarısız transferin önceki üyelik ve revision'ı değiştirmemesi testi geçti.
Task17: Ruling: expectedRevision hedef takımın rosterRevision'ıdır — son koltuk ataması ve eski geri alma komutlarının çakışmasını önler — maliyet: başka üyelik değişince yönetici listeyi yeniler.
Task17: Ruling: öneriler50 takım sayfasından en yüksek5; diğer takımlar cursor ile açılır — sınırlı sunucu kaynakları ve büyük listelerde sayfalama gereği — maliyet: başka sayfada daha yüksek katkılı takım olabilir, panel açıklaması bunu belirtir.
Task17: complete (BASE0b832ac; vitest --maxWorkers=2 202/202; E2E40/40). Tek son bağımsız review bekleniyor; Sites genel önizleme kapsamı sorusu cevaplanmadı, deployment yapılmadı.

## Görev16–17 son bağımsız inceleme
Fresh-context gpt-6-astra read-only review ae6cd64..217ecf8 yapıldı; tek inceleme, alt ajan/DB mutasyonu yok. Critical0; Important2 kabul; Minor1 ertelendi. Önemli bulgular tek TDD düzeltme pass'inde ele alındı.
Final: fixed süresi dolan kişinin eski panelden atanabilmesi ve süresi dolan takım üyesi becerilerinin öneriye katılması — expiry-between-read-and-command testi RED (istek başarılı oldu)→GREEN (410, üyelik değişmedi; expired skills boş). Transaction içinde saklama kontrolü; skill aggregation retained kayıtlarla sınırlı.
Final: fixed aday6..50'nin kesilmiş öneriler yüzünden erişilememesi —6/51 aday cursor testi RED5!=6→GREEN bütün51 erişilebilir. Sayfanın bütün50 önerisi döner; ilk5 görünür, diğerleri erişilebilir details içindedir. Task17'deki ilk5+cursor ruling'i bununla düzeltilmiştir.
Final: minor (deferred): atama audit metadata'sında kaynak/hedef takım UUID'leri yok; application UUID/revision/üyelik tarihçesi mevcut, operatör doğrudan audit kaydından takımı göremez.
Final: Ruling:18–19 onay/aktif kart/geç üye uygunluğu bu turda yapılmaz — kullanıcı16–17 istedi, kart0 koruması doğrulandı — maliyet: aktif kart/Wallet hakkı18–19 tamamlanana kadar yok.
Final: Ruling:20 tam sonuç yayını ve yayın rızası gelecekteki görevdir —16–17 hiçbir kişisel sonucu yayımlamaz — maliyet: yeni tam oyun sonuçları henüz açılamaz.
Final: Ruling:21 outbox worker ve stale-job revision ileriki görevdir — bu tur yeni worker yok — maliyet: ileride sağlayıcı işleri worker kurulana kadar işlenmez.
Final: Ruling:22 Apple/Google Wallet sağlayıcı teslimi gelecekteki görevdir — bu tur sağlayıcı nesnesi ve kart oluşturmaz — maliyet: Wallet sunulamaz.
Final: Ruling:25 Turnstile/CDN sertleştirmesi ileriki görevdir — mevcut CSRF/rate limit korunur — maliyet: tam üretim bot/CDN katmanı henüz kurulmadı.
Final: Ruling: bağlı UluJam verisinin fiziksel silinmesi/production retention scheduler/yedek yok etme yaşam döngüsü dağıtım işinde yapılır — bu tur expired read/assignment kapalı, gerçek kişisel veri0 — maliyet: fiziksel temizleme hazır olmadan gerçek kişisel veri toplanmamalıdır.
Final: Ruling: sayfalar arası global öneri optimumu amaçlanmaz — bütün adaylara erişim düzeltildi; sayfa içinde deterministik sıralama sınırı korunur — maliyet: en güçlü aday başka sayfada olabilir.
Final: Ruling: UluJam waitlist için atomik409 politikası bu turda korunur — hiçbir bekleme kaydı takım/kart yaratmaz, generic waitlist çalışır — maliyet: özel başvuru waitlist ürün kararı gerekir.
Final: Ruling: Sites yayını henüz yapılmaz — kullanıcıya genel önizleme/tam Node uygulaması kapsamı soruldu, yanıt gelmedi; mimari kullanıcı isteğiyle korunur — maliyet: yayın URL'si bu turda verilemez.
Final: Ruling: gerçek sunucu kapasitesi/sır rotasyonu operasyonu/hukuki metin onayı bu turda doğrulanmış sayılmaz — yerel doğrulama ve mevcut kurum gereksinimi bu dış işleri kanıtlamaz — maliyet: gerçek üretim kabulü sonraki dağıtımda zorunlu.
Final: Ruling: değişmemiş arşiv/countdown kodu ve bütün generated snapshot içerikleri bağımsız source review kapsamı dışında; journal/DDL alignment incelendi — bu tur regresyon süiti mevcut sayfaları test eder — maliyet: derin eski kod denetimi ayrıca gerekir.
İlk birlikte ağır test koşusunun timeout'undan kalan bu turun2 pasif test DB'si temizlendi; son veri kontrolünde42tablo/10editoryal kayıt/kişisel0/testDB0/media0. Migration tekrarlandı ve no changes; source/browser/standalone/staged secret taraması0.
Son kabul: iki Important bulgu RED→GREEN; tüm süit204/204, üretimTLS E2E40/40 (altıncı aday details açılıp atandı/geri alındı, axe0), typecheck/lint/build başarılı. Tek review/fix pass kapandı; Minor1 ertelendi. Yerel geliştirme dalında kayıt korunur; Sites sorusu bekliyor. Görev16–17 tamamlandı,18'e başlanmadı.

## Yerel önizleme çalışma düzeni
Kullanıcı16–17 sonrasında Sites yerine yerel sunucunun her görev sonunda açık tutulmasını istedi. Yeni göreve başlamadan yalnız bu projenin önizleme süreci durdurulacak; plan ve rapor yine her işlemde okunacak.18 için yeni başlama talimatı verilmedi.
Yerel site APP_URL=http://127.0.0.1:3000 pnpm dev ile başlatıldı (exec session45272, Next listener PID25531; gelecekte PID yeniden doğrulanır). Ana sayfa ve/admin HTTP200; localhost tarayıcı CSRF cookie kontrolü yapıldı. Log .local/local-preview.log. Site görev bitiminde açık kalır; yeni görev başlangıcında yalnız bu projeye ait süreç durdurulur.

## Görev18–20 başlangıcı
BASE264773b temiz checkout. executing-plans inline/TDD;18→19→Aşama3kapısı→20→tek son bağımsız review. Next route/page kılavuzları okundu. Yerel Next süreci çalışma dizini doğrulanarak durduruldu. Her görev sonunda gerçek ana DB ile preview yeniden başlatılıp HTTP kontrol edilir, sonraki görev başlangıcında tekrar durdurulur.
Pre-flight18→19: onay komutları var olan kartların revision/state değişimini tüketir;19 kartı başvuruyla yaratır. Ortak eligibility/card-revision çekirdeği18'de doğrudan bu sözleşme için yazılır;18 henüz yeni kart/token üretmez.
Pre-flight19→20: oyun yayını mevcut kart revision/outbox metadata'sını tüketir; sağlayıcı worker21–22 kapsamındadır.2026 kısmi editoryal kayıtları yeni tam yayın doğrulamasından ayrı kalır.
Task18: Ruling: onay kararı da kadro revision'ını artırıp ayrı approval satırı yazar — eski onaylı üyelerin dayandığı karar kaydı değişmez ve eski karar ekranı çatışır — maliyet: revision sayacı yalnız üyelik değişikliklerini saymaz.
Task18: Ruling: solo başvuruya revision eklenir; HTTP bütün kararlar için expectedRevision ister — eşzamanlı onay/ret eski ekrana göre işlenmez — maliyet: mevcut applications tablosuna additive migration gerekir.
Görev18 debug: ilk PG testinin toplam akışı5s test bütçesini aştı; sonraki async fixture önceki kapanışla çakıştı.20s tek-worker tanı koşusu2/2 başarılı, gerçek uzunluğu21s idi. Test ortamı2worker/30s test-hook bütçesine sabitlendi; ürün timeout/kilitleri değiştirilmedi. Ruling: sınırlı PG altyapısında ağır integration testine30s bütçe — test timeout'undan async cleanup çakışmasını önler — maliyet: gerçek takılma bildirimi daha geç gelir.

Task18: Ruling: host load10 ve eşzamanlı browser/PG çalışması 30s integration/5s browser assertion bütçelerini aştı; testleri serial, Vitest1worker60s, Playwright1worker60s/15s assertion ile çalıştır — ürün timeout değişmedi; tek-worker onay+medya13/13 geçti — maliyet: takılan test daha geç bildirilir. Full suite203pass+3resourcefail sonrası13/13 targeted; tamamlanma iddiası bağımsız tekrar sonucuna dayanacak.

Task18: complete — approval domain/HTTP/queue/solo revision-note migrations ve card refresh gözden geçirildi. RED missing module, ardından solo note RED; GREEN13/13 serial onay+medya; full206 testte203pass ve3resourcefail, başarısızların tekrarında13/13pass. ProductionTLS E2E41/42pass,5s session-renewal assertion tekrar2/2pass; yeni approvals2/2pass. Typecheck/lint/build/db:check/migrate başarılı; sır taraması0. Ana DB kişisel applications/teams/credits/cards0;2026 üç URL ve NULL alanları değişmedi. Test kaynak yükü nedeniyle tek worker; ürün timeout korunur.

Görev18 preview: session11624/listener28136 ana sayfa/admin200. Görev19 başlangıcında cwd doğrulanmış28130 durduruldu. BASE63648fb. Ruling: ayrı check-in kimliği encrypted olarak saklanır, private kart token yalnız kişiye ve encrypted idempotent makbuza verilir; takım özetinde token/QR/Wallet yok — maliyet: check-in şifreleme anahtarı yedeklenmelidir.

Task19: Ruling: önceki cards=0 testleri artık aktif olmayan pending kart ve Wallet kayıtlarının yokluğunu denetler; takım sayfasında yetkili oturumla üye adı+durum gösterilir —19 sözleşmesi sınırlı özeti ister — maliyet: takım ortak parolası olan kişi kadro isimlerini görebilir; e-posta/telefon/token/QR görünmez. Check-in resolve/rotate için CSRF ve event-scoped yetki kullanılır; basit panel ekranı bu iptal akışını erişilebilir kılar.

Task19 debug: eski featured-event axe kontrolü streamed metadata title gelmeden çalıştı (document-title); public başlık bekleme assertion eklendi, axe kuralı kapatılmadı. QR okuma testinin ilk string ekleme komutu eşleşmemişti; gerçek PNG decode assertion şimdi açıkça eklendi ve son targeted koşusunda doğrulanacak. Prettier3.9.9 sabit dev dependency kuruldu; runtime eklenmedi.

Task19: complete — pending kart yaratma + encrypted idempotent makbuz linki, minimum own-card görünümü, güncel eligibility, ayrı check-in hash/encryption, scoped resolve/rotate, authenticated takım özeti, private headers ve dev log ignore uygulandı. RED2missing modules; GREEN yeni5/5, full209/209, gerçek QR reader1/1. Typecheck/lint/build/migrate/db:check/sır taraması başarılı. ProductionTLS43/44pass; streamed title bekleme sonrası featured3/3pass; card-states2/2,team-page2/2. Mobil screenshot gözle incelendi. Aşama3 kabul raporu tamamlandı; provider entegrasyonu22 kapsamında kalır. Değişen kaynak/migration/test dosyaları incelendi; generated schema snapshot mekanik artifact.

Görev19 preview session24437/listener29534,home200/private invalid404; private probe token logda yok.20 başlangıcında cwd doğrulanmış29528 durduruldu. BASEabf7c1e. Task20: Ruling: yeni tam oyun yayını başlık/açıklama/onaylı takım/onaylı yapımcı yayın adı ister; yapımcı adına yönetici rıza üretemez. Ayrı private yayın-onayı davetiyle sahibinin açık adı/rızası alınır, isim değişikliği rızayı sıfırlar — maliyet: yöneticinin davet bağlantısını gerçek sahibine güvenli iletmesi gerekir; sistem dışına otomatik mesaj gönderilmez. 2026 için doğrulanmış editoryal takım adı gerçek team/application kaydı uydurmadan saklanabilir; bu istisna yalnız bilinen2026 üç kaydındadır.

Task20: Ruling: pure event_manager oyun düzenleme/davet okumada kendi event scope'u ile sınırlandırılır; content_editor editoryal oyun içeriğini yönetir fakat scoped games.publish olmadan yayımlayamaz — maliyet: iki rolün birlikte verilmesi editoryal global okuma hakkı sağlar. Davet kimliği başka application'a taşınırken veya external arşiv kişisi değiştirilirken token yenilenir; eski davet yeni kişi adına kullanılamaz. RED eski token lookup404 yerine yeni kişi pending403 dönüyordu; aktif iki üyeyle GREEN tekrar doğrulanacak.

Task20: Ruling: yayın rızasını geri çekmek aktif katılım/etkinlik veya güncel form revision'ı gerektirmez; aynı geçerli davet kimliğiyle geri çekme daima adı NULL yapar, oyunu yayından indirir — maliyet: eski açık sahip sayfası yeni onayı geri çekebilir, ancak başkasına aktarılmış token geçersizdir. REDwithdrawn katılımcı403; GREEN tekrar koşusunda doğrulanacak.

Task20 debug: production SSR editor ilk üç inputu hydration öncesi kabul edip değerleri NULL kaydetti; E2E safe DTO assertion title/slug/descriptionNULL, sonraki editorialTeamName doluydu. useHydrated ile yeni editor/consent/list form alanları ve işlem düğmeleri client hazır olana kadar disabled; veri kaybı kullanıcı arayüzünde önlenir. RED E2E saved-field assertion; GREEN üretim tekrar koşusunda doğrulanacak.

Task20 debug correction: useHydrated sonrası aynı RED, dolayısıyla hydration ilk varsayımı kanıtlanmadı. Liste sayfasındaki yeni oyun formu da aynı üç etiketi taşıyor; detay bağlantısına tıklama sonrası test URL geçişini beklemeden eski listedeki alanları dolduruyordu. Detay URL assertion eklenir; veri kaydı assertion korunur.

Task20 debug GREEN metadata: detay URL bekleyince title/slug/description doğru kaydedildi ve owner consent/finalist/tam yayın geçti. Kanıtsız hydration hook kaldırılır. Yeni sayfa axe RED: ortak header logonun alt metni yanındaki Uludott metnini tekrar ediyor; dekoratif logo alt boş yapılır, görünen marka ve ana sayfa bağlantı erişilebilir adı korunur.

Task20: Ruling: full suite HEIC testinin kendi30s override süresi host load12 altında31s doldu; ortak60s integration bütçesine iki ağır HEIC testi de alınır — ürün işleme timeout değişmez — maliyet: takılan codec testi30s daha geç raporlanabilir. Fail koşusu saklandı; tekrar gerçek decoder testini doğrular.

Task20 debug correction: full211/212; HEIC hata asıl20s ürün codec timeout kaynaklı,30s Vitest override değil. Ürün sınırı korunur; gereksiz60s medya test değişikliği geri alınır. Tekrar HEIC ve genel süit ayrıca doğrulanır. Typecheck/lint başarılı; production build ve46 E2E devam ediyor.
Task20: Ruling: kaynak uygulama bitmişken bağımsız son inceleme salt okunur olarak uzun regresyon koşusuyla paralel başlatılır — testler ayrı kaynak/DB kullanır, son tamamlanma tüm doğrulamalardan sonra kaydedilir — maliyet: testte yeni kaynak düzeltmesi çıkarsa aynı incelemenin görmediği değişiklik yalnız TDD ile denetlenir.

Final review264773b..f5e447c: Critical0, Important6, Minor0. Fix pass: atomic public snapshot, reopened expired/closed withdrawal, completed2026 archive/finalists, immutable published slug, public pagination, editor searchable/paged teams+media and selected-team members. No second review. Deferred boundaries: worker21, Wallet22, deployment logs/WAF/capacity, legal retention, manual bearer identity delivery, solo full games, DBA immutability triggers, backfill for nonzero production, recovery/abuse hardening, old countdown rerun, finalpreview/mobile and generated fullsnapshots. Each boundary ruling follows with costs at final closure.

Final: Ruling: yayın sonrası slug değişikliği engellenir; redirect alias yerine kalıcı ilk yayın adresi korunur — eski paylaşılan adres başka oyuna geçirilemez — maliyet: isim/adres değişiminde yeni slug için ayrıca yönlendirme tasarımı gerekir. Doğrulanmış2026 derece+URL, tam kişisel yayın geri çekilse de kaynak faktı olarak arşivde kalır; kişisel adlar yalnız tam published DTO üzerinden gelir — maliyet: tam oyun yayını kapatmak tarihî derece gerçeğini kaldırmaz.

Final fixes targeted GREEN11/11(.local/task20-review-green2.log); type3 başarılı. Lint yalnız eski lte importunu bildirdi, kaldırıldı. Yeni full verbose koşusu gerçekHEIC2 başarılı ve snapshot/withdrawal regresyonları başarılı; kalan süit/E2E bekleniyor. Teknik rıza sınırı belgelendi: bearer daveti elde eden yönetici dahil kişi kullanabilir; panel adına rıza kutusu yoktur fakat gerçek sahibine teslim ayrı kimlik kanıtı değildir.

Final: Ruling: worker stale revision uygulaması21 ve gerçek Wallet sağlayıcı üretimi22 kapsamında kalır — bu tur revision/job ve aktif uygunluk temeli denetlenir — maliyet: worker/sağlayıcı kabulüne kadar cihaz kartı teslimi yok.
Final: Ruling: canlı proxy/CDN log redaction, WAF ve VDS kapasite kabulü dağıtımda yapılır; KVKK retention süresi işletme/hukuk tarafından seçilir — yerel test canlı sistem/hukuk kanıtı değildir — maliyet: gerçek kişisel veri ve üretim açılışından önce bu dış kabul gerekir.
Final: Ruling: private consent bearer davetinin gerçek kişiye güvenli teslimi manuel yönetici sorumluluğudur; panel rıza üretmez fakat token sahibinin kimliğini ayrıca kanıtlamaz — plan dışı kimlik sağlayıcısı eklenmez — maliyet: yanlış teslim/ayrıcalıklı yöneticinin token kullanması teknik olarak engellenmez.
Final: Ruling: takımsız solo tam oyun yayını eklenmez —20 tam yayın onaylı takım ister — maliyet: solo oyun yayımlaması için yeni ürün akışı gerekir.
Final: Ruling: approval geçmişi uygulama yolunda append-only; DBA müdahalesine ek immutability trigger eklenmez. Migration backfill ana DB kişisel kayıt0 varsayımını korur — ayrıcalıklı SQL/önceden kişisel veri kapsam dışında — maliyet: DBA geçmişi değiştirebilir; dolu başka üretim için backfill tasarlanmalıdır.
Final: Ruling: private kart kurtarma ve kapsamlı üretim abuse katmanı bu tur eklenmez — minimum erişim/CSRF/scoped rate kontrolü korunur — maliyet: kayıp private bağlantı geri alınamaz ve üretim abuse kabulü ayrıca gerekir.
Final: Ruling: değişmemiş2027 sayaç E2E dahil tekrar koşulur; son local preview/mobil kanıtı yürütücü tarafından yapılır. Generated snapshot JSON mekanik sayılır, SQL/journal/schema alignment incelenir — maliyet: eski kodun ve tüm snapshot satırlarının yeni derin denetimi yok.
Final: minor (deferred): yok; bağımsız reviewer kozmetik bulgu üretmedi.

Final: fixed P1 farklırevision public DTO — kontrollü sorgu arası gerçek owner onayı RED→GREEN, singleSQL snapshot, full220/220.
Final: fixed P2 reopened expired/closed withdrawal — saklanan davet GET/DTO+geriçekmeUI RED→GREEN, full220/220.
Final: fixed P3 tamamlanmış2026 ve finalist arşivi — tam kayıt tarihî degree projection ve gerçek finalist sorgusu RED→GREEN, full220/220; browser archive bağlantısı finalE2E kapsamı.
Final: fixed P4 paylaşılan slug — yayın sonrası değiştirme RED→GREEN, migration0017 slugLocked kalıcı, full220/220.
Final: fixed P5 public100 sınırı —105 uygunsuz+26 geçerli oyun, eligibility LIMIT önce/cursor sayfaları RED→GREEN, full220/220.
Final: fixed P6 editor100/600 seçenek sınırları —106 takım,105 kapak ve602 üye fixture testleri RED→GREEN, seçili kayıt korunur/üyeler takım bazlı, full220/220.
Final verification: .local/task20-final-tests.log30dosya220/220. typecheck başarılı; lint tekrar temiz(.local/task20-final-lint.log). migrate0017 başarılı, db:check başarılı. Mobil390px .local/task20-public-game-mobile.png incelendi; finalproductionE2E bekleniyor. Önceki full44/46: logo testi eski alt rolü bekliyordu ve tamamlanan oyun arşivden düşüyordu; yeni testler görünür dekoratif logo/gerçek finalist akışıyla düzeltildi.

Task20: complete (commits abf7c1e..65b97fd) — oyun taslak/önizleme/yayın, onaylı yayın adları, finalist/derece, kalıcı URL, arşiv+sayfalama uygulandı. RED eksik modül ve8 review regresyonu; GREEN full30dosya220/220. FinalProductionTLS45/46; aynı anda yerel dev derleme sırasında kart testi toplam60s doldu; önizleme durdurulup kaynak değiştirilmeden card-states2/2(31.8s) geçti. Oyun2/2 ve arşiv3/3 son genel koşuda geçti. Typecheck/lint/build/migrate0017/db:check/sır taraması temiz. Önceki fail logları saklandı, başarıya çevrilmiş sayılmaz; nihai hak kontrolleri gerçek tekrar kanıtıyla kapanır. Important6 tekTDDfix pass içinde kapandı; Minor0. Kullanıcının yerel çalışma düzeni ve mevcut branch korundu; yeni dış dağıtım yok.

Görev18–20 final preview: session83753/listener34473, /ulujam200 ve /oyunlar200; invalid consent404, private probe dev logda yok. Ana DB kişisel tablolar0,2026 üç URL/NULL alanı değişmedi, test DB/media artığı0. Next dev kendisinin ürettiği next-env.d.ts dev type yollarını yeniledi; elle değiştirilmedi, mevcut yerel çalışma düzeniyle kaydedilir. Sonraki görev öncesi yalnız bu proje cwd'si doğrulanmış preview süreci durdurulacak. Kabul raporu docs/operations/tasks-18-20-acceptance.md.

3 Ekim2026 — Görev21–23 başlangıç BASE4e43097. Plan/global kısıtlar ve mimari Wallet/iş güvenilirliği okundu; mevcut development/bootstrap checkout temiz. Cwd doğrulanmış Next preview34467 durduruldu. Görev23 gerçek issuer/test hesabı için güvenli yapılandırma bilgisi soruldu; eski Wallet secrets içeriği okunmaz.
Pre-flight21→22→23: enqueue UUID-only payload/current card revision; worker22 syncPassRevision çağıracak,23 Google adapter buraya bağlanacak. Mevcut wallet DB status ready, ürün active anlamı; UI active ile DB ready dönüşümü açık tutulacak. media.deleted için gerçek storage cleanup; game.credit_changed zaten transaction içinde kart revizyonlarını üretir.
Task21: Ruling: önceki görevlerle aynı geliştirme dalı/checkout ve docs/operations/progress.md ledger kullanılır — kullanıcının klasör/yerel preview çalışma düzeni korunur — maliyet: ayrı worktree izolasyonu yok; unrelated değişiklik çıkarsa korunmalı.
Task21 RED: outbox/worker testleri eksik claim-job/handlers modüllerinde başarısız(.local/task21-red.log). Lease fencing için jobId yanında owner+attempt capability gerekir.
Task21: Ruling: complete/retry jobId-only yerine claim owner+attempt alır — süresi dolmuş işçi yeni sahibin işini bitiremez — maliyet: dahili API çağıranlar claim nesnesini saklamalı. İşler en güncel DB kaydını okur, bilinmeyen type başarısız/dead-letter olur; game.credit_changed transaction kart invalidation tamamlandığı için acknowledgment-only.
Task21 GREEN5/5(.local/task21-green.log),typecheck/lint temiz. Değişen worker/queue/route/test dosyaları ve diff okunur; media deletion isteğine20s abort eklenir, sır taşıyan hata/payload reddi denetlendi. Full-suite/build ve ayrı süreç one-shot kanıtı bekleniyor.
Task21 subprocess RED: Node24 strip-only parameter property JobError constructor desteklemiyor(.local/task21-subprocess.log). systematic-debugging: Vitest dönüştürücü gizli uyumsuzluğu örtmüş; sınıf alanı+assignment yapılır, runtime ayarı değiştirilmez; gerçek ayrı süreç yeniden denenir.
Task21: complete (BASE4e43097) — transaction rollback/dedup, concurrent claim,120s lease fencing,5attempt retry/dead-letter,system_admin+CSRF manuel retry ve ayrı worker süreci uygulandı. Eksik modül RED ve gerçek Node parameter-property RED→GREEN; son full32dosya225/225(.local/task21-full2.log); subprocess2/2,typecheck/lint/build temiz. İlk full224/225 başarısız koşu saklandı; düzeltilmiş full225/225 ile kapandı. Tüm yeni source/test/doc ve diff okundu; sır taraması commit öncesi yapılır. Yerel site görev sonunda yeniden başlatılır,22 başında durdurulur.
Task21 preview3705/listener37259 /ulujam200,22 başlamadan cwd doğrulanmış37251 durduruldu. Task22 BASE24bfa95. RED wallet-service modülü eksik(.local/task22-red.log).
Task22: Ruling: sağlayıcı ready DB durumu UI active olarak, desired revision ve ayrı synced_revision ile gösterilir — sağlayıcıya uygulanmamış güncelleme aktif başarı gibi görünmez — maliyet: additive migration gerekir. Anahtar/issuer yokken hak sahibi için tek pending pass kaydı açılabilir fakat dış nesne/link üretilmez; başvuru onayı olmayan kişide hiç pass açılmaz.
Task22 GREEN mevcut5/5; yeni outbox olmayan event-close sweep RED reconcileWalletBatch eksik(.local/task22-sweep-red.log). Worker20kart cursor sweep eklenir; sağlayıcı remote state ayrı kaydedilir, iptal komutunu gerçekten göndermeden remote revoked iddia edilmez.
Task22: Ruling: saklama/etkinlik kapanışı yeni outbox üretmese bile worker cursor sweep ile hakları yeniden denetler — sessiz zaman geçişleri iptalsiz kalmaz — maliyet: worker çalışırken sınırlı ek DB sorgusu; dış cihazda iptal gecikmesi olabilir.
Task22: complete (BASE24bfa95) — ortak Wallet uygunluğu,provider başına tek pass,desired/synced revision ve gerçek remote state,mobil durum ekranı,CSRF/private API ve20kart cursor sweep. RED eksik module+sweep→GREEN6/6; full33dosya229/229(.local/task22-full.log); productionTLS wallet-gate1/1+axe0(.local/task22-e2e.log),typecheck/lint/build,migrate0018–19/dbcheck temiz. Yeni source/test/doc dosyaları ve tüm diff incelendi; generated migration snapshots mekanik şema/journal uyumu denetlendi. Apple dış kimlik ve Google gerçek issuer kabulü bu görevin iddiası değil.
Task22 preview22561/listener37974 /ulujam200;23 öncesi cwd doğrulanmış37967 durduruldu. Task23 BASE3e93c11. Google resmi GenericObject/Class,RS256 saveJWT veOAuth service-account dokümanları okundu. Eski Wallet secrets okunmadı; yetkili issuer/test hesabı yanıtı henüz yok.
Task23 RED: google-adapter/google-service eksik(.local/task23-red.log). Runtime üretilmiş RSA anahtar/geçici0600 dosya ve kontrollü OAuth/Google HTTP transport ile gerçek DB/sunucu adapter testleri yazıldı; gerçek issuer kanıtı değildir.
Task23: Ruling: Save JWT yalnız mevcut Object ID taşır — saklanan eski link ACTIVE/isim/QR verisini yeniden yazamaz — maliyet: link oluşturulmadan nesne sağlayıcıda başarıyla hazırlanmış olmalı. Anahtar sadece depo dışı0600 RSA dosyadan server-only loader ile okunur; legacy Wallet secrets otomatik açılmaz.
Task23: Ruling: sağlayıcı hatası pass metadata ile commit edilir, kuyruk lease capability ile aynı transaction içinde retry/dead-letter olur — hata kaydı rollback ile kaybolmaz — maliyet: dış HTTP çağrısı boyunca etkinlik/kart kilidi tutulur; her HTTP15s sınırı, gerçek VDS kapasite ölçümü gerekir.
Task23 debug: ilk iki protokol testinde APP_URL/base env yoktu; fixture yüklemeyen googleProtocol güvenli loadEnvFile ekleyince3/3 geçti. Sweep RED3tekrar4HTTP — provider retry backoff'u doğrudan sweep çağrısı baypas ediyordu; sweep yalnız hak değişiminde card revision artırıp outbox yazacak, dış çağrı claim/retry yolunda kalır.
Task23: Ruling: zamanla değişen uygunluk cached kart durumunu değiştirirse sweep revision artırır ve card.changed üretir — aynı revision'a bağlı dead-letter/backoff baypas edilmez — maliyet: iptal dış etkisi sonraki worker batch'inde gerçekleşir.
Task23 GREEN13/13 ve full34dosya233/233(.local/task23-full.log). Derece pipeline ek regresyonu projection rank kapatılarak mutation RED(.local/task23-degree-red.log), gerçek publish/award/unpublish komutları ve eski işleri yeniden teslimle provider nesnesinin güncel ödülü doğrulanacak; adapter rank2 ve QR rotate zaten GREEN.
Task23 GREEN derece pipeline5/5(.local/task23-degree-green.log),full234/234,productionTLS47/47(.local/task23-e2e.log),typecheck/lint/build temiz. Runtime sentetik depo-dışı RSA key ile2731production dosyasısecretHits0(.local/task23-build-probe.log). Yeni slow-first-job RED hazır-claim batch içindeki ikinci card nesnesi oluşmadı(.local/task23-lease-red.log).
Task23: Ruling: batch sınırı korunur, lease her iş başlamadan tek tek alınır — yavaş ilk HTTP henüz başlanmamış işin lease'ini tüketmez — maliyet: batch başına birkaç ek DB claim transaction'ı.
Task23 implementation complete / external acceptance pending (BASE3e93c11) — Google Generic adapter,signed ID-only save link,HTTP404/409/revision,QR/derece güncelleme,iptal,private CSRF/UI ve server-only dış anahtar dosyası. Full34dosya235/235(.local/task23-full3.log),targeted11/11,typecheck/lint temiz; önceki production build+sentetik key paket2731file0leak veTLS47/47 kaynak lease güçlendirmesi öncesi geçti; finalreview sonrası güncel build/E2E yeniden doğrulanacak. Gerçek test Google hesabı/yayın erişimi sağlanmadı;23 üçüncü kutu açık ve tamamlandı sayılmaz. Her yeni source/test/doc ve diff incelendi. Son bağımsız21–23 inceleme hazır kaynak aralığında istenir, uygulama delege edilmez.
Task23 package RED: Google synthetickey scanner0hit fakat genelscannerforbiddenBuildFiles2: Next file tracing ham Media/IMG_1206.heic veIMG_0427.heic paketledi; secretFileHits0/stagedSecretHits0. Shell pipeline scanner başarısızlığında durmadığı için fd1c993 yerel commit oluştu; yayın/push yapılmadı. Kapanış iddiası engellenir, global tracing excludes+scanner forbiddenfiles eklenip yeniden build ile kanıtlanır. Googlekey scanner0 sonucu genelpaket kabulü yerine geçmez.
Task23 packaging GREEN: güncel production build temiz;2710dosyasecretHits0/forbiddenFiles0(.local/task23-package-clean.log),genel kaynak/build/staged taraması0. Tracing exclude kaynağı Next yerel output rehberi; ham medya/anahtar/env/scratch paket dışı. Final bağımsız inceleme aralığı4e43097..sonpackagingcommit olacak.
