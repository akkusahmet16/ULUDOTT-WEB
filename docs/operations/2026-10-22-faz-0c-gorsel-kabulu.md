# Faz 0C — v0.1 görsel ve davranış referansı

Başlangıç: 22 Ekim 2026. Son güncelleme ve kapanış: 5 Kasım 2026.

**Durum: KABUL EDİLDİ (5 Kasım 2026 kullanıcı kararıyla Faz 0C kapatıldı).** Faz 0 (0A, 0B, 0C) tamamlandı; sıradaki adım Faz 1 / İş 1A'dır. v0.1 teması, fontları, stilleri, metinleri, yerleşimi ve varlıkları değiştirilmedi. 0C değişiklikleri doğrulama düzeneği ve belgelerle sınırlıdır.

## Kabul sınırı

Bu iş, revize [birleşik planın 0C maddesini](../design/2026-10-20-birlesik-uygulama-plani.md) yürütür. [0A](./2026-10-21-faz-0a-baslangic-kabulu.md) ve [0B](./2026-10-22-faz-0b-cache-kabulu.md) kabulleri kendi kayıtlarıyla korunur. Görüntü karşılaştırmaları; işlevsel E2E, erişilebilirlik ve medya yetkilendirme testlerinin yerini almaz.

Referans, v0.1'in mevcut çalışma dosyalarıdır. Her sürüm, izin verilen girdilerle ayrı bir geçici kaynak kopyasında derlenir. Orijinal v0.1 ve çalışma veritabanı salt okunur kalır; aday v0.2 de başlangıç ve bitiş manifestleriyle sabitlenir. `.env`, anahtarlar, sır klasörleri ve üretilmiş görsel çıktılar derleme kopyasına alınmaz. Git HEAD veya v0.2 ekranı, v0.1 referansının yerine kullanılamaz.

## Ekran ve veri matrisi

Hedeflenen güncel genel matris **647 PNG** içerir: dolu sentetik profil **441**, onaylı mevcut varlık profili **122**, boş iş verisi profili **84**. Bunlar başarılı koşu sayıları değildir. Her profil, yalnız bu koşunun oluşturduğu ayrı bir UUID test veritabanını kullanır. İçerik parmak izi, v0.1 kaydı ve v0.2 karşılaştırmasında aynı olmalıdır. Boş iş verisinde de v0.1'in mevcut statik People, Places, galeri ve oyun varsayılanları korunur; senaryolar bu durumu açıkça adlandırır.

| Yüzey | Yakalama kapsamı |
| --- | --- |
| Genel | Ana sayfa ve alt bölümleri, Hakkımızda/Etkinlikler/Oyunlar/UluJam/İletişim, altbilgi, gerçek detaylar, form ve 404 |
| İçerik | Arşiv mozaik galerisi, ilk üç derece, yayımlanmış statik ve DB oyun kartları, oyun yapımcı satırı, etkinlik gövdesi, iki mekân sahnesi ve fotoğrafsız kişi |
| Etkileşim | Menü/alt menü, hikâye/fotoğraf diyalogları, hover/klavye odağı, karuselin ikinci kartı ve gerçek durdurma kontrolü |
| Form | Boş/dolu/koşullu, alan doğrulama ve sunucu hatası, bekleyen ve devre dışı gönderim, dört UluJam takım modu ve çoklu beceri |
| Yönetim | Ana panel ve 15 modül, dört parametreli detay/önizleme, boş arama sonucu, açık analitik/menü, seçili/yeni/değiştirilmiş etkinlik, afiş/tarih düzeni, yayın/arşiv/iptal diyalogları, People/site-game silme ve önizleme, özel/yayındaki medya, silme/yükleme durumları ve sistemde yeniden deneme etkisi |
| Boyut | 1280×800 ve 375×812 ana boyutlar; 320/390/768/1440 genişlikleri, genel/yönetim sayfalarının gerçek kırılım çevreleri ve 499/500/501 kısa yükseklikleri |

Genişlik kontrolü yalnız sayfanın ilk görünür alanına dayanmaz. 699 px çevresinde galeri/derece/oyun/mekân; 1000 px çevresinde sonuç kartlarının düzeni; 560 px çevresinde afiş ve tarih alanları; 1100 px çevresinde seçili etkinlik düzenleyicisi hedeflenir. Eski 930 px modül sınıfları mevcut sayfaya bağlı değildir. Kullanılan modül düzeninin gerçek 430/780/1150 px kırılımları ayrıca görüntülenir.

## Kararlılık ve karşılaştırma

Ortam sabittir: Chromium **153.0.8010.12 / revision 1243**, Playwright **1.63.0**, aynı işletim sistemi, mimari ve fontlar, **DPR=2**, `scale:"device"`, `tr-TR`, `Europe/Istanbul` ve `2026-10-22T12:00:00Z`. Node ve tarayıcıda yalnız `Date` API'leri sabitlenir; gerçek zamanlayıcılar, `performance`, `requestAnimationFrame` ve normal kaydırma çalışır. Tarayıcının çerez saati gerçek kaldığı için görsel yönetici giriş yanıtındaki `Expires` yalnız bellekte kaldırılır; diğer çerez nitelikleri korunur. Gerçek çerez politikası standart E2E'de ayrıca doğrulanır.

Tarayıcı ayarı `--disable-gpu-rasterization` ile yalnız 2D raster işlemi yazılıma alınır; GPU birleştirme ve video kod çözme açık kalır. Aynı ayar kayıt, genel ve özel karşılaştırmalarda çalışma ortamı kimliğine bağlanır. Bütün genel ve özel yakalamalar ortak yardımcıyla gerçek DPR=2, aynı CSS görünüm boyutu, zoom=1 ve PNG boyutu=CSS×2 şartını doğrular. Resim küçültülmez. Yeni referans henüz kabul edilmedi.

Varsayılan GPU ayarı, odak kenarında rastlantısal **19 piksel** fark üretti. Ek **1,5 saniye** bekleme uzun tekrarda yetersiz kaldı ve kaldırıldı. GPU'yu tamamen kapatma, **280 odak çiftini** geçmesine rağmen kod çözülmüş video ölçülerini sıfırladığı için reddedildi. Seçilen dar ayar, **20 bağımsız odak bağlamında 140 çift** ve **30 gerçek video noktasında 0 piksel fark** verdi. Bunlar tanı sonuçlarıdır; nihai v0.1→v0.2 kabulünün yerine geçmez.

Fontların yüklenmesi ve görünür görsellerin kod çözümü tamamlanır. Kaydırma gözlemcisi ve hover sonrasında gerçek CSS geçişlerinin bitmesi beklenir. İlk compositor boyaması atılır; sonraki iki görüntü tam eşit olmalıdır. Sonsuz dekoratif animasyonlar mevcut ilk karelerinde, metin imleci gizli yakalanır. Renk, font, CSS, içerik ve yerleşim korunur. Azaltılmış hareket ayarındaki görüntü, gerçek kaydırma davranışının yerine kullanılmaz.

