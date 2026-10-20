# GitHub Issue #1: working on improvements

- **URL:** https://github.com/akkusahmet16/ULUDOTT-WEB/issues/1
- **Durum:** open
- **Yazar:** BatuhanOzdemir7
- **Oluşturulma:** 2026-10-10T16:15:19Z
- **Güncellenme:** 2026-10-10T16:15:19Z

---


```markdown
# FAZ 0 — Temel Hat, İndekslenebilirlik, Önbellek ve Operasyon Zemini

## ROL
Kıdemli Next.js/PostgreSQL mühendisisin. Bu depo `uludott.com.tr` sitesinin kaynağıdır. Mimari karar: arka uç/alan (domain) katmanı KORUNUR; sunum katmanı (UI, tema, i18n, config-güdümlü rota) sonraki fazlarda yeniden yazılır. Bu faz yalnızca zemin hazırlar.

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md`: Bu Next.js sürümü (16.x) eğitim verinden farklıdır. Kod yazmadan önce `node_modules/next/dist/docs/` altında metadata, robots, sitemap, caching/revalidation ve route handler rehberlerini oku. Önbellek ve geçersiz kılma API'lerinin güncel adlarını dokümandan al; ezberden yazma.
2. `README.md`, `docs/operations/progress.md`, `docs/design/2026-10-02-uygulama-plani.md` ("Global kısıtlar"), `docs/design/2026-10-01-mimari-oneri.md`.
3. `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/admin/layout.tsx`, `next.config.ts`, `src/lib/config/server.ts`, `src/modules/*/application/*-service.ts`.

## GÖREV
Yeni dal: `sunum/faz-0`. Her adım sonrası küçük commit (Türkçe mesaj). Push ve merge YOK.

