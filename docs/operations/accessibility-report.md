# Erişilebilirlik incelemesi — Görev 28

Otomatik axe: ana sayfa, hakkımızda, UluJam, destek, admin giriş, etkinlik, duyuru, link ve oyun rotaları; ayrıca form/makbuz ve yönetim akışlarında mevcut E2E kontrolleri. wcag2a/2aa/21aa etiketleri kullanılır. Tam tarayıcı komutu: ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e.

Elle browser kontrolü 3 Ekim 2026: izole üretim ana sayfası erişilebilirlik ağacı incelendi. “İçeriğe geç” bağlantısı Enter ile main-content odağına ve #main-content hash'ine geçti. Ana menü, h1/h2/h3 hiyerarşisi, öne çıkan etkinlik bölgesi, DEMO afiş alternatif metni ve anlamlı CTA adları görünür. Mobil menü/klavye, modal iptal/onay ve form hata aria-invalid/ilişkili açıklamaları mevcut Playwright akışlarıyla doğrulanır.

Bu inceleme erişilebilirlik ağacı ve klavye kontrolüdür; gerçek VoiceOver/NVDA sesli okuma oturumu yürütülmedi. Ekran okuyucuyla okuma sırası, canlı hata duyuruları ve modal geri dönüşü insan kullanıcıyla kabul edilmelidir. Axe sonucu WCAG uygunluk sertifikası veya ekran okuyucu testinin yerine geçmez. Görev28 manuel ekran okuyucu kabulü açık kalır.

Referans: [W3C uygunluk değerlendirmesi](https://www.w3.org/WAI/WCAG21/Understanding/conformance.html). Canlı gerçek içerik, poster alternatif metni ve nihai hukuk sayfaları yayınlandığında tekrar inceleme gerekir.
