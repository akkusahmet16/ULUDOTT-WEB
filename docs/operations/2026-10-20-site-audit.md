# Site ve yönetim paneli incelemesi — 20 Ekim 2026

## Kapsam

Ana sayfa, Hakkımızda, Oyunlar, UluJam, Etkinlikler ve İletişim sayfalarının içerik kaynakları, yerel bağlantıları, görselleri ve ilgili yönetim akışları incelendi. İlk genel sayfa taramasında çıkarılan 43 yerel bağlantı/görsel yanıt verdi; kırık bölüm bağlantısı saptanmadı. Açık kullanıcı sunucusunda Hakkımızda yanıtı ayrıca kontrol edildi: HTTP 200, Çaycı 2ce bölümü ve doğru video adresi mevcut. Yönetim izinleri, kayıt sürümleri, yayın/kaldırma, form oluşturma ve klasörden dosya seçimi ayrıca denetlendi.

Kullanıcı açıklaması doğrultusunda Hakkımızda, Oyunlar, UluJam ve İletişim panelde kaldı. Duyuru paylaşımı kaldırıldı; etkinlikler kendi ekranından yönetiliyor. Bu rapor önceki yedi içerik alanı planının duyuru bölümünün yerini alır.

## Düzeltilen bulgular

| Bulgu                                                                                                   | Sonuç                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Çaycı 2ce bölümü, kişi kaydı silindiği için videosu bulunsa da bütünüyle gizleniyordu.                  | Açılış videosu olan bölüm kişi kaydından bağımsız gösteriliyor. Silinen kişi yeniden eklenmedi.                                                                                             |
| Panelin genel bakışı ve ayrı editörleri arasında tutarsız gezinme vardı.                                | Yeni giriş ekranı, ortak yönetim kabuğu, mobil menü, role göre modüller ve yeni genel bakış yapıldı.                                                                                        |
| Duyuru paylaşımı etkinlik yönetimini tekrarlıyordu.                                                     | Admin/public duyuru sayfaları, paylaşım ekranı, API yolu, menü ve ana sayfa duyuru bölümü kaldırıldı. İnceleme anında yerel veritabanında duyuru kaydı yoktu; silinecek ek kayıt bulunmadı. |
| Etkinlik oluşturma akışı ve kayıt bulma zordu.                                                          | Aranabilir durum filtreli liste; yeni bilgi/afiş/gelişmiş ayarlar adımları; kayıtlı önizleme ve açık yayın/arşiv onayları eklendi.                                                          |
| UluJam türünde yeni etkinliğin yılı panelden ilişkilendirilemiyordu.                                    | Yıl kaydetme/önizleme/yayın yanıtlarına eklendi; yıl çakışması ve tür değişimi denetlendi.                                                                                                  |
| Doğrudan açılan etkinlikte seçenekler geç yüklenince mevcut form/kategori ilişkisi boşalabiliyordu.     | Kontrollü seçimler ve listede görünmeyen mevcut kimlik için koruyucu seçenek eklendi; iki gecikmeli yükleme regresyonuyla doğrulandı.                                                       |
| Hakkımızda filtreleri kaydedilmemiş metin ve medya seçimini kaybediyordu.                               | Filtreler düzenleyiciyi silmek yerine gizliyor; yerel düzenlemeler filtreler arasında korunuyor.                                                                                            |
| Normal oturumla yeni etkinlik oluşturan etkinlik yöneticisi kendi kaydını kapsam dışında bulabiliyordu. | Var olan etkinlik yöneticisi rolü için oluşturma işlemi aynı işlem içinde kayıt kapsamını ekliyor; yeni rol verilmiyor.                                                                     |
| Eski galeri paneli ile yıllık arşiv yönetimi iki ayrı yol oluşturuyordu.                                | Menü yıllık arşiv yönetimini kullanıyor; eski galeri sayfası buraya yönleniyor.                                                                                                             |
| Yeni UluJam formu oluşturma listesinde UluJam etkinlikleri eksikti.                                     | Bütün yetkili etkinlikler listeleniyor; yeni UluJam formu takım akışını içeren gerçek şablonla atomik olarak oluşturuluyor.                                                                 |
| Form seçeneklerinin görünen adları düzenlenemiyordu.                                                    | Seçenek ekleme/silme/sıralama ve ad düzenleme sağlandı; mevcut seçenek kimlikleri ve koşul ilişkileri korunuyor.                                                                            |
| İçerik editörü UluJam ayarlarında kullanamayacağı form düzenleme bağlantılarını görebiliyordu.          | Bağlantılar gerçek form yetkisine ve etkinlik kapsamına göre sunuluyor.                                                                                                                     |
| Bağlantı eklerken kategori değiştirmek yazılan alanları sıfırlıyordu.                                   | Başlık, adres, açıklama ve tarih taslağı kategori değişiminde korunuyor.                                                                                                                    |
| Yeni medya varyant adları eski galeri ve oyun tüketicileriyle uyuşmuyordu.                              | Yayındaki gerçek WebP MIME türü esas alındı; tekrar eden varyantlardan tek ve deterministik seçim sağlandı. İzin/yayın/rıza kuralları korundu.                                              |
| Etkinlikler sayfasında sabit Coffee Talk, panel kararından bağımsız tekrar görünebiliyordu.             | Ana sayfa ile aynı kaynak kararı kullanılıyor; yönetilen kaydın yayın kararı korunuyor.                                                                                                     |
| İptal/bitmiş etkinlik etiketi ve başvuru düğmesi tutarsızdı.                                            | Doğru durum etiketi gösteriliyor; bu etkinliklerde başvuru düğmesi kaldırıldı.                                                                                                              |
| UluJam arşiv görselleri gereksiz büyük aktarılıyordu.                                                   | Duyarlı görsel optimizasyonu açıldı. Ölçülen ilk görsel aktarımı yaklaşık 2,03 MB'tan 333 KB'a indi.                                                                                        |

