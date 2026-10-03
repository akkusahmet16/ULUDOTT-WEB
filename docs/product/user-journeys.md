# Kullanıcı yolculukları

3 Ekim 2026. [Sayfa/API haritası](routes.md), [roller](roles.md) ve [son kabul](../operations/final-acceptance.md) birlikte okunur. Kanıtlar `tests/e2e/` altındaki mevcut test dosyalarıdır; burada canlı kullanıcı/device testi yapıldığı iddia edilmez.

| Kullanıcı / amaç | Yol ve beklenen sonuç | Yerel kanıt / sınır |
|---|---|---|
| Ziyaretçi topluluğu tanır | Ana sayfa → Hakkımızda → etkinlikler/linkler/destek; mobil menü, klavye ve isteğe bağlı mini oyun | navigation/bootstrap; gerçek ekran okuyucu açık |
| Ziyaretçi duyurudan başvurur | Öne çıkan afiş → Coffee Talk ayrıntısı → bağlı site içi form → doğrulama → güvenli makbuz; kapanışta başvuru engellenir | featured-event/coffee-talk/public-form; gerçek tarih/konum bekliyor |
| Ziyaretçi resmî bağlantıyı paylaşır | Linkler → kategori/öne çıkan → doğrulanmış bağlantı; URL kopyala veya QR | link-hub; bilinmeyen sosyal URL uydurulmaz |
| Başvuru sahibi genel etkinliğe kaydolur | Açık form → koşullu alanlar/rıza → tek kayıt/kapasite/bekleme listesi → kendi makbuzu | public-form; eposta teyidi sağlayıcı bekliyor |
| Katılımcı UluJam'e başvurur | UluJam → solo, takım arayan, yeni takım veya mevcut takıma katılma → beceri/seviye/telefon/rıza → anlaşılır sonuç | ulujam-form; son kontenjan integration/load yarış kanıtı |
| Takım üyesi özel alana girer | Takım bağlantısı + parola → güvenli oturum → kendi kadrosu/kapasitesi/kart özeti/oyun taslağı → çıkış | team-page; başka takım verisi reddedilir, reset eski oturumu iptal eder |
| Katılımcı kartını görür | Kendi kart bağlantısı → onay durumuna uygun kart → takım/derece; pending/rejected durumunda Wallet yok | card-states/approvals/wallet-gate |
| Katılımcı Google Wallet kullanır | Onaylı kart → sağlayıcı durum açıklaması → sunucuda imzalı ekleme → Google hesabında kart; değişiklik kuyruğa ve aynı nesneye yansır | Gerçek demo ekleme/güncelleme kanıtı mevcut; public onay/Android/offline açık |
| Katılımcı Apple Wallet kullanır | Ücretli Developer hesabı gelene kadar kullanılamaz; sahte ekleme bağlantısı yok | Ertelenmiş24; adapter/iPhone kabulü yok |
| Editör içerik yayımlar | Kişisel admin MFA → etkinlik/duyuru → güvenli afiş+alt metin → önizleme → yayın/zamanlama/öne çıkarma | media/featured-event/coffee-talk; gerçek görsel kullanım uygunluğu gerekir |
| Editör linkleri yönetir | Admin linkler → doğrulanmış URL/kategori/sıra → önizleme/yayın/gizleme → genel sayfada sonuç | link-hub |
| Yönetici form oluşturur | Admin formlar → alan/koşul/kapasite → mobil/masaüstü önizleme → yeni değişmez sürüm → yayın/duraklat/kapat/kopyala | form-builder; eski yanıt sürümü korunur |
| Yönetici başvuruyu işler | Başvurular → sunucu arama/filtre/sayfa → ayrıntı → izinli durum → güvenli CSV/XLSX → kayıt/saklama politikası | submission-admin; scoped authorization |
| Yönetici takımları düzenler | Takım arayanlar → açıklanabilir öneri → elle atama → kadro/solo onayı → geç üye ayrı onay; parola/bağlantı yenileme | seeker-board/approvals/team-page; eski yetki ve kart durumu tutarlı |
| Yönetici oyun yayımlar | Oyunlar → taslak → HTTPS itch.io/kapak/derece → yapımcıdan yayın adı rızası → önizle/yayımla → oyun ve kart revizyonu | games/2026-results; başvuru adı otomatik kamuya açılmaz |
| Yetkili personel giriş doğrular | Admin check-in → ayrı QR kimliği → yetkili doğrulama; kart özel erişim token'ı QR değildir | Check-in integration; gelecekte iOS+“Geldi”+Wallet QR kaldırma henüz uygulanmadı |
| Sistem yöneticisi işletir | MFA/scoped dashboard → sistem/denetim/kuyruk durumu → izinli hata yeniden denemesi | admin-operations; dış alarm teslimi ve gerçek admin ataması açık |
| İşletmeci dağıtır/geri döner | Ayrı sır/DB/depo → migration → web/worker → TLS/smoke → yedek/restore veya rollback | Yerel restore CI kanıtı; [deploy](../operations/deploy.md), canlı VDS kabulü bekliyor |

Her mutasyonda sunucu doğrulaması ve nesne/event yetkisi gerekir; düğmenin görünmesi izin yerine geçmez. Boş içerik, kapalı form, uygun olmayan kart, yanlış parola ve altyapı hatası ayrı durumlar olarak değerlendirilir. Gerçek hukuk metni/iletişim, etkinlik ve cihaz kabulü olmayan yolculuklar üretim için tamamlanmış sayılmaz.
