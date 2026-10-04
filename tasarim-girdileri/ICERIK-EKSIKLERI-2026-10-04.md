# Uludott — görsel ve içerik eksikleri raporu

İnceleme: 4 Ekim 2026. Esas alınan ortam: http://127.0.0.1:3001/.

## Sonuç

- **Şu an çalışan sitede GTA VI yerine içerik bekleyen 18 medya alanı var: 14 görsel + 4 video.** Aynı GTA dosyasının farklı alanlarda tekrar kullanılması nedeniyle aktif benzersiz GTA dosyası sayısı 14; bu iki sayı farklı şeyleri ölçüyor.
- Bunlara ek olarak **üç derece oyununun kapağı ve editoryal bilgileri eksik**. Mevcut sekiz kişilik düzen korunursa toplam teslim listesi 17 görsel + 4 video olur.
- **Ancak People klasörünün yeni README’si ekip düzenine geçmiş.** Eski sekiz kişilik sayfa henüz buna uyarlanmamış. Bu nedenle aşağıdaki eski kişi videolarını hemen hazırlamak yerine yeni ekip düzenini esas almak gerekir.
- Coffee Talk ve Valorant afişleri var; bunların etkinlik/duyuru kayıtlarıyla bütünleşmesi eksik. İletişim sayfasında da gerçek sosyal bağlantılar olmasına rağmen eski boş durum metni duruyor.

Bu çalışma inceleme ve raporlamadır. Sayfa tasarımı, veritabanı kayıtları ve kullanıcı dosyaları değiştirilmedi. Sites yayını/GitHub push yapılmadı.

## 1. Ana sayfa ve ortak menü — kesin hazırlanacak 6 görsel

Aşağıdaki yollar `tasarim-girdileri/` klasörüne göredir. Ölçüler mevcut teslim şablonundaki hedef ölçülerdir; görsellerin mevcut doğal çözünürlüğü değildir.

| Konum / nasıl görülür? | Şu an kullanılan GTA içeriği | Hazırlanacak dosya | Ölçü | İçerik önerisi |
|---|---|---|---|---|
| Menü açılınca varsayılan arka plan; Ana sayfa, UluJam, Duyurular, Oyunlar üzerinde | `community.avif` | `00-ortak/menu-topluluk.webp` | 1920×1080 | Topluluğun genel kimliğini taşıyan yatay sahne/kolaj |
| Menüde Hakkımızda üzerine gelince | `board-1.avif` | `00-ortak/menu-people.webp` | 1920×1080 | Yönetim ve ekipleri gösteren sahne |
| Menüde Etkinlikler veya İletişim üzerine gelince | `venue-1.avif` | `00-ortak/menu-places.webp` | 1920×1080 | Gerçek etkinlik/kafe/mekân sahnesi |
| Ana sayfa → Etkinlikler ve oyunlar → üretilen oyunlara açılan kart | `world.avif` | `01-anasayfa/anasayfa-oyunlar.webp` | 1920×1080 | Topluluğun oyunlarından ekran görüntüsü veya kolaj |
| Ana sayfa → People & Places / “Topluluğun dünyası.” büyük sahnesi | `venue-2.avif` | `01-anasayfa/anasayfa-topluluk-dunyasi.webp` | 2560×1440 | Topluluk, kampüs ve etkinlik ortamını birleştiren yatay görsel |
| Ana sayfa → “Derece oyunları” paneline tıklayınca açılan pencerenin üst kapağı | `community.avif` | `06-oyunlar/derece-oyunlari-kapak.webp` | 1920×1080 | İlk üç oyuna veya ödül anına ait kapak |

Menü görselleri ortak olduğu için her sayfa için yeniden dosya gerekmez. Derece oyunlarının ana sayfadaki panel görseli **hazır**; eksik olan panel açılınca görülen **pencere kapağıdır**.

## 2. Hakkımızda → yönetim kurulu / People

### 2.1 Çalışan sayfanın mevcut durumu

Her kişinin detay fotoğrafı açılış videosunun kapak görüntüsü olarak da kullanılıyor; ayrıca video kapağı hazırlamak gerekmiyor.

