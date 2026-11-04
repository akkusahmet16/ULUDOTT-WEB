# Sunum katmanı ilerleme kaydı — v0.2

## 21 Ekim 2026 — Plan denetimi ve revizyon 2

**Başlangıç commit'i:** b8578cf3546416dd88d8dc0c1cff81c59998caf7.
**Dal:** feat/unified-clean-v0.2.
**Yapılan iş:** GitHub #1, v0.1/v0.2/batu-try karşılaştırması; plan ve kural belgesi revizyonu. Uygulama kodu değiştirilmedi.

[Detaylı analiz](./2026-10-21-birlesik-plan-analizi.md) · [Revize plan](../design/2026-10-20-birlesik-uygulama-plani.md).

| Kontrol | Sonuç / kanıt |
|---|---|
| GitHub Issue #1 | Connector ile güncel gövde ve yorumlar okundu; açık, 0 yorum; yerel gövdeyle uyumlu. |
| Kaynak/migration diff'i | Batu 8, v0.1/v0.2 26 migration; ortak SQL dosyaları aynı. DB uygulanmışlık kanıtı değildir. |
| pnpm typecheck; pnpm lint | ERR_PNPM_UNSUPPORTED_ENGINE: yerel 11.25.0, gereken 11.19.0. Standart kapı geçmedi. |
| pnpm exec node --version | v24.21.0. Yönetilen runtime doğru; shell sürümüyle karıştırılmadı. |
| pnpm exec next typegen && pnpm exec tsc --noEmit | Çıkış 0. Geçici next-env.d.ts üretim farkı eski içeriğine kondu. |
| pnpm exec eslint . --max-warnings=0 | Çıkış 0. |
| pnpm exec vitest run tests/unit tests/security/cache.test.ts tests/operations/ci-gate.test.ts tests/operations/secret-scan.test.ts tests/operations/load-target.test.ts | İlk koşu 25 dosya, 131 test, 7.72sn. Belge düzenlemeleri sonrası tekrar 25 dosya, 131 test, 7.57sn; çıkış 0. Yalnız hedefli güvenli test kapsamı. |
| Belge doğrulaması | Yeni/değişen 5 belge bağlantıları ve whitespace kontrolünden geçti; ana planda 16 benzersiz iş kimliği, tamamlandı işareti 0. Kaynak/migration sayımları ana ajan tarafından tekrar doğrulandı. |
| Tam integration/E2E/build, DB sayımı, restore, Lighthouse ve baseline | Çalıştırılmadı; doğrulanmadı. |
| Kaynak bulgusu | Oyun görünürlük cache'inde event/team/application/expiry bağımlılık açığı; İş 0B önkoşulu. |

### Faz durumu

Bu tablo ilk denetimin tarihî durumudur; güncel 0A sonucu en alttaki nihai kabul kaydındadır.

| Faz | Durum |
|---|---|
| 0A — Ortam ve tam başlangıç kapısı | Açık; standart package manager uyuşmazlığı ve bütün kabul kontrolleri bekliyor. |
| 0B — Cache bağımlılık doğruluğu | Açık; kaynakta eksik bağımlılıklar bulundu, henüz kod düzeltmesi yapılmadı. |
| 0C — Deterministik sinematik baseline | Açık; yeni referans alınmadı. |
| 1–3 — Tema/rota/i18n | Başlamadı; planlandı. |
| 4–5 — Mevcut etkileşim/a11y/galeri/hata | Başlamadı; yalnız görsel kilidi koruyan işler planlı, yeni lightbox/ekran kapsam dışı. |
| 6 — Mevcut ürün akışı yeniden kabulü | Güncel tam kabul yok. |
| 7 — Performans/CI/teslim | Güncel tam kabul yok. |

**Operasyon sınırı:** DB/seed/migration/worker/uygulama sunucusu ve dış sağlayıcı başlatılmadı; canlı sistem ve GitHub değiştirilmedi. v0.1 kullanıcı değişiklikleri korundu. Bu kayıt geçmiş raporlardaki kabulü v0.2'nin bugünkü kabulü saymaz.

## 21 Ekim 2026 — Revizyon 3: kesin v0.1 görsel kilidi

Kullanıcı: “v0.1 teması ve görsel dili vs. asla değişmemeli.”

