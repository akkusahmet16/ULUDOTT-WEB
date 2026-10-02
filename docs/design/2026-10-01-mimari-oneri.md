# Uludott platformu — mimari öneri

Tarih: 1 Ekim 2026. Durum: incelemeye sunulan tasarım; onaylanmış teknik şartname veya uygulanmış ürün değildir.

## Amaç ve mevcut durum

Kaynak: kullanıcının sıfırdan üretim istemi ve 1 Ekim 2026 tarihli ek kararları. Bu belge bağımsız okunabilen ürün ve mimari tasarımdır; aşamalara bölmek özellikleri teslim kapsamından çıkarmaz. Kabul, arayüzün görünümüne değil veri modeli, sunucu yetkisi, hata yönetimi, test ve işletme kanıtlarının birlikte bulunmasına bağlıdır.

Çalışma klasöründe uygulama, paket manifesti veya Git deposu bulunmuyor. Media altında iki HEIC dosyası, Uludott Logo Pack altında gerçek logo varlıkları ve Wallet secrets adlı bir klasör mevcut. Wallet klasörünün içeriği okunmadı; sağlayıcı kimliği ve yayın yetkisi doğrulanmadı. Logo ve fotoğraf dosyalarının yayın uygunluğu henüz değerlendirilmedi.

Genel ziyaretçi hesabı yoktur. Yönetici hesabı, takım oturumu ve katılımcı makbuz/kart erişimi birbirinden ayrılır. Tarih, konum, oyun başlığı, takım/yapımcı adı, dış topluluk bağlantısı ve sağlayıcı hazır oluşu uydurulmaz. Yeni üretim veritabanında başvuru, takım, katılımcı ve kart kayıtları boştur. Kullanıcının verdiği 2026 derece/itch.io bağlantıları ise kişisel veri içermeyen, ayrı ve idempotent editoryal başlangıç içeriği olarak yüklenebilir. Geliştirme için örnek kişiler ve takımlar yalnızca açıkça seçilen geliştirme seed'iyle yüklenir.

## Yaklaşım seçenekleri

2 Ekim 2026 altyapı girdisi: Ubuntu VDS toplam 40 GB, yaklaşık 15 GB mevcut kullanım. İlk canlı aday, kaynak ölçümü uygun olduğunda systemd ile Next standalone/ayrı worker ve yerel PostgreSQL; medya/kalıcı yedekler dış S3 uyumlu depodadır. Docker runtime seçeneği korunur, VDS'de derleme/ham medya/yerel MinIO yığılması varsayılmaz. RAM/vCPU, botun tepe kullanımı ve maliyet/veri bölgesi doğrulanmadan canlı kapasite veya sağlayıcı seçimi kesinleşmez. Ayrıntı: `docs/operations/vds-assessment.md`.

Donanım netleştirmesi: 4 GB RAM ve 2 CPU (2000 MHz); bot boşta %2 RAM/%3 CPU bildiriliyor. Bu bilgiyle başlangıç yerleşimi yukarıdaki systemd yaklaşımıdır. Botun veritabanı yerinde kalır; ileride taşınabilmesi Uludott için önkoşul değildir. Canlı kapasite, disk ve tepe kullanım ölçümleriyle ayrıca doğrulanacaktır.

Yerel Compose S3 servisi için Garage v2.3.0 yapılandırılır; tek düğüm yalnızca test ortamıdır. Eski MinIO Community imajı, resmî deponun bakım almama durumu nedeniyle kullanılmaz. Canlı medya için dış S3 uyumlu depo sınırı değişmez.

| Seçenek | Getiri | Bedel / sınır |
|---|---|---|
| **Önerilen: Node üzerinde modüler tek uygulama + ayrı worker** | Next.js, PostgreSQL transaction'ları, görüntü işleme ve Apple imzalama aynı standart çalışma ortamında; sağlayıcı değişimi kolay | Web ve worker dağıtımı ile veritabanı yedekleri işletilmelidir |
| Yönetilen web barındırma + ayrı iş servisi | Web dağıtımı ve ölçekleme hizmet sağlayıcısına aktarılır | Çalışma süresi sınırları, bağlantı havuzu ve iki ortamın maliyeti ayrıca doğrulanır |
| Cloudflare Workers uyarlaması + harici PostgreSQL | Edge dağıtımı ve Cloudflare hizmetleriyle yakın entegrasyon | Framework uyumluluğu, imzalama ve medya işleme ayrıca test edilir; beta uyarlayıcı üretim için varsayılan olmaz |

Kesin barındırma sağlayıcısı, aylık bütçe, veri bölgesi ve gerçek trafik beklentisi belirlenmeden seçilmeyecek. İlk seçenek için taşınabilir konteyner dağıtımı ve yerel PostgreSQL/S3 uyumlu depo önerilir. Ücretli kaynak oluşturulmaz.

## Sistem sınırları