### 0.1 Referans hat (hiçbir değişiklik yapmadan önce)
- README'deki sırayla ortamı kaldır: `pnpm install --frozen-lockfile`, `.env.local`, `docker-compose --env-file .env.local up -d`, `pnpm config:check`, `pnpm db:migrate`.
- Sırayla çalıştır, çıktıyı özetle: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`.
- Herhangi biri kırmızıysa ARKA UCU DÜZELTMEYE ÇALIŞMA. Hatayı, kök nedeni ve etkilenen dosyaları raporla; kullanıcı onayı olmadan sonraki adımlara geçme.
- `pnpm build` rota tablosunu (statik/dinamik) `docs/operations/sunum-katmani-ilerleme.md` içine "Faz 0 başlangıç" başlığıyla kaydet.
- Görsel regresyon referansı: UI'a dokunmadan önce `/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/duyurular`, `/oyunlar`, `/linkler`, `/destek` için masaüstü (1280×800) ve mobil (375×812) ekran görüntüsü üret; `tests/e2e/__baseline-classic__/` altına kaydet (Playwright, boş DB, animasyon ve geri sayım dondurulmuş, deterministik). Faz 1 bunu kullanacak.

### 0.2 Kalıcı kural belgesi
`docs/design/sunum-katmani-kurallari.md` dosyasını Türkçe oluştur. İçeriği AŞAĞIDAKİ GİBİ yaz (özetleme, kısaltma):

1. **Kapsam ve dokunulmazlar.** Yeniden yazılan: `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/**`, `src/modules/*/ui/**`, `src/modules/community/**`, `src/styles/**`. Dokunulmaz: `src/db/**` (şema + migration), `drizzle.config.ts`, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, tüm `route.ts` işleyicileri (`api`, `l`, `media`), `scripts/**`, kimlik/oturum/CSRF/MFA mekanizmaları. İstisna: yalnızca bir UI/performans entegrasyonu için ZORUNLUYSA minimum ve yalnızca EKLEMELİ değişiklik; yapmadan önce faz raporuna gerekçe + etkilenen testler yazılır.
2. **Merkezileştirme (mutlak).** Tema değişkenleri (renk, tipografi, boşluk, radius, gölge, hareket, z-index) YALNIZCA `src/styles/themes.css` içinde tanımlanır. Metinler YALNIZCA `src/i18n/dictionaries/*` içinde tanımlanır. Rota/menü verisi YALNIZCA `src/config/routes.config.ts`; storage/çerez anahtarları YALNIZCA `src/config/storage-keys.ts`. JSX'te literal metin, dosyalarda renk kodu (hex/rgb/hsl/oklch/renk adı), inline `style` ile renk, dağınık sihirli sayı (px/ms) YASAK. Bu kurallar otomatik testlerle zorlanır (Faz 1 ve Faz 3).
3. **TypeScript.** `strict` gevşetilmez. `any`, `as unknown as`, gerekçesiz `@ts-ignore`/`@ts-expect-error`, doğrulamayı atlatan `as` iddiaları YASAK. Sabit kümeler `as const` + türetilmiş birleşim tipi. Sınır verisi Zod ile doğrulanır. Dışa açık bileşen prop'ları açık tipli. Mevcut import stilini (göreli yollar, `.ts` uzantıları) koru.
4. **Erişilebilirlik.** WCAG 2.2 AA. Yalnızca anlamsal HTML (`nav/main/header/footer/button/a`); tıklanabilir `div` YASAK. Her etkileşimli öğede görünür `:focus-visible`. Dokunma hedefi ≥ 48×48 px. Metin kontrastı ≥ 4.5:1 (büyük metin/UI ≥ 3:1). Bilgi yalnızca renkle verilmez. `prefers-reduced-motion: reduce` altında hareket kısalır/durur (tamamen silinmez). ARIA yalnızca yerel anlamsal çözüm yetmediğinde ve doğru kullanılır. Diyaloglarda odak tuzağı, Escape, odak iadesi. Sayfa başına tek `h1`, başlık seviyesi atlanmaz. Görsellerde anlamlı `alt` (dekoratifse boş `alt`).
5. **Performans.** Lighthouse (mobil, ÜRETİM build'i) Performance/Accessibility/Best Practices/SEO ≥ 90. Ana sayfa ilk yük JS hedefi < 150 KB gzip. CLS ≈ 0 (görsellerde boyut zorunlu, `next/image`). LCP ≤ 2.5 s. Fontlar `next/font` ile kendi alan adımızdan, `display: swap`. Varsayılan Server Component; `"use client"` yalnızca etkileşim için ve en küçük yaprakta. Yeni bağımlılık için gerekçe yaz; eklenirse tam sürüm sabitlenir (mevcut `package.json` tarzı), lockfile güncellenir. Animasyon varsayılan olarak CSS ile.
6. **Veri dürüstlüğü.** Gerçek tarih, konum, ekip, telefon, e-posta, hukuk metni, görsel aidiyeti UYDURULMAZ. Veri yoksa bölüm render edilmez veya doğru boş durum gösterilir. Hukuk metinleri yalnızca kullanıcının verdiği onaylı metinle yayımlanır.
7. **Doğrulama ritüeli.** Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`. Faz sonunda ayrıca `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`. Kanıtsız "tamamlandı" YASAK; kanıt = komut + çıktı özeti. Çalıştırılamayan doğrulama "doğrulanmadı" diye raporlanır. Testi geçirmek için testi zayıflatma/silme YASAK.
8. **Tasarım kalitesi.** Jenerik "SaaS" görünümü YASAK: mavi→mor gradyan, yumuşak `shadow-lg`/`rounded-xl` kart, Inter/Roboto, üç özdeş "ikon+başlık+paragraf" ızgarası, Lorem ipsum, emoji ikon. Her bölümün kendi kompozisyonu olur. Hover/focus/active/disabled durumlarının hepsi tanımlanır.
9. **Rapor biçimi.** Faz sonunda: değişen dosyalar, çalıştırılan komutlar + çıktı özeti, kabul ölçütü tablosu (✓/✗ + kanıt), açık sorular/onay bekleyenler. Her faz raporu `docs/operations/sunum-katmani-ilerleme.md` dosyasına eklenir.

### 0.3 İndekslenebilirlik
- `src/app/layout.tsx` içindeki kök `robots: { index: false, follow: false }` kaldırılır. `/admin` (admin layout `robots` + `next.config.ts` başlıkları), `/api/admin` ve ileride eklenecek token'lı sayfalar `noindex` KALIR.
- `metadataBase`, `src/lib/config/server.ts` içindeki APP_URL'den türetilir; `process.env` doğrudan okunmaz. Başlık şablonu `%s | ULUDOTT`; her genel sayfada kanonik URL.
- `src/app/robots.ts`: `/` izinli; `/admin`, `/api`, `/l/` engelli; sitemap bağlantısı.
- `src/app/sitemap.ts`: statik genel rotalar (geçici sabit liste; kodda `// FAZ-2: routes.config.ts'e taşınacak` işareti) + yayımlanmış etkinlik/duyuru slug'ları. Slug'ları yalnızca mevcut servis/repository okuma fonksiyonlarından al; yoksa ilgili modüle YALNIZCA-OKUMA bir fonksiyon ekle ve gerekçesini raporla. `lastModified` güncelleme zamanından gelir. Taslak/yayından kalkmış içerik sitemap'e girmez (test et).
- `og:image` için uydurma görsel ÜRETME; onaylı görsel yoksa eklenmez, rapora yaz.

### 0.4 Veri seviyesinde önbellek (rota seviyesinde değil)
Gerekçe: Faz 3'te dil çerezi okunacağı için kök layout dinamik olabilir; DB yükü rota statikliğine bağlanamaz.
- Genel sayfalardaki `export const dynamic = "force-dynamic"` yalnızca ilgili okuma yolu önbelleğe alındıktan sonra kaldırılır.
- Genel sayfaların kullandığı okuma fonksiyonlarını (öne çıkan etkinlikler, etkinlik/duyuru liste ve detayları, bağlantı merkezi, ULUJAM arşivi/galeri, tarihî sonuçlar) etiketli önbelleğe al. Etiket adları tek dosyada: `src/lib/cache/tags.ts` (typed sabitler).
- Zamana bağlı içerik (bağlantı zaman penceresi, etkinlik durumu, ULUJAM `coming_soon/counting/started`) etiketle tek başına güncellenemez: bunlar için kısa (≤ 60 sn) zaman tabanlı yenileme kullan, gerekçesini kodda yaz.
- Geçersiz kılma YALNIZCA DB işlemi COMMIT olduktan sonra, HTTP işleyici katmanında (`app/api/admin/**/route.ts` veya `modules/*/application/http.ts`) çağrılır; transaction içinde ASLA. Yayınla / yayından kaldır / sil / sırala / medya değişimi akışlarının hepsi ilgili etiketi geçersiz kılar.
- Mevcut `tests/e2e/*` ve `tests/integration/*` davranış sözleşmesidir: önbellek yüzünden kırılırsa testi değil geçersiz kılma mantığını düzelt.
- `Countdown` bileşeninin `initialNow` davranışının önbellekle bozulmadığını doğrula (≤ 1 sn sapma, hidrasyon uyarısı yok).

### 0.5 Canlı denetim aracı
`scripts/live-audit.ts` (yalnızca Node `fetch`, yeni bağımlılık YOK; mevcut `scripts/*.ts` çalıştırma desenini izle) ve `pnpm audit:live -- --url https://uludott.com.tr`. Denetler: `/`, `/robots.txt`, `/sitemap.xml`, `/admin` durum kodları; `X-Robots-Tag` ve `<meta name="robots">`; `<title>`, kanonik, `lang`; `skip` bağlantısı ve `site-header` işaretçisi (bu depodaki kodun canlıda koştuğuna dair ipucu); `/l/…` ve `/media/…` rota varlığı. Çıktı: Markdown tablosu. Aracı canlıya KARŞI SEN ÇALIŞTIRMA; çalıştırma talimatını rapora yaz.

### 0.6 Yedek ve kapasite
- `infrastructure/backup/pg-backup.sh`: `pg_dump -Fc`, tarih damgalı dosya, SHA256, saklama süresi; hedef `BACKUP_TARGET` değişkeninden (sağlayıcı BİLİNMİYOR, varsayma; `TODO: sağlayıcı onayı bekliyor`). `docs/operations/backup-restore.md`: geri yükleme provası adımları ve `pg_restore` doğrulama sorguları. Betiği ÇALIŞTIRMA.
- `docs/operations/vds-olcum.md`: VDS (4 GB RAM, 2 vCPU, bot ile paylaşımlı) için yük altında koşturulacak ölçüm komutları (`free -m`, `df -h`, `vmstat 1`, `pidstat`, `systemd-cgtop`, PostgreSQL bağlantı/`shared_buffers` kontrolü) ve KABUL EŞİKLERİ ÖNERİSİ (tepe RAM, swap, CPU, disk). Eşikleri öneri olarak yaz, onay iste.

## YASAKLAR
Arka uç mantığı, Drizzle şeması/migration, kimlik doğrulama değişikliği; UI/tema/i18n işi; yeni bağımlılık; testi zayıflatma; canlı sisteme veya yedek hedefine erişim.

## KABUL ÖLÇÜTLERİ (kanıt iste)
- Referans hat sonuçları ve ekran görüntüsü baseline'ı kayıtlı.
- Genel sayfalarda `noindex` yok (e2e: yanıt başlığı + meta); `/admin` ve `/api/admin` hâlâ `noindex`.
- `/robots.txt` ve `/sitemap.xml` doğru; taslak içerik sitemap'te yok.
- Ana sayfa artık `force-dynamic` değil; yayınla → ana sayfada görünür, yayından kaldır → kaybolur (e2e).
- `pnpm typecheck && lint && test && test:integration && test:e2e && build` yeşil (kanıtlı).
- `docs/design/sunum-katmani-kurallari.md` oluşturuldu.

## RAPOR
Kural 9'daki biçim + Faz 0 başlangıç/bitiş rota tablosu karşılaştırması.

```

```markdown
# FAZ 1 — %100 Merkezi Tema Sistemi (CSS Özel Özellikleri)

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/` (font optimizasyonu, root layout, hidrasyon).
2. `docs/design/sunum-katmani-kurallari.md` (TAMAMI) ve `docs/operations/sunum-katmani-ilerleme.md`. Faz 0 kabul ölçütleri ✓ değilse DUR ve bildir.
3. `src/styles/tokens.css` (tamamı), `src/app/layout.tsx`, `src/app/admin/layout.tsx`, `src/components/design-system/*`, `src/components/layout/*`.

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- DOKUNMA: `src/db/**`, Drizzle şeması/migration, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, `route.ts` işleyicileri, `scripts/**`, kimlik/oturum/CSRF/MFA. Yalnızca UI entegrasyonu için ZORUNLUYSA minimum + eklemeli değişiklik; önce raporda gerekçelendir.
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*`; rota/menü yalnızca `src/config/routes.config.ts`. JSX'te literal metin, dosyada renk kodu, dağınık sihirli sayı YASAK.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK.
- a11y: WCAG 2.2 AA, anlamsal HTML, `:focus-visible`, hedef ≥ 48 px, kontrast ≥ 4.5:1, `prefers-reduced-motion`.
- Performans: Lighthouse mobil ≥ 90 (üretim build'i), CLS≈0, LCP ≤ 2.5 s, varsayılan Server Component, yeni bağımlılık gerekçeli + sürümü sabit.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; faz sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Kanıtsız "tamamlandı" ve testi zayıflatma YASAK.
- Dal: `sunum/faz-1`; küçük commit (Türkçe); push/merge YOK.

## MİMARİ HEDEF — MERKEZİLEŞTİRME (ZORUNLU)
Bu fazdan sonra projede TEK tema doğruluk kaynağı vardır. Hedef dosya haritası:

- `src/styles/themes.css`: TÜM CSS özel özellikleri (renk, tipografi, boşluk, radius, border, gölge, hareket, z-index, layout ölçüleri, efekt). Renk kodu içeren TEK dosya.
- `src/styles/base.css`: eski `tokens.css` (`git mv`). Reset + layout/bileşen kuralları; yalnızca `var(--…)` tüketir.
- `src/config/theme.config.ts`: `THEMES`, `ThemeId`, `DEFAULT_THEME`, `ADMIN_THEME`, `isThemeId`, `THEME_REGISTRY` (her tema için `labelKey: string`; Faz 3'te `DictionaryKey` olarak daraltılacak).
- `src/config/storage-keys.ts`: `STORAGE_KEYS` (`theme: "uludott-theme"`, `introSeen: "uludott-intro-seen"`) ve `COOKIE_KEYS` (`locale: "uludott-lang"`). Başka hiçbir dosyada bu dizeler yazılmaz.
- `src/config/fonts.ts`: `next/font/google` tanımları (tek yer).
- `src/config/boot-script.ts` + `src/components/boot/BootScript.tsx`: hidrasyon öncesi blocking script; içeriği yukarıdaki sabitlerden üretilir (elle yazılmış dize YOK).
- `src/components/theme/ThemeProvider.tsx` + `useTheme()`.

## GÖREV

### 1.1 Envanter
`tokens.css`'te ve tüm `src/**/*.{ts,tsx,css}` içinde kullanılan her değişkeni, renk kodunu, `px/ms/ch` sihirli sayıyı çıkar. Eski → yeni anlamsal eşleme tablosunu `docs/operations/sunum-katmani-ilerleme.md` içine yaz.

### 1.2 `themes.css`
Seçiciler: `:root, [data-theme="arcade"]` ve `[data-theme="classic"]`. `html` önekini KULLANMA (iç içe alt ağaçta tema geçersiz kılınabilsin). Her blok `color-scheme: dark` ve AYNI özel özellik kümesini tanımlar. Zorunlu token aileleri:

- Renk: `--color-bg`, `--color-bg-elevated`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-border-strong`, `--color-text`, `--color-text-muted`, `--color-text-inverse`, `--color-primary`, `--color-primary-contrast`, `--color-secondary`, `--color-secondary-contrast`, `--color-accent`, `--color-accent-contrast`, `--color-focus`, `--color-success`, `--color-warning`, `--color-danger`, `--color-overlay`, `--color-shadow`, `--color-selection-bg`, `--color-selection-text`.
- Tipografi: `--font-display`, `--font-body`, `--font-label`, `--font-mono`; `--text-xs … --text-4xl` ve `--text-display` (akışkan `clamp`); `--leading-tight|normal`, `--tracking-tight|normal|wide`, `--weight-regular|bold`.
- Boşluk: `--space-1 … --space-8`, `--space-gutter`, `--space-section`.
- Biçim: `--radius-control`, `--radius-card`, `--radius-pill`, `--border-width`, `--border-width-strong`.
- Gölge/efekt: `--shadow-pixel`, `--shadow-pixel-hover`, `--shadow-pixel-pressed`, `--glow-primary`, `--fx-scanline-opacity`.
- Hareket: `--motion-fast`, `--motion-base`, `--motion-slow`, `--ease-standard`, `--ease-snap`.
- Katman/yerleşim: `--z-skip`, `--z-header`, `--z-overlay`, `--z-dialog`, `--layout-max-width`, `--layout-measure`, `--touch-target-min` (48px).

**`arcade` (varsayılan) değerleri:** bg `#0b0b16`; bg-elevated `#14142b`; surface `#14142b`; surface-raised `#1c1c3a`; border `#2e2e4d`; border-strong `#4a4a7a`; text `#f5f5f7`; text-muted `#9a9ab0`; text-inverse `#0b0b16`; primary `#ff2e63`; secondary `#08f7fe`; accent `#f6f740`; *-contrast `#0b0b16`; focus `#f6f740`; success/warning/danger uygun türet; shadow-color `#000`. Biçim: radius 2px, border 2px/4px, `--shadow-pixel: 4px 4px 0 0 var(--color-shadow)`, hover 6px, pressed 0. Tipografi: display = Press Start 2P (YALNIZCA ≥ `--text-xl` başlıklarda), body = Space Grotesk (okunabilir), label = VT323 (YALNIZCA ≥ 20px etiket/CTA). `--fx-scanline-opacity` > 0.
**`classic` değerleri:** mevcut `tokens.css` değerleri BİREBİR (ink→bg, panel→surface, cream→text, muted→text-muted, line→border, lime→primary, purple→secondary, coral→accent; radius 18px; Arial/Courier New; gölgesiz; scanline 0). Eşlemeyi koddaki gerçek kullanıma göre doğrula.

