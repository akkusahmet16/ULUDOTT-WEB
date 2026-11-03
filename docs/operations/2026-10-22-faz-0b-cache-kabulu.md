# Faz 0B — Önbellek uygunluğu ve güncellik kabulü

**Tarih:** 22 Ekim 2026. **Durum:** 0B kabul edildi; 0C ve Faz 1 başlamadı.
**Hedef:** Uludott Web v0.2, feat/unified-clean-v0.2; HEAD b8578cf3546416dd88d8dc0c1cff81c59998caf7. Önceki 0A değişiklikleri korundu.
**Plan:** [Birleşik plan, İş 0B](../design/2026-10-20-birlesik-uygulama-plani.md#iş-0b--önbellek-bağımlılıklarını-tamamla). 0C ve Faz 1 bu işin kapsamında değil.

## Bulgu ve uygulama kararı

Oyun liste/detay önbelleği, SQL'in uygun bulduğu oyunla birlikte yapımcı yayın adını da 30 saniyelik kalıcı snapshot'a alıyordu. Ancak uygunluk yalnız games/media verisine bağlı değil: etkinlik, takım, başvuru, aktif üyelik, kadro onayı, oyun yayın rızası ve başvurunun saklama süresi de belirleyici. Etkinlik HTTP'si events etiketini yenilerken oyun okumaları bu etiketi dinlemiyordu; takım/başvuru işlemleri ve worker Next oyun etiketi göndermiyordu.

Kurulu Next 16.3.8 belgelerinde TTL yenilemesi SWR'dir: ilk istek eski sonucu alabilir. revalidateTag(tag, { expire: 0 }) sonraki okumayı blocking yeniler, ancak yalnız çağrıldığı Next sunucu bağlamında etkilidir. Saatin ilerlemesi ve bağımsız worker/CLI için etiket listesi büyütmek tek başına çözüm değildir.

Planın izin verdiği **hassas okumayı cache dışında tutma** seçeneği uygulandı. Aşağıdaki dört dışa açık fonksiyon aynı mevcut repository/service'i her istekte çağırıyor:

- readPublicGames(cursor): aynı SQL, aynı uygunluk-before-LIMIT ve cursor sözleşmesi.
- readPublicGame(slug): aynı SQL snapshot'ında oyun ve yapımcı uygunluğu.
- readHistoricalResults(year): aynı kaynak kimliği/derece/URL ve etkinlik durumu denetimi.
- readPublishedArchives(): aynı varsayılan arşiv filtresi ve kayıtlı editoryal yayın ayrımı.

Ürün değişikliği iki dosyayla sınırlı: public-queries.ts içindeki bu dört sarmalayıcı ve tags.ts içindeki TTL politika açıklaması. SQL, iş kuralı, HTTP/worker transaction'ları, JSON şekli, sayfalama, DOM, CSS, metin, font ve public varlıklar değişmedi. cachePublicRead imzası ve diğer genel katalogların 30sn politikası korundu. Yeni bir test HTTP uç noktası veya test veritabanı bilgisini dışarı açan mekanizma eklenmedi.

Maliyeti: dört okuma kalıcı veri cache'inden yararlanmıyor; her yeni sunucu isteği mevcut sorguyu yapıyor. Bu aşamada performans artışı iddia edilmiyor. Cache payload'ı ile ayrı uygunluk filtresini birleştirmek, eski yayın adını veya boş/eksik sayfalama sonucunu sunma riski taşıdığı için eklenmedi. Kök layout'taki mevcut connection() ve üretim rota tablosu istek zamanlı render davranışını koruyor.

## Okuma → bağımlılık → mutasyon → politika matrisi

| Okuma | Gerçek veri bağımlılığı | İlgili değişim kaynakları | 0B sonrası politika |
|---|---|---|---|
| Oyun liste/detay | Oyun/yayın/rıza, etkinlik, takım, başvuru, aktif üyelik, kadro onayı, submissions.expires_at, derece/finalist, medya | game HTTP; etkinlik HTTP/service; takım onay/atama/üyelik; başvuru alanları; credit-consent HTTP/service; retention worker; DB saati | Cache dışı bütün SQL. Tek snapshot ve LIMIT öncesi uygunluk korunur; hiçbir yolun Next etiketi göndermesine bağlı değil. |
| Tarihî sonuçlar | Sabit 2026 kimlik/URL/derece, game publication/partial, event year/slug/kind/status | Game HTTP/service/seed, etkinlik HTTP/service | Cache dışı mevcut service. Sonuçlar kişi adı içermez; eksik alanlar null kalır. |
| Varsayılan 2026 arşivi, revision 0 | Varsayılan editoryal alanlar + güncel tarihî derece filtresi | Önceki satırdaki değişimler, archive settings | Cache dışı mevcut service; eski bir üst snapshot alt sorgunun kararını örtemez. |
| Kayıtlı editoryal arşiv, revision > 0 | Kendi açık published alanı, onaylı statik medya/oyun alanları | Arşiv ayarı kaydet/yayınla/gizle | Aynı service cache dışında; oyun başvuru/rıza uygunluğuna yeni bir bağımlılık eklenmez. |
| Etkinlik/duyuru/öne çıkan/home/indexable | Yayın, medya, çapraz CTA/form bağlantıları; home ayrıca UluJam | Publication HTTP → events/announcements; media HTTP → media; form HTTP → events+ulujam | Mevcut publicationTags ve home ulujam etiketi; 30sn katalog SWR. HTTP transaction tamamlandıktan sonra expire: 0. |
| Yayımlanmış bağlantılar | Links + yayın hedeflerinin güncelliği | Link HTTP → links; publication/media HTTP → mevcut etiketler | Mevcut links + publicationTags, 30sn; erişim rotasındaki hedef kontrolü ayrı kalır. |
| UluJam başlangıcı/galeri | Events/year/gallery/media | Etkinlik, galeri, medya HTTP'leri | Mevcut events/ulujam/media etiketleri. initialNow sunucu bileşeninde her istekte yeniden üretilir, TTL'ye girmez. |
| People/site oyun kataloğu | Kendi editoryal içeriği | People HTTP → people; game-catalog HTTP → siteGames | Mevcut 30sn katalog cache'i ve COMMIT sonrası etiket. |
| İletişim/UluJam sunumu | Site settings; sunum ayrıca event/form açık durumu | Settings HTTP → siteSettings/ulujam; event/form HTTP → events/ulujam | Mevcut etiketler ve 30sn katalog cache'i; form gönderme/yetki denetimleri cache'lenmez. |

Mevcut games/historicalResults mutation etiketleri ve diğer HTTP invalidation çağrıları korundu. Dört hassas okuma artık bunlara kayıtlı kalıcı payload üretmez. Dolayısıyla yeni team/application etiket ailesi ve worker içine Next API bağımlılığı eklemek gerekmez. Mevcut transaction tamamlanmadan/başarısız olunca invalidation yapılmaması sözleşmesi test edilmeye devam ediyor.

## Kırmızı → yeşil kanıt

### Gerçek veritabanı ve yaşam döngüsü

Yeni public-cache-eligibility.test.ts yalnız Next'in kalıcı depolama sınırını test doubles'ıyla temsil eder; SQL, gerçek başvuru/kadro/rıza/yayın servisleri ve retention worker değiştirilmez. Her senaryo kendi UUID DB'sini oluşturup kaldırır. Mock çağrısı saymak yerine gerçek çıktı/kişi adının kaldırılması doğrulanır. Gerçek Next cache davranışı ayrıca üretim E2E'de ölçülür.

İlk koşuda **12/12 başarısız**: repository güncel sonucu kaldırmışken cache sarmalayıcısı eski sonucu veriyordu. Düzeltmeden sonra mevcut cache/Date/namespace/invalidation testleriyle **27/27 geçti**.

Kapsam:

- Sıcak liste/detay + cancelled/archived etkinlik.
- Takım reddi, applications.status=withdrawn, aktif üyeliğin sona ermesi, açık oyun yayın rızasının geri çekilmesi.
- Başlangıçta gelecekte olan expires_at değerinin hiçbir mutasyon olmadan gerçek PostgreSQL saatiyle dolması.
- Next invalidation çağırmayan gerçek retention worker'ın ad/rıza kayıtlarını temizlemesi.
- Finalist değişikliği ve yeni yayın adının onayı/yayını; eski adın yeni snapshot'a taşınmaması.
- Tarihî sonuçlar ve varsayılan arşivden derecenin kaldırılması; kayıtlı editoryal arşivin bağımsız kalması.
- Tam tarihî oyunun rızası çekilince tam başlık/yapımcının gitmesi, minimal onaylı derece URL'sinin kalması.

DB+APP_URL cache alanı ayrımı genişletildi; sırlar anahtara açık metin olarak yazılmıyor. Mevcut Date/null serileştirme ve COMMIT sonrası blocking invalidation testleri korunuyor.

### Gerçek üretim sunucusu

Önce aynı URL'ler iki kez okunarak oyun listesi, detay ve varsayılan arşiv sıcak hâle getirildi. İlk geçerli kırmızı üretim koşusunda iptalden sonra eski ad/başlık kaldı, detay **404 yerine 200** döndü ve eski derece kartı görünüyordu. Düzeltme sonrası cancelled + archive senaryoları geçti.

Ek normal takım senaryosu özel tarihî istisnaya dayanmaz: anonim gerçek başvuru → yönetici kadro onayı → oyun/yapımcı onayı/yayını → iki anonim sıcak okuma → gerçek HTTP takım reddi → ilk liste yanıtında ad/başlık yok, detay 404. Buna normal NextLink geçişi de eklenmiştir: liste → detay → ana sayfa ile istemci gezinmesi ısıtılır; ayrı HTTP mutasyonundan sonra menüden Oyunlar'a dönünce eski başlık/ad gösterilmemesi doğrulanır. Sahipli oyun yayından alınır ve sahipli etkinlik arşivlenir.

Batu referansındaki sayaç senaryosu eski MFA/görsel girdileri kullanılmadan standart tests/e2e glob'una taşındı. Kendine ait yıl/etkinlik kurar; sunum ayarını özgün verisine geri koyar. Üç evre, sıcak okumada taze initialNow, ≥1sn ayrı iki örnek, ≤1sn saat/sayaç sapması, gerçek tarayıcıda ilerleme ve hidrasyon hatası olmaması geçti. Sayaç/tema uygulaması değiştirilmedi.

İlk üretim denemesinde test girdisi name alanını kullanmıştı; API'nin gerçek publicationName alanına düzeltildi. Bu fixture hatası geçerli kırmızı kanıt sayılmaz. Başarısız teşhis kayıtları korunur; timeout/eşik yükseltilmedi veya test atlanmadı.

## Sınırlar ve kalan işler

- Genel form submission durumu ile applications.status ve oyuna özel credit consent farklı mevcut alanlardır. Bu iş bunların ürün politikasını yeniden tanımlamaz; testler gerçek SQL'in kullandığı uygunluk kaynaklarını değiştirir.
- Garanti, COMMIT sonrası başlayan yeni sunucu okumaları içindir. Daha önce teslim edilmiş ekran, tarayıcı geçmişi veya kullanıcı tarafından alınmış kopya geriye dönük silinmiş sayılmaz.
- Çalışma DB'sine seed/migration/fixture yazılmaz. Yerel UUID DB'leri, ayrı geçici S3 bucket/anahtarları ve disabled Wallet/Turnstile ile çalışılır. Canlıya erişim, push/merge/dağıtım ve dış sağlayıcı bildirimi yapılmaz.
- Bu kabul v0.1/v0.2 piksel eşliği iddiası değildir. Görsel ve davranış referansı İş 0C'de doğrulanacak; Faz 1 henüz başlamaz.

## Nihai doğrulama

| Kontrol | Sonuç / kanıt |
|---|---|
| Geçerli kırmızı regresyonlar | Gerçek DB'de 12/12 başarısız; üretim iptal senaryosunda eski ad/başlık, 200 detay ve eski derece görünürlüğü. [DB kırmızı](../../.local/phase-0b/logs/eligibility-integration-red.log), [üretim kırmızı](../../.local/phase-0b/logs/eligibility-production-red-valid.log). |
| Hedefli yeşil | 27 unit/entegrasyon; 3 iptal/arşiv/sayaç E2E ve 1 normal takım E2E. Son tam koşu istemci gezinmesi kontrolünü de içerir. |
| pnpm test | 79 dosya / 393 test geçti, 97.7sn; [log](../../.local/phase-0b/logs/tests.log). |
| pnpm test:integration | 44 dosya / 238 geçti, 105.2sn; genel paketin alt kümesidir. [Log](../../.local/phase-0b/logs/integration.log). |
| Son tam üretim TLS test:e2e | 105 geçti / 0 başarısız / HTTP'ye özgü 2 mevcut koşullu atlama; 164.9sn, çıkış 0. [Log](../../.local/phase-0b/logs/e2e-final.log). |
| HTTP ek koşu | localhost ve 127.0.0.1 giriş/yenileme/çıkış 2/2 geçti; 11.9sn. Toplam 107 farklı E2E senaryosu uygun ortamında yeşil. [Log](../../.local/phase-0b/logs/e2e-http.log). |
| typecheck / lint | İkisi geçti. next-env.d.ts özgün hâline geri konduktan sonra tsc --noEmit de geçti. |
| build | 10.7sn, çıkış 0; 77 dinamik rota. Önceden kayıtlı Wallet dosya izleme uyarısı sürüyor, gizlenmedi. [Log](../../.local/phase-0b/logs/build.log). |
| db:check / config:check / audit | Üçü de geçti; pnpm audit --prod --audit-level=low bilinen açık bulmadı. |
| security:source / security:wallet | 810 kaynak ve 3230 üretim paketi dosyasında 0 sır/0 yasak dosya. |
| Kaynak koruma | v0.1 manifestindeki 646/646 hash aynı. 0A sonrasına göre v0.2 src/public 495 dosyada yalnız iki veri/cache dosyası farklı; eklenen/silinen kaynak yok. Tema/DOM/stil ve 114 public varlık aynı. [Kanıt](../../.local/phase-0b/source-protection.json). |
| DB ve fixture izolasyonu | Çalışma DB'si 47 tablo/26 migration ve izinli editoryal kayıtlarla aynı. Dokuz eski test DB'sinin tam kümesi korundu; yeni test DB'si, standalone klasörü ve başka istemci bağlantısı 0. [Kanıt](../../.local/phase-0b/resource-audit.json). |
| Bağımsız inceleme | Açık Critical/Important bulgu yok; gerçek SQL snapshot'ı, cache sınırı, fixture temizliği ve görsel kilit incelendi. |

Tam komut/çıkış/süre kayıtları [verification.json](../../.local/phase-0b/verification.json), [results.jsonl](../../.local/phase-0b/results.jsonl) ve [log klasörü](../../.local/phase-0b/logs) içindedir. İlk tam üretim koşusu da 105/105 geçti; istemci geçişi kapsamı genişletildiği için son tam koşu ayrıca yapıldı. Başarısız teşhis denemeleri korunur.

**Karar:** 0B kabul edildi. Geçici test deposu kaldırıldı; PostgreSQL ve Colima başlangıçtaki durmuş durumlarına döndürüldü. Mevcut volume ve dokuz eski DB korundu. Push/merge/dağıtım yapılmadı. Sıradaki iş 0C: v0.1'e sabitlenmiş deterministik görsel ve davranış referansı. Bu kabul Faz 0 bütünü veya canlıya hazır olma iddiası değildir.