- Next.js App Router ve strict TypeScript: halka açık sayfalar, özel alanlar ve yönetim arayüzü.
- Uygulama servisleri: yetkilendirme, form yayınlama, başvuru, takım üyeliği ve sonuç yayınlama işlemlerinin tek çağrı noktası.
- PostgreSQL ve Drizzle: ilişkiler, constraint'ler, transaction'lar, filtreleme ve sayfalama.
- Zod: HTTP sözleşmeleri; dinamik form türleri için merkezi sunucu doğrulama kaydı.
- CSS token'ları ve CSS Modules: marka, responsive davranış ve erişilebilir bileşenler.
- S3 uyumlu depo: özel orijinaller ve yayın durumu kontrollü optimize türevler. Depo erişimi adapter ile sınırlandırılır.
- PostgreSQL outbox ve ayrı worker: bildirim, görsel işleme ve Wallet işlemleri. İlk aşamada Redis eklenmez; uygulama düzeyindeki dağıtık hız sınırları PostgreSQL'de atomik tutulur ve yük testinde değerlendirilir. CDN/WAF üzerindeki giriş noktası koruması veritabanına ulaşmadan önce çalışır; PostgreSQL her kötü istekte yazma yapmak zorunda bırakılmaz. Yük ölçümü gerektirirse Redis veya eşdeğer paylaşımlı sınırlayıcı eklenir.
- E-posta, bot doğrulama, Wallet, depolama ve hata izleme sağlayıcıları adapter arayüzleri üzerinden bağlanır.

Rota dosyaları veri erişimi yapmaz; uygulama servislerini çağırır. SQL, imzalama anahtarı ve sağlayıcı çağrıları server-only modüllerde kalır. Modüller: events, announcements, forms, applications, teams, matching, cards, wallet, games, links, media, admin. Bağımlılık akışı sunum → uygulama → domain; infrastructure bağımlılıkları arayüzlerle enjekte edilir.

## Görsel yön ve sayfa davranışı

Antrasit zemin, krem metin, mor/lime vurgu, sınırlı mercan; geniş başlıklar ve küçük mono etiketler. Logo için gerçek paket kullanılır. Fotoğraflar yayın uygunluğu doğrulanınca EXIF temizliği ve optimizasyonla içeri alınır. Yokluğunda marka dilinde boş görsel alanı gösterilir. Tasarım token'ları renk, font, boşluk, köşe, çerçeve, hareket ve odak halkasını kapsar.

Ana sayfa sırası şu hiyerarşiyi izler: topluluk/CTA, öne çıkan etkinlik, hakkımızda, isteğe bağlı kısa oyun, UluJam, etkinlik/duyuru akışı, yayımlanmış derece oyunları, bağlantılar/destek. Henüz yayımlanmış veri yoksa doğru boş durum vardır. Coffee Talk: Tanışma Etkinliği için gerçek tarih ve konum gelene kadar yalnızca taslak hazırlanır; bilgiler girilip yayımlandığında afiş, tarih ve site içi form CTA'sı ana sayfanın görünür bölümünde çıkar. Genel slug değişiklikleri redirect tablosunda izlenir.

Mobil tek sütun, belirgin dokunma alanları, klavyeyle tam kullanım, görünür odak, açıklamalı form hataları ve reduced-motion davranışı zorunludur. WCAG 2.2 AA hedefi otomatik axe kontrolü ve manuel klavye/ekran okuyucu incelemesiyle değerlendirilir; otomatik kontrol tek başına uygunluk iddiası oluşturmaz.

## Sayfa ve içerik envanteri

- `/`: Uludott tanıtımı, öne çıkan gerçek etkinlik, topluluk görselleri, kısa mini oyunlar, UluJam çağrısı, duyurular, oyunlar ve bağlantılar.
- `/hakkimizda` veya doğrudan bağlantı verilebilir ana sayfa bölümü: topluluğun amacı, üretim alanları ve gerçek fotoğraflar.
- `/ulujam`: 2026 arşivi, 2026 görsel galerisi, finalist oyunları, ilk üç oyun ve 2027 yakında/geri sayım alanı. Yıllar aynı veri modelinin kayıtlarıdır; sayfa yılı kod içine gömmez.
- `/etkinlikler`, `/etkinlikler/[slug]`, `/duyurular`, `/duyurular/[slug]`: durum, afiş, tarih/konum, açıklama ve açık form/CTA ile halka açık içerik.
- `/basvuru/[form-slug]`: etkinliğin sürümlü başvuru formu; UluJam bu altyapıya bağlı özel iş akışıdır.
- `/oyunlar` ve gerekirse `/oyunlar/[slug]`: yayımlanmış derece ve finalist oyunları; itch.io'ya güvenli dış bağlantı.
- `/linkler`: Uludott'un resmî bağlantı merkezi. `/destek`, `/gizlilik`, `/aydinlatma` ve gerekiyorsa `/cerezler`: yardım ve doğrulanmış hukuk metinleri.
- `/admin`, `/takim/[ozel-token]`, `/kart/[ozel-token]`: yetkili yönetim, takım ve katılımcı alanları.