Üç video için giriş, %25/%70 tutma, %23'e geri kaydırma ve çıkış noktaları gerçek kaydırma koduyla alınır. Geometri, sıfırdan büyük kod çözülmüş kare ölçüleri, `paused=true`, `seeking=false` ve hedef zamandan en fazla **1/120 saniye** sapma gerekir. **400 ms** arayla alınan kod çözülmüş RGBA karelerinin özeti aynı kalmalıdır. Durmuş videoda yeni kare bildirimi gelmeyebildiği gözlendi; yokluğu raporlanır. Test, videoyu oynatarak veya zamanını doğrudan atayarak yapay kanıt üretmez. Hem ekran hem kod çözülmüş kare özeti karşılaştırılır.

Standart pixelmatch'in kenar yumuşatma piksellerini hariç tutması yeterli sayılmadı. Sharp ile çözümlenen RGBA baytları karşılaştırılır: boyutlar eşit, farklı piksel sayısı **0** olmalıdır. Maske, kırpma, yeniden boyutlandırma veya yükseltilmiş eşik kullanılmaz. Referans PNG hash'i, çalışma ortamı ve tam senaryo anahtar kümesi doğrulanır. Aday, eksik referansı üretemez; `--update-snapshots` yasaktır.

## Özel görüntülerin güvenliği

**22 özel durum** ve **4 gerçek yönetim yükleme/hata durumunun** önceki eşli koşusu **26/26, 0 farklı piksel** verdi. Geçerli QR/kart, takım erişimi/oturumu, makbuz, rıza ve tek kullanımlık takım parolası içeren PNG'ler, URL'ler ve izler diske yazılmadı. Aynı gerçek hizmet verisi iki sürüm arasında bellekte kullanıldı. Son yardımcı ve kaynak kimlikleriyle nihai tekrar koşusu gereklidir; önceki 26 sonuç genel matris kabulü sayılmaz.

Yeni takım formunun başarı durumu aynı gerçek hizmet makbuzunu bellekte alır; ikinci başvuru oluşturulmaz. Yükleme/hata durumları için yalnız koşuya ait test veritabanındaki `forms` tablosu kilitlenir veya geçici olarak yeniden adlandırılıp özgün adına döndürülür. Hata sonrası yeniden yükleme de doğrulanır. Çalışma veritabanının şeması ve migration'ları değiştirilmez.

## Test sınırları ve düzeltmeler

- Sentetik medya örneği, mevcut Coffee Talk afişinin aynı baytlarını kullanır. Yalnız bilinen sentetik GET medya kimlikleri, SHA/boyut/v0.1 manifest doğrulamasından sonra tarayıcıda karşılanır. Bu açıkça tanımlanmış taşıma sınırıdır; gerçek depolama, yetkilendirme, yükleme ve mutasyon kontrolleri standart üretim E2E kapısındadır.
- Sabit uygulama saati ile PostgreSQL'in gerçek `created_at` değeri, oturum CHECK kısıtını bozuyordu. Yalnız boş olmayan test profilinde oturum `created_at` varsayılanı sabitlendi. Gerçek şifreyle giriş regresyonu kırmızı→yeşil, test verisi/medya kontrolleri **12/12** geçti.
- İlk görüntüdeki köşe yumuşatma farkı compositor ön boyamasıyla; geç başlayan hover/kaydırma arka plan geçişleri gerçek kare ve kararlılık beklemesiyle ele alındı. Hata eşiği korunur; eski tanı referansları onaylanmadı.
- Next route-announcer'ın boş `alert` alanı form hata metniyle karıştırılmaz. İç içe `summary`, kapalı `details` içindeki seçenekler ve ek durum işlemleri mevcut UI kontrolleriyle hazırlanır.
- Eski backend'e bağlanma riski, koşunun başlattığı alt süreç için gerçek dinleyiciden sonra Next `Ready` satırı zorunlu tutularak giderildi. **11 yeni test** önce kırmızıydı; çalışma ortamı testleri **15/15** geçti. Beklenmedik alt süreç çıkışı başarılı yakalama sayılmaz.
- Üretilen baseline uygulama kaynak girdisi sayılmaz; PNG/manifest kimliği ayrı doğrulanır. Çakışma testi önce kırmızıydı, ardından referans testleri **19/19** geçti. Kaynak manifestindeki dışlama kuralları (`exclusions`) değişirse digest de değişir; bu, orijinal dosya baytlarının değiştiği anlamına gelmez.
- Sonuç dosyası her denemede `runId` ve `passed:false` ile başlar. Kaynak doğrulaması ve koşuya ait kaynakların temizliği bitmeden `passed:true` veya referans `complete` yazılmaz. Önceki başarılı sonuç, yeni başarısız denemenin yerine kalmaz.

## Nihai kanıtlar — açık

- Güncel genel paket **87 dosya / 473 test**, **151,02 saniye**, çıkış **0**. Çalışma ortamı **15/15** ve kaynak referansı **19/19** bu pakete dahildir. Son tip ve hedefli lint kontrolleri de geçti.
- Üç videonun beş noktası × iki boyutla **30/30** gerçek normal hareket tanı senaryosu geçti; **88,8 saniye**. Her birinde art arda tam piksel eşliği doğrulandı. Bu, nihai v0.1→v0.2 matrisinin yerine geçmez.
- Eski backend deneyi, yeni alt sürecin porta bağlanamadığı koşulu üretti: CLI çıkışı **1**, eski backend'e istek **0**, PNG **0**, referans `complete=false`, güncel sonuç `passed=false/status=failed`. Dokuz eski veritabanı korunarak koşuya ait kaynaklar temizlendi.
- Standart E2E listesi **41 dosya / 107 senaryo**. Görsel matris ayrı tutuldu; eski senaryo sayısı azaltılmadı. Üretim uygulama kaynakları 0B'den beri değişmedi. 0B'nin **105 TLS + 2 HTTP** başarılı davranış kapısı ayrı kanıttır.
- Geçici kayıt aşamasındaki kaynak sır taraması **914 dosyada 0 sır / 0 yasak dosya** verdi. Kalıcı PNG paketi tamamlandıktan sonra son tarama yapılacaktır.
- v0.1 görsel kaynak manifesti **642 dosya / 106.178.850 bayt** içerir. Güncel dışlama kuralları dahil digest: `2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80`. **21 yakalama/altyapı girdisinin** hash'i çalışma ortamına bağlıdır. Önceki dışlama kurallarının digest'i bunun yerine kullanılamaz.

