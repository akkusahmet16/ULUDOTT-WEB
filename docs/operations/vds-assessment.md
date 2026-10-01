# 40 GB VDS için yerleşim değerlendirmesi

2 Ekim 2026. Kullanıcı beyanı: 40 GB toplam disk, Ubuntu/Discord botu/diğer servisler yaklaşık 15 GB kullanıyor. Yaklaşık 25 GB kalan alan hesaplanır; sunucuda `df` ölçümü yapılmadı. RAM 4 GB, 2 CPU (2000 MHz). Bot boşta %2 RAM/%3 CPU; panelde %29 disk bilgisi verildi. RAM yüzdesi host toplamına aitse yaklaşık 80 MB'dır; botun tepe kullanımı değildir. Disk yüzdesinin yalnızca bot dosyalarını gösterdiği doğrulanmadığından 15 GB mevcut kullanım hesabı değiştirilmedi. Ubuntu sürümü, CPU mimarisi, tepe kullanım, yedek hedefi ve disk inode durumu henüz bilinmiyor. Bu belge kurulum veya kapasite testi değildir.

## Önerilen başlangıç kararı

Mevcut bilgiyle canlı aday: **reverse proxy + Node LTS altında Next standalone ve ayrı worker, systemd ile; PostgreSQL uygun RAM varsa aynı VDS'de; medya ve kalıcı yedekler VDS dışında**. Redis ve üretim MinIO servisi eklenmez. Yerel geliştirme Compose'u bu canlı yerleşimden bağımsızdır. Harici S3 sağlayıcısı ve fiyatlandırma henüz seçilmedi, ücretli kaynak oluşturulmadı.

Bu seçim işletme önerisidir: az sayıdaki süreç için yeni Docker imaj/cache yaşam döngüsü eklemeden diski izlemek kolaylaşır. Docker teknik olarak yasak veya 40 GB'da çalışamaz değildir. Zaten Docker ile yönetilen, kaynak sınırları ve imaj temizliği oturmuş bir VDS varsa sadece runtime imajlarıyla Compose seçeneği yeniden değerlendirilir. RAM ölçümü yerel PostgreSQL'i elverişsiz gösterirse ayrı DB veya sunucu büyütme kararı gerekir; canlı kabul bu ölçüm olmadan verilmez.

## Seçeneklerin artı ve eksileri

| Yerleşim | Artısı | Eksisi |
|---|---|---|
| **systemd + standalone; PostgreSQL yerel; S3 ve yedek dışarıda** | Derleme araçları ve ham medya sunucuda tutulmaz; az servis; mevcut bot için ayrı kullanıcı/kaynak sınırı mümkün | Linux servis, Node sürümü, izin, güncelleme ve rollback işletmesi gerekir; DB/bot/web aynı host arızasından etkilenir |
| Docker Compose; yalnızca hazır runtime imajları; medya/yedek dışarıda | Paketlenmiş ortam, açık servis/volume sınırları ve kolay imaj rollback | İmajlar/build cache/loglar yönetilmezse disk dolar; DB volume yedeği yine gerekir; kaynak sınırları açıkça ayarlanır |
| VDS web/worker; DB ve S3 dış hizmette | DB ve medya VDS disk/RAM baskısını azaltır; ayrı arıza alanları kurulabilir | Ek maliyet, ağ gecikmesi, dış servis bağımlılığı, bölge ve kişisel veri işleme koşulları |
| Web/DB/MinIO/yedeklerin tamamı aynı VDS'de | Başlangıçta ayrı depolama hesabı gerektirmez | Medya ve orijinaller disk tüketir; yedekler de aynı diskte büyür; host/disk kaybı hem canlıyı hem yedeği götürebilir. Bu proje için önerilmez |

Docker konteynerleri için varsayılan sınırsız CPU/RAM davranışı ayrıca sınırlandırılmalıdır. Kaynak limitleri uygulama/bot ölçümlerine göre seçilir; performans veya kapasite iddiası değildir. Kaynak: https://docs.docker.com/engine/containers/resource_constraints/

## Disk politikası

