# Görev21–23 kabul kaydı —3 Ekim2026

21 ve22 tamamlandı. 23 yerel uygulama/protokol kabulü tamamlandı; gerçek Google issuer/test hesabı ekleme-güncelleme ve yayın erişimi kanıtı bekliyor. Planın23 üçüncü kutusu açık. Görev24 Apple Wallet bu tur uygulanmadı; Faz4 genel kabulü tamamlanmadı.

## Teslim

21: ayrı Node worker, PostgreSQL outbox, atomik enqueue/dedup, SKIP LOCKED claim,120s lease ve owner+attempt fencing,5deneme backoff/dead-letter, CSRF+system_admin manuel retry, idempotent medya silme. Sonraki işi hemen başlamadan claim ederek bekleyen lease yaşlanması önlenir.

22: onaylı aktif katılım ve saklama/etkinlik kontrolü server-side; provider başına tek pass; desired/synced revision ve gerçek provider_state ayrı; private/CSRF API ve mobil durum UI;20kart cursor sweep ile zaman/etkinlik iptali.

23: server-only depo dışı0600 RSA dosya, RS256 OAuth+ID-only Save JWT, kararlı Generic Class/Object kimliği,409 idempotent update,404 hata, güncel QR/derece/isim/iptal, hata kaydı ve queue retry. Etkinlik adı değişimi aynı transaction kart revision/outbox üretir. Konfigürasyon kesintisi remote iptali tamamlandı saymaz. Build tracing ham medya/env/anahtar/scratch dışlar.

## Kanıt

Final tek inceleme4e43097..1f9b5bb: Critical0/Important2/Minor1; üçü tek RED→GREEN düzeltme turunda kapandı. Key-boundary bulgusu açık depo-dışı anahtar kuralını ihlal ettiği için güvenlik açısından ele alındı. İlk title testi yanlış header alanına bakıyordu; düzeltilen RED2 gerçek subheader hatasını gösterir. İkinci review yok.

- Task21 full225/225; Task22 full229/229.
- Final full34dosya238/238: `.local/task23-review-full.log`.
- Final Google9/9: `.local/task23-review-green.log`; RED3/9fail: `.local/task23-review-red2.log`.
- Typecheck/lint temiz: `.local/task23-review-types.log`, `.local/task23-review-lint.log`.
- Final production build ve sentetik dış RSA key taraması2708dosya/secretHits0/forbiddenFiles0: `.local/task23-review-build.log`.
- HEIC negatif paket probu scanner'ın yasak dosyayı gerçekten reddettiğini gösterir: `.local/task23-package-negative.log`.
- Production TLS E2E ve ana DB/media temizliği kapanışta progress.md'ye yazılır.

## Kararlar ve maliyetleri (bu tur, kronolojik)

1. Mevcut development/bootstrap checkout ve kalıcı progress ledger korundu; maliyet: ayrı worktree izolasyonu yok.
2. complete/retry jobId yanında owner+attempt ister; maliyet: claim capability çağıranda tutulur. game.credit_changed mevcut atomik card invalidation nedeniyle acknowledgment-only; maliyet: yeni producer aynı invariant'ı korumalı.
3. DB ready, UI active olur; desired/synced/provider_state ayrılır; maliyet:0018–19 additive migration. Eksik konfigürasyonda onaylı kişi pending intent açabilir; onaysız kişi açamaz; maliyet: yapılandırma olmadan dış teslim yok.
4.20kart cursor sweep sessiz expiry/eventclose'u yakalar; maliyet: ek DB sorguları ve dış iptal gecikmesi.
5. Save JWT yalnız mevcut Object ID taşır; maliyet: link öncesi başarılı object hazırlığı.0600 dış RSA anahtar; maliyet: güvenli provisioning/yedek/rotation gerekir.
6. Provider hata metadata ve queue retry aynı transaction'da commit; maliyet: HTTP boyunca event/card kilidi ve VDS kapasite ölçümü.
7. Sweep yeni uygunluk revision/outbox üretir; doğrudan provider retry yapmaz; maliyet: iptal sonraki worker batch'inde.
8. Her işi başlamadan tek claim; maliyet: ek claim transaction'ları.
9. Global tracing excludes+genişletilmiş paket taraması; maliyet: gerekli runtime dosyaları bilinçli olarak paketlenmeli, ham medya/anahtar dışta tutulmalı.
10. Config kaybı teslim başarısı değildir; maliyet:5denemeden sonra config restore ve yetkili manual retry gerekebilir.
11. Event title değişimi ilgili tüm card revision'larını artırır; maliyet: kart sayısı kadar transaction/kuyruk işi.
12. Gerçek Google hesabı/yayın erişimi kanıtı olmadan23 dış kabulü açık kalır, legacy sırlar okunmaz; maliyet: gerçek ekleme/güncelleme ve genel yayın henüz doğrulanmadı.
13. Reviewer'ın canlı issuer/cihaz teslimi, Apple24, proxy/CDN/WAF/penetrasyon/VDS kapasitesi, HTTP timeout sonrası uzak sıra, gerçek key rotation/yedek/issuer migration kapsamları bu tur yerel kabul dışında; maliyet: ilgili gerçek sistem kontrolleri sonraki dağıtım/görevde gerekir. Timeout'ta Google uzak isteği sonradan tamamlayabilir; kesin uzak sıra garanti edilmez.
14. Hukuki retention süresi, bağlı geçmiş kayıt silme politikası, bearer kurtarma/kimlik/paylaşım mevcut ürün sınırları olarak bırakıldı; maliyet: policy/identity güvencesi ayrıca gerekir. Değişmemiş submission/sayaç/arşiv ve generated snapshot JSON için yeni derin inceleme yok; SQL/schema/journal+regresyon denetlendi; maliyet: bu alanlar bağımsız yeni audit sayılmaz. Son preview/E2E yürütücü kanıtıdır.
15. Yerel geliştirme dalı korunur, bu tur push/merge/yeni dış dağıtım yok; maliyet: uzak repo bu commitlerle ayrıca eşitlenmeli.

Ertelenen minor: yok; güvenlik yol sınırı aynı düzeltme turunda kapandı. Apple/gerçek Google/canlı kapasite bulguları minor değil, açık kapsam/kabul sınırlarıdır.