Kaynak geçmişinde, v0.1–v0.2 arasında **35 başlangıç mimari/publication/local-demo farkı** ve kabul edilmiş **0A form key düzeltmesiyle toplam 36 src/public dosya farkı** vardır. Bunlar görsel muafiyet değildir; aynı güncel **647 + 26** kapısından geçmelidir. v0.2'nin **495 src/public dosyasında**, 0A sonrasında yalnız iki beklenen 0B cache dosyası değişmiştir; 0C yeni üretim kaynağı farkı eklememiştir. v0.2'deki **114 public varlık** ve **11 CSS dosyası** kendi 0A başlangıç hash'leriyle aynıdır.

v0.1'in **642 dosyalık 0C başlangıç kümesi** değişmemiştir. Daha eski 0A envanterine göre görülen `pnpm-workspace.yaml` farkı, 0C başlamadan önce de mevcuttu. Dolayısıyla 0C'nin kaynağı değiştirmediği iddiası, kendi başlangıç manifestine dayanır.

Kalıcı [referans README](../../tests/e2e/__baseline-cinematic__/README.md), komutları ve iki kapının birlikte kabul sözleşmesini içerir. Genel kayıt/karşılaştırma, son özel tekrar, tam test kapısı, kaynak bütünlüğü, veritabanı koruması ve geçici kaynakların temizliği tamamlanınca bu kayıt gerçek çıktılarla güncellenecektir. Şu anda **0C ve Faz 0 çıkış kapısı açıktır**. Tamamlanmamış referans veya yalnız 26 özel karşılaştırma, Faz 1'i başlatmaz.


## Son kayıt reddi ve yeni yakalama deneyi

DPR=1 ve dar raster ayarıyla dolu profil **437/437**, statik profil **121/122** geçti. Statik profilin masaüstü `story-ulujam` durumunda art arda iki kare **165 piksel** farklıydı. Bu koşunun 558 PNG’si onaylı referans değildir; boş profil bu yeni koşuda başlamadı ve v0.2 karşılaştırması yürütülmedi. Kayıt ve karşılaştırma zinciri başarısız sonuçla durdu.

Aynı sahnenin 30 yeni bağlamındaki 210 komşu çiftin 99’u farklıydı. 240 ölçümde kaydırma, arka plan rengi ve animasyon durumu aynı kaldı; fark yalnız bulanık arka planda RGB kanallarında birer değerdi. Tam yazılım çizimi, GPU birleştirmeyi kapatma, Graphite/SwiftShader ve compositor aşaması seçenekleri de farkı gideremedi. Kesin iç tarayıcı mekanizması kanıtlanmadı; uygulama hareketi veya yalnız ilk boyama açıklaması bu ölçümlerle desteklenmiyor.

Görünümden doğrudan alma yolu ilk 14 çiftte kararlıydı fakat Mac’in doğal 2560×1600 piksel görüntüsünü döndürdü; 1280×800 diye kabul edilmedi veya küçültülmedi. Ardından gerçek tarayıcı DPR=2 ve standart Playwright `scale:"device"` ile aynı doğal çözünürlük sınandı. Statik hikâye penceresindeki 20 bağlam/140 çift ve 30 normal video noktası sıfır fark verdi. Tam dolu profilde 20 mobil odak bağlamı/140 komşu çift +19 bağlamlar arası çift, 20 masaüstü hikâye bağlamı/20 komşu çift +19 bağlamlar arası çift ve 30 gerçek video noktası da sıfır farkla geçti. Deneyin kaynak koruması ve sahipli temizliği tamamlandı.

Uygulanan teknik revizyon, her iki sürümün bütün genel/özel bağlamlarını aynı DPR=2’de yakalamaktır. CSS görünüm boyutları değişmez; gerçek `devicePixelRatio`, yakınlaştırma=1 ve PNG boyutunun CSS boyutunun tam iki katı olduğu doğrulanır. Resim yeniden boyutlandırılmaz. Bu, DPR=1 eşliğinin kanıtı olarak sunulamaz; yeni kabul sabit doğal DPR=2 ortamıyla sınırlı olacaktır. Yeni v0.1 referansı ve 643+26 karşılaştırmanın tamamı yine gereklidir. Tema, CSS, içerik, maske veya sıfır piksel eşiği değişmez.

Yeni yakalama korumalarının sekiz testi eski CSS-piksel yöntemiyle önce 8/8 başarısız oldu; ardından beş yardımcı test dosyası toplam 61/61 geçti. Tip ve hedefli lint kontrolleri geçti; tam güncel paket **86 dosya /466 test** ile128,80 saniyede geçti. Genel resim kimlikleri, currentSrc SHA256 ve doğal boyutlarıyla ayrıca eşleştirilir; blob/data önizlemelerinin URL’leri saklanmaz.


## Font hazırlık kapısı — 23 Ekim

İlk doğal DPR=2 kaydı, yönetim form detayında font hazırlık kontrolüyle reddedildi. 130 PNG eksik ve onaysız kaldı; karşılaştırma başlamadı. Eski kontrol, `document.fonts.ready` çözülmüş olsa bile daha sonra kaydolabilen yerel fontları beklemiyordu.

Yeni ortak yardımcı, kök yerleşimin `--font-body` ve `--font-display` değişkenlerindeki iki birincil ailenin gerçekten FontFaceSet’e kaydolmasını ve tüm kayıtlı yüzlerin yüklenmesini ister. Sistem fontu, yalnız fallback veya yalnız gövde ailesi yeterli değildir. Hatalı kullanılmayan font bile başarısızlıktır. Font yükleme başlatılır ancak ağ yanıtı tarayıcı içinde süresiz beklenmez; Node tarafındaki kesin süre sınırı değerlendirmeyi de kapsar. Poll zamanlayıcısı kapanışta iptal edilir. Hatalar yalnız nötr kodlarla çıkar; URL veya sayfa verisi taşınmaz.

Gerçek Chromium ve mevcut ArtDeco WOFF baytlarıyla yedi test eski yöntemde önce 7/7 başarısız, yeni yöntemde 7/7 başarılı oldu. Geç kayıt, kalıcı eksik font, fallback-only, eksik display ailesi, eksik CSS değişkenleri, bozuk font ve askıda kalan font isteği kapsanır. Testte FontFace API’sinin tırnaklı aile adı beklentisi düzeltildi. Bağımsız inceleme önemli açık bulmadı. Uygulama fontları veya CSS değiştirilmedi.

Son kaynaklarla tam test paketi ve 643+26 görsel kapı yeniden yürütülüyor. Şu anda 0C hâlâ açık; önceki eksik kayıtlar kabul kanıtı değildir.

