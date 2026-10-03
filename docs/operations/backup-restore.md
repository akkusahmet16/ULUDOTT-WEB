# Eşlenmiş yedek ve geri yükleme

PostgreSQL tek başına yeterli değildir: DB referans verdiği özel medya orijinalleri/türevleriyle aynı durma noktasına eşlenir. AUTH_ENCRYPTION_KEY ve sağlayıcı erişim kurtarma bilgisi ayrı erişim kontrollü kasada; image/rapor/manifest içine yazılmaz. Canlı hedef RPO/RTO, saklama, veri bölgesi ve aylık maliyet henüz onaylanmadı. VDS40 GB'de kalıcı yedek arşivi tutulmaz. Geçici snapshot için boş disk kontrolü yapılır; hedef şifreli/offhost ve restore erişimi ayrı doğrulanır.

## Snapshot

1. Reverse proxy bakım moduyla yeni form/admin/medya mutasyonlarını kapat. Web ve worker'ı durdur; kuyruk lease'lerini/durumunu kaydet. S3'ye başka yazıcı olmadığını doğrula.
2. Güvenli0700 geçici dizin/umask077. `PGSERVICE` ve `.pgpass`/servicefile0600, URL parolası commandline/logda olmaz. `pg_dump` sunucu17 ile uyumlu.
3. Custom PGdump ve S3 bucket'ın **tüm orijinal/türev** nesnelerini aynı dondurulmuş noktadan çek. S3 versioning varsa versionID; yoksa tam byte checksum envanteri. DB'nin referanslarını manifestle eşleştir. ReleaseSHA, migration journal, snapshotUTC, row/object count, SHA256 ve dosya boyutlarını manifestle; kişisel veri/anahtar yazma.

Örnek komutlar yalnız yetkili sunucuda, aşağıdaki değişkenler güvenli ortamdan doldurulduktan sonra:

```sh
umask 077
# RUN benzersiz0700 çalışma dizini; PGSERVICE yetkili canlı okuma servisi.
pg_dump --format=custom --no-owner --file="$RUN/database.dump"
aws --endpoint-url "$OBJECT_STORAGE_ENDPOINT" s3 sync "s3://$OBJECT_STORAGE_BUCKET/" "$RUN/objects/"
(cd "$RUN" && find objects -type f -print0 | sort -z | xargs -0 sha256sum > objects.sha256)
(cd "$RUN" && sha256sum database.dump > database.sha256)
```

AWS CLI credentials güvenli profile/env'den; anahtarı argümana yazma. DB/keyreferans envanteri ayrıca kontrol edilir; private/orphan nesneleri retention kararına göre ele alınır. Arşivi onaylı alıcının anahtarıyla şifrele, offhost özel yedeğe aktar, tekrar indirip decrypt+checksum doğrula; başarılı aktarım/restore doğrulanmadan ham snapshot'ı silme. Sonra süreçleri aç. Sağlayıcı/anahtar/şifreleme aracı henüz seçilmediği için hazır canlı backup servisi iddiası yok.

## Restore

1. Bakım modunu koru; worker kapalı. Release/schema uyumunu ve anahtar kasası erişimini doğrula. Boş, ayrı hedefDB/bucket veya bakım halinde aynı medyanın güvenli restore planı hazırlanır; canlıDB'yi drop/clean etme.
2. İndirilmiş şifreli arşivi0700 dizinde decrypt; checksum hatasında devam etme. `sha256sum -c database.sha256` ve `sha256sum -c objects.sha256` (arşiv kökünde). Referans eksikse açılışı engelle.
3. `PGSERVICE` **boş hedefDB** servisidir; `pg_restore --no-owner --exit-on-error --dbname="service=$PGSERVICE" database.dump`. `--clean` canlıDB'de kullanılmaz. Nesneleri aynı key yapısıyla hedefbucket'a yükle; referans/key/byte hash eşleştir.
4. Tüm public tablo sayıları+satır hashleri, FK, migration journal, üç2026 URL ve kişisel saklama/iptal durumunu kontrol et. Aynı AUTH anahtarı ile şifreli capability/MFA decrypt kanıtı yap. Eksik/yanlış anahtarla siteyi açma; key rotate restore çözümü değildir.
5. Önce web smoke, sonra kontrollü worker; lease/retry/revision ve sağlayıcı tarafındaki gerçek son durumu uzlaştır. Restore eski revision'ı Google'a kontrolsüz göndermez; sağlayıcı uzlaştırması yapılmadan halka yeniden açma. Başarı/kayıp/RTO ve rollback kararı kaydedilir.

## Yerel gerçek tatbikat

`pnpm exec vitest run tests/operations/backup-restore.test.ts`. Sentetik UUIDDB/keys haricinde silme yapılmaz. pg_dump→pg_restore boş hedef; tüm public tabloların deterministik satır hash/count karşılaştırması; iki gerçek S3 nesnesini yedekle→sentetik orijinali sil→restore→byte hash eşitliği. Tekrar migration ve editoryal seed. Geçici kişisel dump0600/0700 silinir; sayısal özet `.local/task29-drill.json` Git dışında. Ölçümler aşağıdaki kanıt bölümündedir; canlı RPO/RTO garantisi değildir.

### 3 Ekim yerel kanıt

43 tablonun tamamı geri yükleme öncesi ve sonrası eşleşti. Temiz kurulumda kişisel kayıt 0, editoryal oyun 3. Yedek örneği bir sentetik başvuru ve iki medya nesnesi içerdi. Dump 126.632 byte; kurulum ve snapshot 1,586 saniye, geri yükleme ve doğrulama 0,530 saniye sürdü. Snapshot noktasına göre veri kaybı 0. Bunlar yerel tatbikat ölçümleridir; canlı RPO/RTO hedefi olarak onaylanmadı. İlk tatbikat kanıtı `.local/task29-drill-green.log`: 1/1 geçti; son tam CI zinciri tatbikatı ayrıca tekrarladı.
