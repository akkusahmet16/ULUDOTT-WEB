# Görev 28 — yerel yük ve toparlanma raporu

3 Ekim 2026. k6 2.3.0; macOS geliştirme makinesi, PostgreSQL 17.10 ve Garage 2.3.0. Üretim Next paketi; yalnız loopback/izole DB ve sentetik veriler. Gerçek Google issuer yük hedefi değildir. VDS 4 GB/2 CPU kapasitesi, CDN ve trafik SLO kabulü bu ölçümden çıkarılamaz.

| Senaryo | İstek | p95 ms | p99 ms | Beklenmeyen hata |
|---|---:|---:|---:|---:|
| public | 2143 | 59.53 | 68.39 | 0 |
| forms | 280 | 102.36 | 205.34 | 0 |
| team-race | 24 | 205.87 | 226.21 | 0 |
| wallet-queue | 8 | 843.85 | 846.88 | 0 |

Public isteği ana sayfa HTML ile gerçek yayınlanmış DEMO afişini birlikte okur. Form/admin ve takım senaryosu test broker üzerinden gerçek HTTP uygulama işleyicilerini ve gerçek DB servislerini çağırır; TLS/ağ sınırları ayrıca üretim E2E testinde doğrulanır. Bu ölçüm uygulama işleme maliyetini içerir; internet round-trip ve CDN maliyetini ölçmez.

- form_latency: p95 136.95 ms; p99 228.50 ms.
- admin_latency: p95 87.46 ms; p99 132.10 ms.

140 form isteği: 120 kabul/20 beklenen 429; DB’de 120 kayıt, kayıp/çift kayıt 0. Son takım koltuğunda 12 eşzamanlı ikili yarış: 12 kabul/12 beklenen 409, fazla üye 0. Beklenen 429/409 `http_req_failed` ölçümüne girer; doğruluk kontrolü bu durumları ayrı değerlendirir.

Wallet: 16 kart; ilk iki turda sahte sağlayıcı503, ardından düzelme. Test pending işlerin bekleme tarihini öne alır; gerçek backoff süresine ait toparlanma garantisi değildir. Her tur en fazla50 iş alır; bir turda tamamen boşalma varsayılmaz.

| Tur | Kalan iş | İşleme ms |
|---|---:|---:|
| 0 | 60 | 838.22 |
| 1 | 58 | 835.02 |
| 2 | 8 | 656.56 |
| 3 | 0 | 93.95 |
| 4 | 0 | 2.96 |
| 5 | 0 | 3.12 |
| 6 | 0 | 3.84 |
| 7 | 0 | 6.11 |

Sonuç: 16 aktif ve güncel pass, bekleyen/processing/dead 0. Sekiz örnekli Wallet p99 istatistiği kapasite tahmini için küçük örneklemdir. Hiçbir p95/p99 eşiği uydurulmadı; correctness eşikleri %100 geçmelidir.

Tekrar: `pnpm build` ardından `pnpm test:load`. CI aynı senaryoyu çalıştırır. Son kanıt `.local/task29-load-final.log`; ham JSON/loglar git dışındadır. Test fixture hataları (yanlış event kind, worker batch100, DB capacity30, Vitest include birleşmesi, tek tur toparlanma varsayımı) düzeltildi; uygulama kontrolleri gevşetilmedi.

[k6 metrik tanımları](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/).

Son incelemeden sonra hedef sabit loopback ve fetch redirect:error ile sınırlandı; dış URL override etkisiz. Regresyon RED→GREEN ve dört k6 senaryosu yeniden geçti.