- Ana plan, kurallar, analiz ve üst klasör giriş belgesi bu taleple eşitlendi.
- Görsel doğruluk kaynağı v0.1'in mevcut çalışma hâlidir; v0.2 teknik uygulama tabanıdır.
- Renk/font/ölçü/yerleşim/görsel/ikon/animasyon ve mobil/özel/admin görünümü korunur; a11y/perf/i18n/Issue gerekçesiyle otomatik istisna yoktur.
- Yeni dil seçici/noscript formu, lightbox, farklı hata tasarımı ve iletişim form bölümü kapsamdan çıkarıldı. İş 6B aktif uygulama adımı değildir.
- Başlangıç görsel referansı v0.1'e sabitlenecek; görsel farklar maskeyle/eşikle veya baseline yenileyerek kabul edilmeyecek.
- Bu güncelleme yalnız belgedir; uygulama kodu/görseller/stiller ve canlı sistem değiştirilmedi. Önceki 131 test sonucu tarihî kayıttır; bu tur yeni uygulama testi çalıştırılmadı.

### Sonraki her işte doldurulacak kanıt

- İş kimliği, tarih, hedef commit ve dosya diff'i.
- Kullanılan tam Node/pnpm/Chromium sürümü, DB/S3/port/build izolasyonu.
- Önce başarısız hedefli test ve neden; sonraki başarılı test/komut/çıkış özeti.
- Standart faz kapıları ve üretim build rota tablosu.
- Görsel/trace/Lighthouse artifact yolları.
- Kapsam istisnası, dış bağımlılık, açık karar ve geri dönüş noktası.

## 21 Ekim 2026 — İş 0A uygulaması: başlangıç kanıtı

Kullanıcı ilk adımı başlattı. [Ayrıntılı 0A kabul raporu](./2026-10-21-faz-0a-baslangic-kabulu.md) ve [.local/phase-0a/results.jsonl](../../.local/phase-0a/results.jsonl) tam kanıtı taşır. 0B, 0C ve Faz 1 başlatılmadı.

- Frozen lockfile kurulumu Node 24.21.0 / pnpm 11.19.0 ile geçti; bağımlılık veya global ayar değişmedi.
- 114 public görsel dosyası v0.1 ile aynı hash; eksik aktarım yok. Render/piksel kabulü henüz 0C'de yapılmadı.
- Çalışma DB'si salt okunur doğrulandı: PostgreSQL 17.10, 47 tablo, 26 migration; yapay başvuru/takım/kart yok. 2026/2027 ve üç derece oyunu izinli kaynak envanterine uyuyor.
- Ayrı geçici S3 konteyneri/bucket/anahtarları ve UUID DB'lerle çalışıldı; mevcut nesne deposuna dokunulmadı.
- Test yardımcısında URL query parametresiyle DB yönlenme açığı kırmızı→yeşil düzeltildi; yeni gerçek regresyon testi yalnız bağlantı kimliğini SELECT ile okur.
- HTTPS cookie varsayımlı admin-auth testinin ortamı test dosyası içinde sabitlendi; güvenlik beklentileri ve uygulama auth kodu değişmedi.
- Tam paket 380/380; ayrı integration 226/226; güncel typecheck/lint, db:check ve kaynak sır taraması geçti.
- Üretim build'i geçti; 77 rota dinamik. Önceden bilinen Wallet dosya izleme uyarısı sürüyor; paket taraması 3224 dosyada 0 sır/0 yasak dosya buldu.
- Üretim TLS ilk tam koşu 70 geçti / 30 başarısız / 2 HTTP senaryosu atlandı; sabit Origin düzeltmesi sonrası tam koşu 81 geçti / 19 başarısız / 2 HTTP senaryosu atlandı. HTTP senaryoları ayrıca 2/2 geçti. Güncel v0.1 sözleşmesine göre test düzeltmeleri ve son tam koşu aşağıdaki kapanış kaydında sonuçlandırılır. 0A henüz kabul edilmedi.

## Faz 0 başlangıç — üretim build rota tablosu

