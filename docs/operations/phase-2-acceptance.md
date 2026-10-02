# Aşama 2 kabul — 2 Ekim 2026

Görev 10–14 genel form tanımı, koşullu görünürlük, değişmez yayın sürümü, sunucu doğrulaması, kapasite/idempotency, özel makbuz, etkinlik kapsamlı yönetim ve güvenli CSV/XLSX akışı doğrulandı.

Görev 14 son kapısı: `pnpm test` 174/174; `pnpm typecheck`, `pnpm lint`, `pnpm build` başarılı. `ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e --workers=1` 34/34 başarılı. İzole TLS standalone sunucu, gerçek PostgreSQL ve özel S3 kullanıldı. Coffee Talk testi DEMO tarih/konum/sentetik afişle mevcut yönetim API'lerini kullanarak yayın, siteden başvuru, makbuz, kapanış ve CTA kaldırmayı doğrular. UluJam takım alanı ve dış Google Forms bağı yoktur.

Seed yalnız açık geliştirme çağrısıdır; ana DB'ye eklenmez. Bilinmeyen gerçek tarih/konum/afiş taslakta boş kalır. Gerçek sunucu/alan adı dağıtımı yapılmadı; bu yerel üretim derlemesi kabulüdür. Görev16 takım transaction'ları henüz yoktur.

Test sonu ana DB: 42 tablo, 10 önceki içerik satırı; başvuru/takım/kart/kredi0, test DB0, kalan medya0. Sır/build taraması0, `pnpm audit --prod` bilinen zafiyet0. Değişen kaynak/test/belgeler ve diff incelendi.
