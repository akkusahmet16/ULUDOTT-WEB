# Transactional outbox ve ayrı worker

Web komutları `enqueue(tx,type,aggregateId,revision,payload)` ile aynı transaction içinde iş yazar. Payload yalnızca izinli UUID alanlarını içerir; kişi, telefon, token, anahtar ve sağlayıcı yanıtı içermez. `(type,aggregateId,revision)` unique tekrar yazmayı engeller.

`pnpm worker` ayrı Node süreci; `pnpm worker -- --once` tek batch işler. `SIGTERM/SIGINT` yeni batch almayı durdurur ve açık işlemi bitirir. Yerel worker da `.env.local` yükler; sunucuda web ile aynı server-only ortam yapılandırması kullanılır. Anahtar dosyası worker/paketin içine kopyalanmaz.

Claim `FOR UPDATE SKIP LOCKED` ile en çok50 kayıt, olağan batch5. Lease120s, worker kimliği+claim UUID capability ve attempt fencing. Her handler/ack transaction içinde kilitlenir; lease süresi geçmiş owner completion/retry yapamaz.5 denemeden sonra dead-letter,1–256s sınırlı exponential jitter; en son denemede çöken işçi lease sonunda dead-letter olur. Yerel worker durursa kullanıcı başvurusu/onay işlemi DB'de tutarlıdır; yalnız dış etkiler gecikir.

At-least-once: aynı iş tekrar gelebilir. `card.changed` eski payload durumunu uygulamaz; etkinlik/kart kilidi altında güncel uygunluk+revision okur. `game.credit_changed` ilgili kart işlerinin oyun komutuyla atomik yazıldığını onaylar. `media.deleted` yalnız deleted kaydın original/variant S3 nesnelerini idempotent siler; unknown type sessizce tamamlanmaz. Google/Apple provider senkronu Wallet görevlerinde bu güncel projection'a bağlanır.

`POST /api/admin/outbox/[jobId]/retry`: mevcut admin oturumu+CSRF+system_admin; yalnız dead kayıt tekrar açılır, attempt sıfırlanır ve kişisel veri içermeyen audit yazılır. İşçide ham exception/HTTP body loglanmaz; kayıtlar yalnız izinli hata kodlarını taşır. İşlem tekrarları sağlayıcı duplicate çağrıları içerebilir; sağlayıcı kararlı Object ID ve yeni revision kullanmak zorundadır.

Provider çağrılarına timeout, DB transaction ve event-before-card lock sırası uygulanır. Dış sağlayıcının offline cihazlara ulaşması ayrı dış kabul gerektirir; queue completed cihaz güncellemesi kanıtı değildir.

Kanıt: gerçek PostgreSQL outbox/worker-retry testleri rollback, concurrent claim, expired lease/old owner, backoff, max attempts, dead-letter/manual retry, worker-off submission ve eski işin yeni revision'ı geri alamamasını denetler.