| Rota | Sınıf |
|---|---|
| / | Dinamik |
| /_not-found | Dinamik |
| /admin | Dinamik |
| /admin/basvurular | Dinamik |
| /admin/basvurular/[submissionId] | Dinamik |
| /admin/check-in | Dinamik |
| /admin/etkinlikler | Dinamik |
| /admin/formlar | Dinamik |
| /admin/formlar/[formId] | Dinamik |
| /admin/galeri | Dinamik |
| /admin/iletisim | Dinamik |
| /admin/linkler | Dinamik |
| /admin/medya | Dinamik |
| /admin/oyunlar | Dinamik |
| /admin/oyunlar/[gameId] | Dinamik |
| /admin/people | Dinamik |
| /admin/sistem | Dinamik |
| /admin/takim-arayanlar | Dinamik |
| /admin/takim-onaylari | Dinamik |
| /admin/ulujam | Dinamik |
| /admin/ulujam-arsivleri | Dinamik |
| /admin/ulujam-formu/[eventId] | Dinamik |
| /api/admin/approvals | Dinamik |
| /api/admin/assignments | Dinamik |
| /api/admin/check-in | Dinamik |
| /api/admin/contact-settings | Dinamik |
| /api/admin/csrf | Dinamik |
| /api/admin/events | Dinamik |
| /api/admin/forms | Dinamik |
| /api/admin/forms/[formId] | Dinamik |
| /api/admin/gallery | Dinamik |
| /api/admin/game-catalog | Dinamik |
| /api/admin/games | Dinamik |
| /api/admin/games/[gameId] | Dinamik |
| /api/admin/links | Dinamik |
| /api/admin/login | Dinamik |
| /api/admin/logout | Dinamik |
| /api/admin/media | Dinamik |
| /api/admin/outbox/[jobId]/retry | Dinamik |
| /api/admin/people | Dinamik |
| /api/admin/session | Dinamik |
| /api/admin/session/renew | Dinamik |
| /api/admin/site-assets | Dinamik |
| /api/admin/submissions | Dinamik |
| /api/admin/submissions/[submissionId] | Dinamik |
| /api/admin/submissions/[submissionId]/files/[fileId] | Dinamik |
| /api/admin/submissions/export | Dinamik |
| /api/admin/teams/access | Dinamik |
| /api/admin/ulujam-archives | Dinamik |
| /api/admin/ulujam-settings | Dinamik |
| /api/cards/publication-consent | Dinamik |
| /api/forms/[formSlug]/submit | Dinamik |
| /api/forms/csrf | Dinamik |
| /api/links/[id]/qr | Dinamik |
| /api/submissions/receipt | Dinamik |
| /api/team/login | Dinamik |
| /api/team/logout | Dinamik |
| /api/ulujam/apply | Dinamik |
| /api/ulujam/teams | Dinamik |
| /api/wallet/google/[cardToken] | Dinamik |
| /api/wallet/status | Dinamik |
| /basvuru/[formSlug] | Dinamik |
| /etkinlikler | Dinamik |
| /etkinlikler/[slug] | Dinamik |
| /hakkimizda | Dinamik |
| /iletisim | Dinamik |
| /kart/[token] | Dinamik |
| /l/[id] | Dinamik |
| /makbuz | Dinamik |
| /media/[variantId] | Dinamik |
| /oyunlar | Dinamik |
| /oyunlar/[slug] | Dinamik |
| /robots.txt | Dinamik |
| /sitemap.xml | Dinamik |
| /takim/[token] | Dinamik |
| /ulujam | Dinamik |
| /yayin-onayi/[token] | Dinamik |

## 21 Ekim 2026 — İlk 0A kapanış kaydı (tarihî)

**Durum:** Ortam/envanter doğrulandı, tam kabul açık. Hedef dal/HEAD değişmedi. v0.1 ve v0.2 uygulama/tema/görsel kaynakları korunuyor. [Tam kabul raporu ve engeller](./2026-10-21-faz-0a-baslangic-kabulu.md).