## İçerik tamamlanması gereken alanlar

- Çaycı 2ce klasöründe açılış videosu var, kişi fotoğrafı yok. Video görünürlüğü düzeltildi; kişi kartı istenirse uygun fotoğraf önceden klasöre konup panelden seçilmeli.
- UluJam 2027 için yayımlanmış kesin etkinlik tarihi bulunmuyor. Gerçek tarih ve başvuru açılışı panelden belirlendiğinde genel sayfaya yansır; tarih uydurulmadı.
- Sonraki kullanıcı isteğiyle “Deneme Etkinliği 1”, “Blender 3D Modelleme Eğitimi” ve “Unity eğitimi” paylaşımları temizlendi. Başlık alanı bulunan tabloların son kontrolünde “deneme” içeren kayıt kalmadı.
- Geçmiş etkinliklere otomatik geçiş için bitiş tarihi girilmeli veya durum “Bitti” yapılmalı. Yalnız başlangıç tarihi geçmiş, bitişi olmayan bir etkinlik otomatik bitmiş sayılmıyor.
- İki dış itch.io bağlantısının (LostPieces, LostChildSoul) hedefi otomatik kontrolde doğrulanamadı. Bu sonuç kırık bağlantı kanıtı değildir; diğer üç dış oyun adresi yanıt verdi.

## Dosyalar ve veri korunması

Hakkımızda, oyun kapakları ve UluJam arşivleri kullanıcının istediği gibi önceden `public/community/` altına konmuş dosyalardan seçim yapar. Medya kütüphanesine yüklemek bu klasör listesini otomatik değiştirmez. Etkinlik afişleri ise afiş yükleme akışını kullanır. Tasarım kaynak klasörünün tek başına dosyayı genel erişime açmaması beklenen davranıştır.