- 25 GB'ın tamamı uygulamaya tahsis edilmez. Başlangıç işletme önerisi: toplam diskin %20'sini, yaklaşık 8 GB'ı boş tutmak; bu beklenen tüketim tahmini değildir. Mevcut 15 GB ile birlikte yaklaşık 17 GB yeni servis/veri/geçici büyüme bütçesi kalır. Sağlayıcının GB/GiB farkı ve gerçek `df` sonucu bu hesabı değiştirir.
- PostgreSQL tabloları kadar indeks, WAL, migration/index oluşturma ve bakımın geçici alanı da ölçülür. WAL dosyaları elle silinmez. Disk alarmı ve kapasite büyütme eşiği restore/iş yükü testinden sonra kesinleşir.
- Sınırlı log rotasyonu ve Next görsel/cache bütçesi uygulanır; geçmiş outbox/audit kayıtları saklama politikasına göre yönetilir. Docker seçilirse varsayılan JSON loglarının sınırsız büyümesi önlenir; `local` log sürücüsü rotasyonu değerlendirilebilir. Kaynak: https://docs.docker.com/engine/logging/configure/ ve https://docs.docker.com/engine/logging/drivers/local/
- Medya orijinalleri ve optimize türevler özel S3 uyumlu depoya; DB yedekleri şifreli ayrı hedefe gider. Aynı VDS üzerinde tek yedek, host kaybına karşı koruma sayılmaz. DB ve medya için eşleşen restore tatbikatı gerekir. Kaynak: https://www.postgresql.org/docs/current/backup.html
- Başlangıçta güncel ve önceki doğrulanmış sürüm tutulur; eski artefaktlar uygulamaya özel dizinde kontrollü temizlenir. Botun dosyaları veya Docker volume'ları otomatik temizlenmez.

## Derleme ve gerçek ölçüm

Build/test hedef sunucunun **Linux/CPU mimarisine uygun başka ortamda** yapılır, VDS'ye runtime artefaktı aktarılır. Mac üzerinde derlenen native bağımlılıkların Linux'ta çalışacağı varsayılmaz. VDS'de tekrar tekrar `pnpm install`/Playwright/build cache tutmak planın üretim dağıtım tercihi olmaz.

Next standalone yalnızca runtime için izlenen bağımlılıkları taşır; `public` ve `.next/static` ayrıca taşınır. Kaynak: https://nextjs.org/docs/app/api-reference/config/next-config-js/output

Bu makinedeki **yalnızca Görev 1 iskeleti** için build sonrası `du -sh` ölçümü: geliştirme node_modules 593 MiB; .next toplam 96 MiB; standalone yaklaşık 40 MiB; static yaklaşık 576 KiB. Bunlar macOS geliştirme ölçümleridir; tam ürünün, Docker imajının veya Linux canlı sürümünün boyutunu göstermez. DB, medya, Node runtime, işletim sistemi, bot ve loglar bu standalone ölçümüne dahil değildir.

## Kararı kesinleştirmek için gerekli bilgiler

RAM/vCPU ve botun tepe kullanımı kullanıcıdan istendi. Sonraki salt okunur sunucu envanteri `df -h`, `df -i`, `free -h`, Ubuntu sürümü/CPU mimarisi, mevcut servislerin bellek kullanımı ve mevcut proxy/DB/Docker durumunu kapsar. Erişim bilgisi olmadan sunucuya bağlantı kurulmaz. Parola veya anahtar sohbet/rapora yazdırılmaz.

RAM/vCPU yanıtı alındı: bu bilgiyle systemd yerleşimi başlangıç kararıdır. Bot DB'si taşınmadan geliştirmeye devam edilir; başka hizmete taşıma burada uygulanmaz. Web ve worker ayrı kullanıcı/servisle, ölçüme göre bellek/CPU limitleriyle çalışır. PostgreSQL bağlantı havuzu sınırlı, worker eşzamanlılığı başlangıçta düşük tutulur. 4 GB'ın tamamı Node'a verilmez. Tepe yük, disk ve gerçek servis limitleri Görev 28–29 kabulünde ölçülür; bu belge kullanıcı/saniye veya kesintisiz çalışma garantisi vermez.

Yerel DB/S3 test ortamının sağlanması ayrıca bekliyor. VDS kapasite bilgisi, mevcut Mac'te Docker kurulu olduğu anlamına gelmez; Görev 1'in gerçek servis kabulü açık kalır.
