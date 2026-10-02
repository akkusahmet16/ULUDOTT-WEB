# Coffee Talk yayın akışı

Geliştirme seed'i yalnız açık çağrıyla Coffee Talk: Tanışma Etkinliği taslağı oluşturur. Tarih, konum, afiş ve form boş kalır; ana DB otomatik seed'ine eklenmez. Tekrar çağrı editörün değişikliklerini geri almaz.

Yetkili etkinlik yöneticisi genel formu oluşturur, alanları kaydeder, açılış/kapanış, kapasite, saklama ve teşekkür metnini belirleyip yayımlar. Etkinlik editörü doğrulanmış tarih/konum/afişi girer, aynı etkinliğin formunu bağlar ve etkinliği yayımlar. Ana sayfa/etkinlik detayında Başvur yalnız açık yayımlı genel form için gösterilir. Kapalı, taslak, duraklatılmış, başka etkinliğe ait form veya bitmiş/iptal etkinlik bağlantı vermez. Form kapandığında eski adres doğru kapalı mesajını gösterir. UluJam beceri/takım/Wallet alanları genel forma eklenmez.

E2E'deki 2030 tarih, DEMO konum, sentetik afiş ve kişi yalnız geçici test DB'sindedir; gerçek etkinlik onayı değildir. Editör gerçek bilgi almadan canlı yayına çıkmamalıdır. Kayıt ve makbuz sitenin kendi genel form servisleriyle tamamlanır; Google Forms bağlantısı yoktur.
