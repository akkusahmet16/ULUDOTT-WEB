# Başvuru yönetimi — Görev 13

`/admin/basvurular` yalnız event_manager rolü ve ilgili etkinlik kapsamıyla kullanılabilir. System_admin veya content_editor tek başına kişisel veri okuyamaz. Liste yalnız kimlik, e-posta, durum, tarih, sürüm ve saklama sonunu döndürür; yanıtlar yalnız yetkili ayrıntıda bulunur. API oturum, POST işlemleri ayrıca Origin/CSRF ister; çıktılar no-store ve nosniff'tir.

Formu seçip arama/durum/UTC tarih aralığıyla filtreleyin. Liste 25 kayıt, API en çok 100; sonraki sayfa PostgreSQL mikro-saniye tarih ve UUID ile kararlı ilerler. Yanıtlar ve e-posta aranabilir; arama 100 karakterle sınırlı ve SQL parametreleriyle yapılır. Düzeltme ilk yayımlı sürüme göre doğrulanır. Yeni sürüm eski soruların etiketini değiştirmez. Rıza cevapları yönetici tarafından değiştirilemez. Bekleme listesinden kabul form kilidi altında kontenjanı tekrar kontrol eder. Durum/düzeltme/silme için expectedRevision zorunludur; eski ekran 409 alır. Geri çekilme rızanın withdrawnAt kaydını da doldurur.

CSV/XLSX indirme etkinlik kapsamlı ve audit kaydı oluşturur. Audit yanıt/e-posta/token içermez. Sürümler ayrı sütunlarla gösterilir. Formül başlangıçları, Unicode eşdeğerleri ve ön boşluk/kontrol karakterleri apostrofla metne çevrilir; XLSX hücreleri string'dir. CSV tüm hücreleri tırnaklar, tırnakları iki kez yazar, UTF-8 BOM kullanır. Dosyaları sadece yetkili ortamda saklayın; indirilen kopyalar sunucunun silme işlemiyle silinmez.

VDS sınırı: 5000 kayıt, 1000 sürümlü alan, toplam 250000 hücre, 10 MiB ham yanıt ve 20 MiB çıktı. Sınır aşımı sessiz kısaltılmaz; arama/tarih/sürüm filtresini daraltın. Sorgu başına 5 saniye statement timeout vardır. ExcelJS 4.4.0 yalnız sunucuda yeni XLSX yazar; ziyaretçi dosyası yükleme/okuma yoktur.

Saklama süresi başvuru anında sabitlenir; form ayarı değişikliği eski başvuruyu uzatmaz. Süresi dolan kayıtlar liste/ayrıntı/export/makbuz/replay için hemen erişilemez olur. Panelde **Süresi dolan kayıtları temizle** düğmesi veya aşağıdaki CLI fiziksel silmeyi uygular:

```sh
pnpm submissions:purge --admin-id <yetkili-yönetici-UUID> --form-id <form-UUID>
```

CLI aktif yönetici, event_manager rolü ve DB'deki etkinlik kapsamını doğrular; UUID'ler gizli parola değildir. Bir koşu en çok 1000 kayıt işler; deleted/blocked toplamları döner. Başvuru, yanıt, rıza, durum geçmişi ve şifreli idempotency replay birlikte silinir; metadata audit kalır. Bağlı UluJam katılımcı kaydı varsa generic silme reddedilir, purge blocked sayar; bu kayıtların takım/kart yaşam döngüsü Görev 15–19 servisleriyle ayrıca yönetilmelidir. Bloke kaydı elle SQL ile atlamayın.

Dağıtımda CLI'yı yalnız servis kullanıcısına açık env ile günlük systemd timer/iş kuyruğuna bağlayın; blocked veya başarısız koşular operasyon alarmı gerektirir. Şu an canlı VDS/timer kurulmadı; yerel fiziksel silme servis ve CLI hazırdır. Yedeklerin saklama ve imha politikası dağıtım/yedekleme görevinde ayrıca uygulanmalıdır.