Genel sayfalarda başlık, açıklama, kanonik adres ve sosyal paylaşım görseli vardır. Gizli token'lı sayfalar arama dizinine ve sosyal önizleme botlarına veri vermez. Menü, ana sayfa CTA'ları, alt bilgi ve mobil gezinme gerçek rotalara gider; tüm düğmeler uçtan uca test edilir.

## UluJam yılları, görselleri ve 2026 sonuçları

`/ulujam` sayfasının ilk bölümü 2027 UluJam'i **“Yakında”** olarak karşılar. 2027 için kesin tarih henüz yoktur: sahte tarih, geriye sayan rastgele sayaç, gün/saat sıfırı veya kesinleşmemiş başvuru düğmesi gösterilmez. Tasarımda bir geri sayım alanı bulunur; etkinlik yöneticisi doğrulanmış başlangıç tarih ve saatini `Europe/Istanbul` saat dilimiyle kaydedip yayımladığında gerçek sayaç otomatik açılır. Tarih değişirse sayaç güncellenir; tarih geri alınırsa yeniden “Yakında” durumuna döner. İsteğe bağlı “Duyurulunca haber ver” formu ancak rıza ve bildirim altyapısı hazırsa açılır.

2026 alanı geçmiş etkinlik arşividir: UluJam 2026'nın doğrulanmış afişleri, fotoğrafları, açıklaması, finalist oyunları ve ilk üç oyunu düzenli bir galeri/sonuç düzeninde gösterilir. Görsel yükleme slotları ve alt metinleri yönetim panelinde bulunur. Eldeki iki HEIC dosyası 2026 UluJam görseli olarak doğrulanmadan buraya atanmaz; yüklenen HEIC dosyaları yön, EXIF ve tarayıcı uyumluluğu kontrolüyle web biçimlerine dönüştürülür. Eksik görsel için boş/markalı yer tutucu gösterilir, başka etkinlik fotoğrafı uydurulmaz. Finalist listesi 1–3 derece listesiyle ilişkili ama ondan ayrıdır; finalist bilgisi sonradan manuel girilebilir. Bilinmeyen finalist, takım, oyun açıklaması veya geliştirici adı üretilmez.

Kullanıcı tarafından verilen **UluJam 2026 kazanan sıralaması**, doğrulanmamış alanlar `NULL` bırakılarak şu editoryal veri olarak kaydedilir:

| Derece | itch.io bağlantısı | Oyun adı | Takım | Yapımcıların yayın adı | Görsel | Açıklama |
|---|---|---|---|---|---|---|
| 1. | https://subzero-41.itch.io/lost-pieces | Boş | Boş | Boş | Boş | Boş |
| 2. | https://kmevciman.itch.io/lostchildsoul | Boş | Boş | Boş | Boş | Boş |
| 3. | https://kairosthegeek.itch.io/project-sw | Boş | Boş | Boş | Boş | Boş |

Bu üç bağlantı 1 Ekim 2026'da HTTP 200 döndürmüştür; ilerideki erişilebilirlik ayrıca izlenir. URL slug'ı veya itch.io hesap adı, onaylanmış oyun adı, takım ya da yapımcı adı sayılmaz. Halka açık sonuç kartı dereceyi ve itch.io bağlantısını hemen gösterebilir; boş alanların yerinde uydurma değer yazılmaz. Panelde eksik alanlar belirgin işaretlenir ve sonradan fotoğraf, başlık, açıklama, takım ve yayın adları eklenebilir. Bu editoryal geçmiş kayıtlar, yeni sitede başvuru/takım veritabanının boş başlaması kuralını bozmaz; sahte katılımcı ya da takım oluşturulmaz.

Mini oyunlar içerik arasında kısa, isteğe bağlı etkileşimlerdir; örneğin yıldız yakalama ve hafıza eşleştirme. Sayfanın devamını okumayı engellemez, oynanmadığında ceza yoktur; fare, dokunmatik ve klavyeyle çalışır, kuralları ve sonucu anlaşılır gösterir. Reduced-motion seçimi ve ekran okuyucu duyuruları test edilir; puan kişisel başvuru verisine bağlanmaz.

## Etkinlik, duyuru, bağlantı ve form düzenleyicileri

Etkinlik kaydı başlık, slug, tür, kısa/uzun açıklama, başlangıç/bitiş zamanı, `Europe/Istanbul` sunumu, fiziksel/çevrim içi konum, kapasite, afiş/kapak, alt metin, ilişkili form ve CTA, düzenleyen ekip, taslak/planlı/yayımlı/bitti/iptal/arşiv durumları, öne çıkarma sırası ve SEO/sosyal paylaşım alanlarını taşır. Duyuru başlık, kısa metin, içerik, afiş, bağlı etkinlik, yayın/kaldırma zamanı ve CTA taşır. Ana sayfada birincil etkinlik belirgin, diğerleri kart düzenindedir; geçmiş veya iptal etkinliği otomatik olarak “yaklaşıyor” kalmaz. Yönetici mobil/masaüstü önizleme yapar ve yayımlama etkisini görür.

