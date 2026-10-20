# Yönetim panelinin yeniden kurulması ve site incelemesi

Kullanıcı: Çaycı 2ce panelde eklenmiş olmasına rağmen Hakkımızda'da görünmüyor; tüm site incelensin, panel yeniden kurulsun, sonradan eklenen duyurular ve duyuru paylaşma ekranı kaldırılsın. Kullanıcı ayrıca Hakkımızda, Oyunlar, UluJam ve İletişim yönetimlerinin kalacağını doğruladı. Etkinlik yayını tek içerik paylaşma akışıdır.

## Tasarım

Siteyle aynı lacivert/krem/pembe görsel dilinde yeni ortak çalışma alanı: masaüstünde sabit menü, mobilde açılan menü, sayfa bağlamı ve siteye dönüş; ana ekranda görev odaklı modül kartları ve gerçek etkinlik/katılım özeti. Ana modüller Etkinlikler, Hakkımızda, Oyunlar, UluJam, İletişim ve Medya. Form, başvuru, takım ve sistem araçları rollerle sınırlı kalır. UluJam arşiv ve galeri yönetimi aynı alana yönlendirilir.

Etkinlik ekranı baştan düzenlenir: aranabilir/filtrelenebilir kayıt listesi, başlık/tarih/konum/açıklama, afiş yükleme ve önizleme, yayın özeti. Mevcut API, sürüm/izin/CSRF ve yayın kuralları korunur. Etkinliğe atanmış yönetici düzenleme yapabilir; yeni etkinlik oluşturma yalnız global içerik editörüne sunulur. UluJam yılı etkinlikle eşleştirilir ve geri sayım aynı kayıttan beslenir.

Hakkımızda: kişi ve bölüm düzenlemesi ayrılır, kaydedilen içeriğin site bağlantısı gösterilir. Üyesi silinen ama açılış videosu bulunan bölüm sitede kalır. Silinmiş kişi otomatik geri yüklenmez. Kişi/oyun/arşiv görselleri kullanıcının istediği gibi önceden yüklenmiş klasörlerden seçilmeye devam eder.

Duyurular: ana sayfa, genel menü, liste/detay, admin ekranı ve API paylaşım yüzeyleri kaldırılır. Mevcut veritabanında duyuru kaydı yoktur; etkinlikler ve diğer içerikler silinmez. Eski servis/audit geçmişi için tabloyu düşürmek gerekmez.

İnceleme: gerçek kod hataları düzeltilecek; eksik etkinlik tarihleri veya kullanılmayan dış servisler gibi içerik/yapılandırma eksikleri raporda ayrı belirtilecek. Kullanıcıya ait çalışma değişiklikleri, açık yerel sunucu ve gerçek veriler korunur. Dağıtım veya toplu commit yapılmaz.

## Kabul

Çaycı 2ce videosu üyeler boşken bile genel sayfada görünür; kişi silme korunur. Duyuru adresleri/API 404 ve menülerde duyuru bağlantısı yoktur. Yeni panel mobil/masaüstünde taşmaz ve modüller çalışır. Etkinlik oluşturma, afiş, önizleme, yayın/kaldırma gerçek API ile çalışır; yetki ve sürüm çatışmaları korunur. UluJam formu oluşturulabilir, seçeneklerin görünen adları düzenlenirken kimlikleri korunur. Yeni yüklenen WebP görseller eski galeri/oyun araçlarında da seçilebilir. Site inceleme raporu kanıt ve kalan veri gereksinimlerini içerir.