| Sıra | Kişi | Açılış videosu | Detay fotoğrafı / video kapağı | Bilgi durumu |
|---|---|---|---|---|
| 1 | Hamza Yiğit Adıgüzel | Topluluk dosyası hazır | Topluluk dosyası hazır | Görev, alıntı, bölüm/sınıf var |
| 2 | Batuhan Özdemir | Topluluk dosyası hazır | Topluluk dosyası hazır | Görev, alıntı, bölüm/sınıf ve dergi bilgisi var |
| 3 | Ahmet Akkuş | **GTA Cal Hampton** | **GTA Cal Hampton** | Bilgi var; yeni kaynak klasörü `sosyal-medya-ekip` |
| 4 | Halis Can Sağır | Topluluk dosyası hazır | Topluluk dosyası hazır | Kullanıcının verdiği metin var |
| 5 | Efe Tutucu | Topluluk videosu sitede mevcut | **GTA Dre’Quan Priest** | Bilgiler kodda var; eski kaynak klasörü artık yok |
| 6 | Aybey | **GTA Real Dimez** | **GTA Real Dimez** | Soyadı, kesin görev, bölüm/sınıf ve tanıtım bilgisi yok |
| 7 | Dwayne Jesus Emir | **GTA Raul Bautista** | **GTA Raul Bautista** | Yayınlanacak isim, kesin görev, bölüm/sınıf ve tanıtım bilgisi netleştirilmeli |
| 8 | Melek | **GTA Brian Heder** | **GTA Brian Heder** | Soyadı ve ayrıntılar yok; mevcut rol “Eski Sosyal Medya Departmanı” |

Mevcut düzende **5 detay fotoğrafı + 4 açılış videosu** GTA içeriği kullanıyor. Efe’nin kendi videosu var fakat ilk görüntü/poster ve detay fotoğrafı hâlâ GTA görseli.

### 2.2 Klasördeki yeni hedef: kişi sırasından ekip sırasına geçiş

`03-hakkimizda/people/README.md` artık şu sırayı istiyor:

1. Başkan.
2. Başkan Yardımcısı.
3. Sosyal Medya Ekibi — Ahmet, Melek, Emir; ekip açılış videosu, başkanla başlayan detaylar ve yanlarında bilgiler.
4. Etkinlik Ekibi — Efe, Aybey; ekip açılış videosu, başkanla başlayan detaylar ve yanlarında bilgiler.
5. Halis.

**Bu yapı henüz uygulamada yok.** Sayfa halen sekiz ayrı açılış videosu gösteriyor. Yeni yapı için yapılacak içerik işleri:

| Teslim / karar | Önerilen dosya veya içerik | Ölçü / durum |
|---|---|---|
| Sosyal medya ekibi açılışı | `03-hakkimizda/people/sosyal-medya-ekip/sosyal-medya-ekip-acilis.mp4` | 1920×1080; 1 ekip videosu eksik |
| Etkinlik ekibi açılışı | `03-hakkimizda/people/etkinlik-ekip/etkinlik-ekip-acilis.mp4` | 1920×1080; 1 ekip videosu eksik |
| Sosyal medya ekibi detayları | Ahmet, Melek, Emir’in görselleri ve yan bilgileri | Fotoğraf başına 1600×1100 önerilir |
| Etkinlik ekibi detayları | Efe, Aybey’in görselleri ve yan bilgileri | Fotoğraf başına 1600×1100 önerilir |
| Ekip içi sıralama | Sosyal medya başkanı Ahmet; etkinlik ekibinin başkanı açıkça belirtilmeli | Efe’nin mevcut görevi yalnız “Yönetim kurulu” |
| Kişi bilgileri | Yayın adı, görev, bölüm/sınıf; isteniyorsa kısa alıntı | Ahmet’in dosyası mevcut; Melek/Emir/Aybey eksik; Efe’nin önceki bilgisi kodda korunuyor |
| Melek’in görevi | Yeni ekip düzenindeki güncel görevi | Eski sayfadaki “Eski Sosyal Medya Departmanı” ile yeni ekip üyeliği uzlaştırılmalı |

