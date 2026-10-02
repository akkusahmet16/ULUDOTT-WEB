# Aşama 3 — UluJam kabul kanıtı

2 Ekim 2026. Görev16–19 kapsamı; üretim verisi yerine ayrı gerçek PostgreSQL test veritabanları kullanıldı.

| Kontrol | Kanıt |
| --- | --- |
| Solo, seeking, new, existing; telefon ve beceri kuralları | ulujam-input / ulujam-application / team-page / ulujam-form testleri |
| Aynı kişinin tekrar kaydı ve idempotent makbuz | ulujam-application entegrasyonu; aynı anahtar farklı gövde409 |
| Son etkinlik ve takım kontenjanı yarışı | ulujam-capacity / team-capacity testleri; transaction kilitleri |
| Takım parola/token rotasyonu ve iki takım izolasyonu | team-access testleri; güvenli cookie ve eski oturum reddi |
| Beceri filtresi, bütün adaylardan öneri, eski kadro sürümü | recommendations / assignment ve seeker-board testleri |
| Kadro ve solo yönetici kararı, event scope, gerekçe | approvals entegrasyonu + üretim TLS approvals E2E |
| Geç gelen üye bekler, eski onaylı üye aktif kalır | approvals / card-access; eski approval kaydı değişmez |
| Pending/active/revoked, etkinlik iptali, retention | card-access; erişimde güncel uygunluk okunur |
| Özel kart tokenı takımda görünmez | card-access; özet yalnız name/status, e-posta/telefon yok |
| Ayrı QR kimliği, yetkili kontrol ve iptal | check-in; QR PNG gerçek okuyucuyla çözüldü, eski kimlik rotasyonda reddedilir |
| Onay öncesi aktif kart/Wallet uygunluğu yok | requireActiveCard pending için403; wallet_passes0. Sağlayıcı üretimi Görev22 kapsamıdır |

Görev19 genel birim/entegrasyon koşusu: 28 dosya,209 test başarılı (.local/task19-tests.log). Tip ve lint başarılı. Üretim derlemesi başarılı. ProductionTLS44 E2E:43 geçti; streamed title yarışına başlık bekleme eklendikten sonra ilgili3/3 tekrar geçti. Card-states2/2 ve team-page2/2 başarılı; axe0,390px taşma yok. Gerçek QR PNG okuma son koşusu1/1 başarılı. Mobil ekran görüntüsü .local/task19-card-mobile.png gözle incelendi. Ana DB migration0015 ve db:check başarılı; kaynak/build sır taraması0. Log redaction yerel preview kontrolüyle ayrıca kaydedilir.

Veri uydurulmadı: ana DB kişi/takım/kartları boştur. 2026 üç editoryal URL korunur. Yerel doğrulama canlı VDS kapasite veya Wallet sağlayıcı kabulü değildir.
