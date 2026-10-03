# Wallet işletimi

Webkartı ayrı, sağlayıcıpass ayrı. Onaylı güncelkatılım/kadro/revision olmadan Google link üretilmez. Outbox minimumUUIDreferences, lease/backoff/idempotency; staleiş yeni revision'ı geriletemez. `/admin/sistem` system_admin sağlık/retry, ham kişi/payload/key yok; izinli retry audit+CSRF ve güncel eventscope kontrolü içerir. Dead jobu körlemesine tekrar etme: sebep/config/uygunluk incele. [Outbox](../architecture/outbox.md), [durum](wallet-status.md).

Google demo gerçek issuer kabulü ayrı [Google rehberi](google-wallet.md) ve [canlı kanıt](google-wallet-live-acceptance.md). 404 başarı değildir; retry503 sonrası güncelrevision reconcile. Public publishing/device/offline kabulü açık. Credential repo/image dışında0600 readonly, issuerpermission enazyetki; rotate sırasında eski/yeni account yetkisi ve objectID sürekliliğini doğrula, secretscan tekrar et.

[Apple](apple-wallet.md) ücretli Developer hesabı nedeniyle ertelendi; pkpass/imza/APNs/deviceupdate tamam iddiası yok. QRokutma→isim/takım→Geldi→WalletQRsilme→adminlistesi gelecekte iOS+web ortak uçtanuca soninceleme maddesidir; bu görevde uygulanmadı. AUTH rotate mevcut encrypted DB'nin decrypt/encrypt geçiş planı gerektirir; rastgele key değiştirme. [Yedek/restore](backup-restore.md).
