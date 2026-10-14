# PostgreSQL yedekleme ve geri yükleme provası

14 Ekim 2026. **Hazırlık belgesidir; betik, yedek hedefi erişimi ve restore provası çalıştırılmadı.** TODO: sağlayıcı onayı bekliyor. Hedef, şifreleme, erişim yetkilileri, saklama süresi, RPO/RTO ve zamanlama kararı kullanıcı tarafından onaylanmalıdır. Aynı VDS'de tek kopya host kaybını karşılamaz; hedefin ayrı arıza alanında olduğu sağlayıcı onayında doğrulanır.

`infrastructure/backup/pg-backup.sh` tek veritabanını custom formatta `pg_dump -Fc` ile alır. UTC tarih/random son ek, SHA256 yan dosyası, özel dosya izinleri, hedef başına kilit ve başarılı yeni yedekten sonra saklama süresi temizliği vardır. `pg_restore --list` yalnızca arşivin okunabildiğini kontrol eder; geri yüklenebilirliğin kanıtı aşağıdaki provadır. Kaynak: [PostgreSQL 17 pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html).

## Onay sonrası işletme girdileri

- `BACKUP_TARGET`: önceden hazırlanmış mutlak dizin. Sağlayıcı/mount varsayılmaz. POSIX kilit/atomik rename ve erişim izinleri hedef üzerinde doğrulanır; doğrudan S3 URL'si bu betiğin girdisi değildir. Sağlayıcıya aktarım/şifreleme entegrasyonu onay sonrası ayrı iştir.
- `BACKUP_RETENTION_DAYS`: 1–9999 gün; varsayılan yok. **Öneri: 14 günlük günlük yedek**, kapasite ve hukuk/saklama politikası onayı bekler. `find -mtime +N` tam 24 saat dilimlerini yuvarlar, temizleme N günden biraz daha uzun saklayabilir. Eşleşmeyen/yarım arşiv ve SHA'sız dosyalar otomatik silinmez; alarm sonrası operatör inceler.
- `PGSERVICE` (tercihen) veya açık `PGDATABASE` ve gerekli `PGHOST`/`PGPORT`/`PGUSER`: yalnız bu uygulamanın DB'si. URI/parola komut satırına yazılmaz. `.pgpass`/`PGPASSFILE` ve service dosyası yalnız servis kullanıcısınca okunur. `--no-password` eksik kimlik bilgisinde beklemek yerine hata verir.
- Linux'ta mevcut Bash, PostgreSQL istemci araçları, GNU coreutils/find ve flock gerekir; proje bağımlılığı eklenmez. İstemci major sürümü kaynak sunucudan eski olmamalı; prova hedefi uyumlu major sürümde olmalı. Dump uyarıları ve exit kodu izlenir; başarılı SHA eşitliği veri doğruluğunu veya şifrelemeyi kanıtlamaz.

Onay sonrası operatör uygun ortam değişkenlerini güvenli servis ortamında tanımlayıp `bash infrastructure/backup/pg-backup.sh` çalıştırır. Bu faz zamanlayıcı oluşturmaz. Dump tüm normal şemaları ve migration tablosunu içerir; küme rolleri/tablespace/global konfigürasyon için ayrı envanter gerekir. Medya nesneleri DB dump'ında bulunmaz; medya depolama yedeği ve DB ile tutarlı geri yükleme noktası sağlayıcı kararıyla planlanır.

## İzole geri yükleme provası

1. Kaynak yedeğin tarihi, boyutu, SHA dosyası, PostgreSQL/client sürümleri ve uygulama commit'ini kayıt altına alın. Canlı DB veya bot DB'si hedef olamaz. Ağ erişimi sınırlandırılmış ayrı test PostgreSQL'i ve kaynak veriye uygun erişim yetkilerini hazırlayın. Gerçek kişisel veri içeriyorsa prova çıktısında yalnız sayım/şema kanıtı tutun.
2. Arşiv ve eşleşen `.dump.sha256` dosyasını izole prova makinesine onaylı yolla alın. Aşağıdaki değişkenlerdeki örnekleri operatör değiştirir; bunlar çalıştırılmış komutlar değildir:

   ```bash
   export RESTORE_DIRECTORY=/onayli/izole/prova
   export RESTORE_ARCHIVE=uludott-pg_ONAYLI_DOSYA.dump
   cd -- "$RESTORE_DIRECTORY"
   sha256sum --check -- "$RESTORE_ARCHIVE.sha256"
   pg_restore --list "$RESTORE_ARCHIVE" > restore-toc.txt
   ```