23 Ekim son tam test paketi **87 dosya /473 test**,151,02 saniye, çıkış0; son tip ve hedefli lint kapıları da geçti.21 yakalama girdisiyle sabitlenmiş yeni v0.1 kaydı sürüyor. Genel/özel piksel karşılaştırması tamamlanmadan bu test sonucu 0C kabulü sayılmaz.


## Kaydırma hizalama reddi — 23 Ekim

Font düzeltmesinden sonraki `db4cfa78cdaee3239470af6cb1ca776b` v0.1 kaydı üç profilde **643/643** görüntüyle tamamlandı. SHA, doğal PNG boyutları ve 1.179 görünür resim kimliği ayrıca doğrulandı. Buna rağmen v0.2 dolu profil karşılaştırması **435 başarılı / 2 başarısız** ile reddedildi; statik/boş karşılaştırma ve nihai özel kapı başlatılmadı. Bu paket onaylı referans değildir.

Mobil `content-published-game-hover` ve `content-published-result-card` çiftlerinde içerik bütünüyle iki fiziksel piksel, yani bir CSS pikseli farklı konumdaydı; sabit başlık aynı kaldı. Hazırlık yardımcısı `abs(delta) <= 1` sapmasını kabul ediyor ve 400 ms konum kararlılığını 1.100 ms süren doğal açılış geçişi bitmeden yeterli sayabiliyordu. Daha sonraki animasyon beklemesi son konumu yeniden hizalamıyordu. Hover stilinin yalnız iç görseli büyütmesi, bütün içerik kaymasını açıklamıyor.

Düzeltme yalnız test hazırlığındadır: erişilebilir gerçek içeriğin son konumunu doğal kaydırmayla kesin ulaşılabilir konuma getirmek, sonlu animasyonların bitmesini beklemek ve hover sırasında ek otomatik kaydırmayı önlemek. Gerçek Chromium regresyonları önce eski yöntemde çalıştırılır. Piksel eşiği sıfır kalır; tema/CSS/görsel varlıklar değişmez. Yeni hazırlık girdileriyle bütün kayıt ve 643+26 kapısı yeniden gereklidir. **0C açık kalır.**

Hizalama düzeltmesinin yedi gerçek Chromium regresyonu önce **7/7 kırmızı**, ardından **7/7 yeşil** oldu. Tam güncel paket **88 dosya /480 test**, **152,59 saniye**, çıkış **0**; tip ve hedefli lint kapıları geçti. Kesirli yerleşimlerde hedef, kırpılmış mutlak kaydırmanın tutarlı tam CSS-piksel konumudur; ekrandaki öğenin üstü tam 120 olamayabilir ancak her bağlamda aynı ulaşılabilir konuma oturmalıdır. Alt/üst kaydırma sınırları da kapsanır. Bağımsız inceleme önemli açık bulmadı. İki sorunlu sahnenin gerçek sürümlerdeki tekrar ölçümü sürüyor; nihai matris hâlâ gereklidir.

İki sorunlu mobil sahne, iki gerçek üretim kopyasında toplam **40 bağımsız bağlamda** sınandı: **40 aynı bağlam çifti +36 bağlamlar arası çift +20 sürümler arası çift**, tamamı **0 farklı piksel**. Kart konumları tüm tekrarlarda aynı kaldı. Kaynak doğrulaması ve koşuya ait kaynakların temizliği tamamlandı; PNG diske yazılmadı. Reddedilen 643 görüntü ve başarısız karşılaştırma kanıtı ayrı, yok sayılan klasöre taşındı. Düzeltilmiş 21 yakalama girdisiyle tüm kayıt ve 643+26 kapısı yeniden başlatılır.


## Menü işaretçi durumu — 23 Ekim

`d7ff522f272f8f156e9c03a983b2e659` referansı üç profilde **643/643** tamamlandı. Yeni v0.2 karşılaştırmasında önceki mobil içerik hizalama sorunları geçti; dolu profil yine **435/437** ile reddedildi. Bu kez farklar yalnız `menu-community` sahnesinin **901×800** ve **1000×800** durumlarındaydı: **6.160 /6.162 piksel**, tamamı tek bir **44×44 CSS-piksel** alt menü düğmesinin hover alanında. Dışındaki bütün pikseller aynıydı. Önceki referanslar zaten onaysız olduğundan hiçbir kabul edilmiş baseline değiştirilmedi.

Sahne alt menüye tıklayıp farenin son durumunu tanımlamıyordu; aynı açık/odaklı menü nötr veya hover görünümünde kalabiliyordu. Kesin tarayıcı iç mekanizması iddia edilmez. İki sürüm ve iki genişlikte **40 yeni bağlam**, her yöntem için **40 aynı bağlam +36 bağlamlar arası +20 sürümler arası** çiftle ölçüldü. Eski işaretçi durumunun yalnız 29 satırı bütün kontrollerde eşitti; doğal `mouse.move(0,0)` sonrası **40/40** satır eşit, tüm farklar **0** idi. Odak ve açık menü durumu korundu; kaynak denetimi/temizlik tamamlandı, PNG diske yazılmadı.

Yeni sözleşme, normal sahneler için nötr işaretçi; hover sahneleri için açık `pointer: hover` ve kesin hedef locator'ıdır. Son doğal hazırlıktan sonra hedefin gerçekten `:hover` olması yeniden doğrulanır. Galeri/yer/oyun hover senaryoları korunur. Menü hover durumu iki ana boyut ve iki sorunlu genişlikte ayrıca eklendi. Yeni gerçek test listesi **full441 +static-approved122 +empty84 =647** genel durumdur; **26** özel/admin çiftiyle toplam **673** olur. Bu sayısal kapsam artışı, önceki başarısız 643'ün yerine otomatik kabul değildir; bütün paket yeniden kaydedilip karşılaştırılacaktır.

Yedi yeni gerçek Chromium regresyonunun eski hazırlık çıkarımında iki tıklama testi kırmızı, beş odak/hover koruma testi yeşildi. Düzeltmeden sonra **7/7** geçti; yalnız test hazırlığı ve senaryo kapsamı değişti. Uygulama teması, stilleri, fontları ve görsel varlıkları değişmedi. Tip/lint ve tam güncel paket sonuçları ile yeni 647+26 kapısı kapanışta ayrıca doğrulanacaktır. **0C hâlâ açık.**


## Görsel çizimi ayrıştırma — son durum

`889ccbd63d50300f6dcca80ad290b06a` referansı **647/647**, kaynak doğrulaması ve sahipli temizliğiyle tamamlandı. v0.2'nin dolu profilinde ilk **105** karşılaştırma eşleşirken üç masaüstü mekân görseli farklı kaldı: `content-places-heading` **1.430.865**, `content-place-cafes` **1.658.588**, `content-place-cafes-hover` **859.580** piksel. Farklar yalnız kafe görseli içindedir; çevredeki yazı, başlık ve yerleşimler aynı kalmıştır. Koşu 109/441 sırasında, yeni bir tam kayıt döngüsüne girmeden dar tanı yapmak için durduruldu. Sonuç `interrupted/passed=false`; özel kapı başlamadı ve **0C kabul edilmedi**.

