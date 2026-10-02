# UluJam arşivi ve mini oyunlar

`/ulujam` ilk bölümde 2027'yi, ikinci bölümde 2026 arşivini gösterir. `pnpm db:seed:ulujam` ayrı açık komuttur: verilen 2026 sonuçları ve 2027 tarihsiz draft kabuğunu oluşturur. Tekrar çalıştırmak mevcut düzenlemeyi/yayını ezmez. Tarih, konum, publish_at ve kişi/takım verisi uydurulmaz. Migration ve web okuması seed çalıştırmaz.

2027 kaydının gerçek tarih/konumu `/admin/etkinlikler` üzerinden girilip yayımlandığında sayaç açılır. Draft/archived, kaldırma zamanı geçmiş veya tarihi NULL kayıt Yakında olur. Sayaç başlangıçta “Etkinlik başladı.” gösterir; sayfada her saniye güncellenir. Yayın kararı yeni sayfa okumasında değerlendirilir. Başvuru CTA'sı Görev 14'e kadar kapalıdır.

## Galeri

`/admin/galeri` UluJam 2026 için 0–49 sıralı medya slotları sağlar. Önce `/admin/medya` üzerinden işlenmiş görsel ve alt metin oluşturun. Galeri slotunda bu görselin gerçekten UluJam 2026'ya ait olduğunu ayrıca onaylayın. Yayını medya panelinden açın. Sadece doğrulanmış ilişki, ready medya, dolu alt metin ve yayımlanmış WebP türevi genel galeride görünür. İlişkilendirme yayını kendiliğinden açmaz. Boş slot seçimi ilişkiyi kaldırır; onay kaldırılması slotu gizler.

Content editor veya o etkinliğe atanmış event manager media.attach izniyle yönetir; system_admin tek başına içerik ilişkilendiremez. CSRF, 32 KiB/10 sn gövde sınırı ve expectedRevision kontrolü vardır. Media row lock ve reference denetimi galeriye bağlı medyanın silinmesini önler. Gizlenen medya/archived etkinlik galeride kalmaz. Bilinmeyen HEIC varlıkları otomatik atanmaz. 0006 migration event_gallery FK/unique/revision tablosunu ekler; toplam 42 tablo.

Derece kartları yalnız üç 2026 editoryal URL'yi gösterir. Finalist bölümü ayrı boş slottur; finalist kayıt/yayın/rıza yönetimi Görev 20'de tamamlanacak. Kişi veya oyun adı uydurulmaz.

## Oyun molası

Yıldız yakalamada 9 hücre içinde 5 hedef; hafızada 6 kart ve 3 çift vardır. Süre sınırı veya katılım zorunluluğu yoktur. Başlat yeniden oynatır, eşleşmeyen kartlar açıkça kapatılır. Native düğmeler fare/dokunmatik/Enter/Boşluk ile çalışır. Sonuçlar role=status ile duyurulur; puan ağda/DB'de tutulmaz. Hafıza düzeni kısa pratik için sabittir. Reduced-motion açıkken yıldız animasyonu yoktur.