3. `PGSERVICE=uludott_restore_test` gibi **önceden doğrulanmış izole sunucuyu** seçen bağlantı kaydını ve ayrı `.pgpass` hazırlayın. `psql -X --no-password -d postgres -c 'SELECT inet_server_addr(), inet_server_port(), current_user;'` ile hedef sunucuyu operatör kontrol etsin. Güvenlik duvarı canlı hedefe erişimi engellesin. Sonra yeni ve boş DB oluşturun; `--create`, `--clean` veya mevcut DB'ye restore kullanmayın:

   ```bash
   export PGSERVICE=uludott_restore_test
   export PGDATABASE=uludott_restore_20261014
   case "$PGDATABASE" in uludott_restore_*) ;; *) exit 1 ;; esac
   createdb --no-password --template=template0 "$PGDATABASE"
   pg_restore --no-password --exit-on-error --single-transaction \
     --no-owner --no-privileges --dbname="$PGDATABASE" "$RESTORE_ARCHIVE"
   ```

   `--single-transaction` hata durumunda yarım restore bırakmaz; paralel restore kullanılmaz. Prova nesneleri restore kullanıcısına ait olur; üretim owner/grant/rolleri ayrıca envantere göre kurulmalıdır. Kaynak: [PostgreSQL 17 pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).

4. Aşağıdaki salt okunur sorguları `psql -X --no-password --set=ON_ERROR_STOP=1` ile çalıştırıp yedek zamanına ait kaynak envanteriyle karşılaştırın. **42 public tablo** yalnız Faz 0 şemasının referansıdır; gelecekte migration ile değişebilir. Boş üretim başlangıcında kişi/başvuru/takım/kart sayısının sıfır olması beklenir; gerçek yedekte sayılar kaynağa eşit olmalıdır.

   ```sql
   SELECT current_database(), version();
   SELECT pg_size_pretty(pg_database_size(current_database()));
   SELECT count(*) AS public_tables FROM pg_tables WHERE schemaname = 'public';
   SELECT count(*) AS migrations, max(created_at) AS latest
     FROM drizzle.__drizzle_migrations;
   SELECT 'admins' AS entity, count(*) FROM admins
   UNION ALL SELECT 'events', count(*) FROM events
   UNION ALL SELECT 'announcements', count(*) FROM announcements
   UNION ALL SELECT 'media_assets', count(*) FROM media_assets
   UNION ALL SELECT 'media_variants', count(*) FROM media_variants
   UNION ALL SELECT 'applications', count(*) FROM applications
   UNION ALL SELECT 'teams', count(*) FROM teams
   UNION ALL SELECT 'cards', count(*) FROM cards;
   SELECT n.nspname, c.relname, i.indisvalid, i.indisready
     FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname IN ('public', 'drizzle') AND (NOT i.indisvalid OR NOT i.indisready);
   SELECT conrelid::regclass, conname, contype FROM pg_constraint
     WHERE connamespace = 'public'::regnamespace AND NOT convalidated;
   SELECT count(*) AS orphan_variants FROM media_variants v
     LEFT JOIN media_assets a ON a.id = v.asset_id WHERE a.id IS NULL;
   ```

5. Her iki indeks/constraint hata listesi ve orphan sayısı sıfır olmalı. Tablo/migration sayıları, temel kayıt sayımları ve uygulama sürümü kaynak envanterine eşleşmeli. Aynı arşivle tutarlı medya kopyasında örnek orijinal/türev checksum ve özel/yayımlanmış erişim sınırlarını ayrıca doğrulayın. Test ortamının dış e-posta/mesaj/worker çıkışlarını kapatın; sır anahtarlarını güvenli geri kazanma envanterinden sağlayın. Genel sayfalar, admin oturumu ve medya okumasını yalnız bu izole ortamda smoke test edin.
6. Restore süresi, yedeğin yaşı, sonuçlar ve sapmalar prova raporuna yazılır. **Öneri:** günlük yedek için RPO ≤24 saat, RTO ≤2 saat; ölçülmedi/onaylanmadı. Başarısız prova, checksum veya eksik medya canlı kabulü engeller. Temizlikte yalnız operatörün doğruladığı `uludott_restore_*` DB ve özel prova dizini silinir; burada otomatik silme komutu verilmez.

Bu fazın kanıtı yalnız `bash -n infrastructure/backup/pg-backup.sh` sözdizimi kontrolüdür; dump, saklama süresi silmesi, yedek aktarımı ve restore **doğrulanmadı**.