**Detay görselinin adedi README’de tam net değil:** Ekip başına tek toplu fotoğraf seçilirse 2 fotoğraf; üyeler ayrı ayrı gösterilecekse 5 fotoğraf gerekir. Üye başına ayrı görsel tercihinde önerilen adlar: `ahmet-detay.webp`, `melek-detay.webp`, `emir-detay.webp`, `efe-detay.webp`, `aybey-detay.webp`; ilgili ekip klasörüne konulmalı. Toplu görsel tercihinde `sosyal-medya-ekip-detay.webp` ve `etkinlik-ekip-detay.webp` kullanılabilir. Bu yeni adlar öneridir; henüz kod eşlemesi yapılmadı.

Yeni ekip düzeninde eski Ahmet/Melek/Emir/Aybey açılış videolarını ayrı ayrı üretmek gerekmeyecek. Başkan, Başkan Yardımcısı ve Halis’in mevcut dosyaları kullanılabilir.

### 2.3 Dosya listesi ile kod arasındaki uyuşmazlıklar

- İnceleme sırasında eski `sosyal-medya-ahmet` klasörü `sosyal-medya-ekip` düzenine geçmiş; eski Efe/Aybey/Emir/Melek klasörleri kaldırılmış, `etkinlik-ekip` eklenmiş. Bu kullanıcı değişikliklerine dokunulmadı.
- Yeni ekip klasörlerinin alt README’leri hâlâ `people-03-*` / `people-07-*` gibi eski “tek kişi” dosya adlarını içeriyor. Ana People README’siyle uyumlu hale getirilmeleri gerekiyor.
- `ESLEME.csv`, `ESLEME.json` ve genel teslim listesi hâlâ eski sekiz kişilik yapıyı tarif ediyor. Ekip düzeni kesinleşince eşlemeler güncellenmeli.
- Efe’nin kaynak video klasörü artık yok, fakat `public/community/03-hakkimizda/people/efe-tutucu/efe-tutucu-acilis.mp4` duruyor ve mevcut sayfa bunu kullanıyor. Bu bir kırık video değil; kaynak/yayın klasörü uyumsuzluğu.
- Halis’in kaynak yolu `caycı-halis`, web yolu `cayci-halis`; Türkçe karakteri gideren bilinçli eşleme korunmalı.

## 3. Hakkımızda → Places / sponsorlar ve mekânlar — 3 görsel + bilgiler

| Alan | Mevcut görsel | Gerekli dosya | Ölçü | Ayrıca gerekli bilgiler |
|---|---|---|---|---|
| Etkinlik kafeleri | GTA `venue-1.avif` | `03-hakkimizda/places/places-kafeler.webp` | 2560×1440 | Gerçek kafe adı, adres/konum bağlantısı, kısa açıklama |
| Salonlar & buluşma alanları | GTA `venue-2.avif` | `03-hakkimizda/places/places-salonlar.webp` | 2560×1440 | Salon adı, kurum/kampüs, konum ve açıklama |
| Sponsorlar | GTA `venue-1.avif` tekrar kullanılıyor | `03-hakkimizda/places/places-sponsorlar.webp` | 2560×1440 | Gerçek sponsor adları, ilişki/açıklama ve varsa resmî site bağlantıları |

Coffee Talk kartında Nest’o Coffee Roastery bilgisi mevcut; Places bölümüne henüz bağlanmamış. Sponsorlara ayrı logo yerleşimi yapılacaksa ayrıca şeffaf SVG/PNG logolar toplanabilir; mevcut tasarımda zorunlu ayrı logo alanı bulunmadığından bunlar 18 dosyalık sayıya dahil değil.

## 4. Oyunlar ve UluJam 2026 derece kayıtları

Üç sonuç halen “Kısmi editoryal kayıt” olarak gösteriliyor. Mevcut veride derece ve itch.io adresi var; **doğrulanmış oyun adı, takım adı, yapımcılar, kapak ve açıklama yayımlanmamış**.

| Derece | Mevcut doğrulanmış bağlantı | Hazırlanacak kapak | Ölçü |
|---|---|---|---|
| 1 | `https://subzero-41.itch.io/lost-pieces` | `06-oyunlar/oyun-01/oyun-01-kapak.webp` | 1600×900 |
| 2 | `https://kmevciman.itch.io/lostchildsoul` | `06-oyunlar/oyun-02/oyun-02-kapak.webp` | 1600×900 |
| 3 | `https://kairosthegeek.itch.io/project-sw` | `06-oyunlar/oyun-03/oyun-03-kapak.webp` | 1600×900 |

