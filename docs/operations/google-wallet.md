# Google Wallet Generic Pass

## Kabul durumu —3 Ekim2026

Sunucu adapter'ı, gerçek PostgreSQL hak kontrolü, RS256 OAuth/saveJWT, Generic Class/Object oluşturma/güncelleme/iptal, kararlı Object ID ve eski iş koruması uygulanmıştır. Yerel protokol testinde anahtar runtime üretilir ve dış ağ yerine kontrollü HTTP transport kullanılır. Bu, Google hesabında kart eklendiği anlamına gelmez.

**3 Ekim2026 güncelleme:** Yeni JSON key kullanıcı onayıyla oluşturuldu; demo bağlantısı kuruldu. Gerçek Google hesabına ekleme ve aynı nesnede derece güncelleme Safari üzerinden doğrulandı; API iptali de geçti. [Gerçek demo kabul kanıtı](google-wallet-live-acceptance.md). Google genel yayın erişimi henüz istenmedi/alınmadı; Android/offline cihaz teslimi ayrıca denenmedi. Eski Wallet secrets dosyaları okunmaz. Google demo yalnız atanmış test/yetkili hesaplarla denenebilir; herkese açık yayın erişimi ayrıca gerekir: [Google yayın erişimi](https://developers.google.com/wallet/generic/test-and-go-live/request-publishing-access).

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

Gerçek kabul için: yetkili demo hesabında onaylı katılım ile ekle; aynı Object ID üzerinde derece/QR güncellemesini gözle doğrula; ret/iptalde INACTIVE görünümünü doğrula; onaysız doğrudan API403'ü doğrula. Kanıta issuer modu, test zamanı, maskelenmiş Object ID ve anahtar/QR/bireysel token içermeyen görüntü yaz. Yayın erişimi yoksa herkese açık satır beklemede kalır. 3 Ekim2026 gerçek demo kanıtı ile görev23 üçüncü kutusu kapandı; herkese açık yayın erişimi ayrı beklemede kalır.

Resmî protokol kaynakları: [GenericObject](https://developers.google.com/wallet/reference/rest/v1/genericobject), [GenericClass](https://developers.google.com/wallet/reference/rest/v1/genericclass), [Save JWT](https://developers.google.com/wallet/generic/use-cases/jwt), [Service-account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account).

## Yapılandırma kesintisi ve etkinlik adı değişimi

Google yapılandırması yokken gereken uzak güncelleme/iptal tamamlandı sayılmaz: `GOOGLE_CONFIG_UNAVAILABLE` saklanır, outbox bounded backoff ile yeniden dener. Yerel kart iptal edilmişken uzak pass geçici olarak ACTIVE kalabilir. Beş deneme sonrası dead-letter oluşursa yapılandırmayı geri getirip yetkili retry endpoint'iyle işi yeniden açın; restore tek başına dead işi açmaz. Sweep retry zamanını aşmaz. Zaten uygulanmış aynı revision/state gereksiz tekrar gönderilmez. Etkinlik adı panelde değiştiğinde aynı transaction ilgili card revision'larını artırıp card.changed yazar; aynı Google Object ID güncellenir.

## Safari konsol kontrolü —3 Ekim2026

Kullanıcının Safari yetkisiyle Uludott topluluk hesabının Wallet konsolu incelendi. Issuer ID sonu8403, mevcut Generic sınıflar etkin, durum demo; yayın erişimi isteği henüz tamamlanmamış. Bir demo test hesabı kayıtlı. `uludott-ulujam-wallet` Cloud projesindeki UluJam Wallet issuer servis hesabı etkin ve Wallet konsolunda Geliştirici yetkisine sahip;1 Ekim2026 tarihli mevcut anahtar aktif görünüyor. Bu gözlem gerçek uygulama OAuth/API başarısı veya cihaza kart ekleme kanıtı değildir.

Mevcut anahtarın JSON kopyası indirilenler klasöründe bulunmadı; eski Wallet secrets içerikleri okunmadı. Safari'de yeni JSON anahtar oluşturma son ekranı hazırlandı, Create tıklanmadı. Yeni kalıcı erişim kimliği oluşturma için bilgisayar kullanım kuralı nedeniyle kullanıcı onayı istendi; alternatif mevcut JSON dosya yolu. Yetki veya anahtar silme işlemi yapılmadı, yayın erişimi isteği gönderilmedi. Güvenli dosya sağlanınca server-only konfigürasyon/OAuth/Generic nesne ve gerçek test hesabı kabulü sürdürülür.

## Gerçek yanıt uyumluluğu ve otomatik test izolasyonu

Google gerçek API bu kabulte `state=active` ve `inactive` legacy alias döndürdü. Adapter yalnız dokümante `ACTIVE|active` ve `INACTIVE|inactive` değerlerini doğru hedef durumda kabul eder; diğer durumlar, karışık case ve yanlış Object ID başarı değildir. İstekler uppercase gönderilir. [Resmî State enum](https://developers.google.com/wallet/reference/rest/v1/State). Vitest ve E2E harness varsayılan Google modu disabled kullanır; sentetik protocol testleri kendi demo anahtar/transport'ını açıkça kurar. Yerel gerçek demo anahtarı otomatik testlerde kullanılmaz.