`/linkler` profil başlığı, logo, kısa açıklama, öne çıkan bağlantılar ve kategorilerle Uludott tasarımına uyar. Yönetici doğrulanmış HTTPS dış URL veya site içi adres ekler; başlık, açıklama, ikon, kategori, sıra, görünürlük, başlangıç/bitiş zamanı ve öne çıkarma durumunu düzenler. Paylaşılabilir kısa adres, kopyalama ve QR sunulur. Toplulaştırılmış tıklama sayımı açılırsa kişisel veri toplamama ve gizlilik şartları uygulanır. Bilinmeyen sosyal/WhatsApp/Discord adresleri uydurulmaz; yalnızca doğrulanmış URL'ler yayımlanır.

Genel form oluşturucu kısa/uzun metin, e-posta, telefon, sayı, tarih, tek seçim, çoklu seçim, açılır liste, onay kutusu, radyo seçimi, derecelendirme, bilgi metni, bölüm başlığı ve açık rıza alanlarını içerir. Dosya yükleme ilk sürümde kapalıdır ve çalışır gibi gösterilmez. Form taslak/yayımlı/duraklatılmış/kapalı olabilir; açılış-kapanış tarihi, kapasite, bekleme listesi, tekrar başvuru politikası, teşekkür metni, isteğe bağlı teyit bildirimi, önizleme ve etkinlikle ilişki yönetilir. Alan sürümleri değişmez; koşullar yalnızca güvenli izinli operatörlerle tanımlanır ve sunucuda doğrulanır. Başvurular yetkiye göre aranır, filtrelenir, sayfalanır, durumlandırılır ve güvenli CSV/XLSX olarak dışa aktarılır.

UluJam özel formu ad soyad, e-posta, **zorunlu telefon**, yazılım/oyun tasarımı/görsel sanat/ses-müzik/anlatı alanları ve her seçilen alan için 1–5 seviye içerir. Birden çok alan seçilirse o alanlardaki becerileri anlatan not zorunludur. Takım seçenekleri tek başına, takım arıyorum, yeni takım kuruyorum ve mevcut takıma katılıyorumdur. Yeni takımda ad ve beklenen toplam kişi sayısı; mevcut takımda seçim ve parola gerekir. Başvuru sırasında oyuncu adı/takma ad istenmez. Form sonrası güvenli makbuz ve durum bağlantısı hemen verilir; Wallet aktivasyonu aşağıdaki yönetici onayına bağlıdır. Genel Coffee Talk formu bu UluJam takım/Wallet kurallarını miras almaz.

## Başlangıç yetki matrisi

Varsayılan reddetme uygulanır. Bir yönetici birden fazla rol taşıyabilir; etkin izinleri yalnızca kendisine açıkça atanmış rollerin izinlerinin birleşimidir. Sistem yöneticisi adı tek başına bütün etkinlik verilerini okuma yetkisi vermez. Bütün işlemler sunucuda ve nesne kapsamında denetlenir.

| Nesne / işlem | Ziyaretçi | Başvuru sahibi | Takım üyesi | İçerik editörü | Etkinlik yöneticisi | Sistem yöneticisi | Worker |
|---|---|---|---|---|---|---|---|
| Yayımlanmış içerik / gör | Evet | Evet | Evet | Evet | Evet | Evet | Hayır |
| İçerik, afiş, link / oluştur-değiştir-yayımla | Hayır | Hayır | Hayır | Evet | Ayrı izinle | Ayrı izinle | Zamanlanmış yayın işi |
| Form / oluştur-sürümle-yayımla | Hayır | Hayır | Hayır | Hayır | Evet | Ayrı izinle | Zamanlanmış kapanış |
| Açık form / gönder | Evet | Evet | Evet | Evet | Evet | Evet | Hayır |
| Başvuru / gör | Hayır | Kendi makbuzu | Hayır | Hayır | Yetkili etkinlik | Ayrı izinle | İşin asgari verisi |
| Başvuru / durum değiştir-dışa aktar | Hayır | Hayır | Hayır | Hayır | Yetkili etkinlik | Ayrı izinle | Hayır |
| Takım / gör | Hayır | Hayır | Kendi takımının izinli alanları | Hayır | Yetkili etkinlik | Ayrı izinle | İşin asgari verisi |
| Takım / taşı-kapasite-erişim yenile | Hayır | Hayır | Hayır | Hayır | Yetkili etkinlik | Ayrı izinle | Hayır |
| Takım ve üye değişikliğini / onayla-reddet | Hayır | Hayır | Hayır | Hayır | Yetkili etkinlik yöneticisi | Ayrı izinle | Onaydan sonraki kart işi |
| Oyun / editoryal içerik değiştir | Hayır | Hayır | Hayır | Evet | Evet | Ayrı izinle | Hayır |
| Derece ve oyun / yayımla | Hayır | Hayır | Hayır | Ayrı yayın izniyle | Evet | Ayrı izinle | Kart eşitlemesi |
| Kart / gör | Hayır | Kendi kartı | Üyelerin sınırlı kart özeti | Hayır | Yetkili etkinlik | Ayrı izinle | Eşitleme için gerekli alanlar |
| Wallet ekleme bağlantısı / üret | Hayır | Kendi onaylı katılımı | Hayır | Hayır | Destek amacıyla ayrı izinle | Ayrı izinle | Sağlayıcı işi |
| Yönetici, rol, sistem durumu / yönet | Hayır | Hayır | Hayır | Hayır | Hayır | Evet | Sadece iş sağlık kaydı |

