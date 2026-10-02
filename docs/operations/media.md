# Medya yükleme ve yayın

Yönetici ekranı `/admin/medya`; `media.write` izni ve geçerli yönetici oturumu gerekir. API `/api/admin/media`, mutasyonlar imzalı CSRF + APP_URL Origin doğrulaması ister. İlk 100 görsel gösterilir; büyük kütüphane sayfalaması ileriki yönetim görevlerindedir.

## Akış

1. JPEG, PNG, WebP, AVIF veya HEIC/HEIF tek kare dosya ve en fazla 250 karakter anlamlı alt metin yükleyin. Dosya en fazla 8 MiB, görsel en fazla 25 milyon piksel. SVG, GIF, animasyon, bozuk veya MIME içeriği uyuşmayan dosya kabul edilmez. Dosya adı depolama anahtarında kullanılmaz.
2. Yükleme Sharp/libheif işleyicisinde ayrı Node worker üzerinden doğrulanır. HEIF container yönü ve JPEG EXIF yönü uygulanır. Türevlerden EXIF/konum/kamera metadata'sı silinir, sRGB'ye dönüştürülür; uzun kenar en fazla 1600 piksel ve küçük görsel büyütülmez. WebP kalite 80, AVIF 50/effort 2, progressive JPEG 82; saydam JPEG krem zeminle düzleştirilir.
3. Orijinal ve üç türev özel S3 bucket'a rastgele UUID anahtarlarıyla yazılır. Admin önizlemesi oturumla sunulur ve no-store kullanır. `ready` yalnız teknik doğrulamanın bittiğini belirtir; otomatik yayın değildir.
4. Yayın hakkını/kişilerin yayın iznini ve alt metni inceleyin. Yayımla iletişim kutusunda ayrı onay verildiğinde yalnız türevlerin `publishedAt` alanı açılır. Anonim route `/media/<variant UUID>` DB yayın ve `ready` kontrolünü yapıp özel depodan türevi sunar. Orijinal için public route veya imzalı URL yoktur; bucket anonim erişimi kapalı kalmalıdır.
5. Silme etkisini göster ile event/announcement/game/featured_slot bağlantılarının sayısını görün. Bağlı görsel silinemez. Bağlantısız görseli ayrıca onaylayınca DB tombstone, yayın iptali, audit ve `media.deleted` outbox tek transaction'da yazılır. Nesneler hemen best-effort kaldırılır; başarısız S3 silmesini Görev 21 worker'ı aynı kimlikle tekrar deneyecektir. DB satırları audit ilişkisi için korunur.

`attachMedia(actor,{type,id},assetId)` içerik FK'sini, ready medyayı ve `media.attach` iznini kontrol eder. content_editor genel içerik bağlantısı yapabilir; event_manager yalnız atanmış eventId'ye bağlar. system_admin tek başına medya yazamaz. İçerik düzenleme arayüzleri sonraki görevlerde bu servisi kullanır. announcement/game revision bağlantıda artırılır. Medya silme ve attach aynı asset satırını kilitler; etkisi önizleme sonrası değişirse silme tekrar kontrol edip reddeder.

## İşletme sınırları

- PostgreSQL advisory transaction kilidi aynı DB'yi kullanan uygulamalar için tek görsel işleyicisi sağlar; meşgulse 429 ve yeniden deneme gerekir. Worker 20 saniyede sonlandırılır, Sharp concurrency=1/cache kapalıdır. Worker V8 heap limiti 256 MiB; native/WASM bellek bu limite dahil değildir. Byte/piksel/kare sınırları ve seri işleme birlikte uygulanır. 4 GB VDS üzerinde gerçek tepe RSS/CPU yükü dağıtım kabulünde ayrıca ölçülmelidir; bu görev kapasite garantisi değildir.
- HTTP gövdesi multipart overhead dahil 8 MiB + 64 KiB, JSON eylemi 1024 byte, gövde okuma 10 saniye sınırına tabidir. Reverse proxy body/time/rate sınırları dağıtım görevinde ayrıca ayarlanır.
- Orijinal EXIF içerebilir; yalnız özel depoda tutulur. Yayınlanan türevler 60 saniye cache/must-revalidate taşır; silinen görselin önceden alınmış kopyası cache süresi boyunca görünür olabilir. Admin/API önizlemesi cache edilmez.
- S3 ve PostgreSQL ortak transaction paylaşmaz. Upload DB hatasında yazılmış anahtarlar telafiyle silinir; S3 kesintisinde özel orphan nesne kalabilir. Üretimde DB referanslarıyla özel prefix envanterini uzlaştıran temizlik/lifecycle işi ve disk/depo izlemesi gerekir; Görev 21/operasyon görevlerinde ele alınır. Public erişim yalnız DB kaydıyla mümkündür.
- libheif-js ve Sharp yalnız sunucudadır. Next standalone build'de decoder, Sharp ve native `@img` paketleri explicit tracing ile alınır. Linux dağıtımı Linux üzerinde derlenmelidir; macOS native çıktısı VDS'ye kopyalanmaz.

## Eldeki HEIC'ler

`Media/IMG_0427.heic` ve `IMG_1206.heic` aidiyeti doğrulanmadı. Testler yalnız dosyayı yerel okuyup yön/metadata dönüşümünü bellek içinde kontrol eder; S3/DB/public/2026'ya yüklemez. Geometri 5712×4284 → 1600×1200 ve 4032×2268 → 1600×900. Yeni fotoğraf yüklemek onu otomatik olarak bir etkinliğe bağlamaz.

## Doğrulama

`pnpm test` gerçek PostgreSQL/S3 ve ayrı geçici DB kullanır; nesneleri ve DB'yi temizler. `pnpm test:e2e` mobil yükleme/özel önizleme/yayın/etki/silme ve yetkisiz/CSRF reddini test eder. Sahte PNG fixture yalnız test DB/deposunda bulunur. Kaynaklar: [Sharp input sınırları](https://sharp.pixelplumbing.com/api-constructor/), [Sharp metadata/output](https://sharp.pixelplumbing.com/api-output/), [libheif-js API](https://github.com/catdad-experiments/libheif-js).

`pnpm build` sonrasında `ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e` izole geçici dizindeki standalone paketi yerel HTTPS geçitleriyle doğrular. OpenSSL gerekir; tarayıcı yalnız bu test CA’sında sertifika istisnası kullanır, Node test CA’sını açıkça güvenir. Geçici anahtarlar, DB ve fixture nesneleri test sonunda temizlenir. Dev ve üretim denemeleri aynı anda çalıştırılmaz. Bu Mac üzerinde her iki modda 14/14 tarayıcı testi geçti; Linux/VDS kabulü ayrı yapılır.