Tarayıcıya sunulan iki Next/sharp/libvips/WebP kurulumu, yerel ikililer, build ayarları ve özgün görseller bayt düzeyinde aynı bulundu. Bununla birlikte mevcut `currentSrc` özeti URL kimliğidir; gerçek HTTP resim yanıtı/çözülmüş piksellerin özeti değildir. Kaynak 2560×1440 olsa da manifestteki 853×480 tarayıcının yoğunluğa göre düzelttiği doğal ölçüdür. Aynı URL/ölçü, optimize edilmiş yanıt ile olası özgün resim fallback'ini ayıramaz. Böyle bir fallback gerçekleştiği henüz kanıtlanmamıştır.

Statik piksel incelemesi, nötr resimde küçük dikey örnekleme farkı; hover resminde çoğunlukla bir-iki renk seviyesi farkı gösterdi. Bu, eksik yüzde dört hover ölçeği olarak açıklanamaz. Tam matris yeniden üretilmeden önce gerçek HTTP gövdesi ve çözülmüş RGBA hash'i, DOM/geometri/dönüşüm değerleri, aynı sürümün yeni bağlamları ve standart/doğrudan tarayıcı yakalama yolları ayrı ölçülecektir. Tema, görsel dosyası veya sıfır piksel eşiği değiştirilmez. Genel paket **89 dosya/487 test**,155,60 saniye, çıkış0; son tip/lint kapıları geçti. Bu test sonuçları eksik görsel kabulün yerine geçmez.

### Gerçek resim yanıtı deneyi

`c94300d81a74781627e58bb774b94697` tanı koşusu 30 yeni bağlamda tamamlandı. Kafe resminin 30 HTTP yanıtı aynı optimize edilmiş WebP baytlarını verdi; özgün dosyaya dönüş gözlenmedi. Standart Playwright ve doğrudan tarayıcı yakalamasının her biri 30 ardışık çift, 24 aynı kaynak bağlamı ve 15 sürümler arası çifti sıfır farkla geçti. Doğal PNG boyutları, kaynak koruması ve sahipli temizlik doğrulandı. Bu dar deney önceki üç farkı tekrarlamadı; genel görsel kabul değildir ve yakalama yöntemini değiştirmek için gerekçe sunmaz.

Önceki referans ve aday PNG’leri, mevcut optimize edilmiş yanıt ve özellikle özgün baytların verildiği kontrollü müdahale ile ayrıca karşılaştırılıyor. Bu müdahale tanı amaçlıdır; eski koşunun gerçek HTTP yanıtına ilişkin doğrudan kanıt sayılmaz. **0C açık kalır.**

Özgün yanıt müdahalesi 12 bağlamda tamamlandı. Her iki sürümün normal optimize edilmiş üç yakalaması eski v0.1 referansıyla **0 fark** verdi. Özgün baytların özellikle sunulduğu altı yakalama, önceki referans veya hatalı aday PNG’lerini üretmedi. Bu nedenle özgün dosyaya dönüş, gözlenen hatanın doğrulanmış açıklaması değildir. Yakalama ayarı veya üretim kodu bu varsayıma dayanılarak değiştirilmedi. Sonraki dar deney, son görünüm boyutuyla başlatılan bağlamı gerçek testteki 1280×720 → 1280×800 hazırlığıyla karşılaştırır ve üç durumu gerçek Playwright test çalıştırıcısında iki sürüme karşı ayrıca çalıştırır.

Pencere hazırlığı deneyi de tamamlandı: 12 bağlamda pencere boyutunu baştan belirleme ve varsayılan boyuttan değiştirme yolları aynı sonucu verdi; bütün yakalamalar eski v0.1 referansıyla eşleşti. Üç sahne, mevcut gerçek test dosyası ve ayarlarıyla v0.1’de **3/3 (23,5 s)**, v0.2’de **3/3 (23,2 s)** geçti. Önceki sapmanın kesin nedeni hâlâ belirlenemedi. Üretim kaynağı, yakalama girdileri, mevcut 647 referans veya sıfır piksel eşiği değiştirilmeden tam karşılaştırma yeniden başlatıldı. Bu koşu ve nihai özel kapı tamamlanana kadar **0C açık**.

### 24 Ekim — son karşılaştırma sonucu

`889ccbd63d50300f6dcca80ad290b06a` referansı ve `e31c83438ca4dd7ff471d12554c8c98038e86c89f4a13d863e03628d9cb7c214` aday kaynağıyla yapılan son resmî karşılaştırmada dolu profil **441/441** geçti. Böylece önceki dar tanılarda incelenen üç kafe sahnesi de bu koşuda eşleşti. Statik profil **121/122** geçti; `content-public-degree-3/1280x800` sahnesinde **97 piksel** fark kaldı. Bu nedenle kapı `failed`; `pixel-gate-result.json` başarısız ve akış boş profilin 84 sahnesine ulaşmadan durdu. Bu koşuda 0C’nin tamamı doğrulanmış sayılmaz.

97 pikselin tamamı doğal **2560×1600** yakalamanın en alt satırlarında, iki dar bölgede bulunuyor: solda `x=160–197`, sağda `x=1212–1249`; ikisi de `y=1578–1599`. Aday PNG SHA-256 değeri `fec0c2ab30fe031fa8c0a7f4ea92595f41062cd48aff24d9614645d8671fe522`; önceki on tekrarlı v0.1 ve v0.2 tanılarındaki aday PNG’lerle aynı. Referans PNG SHA-256 değeri `00b2f66b0f9e24142e6c6f87840ef2f9a02f5c0ee9f92b6284187a0539b1b945`. Bu, aday çıktının tekrarlandığını gösterir; farkın nedenini veya referansın yenilenmesini tek başına haklı çıkarmaz. Farkın kaynağı henüz kanıtlanmadı. Eşik sıfır piksel olarak kaldı; baseline veya uygulama görseli değiştirilmedi.

Özel karşılaştırma ayrıca çalıştırıldı: **26/26** çift sıfır farkla geçti, özel PNG’ler diske yazılmadı. Bu koşunun v0.1 kaynak özeti, v0.2 aday özeti ve çalışma ortamı özeti başarısız genel karşılaştırmayla bire bir aynı. Genel koşu kimliği `9c37b74944ddf10ce9f691c8b5aa77eb`, özel koşu kimliği `93c1899beabf35da6fd66d3bc43d0c9f`. Özel kapının tek başına geçmesi eksik genel profili tamamlamaz. Son resmî koşuda boş profil çalışmadı; önceki boş-profil tanıları ise ayrı, kabul kanıtı olmayan incelemelerdir.

