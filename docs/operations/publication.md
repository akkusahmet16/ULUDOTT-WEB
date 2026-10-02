# Etkinlik ve duyuru yayın akışı

Yönetim: `/admin/etkinlikler` ve `/admin/duyurular`. Genel liste ve ayrıntılar: `/etkinlikler`, `/etkinlikler/<slug>`, `/duyurular`, `/duyurular/<slug>`. Genel ziyaretçi hesabı gerekmez.

## Düzenleme ve yayın

1. Başlık ve benzersiz slug girip taslak kaydedin. Slug küçük Latin harfi, rakam ve tire kullanır. Uzun içerik düz metindir; HTML çalıştırılmaz. Kısa metin, kategori, düzenleyen ekip, kapasite ve SEO başlık/açıklaması isteğe bağlıdır. Kategori kayıtları mevcut envanterden seçilir; kategori oluşturma ayrı yönetim genişletmesidir.
2. Etkinliğin gerçek başlangıç/bitiş tarihini ve fiziksel konumunu ya da HTTPS çevrim içi adresini girin. Panel zamanları İstanbul olarak alır; sunucuda UTC saklanır. Bitiş başlangıçtan sonra olmalıdır. Coffee Talk dahil tarihi/konumu bilinmeyen etkinlik taslak kalır; testte kullanılan 2030 tarihi gerçek etkinlik bilgisi değildir ve ana DB'ye seed edilmez.
3. Medya kütüphanesindeki afişi seçin. Yayın için `ready`, alt metinli ve ayrıca yayımlanmış WebP türevi gerekir; özel afiş bir içeriğe bağlanınca kendiliğinden yayımlanmaz. Özel afiş yönetici önizlemesinde oturumla sunulur. Etkinlik afişi medya silme etkisine dahildir; bağlantı kaldırılmadan silinemez.
4. Kaydedilmiş içerikte mobil/masaüstü önizleme açın. Kaydedilmemiş alanlar önizleme/yayın kararına girmez. “Yayın etkisini göster” kaydedilmiş yayın/kaldırma zamanını gösterir; ayrı onay yayımlar. Yayın zamanı boşsa onay anı kullanılır, gelecekteyse `scheduled`. Zaman penceresi her genel okumada `[publishAt,unpublishAt)` olarak denetlenir; Görev 21 worker'ı beklenmez. DB scheduled kalabilir, public görünürlük zamanla değerlendirilir.
5. Ana sayfa sırasını boş bırakırsanız öne çıkarılmaz. 0 birincil etkinlik, kalanlar sıra ile kartlardır; sıra tekildir. Çakışan sıra reddedilir, başka etkinlik sessizce taşınmaz. Geçmiş, başlamış veya iptal etkinlik yaklaşan listesinde görünmez; yayımlanmış geçmiş/iptal içerik genel listede durum etiketiyle görünür. Bitiş saati geçtiğinde “Bitti” sunulur.
6. Duyuruyu bir etkinliğe bağlayabilir, doğrulanmış HTTPS dış adres veya mevcut genel sayfaya CTA ekleyebilirsiniz. Detay CTA hedefi yayın anında görünür olmalıdır; hedef gizlenirse CTA genel okumada gizlenir. JavaScript/data/protocol-relative adresler reddedilir. Harici URL'nin doğruluğu editörün sorumluluğudur; yayın mutasyonu üçüncü taraf sunuculara istek göndermez.
7. Form seçimi yalnız aynı etkinliğe bağlı mevcut formu gösterir ve DB bileşik FK ile korunur. Form rotası ve açık başvuru akışı Görev 14'te tamamlanacağından bu görevde başvuru CTA'sı gösterilmez. Yayınlı form alanı tek başına çalışan bir başvuru sayfası sayılmaz.
8. Taslağa alma public erişimi kaldırır ve yayın zamanlarını temizler. Arşivleme silme işlemidir: kayıt/FK/audit geçmişi korunur, eski slug dahil genel erişim 404 olur. İptal etiketi ve bitti durumu ayrı yönetilir. İçerik üzerindeki afiş bağlantısı arşivleme ile otomatik silinmez.

## Yetki, sürüm ve adresler

`content_editor` genel içerik oluşturur/değiştirir/yayımlar. `event_manager` yalnız açıkça atanmış etkinliği ve ona bağlı duyuruları yönetir; genel etkinlik veya bağımsız duyuru oluşturamaz. `system_admin` tek başına içerik izni taşımaz. Yeni/daha farklı etkinliğe duyuru taşıma her iki kapsamı denetler. Form seçenekleri de kapsamla sınırlandırılır. Oturum, Origin/CSRF ve sunucu yetkisi her mutasyonda kontrol edilir.

Her kayıt ve yayın `expectedRevision` ister. Aynı sürümle iki değişiklikten biri kabul edilir, diğeri 409 “Sürüm çakışması” alır. Listeyi yenileyip yeniden inceleyin. İçerik mutation ve audit aynı transaction içindedir. Slug değişimi geçmişi kimlikle saklar; eski adres görünür güncel adrese 308 yönlenir, zincir kurulmaz. Eski slug başka içerik tarafından alınamaz; aynı içerik kendi eski slug'ına dönebilir.

Canonical, Open Graph ve Twitter alanları yalnız görünür içerikten üretilir. Sosyal görsel yayımlanmış afiş türevidir. APP_URL canlıda doğru HTTPS alan adını taşımalıdır. Public sayfalar dinamik okunur; CDN'de yayın penceresini aşan sayfa önbelleği ayrıca uygulanmaz.

## API ve işletme

GET `/api/admin/events` veya `/api/admin/announcements` → son 100 yetkili kayıt ve düzenleyici seçenekleri. `?preview=<id>` → yetkili kaydedilmiş içerik. POST JSON `action=save`, `input`, güncellemede `id/expectedRevision`; diğer eylemler `publish/draft/archive/ended/cancelled`, `id`, `expectedRevision`, `confirmed=true`. Duyuruda ended/cancelled geçersizdir. Gövde en fazla 128 KiB ve 10 saniye, uzun metin 20.000 karakterdir; admin yanıtları no-store/noindex. Büyük envanter sayfalaması sonraki yönetim genişletmesidir.

Migration 0003 yayın alanları/redirect tablosunu, 0004 etkinlik-form composite FK ve konum türü CHECK'i ekler. `pnpm db:migrate` uygulanır; seed çalıştırılmaz. Linux/VDS dağıtımı ve gerçek içerik girişi bu görevde yapılmadı.

Doğrulama: `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm db:check`, `pnpm build`; build ardından `ULUDOTT_E2E_PRODUCTION=1 pnpm test:e2e` izole standalone/HTTPS kabulüdür. E2E fixture'ları aynı seri medya işleyicisini kullandığından yalnız 429 yanıtında sınırlı yeniden deneme yapar; decoder eşzamanlılık sınırı kaldırılmaz.
