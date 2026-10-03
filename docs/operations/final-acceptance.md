# Son kabul matrisi — 3 Ekim 2026

Bu dosya görev28–29 yerel teslimini ve ürünün açık kabul kapılarını birlikte gösterir. “Yerel geçti” internet yayını/sağlayıcı/hukuk/manuel ekran okuyucu kabulü anlamına gelmez. Mimari öneri bütün modülleri kapsar; aşağıda kapsamdan çıkarılan satır yoktur. Görev24 ertelenmiş kapsam olarak açıkça durur.

| Görev | Gereksinim | Kaynak (`src/`, belge için `docs/`) | Kanıt (`tests/`, rapor için `docs/operations/`) | Durum |
|---|---|---|---|---|
| 1 | Kurulabilir Node/pnpm/Next, server-only sınırı | config/server; next.config; Dockerfile | integration/bootstrap; e2e/bootstrap | Yerel geçti |
| 2 | Boş PostgreSQL, FK/unique/transaction/audit omurgası | db/schema; db/migrations; lib/database | integration/schema; operations/backup-restore | Yerel geçti |
| 3 | Admin MFA, rol/eventScope, recovery/session/CSRF | modules/admin; lib/auth | integration/admin-auth; security/authorization | Yerel geçti; gerçek admin ataması işletme girdisi |
| 4 | Marka/tokens/logo, responsive/keyboard/reduced-motion | styles; components; app/layout | accessibility/shell; e2e/navigation | Otomatik/klavye geçti; gerçek ekran okuyucu açık |
| 5 | Özel orijinal, HEIC/EXIF/optimize media ve alt metin | modules/media | integration/media; e2e/media | Yerel geçti; gerçek fotoğraf yayın uygunluğu açık |
| 6 | Etkinlik/duyuru/afiş/zamanlama/redirect/SEO/anasayfaCTA | modules/events; modules/announcements | integration/publication; e2e/featured-event | Yerel geçti; gerçek tarih/konum açık |
| 7 | Link merkezinde verifiedURL/kategori/sıra/QR/kopyala | modules/links; lib/security/url-policy | integration/links; e2e/link-hub | Yerel geçti; toplulaştırılmış tıklama ölçümü opsiyonel, etkin değil |
| 8 | 2026 üçURL, kişiselsiz idempotent editoryal seed | db/seeds/2026-results; modules/games | integration/historical-results; e2e/2026-results | Yerel geçti; bilinmeyen ad/ekip/credits boş |
| 9 | Yıllar/2027 Yakında/gerçek tarih sayaç,2026 galeri | modules/events; modules/media; db/seeds/ulujam-coming-soon | integration/ulujam-archive; e2e/ulujam-years | Yerel geçti; gerçek galeri/finalist girdisi açık |
| 10 | 15 alan/AST/sunucu validation/değişmez snapshot | modules/forms/domain; db/migrations | unit/form-conditions; integration/form-versions | Yerel geçti; dosya alanı açıkça kapalı |
| 11 | Form paneli/yeni sürüm/önizleme/yayın/pencere | modules/forms/application; modules/forms/ui | integration/form-service; e2e/form-builder | Yerel geçti |
| 12 | Atomik submit/capacity/waitlist/duplicate/idempotency/receipt | modules/forms/application | integration/form-submit; e2e/public-form | Yerel geçti; opsiyonel eposta teyidi sağlayıcı açık |
| 13 | Başvuru arama/filter/cursor/export/status/retention | modules/forms; worker/retention | integration/submission-admin; e2e/submission-admin | Yerel geçti |
| 14 | CoffeeTalk gerçek etkinlik formCTA/kapanış, generic ayrımı | modules/events; modules/forms | integration/coffee-talk; e2e/coffee-talk | Yerel geçti; gerçek tarih/konum yok |
| 15 | UluJam zorunlu telefon/skill1–5/not/dört mod, oyuncuadı yok | modules/applications/domain/ulujam-input | unit/ulujam-input; e2e/ulujam-form | Yerel geçti |
| 16 | Normalize eposta/event, takım kur/join atomik sonkontenjan | modules/applications/application/submit-ulujam; modules/teams | integration/ulujam-application; integration/team-capacity | Yerel geçti |
| 17 | Takım parola/hash/reset/token/session/izolasyon/oyuntaslağı | modules/teams; modules/games | integration/team-access; e2e/team-page | Yerel geçti |
| 18 | Güncel kadro/solo/seeking onayı/ret/geç üye yeniden onay | modules/teams/application/approval-service; modules/cards | integration/approvals; e2e/approvals | Yerel geçti |
| 19 | Skill önerisi+gerekçe, scopedboard ve atomik atama | modules/matching | unit/recommendation; integration/assignment; e2e/seeker-board | Yerel geçti; otomatik team ataması yok |
| 20 | Sonuç/finalist/ranktekillik ve creditsrıza/yayın adı | modules/games | integration/game-publication; e2e/games | Yerel geçti; doğrulanmış editoryal bilgiler açık |
| 21 | Onaylı kişikartı/webcapability/iptal/check-in | modules/cards | integration/card-access; integration/check-in; e2e/card-states | Yerel geçti; gelecekte iOS+WalletQR silme ayrı |
| 22 | Outbox/lease/retry/dead/idempotency/revision/reconcile | lib/queue; worker; modules/wallet | integration/outbox; integration/worker-retry; load/wallet-queue | Yerel geçti |
| 23 | GoogleGeneric Class/Object/JWT/404/demo-public ayrımı | modules/wallet/google; application/google-service | integration/google-wallet; e2e/wallet-gate; google-wallet-live-acceptance.md | Gerçek demo kabulü mevcut; public/device/offline açık |
| 24 | Applepkpass/imza/PassTypeID/APNs/registration/deviceupdate | db/schema/wallet; operations/apple-wallet.md | Üretim adapter ve cihaz kanıtı yok | Kullanıcı kararıyla ücretli hesap gelene kadar ertelendi |
| 25 | Scoped dashboard/istatistik/system health/auditretry | modules/admin; admin/sistem | integration/dashboard-scope; e2e/admin-operations | Yerel geçti; dış alarm/izleme tenant kabulü açık |
| 26 | NonceCSP/TLS/cache/CSRF/rate/Turnstile/origin/WAF | lib/security; proxy; infrastructure | security testleri; e2e/security-hardening | Yerel geçti; canlı widget/CDN/firewall açık |
| 27 | PII minimizasyon/deletion/consent/expiry/retention/KVKK sınırı | worker/retention; security/privacy-data-map.md | integration/data-retention; tasks-26-27-acceptance.md | Yerel geçti; veri sorumlusu/hukuk metni ve legalroutes açık |
| 28 | CI fail-stop/audit/secrets, k6 p95/p99/kayıpsızrace/queue | workflows/ci.yml; tests/load | operations/ci-gate; load-report; security-test-report; accessibility-report | Yerel geçti; gerçek ekran okuyucu/dış pentest/SLO/VDSyükü açık |
| 29 | Ortam/webworker/deploy/restore/rollback/changeguide/harita | Dockerfile; architecture/product/operations rehberleri | operations/backup-restore; fullCI; image smoke | Yerel kanıt; canlı sağlayıcı/bütçe/bölge/RPO/RTO açık |

