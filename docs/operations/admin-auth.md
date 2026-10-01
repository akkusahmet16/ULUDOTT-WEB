# Yönetici kimliği ve işletme yönergesi

Görev 3; yönetim arayüzü `/admin`. Genel kayıt endpoint'i yoktur. Her yönetici ayrı e-posta, parola, MFA ve rol/kapsam kullanır. İçerik ve etkinlik yönetim ekranları sonraki görevlerde bu kimlik altyapısını kullanacaktır.

## İlk yönetici

1. `pnpm db:migrate` ile migration'ları uygulayın. PostgreSQL ve sunucu env ayarları hazır olmalı.
2. `AUTH_ENCRYPTION_KEY` için `openssl rand -hex 32` ile 32 byte anahtar üretin; yalnızca sunucunun erişebildiği env dosyasında 0600 izinle saklayın. Repoya veya tarayıcıya koymayın. Üretimde `APP_URL` gerçek HTTPS adresi olmalıdır.
3. Güvenilir, kayda alınmayan etkileşimli terminalde `pnpm admin:bootstrap --role system_admin` çalıştırın. E-posta, en az 14 karakter parola ve tekrarını girin. Parola terminalde görünmez; argüman veya ortam değişkeninden alınmaz.
4. Terminalde gösterilen kişiye özel `otpauth` adresini güvenilir TOTP doğrulayıcısına ekleyin ve ürettiği 6 haneli kodu girin. MFA doğrulanmadan hiçbir admin kaydı yapılmaz.
5. Bir defa gösterilen 8 kurtarma kodunu çevrimdışı güvenli saklayın. Her kod tek kullanımlıktır, DB'de yalnızca SHA256 hash'i bulunur. Terminal geçmişini ve çıktısını paylaşmayın. Kurulum TOTP kodu tüketilmiştir; girişte sonraki 30 saniyelik kodu bekleyin.

Rol seçenekleri tekrarlanabilir: `--role event_manager --event <event UUID>`. Event kapsamları mevcut etkinliklerin UUID'leri olmalıdır; geçersiz FK kurulumu atomik olarak geri alır. Tek kişiye birden fazla rol atanabilir, ortak hesap kullanılmaz. Henüz gerçek yönetici oluşturulmadı; test hesabı yalnızca testlerin oluşturup kaldırdığı ayrı DB'dedir.

## İzin matrisi

| İzin | content_editor | event_manager | system_admin |
|---|---|---|---|
| content.write, links.write, media.write, games.edit | Evet | Evet | Hayır |
| applications.read/write/export, teams.read/write/approve, games.publish, cards.read, wallet.support | Hayır | Yalnız atanmış eventId | Hayır |
| admins.manage, system.read | Hayır | Hayır | Evet |

`requirePermission` bilinmeyen izni veya eksik etkinlik kapsamını reddeder. `system_admin` rolü tek başına başvuru/kişi verisini okumaz. Actor ve kapsam her oturum kontrolünde DB'den yeniden okunur. Gelecekteki endpoint'ler önce geçerli oturumu çözmeli, ardından doğru izin ve eventId ile yetki kontrolünü yapmalıdır; UI görünürlüğü erişim kontrolü yerine geçmez.

## Oturum ve korumalar

- Argon2id: 19 MiB bellek, 2 tur, paralellik 1. TOTP SHA1 / 6 hane / 30 saniye, ±1 pencere; admin satır kilidi ve son sayaç aynı kodun eşzamanlı tekrarını engeller. TOTP sırrı AES-256-GCM ile admin UUID'sine bağlı şifrelenir.
- Beş başarısız parola/MFA denemesi 15 dakika hesap kilidi oluşturur. Bilinmeyen, kilitli veya devre dışı hesap aynı genel giriş hatasını döndürür.
- PostgreSQL üzerinde tüm uygulama süreçlerinin paylaştığı 120 giriş denemesi/dakika sınırı vardır. Bu IP bazlı bir sınır değildir. Edge/CDN/WAF ve süresi dolmuş rate-limit/audit/session kayıtlarının temizliği sonraki worker/operasyon görevlerinde ele alınır; üretim trafik kapasitesi ayrıca ölçülmelidir.
- Oturum 32 byte rastgele token; DB SHA256 hash saklar. Cookie `__Host-uludott_admin`, Secure, HttpOnly, SameSite=Strict, Path=/; 30 dakika süre ve 8 saat mutlak sınır. Yenileme eski token'ı iptal eder, mutlak süre uzamaz. Otomatik aktivite uzatması yoktur; şimdilik arayüzde açık yenileme düğmesi bulunur.
- Mutasyonlar tam APP_URL Origin ve 1 saat süreli imzalı, mevcut oturuma bağlı CSRF cookie/header eşleşmesi ister. Yenileme sonrası yeni CSRF alınır. Logout oturumu iptal edip oturum/CSRF çerezlerini siler.
- API yanıtları no-store/no-referrer; yönetim sayfaları dinamik, noindex/nofollow, no-referrer ve frame DENY. JSON giriş gövdesi en fazla 4096 byte; API yanıtında parola, MFA sırrı/kurtarma kodu veya ham token verilmez. Token yalnız HttpOnly Set-Cookie içindedir.
- Login başarısı/hatası, yenileme, logout ve admin kurulumu aynı iş transaction'ı içinde audit kaydı üretir. Audit içeriğine parola, token ve MFA eklenmez.

Anahtarı kaybetmek TOTP sırlarının çözülmesini engeller. Anahtar değişimi planlı yeniden şifreleme ve oturum iptali gerektirir; anahtarı env içinde rastgele değiştirmeyin. Anahtar yedeğini DB yedeğinden ayrı güvenli saklayın. MFA/parola sıfırlama, yönetici rolü değiştirme arayüzü ve edge saldırı korumaları bu görevin kapsamı değildir.

## Yerel doğrulama

`pnpm test` PostgreSQL üzerinde rastgele ayrı test DB'leri kullanır. `pnpm test:e2e` de kendi DB'sinde sahte admin oluşturur ve sunucu kapandığında DB'yi kaldırır; ana geliştirme DB'sine seed yazmaz. Playwright graceful SIGTERM, izole Next süreç grubunun kapanıp cleanup yapmasını sağlar. Zorla SIGKILL test temizliğini engelleyebilir; beklenmeyen kapanıştan sonra yalnız doğrulanmış test DB'si temizlenmelidir.

`pnpm admin:bootstrap --help` sır üretmeden ve DB'ye yazmadan kullanım gösterir. Gerçek yönetici kurulumu Codex tarafından test çıktısına sırrı dökülerek çalıştırılmaz. VDS dağıtımı ve üretim yöneticisi kurulumu ayrı işletme adımlarıdır.
