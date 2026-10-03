# Google Wallet Generic Pass

## Kabul durumu —3 Ekim2026

Sunucu adapter'ı, gerçek PostgreSQL hak kontrolü, RS256 OAuth/saveJWT, Generic Class/Object oluşturma/güncelleme/iptal, kararlı Object ID ve eski iş koruması uygulanmıştır. Yerel protokol testinde anahtar runtime üretilir ve dış ağ yerine kontrollü HTTP transport kullanılır. Bu, Google hesabında kart eklendiği anlamına gelmez.

**Gerçek issuer/service account/test kullanıcı hesabı ve ekleme/güncelleme kanıtı sağlanmadı. Görev23 dış kabulü ve herkese açık yayın beklemede.** Eski Wallet secrets dosyaları okunmaz. Google demo yalnız atanmış test/yetkili hesaplarla denenebilir; herkese açık yayın erişimi ayrıca gerekir: [Google yayın erişimi](https://developers.google.com/wallet/generic/test-and-go-live/request-publishing-access).

## Yapılandırma

Web ve worker server-only ortamında `GOOGLE_WALLET_MODE=disabled|demo|publishing_pending|published`, gerçek `GOOGLE_WALLET_ISSUER_ID` ve `GOOGLE_WALLET_CREDENTIALS_FILE=/mutlak/depo-disi/service-account.json` verilir. Varsayılan disabled. Dosya depo ve deployment paketi dışında0600 izinli, service_account ve en az2048bit RSA anahtar olmalıdır. Kimlik/publishing statüsü operatör girdisidir; environment işareti gerçek kabul kanıtı değildir. Servis hesabına Wallet issuer rolü ve Wallet Objects API erişimi konsolda yetkili kişi tarafından verilir.

Eski anahtar klasörünü otomatik taramayın; gerçek dosyayı Git/public/build alanına taşımayın. Anahtar dosyası yedeği ve rotation ayrı güvenli işletme işlemidir. Yeni issuer mevcut doğrulanmış pass kimliklerini sessizce değiştiremez; `GOOGLE_IDENTITY_CHANGED` olarak hata verir. Sadece henüz hiç uygulanmamış placeholder Object ID ilk yapılandırmada gerçek issuer'a geçebilir.

## Akış ve tutarlılık

`POST /api/wallet/google/[cardToken]` mevcut özel kartın sahibinden CSRF doğrulanmış istek alır; aktif onay/saklama/etkinlik durumu sunucuda tekrar kontrol edilir. Takım veya check-in token'ı bireysel Wallet yetkisi değildir. GET ekleme nesnesi üretmez. Endpoint/dev logları ve cache/no-referrer/noindex kuralları özel rota olarak ayarlanır; canlı proxy/CDN kayıtları dağıtımda ayrıca denetlenir.

Object ID `issuer.uludott_<card UUID>`, Class ID `issuer.ulujam_<event UUID>`. Check-in QR ayrı kimliktir; kişiye özel kart erişim bağlantısı Google nesnesine verilmez. Katılımcının kendi adı, etkinlik, takım, yayımlanmış oyunlarının derece/finalist durumu ve revizyon minimal pass verisidir; telefon/e-posta gönderilmez. OAuth hedefi/scope sabittir; credential token_uri URL'si kullanılmaz. Her HTTP isteği15s timeout/no redirect ile çalışır.

Class/Object POST409 tekrarında Class GET veya Object PATCH;404 dahil diğer HTTP hataları başarısızlıktır. Sağlayıcı response ID/state doğrulanmadan ready/synced_revision yazılmaz. Yalnız izinli hata kodları saklanır; ham body, JWT, anahtar veya telefon loglanmaz.

Save JWT RS256 imzalı, izinli origin/domain ile ve10dakika exp içerir; payload yalnız mevcut nesnenin ID'sidir. Böylece eski Save bağlantısı ACTIVE/QR/ad veya eski derece snapshot'ını yeniden yazamaz. Google'ın bağlantı/cihaz paylaşım sınırları gerçek hesap testinin parçasıdır; bearer sahibi kimlik doğrulanmış kullanıcı kabul edilmez.

Etkinlik→kart kilidi boyunca güncel revision okunur; eski iş payload'ı state üretmez. Dış çağrı boyunca kilit tutulur. Desired revision ve gerçekten uygulanan revision/remote state ayrı saklanır. İptal yerel hakları hemen kapatır; provider INACTIVE isteği worker ile gider. Zaman/etkinlik değişimini cursor sweep yeni card.changed revision olarak kuyruğa yazar; sweep sağlayıcıya doğrudan tekrar yük bindirmez. Outbox5deneme sonrasında dead-letter olur; yetkili sistem yöneticisi retry endpoint'iyle yeniden açabilir.

HTTP timeout sonrası uzak sonucun kesinliği garanti edilemez; iş güncel DB projection'ıyla yeniden uygulanır. Google/offline cihaz teslimi DB transaction değildir; gerçek cihazda son durum ayrıca doğrulanır. VDS kilit/kapasite ölçümü ve anahtar/issuer rotation burada canlı kabul olarak iddia edilmez.

## Doğrulama ve gerçek kabul adımları

`pnpm test tests/integration/google-wallet.test.ts` yerel protokol/DB kanıtı. `pnpm security:wallet` production static/standalone paketinde yapılandırılmış Google anahtarının ve service-account kimliğinin olmadığını denetler; diğer sırlar için genel paket taraması da gereklidir. Kabulte sentetik depo dışı RSA dosya ile production build/paket sızıntı probu çalıştırılır.

Gerçek kabul için: yetkili demo hesabında onaylı katılım ile ekle; aynı Object ID üzerinde derece/QR güncellemesini gözle doğrula; ret/iptalde INACTIVE görünümünü doğrula; onaysız doğrudan API403'ü doğrula. Kanıta issuer modu, test zamanı, maskelenmiş Object ID ve anahtar/QR/bireysel token içermeyen görüntü yaz. Yayın erişimi yoksa herkese açık satır beklemede kalır. Kanıt gelmeden görev23 üçüncü kutusu kapanmaz.

Resmî protokol kaynakları: [GenericObject](https://developers.google.com/wallet/reference/rest/v1/genericobject), [GenericClass](https://developers.google.com/wallet/reference/rest/v1/genericclass), [Save JWT](https://developers.google.com/wallet/generic/use-cases/jwt), [Service-account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account).