| Güncel kanıt | Sonuç |
|---|---|
| pnpm test | 78 dosya / 381 geçti, çıkış 0. Yeni gerçek ham TCP/HTTPS kapanış regresyonu dahil. |
| pnpm test:integration | 43 dosya / 226 geçti, çıkış 0. |
| pnpm typecheck / lint | Son test yardımcısı değişiklikleri dahil geçti. |
| pnpm build | Geçti; 77 dinamik rota; mevcut Wallet tracing uyarısı kayıtlı. Ürün kaynağı daha sonra değişmedi. |
| pnpm db:check / security:source / security:wallet | Geçti; son kaynak taraması 805, üretim paketi 3224 dosyada 0 sır/0 yasak dosya. |
| Son tam üretim TLS içerik E2E | 93 geçti / 7 başarısız / 2 mevcut HTTP koşullu atlama, çıkış 1. |
| HTTP localhost/127.0.0.1 ek koşu | 2/2 geçti; üretimde koşullu atlanan senaryolar ayrıca doğrulandı. |
| Son yaşam döngüsü düzeltmesi | Test proxy'leri önce kapanır; iptal upstream'e aktarılır; kendi uygulama süreci sonra durur. Ham TLS soketleri de kapanır. Assertion/test gövdesi süreleri değişmedi. |
| Son 13 üretim TLS senaryosu + kaynak temizliği | 13/13 geçti, 36.7sn, çıkış 0; yeni DB/standalone klasörü yok, dokuz eski DB'nin kümesi korundu. |
| Çalışma DB'si / kaynak | Önce/sonra 47 tablo ve 26 migration aynı; editoryal kontroller doğru. v0.1 646 dosya ve v0.2 src/public 495 dosyada değişiklik 0. |
| Ortamı geri bırakma | Yalnız sahipliği kayıtlı sekiz geçici DB/standalone klasörü ve kendi geçici S3 konteyneri temizlendi. Eski dokuz DB/volume korundu; PostgreSQL ve Colima başlangıçtaki durmuş hâlde. |

Açık yedi senaryo: admin-operations (1), form-builder (1), games (1), link-hub (1), supplied-media (2 genişlik), ulujam-years eski galeri (1). Kayıtlar ve kabul çözümü rapordadır. 0A yeşil sayılmaz; 0B/0C/Faz 1 başlamaz. Bağımsız inceleme yeni test girdileri ve yaşam döngüsü düzeltmelerinde açık bulgu bırakmadı.

## 21 Ekim 2026 — Devam ve 0A nihai kabulü

