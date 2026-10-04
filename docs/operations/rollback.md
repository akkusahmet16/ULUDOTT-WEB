# Geri dönüş

Bir önceki releaseSHA, çalışan web/worker paketi, schema uyumluluğu, runtime env ve eşlenmiş yedek dağıtımdan önce kayıtlı olmalıdır. CI başarısızsa paket/release ilerlemez. Canlı rollout henüz yapılmadı.

1. Yeni yazmaları bakım modunda durdur; web/worker kapat. HataUTC ve deployment sonrası yazı/kuyruk farkını kaydet; bu kayıtlar kaybedilecekse restore'a sessizce geçme.
2. Migration geriye uyumluysa: önceki web/worker artifact'larını birlikte seç; **DB aynı kalır**, migrationdown çalıştırılmaz. Eski paketin şema okuma/yazma uyumunu staging'de doğrula.
3. Şema eski paketle uyumsuzsa: yeni ayrıDB'ye dağıtım öncesi **eşlenmiş PG+S3** snapshot'ı [restore](backup-restore.md) et. AUTH kasası ve DB/bucket hedefini eşleştir. Snapshot sonrası yazıları uzlaştır veya kayıp miktarı için işletme kararı al; onaylı RPO yoksa veri kaybını kabul edildi sayma.
4. Önce web smoke/özel şifre girişi/özel cache, sonra kontrollü worker/sağlayıcı revision uzlaşması. Bakımdan çık; doğrulamazsa bakımda kal. EskiDB ve nesneleri kabul bitene kadar korunur. Yeni release'e dönüş de aynı uyumluluk/kanıt sürecidir.

Yerel prova ayrı UUID hedefe pg_restore ve migration idempotency; kullanıcı veritabanı inplace rollback yapılmadı. Gerçek DNS/proxy/bot birlikte çalışma ve canlı kurtarma süresi VDS kabulünde ölçülecek.
