# Dağıtım ve temiz kurulum

Bu rehber canlı aday içindir; VDS/domain kullanıcı kararıyla henüz kullanılmıyor. Next16.3.8'in kurulu self-hosting rehberi esas alınır. VDS4 GB/2 CPU/40 GB, mevcut yaklaşık15 GB kullanım: derlemeyi CI'da yap, kalıcı medya/yedeği dış depoda tut, botun tepe tüketimini ölç. [VDS kararı](vds-assessment.md).

## Ortamlar

Geliştirme `.env.local` + loopback Compose; testler UUID DB ve sentetik S3 keys; staging/canlı ayrı DB, bucket, auth anahtarı, issuer/widget ve gönderici. Canlı/test aynı kişisel DB'yi paylaşmaz. Gerçek sırlar repo/image/CI çıktısında olmaz. Runtime env güvenli0600 dosya veya secret manager'dan; Google credentials read-only, nonroot process'in okuyacağı0600 dosyada ayrı mount. AUTH anahtarı DB restore ile birlikte kurtarılabilir güvenli ayrı kasada tutulur; rastgele yenilemek şifreli kayıtları bozabilir.

`NODE_ENV=production`, `APP_URL=https://...`, S3 endpoint HTTPS. DATABASE_URL URL-encoded parola ve özel ağ/sağlayıcı TLS ayarı; PostgreSQL/S3 internete açık port bırakılmaz. Turnstile required yalnız gerçek host/widget doğrulandıktan sonra; canlı WAF/origin firewall [kuralları](../security/waf-rules.md) ayrıca etkinleştirilir. Google disabled/demo/production gerçek erişim durumuyla eşleşir; Apple beklemede.

## Sıra

1. Commit/SHA ve release manifest kaydet; CI doğrulamaları geçmeden release üretme. `.github/workflows/ci.yml` package işi verify'e bağımlı; otomatik canlı yayın yok.
2. Eşlenmiş [yedek](backup-restore.md) al; migration uyumluluğunu incele. Yeni boş DB için Node24.21/pnpm11.19 ve frozen install. Runtime güvenli env yüklenmişken `pnpm config:check`, `pnpm db:migrate` **tek süreçte**; ikinci çalışma idempotent. Canlı DB reset/truncate yapılmaz.
3. Yalnız editoryal seed: `pnpm db:seed:2026`; gerekiyorsa tarihsiz2027 için `pnpm db:seed:ulujam`. Kişi/takım/kart yaratılmaz. Geliştirme fixture'ı çalıştırılmaz. Admin ayrı [etkileşimli bootstrap](admin-bootstrap.md).
4. Web/worker aynı release'i ayrı başlat; worker ancak migration tamamlandıktan sonra. Reverse proxy arkasındaki web host/port özel ağda; kullanıcı HTTPS ile erişir. Standalone paketi `.next/standalone`, `.next/static`, `public`; worker kaynak+productiondeps+src/db/migrations taşır.
5. Smoke: `/`, `/ulujam`, `/linkler`200; 2026 yalnız bilinen3 URL, 2027 tarihsizYakında; admin login/MFA, izinli içerik yayını, staging fakeform/makbuz/worker. Canlı kişisel test kaydı oluşturma. Genel/özel cache/CSP, HTTPS/origin reddi, queue sağlık kontrolü. Hata halinde [rollback](rollback.md).

## Ayrı Docker hedefleri

```sh
docker build --target runtime -t uludott-web:RELEASE .
docker build --target worker -t uludott-worker:RELEASE .
```

Her iki hedef USER node; web3000, worker HTTP portu açmaz. Runtime'a env-file dışarıdan verilir. Kaynak+CLI taşıyan worker hedefi tek seferlik config/migration/seed/bootstrap için de kullanılabilir:

```sh
docker run --rm --env-file /secure/uludott.env uludott-worker:RELEASE node --conditions=react-server scripts/check-config.ts
docker run --rm --env-file /secure/uludott.env uludott-worker:RELEASE node --conditions=react-server scripts/migrate.ts
```

Ağ ve Googlecredentials mount'u dağıtım ortamına göre ayrıca sağlanır; image içine COPY edilmez. Üretim localCompose değildir. systemd alternatifi: ayrı unprivileged kullanıcı, `EnvironmentFile=/etc/uludott/runtime.env`, web ExecStart `node /srv/uludott/current/server.js`, worker ExecStart `node --conditions=react-server /srv/uludott/worker-current/src/worker/main.ts`, doğru WorkingDirectory, web için HOSTNAME=127.0.0.1 ve PORT=3000, Restart=on-failure, SIGTERM graceful. Ayrı servisler; migration ExecStart'a bağlanmaz. DB havuz toplamı/bot/medya işleme RSS ve disk ölçülmeden RAM limitleri uydurulmaz. Haricî izleme/alarm teslim [incident-response](../security/incident-response.md) tenant kabulü bekler.

## Yerel prova

`tests/operations/backup-restore.test.ts`: gerçek boş hedefDB, tekrar migration ve 2026 seed, kişisel boşluk, tüm tablo içeriklerinin restore eşitliği ve gerçek S3 byte bütünlüğü. `pnpm test` içinde çalışır; Docker CLI + compose postgres ve S3 gerekir. `ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e` ayrı temiz test kurulumunda TLS smoke ve ürün akışlarını doğrular. GitHub runner'ın gerçekten çalıştığı iddia edilmez; yerel zincir ve image smoke rapordadır.