Bu aynı kayıtlar **ana sayfa derece penceresinde, `/oyunlar` ve `/ulujam` arşivinde** görünüyor. Tek sefer tamamlanmaları yeterli. Oyun adları URL’den tahmin edilerek yayımlanmamalı; yayın adları ve credits sahiplerinden doğrulanmalı.

Tam oyun/finalist listeleri de boş. Finalist yayımlanacaksa oyun adı, takım, yapımcılar ve yayın izinleri, açıklama, itch.io bağlantısı, finalist/derece bilgisi, kapak ve görsel açıklaması gerekli. Kaç finalist olduğu mevcut yayımlı içerikten belirlenemiyor.

Teknik içerik notu: Tam oyun detay sayfası kapak gösterebiliyor; mevcut `ResultCard` ise tam kayıtta dahi metin ve detay bağlantısı gösteriyor. Dosyayı klasöre koymak kartta otomatik kapak görünmesi anlamına gelmez; sonraki yerleştirmede kayıt/medya eşlemesi yapılmalı, kartta da isteniyorsa ayrıca sunum düzenlenmeli.

## 5. Diğer eksik içerikler ve yanıltıcı metinler

| Sayfa | Gözlenen durum | Tamamlanacak iş |
|---|---|---|
| `/etkinlikler` | Coffee Talk afişi ve bilgiler görünürken “Henüz yayımlanmış etkinlik yok.” da görünüyor | Ana sayfada çözülen boş durumun bu sayfadaki karşılığı düzeltilmeli. Coffee Talk gerçek etkinlik kaydı, yıl/zaman ve konum ile eşlenmeli; başvuru gerekiyorsa mevcut form bağlantısı sağlanmalı |
| `/duyurular` | Valorant afişi var; üstünde “Henüz yayımlanmış duyuru yok.” yazıyor | Afiş gerçek duyuru kaydıyla, başlık/açıklama/tarih ve gerekiyorsa katılım bağlantısıyla tamamlanmalı; boş metin düzeltilmeli |
| `/destek` — görünen adı İletişim | “Doğrulanmış iletişim kanalları henüz yayımlanmadı.” | Dört sosyal bağlantı zaten footerda aktif. İletişim bölümünün gerçek kanallarıyla düzenlenmesi; kullanılacak e-posta/irtibat kişisi varsa verilmesi |
| `/ulujam` — 2027 | Kesin tarih ve katılım ayrıntıları yok, başvurular kapalı | Duyurulacağı zaman tarih/saat, mekân, katılım koşulları, takvim ve başvuru bilgileri; henüz kararlaştırılmadıysa “yakında” durumu kasıtlı olarak korunabilir |
| `/ulujam` — 2026 | 3 gerçek galeri fotoğrafı var | Zorunlu ek galeri dosyası yok. Mevcut genel “topluluktan kare” alt metinleri yerine fotoğrafa özel açıklamalar iyileştirme olabilir |
| Hakkımızda / People | GTA açıklamaları ve sahnelerde referans etiketleri var | Tüm ilgili medya değiştirildikten sonra geçici GTA/yer tutucu metinleri kaldırılmalı |
| Ana sayfa altı | Rockstar/GTA VI görsel kaynak açıklaması var | GTA kullanımı bittiğinde güncel kaynak durumuna göre düzenlenmeli; şu anda gerçek kullanım sürdüğü için erkenden kaldırılmamalı |

Coffee Talk kartı şu anda “7 Ekim · Çarşamba”, “18.00–20.30”, “Nest’o Coffee Roastery” içeriyor. Bunlar mevcut afişten alınmış; bu incelemede yeni tarih/yer uydurulmadı.

## 6. Hazır olanlar — yeniden hazırlamaya gerek yok

