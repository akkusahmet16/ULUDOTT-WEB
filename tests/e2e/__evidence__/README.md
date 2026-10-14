# Faz 1 kanıtları

- `faz1-classic-diff.json`: Faz 0'ın değiştirilmeyen 16 PNG'siyle birebir RGBA piksel sayımı. Bütün farklar 0; Playwright eşiği ayrıca %1, threshold 0.
- `faz1-turkish-glyphs.png`: üstten alta Press Start 2P, Space Grotesk, VT323; her satır İ ı Ğ ğ Ş ş Ç ç Ö ö Ü ü.
- `faz1-font-metrics.json`: 36 ayrı glifin CDP `CSS.getPlatformFontsForNode` sonucu; kullanılan yüzlerin tamamı custom font, fallback yok. Ağ listesi aynı gezinme ve glif örneğinin toplamıdır. Preload listesi boş.
- `faz1-build-metrics.json`: üretim CSS gzip, yayımlanan font dosyaları, iki temanın token sayısı ve kontrast oranları.
- `faz1-lighthouse.json`: yerel HTTPS üretim ana sayfası, Lighthouse 13.5.0 mobil ölçümü; JS gzip ve gerçek font ağı dahil. Ham JSON'un SHA256'sı kayıtlıdır; ham JSON/HTML çalışma alanında `.local/faz1-lighthouse-arcade.report.*` altında tutulur.

Yeniden üretim: `pnpm test:e2e --config playwright.visual.config.ts` boş UUID DB ile yalnız görsel karşılaştırmayı çalıştırır, baseline yazamaz. Standart davranış/axe/tema paketi `pnpm test:e2e`; üretim glif kanıtı için `ULUDOTT_E2E_PRODUCTION=1 ULUDOTT_E2E_REBUILD=1` ortamıyla çalıştırılır. Windows'taki pnpm spawn adaptörü ve OpenSSL PATH kurulumu faz raporunda açıklanmıştır.

Bu dosyalar test çıktısıdır; ürün metni veya yeni tasarım varlığı değildir. Orijinal `__baseline-classic__` dizini korunur.
