# Çok Dilli Arayüz (i18n) ve CMS İçerik Sınırı Politikası — v0.2

**Tarih:** 5 Kasım 2026
**İlgili Faz:** Faz 3 / İş 3A & İş 3B ([Birleşik Uygulama Planı](../design/2026-10-20-birlesik-uygulama-plani.md))

---

## 1. Kapsam ve Temel İlkeler

1. **Kesin v0.1 Görsel ve Metin Kilidi:** Varsayılan dil Türkçe (`tr`) olup, `tr` dilinde üretilen tüm arayüz metinleri, başlıklar, ARIA etiketleri, tarih/saat biçimleri ve DOM yapısı v0.1 referansıyla **bire bir aynıdır**.
2. **Görünür Dil Kontrolü Yoktur:** Bu sürümde kullanıcıya görünür bir `LanguageToggle`, `<noscript>` dil formu veya `/en` URL öneki eklenmez. Dil çözümlemesi yalnızca sunucuda (`src/i18n/server.ts`) `uludott-lang` çerezi üzerinden beyaz listeyle (`tr` | `en`) yapılır; `/admin` ve `/admin/*` rotaları her koşulda sabit Türkçe (`lang="tr"`) çalışır.
3. **Tüm İçeriğin İngilizce Olduğu İddia Edilmez:** Yalnızca sabit arayüz (UI) kromu, navigasyon, form/makbuz/kart/takım/onay kabuğu ve bilinen durum/hata mesajları `tr` ve `en` sözlüklerinde karşılıklı tutulur. Yönetim panelinden veya veritabanından gelen editoryal içerikler düzenlenebilir kaynağında kalır.

---

## 2. Sözlük Metinleri vs. CMS / Veritabanı İçeriği Sınırı

### 2.1 Sözlükte Tutulan Sabit Arayüz Metinleri (`src/i18n/dictionaries/`)

- **Genel ve Özel Arayüz (`tr.ts` / `en.ts` — `PublicDictionary`):**
  - Marka, üst/alt kabuk (`Header`, `Footer`, `PublicShell`), menü ve alt menü etiketleri (`brand`, `nav`, `footer`, `meta`, `common`).
  - Ana sayfa (`/`), Hakkımızda (`/hakkimizda`), UluJam (`/ulujam`), Etkinlikler (`/etkinlikler`, `/etkinlikler/[slug]`), Oyunlar (`/oyunlar`, `/oyunlar/[slug]`) ve İletişim (`/iletisim`) sayfalarındaki sabit bölüm başlıkları, üst başlıklar (`eyebrow`), sabit açıklamalar, boş durum (`empty`) mesajları ve sabit eylem düğmeleri (`home`, `about`, `ulujam`, `events`, `games`, `contact`).
  - Topluluk mini oyunları (`PairMatch`, `StarCatch`) ve bağlantı merkezi (`LinkHub`) sabit arayüz metinleri (`miniGames`, `links`).
  - Başvuru formları (`PublicForm`, `UlujamForm`, `FormFields`, `BotChallenge`), makbuz (`ReceiptView`), bireysel katılım kartı (`WebCard`, `PendingCard`, `WalletActions`, `GoogleAction`), takım sayfası (`TeamLogin`, `TeamLogout`) ve yapımcı yayın onayı (`CreditConsent`) sabit etiketleri ve durum metinleri (`forms`, `receipt`, `cards`, `teams`, `consent`, `errors`).
- **Yönetim Paneli Arayüzü (`admin-tr.ts` — `AdminDictionary`):**
  - Yönetim çalışma alanı (`AdminWorkspace`, `AdminNavigation`), modül başlıkları, durum etiketleri ve sabit yönetim kabuğu metinleri (`adminTrDictionary`, yalnız `tr`).

### 2.2 Sözlüğe Taşınmayan CMS / Veritabanı / Alan (Domain) Verileri

Aşağıdaki veriler yönetim panelinden veya veritabanı/domain kayıtlarından gelir; sözlüğe taşınarak panel düzenlemesi devre dışı bırakılmaz:

