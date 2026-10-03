# Orijinal istem kapsam denetimi — 3 Ekim 2026

Kaynak: Uludott sıfırdan üretim isteminin 1–23 bölümleri; [mimari öneri](../design/2026-10-01-mimari-oneri.md), [uygulama planı](../design/2026-10-02-uygulama-plani.md). Bu bölüm eşlemesi tek başına her alt özelliğin hedef ortamda kabulü değildir. Çalışan yerel çıktılar ve test aileleri [29 görev matrisinde](final-acceptance.md); çözülmemiş koşullar aşağıda açık tutulur. Orijinal istekteki hiçbir bölüm sessizce çıkarılmamıştır.

| İstem bölümü | Görev / çıktı | Kanıt ve kabul sınırı |
|---|---|---|
| 1 Amaç | 1–29; modüler topluluk/etkinlik/form/takım/kart ürünü | Yerel CI; üretim kabulü aşağıdaki bağımlılıklara bağlı |
| 2 İlkeler | 2–29; sunucu kuralları, idempotency, yönetim, dürüst durum | Schema/authorization/publication/race testleri |
| 3 Roller | 3,16,17,25; rol/eventScope ve takım izolasyonu | [Rol matrisi](../product/roles.md); gerçek kişi ataması bekliyor |
| 4 Sayfalar | 4,6–7,9–14,16–24 | [Rotalar](../product/routes.md); hukuk rotaları uygulanmadı, Apple uçları ertelendi |
| 5 Tasarım | 4–5,9,19; token, mini oyun, mobil, kart | [Tasarım sistemi](../product/design-system.md), accessibility/navigation; gerçek ekran okuyucu açık |
| 6 Bağlantı merkezi | 7; yayın/sıra/HTTPS/QR/kopyala | links/link-hub; opsiyonel tıklama istatistiği etkin değil |
| 7 Etkinlik/duyuru | 5–6,14; afiş, önizleme, zamanlama, form CTA | media/publication/featured-event/coffee-talk; gerçek içerik bekliyor |
| 8 Form altyapısı | 10–14; 15 alan, koşul AST, sürüm, rıza, submit/export | form-conditions/form-service/form-versions/form-submit/submission-admin; dosya alanı kapalı, isteğe bağlı eposta sağlayıcısı açık |
| 9 UluJam başvuru | 15–16; dört mod, telefon, alan/seviye/not | ulujam-input/ulujam-application/ulujam-form; gerçek etkinlik girdileri bekliyor |
| 10 Takımlar/eşleştirme | 16–18; kapasite, öneri, yönetici ataması/onay | team-capacity/assignment/approvals; atama otomatik değil |
| 11 Hesapsız erişim | 12,16,19; makbuz, token+parola, oturum, reset | team-access/card-access; kontrollü yönetici iletim rehberi, otomatik WhatsApp yok |
| 12 Kart/Wallet | 19,21–24; web kartı, ayrı check-in kimliği, queue, Google | card-states/google-wallet/worker-retry; Google başvuru gönderildi/onay ve Android açık; Apple ertelendi |
| 13 Oyun/credits | 8,20; derece, editoryal yayın, ad rızası | historical-results/game-publication/games; bilinmeyen 2026 kişisel alanları boş |
| 14 Yönetim | 3,5–7,11,13,17–20,25 | İlgili admin E2E; gerçek yönetici/işletme kabulü açık |
| 15 Teknoloji/ortam | 1–2,5,21,26,29 | Build, PG/S3 ve container kanıtı; canlı CDN/WAF/sağlayıcı seçimi bekliyor |
| 16 Kod mimarisi | 1–29 | [Mimari](../architecture/overview.md), [değişiklik rehberi](../product/change-guide.md) |
| 17 Veritabanı | 2,10,12,16,18–24 | [ER](../architecture/er-diagram.md), schema/migration/race/restore testleri |
| 18 Güvenlik | 3,5,7,12,16,19,26–28 | [Güvenlik raporu](security-test-report.md); dış pentest/hukuk/canlı sınırlar açık |
| 19 Dayanıklılık | 12,16,21–23,25–28 | [Yük raporu](load-report.md); yerel ölçüm, canlı trafik/SLO/bütçe ve uzun süreli trafik açık |
| 20 Test stratejisi | 1–29 | 270 yerel test+50 TLS E2E+4 k6 senaryosu; manuel ekran okuyucu/dış pentest/uzun trafik açık |
| 21 İşletme | 1–3,21,25,28–29 | CI/deploy/backup/rollback; tek komut ilk kurulum ve dış alarm teslimi henüz kanıtlanmadı |
| 22 Geliştirme sırası | Aşama1–5, görev1–29 | Aşama raporları son matrise bağlı; Apple istisnası açık |
| 23 Teslim/kabul | 28–29, bu inceleme | Yolculuk/tasarım/harita/ER/işletme/test/açık iş belgeleri; hedef ortam kabulü açık |

[Son kabul kararındaki](final-acceptance.md) öncelik, gerekçe ve kapanış koşulları bağlayıcıdır. Satır eşlenmesi “üretimde tamamlandı” işareti değildir. Özellikle tek komut kurulum ve uzun süreli trafik kanıtı olmadan “bütün gereksinimler çalışan/test edilmiş” kutusu kapanmaz. Ek iOS check-in isteği orijinal 1–23 kapsamından sonra geldi; [ilerleme raporunun](progress.md) en sonunda ayrı açık gereksinimdir.