Gerçek kontrast ölçümü yap: arcade/classic hiçbir çift 4.5:1'in (büyük metin/UI 3:1) altında kalmasın; kalan değeri aynı ton ailesinde ayarla ve raporla.

### 1.3 `base.css` geçişi
Her literal renk/gölge/radius/süre → `var(--…)`. `@media` sorgularında değişken kullanılamaz: breakpoint değerlerini `base.css` başında TEK yorum bloğunda belgele, her yerde aynı sayıyı kullan. Eski `--radius` vb. takma adları BIRAKMA. `layout.tsx` import'unu güncelle (`themes.css` önce, `base.css` sonra).

### 1.4 Fontlar
`src/config/fonts.ts`: Press Start 2P, Space Grotesk, VT323; `subsets: ["latin","latin-ext"]`, `display: "swap"`, değişken adları (`--font-display-face` vb.). `themes.css` yalnızca bu değişkenlere + yedek yığınlara (`ui-monospace`, `system-ui`) başvurur. Türkçe glifleri (İ ı Ğ ğ Ş ş Ç ç Ö ö Ü ü) üç fontta görsel olarak doğrula. `classic` temada web font indirilmemeli (Network ile doğrula); preload yalnızca varsayılan temanın kritik fontları için.

### 1.5 Tema altyapısı
- `theme.config.ts`: `export const THEMES = ["arcade","classic"] as const; export type ThemeId = (typeof THEMES)[number];` + `THEME_REGISTRY: Record<ThemeId, …>` (tamlık derleyiciyle zorlanır) + `isThemeId` tip korumacısı. Tema ekleme = `themes.css` bloğu + `THEMES` girdisi.
- `BootScript`: HTML boyanmadan ÖNCE senkron çalışır; `localStorage[STORAGE_KEYS.theme]` değerini `THEMES` beyaz listesine karşı doğrular, geçersiz/erişilemezse `DEFAULT_THEME`; `<html data-theme>` yazar; tamamı `try/catch`. Next 16 dokümanının önerdiği yöntemi kullan. `<html>`'e `suppressHydrationWarning`.
- `ThemeProvider`/`useTheme()`: `useSyncExternalStore` ile `document.documentElement.dataset.theme` + `storage` olayı (sekmeler arası); sunucu anlık görüntüsü `DEFAULT_THEME`; `setTheme` doğrulayıp attribute + localStorage yazar. Efektle ilk-render sonrası tema değiştirip FOUC yaratma.
- Tema değiştirici ARAYÜZÜ bu fazda EKLENMEZ (görünür metin gerektirir; Faz 3'te sözlükle eklenecek). Doğrulama e2e'de `localStorage` ile yapılır.
- `src/app/admin/layout.tsx` kök sarmalayıcısına `data-theme={ADMIN_THEME}` (`classic`): yönetim arayüzü kullanıcı tema tercihinden bağımsız ve okunabilir kalır.

### 1.6 Tasarım sistemi bileşenleri
`components/design-system/{button,card,dialog,field,status}.tsx`: yalnızca token tüketir. `arcade`: sert piksel gölge, hover'da gölge kayması, `:active`'te `--shadow-pixel-pressed` + `translate`, `:focus-visible` pixel halka (soft `box-shadow` DEĞİL). `classic`: görünüm DEĞİŞMEZ. Tüm durumlar tanımlı (hover/focus/active/disabled). Hareket yalnızca `--motion-*`; `prefers-reduced-motion` altında kısalır.

### 1.7 Zorlayıcı testler (Vitest, `tests/unit/`)
- `theme-centralization.test.ts`: `src/**/*.{ts,tsx,css}` taranır (`themes.css`, `src/db/**`, `src/db/seeds/**`, testler hariç). Yasak: hex (`#rgb/#rrggbb/#rrggbbaa`, `href="#…"` yanlış pozitifleri ayıklanır), `rgb(a)/hsl(a)/oklch/lab(`, CSS bildirimlerinde renk adı (`transparent|currentColor|inherit` hariç), TSX inline `style`'da renk (yalnızca `var(--…)` ve özel özellik atamasına izin), SVG `fill/stroke` literal renk (`currentColor` serbest). Her istisna testte gerekçeli yorumla yazılır; sessiz muafiyet listesi YOK.
- `theme-parity.test.ts`: `themes.css` ayrıştırılır; her `THEMES` kimliği için blok var; tüm blokların özel özellik kümesi BİREBİR aynı; `src/**` içinde kullanılan her `var(--x)` `themes.css`'te tanımlı (tanımsız değişken = hata).
- `theme-contrast.test.ts`: iki tema için WCAG oranı hesaplanır: text/bg, text/surface, text-muted/bg, text-muted/surface, primary-contrast/primary, secondary-contrast/secondary, accent-contrast/accent (≥ 4.5); primary/bg, secondary/bg, focus/bg, border-strong/bg (≥ 3).

### 1.8 E2E (`tests/e2e/`)
- `theme.spec.ts`: ilk ziyaret `arcade`; `localStorage` `classic` iken `DOMContentLoaded`'da attribute mevcut ve `getComputedStyle` değerleri doğru (FOUC yok); geçersiz değer → varsayılan; `localStorage` erişimi throw ederken (init script ile) çökme yok; arcade seçiliyken `/admin` alt ağacı `classic` kalır.
- `visual-classic.spec.ts`: tema `classic` zorlanarak Faz 0 baseline'ı ile karşılaştır (`maxDiffPixelRatio ≤ 0.01`). Fark varsa kök nedeni düzelt; baseline'ı güncelleme YASAK.
- `tests/accessibility/shell.spec.ts` (axe) iki temada da 0 serious/critical.

## YASAKLAR
Backend/Drizzle/auth değişikliği; metin/i18n işi (Faz 3); rota config (Faz 2); `tema değiştirici UI`; renk kodunu `themes.css` dışına yazmak; `tailwind` eklemek; yeni bağımlılık (gerekçesiz).

## KABUL ÖLÇÜTLERİ (kanıt iste)
- `grep` + `theme-centralization` testi: `themes.css` dışında 0 renk literal'i.
- Arcade ve classic bloklarının token kümesi aynı; tanımsız `var()` yok; kontrast testleri yeşil.
- `classic` görsel regresyon ≤ %1 fark.
- Türkçe glif ekran görüntüsü kaydı; classic'te web font isteği yok.
- Faz 0 sonrası CSS boyutu karşılaştırması (gzip) ve font preload listesi raporlandı.
- typecheck, lint, test, integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + eşleme tablosu + kontrast tablosu + CSS/font boyut farkı.

```

```markdown
# FAZ 2 — Config-Güdümlü Rotalar, Gezinme, Metadata ve İkon Kayıt Defteri

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/` (metadata API, `sitemap`/`robots`, `Link`, `usePathname`).
2. `docs/design/sunum-katmani-kurallari.md` (TAMAMI) + `docs/operations/sunum-katmani-ilerleme.md`. Faz 1 kabul ölçütleri ✓ değilse DUR.
3. `src/components/layout/{header,footer,public-shell}.tsx`, `src/app/(public)/**/page.tsx`, `src/app/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/modules/links/domain/link.ts` (yalnızca `icons` kullanımını anlamak için; DEĞİŞTİRME).

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- DOKUNMA: `src/db/**`, Drizzle şeması/migration, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, `route.ts` işleyicileri, `scripts/**`, kimlik/oturum/CSRF/MFA. Yalnızca UI entegrasyonu için ZORUNLUYSA minimum + eklemeli değişiklik; önce raporda gerekçelendir.
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*`; rota/menü yalnızca `src/config/routes.config.ts`. JSX'te literal metin, dosyada renk kodu, dağınık sihirli sayı YASAK.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK.
- a11y: WCAG 2.2 AA, anlamsal HTML, `:focus-visible`, hedef ≥ 48 px, kontrast ≥ 4.5:1, `prefers-reduced-motion`.
- Performans: Lighthouse mobil ≥ 90 (üretim build'i), CLS≈0, LCP ≤ 2.5 s, varsayılan Server Component, yeni bağımlılık gerekçeli + sürümü sabit.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; faz sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Kanıtsız "tamamlandı" ve testi zayıflatma YASAK.
- Dal: `sunum/faz-2`; küçük commit (Türkçe); push/merge YOK.

## MİMARİ KARAR (değiştirme)
Blueprint'teki `[slug]` + `next/dynamic` "sayfa motoru" UYGULANMAZ: App Router dosya tabanlı rotaları zaten rota başına ayrı chunk üretir; motor kazanç sağlamaz, Next 16'da `params` Promise'tir ve `ssr:false` Server Component'te yasaktır. Mevcut dosya tabanlı rotalar KALIR. `routes.config.ts` yalnızca menü, footer, kabin menüsü, sitemap, metadata ve a11y etiketlerinin TEK kaynağıdır. "Yeni sayfa eklemek = config'e obje + `page.tsx`" hedefi test ile korunur.

## GÖREV

### 2.1 Sözlük iskeleti (Faz 3'ün temeli; API'yi BURADA kilitle)
Bu faz görünür metin gerektirir; hardcode YASAK olduğundan Faz 3'ün mimarisinin çekirdeği şimdi kurulur:
- `src/i18n/dictionaries/tr.ts`: şimdilik yalnızca `brand`, `nav`, `footer`, `meta`, `a11y` ad alanları. Mevcut Türkçe metinleri (menü adları, "İçeriğe geç", "Menü", marka açıklaması, sayfa başlık/açıklamaları) BİREBİR taşı; yeniden yazma/uydurma YOK.
- `src/i18n/keys.ts`: sözlükten türetilen `DictionaryKey` (özyinelemeli yaprak yolu tipi, ör. `{ [K in keyof T & string]: T[K] extends string ? \`${P}${K}\` : Leaves<T[K], \`${P}${K}.\`> }[keyof T & string]`).
- `src/i18n/translate.ts`: `getTranslator(): Promise<TranslateFn>` ve `type TranslateFn = (key: DictionaryKey, params?: Record<string, string | number>) => string`. Bu fazda yalnızca TR döner; imza Faz 3'te DEĞİŞMEZ (yalnızca iç gerçekleme dil çerezini okur). `{param}` enterpolasyonu desteklenir; eksik anahtar derleme hatasıdır.

### 2.2 `src/config/routes.config.ts`
```ts
export const ROUTE_IDS = ["home","about","ulujam","events","announcements","games","links","support"] as const;
export type RouteId = (typeof ROUTE_IDS)[number];
export interface RouteEntry {
  id: RouteId;
  path: `/${string}`;
  labelKey: DictionaryKey;
  titleKey: DictionaryKey;
  descriptionKey: DictionaryKey;
  icon: IconId;
  order: number;
  placements: { navbar: boolean; arcadeMenu: boolean; footer: boolean };
  sitemap: { include: boolean; changeFrequency: "daily"|"weekly"|"monthly"; priority: number };
  arcade?: { tone: "primary"|"secondary"|"accent"; size: "sm"|"md"|"lg" };
}
export const ROUTES = [ /* … */ ] as const satisfies readonly RouteEntry[];
```
Yardımcılar: `getRoutes(placement)` (order'a göre sıralı), `getRoute(id)`, `NON_INDEXABLE_PREFIXES` (`/admin`, `/api`, `/l/`), `UNLISTED_ROUTES` (kasıtlı muaflar). Mevcut sekiz genel rota (`/`, `/hakkimizda`, `/ulujam`, `/etkinlikler`, `/duyurular`, `/oyunlar`, `/linkler`, `/destek`) mevcut menü sırasıyla kaydedilir. `tone` yalnızca token adı seçer; renk kodu YOK.

### 2.3 İkon kayıt defteri
`src/components/ui/icons/`: `IconId` birleşimi (`home, calendar, announcement, jam, trophy, link, about, support, menu, close, external, check, copy`) ve `Icon` bileşeni. Özel 16×16 piksel-ızgara SVG'ler, `shape-rendering="crispEdges"`, `fill="currentColor"`, varsayılan `aria-hidden="true"` + `focusable="false"`. Emoji ve ikon kütüphanesi YOK. `modules/links/domain/link.ts`'teki `icons` eşlemesi DEĞİŞTİRİLMEZ; UI katmanında `item.icon` → `IconId` eşleyen tek bir adaptör yaz (bilinmeyen → `link`).

### 2.4 Gezinme
- `Header` Server Component: `getRoutes("navbar")` + `getTranslator()` ile öğeleri hesaplar, istemci yaprağı `HeaderNav`'a yalnızca `{href,label,iconId}` prop'u geçirir (sözlük istemciye gitmez). `Footer` ve `PublicShell` da config/sözlükten beslenir; sayfa başına `PublicShell` kullanımı DEĞİŞTİRİLMEZ.
- `HeaderNav` (client): tek `<nav aria-label>` (mobilde ikinci DOM kopyası YOK); menü düğmesi gerçek `<button>` + `aria-expanded` + `aria-controls`; Escape kapatır ve odağı düğmeye iade eder; dış tıklama ve rota değişimi kapatır; kapalıyken öğeler odak/AT'den çıkar; hedefler ≥ `--touch-target-min`; tam eşleşmede `aria-current="page"`, alt rotada (ör. `/etkinlikler/x`) yalnızca görsel `data-active`.
- Hamburger ikonu özel `menu/close` SVG'si (jenerik değil, temaya uygun).
- Mevcut `skip` bağlantısı korunur (metin sözlükten).

### 2.5 SEO merkezi
- `src/seo/build-metadata.ts`: `buildMetadata(routeId)` → title (`titleKey`), description, kanonik, Open Graph/Twitter metin alanları. `og:image` yalnızca onaylı statik görsel varsa; yoksa EKLEME (uydurma görsel YOK).
- Tüm genel sayfalardaki statik `metadata` dışa aktarımları `generateMetadata` + `buildMetadata` ile değiştirilir. Detay sayfaları (`/etkinlikler/[slug]`, `/duyurular/[slug]`) DB içeriğinden başlık üretir; bulunamayan içerik mevcut `noindex` davranışını korur.
- `sitemap.ts` ve `robots.ts` Faz 0'daki geçici listeyi bırakıp `ROUTES` ve `NON_INDEXABLE_PREFIXES`'ten beslenir.

### 2.6 Zorlayıcı testler (Vitest)
- `tests/unit/routes-integrity.test.ts`: `src/app/page.tsx` ve `src/app/(public)/**/page.tsx` taranır (dinamik segmentli olanlar hariç); her statik genel rota `ROUTES` içinde VEYA `UNLISTED_ROUTES` içinde olmalı; her `ROUTES.path` için sayfa dosyası var; `order` benzersiz; `labelKey/titleKey/descriptionKey` sözlükte mevcut.
- `tests/unit/seo.test.ts`: sitemap yalnızca `include:true` rotaları + yayımlı içeriği içerir; robots yasak önekleri içerir.
- E2E: menü sırası/etiketleri config ile aynı; klavye ile Tab → menü → Enter gezinme; mobil (375 px) menü aç/kapat/Escape/odak iadesi; `aria-current` doğru; `tests/accessibility/shell.spec.ts` iki temada 0 serious/critical.

## YASAKLAR
`[slug]` sayfa motoru; `next/dynamic` ile rota yükleme; `tailwind`; hardcode metin; yeni rota/sayfa içeriği; backend/Drizzle/auth değişikliği; dil çerezi/i18n altyapısı (Faz 3).

## KABUL ÖLÇÜTLERİ (kanıt iste)
- Menü, footer, sitemap, metadata tek `routes.config.ts`'ten besleniyor; geçici "FAZ-2" işaretleri kalmadı.
- Config'e geçici bir giriş + boş `page.tsx` ekleyip menüde/sitemap'te çıktığını gösteren prova yapıldı ve GERİ ALINDI (kanıt: diff).
- Routes-integrity ve SEO testleri yeşil.
- Header JS'i faz öncesine göre ölçüldü (istemci bundle farkı raporlandı).
- typecheck, lint, test, integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + yeni dosya ağacı + istemci bundle farkı.

```

