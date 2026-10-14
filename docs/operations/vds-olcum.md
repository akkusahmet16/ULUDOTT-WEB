# VDS yük altında ölçüm ve önerilen kabul eşikleri

14 Ekim 2026. Hedef beyanı: **4 GB RAM, 2 vCPU**, mevcut bot ile paylaşımlı VDS. Bu belge ölçüm planıdır; sunucuya bağlanılmadı, yük testi/kurulum/ayar değişikliği yapılmadı. Önceki kapasite bağlamı [vds-assessment.md](./vds-assessment.md) içindedir. Aşağıdaki başlangıç ölçüm eşikleri **14 Ekim 2026'da kullanıcı tarafından onaylandı**. Ölçüm olmadan canlı kapasite kabulü veya kullanıcı/saniye garantisi verilmez.

## Ölçüm protokolü

Operatör servis adlarını, PostgreSQL bağlantı kaydını ve yük senaryosunu doğrulasın. Bot normal iş yüküyle birlikte çalışsın. Aynı sürümde 10 dk boşta referans, 15 dk beklenen yoğunluk, 5 dk kısa tepe ve 10 dk toparlanma ölçülsün. Soğuk/sıcak veri önbelleği, 30 sn yenileme, yayınlama/yayından kaldırma ve bilinen medya boyutları kapsansın. Eşzamanlılık ve hedef istek sayısı gerçek trafik beklentisi/onayıyla seçilir; burada uydurulmaz. Bildirim/ücretli dış servisler yük senaryosundan çıkarılır. 5xx/OOM/swap baskısında operatör testi durdurur.

Mevcut araçlar yoksa sysstat vb. kurulumunu operatör ayrıca değerlendirir; bu faz yeni bağımlılık kurmaz. Komutlar ayrı terminallerde, yalnız onaylı hedef üzerinde çalıştırılır:

```sh
date -Is
uname -a
nproc
free -m
df -h
df -i
vmstat 1
pidstat -u -r -d -p ALL 1
systemd-cgtop --delay=1
```

`free` için kullanılan toplam yerine **available** ve swap değişimini izleyin. `vmstat` ilk satırı açılıştan beri ortalamadır; sonraki satırlarda `si/so`, `r`, `wa`, `id`, `st` takip edilir. `pidstat` web, bot, PostgreSQL ve worker'ı ayırır; `%CPU` tek çekirdek/toplam normalizasyonunu kaydedin. `systemd-cgtop` ile servis cgroup'larını karşılaştırın; accounting kapalıysa boş değerleri sıfır kabul etmeyin. `df` hem DB/WAL/log/runtime hem onaylı geçici yedek alanını ve inode'ları kapsasın.

Operatör gerçek unit adlarını yerleştirsin; `systemctl show` yalnız okur:

```sh
systemctl show WEB_UNIT BOT_UNIT POSTGRES_UNIT WORKER_UNIT \
  -p MemoryCurrent -p MemoryPeak -p MemoryMax -p CPUUsageNSec -p TasksCurrent
journalctl --since '-1 hour' --no-pager -k
```

Kernel logunda OOM/kill ve disk/I/O hataları aranır; loglar kişisel veri veya sır içeriyorsa paylaşmadan önce ayıklanır. `MemoryPeak` eski systemd sürümünde yoksa `MemoryCurrent` zaman serisinin tepesini kullanın. Medya depolama veya bot alanında temizlik/taşıma yapılmaz.

## PostgreSQL salt okunur kontroller

Uygulamaya ait güvenli `PGSERVICE`/`.pgpass` ile `psql -X --no-password --set=ON_ERROR_STOP=1` kullanın; parola/URI komut satırına yazılmaz. Bütün DB'lerin bağlantıları toplam sınıra dahildir; bot DB'si veya ayarları değiştirilmez.

