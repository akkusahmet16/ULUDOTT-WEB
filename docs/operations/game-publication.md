# Oyun yayını ve yapımcı onayı

Görev20, UluJam oyunlarını `/admin/oyunlar` panelinden yönetir. Yeni oyun için etkinlik, başlık, adres, açıklama, onaylı takım, geçerli HTTPS itch.io oyun bağlantısı ve bütün yapımcıların açık yayın adı onayı gerekir. Kapak kullanılırsa yayına hazır ve alternatif metinli medya seçilir. Taslak kaydı mevcut tam yayını kapatır; finalist/derece güncellemeleri kart revision işini üretir. Aynı etkinlikte bir derece yalnız bir oyuna atanabilir.

Panelde yönetici için yapımcı rızası işaretleme işlemi yoktur. Davet bağlantısı bearer yetkisidir; gerçek kişiye güvenli teslim yöneticinin sorumluluğudur ve sistem ayrı bir kimlik doğrulama kanıtı üretmez. Paneldeki yapımcıya özel onay bağlantısı gerçek sahibine güvenli biçimde iletilir; sistem kendiliğinden mesaj göndermez. Bu bağlantı kişi adına işlem yetkisi taşır, genel sayfaya veya takım ortak alanına konmaz. Sahibi yayın adını seçip açık onay verir. Önerilen isim veya bağlı kişi değişirse eski onay kalkar; kişi değişiminde davet de yenilenir. Sahibi geçerli özel bağlantıyla onayını geri çektiğinde ad silinir ve oyun tam yayından kaldırılır. Aktif katılım hakkının sonradan kapanması geri çekmeyi engellemez.

Bilinen 2026 üç tarihî kaydının derece ve URL bilgileri korunur. Boş başlık, açıklama ve takım alanları uydurulmaz. Gerçek arşiv bilgisi geldiğinde doğrulanmış editoryal takım adı ve özel onay alınmış yapımcı yayın adları eklenebilir; bu istisna başka yıl veya oyunlara uygulanmaz. Kısmi kayıtta kişisel yapımcı adı gösterilmez.

Yetkiler: event_manager kendi etkinlik kapsamını kullanır. content_editor editoryal kayıtları yönetebilir; yayın, finalist ve derece işlemleri ayrıca etkinlik kapsamlı games.publish gerektirir. İki rol birlikte verildiğinde global editoryal erişim bulunur. İşlem sürümleri eski panelin yeni kararı ezmesini engeller.

Görev21 worker, Görev22 Wallet sağlayıcı işleri bu bölümün kapsamı dışındadır. Bu görev kartların revision ve outbox bildirimlerini hazırlar.

İlk tam yayından sonra oyun adresi sabit kalır; taslak değişikliklerinde ve yayından kaldırmada da eski adres başka oyuna verilemez. Genel oyunlar ve finalistler sayfalıdır. Takım/kapak seçenekleri sonraki sayfalarla gezilir; mevcut seçili kayıt ayrıca korunur ve yapımcı listesi yalnız seçilen takımın üyelerini yükler.