```markdown
# FAZ 3 — %100 Merkezi i18n (TR/EN): Tek Sözlük, Sıfır Hardcode Metin

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/` (`cookies()`, Server Actions, caching etkileşimi, `generateMetadata`, root layout).
2. `docs/design/sunum-katmani-kurallari.md` (TAMAMI) + `docs/operations/sunum-katmani-ilerleme.md`. Faz 2 kabul ölçütleri ✓ değilse DUR.
3. `src/i18n/**` (Faz 2 iskeleti), `src/config/*`, `src/app/layout.tsx`, tüm `src/app/**/page.tsx`, `src/components/**`, `src/modules/*/ui/**`, `src/modules/community/**`.

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- DOKUNMA: `src/db/**`, Drizzle şeması/migration, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, `route.ts` işleyicileri, `scripts/**`, kimlik/oturum/CSRF/MFA. Yalnızca UI entegrasyonu için ZORUNLUYSA minimum + eklemeli değişiklik; önce raporda gerekçelendir.
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*`; rota/menü yalnızca `src/config/routes.config.ts`. JSX'te literal metin, dosyada renk kodu, dağınık sihirli sayı YASAK.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK.
- a11y: WCAG 2.2 AA, anlamsal HTML, `:focus-visible`, hedef ≥ 48 px, kontrast ≥ 4.5:1, `prefers-reduced-motion`.
- Performans: Lighthouse mobil ≥ 90 (üretim build'i), CLS≈0, LCP ≤ 2.5 s, varsayılan Server Component, yeni bağımlılık gerekçeli + sürümü sabit.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; faz sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Kanıtsız "tamamlandı" ve testi zayıflatma YASAK.
- Dal: `sunum/faz-3`; küçük commit (Türkçe); push/merge YOK.

## MİMARİ HEDEF — MERKEZİLEŞTİRME (ZORUNLU)
Kodda kullanıcıya görünen HİÇBİR metin sözlük dışında yazılmaz: JSX metni, `aria-label`, `alt`, `title`, `placeholder`, metadata, boş durum, hata/durum mesajı, düğme etiketi, sayfa başlığı, mini oyun metinleri, tarih/sayı biçimi dahil. Hedef yapı:

- `src/i18n/config.ts`: `LOCALES = ["tr","en"] as const`, `Locale`, `DEFAULT_LOCALE = "tr"`, `isLocale`, `LOCALE_BCP47` (`tr→tr-TR`, `en→en-GB`), `DISPLAY_TIME_ZONE = "Europe/Istanbul"`; çerez adı `COOKIE_KEYS.locale`'den.
- `src/i18n/dictionaries/tr.ts`: KAYNAK sözlük (iç içe nesne). `Dictionary` tipi bundan türetilir (yapraklar `string`).
- `src/i18n/dictionaries/en.ts`: `export const en: Dictionary` — eksik/fazla anahtar DERLEME hatasıdır.
- `src/i18n/dictionaries/index.ts`: `DICTIONARIES: Record<Locale, Dictionary>`.
- `src/i18n/server.ts`: `getLocale()` (çerez → `isLocale` doğrulama → varsayılan; `React.cache`), `getTranslator(locale?: Locale)`, `getDictionarySlice(namespaces)`.
- `src/i18n/client.tsx`: `I18nProvider` + `useTranslator(namespace)`; yalnızca `CLIENT_NAMESPACES` (tek sabit liste) dilimleri istemciye gider; TAM sözlük istemci bundle'ına GİRMEZ.
- `src/i18n/format.ts`: tarih/saat/sayı/göreli zaman yalnızca `Intl.*` + `LOCALE_BCP47` + `DISPLAY_TIME_ZONE` ile. Bileşenlerde `toLocaleString("tr-TR")` gibi dağınık çağrı YASAK.
- `src/i18n/actions.ts`: `setLocaleAction(formData)` Server Action (kimlik doğrulama mekanizması DEĞİL): değeri `isLocale` ile doğrula, çerezi `httpOnly`, `sameSite: "lax"`, `secure` (üretimde), `path: "/"`, 1 yıl ile yaz.
- Anahtarlar: noktalı yol (`events.list.empty`), enterpolasyon `{param}`, çoğul `.one/.other` + `Intl.PluralRules` yardımcısı. Marka adları (ULUDOTT, UluJam) çevrilmez.

## GÖREV

### 3.1 Envanter
Tüm `src/**/*.{ts,tsx}` (admin dahil) içindeki kullanıcıya görünen dizeleri tara; tabloyu (dosya, metin, anahtar önerisi, ad alanı) `docs/operations/sunum-katmani-ilerleme.md` içine yaz. Arka uç/API'nin döndürdüğü mesajlar (`application/http.ts`, Zod mesajları) ve DB içeriği (etkinlik/duyuru başlık-açıklamaları) KAPSAM DIŞIDIR; UI'daki sabit sargı metinleri kapsam İÇİDİR.

### 3.2 Ad alanları
`brand, nav, footer, meta, a11y, common, theme, language, status, errors, home, about, ulujam, events, announcements, games, links, support, miniGames, countdown, intro` (genel yüzey: TR/EN TAM eşlik zorunlu) ve `admin.*` (yönetim arayüzü: TR zorunlu, EN opsiyonel; `getTranslator("tr")` ile sabit TR). `intro` Faz 4 için ayrılır; yer tutucu metin YAZMA (boş ad alanı bırak veya Faz 4'te doldur).

### 3.3 Dil çözümleme ve önbellek
`getLocale()` yalnızca TEK noktada `cookies()` okur (kök layout + çağıranlar `getLocale`/`getTranslator` üzerinden). `<html lang={locale}>`. Next 16 dokümanına göre `cookies()` okumasının rota önbelleğine etkisini belirle ve `docs/operations/sunum-katmani-ilerleme.md` içinde bu ödünleşimi yaz (Faz 0'daki veri seviyesi önbellek DB yükünü korumalı). Üretim build'inde `/` için TTFB ölç ve raporla.

### 3.4 Dönüşüm
- Tüm genel sayfalar, `components/**`, `modules/*/ui/**`, `modules/community/**` (mini oyun metinleri; `game-logic.tsx` MANTIĞINA dokunma), `design-system/status.tsx` (durum etiketleri anahtar eşlemesi), link merkezi mesajları ("Kopyalandı…" vb.), `aria-live` duyuruları, `alt`/`aria-label`, `generateMetadata` (Faz 2 `buildMetadata` artık dil duyarlı).
- Admin arayüzü (`src/app/admin/**`, `modules/*/ui/**` yönetim bileşenleri): yalnızca görünür metin sözlüğe taşınır; kimlik doğrulama/CSRF/MFA akışları ve form mantığı DEĞİŞTİRİLMEZ. `tests/e2e/admin-login.spec.ts` ve ilgili entegrasyon testleri yeşil kalmalı.
- DB kaynaklı içerik arayüz dili `tr` değilken gösteriliyorsa kapsayıcıya `lang="tr"` ver (ekran okuyucu telaffuzu) ve bunu `common` ad alanındaki bir notla belirt.
- Tarih/saat görüntüleri `DISPLAY_TIME_ZONE` ile (sunucu saat diliminden bağımsız).

### 3.5 Değiştiriciler (Header içinde, Faz 2 `HeaderNav`)
- `LanguageToggle`: `<form action={setLocaleAction}>` ile çalışır (JS kapalıyken de); düğmeler `lang` özniteliği taşır, geçerli dil `aria-current="true"`; görünür etiketler `language.*` sözlüğünden.
- `ThemeToggle`: `THEMES`'e göre ölçeklenen yerel `<select>` veya radyo grubu (N tema desteklenmeli); etiketler `theme.*` sözlüğünden; `THEME_REGISTRY.labelKey` artık `DictionaryKey`'e daraltılır (derleme zamanı doğrulama).
- Hedef ≥ 48 px, `:focus-visible`, anlamsal kontrol.

### 3.6 Zorlayıcı testler (Vitest)
- `tests/unit/i18n-parity.test.ts`: genel ad alanlarında `tr`/`en` anahtar kümesi BİREBİR aynı; boş dize yok; `{param}` yer tutucuları iki dilde aynı; `TODO/FIXME/lorem` yok; `admin.*` yalnızca TR zorunlu.
- `tests/unit/no-hardcoded-text.test.ts` (`typescript` derleyici API'siyle AST taraması, yeni bağımlılık YOK): kapsam `src/**/*.tsx` + UI katmanı `.ts` dosyaları (`src/db/**`, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, `src/i18n/**` hariç). Hata: boşluk/noktalama dışı `JsxText`; `{"literal"}` JSX ifadesi; metin taşıyan öznitelikler (`alt, aria-label, aria-description, title, placeholder, label`) içinde literal dize; kullanıcıya gösterilen state/prop'a atanan, Türkçe harf (`ç ğ ı ö ş ü İ`) içeren veya çok sözcüklü dize literal'leri. Muaf öznitelikler: `className, id, htmlFor, type, role, href, src, name, key, rel, target, data-*`; import tanımlayıcıları; `"use client"`/`"use server"`. Her muafiyet testte gerekçeli yorumla yazılır.
- `tests/unit/i18n-unused.test.ts`: kullanılmayan anahtarları RAPORLA (başarısız etme; çıktıyı faz raporuna ekle).

### 3.7 E2E
- İlk ziyaret TR; dil değiştirince tüm genel rotalar EN (`<html lang>`, menü, başlık, boş durumlar, mini oyun metinleri); yenilemede kalıcı; JS kapalıyken form ile dil değişir; geçersiz çerez → TR; `/admin` TR sabit.
- axe: genel rotalar × iki tema × iki dil, 0 serious/critical.

### 3.8 Performans
İstemci bundle farkı (faz öncesi/sonrası) ve `CLIENT_NAMESPACES` boyutu raporlanır. Üretim build'inde `/` için Lighthouse mobil çalıştır; ≥ 90 değilse nedenini ve düzeltmeyi yaz. Lighthouse çalıştırılamıyorsa "doğrulanmadı" olarak işaretle.

### 3.9 EN çeviri kalitesi
Doğal, kısa, topluluk tonunda İngilizce; kelimesi kelimesine çeviri YOK; marka adları sabit; Türkçe'ye özgü kavramlar (ör. "derece") için seçilen karşılığı `docs/` notuna yaz. Çeviri kopyalarını sözlük dışında tutma.

## YASAKLAR
URL tabanlı locale (`/en/...`); sözlük dışı metin; metin için `JSON` + tip güvensiz arama; tam sözlüğü istemciye göndermek; DB içerik şeması/çeviri kolonu ekleme; backend mesajlarını değiştirme; yeni sayfa içeriği.

## KABUL ÖLÇÜTLERİ (kanıt iste)
- `no-hardcoded-text` ve `i18n-parity` testleri yeşil (ve kasıtlı hardcode eklenince KIRMIZI olduğu gösterildi, geri alındı).
- `en: Dictionary` tip tamlığı derleyiciyle doğrulandı (bir anahtar silinince `typecheck` kırılıyor, kanıtla).
- Tüm genel rotalar iki dilde çalışıyor (e2e).
- `getLocale()` dışında `cookies()` çağrısı yok.
- İstemci bundle farkı + TTFB + Lighthouse sonucu raporlandı.
- typecheck, lint, test, integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + envanter tablosu + ödünleşim notu (çerez/önbellek) + kullanılmayan anahtar raporu.

```

```markdown
# FAZ 4 — Press Start Intro ve Arcade Ana Sayfa

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/`; `docs/design/sunum-katmani-kurallari.md` (TAMAMI); `docs/operations/sunum-katmani-ilerleme.md`. Faz 3 kabul ölçütleri ✓ değilse DUR.
2. `src/app/page.tsx`, `src/components/layout/*`, `src/config/{boot-script,storage-keys,theme.config,routes.config}.ts`, `src/components/boot/BootScript.tsx`, `src/modules/events/ui/{countdown,event-card,ulujam-coming-soon}.tsx`.

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- DOKUNMA: `src/db/**`, Drizzle şeması/migration, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, `route.ts` işleyicileri, `scripts/**`, kimlik/oturum/CSRF/MFA. Yalnızca UI entegrasyonu için ZORUNLUYSA minimum + eklemeli değişiklik; önce raporda gerekçelendir.
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*`; rota/menü yalnızca `src/config/routes.config.ts`. JSX'te literal metin, dosyada renk kodu, dağınık sihirli sayı YASAK.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK.
- a11y: WCAG 2.2 AA, anlamsal HTML, `:focus-visible`, hedef ≥ 48 px, kontrast ≥ 4.5:1, `prefers-reduced-motion`.
- Performans: Lighthouse mobil ≥ 90 (üretim build'i), CLS≈0, LCP ≤ 2.5 s, varsayılan Server Component, yeni bağımlılık gerekçeli + sürümü sabit.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; faz sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Kanıtsız "tamamlandı" ve testi zayıflatma YASAK.
- Dal: `sunum/faz-4`; küçük commit (Türkçe); push/merge YOK.

## GÖREV

### 4.1 Önyükleme betiği (tek script)
Faz 1'deki `BootScript` genişletilir; İKİNCİ inline script EKLENMEZ. Betik: `sessionStorage[STORAGE_KEYS.introSeen] === "true"` ise `<html data-intro-seen="true">` yazar; yalnızca `"true"` değeri geçerli; tamamı `try/catch`. Anahtar ve değerler `storage-keys.ts` / `boot-script.ts` sabitlerinden üretilir.

### 4.2 CSS ve JS-kapalı güvenliği
- `base.css`: `#press-start-intro` varsayılan görünür; `html[data-intro-seen="true"] #press-start-intro { display: none; }` (hidrasyonu beklemeden).
- `<noscript><style>` ile JS kapalıyken intro gizlenir (site kilitlenmemeli; tarayıcı botları içeriği görür). İçerik DOM'da kalır; `visibility:hidden` ile gizleme YASAK (SEO/LCP).
- Intro YALNIZCA `/` rotasında render edilir; derin bağlantılarda DOM'da yoktur.

### 4.3 `useIntroGate` ve `PressStartIntro`
- `src/hooks/useIntroGate.ts`: `useSyncExternalStore` ile `data-intro-seen` attribute'u; `dismiss()` hem `sessionStorage.setItem` (try/catch) hem attribute yazar. Efekt tabanlı ilk-render senkronu YOK (flaş riski).
- `PressStartIntro` (Client, `/` içinde): marka logosu (mevcut `public/brand/uludott-white.svg`, `next/image`, boyutlu), yanıp sönen CTA (`intro.pressStart`), ipucu (`intro.hint`); metinler Faz 3 sözlüğünde `intro` ad alanında (TR+EN) tanımlanır.
- CRT açılışı SAF CSS keyframes (dikey çizgiden açılma, parlaklık/glow `--glow-primary`, `--ease-snap` ile adımlı titreme); toplam ≤ 1.8 s; CTA ≤ 1.2 s'de etkileşilebilir; tüm süreler `--motion-*`. `motion` kütüphanesi EKLEME.
- Kapatma: gerçek `<button>` (Enter/Space/tıklama), dokunma, Escape ve Tab/Shift/modifier dışındaki herhangi bir tuş. Ses YOK.
- Semantik: `role="dialog" aria-modal="true" aria-labelledby`; görünürken `main`, header ve footer `inert`; açılışta odak düğmede; kapanışta odak `#main-content`'e iade edilir.
- `prefers-reduced-motion: reduce`: animasyon ≤ 200 ms, yanıp sönme yok (statik imleç), tamamen kaldırma.

### 4.4 Ana sayfa kompozisyonu (Server Component, `src/app/page.tsx`)
- `PublicShell` `variant="home"` kabul eder: bu varyantta Header RENDER EDİLMEZ; birincil gezinme kabin `<nav aria-label>`'dır; skip bağlantısı ve footer kalır; dil/tema değiştiriciler kabin üst çubuğunda (Faz 3 bileşenleri yeniden kullanılır, kopya YOK).
- Bölümler (hepsi sözlükten, mevcut Türkçe kopya korunur: "Fikirden oyuna. Birlikte." vb.): hero; `ArcadeCabinetMenu`; öne çıkan etkinlikler (mevcut `getFeaturedEvents` + `EventCard`, boş durum doğru); ULUJAM teaser (mevcut `coming_soon/counting/started` mantığı KORUNUR, sayısal geri sayım yalnızca tarih yayımlıysa).
- Mevcut üç özdeş `Card` bloğu KALDIRILIR; yerine birbirinden farklı kompozisyonlar (asimetrik yerleşim, numaralı bölüm şeridi, "skor tablosu" şeridi). Jenerik "feature grid" YASAK.
- Tek `h1`; başlık hiyerarşisi bozulmaz.

### 4.5 `ArcadeCabinetMenu`
- Server Component; veri `getRoutes("arcadeMenu")`; her kabin gerçek `next/link` `<a>` (gezinme bağlantıdır, `button` değil); `arcade.tone/size` yalnızca token sınıflarını seçer (renk kodu YOK); ikonlar Faz 2 `Icon`.
- TEK DOM: masaüstünde asimetrik kabin kompozisyonu (CSS grid `grid-template-areas`, farklı boyutlar), mobilde (≤ 375 px dahil) dikey kalın buton listesi (yükseklik ≥ 64 px). İkinci DOM kopyası YOK.
- Etkileşim: hover/focus'ta ölçek + gölge kayması + ikonun "canlanması" (CSS `steps()`); `:active`'te `--shadow-pixel-pressed` + `translate`; yalnızca renk değişimi YETMEZ; `:focus-visible` pixel halka.
- Metinler `labelKey`'den.

### 4.6 Arka plan atmosferi
Scanline `repeating-linear-gradient` + `--fx-scanline-opacity` (classic'te 0), `pointer-events:none`, `aria-hidden`. Tam ekran `blur` animasyonu ve sürekli `will-change` YASAK. `prefers-reduced-motion` altında hareketli efekt yok.

### 4.7 Testler
- E2E (`tests/e2e/intro.spec.ts`): ilk ziyarette intro görünür; aynı sekmede yenilemede gizli; yeni tarayıcı bağlamında yeniden görünür; Enter/Space/harf tuşu/Escape/dokunma (`hasTouch`) kapatır; Tab kapatmaz ve odak düğmeye gider; kapanışta odak `main`'de; reduced-motion'da süre ≤ ~200 ms; JS kapalıyken intro görünmez ve içerik erişilebilir; `/ulujam` doğrudan açılışta intro YOK; `sessionStorage` erişimi throw ederken çökme yok.
- Kabin: `href`'ler config ile aynı; TR/EN etiketler; 375 px'te her hedef ≥ 48 px (ölçerek doğrula); klavye ile tüm kabinlere erişim.
- axe: `/` iki tema × iki dil, 0 serious/critical.
- `tests/unit`: kabin öğe sayısı = `getRoutes("arcadeMenu").length`.

### 4.8 Performans (üretim build'i)
`/` için Lighthouse mobil ≥ 90 (4 kategori), LCP ≤ 2.5 s, CLS ≈ 0, ilk yük JS < 150 KB gzip. Intro overlay LCP'yi geciktirmemeli. Lighthouse çalıştırılamazsa "doğrulanmadı" yaz ve Playwright `PerformanceObserver` ile LCP/CLS vekil ölçümlerini ekle.

## YASAKLAR
`motion`/framer-motion bağımlılığı; ses; hardcode metin/renk; iki ayrı kabin DOM'u; header'ı `visibility`/`opacity` ile gizlemek; backend değişikliği; yeni sayfa içeriği (Faz 5).

## KABUL ÖLÇÜTLERİ (kanıt iste)
- Intro e2e senaryolarının tamamı yeşil; tek inline script.
- `/` Lighthouse mobil 4 kategori ≥ 90 (veya "doğrulanmadı" + vekil ölçüm).
- Ana sayfa hâlâ DB'den öne çıkan etkinliği gösteriyor; boş DB doğru boş durum.
- typecheck, lint, test (+ hardcode/centralization testleri), integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + Lighthouse/bundle/LCP/CLS tablosu + ekran görüntüleri (arcade/classic, masaüstü/mobil).

```

```markdown
# FAZ 5 — Alt Sayfa Kompozisyonları, Mini Oyunlar, 404/Hata Sayfaları

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/` (`next/image`, `dynamic`, `not-found`, `error`); `docs/design/sunum-katmani-kurallari.md` (TAMAMI); `docs/operations/sunum-katmani-ilerleme.md`. Faz 4 kabul ölçütleri ✓ değilse DUR.
2. `src/app/(public)/**`, `src/modules/{events,games,links,community,publication}/ui/**`, `docs/operations/{ulujam-archive,historical-results,links,media}.md`.

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- DOKUNMA: `src/db/**`, Drizzle şeması/migration, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, `route.ts` işleyicileri, `scripts/**`, kimlik/oturum/CSRF/MFA. Yalnızca UI entegrasyonu için ZORUNLUYSA minimum + eklemeli değişiklik; önce raporda gerekçelendir.
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*`; rota/menü yalnızca `src/config/routes.config.ts`. JSX'te literal metin, dosyada renk kodu, dağınık sihirli sayı YASAK.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK.
- a11y: WCAG 2.2 AA, anlamsal HTML, `:focus-visible`, hedef ≥ 48 px, kontrast ≥ 4.5:1, `prefers-reduced-motion`.
- Performans: Lighthouse mobil ≥ 90 (üretim build'i), CLS≈0, LCP ≤ 2.5 s, varsayılan Server Component, yeni bağımlılık gerekçeli + sürümü sabit.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; faz sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Kanıtsız "tamamlandı" ve testi zayıflatma YASAK.
- Dal: `sunum/faz-5`; küçük commit (Türkçe); push/merge YOK.

## GÖREV
Her sayfa içerik türüne özgü bir kompozisyona sahip olur (aynı "başlık + kart ızgarası" şablonunun kopyası YASAK). Ortak yalnızca `PageHeader` (kicker/başlık/lede) ve `Section` ilkelleridir. Tüm metin sözlükten (TR+EN), tüm stil token'dan, tüm metadata `buildMetadata`'dan gelir. Mevcut veri/iş kuralları KORUNUR.

### 5.1 `/etkinlikler` ve `/etkinlikler/[slug]`
Dikey zaman çizelgesi (yaklaşan → geçmiş); tarih rozeti (`format.ts`, `Europe/Istanbul`); durum etiketi (`status.tsx`); doğru boş durum. Detay: afiş (`next/image`, boyutlu), mevcut form CTA davranışı korunur. Geçmiş/gelecek ayrımı mevcut servis mantığından gelir; UI'da yeniden hesaplama YOK.

### 5.2 `/duyurular` ve `/duyurular/[slug]`
Editoryal akış (tarih + başlık + özet). Yazılarımız için ayrı modül/şema EKLEME; "Yazılarımız" kararı (duyuruları genişletme) backend/şema değişikliği gerektirir → UYGULAMA, raporda "onay bekliyor" olarak listele.

### 5.3 `/ulujam`
Yıl seçimi mevcut arşiv verisinden (yıl kod içine GÖMÜLMEZ); 2026 arşivi + finalistler; 2027 "Yakında" ve geri sayım mevcut `countdown` mantığıyla (tarih yoksa sayısal geri sayım ve başvuru YOK); galeri "vitrin" kompozisyonu (asimetrik). Lightbox: Client sarmalayıcı içinde `dynamic(..., { ssr: false })` ile AYRI chunk (yalnızca açılınca yüklenir); `role="dialog"`, odak tuzağı, Escape, ok tuşlarıyla gezinti, odak iadesi, her görselde `alt`. Görseller mevcut medya türevlerinden (`/media/[variantId]`), `next/image` + boyut + `sizes`; ilk görsel dışında `loading="lazy"`.

### 5.4 `/oyunlar`
"HIGH SCORE" skor tablosu: yalnızca derece + URL ile 1-2-3 (tarihî sonuç kuralları KORUNUR; bilinmeyen alanlar `NULL` ise render edilmez, uydurma ad/takım/görsel YOK; yeni yıl istisna sınırı bozulmaz). Dış bağlantılar `rel="noopener noreferrer"`, yeni sekme uyarısı sözlükten (SR metni).

### 5.5 `/linkler`
Bağlantı merkezi kartları token'larla yeniden giydirilir; kopyala/QR diyalogları a11y standardında (odak tuzağı, Escape, iade); durum mesajları `aria-live="polite"`; `/l/[id]` ve QR rotalarına DOKUNMA.

### 5.6 `/hakkimizda` ve `/destek`
Mevcut metinler sözlüğe taşınmış hâliyle kompozisyon yenilenir. Ekip bölümü YALNIZCA gerçek veri kaynağı varsa render edilir; yoksa bölüm HİÇ görünmez (uydurma isim/rol/görsel YOK).

### 5.7 Mini oyunlar (`modules/community/*`)
`pair-match` ve `star-catch` "kabin ekranı" çerçevesine (token'lı) taşınır. `game-logic.tsx` fonksiyonlarına DOKUNMA; `tests/unit/mini-games.test.ts` yeşil kalır. Klavye erişimi: kartlar/hedefler gerçek `<button>`, `aria-pressed`/erişilebilir ad; `star-catch` için klavye alternatifi yoksa UI katmanında ekle ve raporla; zamanlayıcı/otomatik hareket `prefers-reduced-motion` altında durur; sonuç `aria-live`.

### 5.8 404 ve hata sayfaları
`src/app/not-found.tsx` ("GAME OVER" kompozisyonu, ana sayfaya dönüş bağlantısı) ve `src/app/error.tsx` (Client; `errors` sözlük dilimi); metinler TR/EN; `noindex` davranışı doğru; arka uç hata ayrıntısı kullanıcıya sızdırılmaz.

### 5.9 Testler
- E2E: her genel rota × iki tema × iki dil: axe 0 serious/critical; başlık hiyerarşisi (tek `h1`); klavye ile tam gezinti; lightbox senaryosu (aç/ok tuşları/Escape/odak iadesi); 2027 tarihsiz → geri sayım yok; tarih verilince yayımlı geri sayım (mevcut e2e korunur).
- Chunk doğrulaması: lightbox JS'i yalnızca açıldığında ağdan gelir (Playwright network kaydıyla kanıtla).
- Görsel kontrol: her sayfa için arcade/classic × masaüstü/mobil ekran görüntüsü (raporda).
- `tests/unit/no-hardcoded-text` ve `theme-centralization` yeşil.

### 5.10 Performans
Her genel rota için üretim build'inde Lighthouse mobil: 4 kategori ≥ 90; CLS ≈ 0 (özellikle galeri/afiş). Çalıştırılamazsa "doğrulanmadı" + vekil ölçüm. Sayfa başına ilk yük JS'i raporla.

## YASAKLAR
`/iletisim` ve iletişim formu (Faz 6, form motoru gerekir); "Yazılarımız" için şema/modül; backend/Drizzle/auth değişikliği; uydurma ekip/etkinlik/tarih/konum/telefon/e-posta; hardcode metin/renk; emoji ikon; birbirinin kopyası sayfa şablonu.

## KABUL ÖLÇÜTLERİ (kanıt iste)
- Tüm genel rotalar iki tema × iki dilde axe temiz; Lighthouse mobil ≥ 90 (veya "doğrulanmadı").
- Lightbox ayrı chunk (ağ kanıtı).
- Mini oyun birim testleri değişmeden yeşil.
- Sayfa kompozisyonları görsel olarak birbirinden ayrışıyor (ekran görüntüleri).
- typecheck, lint, test, integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + sayfa başına Lighthouse/JS tablosu + "onay bekleyenler" (Yazılarımız, ekip verisi, og görseli).

```

```markdown
# FAZ 6 — Ürün Yol Haritası: Form Motoru Görevleri (Plan Görev 11–14) ve İletişim

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/` (Server Actions, route handlers, caching).
2. `docs/design/sunum-katmani-kurallari.md` (TAMAMI), `docs/operations/sunum-katmani-ilerleme.md`. Faz 5 kabul ölçütleri ✓ değilse DUR.
3. `docs/design/2026-10-02-uygulama-plani.md`: "Global kısıtlar", "Review Focus", "Her görevde zorunlu dosya kontrolü" ve Görev 11, 12, 13, 14 bölümleri (TAMAMI). `docs/design/2026-10-01-mimari-oneri.md`, `docs/operations/form-definitions.md`, `docs/operations/publication.md`, `docs/operations/admin-auth.md`, `src/modules/forms/**`, `src/db/schema/forms.ts`, `src/modules/admin/domain/permissions.ts`.

## BU FAZIN İSTİSNASI
Önceki fazlarda arka uç dokunulmazdı. Bu faz, takımın kendi planındaki Görev 11–14'ü uygulamak için YENİ modül/servis/rota eklemeyi AÇIKÇA gerektirir. Kurallar: plan ile bu prompt çelişirse PLANI uygula ve çelişkiyi raporla. Mevcut Drizzle şeması/migration'lara dokunma; plan açıkça gerektiriyorsa yalnızca YENİ ve EKLEMELİ migration (`pnpm db:generate`, SQL incelemesi raporda). Mevcut kimlik/oturum/CSRF/MFA mekanizmaları DEĞİŞTİRİLMEZ; yeni yönetim uç noktaları mevcut oturum/CSRF/izin yardımcılarını YENİDEN KULLANIR; gerekirse `permissions.ts`'e yalnızca yeni izin anahtarı eklenir (matris testleri güncellenir ve raporlanır).

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*` (`forms.*`, `admin.forms.*` ad alanları; genel yüzey TR+EN eşlik, yönetim TR); rota/menü yalnızca `src/config/routes.config.ts`. JSX'te literal metin, dosyada renk kodu YASAK.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK; sınır verisi Zod ile.
- a11y: WCAG 2.2 AA. Form kontrolleri: görünür `<label>`, `aria-describedby` ile hata/yardım, hata özeti odağa alınır, `aria-invalid`, zorunlu alan işareti yalnızca renkle değil, hedef ≥ 48 px.
- Performans: Lighthouse mobil ≥ 90; form sayfaları varsayılan Server Component + minimum istemci JS.
- Veri dürüstlüğü: gerçek tarih/konum/telefon/e-posta/hukuk metni UYDURMA. Eksik dış bağımlılıkta (Turnstile anahtarı, bildirim sağlayıcısı, hukuk metni) uydurma YOK: adapter arayüzü + özellik bayrağıyla KAPALI uygulama, raporda "dış bağımlılık bekliyor".
- Planın kendi disiplini geçerli: her kutucuk için ilgili dosyayı önce/sonra yeniden oku; kırmızı→yeşil test kanıtı; kanıtsız işaretleme YASAK.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; görev sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Testi zayıflatma YASAK.
- Dal: `sunum/faz-6`; küçük commit (Türkçe); push/merge YOK.

## GÖREV
GÖREVLERİ TEK TEK uygula; her görev sonunda DUR, kısa rapor ver ve onay bekle.

### 6.1 Görev 11 — Panelde form oluşturma, önizleme, yayınlama
Planın dosya/rota/test adlarına sadık kal. Mevcut `form-definitions.md` sözleşmesi, değişmez sürümler, alan tipleri ve koşul motoru yeniden kullanılır; dosya alanı ilk sürümde KAPALI. Yönetim arayüzü: `classic` tema alt ağacı, `admin.forms.*` sözlüğü, tam klavye erişimi, form düzenleyicide alan sıralama için klavye alternatifi (yalnızca sürükle-bırak YASAK), önizleme gerçek genel bileşenle.

### 6.2 Görev 12 — Açık form gönderimi, makbuz, kapasite
`/basvuru/[form-slug]` genel sayfası (config'te menü girişi YOK; sitemap'e yalnızca yayımlı ve indekslenebilir formlar). Planın Review Focus #1: aynı idempotency anahtarı + farklı gövde → ikinci kayıt açılmadan 409 (test et). Sunucu doğrulaması (mevcut `form-validator`) tek gerçek kaynak; istemci doğrulaması yalnızca kolaylık. Makbuz hemen verilir. Kapasite dolu/kapalı/yayında değil durumlarının her biri için doğru boş/hata durumu. Turnstile/bildirim sağlayıcısı yoksa adapter + KAPALI bayrak. Gizli kayıt sayfaları `noindex, no-store, no-referrer`.

### 6.3 Görev 13 — Başvuruları yönetme, dışa aktarma, veri yaşam döngüsü
Planın tanımladığı liste/filtre/durum, CSV dışa aktarma (formül enjeksiyonuna karşı hücre kaçışı), silme/anonimleştirme ve denetim kaydı akışları. Mevcut `appendAudit` kullanılır; kişisel veri günlüklere yazılmaz.

### 6.4 Görev 14 — Coffee Talk uçtan uca yayın örneği
Gerçek tarih ve konum verilmeden YALNIZCA TASLAK hazırlanır; tarih/konum uydurma YOK. Veri girilip yayımlandığında afiş, tarih ve site içi form CTA'sı ana sayfada görünür (mevcut e2e yaklaşımıyla doğrula; kullanıcıdan gerçek veri gelmediyse testi sahte-veri fixture'ı ile koştur, üretim verisine DOKUNMA).

### 6.5 İletişim sayfası
Görev 12 yeşil olduktan SONRA: `/iletisim` rotasını `routes.config.ts`'e ekle. Sayfa, yayımlı `iletisim` slug'lı bir form tanımı VARSA onu gösterir (form içeriği panelden yönetilen veridir, seed ETME); yoksa yalnızca mevcut bağlantı merkezi verisini gösterir. Telefon/e-posta/adres UYDURMA. `/gizlilik` ve `/aydinlatma` yalnızca kullanıcıdan gelen onaylı hukuk metniyle eklenir; metin yoksa rota OLUŞTURMA ve "hukuk metni bekliyor" diye raporla; form yayını bu metinlere bağımlıysa bunu belirt.

### 6.6 Kapsam dışı (YAPMA)
Görev 15–19 (UluJam takım/onay akışları), Görev 21–24 (outbox worker, Apple/Google Wallet). Talep doğrulanana ve kapasite ölçümü (Faz 0 `vds-olcum.md`) onaylanana kadar ertelenmiştir; yalnızca yol haritası dosyasına "ertelendi + gerekçe" notu yaz.

## KABUL ÖLÇÜTLERİ (her görev için kanıt iste)
- Görevin planındaki tüm test adları kırmızı→yeşil kanıtıyla yeşil; Review Focus #1 testi mevcut.
- Yeni yönetim uç noktaları oturum + CSRF + izin matrisi testlerinden geçiyor; yetkisiz erişim reddi testli.
- `no-hardcoded-text`, `i18n-parity`, `theme-centralization` testleri yeşil.
- Form sayfalarında axe 0 serious/critical (iki tema × iki dil); klavye ile tam gönderim akışı e2e.
- Lighthouse mobil ≥ 90 (genel form sayfası) veya "doğrulanmadı".
- typecheck, lint, test, integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + eklenen migration SQL'leri (varsa) + yeni izin anahtarları + dış bağımlılık/onay bekleyenler listesi.

```

```markdown
# FAZ 7 — Sertleştirme, Kalite Kapıları, CI ve Dağıtım Kabulü

## ÖNCE OKU (sırayla, atlama)
1. `AGENTS.md` → `node_modules/next/dist/docs/` (headers/CSP, standalone çıktı, caching); `docs/design/sunum-katmani-kurallari.md` (TAMAMI); `docs/operations/sunum-katmani-ilerleme.md`. Faz 6 kabul ölçütleri ✓ değilse DUR.
2. `docs/design/2026-10-02-uygulama-plani.md` Görev 26–29; `docs/operations/{vds-assessment,vds-olcum,backup-restore,phase-1-acceptance}.md`; `Dockerfile`, `compose.yaml`, `next.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `tests/**`.

## KİLİTLİ KURALLAR (özet — tam metin: `docs/design/sunum-katmani-kurallari.md`)
- DOKUNMA: `src/db/**`, Drizzle şeması/migration, `src/lib/**`, `src/modules/*/{application,domain,infrastructure}/**`, kimlik/oturum/CSRF/MFA. Bu faz arka uç sertleştirmesini (Plan Görev 26–27'nin uygulama kodu) KAPSAMAZ; yalnızca HTTP başlıkları, kalite kapıları, CI, dağıtım dokümanları ve kabul testleri.
- MERKEZİLEŞTİRME: tema değişkenleri yalnızca `src/styles/themes.css`; metinler yalnızca `src/i18n/dictionaries/*`; rota/menü yalnızca `src/config/routes.config.ts`. Kalite eşikleri tek dosyada: `tests/perf/budgets.ts`.
- TypeScript strict; `any`, `as unknown as`, gerekçesiz `@ts-ignore` YASAK.
- Lighthouse mobil ≥ 90 (4 kategori, ÜRETİM build'i), JS bütçesi, CLS≈0, LCP ≤ 2.5 s; WCAG 2.2 AA.
- Her adım sonrası `pnpm typecheck && pnpm lint && pnpm test`; faz sonu + `pnpm test:integration && pnpm test:e2e && pnpm build`. Kanıtsız "tamamlandı" ve testi zayıflatma YASAK.
- Dal: `sunum/faz-7`; küçük commit (Türkçe); push/merge YOK.

## GÖREV

### 7.1 Kalite kapısı: Lighthouse
- `tests/perf/budgets.ts`: kategori eşikleri (4 × ≥ 90), LCP, CLS, TBT, ana sayfa JS gzip bütçesi (< 150 KB), rota listesi (`ROUTES` + temsilî detay sayfaları).
- `pnpm perf:lighthouse`: üretim build'i (`pnpm build && pnpm start`) üzerinde mobil + masaüstü; her rota × her iki tema × her iki dil; JSON raporları `.local/lighthouse/` (gitignore) ve özet Markdown tablosu. Bağımlılık eklenirse (ör. `lighthouse`, `chrome-launcher`) tam sürüm sabitle ve gerekçelendir; eşik altı → komut başarısız. Çalıştırılamayan ortamda "doğrulanmadı" yaz.

### 7.2 Kalite kapısı: erişilebilirlik ve klavye
- Axe matrisi: tüm genel rotalar × tema × dil × (375 px, 1280 px): 0 serious/critical.
- Klavye gezinti testi: Tab ile her etkileşimli öğeye erişim, görünür odak (hesaplanmış `outline` doğrula), klavye tuzağı yok, skip bağlantısı çalışıyor, intro/lightbox/menü odak yönetimi.
- Reflow: 320 px ve %200 yakınlaştırmada yatay kaydırma yok. `prefers-reduced-motion` ve `forced-colors` altında kritik akışlar çalışıyor.
- `theme-contrast` testi yeniden çalıştırılır; gerçek ekran görüntüsünden örnek piksel kontrastı (en az 3 sayfa) raporlanır.

### 7.3 Regresyon bekçileri
- E2E: genel sayfalarda `noindex` YOK; `/admin`, `/api/admin`, gizli token'lı sayfalar `noindex`; sitemap taslak içerik sızdırmıyor.
- `theme-centralization`, `no-hardcoded-text`, `i18n-parity`, `routes-integrity` testlerinin CI'da ZORUNLU olduğunu doğrula.
- "Genişletilebilirlik provası" (kanıtlı, ardından geri al): (a) config'e yeni rota + `page.tsx` + sözlük girdisi, (b) `themes.css`'e üçüncü tema bloğu + `THEMES` girdisi, (c) `LOCALES`'e geçici üçüncü dil iskeleti. Her biri için dokunulan dosya sayısı ve testlerin beklenen yerde kırılıp düzeldiği raporlanır.

### 7.4 Güvenlik başlıkları (yalnızca HTTP katmanı)
`next.config.ts` `headers()` ile genel rotalar için: `Content-Security-Policy-Report-Only` ile BAŞLA (önce rapor modu), `Referrer-Policy: strict-origin-when-cross-origin` (yönetim tarafındaki `no-referrer` KORUNUR), `X-Content-Type-Options`, `Permissions-Policy`, `frame-ancestors`. Önyükleme betiği (inline) CSP ile uyumlu olmalı: Next 16 dokümanına göre nonce ya da hash stratejisini seç; hash ise betik içeriği tek sabitten üretildiği için hash'i testle doğrula; nonce rota önbelleğini bozuyorsa maliyeti ölç. `unsafe-inline` yalnızca kaçınılmazsa ve gerekçeli. HSTS başlığını uygulamada DEĞİL TLS'i sonlandıran katmanda öner (belgele). CSP ihlalleriyle e2e/Lighthouse "Best Practices" sonuçlarını raporla.

### 7.5 CI (`.github/workflows/ci.yml`)
Node `24.21.0`, pnpm `11.19.0` (mevcut sabitlerle). İşler: (1) statik: `pnpm install --frozen-lockfile`, typecheck, lint, birim testler; (2) entegrasyon: PostgreSQL ve S3 uyumlu depo (README'deki Compose düzeni; sırlar CI'da üretilir, depoya YAZILMAZ), `pnpm db:migrate`, `pnpm test:integration`; (3) e2e: Playwright chromium, izleri artefakt olarak yükle; (4) build + `perf:lighthouse` (ana dal/etiketli PR). `.dockerignore` allowlist'inin sırları dışarıda bıraktığını doğrula. Sır, API anahtarı, VDS bilgisi iş akışına YAZILMAZ.

### 7.6 Dağıtım ve operasyon dokümanları (uygulama kodu DEĞİL)
`docs/operations/deploy.md` ve `infrastructure/`: systemd birimi (standalone `node server.js`, `EnvironmentFile`, `Restart=on-failure`, bot ile paylaşım için `MemoryMax`/`CPUQuota` ÖNERİSİ ve gerekçesi), sürüm dizini + sembolik bağ ile atomik geçiş ve geri dönüş adımları, migration politikası (tek süreç, yalnızca ileri, öncesinde `pg_dump`), yedek/geri yükleme provası kontrol listesi. Ters vekil/CDN/WAF seçimi BİLİNMİYOR: varsayma; mevcut VDS'teki durumu soran bir "Cevap bekleyen sorular" listesi yaz. `docs/operations/vds-olcum.md` eşiklerini kullanıcıdan gelen onaylı değerlerle güncelle (onay yoksa "onay bekliyor" bırak). k6 yük testi betiği (`tests/load/*.js`) yaz; sunucuda ÇALIŞTIRMA, komutunu ve beklenen eşikleri belgele.

### 7.7 Geliştirici rehberi
`README.md` güncellenir: mimari özet; "Yeni sayfa ekle", "Yeni tema ekle", "Yeni dil ekle" adım adım (7.3 provasındaki gerçek dosya listesine dayalı); merkezileştirme kuralları ve zorlayıcı testlerin ne yaptığı; yerel doğrulama komutları. Eski/yanıltıcı "Görev 1–10" ifadelerini güncel duruma getir.

### 7.8 Nihai kabul belgesi
`docs/operations/sunum-katmani-kabul.md`: Faz 0–7 kabul tablosu (✓/✗ + kanıt bağlantısı/komut çıktısı), Lighthouse/axe/bundle sonuçları, açık maddeler: palet onayı, yedek sağlayıcısı, ters vekil/CDN, hukuk metinleri, `og:image` varlığı, "Yazılarımız" kararı, ekip verisi, Görev 15–24 ertelemeleri, Görev 26–29'un arka uç kısmı.

## YASAKLAR
Arka uç/Drizzle/auth kodu değişikliği; canlı sisteme erişim veya dağıtım; sırların depoya yazılması; eşikleri düşürerek "yeşil" üretmek; testi atlayan `skip/only`; kanıtsız "doğrulandı".

## KABUL ÖLÇÜTLERİ (kanıt iste)
- Üretim build'inde tüm genel rotalar için Lighthouse mobil 4 kategori ≥ 90 (veya açık "doğrulanmadı" + neden).
- Axe ve klavye matrisleri yeşil; reflow ve reduced-motion testleri yeşil.
- Merkezileştirme testleri CI'da zorunlu; genişletilebilirlik provası kayıtlı ve geri alınmış.
- CSP Report-Only yayında, ihlal raporu özeti var.
- CI iş akışı yerelde `act` veya eşdeğeriyle sözdizimi doğrulandı (çalıştırılamadıysa "doğrulanmadı").
- Dağıtım/geri dönüş/yedek dokümanları ve açık sorular listesi tamam.
- typecheck, lint, test, integration, e2e, build yeşil.

## RAPOR
Kural 9 biçimi + nihai kabul tablosu + açık maddeler listesi.

```