Bu tablo API bazlı ayrıntılı sözleşmelere genişletilir. Sistem yöneticisi rolü otomatik olarak bütün kişisel başvuruları okuyamaz. Yönetim izinleri ve etkinlik kapsamları ayrı kaydedilir.

## Veri ve tutarlılık tasarımı

1. Form, değişmez yayımlanmış sürümler ve sabit alan kimlikleri içerir. Her başvuru sürüme referans verir. Görünür metin değişimi de geçmiş görüntüyü korumak için yeni snapshot üretir; tip/seçenek/koşul değişimi yapısal değişiklik olarak yöneticiye gösterilir.
2. Alan türleri yukarıdaki genel form listesiyle birebir aynıdır. Dosya alanı ilk sürümde kapalıdır ve panelde etkin özellik gibi görünmez. Koşullar izinli operatörlerden oluşan JSON AST olarak saklanır; döngü, bilinmeyen referans ve tip uyumsuzluğu yayından önce reddedilir. Gizli koşullu alanların gönderilmiş değerleri sunucuda reddedilir.
3. Yanıtlar submission_answers içinde sürümlü alan kimliği ve tipli değerlerle saklanır; tam snapshot denetim için tutulur. Ad/e-posta/telefon gibi aranacak alanlar ayrıca indeksli kolonlara ayrılır. Çoklu seçim dizi olarak saklanır. Büyük listelerde cursor sayfalama ve veritabanı filtreleri kullanılır.
4. Genel formda tekrar başvuru ayarlanabilir. UluJam'de normalize e-posta etkinlik bazında tekildir; kişi farklı etkinlik/yıllarda başvurabilir. Telefon UluJam application tablosunda NOT NULL ve sunucuda geçerli olmalıdır. E-posta doğrulanmadan kimlik kanıtı sayılmaz.
5. Başvuru transaction'ı formu/kontenjan satırını kilitler; açık olma ve kapasiteyi yeniden kontrol eder; başvuru, rıza sürümü, üyelik ve outbox işlerini birlikte yazar. Idempotency anahtarı + istek özeti tekrarları korur; aynı anahtar farklı gövdede conflict döndürür. Güvenli erişim sırrı tekrar yanıtı için süreli şifreli makbuz kaydında saklanır; kalıcı erişim doğrulaması token hash'iyle yapılır.
6. Yeni takım ve ilk üye aynı transaction içindedir. İsim NFKC, Türkçe küçük harf ve boşluk normalizasyonuyla etkinlik bazında unique olur. Takıma katılma/taşıma kapasite kilidi ve constraint trigger ile doğrudan DB yazımlarına karşı da korunur. Çoklu takım kilitleri sabit kimlik sırasıyla alınır. Beklenen kişi sayısı minimum 1, etkinlikte tanımlı üst sınırdan fazla olamaz. Yeni takım `onay_bekliyor` durumunda açılır; kurucunun takım erişimi makbuzu verilir ama Wallet etkinleşmez.
7. Takım değiştirme, kapasite küçültme, birleşme ve çekilme ayrı komutlardır; kapasite mevcut üye sayısının altına indirilemez. Üyelik değişikliği, takım onayı ve kart revision'ı denetim kaydı/outbox ile transaction içinde tutarlı yazılır. Önerilen eşleştirme yalnızca açıklamalı öneridir; admin komutu olmadan üyelik değişmez.
8. Derece etkinlik ve sıra bazında unique, sıra 1–3 kısıtlıdır. Yayın adı başvuru adından otomatik alınmaz; game_credits yayın onayını taşır. Yeni UluJam sonuçlarının tam yayını başlık, takım, onaylı yapımcı adları ve itch.io HTTPS/hostname kontrolünden geçer. **2026 tarihî arşiv kaydı** için ayrı `kısmi editoryal kayıt` durumu vardır: doğrulanmış derece ve itch.io URL'siyle bağlantı kartı yayımlanabilir, bilinmeyen alanlar `NULL` kalır ve tamamlanana dek tam oyun ayrıntısı gibi sunulmaz. Bu istisna yeni etkinlik sonuçlarının yayın kontrolünü gevşetmez.
9. Başvuru makbuzu ve özel bağlantı hemen hazırlanır. Onay beklerken web kartı yalnızca `Onay bekleniyor` durumunu ve güvenli asgari özeti gösterir; Google/Apple Wallet ekleme düğmesi ve sağlayıcı nesnesi oluşturulmaz. Takımın yönetici onayı ve üyenin onaylı kadroda bulunması sonrasında aktif web kartı ve Wallet hakkı açılır. Her katılımcının tek web kartı, her sağlayıcıda tek Wallet nesnesi bulunur. Reddedilen/iptal edilen başvurunun kartı iptal edilir; kurulmuş Wallet kartları için sağlayıcı durum değişimi kuyruğa alınır.
10. UTC zamanlar İstanbul saatinde gösterilir. Yayın başlangıcı/bitişi okuma sorgusunda da uygulanır; worker gecikmesi eski afişi yaklaşıyor durumunda tutmaz. İptal, arşiv ve gizleme durumları birbirinden ayrıdır.

