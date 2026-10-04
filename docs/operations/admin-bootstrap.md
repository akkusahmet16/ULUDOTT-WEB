# İlk yönetim paneli kurulumu

Güncel panel tek özel şifre kullanır. Migration tamamlandıktan sonra `pnpm admin:panel-password` çalıştırılır. Komut iç panel hesabını oluşturur, tüm panel yetkilerini atar ve rastgele şifreyi yalnız Git tarafından yok sayılan `.local/admin-panel-password.txt` dosyasına 0600 izinle yazar. Aynı komut daha sonra şifreyi yeniler ve eski oturumları iptal eder. Ayrıntı: [yönetim paneli girişi](admin-auth.md).

Eski `pnpm admin:bootstrap` komutu kişiye özel e-posta/MFA hesapları içindir. Bu hesaplar mevcut `/admin` giriş ekranından kullanılamaz; geçmiş kayıtları korumak için komut kod tabanında kalır. Yeni ortamda panel kurulumu için kullanılmaz.
