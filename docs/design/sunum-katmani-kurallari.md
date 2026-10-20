# Sunum katmanı kuralları

1. **Kapsam ve dokunulmazlar.** Yeniden yazılan: `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/**`, `src/modules/*/ui/**`, `src/modules/community/**`, `src/styles/**`. Dokunulmaz: `src/db/**` (şema + migration), `drizzle.config.ts`, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, tüm `route.ts` işleyicileri (`api`, `l`, `media`), `scripts/**`, kimlik/oturum/CSRF/MFA mekanizmaları. İstisna: yalnızca bir UI/performans entegrasyonu için ZORUNLUYSA minimum ve yalnızca EKLEMELİ değişiklik; yapmadan önce faz raporuna gerekçe + etkilenen testler yazılır.

2. **Merkezileştirme (mutlak).** Tema değişkenleri (renk, tipografi, boşluk, radius, gölge, hareket, z-index) YALNIZCA `src/styles/themes.css` içinde tanımlanır. Metinler YALNIZCA `src/i18n/dictionaries/*` içinde tanımlanır. Rota/menü verisi YALNIZCA `src/config/routes.config.ts`; storage/çerez anahtarları YALNIZCA `src/config/storage-keys.ts`. JSX'te literal metin, dosyalarda renk kodu (hex/rgb/hsl/oklch/renk adı), inline `style` ile renk, dağınık sihirli sayı (px/ms) YASAK. Bu kurallar otomatik testlerle zorlanır (Faz 1 ve Faz 3).

3. **TypeScript.** `strict` gevşetilmez. `any`, `as unknown as`, gerekçesiz `@ts-ignore`/`@ts-expect-error`, doğrulamayı atlatan `as` iddiaları YASAK. Sabit kümeler `as const` + türetilmiş birleşim tipi. Sınır verisi Zod ile doğrulanır. Dışa açık bileşen prop'ları açık tipli. Mevcut import stilini (göreli yollar, `.ts` uzantıları) koru.

4. **Erişilebilirlik.** WCAG 2.2 AA. Yalnızca anlamsal HTML (`nav/main/header/footer/button/a`); tıklanabilir `div` YASAK. Her etkileşimli öğede görünür `:focus-visible`. Dokunma hedefi ≥ 48×48 px. Metin kontrastı ≥ 4.5:1 (büyük metin/UI ≥ 3:1). Bilgi yalnızca renkle verilmez. `prefers-reduced-motion: reduce` altında hareket kısalır/durur (tamamen silinmez). ARIA yalnızca yerel anlamsal çözüm yetmediğinde ve doğru kullanılır. Diyaloglarda odak tuzağı, Escape, odak iadesi. Sayfa başına tek `h1`, başlık seviyesi atlanmaz. Görsellerde anlamlı `alt` (dekoratifse boş `alt`).

5. **Performans.** Lighthouse (mobil, ÜRETİM build'i) Performance/Accessibility/Best Practices/SEO ≥ 90. Ana sayfa ilk yük JS hedefi < 150 KB gzip. CLS ≈ 0 (görsellerde boyut zorunlu, `next/image`). LCP ≤ 2.5 s. Fontlar `next/font` ile kendi alan adımızdan, `display: swap`. Varsayılan Server Component; `"use client"` yalnızca etkileşim için ve en küçük yaprakta. Yeni bağımlılık için gerekçe yaz; eklenirse tam sürüm sabitlenir (mevcut `package.json` tarzı), lockfile güncellenir. Animasyon varsayılan olarak CSS ile.

6. **Veri dürüstlüğü.** Gerçek tarih, konum, ekip, telefon, e-posta, hukuk metni, görsel aidiyeti UYDURULMAZ. Veri yoksa bölüm render edilmez veya doğru boş durum gösterilir. Hukuk metinleri yalnızca kullanıcının verdiği onaylı metinle yayımlanır.

7. **Doğrulama ritüeli.** Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`. Faz sonunda ayrıca `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`. Kanıtsız "tamamlandı" YASAK; kanıt = komut + çıktı özeti. Çalıştırılamayan doğrulama "doğrulanmadı" diye raporlanır. Testi geçirmek için testi zayıflatma/silme YASAK.

8. **Tasarım kalitesi.** Jenerik "SaaS" görünümü YASAK: mavi→mor gradyan, yumuşak `shadow-lg`/`rounded-xl` kart, Inter/Roboto, üç özdeş "ikon+başlık+paragraf" ızgarası, Lorem ipsum, emoji ikon. Her bölümün kendi kompozisyonu olur. Hover/focus/active/disabled durumlarının hepsi tanımlanır.

9. **Rapor biçimi.** Faz sonunda: değişen dosyalar, çalıştırılan komutlar + çıktı özeti, kabul ölçütü tablosu (✓/✗ + kanıt), açık sorular/onay bekleyenler. Her faz raporu `docs/operations/sunum-katmani-ilerleme.md` dosyasına eklenir.
