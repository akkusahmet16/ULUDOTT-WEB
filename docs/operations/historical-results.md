# 2026 tarihî derece bağlantıları

Genel ekran `/oyunlar`. 2026 kısmi editoryal kartları dereceyi ve kullanıcının verdiği itch.io adresini gösterir. Oyun adı, takım, yapımcılar, görsel ve açıklama bilinmediği için NULL kalır; URL slug'ı veya hesap adı başlık/kişi adı olarak kullanılmaz. Kartlar “Kısmi editoryal kayıt” olarak işaretlidir. Dış bağlantılar HTTPS ve noopener/noreferrer ile yeni sekmede açılır.

Kaynak: [Mimarideki derece envanteri](../design/2026-10-01-mimari-oneri.md). 1: https://subzero-41.itch.io/lost-pieces ; 2: https://kmevciman.itch.io/lostchildsoul ; 3: https://kairosthegeek.itch.io/project-sw . Bu rehber güncel harici erişilebilirlik garantisi vermez; hedefler kullanıcı tarafından verilen adreslerdir.

## Açık seed komutu

`pnpm db:migrate` sonrasında `pnpm db:seed:2026` çalıştırın. Komut yapılandırılmış DATABASE_URL üzerinde tek transaction ve advisory lock ile bir etkinlik kabuğu, bir yıl ilişkisi, üç oyun ve üç derece ekler. Migration, web isteği veya build seed çalıştırmaz. VDS'de henüz çalıştırılmadı.

Sabit kimlikler ve unique derece/yıl kısıtları çift kayıt oluşmasını önler; tekrar ve eşzamanlı seed güvenlidir. Mevcut kimlik/yıl/URL/derece çelişkileri rollback yapar; kayıt sessizce ezilmez. Başlık gibi sonradan düzenlenen alanlar, gizlenmiş published_at veya historical_partial değişimi korunur. Harici HTTP çağrısı, medya indirmesi veya kişi/takım/kart/credit/finalist seed'i yoktur.

UluJam 2026 etkinliğinin gerçek başlangıç/bitiş/konumu bilinmediği için alanlar NULL, status draft, publish_at NULL kalır. Oyun published_at değeri seed sırasında gerçek yayın anıdır; etkinlik ayrıntısı veya yaklaşan etkinlik gibi gösterilmez. Geliştirme DB'sindeki beklenen editoryal satır toplamı 8'dir; kişisel/işlemsel tabloların boş olma kuralı sürer.

## Yayın sınırı

`listPublicHistoricalResults(year)` yalnız bilinen 2026 etkinlik kimliği/slug/kind ve oyun kimliği/derece/URL envanteriyle eşleşen, historical_partial=true ve published_at <= şimdi kayıtları döndürür. NULL/gelecek published_at veya archived etkinlik görünmez. Kişi/takım adları, medyalar ve credits bu kısmi projeksiyona taşınmaz. Sonradan doğrulanmış tam oyun alanlarını yayımlama ve yönetim paneli Görev 20'nin ayrı akışıdır.

2027 ve diğer yıllar bu okuyucudan boş liste alır. historical_partial bayrağını tek başına ayarlamak yeni yılın eksik oyun kaydını public yapmaz. Yeni tam sonuçlar ayrı başlık/takım/rıza/itch.io kontrolünden geçecek; bu görev o servisi uygulamaz.

Doğrulama: altı gerçek PostgreSQL testi sıra, NULL alanlar, idempotency/yarış, rollback, gizleme ve yeni yıl ayrımını kapsar. Playwright gerçek mobil ekran, Tab odağı, dış link rel/target ve axe kontrolünü çalıştırır; test launcher ayrı geçici DB'de aynı editoryal seed'i uygular. Testler ana DB'yi silmez veya kişisel veri üretmez.