**Durum: 0A kabul edildi.** Yedi engel giderildi. 0B, 0C ve Faz 1 başlamadı. [Güncel kabul, kapsam eşlemesi ve bütün kanıtlar](./2026-10-21-faz-0a-baslangic-kabulu.md#devamın-nihai-kabulü).

- Tek üretim değişikliği: FormBuilder key'i revision yerine form id'si. Sunucu yenilenince mevcut başarı mesajı korunuyor; DOM, stil, metin, iş kuralı ve v0.1 değişmedi. Regresyon önce kırmızı, sonra aynı testte yeşil; tekrar kayıt/durum değişimi/yenileme doğrulandı.
- Eski mobil filtre, eski galeri slotu, eski sabit Coffee Talk kartı ve kullanılmayan arşiv finalist bölümü güncel v0.1 kontrollerine/sahipli fixture'lara eşlendi. Link yönetimi kısa URL/QR ve contact-settings footer ayrı testlerdir. Güvenlik, rıza, geri çekme, yayın, gerçek mutasyon, a11y ve taşma kapsamı korunuyor; eşleme kabul raporunda.
- Genel paket: 78 dosya / 381 geçti. Ayrı entegrasyon: 43 dosya / 226 geçti; genel paketin alt kümesi.
- Tam üretim TLS E2E: 101 geçti / 0 başarısız / HTTP'ye özgü 2 mevcut koşullu atlama; 170.7sn, çıkış 0. HTTP localhost/127.0.0.1 ek koşusu 2/2 geçti. Toplam 103 farklı senaryo uygun ortamında yeşil; test silinmedi/atlanmadı veya süre/eşik yükseltilmedi.
- typecheck, lint, config:check, db:check, build ve bağımlılık audit'i geçti. Derleme 9.3sn, 77 dinamik rota; mevcut Wallet tracing uyarısı kayıtlı. Kaynak 805 / paket 3227 dosyada 0 sır/0 yasak dosya. next-env.d.ts özgün hâline döndü, ardından tsc geçti.
- Çalışma DB'si 47 tablo/26 migration ve izinli editoryal kayıtlarla aynı. Eski dokuz test DB'sinin tam kümesi korundu; yeni DB, standalone klasörü ve başka istemci bağlantısı 0. [Kaynak temizliği](../../.local/phase-0a/followup-resource-audit.json).
- v0.1 manifestteki 646 dosya aynı. v0.2 src/public 494/495 aynı, tek fark yukarıdaki key satırı. Public 114/114, 11 stil, 6 font, 95 görsel, 15 video aynı. Manifest dışındaki önceden mevcut metadata/iki güvenlik testi için başlangıç bayt eşliği iddia edilmez. Piksel kabulü hâlâ 0C'dir.
- Bağımsız son incelemede açık Critical/Important bulgu yok. Tam komut/çıkış/süre özeti [followup-verification.json](../../.local/phase-0a/followup-verification.json) içindedir. Push/merge/dağıtım yapılmadı.

**Sıradaki iş:** 0B cache bağımlılıklarını kırmızı→yeşil kanıtla kapatmak; ardından 0C görsel referansı. Faz 0 bütünü henüz tamamlanmadı.

## 22 Ekim 2026 — 0B nihai kabulü

**Durum: 0B kabul edildi.** [Bağımlılık matrisi, karar, regresyonlar ve kanıt](./2026-10-22-faz-0b-cache-kabulu.md). 0A kabulü korunuyor; 0C ve Faz 1 başlamadı.

- Hassas oyun liste/detay, tarihî sonuç ve varsayılan arşiv okumaları mevcut SQL/service üzerinden cache dışında yapılıyor. Etiketler tek başına DB saati ve worker değişimlerini karşılamadığı için planın bu seçeneği uygulandı. Genel katalog 30sn cache'i, Date/DB+APP_URL ayrımı ve COMMIT sonrası invalidation sözleşmeleri korundu.
- Gerçek DB/rıza/kadro/retention ile 12 regresyon önce başarısız, sonra yeşil. Gerçek üretim iptal koşusunda eski ad/başlık, 404 yerine 200 ve eski derece kartı kırmızı doğrulandı; düzeltme sonrası kayboluyor. Kayıtlı editoryal arşiv bağımsızlığını koruyor.
- Normal takım için gerçek anonim başvuru/onay/yayın → takım reddi → ilk HTTP okumasında gizleme ve menüden NextLink ile geri dönünce eski adın gelmemesi geçti. Batu sayaç referansı güncel giriş ve sahipli yıl fixture'ıyla standart E2E listesinde geçti; sayaç uygulaması değiştirilmedi.
- Genel paket 79 dosya / 393; ayrı entegrasyon 44 dosya / 238 geçti. Entegrasyon genel paketin alt kümesidir.
- Son tam üretim TLS E2E 105 geçti / 0 başarısız / 2 mevcut HTTP koşullu atlama, 164.9sn. HTTP ek koşusu 2/2, 11.9sn; toplam 107 farklı senaryo uygun ortamında yeşil.
- build 10.7sn, 77 dinamik rota; mevcut Wallet tracing uyarısı kayıtlı. typecheck/lint/db/config/audit, 810 kaynak / 3230 paket dosyasında sır/yasak dosya taraması geçti. next-env.d.ts geri konduktan sonra tsc de yeşil.
- 0A sonrasına göre src/public 495 dosyada yalnız public-queries.ts ve cache/tags.ts değişti. v0.1 manifestteki 646 dosya ve public 114 dosya aynı; tema/DOM/stil/varlık değişikliği yok.
- Çalışma DB'si 47 tablo/26 migration ile aynı. Dokuz eski test DB'sinin tam kümesi korundu; yeni test DB'si, standalone klasörü ve başka istemci bağlantısı 0. Geçici S3 kaldırıldı, PostgreSQL ve Colima başlangıçtaki durmuş hâline döndü.
- Bağımsız son incelemede açık Critical/Important bulgu yok. Push/merge/dağıtım yok. [Komut özeti](../../.local/phase-0b/verification.json).

**Sıradaki iş:** 0C — v0.1'e sabitlenmiş deterministik görsel ve davranış referansı. Faz 0 bütünü için bu kabul hâlâ gerekli.

## 3 Kasım 2026 — Devir notu (çalışma klasörü: yedek-v0.2-20261102)

Bu oturumdan itibaren tek çalışma klasörü `yedek-v0.2-20261102`dir; orijinal klasörlere dokunulmaz. Faz 1 başlamadı; **0C açık**.

### Yapılan ve kanıtı

- **Commit'ler (bu klasörde):** `dae902d` 0A (26 dosya), `19ad112` 0B (7), `08b4324` 0C altyapı (30), `090737c` belgeler (7), `5427877` rapor hash düzeltmesi (1). Tag `faz-0ab-kabul` → `090737c`. Baseline PNG'ler ve `.portfolio/` `.git/info/exclude` ile commit dışıdır. Hiçbir commit'te `git add .` kullanılmadı; push yok.
- **Kaynak özeti:** manifest `source.digest` ve v0.1'den `createSourceManifest` ile hesaplanan değer ikisi de `2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80` (eşit). Raporda üç satırda `...338ea6e186...` yazılmıştı; düzeltildi.
- **Dondurulmuş referans:** manifestteki beş sahnenin PNG SHA-256 değerleri diskteki dosyalarla eşit.
- **v0.1 dokunulmazlığı:** Adım 3 öncesi/sonrası dosya hash listesi ve `git status` farkı 0 satır (`.local/phase-0c/step3/`).
- **Fark ölçümü** (2560×1600, doğru RGB okumasıyla, mevcut tanı çıktılarına karşı): degree-3 97 piksel (en büyük kanal sapması 4); places-heading 1.430.865; place-cafes 1.658.588; place-venues 1.769.402; cafes-hover 859.580 (sapmalar 184–250). Sayılar önceki resmî kayıtlarla aynı.

### Düzeltmeler ve doğrulanmayanlar

- `.local/phase-0c/step4/*-diff.png` hatalıdır (PNG 3 kanallı, 4 kanal varsayılmıştı); kullanılmaz. Sahne yorumları görsele bakılarak doğrulanmadı.
- **Yeni yakalama yapılmadı.** 5 sahnenin v0.1'den 3 kez yeniden kaydı ve dört mekân sahnesinin tam boş profil akışında 2 kez kaydı **çalıştırılmadı: doğrulanmadı.** Kullanılan hash'ler eski tanı koşularından gelir.
- Boş profilin 84 sahnesi hiç koşmadı. `playwright.visual.config.ts` içindeki `maxFailures: 0` Playwright 1.63.0 tiplerine göre "sınır yok" demektir; config değişikliği gerekmez. Büyük olasılıkla neden `scripts/visual-cinematic.ts` içindeki `run()` fonksiyonunun sıfır olmayan çıkış kodunda hata fırlatması ve profil döngüsünü durdurmasıdır. Bu kod okumasına dayanır; **çalıştırılarak doğrulanmadı.**
- **Ortam farkı:** manifest Chromium 153.0.8010.12 / revizyon 1243; yerelde yalnız `chromium-1248` kurulu. Bugün 1243 ile görsel koşu yapılamaz. Capture girdi hash'leri (21) ve `pnpm-lock.yaml` manifestle aynı.
- **Çelişkili kanıt (doğrulanmadı):** `.local/phase-0c/CURRENT.md` çalışma notlarında 23 Ekim tarihli ara denemelerde sorunlu mekân sahnelerinin referansla sıfır fark verdiği yazılmış olsa da, bu iddia bağımsız log ve kalıcı görsel kanıtlarla doğrulanmamıştır (doğrulanmadı).

### Açık kalanlar

0C'nin 647 genel + 26 özel sıfır-fark kapısı; boş profil; 5 sahne uyuşmazlığının nedeni; Chromium 1243 yokluğu; `visual-cinematic.ts` profil döngüsü davranışı; son kaynak/DB/güvenlik denetimleri.

### Sıradaki adım

Kullanıcı kararlarından sonra: (1) Chromium 1243 kurulumu (ağ gerekir) veya farkın kabul edilip belgelenmesi; (2) `visual-cinematic.ts` döngüsünün hata listeleyip devam eden hâli (önce kırmızı test; eşik sıfır kalır); (3) 5 sahne ve boş profil için yeni yakalamalar; (4) referans yenileme kararı yalnız kullanıcıya aittir.

### Bekleyen kararlar

- Chromium 1243 indirilsin mi?
- Betik değişikliği uygulansın mı?
- Referans yenileme (yalnız kullanıcı "referansı güncelle" derse).
