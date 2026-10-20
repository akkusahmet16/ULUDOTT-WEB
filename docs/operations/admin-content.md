# Site içerikleri yönetimi

20 Ekim 2026 — Yenilenen yönetim panelinin kullanım rehberi.

## Panel ve etkinlikler

`/admin` girişinden sonra sol menü veya genel bakış kartlarıyla yönetim alanına geçin. Mobilde “Menü” düğmesi bütün yönetim alanlarını açar. Hakkımızda, Oyunlar, UluJam, başvuru ve İletişim yönetimleri devam eder. Duyuru paylaşımı, duyuru listeleri ve duyuru API yolu kaldırılmıştır; içerik paylaşımı için `/admin/etkinlikler` kullanılır.

Etkinlikler ekranında kayıtları ad ve durumla süzebilirsiniz. “Yeni etkinlik” ile başlık, açıklama, İstanbul saatine göre başlangıç/bitiş ve konum girin. UluJam türünde ilgili yılı da belirleyin; aynı yıl başka etkinliğe bağlanamaz. Gelişmiş ayarlarda etkinlik adresi, kategori, düzenleyen, kapasite, takım büyüklüğü ve bu etkinliğin formu düzenlenir. Yeni etkinliği oluşturan yönetici zaten etkinlik yöneticisiyse yeni kayıt otomatik olarak kendi yönetim kapsamına eklenir.

Afiş PNG, JPEG veya WebP, tam 1080×1350 piksel ve en fazla 8 MiB olmalıdır. Görsel açıklamasını girip yayın hakkını onayladıktan sonra “Afişi yükle ve hazırla” ile yükleyin veya hazırlanmış bir afiş seçin. Yükleme etkinliği yayımlamaz.

“Taslağı kaydet” → “Önizleme” → “Yayın etkisini göster” → “Yayını onayla” sırasıyla ilerleyin. Önizleme ve genel detay sayfası aynı içerik görünümünü kullanır. Değişiklik yaptıysanız yayın veya önizlemeden önce kaydedin. Başka kayda geçerken kaydedilmemiş değişiklikler için uyarı gösterilir. Yayın zamanı gelecekteyse planlı yayın oluşturulur; kaldırma saati de ayrıca belirlenebilir. Tüm saatler İstanbul saatidir.

“Yayından kaldır / arşivle” → “Arşivlemeyi onayla” genel erişimi kapatır; dosya ve denetim geçmişini korur. Bitmiş veya iptal edilmiş etkinliklerde başvuru düğmesi gösterilmez.

## Hakkımızda

`/admin/people` → “Yeni kişi ekle”. Ad, görev, bölüm, bölüm içi sıra ve isteğe bağlı alıntı/bilgileri girin. Küçük sıra önce gösterilir; mevcut üyelerde sıra değerleri 10'ar artar. Böylece araya 15 gibi bir değerle kişi yerleştirilebilir. Bilgiler en fazla beş satırdır.

“Klasörden görsel seç” ile fotoğrafı bulun; arama ve klasör süzgeci kullanılabilir. Yeni dosya eklendiyse “Dosyaları yenile” düğmesine basın. Kaydetme doğrudan Hakkımızda sayfasını günceller. Mevcut kişiyi başka bölüme taşımak için bölümünü ve sırasını düzenleyin. “Kişiyi sil” → “Silmeyi onayla” kişiyi siteden kaldırır; medya dosyalarını korur. Son kişisi silinen bölümün açılış videosu varsa bölüm sitede kalır; hem kişi hem video yoksa gizlenir. “Bölüm ve videolar” filtresinden bölüm başlığı, görev, video ve kapağı düzenleyebilirsiniz. Arama ve bölüm filtresiyle ilgili kayda ulaşabilirsiniz. “Açılış videosunu sitede göster” seçimini kapatmak video adresini veya dosyasını silmez; açılış sahnesinin yerine bölüm başlığı gösterilir. Daha sonra yeni videoyu seçip bu seçeneği açabilirsiniz. Sosyal Medya bölümünün açılış videosu şu anda gizlidir; kişi kartları korunur.

## Oyunlar

`/admin/oyunlar` ekranındaki “Sitedeki oyun kartları” bölümünü kullanın. Mevcut No Time To Die ve InFrame kartları burada düzenlenebilir. Yeni oyunda isim, kart etiketi, ekip/yapımcı bilgisi, açıklama, geçerli HTTPS itch.io oyun bağlantısı, kapak, kapak açıklaması ve sıra girilir. Önizleme sitenin kullandığı kartın aynısıdır.

