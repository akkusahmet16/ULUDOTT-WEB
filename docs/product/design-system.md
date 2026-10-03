# Tasarım sistemi — sinematik tema denemesi

3 Ekim 2026. Kullanıcının GTA VI resmi sayfası referansı ve Git yedeğiyle deneme onayına göre uygulanır. Mevcut özellikler, içerik, yetki ve Wallet kuralları korunur. Reddedilen görsel kullanılmaz.

Kaynak `src/styles/tokens.css`, `src/components/` ve modül UI dosyalarıdır. [Değişiklik rehberi](change-guide.md), [erişilebilirlik raporu](../operations/accessibility-report.md).

| Token                 | Değer / amaç                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| ink / panel           | #0c0d1b / #18182c; gece zemini ve yüzey                                                             |
| cream / muted         | #fff3ce / #cac4d7; birincil ve ikincil metin                                                        |
| purple / lime / coral | #edb2e4 / #f6b6cb / #ffbd9e; lila, pembe ve şeftali vurgu; eski token adları uyumluluk için korunur |
| line / radius         | #51495f / 4px; çerçeve ve temel köşe                                                                |
| space                 | clamp(22px,6vw,100px); sayfa kenarı                                                                 |
| font / heading        | Yerel Outfit / Barlow Condensed Bold; Türkçe destekli OFL fontlar                                   |
| motion / ease         | 600ms / cubic-bezier(.22,1,.36,1)                                                                   |

Fontlar `src/styles/fonts/` altında lisanslarıyla paketlenir; ziyaret sırasında harici font servisi kullanılmaz. Rockstar özel fontu kopyalanmaz. Ana sayfa büyük tipografik açılış, özgün vektör günbatımı (`public/theme/horizon.svg`) ve mevcut üç içerik kartını kullanır. Genel sayfalar, formlar, listeler, tablolar, dialoglar, yönetim ekranları ve özel katılımcı kartı aynı renk/yazı sistemiyle güncellenir. İçerik ve eylem hedefleri değişmez.

Menü bütün ekranlarda açılır; mevcut sekiz bağlantıyı korur, Escape ile kapanır ve odağı düğmeye döndürür. Açıkken sayfa kaydırması durur. Masaüstünde iki, dar ekranda bir sütun kullanılır. Formlar ve tablolar dar ekranda taşmadan kullanılmalıdır. Dokunma hedefleri temel kontrollerde en az48px; görünür odak şeftali3px çizgidir. Katılımcı/link QR alanları beyaz zeminde filtresiz kalır.

Hareketler açılışta yumuşak yükselme/yakınlaşma ve destekleyen tarayıcılarda kaydırma ile bölüm girişidir. Reduced-motion tercihinde animasyon ve geçişler kapanır; içerik görünür kalır. Gerçek ekran okuyucu kabulünün tamamlandığı iddia edilmez.

Daha sinematik bir açılış için topluluğa ait 8–12 saniyelik sessiz, döngüye uygun oyun geliştirme/game-jam videosu (1920×1080, mobil için dikey kırpım) ve aynı kareden bir poster görseli uygun olur. Bölüm geçişleri için özgün oyun/etkinlik görselleri önerilir. Bu varlıklar sağlanmadığı için sahte fotoğraf, video oynatıcı veya yeni ürün özelliği eklenmez.

Geri dönüş: GitHub ve yerelde `backup/theme-before-20261003` dalı, `theme-before-20261003` etiketi; deney `codex/cinematic-theme` dalındadır. Kullanıcı geri dönüş isterse deney korunarak yedek dala geçilir. API/veri tabanı geri alma işlemi gerekmez; değişiklik görseldir.