Yerel veriler üzerinde toplu sıfırlama, seed veya otomatik kişi geri yükleme yapılmadı. Oturum, CSRF, izin, denetim geçmişi ve sürüm çakışması denetimleri korundu. Değişiklikler çalışma alanındadır; canlı sunucuya dağıtım yapılmadı.

## Doğrulama

- Vitest: **75 dosyada 365/365 test geçti.** Kişi görünürlüğü, yayın/izin/sürüm, medya, yıllar, formlar ve taslak korunması regresyonları dahil.
- Seçilen **18 farklı tarayıcı senaryosu doğrulandı:** kişi ekleme/silme, oyun taslak/yayın/kaldırma, iki yerel adreste giriş/yenileme/çıkış, yeni etkinlik afiş/yıl/önizleme/yayın/kaldırma, Çaycı 2ce, mobil menü/duyuru 404, Hakkımızda taslağı, UluJam video ve başvurular, yıllık arşiv, iletişim/footer, anonim/CSRF reddi, genel ve UluJam form oluşturma, ana sayfada 1440/390 genişlikte yaklaşan/geçmiş ayrımı ve 5 saniyelik kaydırma.
- İlk geniş tarayıcı koşusunda 17/18 geçti; arşiv testi eski ham görsel adresini bekliyordu. Test optimize edilmiş adresin doğru kaynağı kullandığını ve görselin gerçekten yüklendiğini doğrulayacak şekilde güncellendi. Arşiv ve genişletilmiş yeni panel kontrolü tekrar **2/2 geçti**.
- Yeni genel bakış ve etkinlik editörü masaüstü/mobil ekran görüntüleri incelendi. Mobil yatay taşma ve WCAG A/AA taraması geçti.
- ESLint, TypeScript, üretim derlemesi ve `src/tests/docs` whitespace denetimi geçti. Üretim derlemesinde önceden mevcut Wallet dosya izleme uyarısı sürüyor; derleme başarılı.
- Bağımsız son kod incelemesinde bulunan iki veri kaybı riski düzeltildi ve regresyonlarla doğrulandı.
- Kullanıcı geliştirme sunucusu açık bırakıldı. Testlerin eklediği `.next/e2e` ve `.next/verification` TypeScript yolları temizlendi.

Kontrol kayıtları: `.superpowers/admin-rebuild-tests-final.log`, `admin-rebuild-browser-final.log`, `admin-rebuild-browser-followup.log`, `admin-rebuild-build-final.log`, `admin-rebuild-lint-final.log`, `admin-rebuild-types-final.log`. Yeni panel görselleri `.local/admin-rebuild/` altındadır.

## Sonraki içerik düzenlemesi

Etkinlikler sayfası yaklaşan ve geçmiş olarak ayrıldı; Coffee Talk afişi geçmiş bölümünde korundu. İstenen üç etkinlik ve öne çıkarma/yönetim kapsamı bağlantıları, bağlı başvuru veya oyunları olmadığı doğrulandıktan sonra silindi. UluJam 2026/2027 etkinlik altyapısı ve arşiv oyunları korundu. Temizlenen kayıtların yerel yedeği `.local/content-cleanup-2026-10-20T18-49-21.376Z.json` dosyasındadır; silme işlemleri denetim geçmişine yazıldı.

Sosyal Medya açılış videosu `videoVisible` seçeneğiyle gizlendi. Bölüm başlığı ve kişiler görünmeye devam eder; video adresi ve dosyası korunur. Panelden yeniden açılabilir. Açık kullanıcı sunucusunda hem 1280 hem 390 genişlikte Coffee Talk'un geçmişte bulunduğu, silinen paylaşımların görünmediği ve Sosyal Medya bölümünde video olmadığı doğrulandı.

Bu düzenlemenin son doğrulaması: 75 dosyada 367/367 otomatik test, 4/4 tarayıcı testi, ESLint, TypeScript ve üretim derlemesi başarılı. Kontrol kayıtları `.superpowers/event-sections-*` dosyalarındadır.