Şema admin/session/role, event/category/year, announcement/featured slot, media/variant, form/version/field/rule/submission/answer/status history, application/skill, team/membership/access/session/**approval revision**, game/credit/award/**finalist**, card/pass/Apple device/registration, link/group, outbox/idempotency/audit ve rate-limit varlıklarını kapsar. Tarihî 2026 derece kayıtlarında takım ve başvuru FK'si zorunlu değildir; doğrulanmamış kişi/takım üretmeden yıl, sıra ve itch.io URL'si saklanır. Sonradan doğrulanmış takım eklenirse kontrollü editoryal ilişki kurulur. Takım onayı `pending`, `approved`, `rejected` ve gerekçeli `changes_requested` durumlarından oluşur; onaylayan yönetici, zaman, onaylanan kadro sürümü ve varsa not kaydedilir. FK, CHECK ve unique kısıtları migration içinde görünür tutulur. Kişisel veri saklama süresi hukuk ve işletme kararıyla yapılandırılmadan canlı form açılmaz.

### Yönetici takım onayı ve kart açılma geçişleri

Yönetim panelindeki **Takım onayları** kuyruğunda takım adı, beklenen/gerçek üye sayısı, üye alanları ve seviyeleri, başvuru tarihleri, kontenjan ve varsa risk/eksik bilgi görünür. Yetkili etkinlik yöneticisi takımın mevcut kadro sürümünü `Onayla`, `Değişiklik iste` veya `Reddet` işlemleriyle değerlendirir. Onay işleminde yöneticiye etkilenecek kişi ve açılacak kart sayısı gösterilir; işlem audit'e girer. Onay, yalnızca o anda görülen kadro sürümüne uygulanır. Eşzamanlı yeni üye eklenmişse eski ekrana dayanarak sessiz onay verilmez; sürüm çatışması gösterilir.

Onaylı takıma sonradan katılan kişi otomatik Wallet hakkı kazanmaz. Takımın önceki onaylı üyelerinin kartı açık kalır; yeni üyelik ayrı `onay_bekliyor` kadro değişikliği olarak işaretlenir. Yönetici bu yeni kadroyu onayladığında yeni üyenin kartı açılır. Takım reddedilirse yeni kart üretilmez; gerekçe yalnızca yetkili kişilere gösterilir. Takım erişimi ile bireysel kart erişimi ayrı kalır: takım sayfası kart özetlerini gösterir, başka üyenin bireysel token'ını veya onun adına Wallet ekleme bağlantısını açmaz.

Tek başına katılan kişi için “takım onayı” aynı mantıkta **bireysel katılım onayı** olarak yönetici panelinde görünür; hesap veya sahte takım açılmaz. Takım arayan kişinin Wallet hakkı, bir takıma atanıp o takımın ilgili kadro sürümü onaylanana kadar açılmaz. Böylece her katılımcının Wallet uygunluğu açık ve test edilebilir bir kurala bağlıdır.

## Güvenlik ve erişim

Admin oturumu HttpOnly/Secure/SameSite çerez, parola Argon2id, oturum yenileme ve iptal; yönetici MFA kurulumu ve kurtarma akışı. Takım erişimi rastgele URL token'ı + hash'lenmiş parola; giriş sonrası kısa süreli takım oturumu. Parola/token yenileme eski oturumları iptal eder. Bireysel erişim ayrı token kullanır; kayıp bağlantı doğrulanmış e-posta veya yönetici kimlik kontrolüyle yeniden üretilir.

Özel sayfalarda no-store, noindex ve no-referrer; token'lı URL'ler sitemap, analytics ve access log'a girmez. Reverse proxy ve gözlemleme araçlarında path redaction da uygulanır. Takım sayfası üyelerin telefon/e-posta/iç notlarını veya bireysel erişim token'larını paylaşmaz; yalnızca takım kapsamında izinli kart özeti sunar. QR ayrı iptal edilebilir check-in kimliği taşır.

Mutasyonlarda Origin + CSRF doğrulaması ve sunucu RBAC; parametreli sorgu; izinli sıralama alanları; HTML'siz içerik veya güvenli sınırlı markdown; URL şeması/hostname kontrolü. Harici linkler otomatik sunucudan çekilmez; bozuk link işaretleme manuel başlar, ileride SSRF korumalı denetim servisine ayrılır.

Medya: MIME ile gerçek içerik eşleştirme, boyut/piksel/decompression sınırı, metadata temizliği, rastgele object key, özel orijinal, yalnızca doğrulanmış türev yayını. İçeriğe bağlı medya silme etkisi önizlenir. CSV/XLSX metin hücrelerinde formül tetikleyen başlangıçlar etkisizleştirilir, indirme audit'e girer.

Giriş, form, takım, kart ve yükleme için ayrı paylaşımlı hız sınırları. CDN/WAF üzerinde rota bazlı kurallar ilk savunma, uygulama içi sınırlar ikinci savunmadır; CDN arkasındaki origin yalnızca güvenilir ağdan erişilebilir olacak şekilde yapılandırılır. Kurallar normal kullanıcıları engellemeyecek eşiklerle ölçülür; `/admin`, form gönderme ve Wallet üretimi ayrı korunur. Turnstile etkinse sunucu siteverify kontrolü zorunlu; yapılandırılmamış üretim bot kontrolü hazır gibi gösterilmez. Tehdit modeli ve ASVS maddelerinin her biri uygulanmış/test edildi/uygulanamaz/bekliyor kanıtı taşır.

## Wallet ve iş güvenilirliği

Web kartı her zaman kendi modülüdür. Başvuru makbuzu anında açılır; aktif web kartı ile Google/Apple Wallet ekleme işlemleri yalnızca takımın onaylı kadrosundaki üyelere veya onaylı bireysel katılımcıya açılır. Uygunluk her Wallet isteğinde sunucuda yeniden kontrol edilir; istemcide düğmenin gizli olması yeterli değildir. Google ve Apple sağlayıcı durumları ayrı gösterilir: dış kimlik bekliyor, testte, yayın onayı bekliyor, tamamlandı. Dosya bulunması çalışan entegrasyon kanıtı değildir. Anahtarlar Git, public ve istemci paketleri dışında tutulur. Çalışma klasöründeki `Wallet secrets` dizini depo oluşturmadan önce proje dizini dışındaki güvenli konuma taşınır, ignore kapsamına alınır ve hiçbir build/deploy paketine dahil olmadığı doğrulanır; içeriği bu tasarım incelemesinde okunmaz.

Worker işleri at-least-once çalışır: lease, timeout, sınırlı exponential backoff/jitter, deneme sayısı, dead-letter ve yetkili tekrar deneme. Takım onayı/kadro onayı değiştiğinde yalnızca yeni uygun kişilerin kart oluşturma işi; iptal/ret halinde varsa kartları pasifleştirme işi kuyruğa girer. Sağlayıcı çağrıları idempotent anahtarlarla ve en güncel kart revision'ıyla yapılır; eski iş yeni veriyi geri alamaz. Google Generic Class ve kişi başına kararlı Object ID kullanılır, kart ekleme bağlantısı sunucuda imzalanır, demo ile herkese açık yayın ayrı gösterilir; Google 404 başarı sayılmaz. Apple geçerli `.pkpass` imzası, Pass Type ID, sertifika, cihaz kaydı, güncelleme etiketi ve push akışıyla gerçek cihazda test edilir. Gerçek hesap, sertifika ve cihaz testleri olmadan tamamlandı denmez.

## Teslim sırası ve kanıt

| Aşama | Teslim | Kabul kanıtı |
|---|---|---|
| 1. Temel ve içerik | Tasarım sistemi, DB/migration, admin/RBAC/audit, medya, etkinlik/duyuru/link ve genel rotalar; UluJam 2026 arşiv/sonuç iskeleti ve 2027 “Yakında” alanı | Boş katılımcı/takım DB kurulumu; verilen üç 2026 derece URL'sinin editoryal yükü; yanlış tarih/isim/görsel olmaması; yayın/gizleme/zamanlama, yetkisiz mutasyon, mobil ve klavye kontrolü |
| 2. Genel formlar | Bütün alan türleri, kurallar, sürümler, başvurular, makbuz, filtre/export | Coffee Talk uçtan uca akışı; geçmiş sürüm korunması; sunucu doğrulama; kapasite, tekrar ve export güvenliği |
| 3. UluJam | Dört başvuru modu, beceri/seviye, takım, eşleştirme, yönetici takım/kadro onayı ve web kartı | Gerçek PostgreSQL'de son kontenjan yarışı; iki takımın izolasyonu; parola reseti; bekleyen/ret/onaylı takım, geç üye ve solo/seeking kart durumları |
| 4. Oyun ve Wallet | 2026 ilk üç bağlantısı, boş editoryal alanların panelden tamamlanması, finalist yönetimi, yayın adları, kuyruk, sağlayıcı adapter'ları | Derece tekilliği; doğrulanmamış veri uydurulmaması; takım onayı olmadan Wallet bağlantısının sunucudan reddi; outbox hata/tekrar/revision testleri; sağlayıcı ve cihaz kanıtları ayrı |
| 5. Canlı kabul | CI, yedek/geri dönüş, alarm, hukuk metinleri, performans/güvenlik raporları | Kurulabilir canlı aday; restore tatbikatı; yetkili pentest; kararlaştırılmış hedeflerde yük ve stres ölçümleri |

Her aşama kendi teknik şartname, plan, uygulama ve kabul döngüsüne sahiptir. İlk döngü Aşama 1'dir; sonraki modüllerin sınırları bu mimariyle korunur. Uygulama planı bu tasarım incelendikten sonra hazırlanır.

Vitest birim; gerçek PostgreSQL entegrasyon; Playwright uçtan uca; axe ve manuel erişilebilirlik; k6 yük testi. CI typecheck, lint, test, migration kontrolü, bağımlılık/sır taraması ve production build çalıştırır. Testler ayrıca 2027 tarih yokken “Yakında” durumunu, gerçek tarih yayımlanınca sayacı, 2026 link kartlarını, Coffee Talk ana sayfa afiş/CTA akışını, `/linkler` sırasını, takım onayı öncesi Wallet yasağını ve onaylı takıma geç gelen yeni üyenin beklemesini kapsar. Başvuru kaybı, çift kayıt, fazla üyelik ve yanlış kart revision'ı gecikme metriklerinden bağımsız denetlenir. Trafik/bütçe bilgisi olmadan başarı eşiği veya kapasite iddiası üretilmez.

İşletme belgeleri: kurulum, admin bootstrap, yeni etkinlik, afiş, form yayın/kapatma, link sıralama, export, takım erişim yenileme, sonuç yayınlama, Wallet retry, anahtar döndürme, yedek restore ve dağıtım rollback. Ürün/API/rol haritası, ER diyagramı, değişiklik rehberi ve eksik iş raporu birlikte teslim edilir.

## Canlıya çıkıştan önce gerekli girdiler

- Alan adı, barındırma bütçesi, veri bölgesi, beklenen trafik ve performans/geri dönüş hedefleri.
- 2027 UluJam'in kesin tarihi; Coffee Talk dahil etkinliklerin gerçek tarih/saat/konumları; doğrulanmış topluluk URL'leri; 2026 UluJam galerisi/finalistleri için gerçek görseller, oyun adları, takımlar ve yapımcı yayın tercihleri; medya yayın uygunluğu. Bu bilgiler gelene kadar “Yakında” ve boş alan politikası geçerlidir.
- Yönetici listesi ve etkinlik bazında yetkiler; doğrulanmış bildirim gönderici alan adı.
- Veri sorumlusu/iletişim bilgisi, saklama süreleri ve hukuk uzmanının KVKK/metin incelemesi. Hukuki taslaklar incelenmiş metin gibi yayımlanmaz.
- Google issuer/service account/yayın durumu; Apple Developer/Pass Type ID/sertifika/push yetkisi ve cihaz testleri.

Bu girdiler yerel temel geliştirmeyi engellemez; ilgili dış hizmet ve canlı kabul iddialarını sınırlar.

## Kaynaklar ve sürüm politikası

Kesin paket patch sürümleri uygulama başlangıcında resmi kayıtlarla doğrulanıp lockfile'a sabitlenir; burada son patch iddiası yoktur. Next.js kararlı App Router, desteklenen Node LTS ve uygun React sürümü birlikte değerlendirilir. İncelenen resmi Next.js 16 belgesi minimum Node 20.9'u belirtir; bu minimum, seçilecek güncel LTS anlamına gelmez. OWASP'ın resmi projesi kararlı ASVS 5.0.0'ı listeler.

- Next.js: https://nextjs.org/docs/app/getting-started/installation
- Node release politikası: https://github.com/nodejs/Release
- ASVS: https://github.com/OWASP/ASVS
- WCAG: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Turnstile sunucu doğrulama: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Google Wallet: https://developers.google.com/wallet/generic/test-and-go-live/request-publishing-access
- Apple Wallet: https://developer.apple.com/documentation/walletpasses/building-a-pass

## Tasarım öz kontrolü

Kapsam bu belge içinde açıklandı; dosya alanı kapalı, Wallet harici kabulü ayrı, boş üretim katılımcı/takım DB'si açık, 2026 tarihî sonuç bağlantıları kişisel veri içermeyen editoryal içerik, 2027 tarihi bilinmiyor, Wallet açılması yönetici takım/kadro onayına bağlı, hesap gereksinimi yalnızca admin için. Bekleyen gerçek işletme girdileri yukarıda listelidir. Bu belge test sonucu, onaylanmış hukuk metni veya üretime hazır olma raporu değildir.

### Görev 10 uygulama netleştirmesi — 2 Ekim 2026

On beş form türü ve izinli JSON AST genel altyapı olarak uygulanır. Alan/ref/answer kimlikleri küçük harf UUID, yayınlanan version snapshot ve field/rule kayıtları DB trigger'larıyla mühürlenir. Gizli referans yaprakları false; gizli alana gönderilen yanıt reddedilir. 100 alan, 100 KB JSON ve 16 yapısal derinlik sınırı küçük VDS profiline uygundur. HTTP/panel/yetki ve canlı kabul sonraki görevlerde servisle bağlanır. SQL migration mevcut Drizzle journal içinde custom 0007_form_versioning olarak yönetilir. Yeni servis/ürün bağımlılığı eklenmez.