- Ana sayfa açılış kolajı: `01-anasayfa/anasayfa-hero.webp`.
- İkili UluJam ve derece panelleri: `anasayfa-ulujam-panel.webp`, `anasayfa-derece-panel.webp`.
- UluJam vlog kapağı ve kullanıcının verdiği YouTube vlog bağlantısı.
- UluJam 2026 arşivindeki 3 fotoğraf.
- Coffee Talk afişi: ana sayfa etkinlik kartında, Buluşmalar kartında ve etkinlikler sayfasında aynı dosya kullanılıyor. Ayrı `anasayfa-bulusmalar.webp` gerekmiyor.
- Valorant duyuru afişi.
- Başkan, Başkan Yardımcısı ve Halis için birer açılış videosu ve detay fotoğrafı.
- Efe’nin mevcut web kopyasındaki açılış videosu; yeni ekip videosu yerine kullanılıp kullanılmayacağı ayrı karar.
- Uludott logosu ve Instagram/WhatsApp/X/YouTube beyaz logoları + gerçek bağlantıları.

“Hazır”, dosyanın kullanıcı tarafından sağlanmış ve sitede bağlı olduğu anlamına gelir; dosyanın içindeki her görsel unsurun ayrıca özgünlük/hak incelemesi yapılmış olduğu anlamına gelmez.

## 7. Sayfa kapsamı ve sınırlar

Tarayıcıda ana sayfa, iki panelin kaynak içeriği ve derece penceresi, menünün farklı hover görselleri, Hakkımızda, UluJam, Etkinlikler, Duyurular, Oyunlar ve İletişim kontrol edildi. Yedi genel sayfa HTTP200; `/linkler` bilinçli404; `/admin` giriş ekranı mevcut.

Başvuru, makbuz, takım, kart/Wallet, yayın onayı, oyun/etkinlik/duyuru detayları ve yönetim alanlarının kaynak rotaları da tarandı. Bu alanlarda ayrıca sabit GTA medya gereksinimi tespit edilmedi; PublicShell kullanan detaylar ortak menü görsellerini miras alır. Yönetici oturumu ve gerçek kişiye ait tokenla içerik açılmadı. Bu nedenle rapor, korumalı paneldeki bütün taslak kayıtların sayısını veya özel katılımcı verilerini kapsamaz.

`public/theme/reference/people/` altında çok sayıda eski karakter fotoğrafı/klibi ve veri dizilerinde kullanılmayan seçenekler bulunuyor. Bunların her biri için yeni dosya gerekmiyor: kullanıcı arayüzü kişi başına sadece `photos[0]` ve `videos[0]` kullanıyor. Aktif alanlar değiştirilince kullanılmayan referans dosyaları ayrı bir temizlik işi olarak kaldırılabilir.

Hukuk/veri sorumlusu metinleri, Google Wallet gerçek cihaz/yayın kabulü, ertelenmiş Apple Wallet ve iOS→Geldi→Wallet QR kaldırma gibi ürün kabulleri önceki operasyon raporunda ayrıca açık. Bu görsel/içerik taraması bunları tamamlandı saymaz; sağlayıcı hesaplarına bu çalışma kapsamında yeniden bakılmadı.

## 8. Teslim sırası

1. **Yeni People yapısını kesinleştir:** ekip açılışları, üye/toplu detay görselleri, ekip başkanı ve kişi bilgileri. Eski dört kişi videosunu gereksiz yere üretme.
2. **Menü ve ana sayfa:** tablodaki 6 görsel; bütün gezintide görünen GTA izlerini temizler.
3. **Places:** 3 görsel ve gerçek kafe/salon/sponsor bilgileri.
4. **Oyunlar:** 3 kapak, ad/takım/credits/açıklama ve varsa finalist kayıtları.
5. **İçerik bütünlüğü:** Coffee Talk/Valorant kayıtları, İletişim metni, UluJam takvimi ve eski yer tutucu yazıları.

Yeni ekip yapısında kesin medya ihtiyacı: menü/ana sayfa/Places için **9 görsel**, ekipler için **2 video**. Detay fotoğrafı seçimine göre **2 veya 5 fotoğraf** daha gerekir; üç oyun kapağı bunlara eklenir. Eski 18 alanlık sayı, bugün çalışan sekiz kişilik sayfanın fotoğrafıdır; yeni ekiple aynı teslim listesi değildir.

Makineyle izlenebilir mevcut durum listesi: `ICERIK-EKSIKLERI-2026-10-04.csv`. Eski kişi yolları CSV’de yalnız mevcut sayfa eşlemesi olarak tutuldu; yeni README’ye rağmen dosya/klasör oluşturulmadı.
