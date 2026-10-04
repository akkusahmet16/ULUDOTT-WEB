# Yönetim paneli girişi

Güncel `/admin` ekranı yalnız **Özel şifre** ister. E-posta, MFA veya kurtarma kodu giriş formunda kullanılmaz. Genel kayıt endpoint'i yoktur. Tek iç panel hesabı tüm içerik, etkinlik ve sistem işlemleri için kullanılır; yeni etkinlikler kapsamına otomatik girer. Eski admin kayıtları ve geçmiş audit verileri silinmez, fakat genel giriş API'si eski üç alanlı biçimi reddeder.

## İlk kurulum ve şifre değiştirme

1. PostgreSQL ve `.env.local` hazırken migration'ları uygulayın: `pnpm db:migrate`.
2. `pnpm admin:panel-password` çalıştırın. Komut 32 karakterlik rastgele özel şifre üretir, iç panel hesabını oluşturur veya günceller ve önceki oturumları iptal eder.
3. Şifre yalnız `.local/admin-panel-password.txt` dosyasına 0600 izinle yazılır. Dosya Git tarafından yok sayılır. Şifreyi görmek için dosyayı bu makinede açın; sohbet, komut argümanı veya kaynak koda kopyalamayın.
4. `/admin` ekranındaki **Özel şifre** alanına bu değeri girin. Şifre kaybolur veya paylaşılırsa komutu tekrar çalıştırıp yeni şifre kullanın.

VDS'ye taşırken yerel şifreyi taşımayın; sunucuda ayrı şifre üretin ve yalnız yetkili kişilere güvenli kanaldan verin. Tek şifreyi bilen herkes tam panel yetkisi alır. İşlem kayıtları ortak panel hesabına yazılır, hangi ekip üyesinin işlemi yaptığı ayrıca ayrıştırılamaz.

## Korunan güvenlik davranışları

- Şifre veritabanında Argon2id hash olarak saklanır. Düz metin API yanıtı, audit veya veritabanına yazılmaz.
- Beş yanlış şifre denemesi hesabı 15 dakika kilitler. Paylaşılan PostgreSQL giriş sayacı dakikada 120 denemeyle sınırlıdır.
- Oturum tokenı 32 rastgele byte'tır; veritabanında yalnız hash'i bulunur. Cookie `__Host-uludott_admin`, HttpOnly, Secure ve SameSite=Strict'tir. Süre 30 dakika, mutlak sınır 8 saattir.
- Yazma işlemleri geçerli oturum ve CSRF doğrulaması ister. Çıkış oturumu iptal eder. Şifre değiştirmek tüm eski oturumları iptal eder.
- Yönetim sayfaları arama motorlarına kapalıdır; API yanıtları `no-store` ve `no-referrer` başlıkları taşır.

Bu model önceki kişiye özel e-posta/MFA modelinden daha az kimlik güvencesi sağlar. Geçmiş MFA kodu hâlâ eski kayıtlarla ilgili tarihsel testlerde bulunur; güncel panel girişini açmaz.
