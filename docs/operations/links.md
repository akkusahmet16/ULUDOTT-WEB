# Bağlantı merkezi işletme rehberi

Genel ekran `/linkler`, yönetim ekranı `/admin/linkler`. Yönetim API'si `/api/admin/links`. `links.write` izni content_editor ve event_manager rollerine verilir; bu global bağlantı yetkisi etkinlik scope'uyla sınırlanmaz. system_admin tek başına bağlantı yayınlayamaz. Oturum ve CSRF zorunludur; JSON gövdesi 32 KiB ve 10 saniyeyle sınırlanır.

## İçerik ve yayın

Önce kategori oluşturun; ardından başlık, adres, açıklama, ikon, kategori, sıra, öne çıkarma ve yayın penceresini belirleyin. İstanbul saatindeki girdiler UTC timestamptz olarak saklanır. Başlangıç dahil, bitiş hariçtir; tarihsiz açık yayın hemen görünür. Boş kategoriler genel ekranda gösterilmez. Öne çıkan bağlantılar ayrıca kendi kategorilerinde görünür.

Yalnız kimlik bilgisi içermeyen HTTPS dış adresler veya mevcut genel site yolları kabul edilir. İç yollar ana sayfa, Hakkımızda, UluJam, Destek, etkinlik/duyuru listeleri, Linkler, Oyunlar ve görünür etkinlik/duyuru detaylarıyla sınırlıdır. Admin/API/form ve kısa adres döngüleri reddedilir. Dış adresi yayımlarken “Dış adresi doğruladım” kutusunu her kayıtta onaylayın; bu editör doğrulamasıdır, sunucu dış hedefi ziyaret etmez. Dış bağlantılar yeni sekmede noopener/noreferrer ile açılır. Bilinmeyen Discord, WhatsApp veya sosyal adresler eklenmedi.

Envanter 50 kategori ve 200 bağlantıyla sınırlıdır. Kategori sırası ve kategori içi bağlantı sırası tektir. Yukarı/aşağı taşıma tüm ilgili sıra listesini ve revision snapshot'ını transaction içinde işler. Kayıt güncelleme ve gizleme expectedRevision ister; başka editör değişikliği 409 sürüm çakışması döndürür. Listeyi yenileyip güncel kaydı tekrar inceleyin. Denetim kayıtları nesne kimliği ve izinli metadata taşır, ham adres/başlık/açıklama değerlerini saklamaz.

## Kopyalama, kısa adres ve QR

`/l/<UUID>` yalnız o anda görünür bağlantıyı 307 ile yönlendirir. Keyfi url parametresi veya Host başlığı hedefi belirlemez. İç hedef artık görünmüyorsa bağlantı da kapanır. Kısa adresler APP_URL üzerinden üretilir; canlı ortama geçerken doğru HTTPS alan adını ayarlayın.

`/api/links/<UUID>/qr` aynı görünürlük denetimiyle 256×256 PNG üretir. QR kısa adresi içerir; hedef değişince aynı kısa adres güncel hedefe gider. Yayından kaldırılan veya süresi biten kayıt için QR ve kısa adres 404 verir; mevcut indirilmiş QR da kapalı kısa adrese gider. DB/servis hatası 503 verir. Yanıtlar no-store/nosniff taşır. QR görseli pencere açılınca yüklenir; Escape kapatır ve odak tetikleyiciye döner. Clipboard kullanılamazsa seçilebilir kısa adres alanı gösterilir. Tıklama analitiği ve izleme yoktur.

QR sunucuda [node-qrcode](https://github.com/soldair/node-qrcode) 1.5.4 ile üretilir; testlerde bağımsız [jsQR](https://github.com/cozmo/jsQR) 1.4.0 gerçek PNG'yi çözer. Yeni paketler lockfile'da sabittir.

## Şema ve doğrulama

0005 migration link_groups/links revision ve links verified_at alanlarını, pozisyon unique kısıtlarını ekler; tablo sayısı 41 kalır. Mevcut veride tekrar eden pozisyonlar varsa unique migration uygulanmadan editoryal olarak çözülmelidir; migration otomatik veri silmez veya sıra değiştirmez. Bu geliştirme DB'sinde ürün kaydı yoktur.

`pnpm test` URL/şema, zaman sınırları, kategori ve bağlantı sırası, sürüm yarışları, izin, hedef görünürlüğü, gizleme ve PNG QR decode kontrollerini çalıştırır. `pnpm test:e2e` gerçek yönetim/kopyalama/QR/klavye/mobil akışını ve axe kontrollerini izole DB'de çalıştırır. `ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e` son standalone build'i izole HTTPS test ortamında doğrular. Test adresleri yalnız geçici DB'dedir; ana DB'ye seed yazılmaz.
