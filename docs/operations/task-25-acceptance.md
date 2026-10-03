# Görev 25 — birleşik yönetim paneli kabul kaydı

3 Ekim 2026. Yönetim ana sayfasında etkinlik/form operasyon özeti, tüm yönetim sayfalarında role göre ortak navigasyon ve yalnız sistem yöneticisine açık `/admin/sistem` ekranı eklendi.

## Yetki ve metrikler

- Etkinlik yöneticisi yalnız `eventScopes` içindeki etkinliklerin formlarını, başvuru/takım/kontenjan/Wallet işi sayılarını alır. İstemcide filtreleme, sunucunun yetki süzmesini değiştirmez. Yetkisiz doğrudan `getDashboard(actor,eventScope)` isteği reddedilir.
- İçerik editörü etkinlik içeriği ve zamanlanmış duyuru özetini görür; kişisel metrik alanları `null`, form listesi boştur. Genel (`eventId=null`) zamanlanmış duyurular ayrı sayılır; etkinliksiz kurulumda da görünür. Etkinlik kapsamı seçilmiş servis isteği genel duyuruları içermez.
- Sistem yöneticisi rolü tek başına kişisel başvuru okuma izni vermez. Sistem ekranına kişi, payload, sağlayıcı nesne kimliği, anahtar, dosya yolu, bağlantı adresi veya ham hata taşınmaz. Bilinmeyen iş türü de sabit etikete dönüştürülür.
- Yaklaşan etkinlik: ileri başlangıç tarihi ve published/scheduled durum. Açık form: yayımlanmış sürüm, açılış/kapanış aralığı uygun. Yeni başvuru: süresi dolmamış received/pending kayıt. Form kapasitesi: süresi dolmamış received/pending/approved kayıt; waitlisted/rejected/withdrawn hariç. UluJam etkinlik kapasitesi mevcut başvuru kabul servisiyle aynı şekilde rejected/withdrawn dışındaki application kayıtlarından sayılır. Bekleyen takım onayı pending takım sayısıdır.
- Başarısız Wallet işi: dead veya hata almış pending card.changed/wallet.requested işi. Kapsam, worker ile aynı aggregateId→card→application→event bağı üzerinden belirlenir; payload içindeki eventId yetki kaynağı değildir.

## İşletme ve arayüz

Arama, etkinlik kapsamı ve yaklaşan/işlem bekleyen filtreleri; boş durumlar; yükleme ve güvenli genel hata ekranı eklendi. Mobil menü ve özet yatay taşma olmadan çalışır. Sistem ekranı DB erişim kontrolünü ve depo/Wallet kurulum durumunu ayırır; worker liveness veya sağlayıcı teslimi iddia etmez. En eski 50 dead iş metadata ile listelenir.

İş yeniden denemesi önce etki önizlemesi gösterir. Önizleme ve vazgeçme mutasyon yapmaz. Son onay mevcut CSRF, system.read ve audit korumalı endpointi kullanır. Başarı mesajı yalnız kuyruğa alınmayı belirtir; sağlayıcı işleminin tamamlandığı anlamına gelmez. Görev 21'in retry/backoff/fencing davranışı korunur.

Apple Wallet Görev24 ertelemesi sürer. Google gerçek demo erişimi korunur; otomatik testler canlı issuer kullanmaz. Wallet QR→Geldi→QR kaldırma gereksinimi raporun sonundaki proje sonu incelemesinde kalır, bu görevde uygulanmadı.

## Doğrulama

- Kapsam/boş durum ve gerçek FK ilişkileri: 3 test RED→GREEN. Tek incelemede genel duyuru eksikliği P2 bulundu; yeni regresyon RED1fail3pass→GREEN. Son tam Vitest35dosya244/244: `.local/task25-review-full.log`.
- Mobil navigasyon, arama/filtre, preview/cancel/confirm ve editör doğrudan sistem erişimi: UI RED2/2→GREEN2/2. Mobil ekran görüntüsü `.local/task25-admin-mobile.png` incelendi.
- Üretim build, typecheck ve lint temiz: `.local/task25-review-build.log`, `.local/task25-types-final2.log`, `.local/task25-lint-final2.log`.
- Gerçek Google anahtarı paket taraması2745dosya/secretHits0/forbiddenFiles0: `.local/task25-wallet-secrets-final.log`.
- İlk tamTLS E2E46/49: yeni testte TOTP replay koruması nedeniyle giriş reddi; iki eski testte ortak menü sonrası bağlantı seçicisi değişikliği. Üretim giriş kodu değiştirilmeden yeni teste ayrı sentetik recovery kodu ayrıldı; eski seçiciler yeni menüye uyarlandı. İlk sonuç `.local/task25-e2e.log`, son tur `.local/task25-e2e-final.log`.

- Son üretim TLS E2E49/49(59.5s): `.local/task25-e2e-final.log`. Yeni mobil test ayrı recovery koduyla, eski oyun/başvuru akışları ortak navigasyonla geçti.
- Ana DB kişisel applications/teams/cards/passes/credits0; historicalPreserved=true, testDatabases0, mediaObjects0: `.local/task25-data.log`. Genel sır taraması0: `.local/task25-secrets-final.log`.
- Yerel preview session27794/listener46385, worker session59142/PID46398; cwd doğrulandı, `/ulujam`HTTP200. İş sonrası site açık bırakıldı; sonraki görev başında bu süreçlerin cwd doğrulanarak durdurulması gerekir.
