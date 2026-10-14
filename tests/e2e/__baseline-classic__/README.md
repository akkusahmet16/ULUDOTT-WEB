# Klasik arayüz referansı — Faz 0

Sekiz genel rotanın her biri için 1280×800 masaüstü ve 375×812 mobil görüntü:
16 PNG. `manifest.json` rota, viewport, SHA256 ve çekim koşullarını içerir.

- Kaynak uygulama: `c9cb08b`; UI değişikliği yapılmadan çekildi.
- Chromium / Chrome Headless Shell 153.0.8010.12, Playwright 1.63.0.
- Windows, deviceScaleFactor=1, `tr-TR`, `Europe/Istanbul`, dark color scheme.
- Ayrı yerel test DB: migration uygulanmış, 42 public tablo tek tek sayılmış,
  her biri boş; seed yok. Standart e2e sunucusunun 2026/admin seed'i kullanılmadı.
- Tarayıcı saati `2026-10-10T09:00:01.000Z` anında durduruldu. Boş DB nedeniyle
  UluJam sayısal sayacı yok; doğru “Yakında” durumu var.
- `prefers-reduced-motion: reduce`, animasyon/transition kapalı, caret gizli.
  Fontlar ve görseller beklenip `networkidle` sonrasında çekildi.
- Yalnızca Next geliştirme portalı çekim CSS'i ile gizlendi; ürün UI/CSS'i
  değiştirilmedi. Tam sayfa değil, belirtilen viewport görüntüsü alındı.
- İki ayrı boş DB/sunucu koşusunda 16/16 PNG SHA256 değeri birebir eşleşti.

Faz 1 görsel karşılaştırmaları aynı koşulları kullanmalıdır. Referanslar
başarısız testi geçirmek için güncellenmez. HEIC örnekleri bu görüntülere,
ürün DB'sine veya public medya alanına aktarılmadı.