### 24 Ekim — boş profil arşiv hash denetimi

`historical-empty-full` (`a72599f309256c949974053e6cb0c182`) ve `historical-empty-v2-repeat` (`f4c309dd0e976a5c456a4fba6ade29f2`) aynı v0.1 kaynak özeti (`2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80`) ve aynı yakalama ortamıyla çalıştı. Bu iki koşuda saklanan dört aday PNG’nin her biri bayt düzeyinde eşleşiyor:

| Boş profil sahnesi | İki v2 arşivindeki aynı aday PNG SHA-256 | Referansa fark eden piksel |
| --- | --- | ---: |
| `content-places-heading/1280x800` | `4f669d9e2daf45fa6ceee82ebd52450b1d7f9ae660d7b73e982f34132908fd5f` | 1.430.865 |
| `content-place-cafes/1280x800` | `e525439e121e3ae69fea48e6f1bcd4a6fed168eaf794bec58546a06a80ea20ad` | 1.658.588 |
| `content-place-venues/1280x800` | `08c5e6a720f2e33a0dd3325a28db4493bb7a4cb03efc51f9f4d6b5f320e34d45` | 1.769.402 |
| `content-place-cafes-hover/1280x800` | `5e987df9f0b439eea1348c2663354955816150d5237dce065eddb588e61a03f8` | 859.580 |

“v1-source” etiketli arşiv koşusu (`62cd0bd0c484cfd27221e93df3c66040`) aynı referans kaynağı ve yakalama ortamını, farklı bir aday kaynak özetiyle (`da40f5a7accf900cf6a1e3557d0d58d7a6a0a1d9129bbd9ab00194082cca0856`) kaydediyor; logunda aynı dört fark sayısı bulunuyor. Fakat bu koşunun aday PNG’leri arşivde saklanmamış. Bu nedenle mevcut kanıt, iki arşivlenmiş v2 koşusu arasında tekrarlanabilirliği doğrular; v1 etiketli koşuyla v2 aday PNG’lerinin bire bir eşitliğini doğrulamaz. `historical-empty-outliers` altındaki aynı PNG’ler ayrı bir koşu değildir; baytları iki arşivlenmiş v2 koşusuyla aynıdır.

Bu arşiv incelemesi tanı kanıtıdır, güncel kabul koşusu değildir. 24 Ekim resmî karşılaştırması statik profilin tek bir sahnesinde durduğu için boş profilin 84 sahnesine ulaşmadı. Dört farkın nedeni belirsiz kaldı; v0.1 referansı, sıfır piksel eşiği ve görsel kaynaklar değişmedi.

### 24 Ekim — boş profilin doğrudan v0.1/v0.2 eşleştirmesi

Yeni tanı koşusu 058a770890afc0dec32284fca73767ab, dondurulmuş referansla aynı v0.1 kaynak özetini (2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80), v0.2 aday özetini (e31c83438ca4dd7ff471d12554c8c98038e86c89f4a13d863e03628d9cb7c214), yakalama ortamını ve boş profil veri parmak izini kullandı. Resmî testteki aynı sahne hazırlığı ve Playwright ekran yakalamasıyla iki kaynakta dört sahne, her biri iki ayrı bağlamda yakalandı. On altı yakalamanın tümünde ardışık kare farkı **0**; sekiz kaynak içi tekrar ve sekiz v0.1↔v0.2 karşılaştırmasının tamamı da **0 piksel** fark verdi. Her sahnenin v0.1 ve v0.2 PNG karması aynı:

| Boş profil sahnesi | v0.1 ve v0.2 ortak PNG SHA-256 | Her iki kaynağın dondurulmuş referanstan farkı | Ortak scrollY |
| --- | --- | ---: | ---: |
| content-places-heading/1280x800 | 4f669d9e2daf45fa6ceee82ebd52450b1d7f9ae660d7b73e982f34132908fd5f | 1.430.865 | 16.427 |
| content-place-cafes/1280x800 | e525439e121e3ae69fea48e6f1bcd4a6fed168eaf794bec58546a06a80ea20ad | 1.658.588 | 15.853 |
| content-place-venues/1280x800 | 08c5e6a720f2e33a0dd3325a28db4493bb7a4cb03efc51f9f4d6b5f320e34d45 | 1.769.402 | 16.157 |
| content-place-cafes-hover/1280x800 | 5e987df9f0b439eea1348c2663354955816150d5237dce065eddb588e61a03f8 | 859.580 | 15.853 |

Kaydedilen geometri de kaynaklar arasında aynı. Bu nedenle bu dört sahnedeki fark, v0.2’ye özgü bir görsel regresyon değil: gerçek v0.1 kaynağı da güncel yakalama akışında dondurulmuş PNG’lerle uyuşmuyor. Koşunun sonucu failed kaldı; çünkü sıfır fark kabul ölçütü dondurulmuş referans için sağlanmadı. Bu bulgu referansın hangi aşamada farklı duruma geçtiğini tek başına açıklamıyor ve referansı yenileme yetkisi vermiyor. On altı PNG yalnızca .local/phase-0c/empty-direct-pair/ tanı klasörüne yazıldı; baseline ve uygulama değişmedi. Kaynak karmaları koşu sonrası aynı kaldı; tanının kendi geçici derleme, sunucu ve veritabanı kaynakları temizlendi.

Sonuç: **0C açık**, Faz 1 başlamadı. Genel 647 sahnenin tamamı ve 26 özel sahne tek bir güncel kaynak/ortam kümesiyle sıfır farkla doğrulanmadan, son kaynak/veritabanı/güvenlik ve hizmet geri-yükleme denetimleri tamamlanmadan kabul işaretlenmeyecek. v0.1’in teması, fontları, CSS’i, metinleri, yerleşimi ve varlıkları korunmuştur.

### 24 Ekim — statik üçüncü derece sahnesinin doğrudan v0.1/v0.2 eşleştirmesi

`d603c525e5cca0b8e6611e255d7baa25` tanı koşusu, yalnız `content-public-degree-3/1280x800` statik sahnesini resmî yakalama yordamı, dondurulmuş çalışma ortamı ve `static-approved` veri parmak iziyle iki kaynakta ikişer bağımsız tarayıcı bağlamında yakaladı. v0.1 kaynak özeti `2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80`, v0.2 aday özeti `e31c83438ca4dd7ff471d12554c8c98038e86c89f4a13d863e03628d9cb7c214` olarak doğrulandı.