```sql
SHOW server_version;
SHOW max_connections;
SHOW superuser_reserved_connections;
SHOW reserved_connections;
SHOW shared_buffers;
SHOW work_mem;
SHOW maintenance_work_mem;
SELECT datname, application_name, state, count(*) AS connections
  FROM pg_stat_activity
  GROUP BY datname, application_name, state ORDER BY connections DESC;
SELECT count(*) FILTER (WHERE state = 'active') AS active,
       count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx,
       count(*) AS total FROM pg_stat_activity;
SELECT datname, numbackends, xact_commit, xact_rollback,
       blks_read, blks_hit, temp_files, temp_bytes, deadlocks
  FROM pg_stat_database WHERE datname = current_database();
SELECT pid, state, wait_event_type, wait_event,
       now() - xact_start AS transaction_age
  FROM pg_stat_activity WHERE datname = current_database() AND xact_start IS NOT NULL;
SELECT pg_size_pretty(pg_database_size(current_database()));
```

Sayaçların öncesi/sonrası farkı ölçülür; burada `pg_stat_reset` çalıştırılmaz. `src/lib/database/client.ts` mevcut pool üst sınırı **süreç başına 5**: web/worker/çoğaltılmış süreç sayısı ile çarpıp bot/bakım/izleme ve yönetim rezervini ekleyin. Kaynak tüketimi yalnız `shared_buffers` değildir; `work_mem` aynı bağlantıda birden çok işlem için ayrılabilir. 4 GB paylaşımlı host için otomatik yüzde veya ayar değişikliği önerilmez; gerçek ayar ve toplam tepeyle karar verilir. Kaynak: [PostgreSQL 17 kaynak belleği](https://www.postgresql.org/docs/17/runtime-config-resource.html).

## Onaylı başlangıç ölçüm eşikleri

| Ölçüm | Önerilen kabul | Önerilen durdurma/inceleme eşiği |
|---|---|---|
| Host RAM tepe | `MemAvailable` ≥768 MiB; toplam kullanım yaklaşık ≤%80 (cache geri kazanımı dikkate alınır) | Available <512 MiB 60 sn veya herhangi OOM/kill |
| Web+worker RSS tepe | Birlikte ≤1.25 GiB; bot+PG+OS için ayrıca ölçülen bütçe kalır | Sürekli artış veya limit/kill; toplam host eşiği önce gelir |
| Swap | Yük boyunca `si/so=0`; swap kullanımı tepe sonrası artmayı bırakır | 30 sn sürekli swap I/O veya sürekli büyüme |
| CPU (iki vCPU toplamına normalize) | 5 dk ortalama busy ≤%70; kısa tepe ≤%90 ve ≤60 sn | >%90 60 sn; sustained run queue >2, `wa` >%10 veya `st` >%5 inceleme |
| Disk kapasite | Her ilgili FS'de ≥%25 ve ≥10 GiB boş (ikisi de); inode ≥%20 boş | <%15 veya <5 GiB; yedek/restore/WAL geçici büyümesi sığmıyorsa durdur |
| PostgreSQL bağlantısı | Normal kullanıcı kapasitesinin ≤%70'i; en az 10 bağlantı ek pay | Bağlantı reddi, uzun idle-in-tx (>60 sn), bağlantıda sürekli artış |
| Kararlılık/toparlanma | 0 OOM/restart, kaynaklar 10 dk içinde referansa yaklaşır; mutasyon görünürlüğü doğru | Herhangi 5xx/OOM/restart veya toparlanmayan RAM/swap |

Host RAM koşulları birlikte, bağlantı yüzdesi ile ek pay birlikte sağlanmalıdır. Mevcut %20 disk önerisi [önceki değerlendirmede](./vds-assessment.md) bulunuyordu; burada restore/geçici büyüme payı için **%25 +10 GiB** başlangıç ölçüm kriteri kullanıcı tarafından onaylandı. Donanım/iş yükü ölçümü bu değerlerin yeniden değerlendirilmesini gerektirebilir.

**Onay kaydı:** Kullanıcı “Ölçüm eşiklerini onaylıyorum” yanıtını verdi. Onay yalnız ölçüm kriterlerini kapsar; sunucuda işlem/ayar değişikliği yapılmadı. Sonuç raporunda commit, senaryo/eşzamanlılık, tarih/süre, bot durumu, her kaynağın referans/tepe/toparlanma değeri, hata sayıları ve ✓/✗ + ham ölçüm dosyaları bulunmalıdır. Ölçüm yapılmadığından şu an kapasite kabulü **doğrulanmadı**.
