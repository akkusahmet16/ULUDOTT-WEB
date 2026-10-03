# Tasarım sistemi — mevcut uygulama

Kaynak `src/styles/tokens.css`, `src/components/` ve modül UI dosyalarıdır. [Değişiklik rehberi](change-guide.md), [erişilebilirlik raporu](../operations/accessibility-report.md).

| Token | Değer / amaç |
|---|---|
| ink / panel | #1b1c20 / #25262c; zemin ve yüzey |
| cream / muted | #f4efdf / #c0bcae; birincil ve ikincil metin |
| purple / lime / coral | #b7a0ff / #d3fa74 / #ff9d8b; vurgu ve durum |
| line / radius | #494a50 / 18px; çerçeve ve köşe |
| space | clamp(20px,5vw,80px); sayfa kenarı |
| font / mono | Arial/Helvetica/sans-serif; Courier New/monospace etiket |

Başlıklar h1 clamp48–120px, h2 clamp30–52px; gövde line-height1.6 ve 65ch metin genişliği. Ana içerik en fazla1360px. Renk/odak temel dosyada, modül bileşenleri kendi CSS'inde yönetilir. Her boşluk/animasyon değeri henüz ayrı token değildir; bu belge mevcut uygulamayı anlatır, tüm değerlerin merkezileştiği iddiası değildir.

Genel parçalar: marka/başlık/altbilgi, atlama bağlantısı, mobil menü, button/card/grid/tag; alan/yardımcı metin/hata, dialog, etkinlik afişi/CTA, link ve QR, UluJam bilet/kart, arcade panoları. Gerçek logo ve görseller yönetilebilir medya akışından gelir; bilinmeyen fotoğraf yerine uygun boş durum vardır. Wallet sağlayıcısı kendi platform sınırları içinde renk/logo/bilgi sırası taşır; Apple görünümü ertelenmiştir.

900px altında grid tek sütun; 699px altında menü açılır, başlık ve bölümlerin boşlukları küçülür; 700–1100px arası başlık/nav sarılır. Form önizlemesi mobil390px ve masaüstü olarak sunulur. Temel kontroller en az44px dokunma alanını hedefler. Görünür odak lime3px+5px offset; reduced-motion durumunda animasyon/transition kaldırılır. Dialog odak, alan etiketleri, hata açıklaması ve alternatif metin testleri önemlidir.

Otomatik axe, klavye ve mobil tarayıcı kanıtı rapordadır. Bütün WCAG2.2AA koşullarının gerçek ekran okuyucuda doğrulandığı iddia edilmez; bu kabul açık. Yeni bileşen, tüm boş/yüklenme/hata/erişim reddi durumları ve ilgili modül testleriyle değerlendirilir.