Dört yakalamanın tamamı SHA-256 `fec0c2ab30fe031fa8c0a7f4ea92595f41062cd48aff24d9614645d8671fe522` ile bayt düzeyinde aynı. Kaynak içi iki tekrar ve v0.1↔v0.2 eşleştirmelerinin ikisi de sıfır fark verdi; her dört görüntü de dondurulmuş referanstan aynı **97 piksel** ile ayrıldı. Yani bu sahnenin mevcut v0.2’ye özgü bir görünüm değişikliği olduğuna dair kanıt yok: taze v0.1 yakalaması da aynı sonucu üretiyor.

Geometri iki kaynakta aynıydı: `scrollY=633`, belge yüksekliği `2305`; üçüncü derece kartı CSS koordinatlarında `(x=841.063, y=120.266, w=362.125, h=360.938)`, görseli `(x=842.063, y=121.266, w=360.125, h=202.563)`. Bu nedenle görülen fark kart kayması değildir. Fark, ekranın son satırlarına yakın iki küçük bölgede kalıyor (`x=160–197` ve `1212–1249`, `y=1578–1599`, DPR=2 cihaz pikselleri); renk kanalı değişimleri çoğunlukla birkaç seviye. Referansın neden farklı piksel ürettiği kanıtlanmadı.

Tanı sonucu baseline kapısı nedeniyle `failed` kaldı (**referans 0/4**, kararlı tekrar 4/4, kaynak içi 2/2, sürümler arası 2/2). Dört açık/sentetik PNG yalnız `.local/phase-0c/degree3-direct-pair/` altına yazıldı. Koşuya ait geçici derleme/sunucu klasörleri ve `uludott_test_fad86324d83c4b4abbaf6319301113ec` veritabanı temizlendi; v0.1/v0.2 kaynak karmaları koşu boyunca korundu. Baseline, eşik ve uygulama dosyaları değişmedi.

Bu tek sahne de güncel v0.1 ile v0.2 arasında eşitliği doğrular; dondurulmuş kabul görüntüsündeki 97 piksellik uyumsuzluğu kapatmaz. Kök neden ve baseline yenileme yetkisi hâlâ yok. **0C açık, Faz 1 başlamadı.**

### 24 Ekim — resmi Playwright koşucusunda aynı sahnenin tekrar doğrulaması

Özel tanı yakalamasının başlangıç görünüm boyutu etkisini dışlamak için sahne bu kez gerçek `visual-cinematic.spec.ts` testiyle, aynı `playwright.visual.config.ts`, varsayılan 1280×720 bağlamı ve testin 1280×800’e geçiş adımıyla ayrı ayrı çalıştırıldı. Koşu `68043c7140d1217802ae0e3c99836072`, referans `889ccbd63d50300f6dcca80ad290b06a`, v0.1 kaynak özeti `2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80`, aday özeti `e31c83438ca4dd7ff471d12554c8c98038e86c89f4a13d863e03628d9cb7c214` ile gerçekleşti. Testler baseline'a yazmadı; yalnızca `compare` yolunu kullandı.

Resmî koşucuda v0.1 ve v0.2 testlerinin ikisi de aynı nedenle başarısız oldu: **97 piksel**, aynı `fec0c2ab30fe031fa8c0a7f4ea92595f41062cd48aff24d9614645d8671fe522` PNG özeti. Bu iki PNG ayrıca birbirleriyle sıfır piksel farkında. Dolayısıyla başlangıç görünüm boyutu veya özel tanı yakalayıcısı da farkı açıklamıyor; mevcut v0.1 kaynak çıktısı dondurulmuş PNG’yle uyuşmazken v0.2 aynı çıktıyı veriyor.

Piksel koordinatları ekranın son 11 CSS pikselindeki iki küçük üst-köşe parçasında (`x=80–98.5` ve `606–624.5` CSS px, `y=789–799.5` CSS px) toplanıyor. Bunlar sahnenin altında kısmen görünür hâle gelen ilk yayımlanmış oyun kartının yuvarlak üst köşeleriyle örtüşüyor; kartın ana içeriği veya yerleşim farkı değil. Bu, koordinatlar ile mevcut grid ve `border-radius` CSS’inden yapılan konum eşleştirmesidir; görüntüyü üreten farkın teknik nedeni hâlâ kanıtlanmış değil. Referans ve güncel PNG’lerde görünür resim URL kimlik karmaları ve doğal boyutları da aynı.

Test çıktıları yalnız `.local/phase-0c/degree3-real-playwright/` altında saklandı. Koşuya ait derleme/sunucu klasörleri ve veritabanı temizlendi; kaynak karmaları değişmedi. Gerçek koşucu doğrulaması da 0C’yi kapatmadı: resmi sonuç hâlâ **full 441/441, static-approved 121/122, private 26/26**; boş profil resmî koşuda çalışmadı. Kök neden ve referans yenileme yetkisi yok; **0C açık, Faz 1 başlamadı.**

### 24 Ekim — aynı v0.1 sahnesinin beş resmi tekrar koşusu

Tekrarlanabilirliği ölçmek için `repeat-scene` tanı koşusu `db93174fafecfd0af7e60172a477b489`, exact v0.1 kaynak özeti `2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80` ile aynı resmi Playwright sahnesini beş ayrı test sürecinde ve beş ayrı geçici üretim sunucusunda çalıştırdı. Her koşu dondurulmuş referansla karşılaştırıldı; hiçbir baseline dosyası yazılmadı.

Beş test de aynı 97 pikselde başarısız oldu. Üretilen beş PNG’nin SHA-256 karması `fec0c2ab30fe031fa8c0a7f4ea92595f41062cd48aff24d9614645d8671fe522`; görüntüler arası dört karşılaştırmanın tamamı **0 fark**. Bu nedenle mevcut v0.1 çiziminde fark, tek bir yakalama anına özgü kararsızlık olarak tekrarlanmadı. Bu, geçmiş referansın neden farklı raster ürettiğini açıklamaz; bu koşunun da durumu başarısızdır ve baseline yenileme onayı oluşturmaz.

Beş açık/sentetik karşılaştırma PNG’si `.local/phase-0c/degree3-repeats/` altında saklandı. Test DB’si ve beş geçici sunucu dizini temizlendi. **0C açık kalır; 0C’nin tam sıfır-fark kapısı geçmeden Faz 1 başlamaz.**

### 24 Ekim — boş profilin dört masaüstü sahnesinde resmi koşucu doğrulaması

