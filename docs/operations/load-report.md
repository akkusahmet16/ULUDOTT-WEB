# Görev 28 — yerel yük ve toparlanma raporu

3 Ekim 2026. k6 2.3.0; macOS geliştirme makinesi, PostgreSQL 17.10 ve Garage 2.3.0. Üretim Next paketi; yalnız loopback/izole DB ve sentetik veriler. Gerçek Google issuer yük hedefi değildir. VDS 4 GB/2 CPU kapasitesi, CDN ve trafik SLO kabulü bu ölçümden çıkarılamaz.

| Senaryo | İstek | p95 ms | p99 ms | Beklenmeyen hata |
|---|---:|---:|---:|---:|
| public | 2000 | 66.49 | 86.70 | 0 |
| forms | 280 | 155.44 | 214.18 | 0 |
| team-race | 24 | 251.77 | 275.91 | 0 |
| wallet-queue | 8 | 1437.88 | 1521.52 | 0 |

Public isteği ana sayfa HTML ile gerçek yayınlanmış DEMO afişini birlikte okur. Form/admin ve takım senaryosu test broker üzerinden gerçek HTTP uygulama işleyicilerini ve gerçek DB servislerini çağırır; TLS/ağ sınırları ayrıca üretim E2E testinde doğrulanır. Bu ölçüm uygulama işleme maliyetini içerir; internet round-trip ve CDN maliyetini ölçmez.

- form_latency: p95 182.63 ms; p99 238.00 ms.
- admin_latency: p95 126.50 ms; p99 165.26 ms.

140 form isteği: 120 kabul/20 beklenen 429; DB’de 120 kayıt, kayıp/çift kayıt 0. Son takım koltuğunda 12 eşzamanlı ikili yarış: 12 kabul/12 beklenen 409, fazla üye 0. Beklenen 429/409 `http_req_failed` ölçümüne girer; doğruluk kontrolü bu durumları ayrı değerlendirir.

Wallet: 16 kart; ilk iki turda sahte sağlayıcı503, ardından düzelme. Test pending işlerin bekleme tarihini öne alır; gerçek backoff süresine ait toparlanma garantisi değildir. Her tur en fazla50 iş alır; bir turda tamamen boşalma varsayılmaz.

| Tur | Kalan iş | İşleme ms |
|---|---:|---:|
| 0 | 60 | 1211.43 |
| 1 | 58 | 1536.83 |
| 2 | 8 | 990.40 |
| 3 | 0 | 114.86 |
| 4 | 0 | 6.67 |
| 5 | 0 | 8.52 |
| 6 | 0 | 8.81 |
| 7 | 0 | 6.53 |

Sonuç: 16 aktif ve güncel pass, bekleyen/processing/dead 0. Sekiz örnekli Wallet p99 istatistiği kapasite tahmini için küçük örneklemdir. Hiçbir p95/p99 eşiği uydurulmadı; correctness eşikleri %100 geçmelidir.

Tekrar: `pnpm build` ardından `pnpm test:load`. CI aynı senaryoyu çalıştırır. Son kanıt `.local/task28-load-accepted.log`; ham JSON/loglar git dışındadır. Test fixture hataları (yanlış event kind, worker batch100, DB capacity30, Vitest include birleşmesi, tek tur toparlanma varsayımı) düzeltildi; uygulama kontrolleri gevşetilmedi.

[k6 metrik tanımları](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/).