“Taslağı kaydet” genel sayfada görünmeyen kayıt oluşturur. “Yayımla” kartı Oyunlar sayfasına ekler. Yayındaki kayıtta “Değişiklikleri kaydet” bilgileri günceller, “Yayından kaldır” taslağa döndürür. “Oyunu sil” kartı kaldırır; dosyasını silmez. Düzenleyici için içerik editörü yetkisi gerekir. Etkinliğe atanmış yöneticilerin mevcut takım, finalist ve derece yönetimi “UluJam takım oyunları ve derece yönetimi” altında devam eder; yapımcı rızası kuralları korunur.

## UluJam videosu ve başvurular

`/admin/ulujam` ekranında kolon yılı, başlık ve tanıtım metnini düzenleyin. Video için YouTube bağlantısı, başlık, açıklama ve klasörden kapak seçin. “Videoyu sitede göster” seçimi ve “UluJam ayarlarını kaydet” yayını belirler. Video kaldırıldığında eski video tekrar eklenmez. YouTube watch, kısa bağlantı, shorts ve embed adresleri kabul edilir; keyfi iframe veya başka site adresi kabul edilmez.

Başvuru bölümünde yayımlanmış UluJam formunu seçin. Form henüz yoksa yetkili yöneticinin gördüğü “Form oluşturucuya git” bağlantısından oluşturun. Yeni UluJam formu katılımcı, beceri ve takım akışını içeren gerçek şablonla açılır. Seçenek adları düzenlenebilir; mevcut yanıtları ve koşulları eşleştiren kimlikler korunur. Sorular, açılış/kapanış tarihleri, kapasite ve mevcut takım akışı Form oluşturucuda yönetilir; seçili form için doğrudan düzenleme bağlantısı vardır. Başlık, açıklama, buton ve kapalıyken gösterilecek metni UluJam ekranından girin. “Başvuruları yayımla” ve kaydetme, formun kendi tarih aralığı da açıksa ana sayfada ve UluJam sayfasında aynı başvuru bağlantısını gösterir. Başvuru sayfası site temasını kullanır.

“Başvuruları kapat” bağlantıyı kaldırır ve daha önce açılmış formdan yeni gönderimleri de engeller. Form seçimini kaldırmak veya başka forma geçmek eski formu yeniden açmaz. Aynı eski formu tekrar kullanmak için yeniden seçip yayını açın. Mevcut başvurular silinmez.

## UluJam arşivleri

`/admin/ulujam-arsivleri` ekranında yıl, açıklama ve sıra girin. Eski `/admin/galeri` bağlantısı bu ekrana yönlenir. Küçük sıra önce gösterilir. “Fotoğraf ekle” ile önceden yüklenmiş dosyayı seçin, açıklamasını yazın; yukarı/aşağı ile yerleşimi belirleyin. En fazla 50 fotoğraf seçilebilir.

Derece oyunlarında 1–3 sıralaması, oyun adı, ekip, açıklama, itch.io adresi ve klasörden kapak düzenlenir. İstenirse yayımlanmış oyun kataloğundan bilgiler doldurulur; bu işlem arşiv için düzenlenebilir bir kopya oluşturur. Her derece bir kez kullanılabilir. Önizleme genel sayfayla aynı arşiv şablonudur. “Taslağı kaydet” saklar, “Yayımla” UluJam sayfasına ekler, “Yayından kaldır” siteden kaldırıp düzenlenebilir tutar. Kaldırılan 2026 arşivi varsayılan içerikle geri gelmez.

2026 arşivi ilk kez bu editörden kaydedilene kadar mevcut galeri ve eski oyun yayın filtreleri korunur. Kaydedildikten sonra o yılın fotoğrafları, oyunları ve yayını arşiv editöründen yönetilir. Diğer yıllar aynı görünüm bileşenini kullanır.

## İletişim ve alt bağlantılar

`/admin/iletisim` ekranında sayfa başlığı/açıklaması, iletişim başlığı, e-posta, telefon ve footer metinlerini düzenleyin. Boş bırakılan e-posta/telefon kartı sitede gösterilmez. Sosyal hesaplarda isim, HTTPS adresi, marka simgesi, sıra ve “iletişimde/alt bölümde göster” seçeneklerini belirleyin. Hesap ekleme, kaldırma ve sıralama aynı ekrandadır.

“İletişim ayarlarını kaydet” iki alanı birlikte günceller. Kaldırılan sosyal hesap eski sabit listeden geri gelmez. `/admin/linkler` içindeki Bağlantı Merkezi ayrı yönetilir; iletişim/footer sosyal hesaplarının kaynağı yeni ortak ayarlardır. İletişim editörü için bağlantı yönetimi yetkisi, UluJam ve arşiv editörleri için içerik editörü yetkisi gerekir.