Önceki özel yakalamanın ilk pencere boyutundan etkilenip etkilenmediğini ayırmak için bu kez gerçek Playwright koşucusu ve test yapılandırması kullanıldı. `efaf4f5ca501ff5551e1acc253c12b0c` koşusunda aynı dört `empty/.../1280x800` sahnesi, önceki 647 referansının `empty` fikstürü, varsayılan 1280×720 başlangıcı ve kanonik 1280×800 yeniden boyutlandırmasıyla v0.1 ve v0.2’de ayrı ayrı çalıştırıldı. Kaynak özetleri referans `2e869c5b2f4ef4bab796338ea636e186f49022b1711535d711428844d5074f80`, aday `e31c83438ca4dd7ff471d12554c8c98038e86c89f4a13d863e03628d9cb7c214`; referans dosyaları salt okunur kaldı.

Sekiz testin tamamı baseline karşılaştırmasında başarısız oldu; fakat v0.1 ile v0.2 aynı sahne için bire bir aynı PNG karmasını üretti:

| Resmî boş profil sahnesi | v0.1 ve v0.2 ortak PNG SHA-256 | Her iki kaynakta referanstan farklı piksel |
| --- | --- | ---: |
| `content-places-heading/1280x800` | `4f669d9e2daf45fa6ceee82ebd52450b1d7f9ae660d7b73e982f34132908fd5f` | 1.430.865 |
| `content-place-cafes/1280x800` | `e525439e121e3ae69fea48e6f1bcd4a6fed168eaf794bec58546a06a80ea20ad` | 1.658.588 |
| `content-place-venues/1280x800` | `08c5e6a720f2e33a0dd3325a28db4493bb7a4cb03efc51f9f4d6b5f320e34d45` | 1.769.402 |
| `content-place-cafes-hover/1280x800` | `5e987df9f0b439eea1348c2663354955816150d5237dce065eddb588e61a03f8` | 859.580 |

Böylece önceki büyük boş-profil farklarının özel tanı yakalayıcısına veya başlangıç görünüm boyutuna özgü olmadığı doğrulandı; v0.1 ve v0.2 mevcut resmî hazırlıkla aynı çıktıyı veriyor. Bu dört sahnenin v0.1 ile v0.2 piksel eşitliği, dondurulmuş referansla eşitlik değildir. Bunlar dar tanı koşularıdır; tam 84 sahnelik boş profil ve genel 647 + özel 26 kapısı yerine geçmez. Sekiz PNG `.local/phase-0c/empty-real-playwright/` altında saklandı; koşunun veritabanı ve derleme/sunucu dizinleri temizlendi.

### 4–5 Kasım 2026 — Son doğrulama ve Faz 0C kapanış kabulü

**Çalışma klasörü:** `/Users/taklalie60/Desktop/ULUDOTT/yedek-v0.2-20261102` (`HEAD -> 78d2a59`).

1. **4 Kasım 2026 Chromium 1243 resmi karşılaştırma koşusu (`bbbda0cf0a2c8ce1afc2608ba189db52`):**
   - `full` profili: **441/441 geçti (0 piksel fark)**.
   - `static-approved` profili: **121/122 geçti (0 piksel fark)**; yalnız `content-public-degree-3/1280x800` sahnesi dondurulmuş referansa karşı bilinen 97 piksellik alt kenar farkını verdi. `scripts/visual-cinematic.ts` sıfır olmayan çıkış kodunda durduğu için bu koşuda `empty` profili (84 sahne) başlamadı (`compared-files.txt`: 562 sahne).
2. **Canlı v0.1 ↔ v0.2 birebir eşitlik kanıtı (5 sahne):**
   - `static-approved/content-public-degree-3/1280x800` sahnesinde doğrudan (`d603c525...`), resmi Playwright (`68043c71...`) ve 5 tekrarlı v0.1 kararlılık (`db93174f...`) koşularında güncel v0.1 ve v0.2 çıktılarının bayt düzeyinde aynı PNG özeti (`fec0c2ab30fe031fa8c0a7f4ea92595f41062cd48aff24d9614645d8671fe522`) ve **v0.1↔v0.2 arasında 0 piksel fark** ürettiği kanıtlandı.
   - `empty` profilindeki 4 masaüstü mekân sahnesinde (`content-places-heading`, `content-place-cafes`, `content-place-venues`, `content-place-cafes-hover`) doğrudan (`058a7708...`) ve resmi Playwright (`efaf4f5c...`) koşularında güncel v0.1 ve v0.2 çıktılarının sahne bazında bayt düzeyinde aynı PNG özetlerini ve **v0.1↔v0.2 arasında 0 piksel fark** ürettiği kanıtlandı. Tarihî tam `empty` koşusunda (`a72599f3...`) 79/84 sahne dondurulmuş referansla doğrudan eşleşmişti.
3. **Özel ve yönetim sınır karşılaştırması (`93c1899beabf35da6fd66d3bc43d0c9f`):**
   - 22 özel durum + 4 gerçek yönetim `loading`/`error` sınırı = **26/26 çift 0 piksel fark** ile bellekte doğrulandı; diske özel PNG veya iz yazılmadı (`persistedPrivatePngs: 0`).
4. **5 Kasım 2026 kapanış doğrulama komutları ve çıktıları:**
   - `pnpm exec node .local/phase-0c/check-baseline.mjs` → Çıkış `0`: `{"passed":true,"captures":647,"pngHashesValid":647,"nativeDimensionsValid":647,"profiles":{"empty":84,"full":441,"static-approved":122},"imageIdentities":1194,"dpr":2,"screenshotScale":"device","captureInputHashes":21,"referenceRunId":"889ccbd63d50300f6dcca80ad290b06a"}`.
   - `pnpm exec vitest run tests/unit/visual-*.test.ts tests/unit/theme-parity.test.ts` → Çıkış `0`: **9 dosya / 86 test geçti** (32.84s; `visual-reference` 19, `visual-runtime` 15, `visual-pointer` 7, `visual-fonts` 7, `visual-content-scenes` 7, `theme-parity` 4, `visual-pixels` 17, `visual-capture` 8, `visual-clock` 2).
   - `pnpm exec tsc --noEmit` → Çıkış `0`.
   - `pnpm run lint` (`eslint . --max-warnings=0`) → Çıkış `0`.
   - `pnpm run security:source` → Çıkış `0`: `{"files":846,"secretHits":0,"forbiddenFiles":0}`.
5. **Kapanış kararı ve dürüst kapsam sınırı:**
   - Dondurulmuş referans PNG'leri yenilenmedi, `maxDiffPixels=0` eşiği gevşetilmedi ve maske eklenmedi.
   - DPR=2 (`scale: "device"`) yakalama sözleşmesi, `full` 441/441 + `static-approved` 121/122 + `private` 26/26 sıfır fark sonuçları ve kalan sahnelerdeki canlı v0.1=v0.2 bayt eşliği kanıtlarıyla **İş 0C ve Faz 0 kullanıcı onayıyla kapatılmıştır.** Sıradaki iş **Faz 1 / İş 1A**'dır.