## Aşama eşlemesi ve teslim dosyaları

Aşama1 görev1–9: [phase-1](phase-1-acceptance.md); aşama2 görev10–14: [phase-2](phase-2-acceptance.md); aşama3 görev15–19: [phase-3](phase-3-acceptance.md) ve [18–20](tasks-18-20-acceptance.md); aşama4 görev20–24: [phase-4](phase-4-acceptance.md) ve [21–23](tasks-21-23-acceptance.md), Apple24 ertelendi. Aşama5 görev25–29: [25](task-25-acceptance.md), [26–27](tasks-26-27-acceptance.md), [yük](load-report.md), [güvenlik](security-test-report.md), [erişilebilirlik](accessibility-report.md), [restore](backup-restore.md), [deploy](deploy.md), [rollback](rollback.md).

28 değişenler: workflows CI; package scripts/typegen; ci-check/prepare-ci/check-secrets/run-load; k6+harness; fail-stoptest; prod fixture afişi; üç rapor+pentestscope. 29 değişenler: web/workerDocker hedefleri ve allowlist/env yönergeleri; gerçekPG/S3 restore testi; mimari/ER/kararlar, ürünrota/rol/değişiklik, işletmedeploy/backup/rollback/admin/events/forms/teams/wallet; README. Link işletme rehberi önceden mevcut ve kontrol edildi. Ayrıntılı test sonuçları [ilerleme raporunda](progress.md); yayımlama **yalnız localhost**, dışdeploy/push yok.

## Açık kabul kapıları

- Domain/VDS/HTTPS/CDN/origin firewall gerçek dağıtımı; bot tepe tüketimi; bütçe/veri bölgesi/haricî S3+backup sağlayıcısı; trafik/SLO/RPO/RTO ve canlı yük/restore ölçümü.
- KVKK veri sorumlusu, gerçek iletişim/saklama ve incelenmiş hukuk metni; `/gizlilik`, `/aydinlatma`, gerekiyorsa `/cerezler`; eposta/gönderici/izleme-alarm tenant kabulü. İncelenmemiş metin canlıya konmaz.
- Gerçek admin kişiler ve kapsamları, etkinlik tarih/konum/URLler; 2026 fotoğraf yayın uygunluğu, finalist/oyun adı/takım/credits rızası; 2027 kesin tarih. Bilinmeyenler boş/Yakında.
- Gerçek VoiceOver/NVDA ve bağımsız yetkili pentest; yerel axe+AX+klavye bunların yerine geçmez. GitHub runner yürütümü push sonrası ayrıca izlenir.
- Google public publishing/device/offline ve Apple ücretli Developer+PassTypeID/sertifika/APNs/gerçekdeviceupdate. Apple24 tamamlandı sayılmaz.
- Kullanıcının gelecekte iOSQR→isim/takım→katılımcıGeldi→WalletQRsilme→adminliste senkronu; ilerleme raporunun son maddesi, henüz uygulanmadı.

Bütün gereksinimler bir çıktı veya açık bağımlılıkla eşlendi; ürünün küresel “canlı kabul” kutuları açık bağımlılıklar çözülmeden kapanmaz.
