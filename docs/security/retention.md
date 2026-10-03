# Saklama ve silme işletimi — Görev 27

## Çalışan mekanizma

Başvuru expires_at değeri kayıt anında formun retentionDays ayarından hesaplanır; sonradan form süresini değiştirmek eski kayıtları sessizce uzatmaz. Bu teknik ayar hukuki saklama kararı değildir. Canlı form açılmadan amaç, süre ve yasal istisnalar sorumlu işletme/hukuk tarafından onaylanmalıdır.

Ayrı worker başlangıçta ve 15 dakikada bir deleteOrAnonymizeExpired(new Date()) çalıştırır. En fazla 25 başvuru bir transaction içinde işlenir; dolu batch bir dakika sonra tekrar edilir. Advisory lock eşzamanlı temizliği engeller; SQL timeout 10 saniyedir. Hata transaction'ı geri alır, worker başarısız kapanır; hizmet yöneticisi yeniden başlatmalı ve WORKER_UNAVAILABLE alarmını izlemelidir.

Yanıtlar, rıza, durum geçmişi, makbuz replay ve başvuru silinir. Bağlı katılımcının iletişim/beceri/not/token alanları temizlenir ve placeholder ile işaretlenir (erased_at). Üyelikleri kaldırılır; boş takım erişimi kapanır. Oyun künyesindeki adı ve rızası temizlenir, ilgili oyun yayından alınır. Kart revoked olur, erişim hashleri değiştirilir, QR şifresi silinir. Aktif üyelik silindiyse kalan üyelerin kartları yeniden değerlendirilir; dolu takımın onay/red durumu korunur. Sadece tarihî üyelik silmek canlı kadroyu veya kart sürümünü değiştirmez. Yayından kaldırılan oyunun takım kartları ayrıca güncellenir.

## Harici sağlayıcı ve geriye kalan kayıtlar

Google kartı kişisel alanları ve QR temizleyen INACTIVE PATCH ile güncellenir; sağlayıcı kabul etmeden yerel provider_state revoked sayılmaz. Protokol testi sahte sağlayıcı ile yapılır. Gerçek Google nesnesinde alan temizliği ve cihaz önbelleği davranışı canlı kabulde ayrıca doğrulanmalıdır. Apple uygulaması kullanıcı kararıyla ertelenmiştir; Apple cihazından silinme kanıtı yoktur. Yöntem kaynağı: https://developers.google.com/wallet/reference/rest/v1/genericobject/patch.

Başvuru placeholder UUID'si, iptal kartı, Wallet sağlayıcı nesne ID'si ve kuyruk kanıtı henüz ikinci aşama GC ile silinmez. Bunlar sınırlı teknik iptal kayıtlarıdır; tam anonimleştirme veya tüm sağlayıcılardan silinme iddiası verilmez. pendingRevocations işleme anındaki sayıdır, toplam kuyruk alarmı değildir. Sağlayıcı hatası/dead outbox ve reconcile sonucu işletim tarafından izlenir.

Yedekler mevcut yedek rotasyonuyla sona erer; geri yüklemeden sonra site/worker ziyaretçiye açılmadan expiry temizliği ve iptal kuyruğu tekrar çalıştırılır. Kişisel dosyalar veya loglara yanlışlıkla taşınan veriler için [olay müdahalesi](incident-response.md) uygulanır. Hukuki saklama istisnası/hold mekanizması bu serviste yoktur; böyle bir gereksinim varsa canlı kabulden önce kararlaştırılmalıdır.

## İşletim kanıtı

retention_runs yalnızca tarih, silinen başvuru, temizlenen katılımcı ve bekleyen iptal sayısı tutar; 30 gün sonra silinir. İnsan yönetici kimliği taklit edilmez, kişi adları/yanıtları/sırlar operasyon kaydına yazılmaz. Migration 0020–0021 worker başlatılmadan uygulanmalıdır. Gerçek kişi yerine izole PostgreSQL testleri kullanılır.
