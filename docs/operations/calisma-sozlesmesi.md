# Çalışma sözleşmesi (her oturum, her model)

1. Öncelik: kullanıcının son açık talebi > birleşik plan + kesin görsel kilit > Issue #1 > eski raporlar.
2. Görsel kilit: v0.1'in çalışan hali tek doğrudur. Renk, font, ölçü, yerleşim, görsel, animasyon, menü değişmez. Yeni görünür kontrol/bölüm yok.
3. Her oturum: oku → en fazla 15 satır özetle → kullanıcı onayını bekle. Onaysız dosya değiştirme.
4. Bir oturum = tek İş. Sıradaki işe kendiliğinden geçme.
5. YASAK: --update-snapshots, maxDiffPixels/threshold artırma, mask ekleme, test silme/atlama (skip/only/fixme), referans PNG'yi yenileme (yalnız kullanıcı "referansı güncelle" yazarsa), git add ., reset/clean/checkout ile geri alma, push/merge, --no-verify, çalışma DB'sine kayıt.
6. "Tamamlandı" demek için komut + çıktı özeti şart. Çalışmayan kontrol = "doğrulanmadı".
7. Belirsizlik/çelişki varsa DUR: numaralı seçenekler + risk + önerin. Karar kullanıcıya ait.
8. Oturum sonu: docs/operations/sunum-katmani-ilerleme.md'ye "Devir notu" ekle (yapılan, kanıt, açık kalan, sıradaki adım, bekleyen kararlar). Sonra standart raporu ver: değişen dosyalar, çalıştırılan komutlar+sonuç, açık maddeler.
