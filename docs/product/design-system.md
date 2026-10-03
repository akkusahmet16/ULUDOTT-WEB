# Tasarım sistemi — referans klonu denemesi

4 Ekim 2026. Kullanıcı ilk sinematik temayı reddetti; GTA VI resmi sayfasının klon düzeni, menüsüz ana sayfa haritası ve sayfaya gömülü oyun molaları istedi. Git yedeğiyle yerel deneme onayı sürer. Yetki ve Wallet kuralları korunur. AI görsel kullanılmaz.

Kaynak `src/styles/tokens.css`, `src/components/` ve modül UI dosyalarıdır. [Değişiklik rehberi](change-guide.md), [erişilebilirlik raporu](../operations/accessibility-report.md).

| Token                 | Değer / amaç                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| ink / panel           | #0c0d1b / #18182c; gece zemini ve yüzey                                                             |
| cream / muted         | #fff9cb / #cac4d7; birincil ve ikincil metin                                                        |
| purple / lime / coral | #edb2e4 / #f6b6cb / #ffbd9e; lila, pembe ve şeftali vurgu; eski token adları uyumluluk için korunur |
| line / radius         | #51495f / 4px; çerçeve ve temel köşe                                                                |
| space                 | clamp(22px,6vw,100px); sayfa kenarı                                                                 |
| font / heading        | Yerel ArtDeco Regular/Medium/Bold / ArtDeco Condensed Bold; referansın gerçek fontları              |
| motion / ease         | 600ms / cubic-bezier(.22,1,.36,1)                                                                   |

Fontlar yerel `next/font/local` ile paketlenir; ziyaret sırasında harici font servisi kullanılmaz. Bu sürüm Rockstar'ın gerçek referans fontlarını kullanır; OFL font oldukları veya Uludott'un mülkiyetinde oldukları iddia edilmez. Orijinal Outfit/Barlow OFL kaynakları ayrı kalır. Gerçek referans görselleri `public/theme/reference/` altında AVIF; kaynak atıfları [referans varlık listesi](../design/gta-vi-reference-assets.json) içindedir. Kullanım kullanıcı tarafından istenen yerel klon denemesidir; bu görevde kamuya açık dağıtım yoktur. Referans görseller Uludott kişi/etkinlik görüntüsü olarak sunulmaz.

Ana sayfa: referansın kolaj açılışı ve üç sütunlu alt eylem satırı, yedi genel bölümün doğrudan haritası, iki büyük görsel yönlendirme paneli, topluluk metni, aralarda iki oyun molası, etkinlikler/oyunlar/duyurular ve bağlantı/destek bölümleri. Altbilgide genel harita ve yetkili giriş bağlantısı bütün sayfalarda bulunur. Özel token sayfaları haritada listelenmez. Mevcut yayımlanan etkinlikler ve onların detay/form akışları kendi yetki/yayın kurallarını korur. Genel/özel/admin ekranları ortak gerçek referans font ve renklerini kullanır.

Oyunlar: yıldız yakalama ve hafıza eşleştirme doğrudan kullanılabilir; Başlat/ayrı oyun ekranı yok. Yeniden oyna ve mevcut kart kapatma davranışı korunur. Ana sayfada oyunların sırası sunucuda her istek için seçilir ve hydration sırasında tekrar karıştırılmaz; oyun oynarken düzen kaymaz. Pop-up/timer/otomatik odak veya gezinmeyi kesen olay yok; puan yalnızca sayfanın belleğindedir.

Menü bütün ekranlarda açılır; mevcut sekiz bağlantıyı korur, Escape ile kapanır ve odağı düğmeye döndürür. Açıkken sayfa kaydırması durur. Masaüstünde iki, dar ekranda bir sütun kullanılır. Formlar ve tablolar dar ekranda taşmadan kullanılmalıdır. Dokunma hedefleri temel kontrollerde en az48px; görünür odak şeftali3px çizgidir. Katılımcı/link QR alanları beyaz zeminde filtresiz kalır.

Hareketler açılışta poster yükselme/yakınlaşma ve destekleyen tarayıcılarda kaydırma ile bölüm girişidir. Reduced-motion tercihinde animasyon ve geçişler kapanır; içerik görünür kalır. Gerçek ekran okuyucu kabulünün tamamlandığı iddia edilmez.

Daha sinematik bir açılış için topluluğa ait 8–12 saniyelik sessiz, döngüye uygun oyun geliştirme/game-jam videosu (1920×1080, mobil için dikey kırpım) ve aynı kareden bir poster görseli uygun olur. Bölüm geçişleri için özgün oyun/etkinlik görselleri önerilir. Bu varlıklar sağlanmadığı için sahte fotoğraf, video oynatıcı veya yeni ürün özelliği eklenmez.

Geri dönüş: GitHub ve yerelde `backup/theme-before-20261003` dalı, `theme-before-20261003` etiketi; deney `codex/cinematic-theme` dalındadır. Kullanıcı geri dönüş isterse deney korunarak yedek dala geçilir. API/veri tabanı geri alma işlemi gerekmez; değişiklik görseldir.

Oyun molalarının sırası ve bölüm aralıkları sunucuda her sayfa yüklemesinde bir kez seçilir. İlk mola giriş veya büyük yönlendirmelerden sonra, ikinci mola haberler veya bağlantılardan sonra yerleşir; oynarken konum değişmez.
