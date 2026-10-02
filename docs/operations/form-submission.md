# Açık form gönderimi ve makbuz — Görev 12

/basvuru/[slug] yalnız yayımlı ve tarih penceresi açık formun current version tanımını sunar. Draft/archived 404; paused/closed/future/ended yalnız kapalı durumunu gösterir, alan tanımını göndermez. Yayımlı sürüm değiştiyse eski sekmenin gönderimi 409 ile yenileme ister. Ziyaretçi hesabı yoktur.

Tekrar reject için formda tek zorunlu, koşulsuz e-posta alanı gerekir. Kimlik e-posta trim/lowercase ile normalize edilir, form bazında tekrar engellenir; allow form yeniden başvuru alır. Hesap/e-posta doğrulaması henüz yoktur; bir e-postanın sahibini ispat ettiği varsayılmaz. Bu politika yanlış/başkasının e-postasını kullanan kişiyi kimlik doğrulamaz.

Gönderim bir form satırını transaction kilidiyle alır; aynı anahtar kaydı, sürüm/açıklık, sunucu doğrulaması, kapasite, tekrar, answers/rıza/history ve receipt tek atomik işlemdir. Kontenjan received/pending/approved ve süresi dolmamış satırları sayar; waitlisted kontenjan tüketmez. Dolu ve waitlist kapalıysa 409; açıksa ayrı waitlisted durumu. Aynı istek anahtarı + aynı canonical gövde 24 saatte aynı şifreli replay sonucunu döndürür. Aynı anahtar/farklı gövde 409; ilk cevap alındıktan sonra kapanan form retry'ı tekrar başvuru oluşturmaz. Süresi dolmuş ya da silinmiş resource replay'ı erişim vermez.

Receipt token 32-byte CSPRNG; DB SHA-256 hash tutar. Idempotency replay AES-256-GCM, ayrı form-replay AAD; key/request hash ve resource UUID saklanır, raw token/answers loglanmaz. Yanıtlar kendi version field FK'sinde, snapshot yalnız title/thankYou; granted rıza purpose/textVersion kaydı aynı transaction'dadır. Aynı consent purpose/version tanımda tekildir. Saklama expires_at gönderim anındaki retentionDays'e göre belirlenir; sonraki ayar eski süreyi sessizce uzatmaz.

/makbuz#token=... bağlantısı raw token'ı HTTP query/path dışında tutar. API sadece POST body; Origin-bound CSRF, no-store/no-referrer/noindex. Makbuz yalnız form başlığı, tarih, güncel durum, teşekkür gösterir; ad/e-posta/telefon/yanıt döndürmez. Bağlantıyı bilen durum görebilir; kişi bağlantıyı güvenli saklamalıdır. Tarayıcı fragment/history kendiliğinden silinmez.

Submit ve receipt ayrı global 120 istek/dakika DB rate sınırı; CSRF ve honeypot temel perimeter. Bu sınır kullanıcı/IP kimliği toplamaz ve bot korumasının tamamı değildir; CDN/Turnstile/hardening Görev 25 kapsamındadır. 128 KiB body, 100 KB answers/tanım sınırı vardır. Hata cevapları raw SQL/PII/stack içermez.

0009_submission_receipts: waitlisted CHECK, submission revision/expiry/index, idempotency resource_id. 42 tablo. E2E-only demo genel form izole DB fixture'ına kurulur; ana DB form/submission seed yok. Silme/retention/export Görev 13.

Son inceleme kabulü: alan doğrulama hataları yalnız tanımdaki UUID ve izinli sabit mesajla 400 döner; gönderilen değer/Zod ayrıntısı dönmez. Telefon E.164, seçim sayısı ve metin sınırları alan yanında açıklanır. Ekran hatayı aria-invalid/aria-describedby ile alanla eşler; geçersiz telefon düzeltilip aynı formdan başarılı başvuru test edilir.
