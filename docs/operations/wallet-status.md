# Ortak Wallet hakkı ve sağlayıcı durumu

Hesap açılmaz; bireysel kartın43karakter bağlantısı bearer erişimidir. Takım oturumu/token'ı veya participantId tek başına Wallet yetkisi değildir. Sahip bağlantısının ele geçirilmesi aynı sahibin hakkını kullanmayı mümkün kılar; bunu kimlik doğrulaması olarak sunmayın.

Her istek, aktif kadro/bireysel onay, geç üyelik, ret/çekilme, etkinlik iptal/arşiv ve saklama süresini DB'den yeniden denetler. `POST /api/wallet/status` CSRF ve2048byte JSON sınırıyla `{cardToken,provider,action:"status"|"request"}` alır. Başka participantId seçmek mümkün değildir. Yanıt no-store/no-referrer/noindex; telefon/e-posta/token veya anahtar dönmez.

Tek application/card ve card/provider pass unique kısıtları korunur. DB `ready` UI `active`; `pending/failed/revoked` açık ayrı durumlardır. `revision` güncel hedef, `synced_revision` gerçekten uygulanmış sürüm, `provider_state` son doğrulanmış dış durumdur. Eksik sağlayıcı kimliğiyle uygun kişinin tek pending kaydı olabilir; dış nesne ve imzalı bağlantı oluşmaz. Onaysız kişide pass kaydı oluşmaz.

`card.changed` ve `wallet.requested` güncel hakları işleyen worker'a gider. Eski iş güncel sürümü okur. Worker20kart/batch cursor sweep ile yeni iş üretmeyen saklama/etkinlik kapanışlarını da denetler. Hak iptalinde yerel erişim anında kapanır; sağlayıcı/cihaz güncellemesi worker ve dış hizmete bağlı gecikebilir. Worker/Google süreçlerinin ayrı timeout/lease/retry davranışı outbox belgesindedir.

Google kimlik/demo/yayın statüsü sağlayıcı protokolü ve gerçek hesabın ayrı kabulüdür; Apple sertifika+cihaz işi24 kapsamındadır. Hazır olmayan sağlayıcı kullanıcıya hazır gösterilmez.

Kanıt: wallet-eligibility gerçek PostgreSQL testleri ve production TLS wallet-gate Playwright/axe. Ana üretim DB'sine sahte kişi eklenmez.