## Önceden yüklenecek dosyalar

- Kişi fotoğraf/video: `public/community/03-hakkimizda/people/` ve alt klasörleri.
- UluJam video kapağı ve arşiv fotoğrafları: `public/community/02-ulujam/` ve alt klasörleri.
- Oyun kapakları: `public/community/06-oyunlar/` ve alt klasörleri.
- Mevcut kişi referans dosyaları: `public/theme/reference/people/`.
- Desteklenen görseller: WebP, PNG, JPEG, AVIF; videolar: MP4, WebM.

`tasarim-girdileri/` tasarım kaynak klasörüdür. Panelin seçebilmesi için kullanılacak dosya yukarıdaki karşılık gelen `public/` klasörüne önceden konmalıdır. Dosya adlarında Türkçe karakter ve boşluk kullanılabilir. Sembolik bağlantılar listelenmez, izinli klasör dışından dosya kaydedilemez. Canlı sunucuda da seçilen dosyaların aynı klasörlerde bulunması gerekir.

## Kurulum ve çakışmalar

`pnpm db:migrate` `0024_site_game_catalog` ve `0025_site_settings` migration'larını uygular. İkinci migration sürümlü ortak ayarlar ve yıllık arşiv kayıtları içindir; mevcut içerikleri silmez. Kişi yönetimi mevcut `people_overrides` tablosunu kullanır; eski düzenlemeler korunur. Başlangıç kartları ve kişiler için ayrıca seed çalıştırılmaz. Silme işaretleri başlangıç içeriklerinin yeniden görünmesini önler.

Başka yönetici aynı kaydı değiştirmişse sürüm çakışması gösterilir; “Listeyi yenile” ile güncel kaydı tekrar seçin. Yönetim API'leri oturum/izin, CSRF ve sürüm denetimlerini uygular. Test sunucusu `.next/e2e` dizinini kullanarak açık geliştirme sunucusuyla çakışmaz.

## Yerel giriş adresleri

Geliştirme sunucusunda `localhost` ve `127.0.0.1`, `APP_URL` ile aynı HTTP portunda admin girişi ve kaydetme için kullanılabilir. Çerezler adrese bağlıdır; diğer adrese geçerseniz yeniden giriş yapmanız gerekir. Farklı portlar, uzak adresler ve üretimdeki alternatif alan adları kabul edilmez. Üretimde yalnız `APP_URL` origin'i geçerlidir; imzalı CSRF, süre, oturum ve çerez denetimleri devam eder.

## Ana sayfa etkinlik alanları

Yayımlanmış etkinlikler ana sayfada tarihe göre ayrılır. Yaklaşan ve devam eden etkinlikler “Topluluğun dünyası” kartından önce, başlangıç tarihine göre alt alta görünür. Bitiş anına ulaşan veya panelde bitmiş olarak işaretlenen etkinlikler kartın altındaki “Geçmiş etkinlikler” galerisine geçer; en son biten önce gelir. Bitiş tarihi boşsa yalnız başlangıcın geçmesi kaydı geçmişe taşımaz. İptal, taslak, arşiv ve yayın penceresi dışındaki kayıtlar bu alanlarda gösterilmez.

Geçmiş galerisi aynı anda bir etkinlik gösterir; yatay kaydırma, yön düğmeleri ve klavyenin sağ/sol tuşlarıyla geçilir. En az iki etkinlik varsa görünür alandayken 5 saniyede bir sonraki karta geçer ve son karttan başa döner. Durdurma/başlatma düğmesi vardır. Fareyle kartın üzerine gelindiğinde geçiş bekler; klavyeyle odaklanıldığında veya azaltılmış hareket tercihi açıksa otomatik geçiş durur.

Sitedeki mevcut 7 Ekim 2026 Coffee Talk kartı geçmişte korunur. Panelde `coffee-talk` adresli veya mevcut Coffee Talk kimlikli bir kayıt varsa, taslak veya yayından kaldırılmış olsa bile adres daha sonra değiştirilse bile sabit kart yeniden eklenmez; böylece panelin yayın kararı korunur. Yeni etkinlikler için paneldeki başlama/bitiş tarihlerini ve yayın durumunu kullanın.

## Etkinlikler sayfası

`/etkinlikler` sayfasında “Yaklaşan Etkinlikler” ve “Geçmiş Etkinlikler” başlıkları bulunur. Tarih ayrımı ana sayfayla aynıdır; bitiş tarihine ulaşan veya “Bitti” durumundaki kayıtlar geçmişte listelenir. Bölüm boş olsa da başlık ve kısa bir bilgi görünür. Coffee Talk mevcut afiş ve bilgilerle geçmiş etkinliklerde korunur.