| Veri Sınıfı | Kaynak Modül / Tablo | Alanlar | Dil Davranışı |
|---|---|---|---|
| **İletişim Ayarları** | `readContactSettings` (`site_settings`) | `data.title`, `data.description`, `data.channelsTitle`, `data.footerDescription`, `data.footerTagline`, `data.email`, `data.phone`, `data.socials[].title` | Kaynaktan olduğu gibi okunur; çevirisi olmayan Türkçe CMS alanları `en` modunda özgün metniyle korunur. |
| **UluJam Sunum Ayarları** | `readUlujamPresentation` (`site_settings`) | `panelTitle`, `panelDescription`, `videoTitle`, `videoDescription`, `application.{title,description,buttonLabel,message}` | Panelden düzenlenebilir kalır; çevirisi yoksa özgün metni korunur. |
| **UluJam Arşivleri ve Derece Oyunları** | `readPublishedArchives`, `readHistoricalResults`, `degreeGames` | `archive.description`, `archive.gallery[].alt`, `game.title`, `game.team`, `game.description` | Editoryal/onaylı kayıt kaynağında kalır. |
| **Etkinlikler ve Duyurular** | `readHomeEvents`, `readPublicEvent` (`events`, `announcements`) | `title`, `excerpt`, `description`, `body`, `location`, `organizer`, `ctaLabel`, `image.altText`, `seo.{title,description}` | Veritabanı kaydından okunur. Tarih/saat alanları `src/i18n/format.ts` üzerinden biçimlendirilir. |
| **Yayımlanmış Oyunlar** | `readPublicGames`, `readPublicGame`, `readPublishedSiteGames` | `title`, `teamName`, `description`, `credits`, `label`, `credit`, `alt` | Veritabanı ve yapımcı rıza kaydından okunur. |
| **Dinamik Form Tanımları** | `getPublicForm` (`forms`, `form_versions`) | `f.title`, `field.label`, `field.helpText`, `field.content`, `field.options[].label`, `receipt.message` | Form oluşturucudan (`FormBuilder`) gelen sürüm verisidir; sözlüğe taşınmaz. |
| **Topluluk Kişileri ve Mekân/Sponsor Özel Adları** | `readPeopleContent` (`people-reference-data`), `places`, `sponsors` | `chapter.{title,role}`, `member.{name,role,quote,details}`, mekân özel adları (`Ecem Kafe & Oyun`, `Nest'o Coffe Roastery`, `Müptela Kahve`, `Çamlık Personel Yemekhanesi`, `Mete Cengiz Kültür Merkezi`), `Dijipin` | Kişi/kurum özel adları ve yönetim panelinden düzenlenen kişi içerikleri kaynağında korunur. |

---

## 3. Backend / API Hata ve Doğrulama Mesajları Adaptörü (`src/i18n/error-adapter.ts`)

1. **API ve Veritabanı Sözleşmesi Değişmez:** Sunucu uç noktaları (`/api/forms/*`, `/api/ulujam/*`, `/api/submissions/receipt`, `/api/team/*`, `/api/cards/publication-consent`, `/api/wallet/*`) mevcut HTTP durum kodlarını, `fieldErrors` alan yollarını (`Record<string, string>`) ve JSON hata gövdelerini aynen korur.
2. **İstemci Hata Adaptörü (`adaptUiErrorMessage` / `adaptFieldErrors`):**
   - İstemci bileşenleri sunucudan veya yerel doğrulamadan dönen bilinen sabit mesajları (`"İstek doğrulanamadı"`, `"İşlem tamamlanamadı"`, `"Gönderim tamamlanamadı"`, `"Bu alanı kontrol edin."` vb.) `src/i18n/error-adapter.ts` üzerinden aktif dilin sözlük anahtarına eşler.
   - Alan bazlı hata haritalarında (`fieldErrors`) alan anahtarları (`fieldId`) değiştirilmeden yalnız bilinen sabit mesajlar aktif dile çevrilir; bilinmeyen veya özelleştirilmiş sunucu mesajlarında güvenli yerelleştirilmiş yedek (`fallback`) veya `tr` mesajı korunur.

---

## 4. AST Sabit Metin Bekçisi (`tests/unit/no-hardcoded-text.test.ts`) Kuralları

- **Taranan Düğüm Tipleri:**
  - `JsxText` (boşluk ve yalnız noktalama/sembol/sayı hariç tüm görünür metinler)
  - Kullanıcıya dönük JSX öznitelikleri (`aria-label`, `aria-roledescription`, `placeholder`, `title`, `alt`)
  - UI bileşen dosyalarındaki sabit dizge değişkenleri, nesne/dizi sabit değerleri, koşul (`ConditionalExpression` / `ternary`) kolları, şablon dizgeleri (`TemplateLiteral`) ve `setMessage`/`setError` durum akışları.
- **İzinli Dar İstisnalar:**
  - Dekoratif boş `alt=""` öznitelikleri, teknik HTML/ARIA sabitleri (`type`, `role`, `id`, `className`, `href`, `src`, `sizes`, `rel`, `target`, `method`, `name`, `autoComplete`, `accept`, `data-*`).
  - Yalnız tipografik sembol/ok/işaret (`↗`, `→`, `←`, `⌄`, `×`, `−`, `+`, `▶`, `Ⅱ`, `★`, `●`, `◆`, `?`, `*`, `/`, `·`) veya sayısal/birim biçimleri (`KiB`, `MiB`, `px`, `%`).
  - Özel marka/kurum/yer adları (`Uludott`, `ULUDOTT`, `UluJam`, `itch.io`, `YouTube`, `Google Wallet`, `Apple Wallet`, `Dijipin`, mekân özel adları).
  - Yönetim paneli (`src/app/admin/**` ve yalnız admin tarafından tüketilen editör bileşenleri) sabit TR politikasına tabidir; genel/özel (`public`/`private`) tüm ekran ve modül bileşenleri sıfır sabit metin ihlaliyle `no-hardcoded-text.test.ts` kapısından geçmek zorundadır.
