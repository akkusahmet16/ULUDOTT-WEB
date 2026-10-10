# Yerel yönetim, UluJam başvuru, takım ve Wallet denemesi

Tarih: 10 Ekim 2026. Durum: kullanıcı tasarımı onayladı; uygulama planı incelemesinde.

## Amaç ve sınır

Kullanıcı, mevcut yönetim işlevlerini yerelde rahatça denemek, UluJam sayfasından açılıp kapatılabilen bir başvuruya ulaşmak, içi dolu bir takım sayfası görmek ve onay sonrası web/Google Wallet kartlarını sınamak istiyor. Genel ziyaretçi hesabı eklenmeyecek. Üretim VDS'si, üretim veritabanı, canlı yönetim şifresi ve `uludott.com.tr` değişmeyecek. Yerel deneme için gerçek kişi verisi kullanılmayacak.

Bu bir görsel prototip değil: mevcut başvuru, yönetici onayı, takım oturumu, kart ve Wallet servisleri uçtan uca kullanılacak. Apple Wallet mevcut erteleme kararında kalır. Daha sonra istenen iOS QR check-in ve QR kaldırma akışı bu çalışmanın tamamlandığı iddiasına dahil değildir.

## Yaklaşım kararı

Ayrı bir **DEMO UluJam** etkinliği ve ona bağlı form yalnız yerel veritabanında oluşturulur. Gerçek UluJam 2027 kaydına tarih veya başvuru eklenmez; `/ulujam` ana mesajı “Yakında” olarak kalır. Formun açılması mevcut `published`/`paused` yönetim durumlarıyla yapılır. UI, yerel demo modu açık ve form gerçekten açık olduğunda başvuru bağlantısı gösterir; form kapandığında bağlantı kaybolur ve doğrudan API başvurusu da reddedilir.

Bu yaklaşım, 2027'yi sahte bir tarihle açmaktan ve yalnız tıklanabilir ama kayıt yapmayan mock ekranlar üretmekten daha güvenilir bir test sağlar. Demo etkinlik tarihi ve kişiler açıkça sentetik olarak etiketlenir. Yerel demo oluşturma komutu yalnız localhost kökeni ve açık demo bayrağıyla çalışır; tekrarı ikinci takım/başvuru oluşturmaz. Üretim dağıtımında demo bayrağı varsayılan kapalıdır ve demo fixture komutu çalıştırılmaz.

## Yerel giriş ve yönetim ekranları

Mevcut tek özel şifreli `/admin` giriş modeli korunur; e-posta/hesap girişi eklenmez. Yerel panel hesabının Argon2id hash'i kullanıcının belirttiği geçici sekiz haneli şifre için yenilenir ve eski yerel oturumlar iptal edilir. Şifre değeri kodda, Git'te veya üretim ortamı dosyasında tutulmaz. Mevcut CSRF, hız sınırı, oturum süresi ve audit akışları değişmez. Şifrenin zayıf olduğu giriş ekranında yalnız yerel demo etiketiyle belirtilir; üretim girişinde bu etiket görünmez.

Mevcut yönetim panelleri incelenir. Başvuru listesi, form durumu, takım onayı ve sistem/Wallet durumu işlevleri zaten bulunduğundan yeniden yazılmaz. Giriş/özet ve ilgili yönetim ekranlarında durum, sonraki işlem ve bağlantılar daha açık bir düzenle gösterilir. Renk, tipografi, kartlar ve hareket mevcut sinematik Uludott tasarım dilini kullanır; mobil ve klavye kullanımı korunur. Eksik işlev varsa yalnız bu yerel test akışı için gerekli olan eklenir.

## UluJam başvurusu ve örnek takım

`/ulujam` içinde kısa, açıkça “Yerel demo başvurusu” etiketli bir alan yer alır. Bağlantı, mevcut `/basvuru/[formSlug]` UluJam formuna gider. Etkinlik veya form duraklatılınca alan kapalı durumunu açıkça söyler; kullanıcıya çalışmayan gönderim düğmesi sunmaz. Formun telefon, beceri/seviye, takım modu, bot doğrulama ve tekrar gönderim kuralları korunur.

Yerel fixture, bir sentetik kurucu ve en az bir sentetik takım üyesiyle **DEMO Takım** oluşturur. Kurucu yeni takım başvurusu yolundan geçer; sonraki üye mevcut takıma katılma yolundan geçer. Yönetici onayı ayrıca denenebilir. Takım sayfası takım adı, etkinlik, kapasite, güvenle paylaşılabilen üye adları/durumları ve kart özetlerini anlaşılır biçimde sunar; e-posta, telefon, iç not veya başkasının özel kart bağlantısı göstermez. Takım URL'si/parolası ve bireysel makbuz/kart bağlantıları Git dışı yerel dosyada tutulur, konsol çıktısına dökülmez.

## Kart ve Google Wallet demo kabulü

Başvuru makbuzu ve bekleyen kart durumu önce görülür; yönetici onayından sonra web kartı etkinleşir. Google Wallet için mevcut `demo` sağlayıcı yapılandırması ve yalnız izinli test hesabı kullanılır. Dış sağlayıcı çağrısı ancak kullanıcı gerçek demo ekleme adımını tetiklediğinde yapılır; yerel fixture komutu kendiliğinden Google'a nesne göndermez. Demo erişimi yoksa web kartı ve yerel durum testleri tamamlanır, Google cihaz kabulü ayrıca beklemede kaydedilir. Kart QR'si, mevcut kodun sunduğu davranışla test edilir; gelecekteki iOS check-in gereksinimi uygulanmış gibi gösterilmez.

## Doğrulama ve teslim

Önce başarısız olması beklenen odaklı testler yazılır; ardından en küçük değişiklikler uygulanır. Kabul: kullanıcının belirttiği geçici şifreyle yerel giriş çalışır, canlı şifre değişmez; açık/kapalı form UI ve sunucuda aynı sonucu verir; demo takım sayfasına token/parola ile girilir; üye bilgileri sınırlandırılmıştır; onay öncesi/sonrası kart durumu doğrudur; Google demo durumu dürüstçe gösterilir. İlgili entegrasyon ve tarayıcı testleri, typecheck, lint, build ve `git diff --check` geçer. Yerel site test için açılır. GitHub push veya VDS dağıtımı yapılmaz; kullanıcı açıkça isterse sonra değerlendirilir.

Kaynak girdisi klasörlerindeki kullanıcı dosyaları ve mevcut ilgisiz çalışma ağacı değişiklikleri korunur.
