# Yerel güvenlik kabul raporu — Görev 28

Kapsam [pentest-scope](../security/pentest-scope.md); kontroller [ASVS matrisi](../security/asvs-matrix.md) ve [tehdit modeli](../security/threat-model.md) ile eşlenir. Üretim TLS browser kabulü hydration+CSP parser enjeksiyonu, cookie/CSRF, özel cache ve rol sınırlarını ölçer. PostgreSQL testleri veri kaybı, çift kayıt, son kontenjan, expiry ve outbox revision/backoff davranışını ölçer. Sırlar source ve gerçek Wallet anahtarıyla standalone/static paketinde taranır; içerik/anahtar değeri rapora yazılmaz.

CI: scripts/ci-check.sh hata durumunda durur; ci-gate.test.ts başarısız lint çıkış7 sonrasında build'e geçilmediğini kanıtlar. GitHub package işi needs:verify bağımlıdır; dağıtım işi yoktur, yanlışlıkla dış yayına çıkmaz. CI ephemeral env ve disabled provider kullanır. Gerçek GitHub runner çalışması push yapılmadığından henüz kanıt değildir; aynı kontrol zinciri yerelde çalıştırılır.

Son komut/sonuçlar ve ölçümler [yük raporu](load-report.md), [ilerleme](progress.md) ve [son kabul](final-acceptance.md) içinde tutulur. Bağımlılık denetimi üretim kapsamındadır; geliştirici bağımlılıkları için sıfır güvenlik açığı iddiası verilmez.

Dış pentest yapılmadı. Canlı CDN/WAF false-positive, gerçek firewall/origin, domain TLS, gerçek Turnstile widget ve cihazdan Wallet silme kabulü bekler. Bu bağımlılıklar “geçti” olarak işaretlenmez. VDS gerçek CPU/RAM ve trafik hedefleri gelmeden kapasite veya DDoS dayanıklılığı iddiası verilmez.
