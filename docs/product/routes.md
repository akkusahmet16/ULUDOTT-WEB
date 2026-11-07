# Ürün ve API Rota Haritası

Güncel durum: Kasım 2026 (v0.2 Final Kabul Sürümü). `[param]` dinamik parametreleri ifade eder; route group `(...)` URL'e dahil değildir. Özel tokenlı ve kimlik doğrulama gerektiren sayfalar `noindex`, `no-store` ve `no-referrer` güvenlik başlıklarıyla korunmaktadır.

---

## 1. Genel ve Statik Rotalar (Public Surface)

| Rota | Tür | Açıklama | İndekslenebilirlik |
|---|---|---|---|
| `/` | Sayfa (SSR) | Sinematik ana sayfa, panel geçişleri, öne çıkan etkinlikler, duyurular ve mini oyunlar | `index, follow` |
| `/hakkimizda` | Sayfa (SSR) | Uludott topluluk vizyonu, felsefesi ve ekip tanıtımı | `index, follow` |
| `/ulujam` | Sayfa (SSR) | UluJam oyun maratonu merkezi, başvuru bilgileri, geçmiş yıllar arşivi | `index, follow` |
| `/etkinlikler` | Sayfa (SSR) | Topluluk etkinlik listesi, takvim ve Coffee Talk duyuruları | `index, follow` |
| `/etkinlikler/[slug]` | Sayfa (SSR) | Etkinlik detay sayfası, afiş, mekan, zaman ve başvuru CTA | `index, follow` |
| `/oyunlar` | Sayfa (SSR) | UluJam ve topluluk oyun kataloğu, derece alan oyunlar ve itch.io bağlantıları | `index, follow` |
| `/oyunlar/[slug]` | Sayfa (SSR) | Oyun detay sayfası, künye, geliştirici ekibi ve indirme/oynama linkleri | `index, follow` |
| `/fanzin` | Sayfa (SSR) | Uludott Fanzin arşivi ve interaktif sayfa çevirmeli flipbook okuyucu | `index, follow` |
| `/iletisim` | Sayfa (SSR) | İletişim kanalları, sosyal medya hesapları ve topluluk bağlantıları | `index, follow` |
| `/l/[id]` | HTTP (307) | Kısa link yönlendirme motoru ve QR kod hedefi | `noindex` |
| `/media/[variantId]` | HTTP | Optimize edilmiş onaylı genel medya varyantı teslimi | `index, follow` |
| `/uploads/[...path]` | HTTP | VDS yerel dosya sisteminden yüklenen doğrulanmış medya/PDF teslimi | `index, follow` |
| `/robots.txt` | HTTP | Arama motoru erişim direktifleri | `index` |
| `/sitemap.xml` | HTTP | Dinamik site haritası | `index` |

---

## 2. Özel ve Katılımcı Rotaları (Private & Token Surface)

| Rota | Tür | Yetkilendirme / Kapsam | Güvenlik Politikası |
|---|---|---|---|
| `/basvuru/[formSlug]` | Sayfa (SSR) | Açık form başvuru ekranı (etkinlik/genel formlar) | `noindex, no-store` |
| `/makbuz` | Sayfa (SSR) | Form başvuru makbuzu ve takip özeti | `noindex, no-store` |
| `/kart/[token]` | Sayfa (SSR) | Katılımcı kimlik kartı, check-in QR ve Google Wallet kapısı | `noindex, no-store` |
| `/takim/[token]` | Sayfa (SSR) | UluJam takım yönetim portalı, üye listesi ve onay durumu | `noindex, no-store` |
| `/yayin-onayi/[token]` | Sayfa (SSR) | Oyun geliştirici künye ve yayın izni rıza ekranı | `noindex, no-store` |

---

## 3. Yönetim Paneli Rotaları (Admin Panel)

Tüm `/admin/*` sayfaları oturum, rol tabanlı erişim denetimi (RBAC), etkinlik kapsamı (event scope) ve tek oturum anahtarı/parolasıyla korunur.

| Rota | Tür | Açıklama |
|---|---|---|
| `/admin` | Sayfa | Yönetim paneli genel bakış ve operasyonel pano |
| `/admin/analitik` | Sayfa | Sayfa görüntüleme, cihaz dağılımı ve link tıklama metrikleri |
| `/admin/basvurular` | Sayfa | Form başvuruları, arama, filtreleme ve CSV dışa aktarım |
| `/admin/basvurular/[submissionId]` | Sayfa | Tekil başvuru detayı ve onay/ret durumu |
| `/admin/check-in` | Sayfa | Etkinlik alanı katılımcı karşılama ve QR okuma konsolu |
| `/admin/etkinlikler` | Sayfa | Etkinlik oluşturma, düzenleme, afiş ve yayın takvimi |
| `/admin/fanzin` | Sayfa | Fanzin sayıları listesi ve yönetim konsolu |
| `/admin/fanzin/yeni` | Sayfa | Yeni fanzin sayısı oluşturma ve PDF/kapak yükleme |
| `/admin/fanzin/[id]` | Sayfa | Fanzin sayısı detayları, sayfa önizleme ve düzenleme |
| `/admin/formlar` | Sayfa | Form şablonları, alan kuralları ve sürüm yönetimi |
| `/admin/formlar/[formId]` | Sayfa | Form oluşturucu (builder), koşullu alanlar ve sürüm dondurma |
| `/admin/galeri` | Sayfa | Etkinlik ve topluluk fotoğraf galerisi yönetimi |
| `/admin/iletisim` | Sayfa | İletişim bilgileri ve sosyal medya bağlantıları yönetimi |
| `/admin/linkler` | Sayfa | Kısa linkler, QR kodlar ve kategori sıralaması yönetimi |
| `/admin/medya` | Sayfa | Yüklenen görseller, alt metinler ve optimize varyantlar |
| `/admin/oyunlar` | Sayfa | Oyun kataloğu, UluJam finalistleri ve derece yönetimi |
| `/admin/oyunlar/[gameId]` | Sayfa | Tekil oyun detayı, geliştirici künyesi ve rıza durumu |
| `/admin/people` | Sayfa | Topluluk üyeleri, kurucu kadro ve konuşmacı yönetimi |
| `/admin/sistem` | Sayfa | Sistem sağlığı, outbox kuyruk durumu ve audit loglar |
| `/admin/site-icerikleri` | Sayfa | Ana sayfa kahraman bölümü ve hikaye panelleri CMS editörü |
| `/admin/sponsorlar` | Sayfa | Topluluk ve UluJam sponsorları/destekçileri yönetimi |
| `/admin/takim-arayanlar` | Sayfa | UluJam bireysel başvuranlar ve yetenek öneri panosu |
| `/admin/takim-onaylari` | Sayfa | Takım kadro onayları, revizyon geçmişi ve onay/ret |
| `/admin/ulujam` | Sayfa | UluJam maraton ayarları, kuralları ve durum konsolu |
| `/admin/ulujam-arsivleri` | Sayfa | Geçmiş UluJam yılları, ödül listeleri ve arşiv galerisi |
| `/admin/ulujam-formu/[eventId]` | Sayfa | Etkinliğe özel UluJam başvuru formu yapılandırması |

---

## 4. İstemci ve Katılımcı API Uç Noktaları (Public/Client API)

| Uç Nokta | Metot | Açıklama |
|---|---|---|
| `/api/forms/csrf` | GET | Form gönderimleri için CSRF koruma tokenı |
| `/api/forms/[formSlug]/submit` | POST | Dinamik form gönderimi (hız sınırı, idempotency ve doğrulama) |
| `/api/submissions/receipt` | GET | Başvuru makbuzu verisi |
| `/api/ulujam/apply` | POST | UluJam bireysel veya takımlı başvuru oluşturma |
| `/api/ulujam/teams` | GET | UluJam onaylı takım listesi |
| `/api/team/login` | POST | Takım erişim tokenı ile oturum açma |
| `/api/team/logout` | POST | Takım oturumunu kapatma |
| `/api/cards/publication-consent` | POST | Oyun künyesi yayın onayı ve isim tercihi |
| `/api/wallet/google/[cardToken]` | GET | Google Wallet dijital kartı oluşturma ve JWT yönlendirmesi |
| `/api/wallet/status` | GET | Dijital cüzdan entegrasyon durumu |
| `/api/links/[id]/qr` | GET | Kısa link için PNG formatında QR kod üretimi |

---

## 5. Yönetici API Uç Noktaları (Admin API)

Tüm `/api/admin/*` uç noktaları oturum doğrulaması ve CSRF kontrolü altındadır:

| Uç Nokta | Metotlar | Kapsam / İşlem |
|---|---|---|
| `/api/admin/login` | POST | Yönetici kimlik doğrulaması |
| `/api/admin/logout` | POST | Yönetici oturum kapatma |
| `/api/admin/session` | GET | Mevcut oturum durumunu sorgulama |
| `/api/admin/session/renew` | POST | Oturum süresini uzatma |
| `/api/admin/csrf` | GET | Yönetim paneli formları için CSRF token |
| `/api/admin/analytics` | GET | Topluluk analitik verilerini sorgulama |
| `/api/admin/events` | GET, POST, PUT | Etkinlik CRUD işlemleri |
| `/api/admin/fanzin` | GET, POST | Fanzin listeleme ve yeni sayı oluşturma |
| `/api/admin/fanzin/[id]` | GET, PUT, DELETE | Fanzin düzenleme, silme ve yayınlama |
| `/api/admin/forms` | GET, POST | Form şablonları yönetimi |
| `/api/admin/forms/[formId]` | GET, PUT | Form sürümü ve alan kuralları güncelleme |
| `/api/admin/submissions` | GET | Başvuruları listeleme ve filtreleme |
| `/api/admin/submissions/[submissionId]` | GET, PUT | Başvuru durumu güncelleme |
| `/api/admin/submissions/[submissionId]/files/[fileId]` | GET | Başvuruya eklenen özel dosyayı indirme |
| `/api/admin/submissions/export` | POST | Başvuruları güvenli CSV (formül kaçışlı) olarak aktarma |
| `/api/admin/teams/access` | POST | Takım erişim anahtarı sıfırlama veya yeniden üretme |
| `/api/admin/approvals` | POST | Takım kadro revizyonu onay/ret |
| `/api/admin/assignments` | POST | Takım arayan katılımcıyı takıma atama |
| `/api/admin/check-in` | POST | Katılımcı kart check-in işlemini kaydetme |
| `/api/admin/games` | GET, POST, PUT | Oyun kataloğu ve derece yönetimi |
| `/api/admin/games/[gameId]` | GET, PUT | Tekil oyun detayları ve rıza yönetimi |
| `/api/admin/game-catalog` | GET | Topluluk oyun arşivi sorgusu |
| `/api/admin/gallery` | GET, POST, DELETE | Galeri medyası yönetimi |
| `/api/admin/links` | GET, POST, PUT, DELETE | Link merkezi ve kategori yönetimi |
| `/api/admin/media` | GET, POST | Medya yükleme ve varyant üretimi |
| `/api/admin/site-assets` | GET, POST, DELETE | VDS yerel dosya sistemine doğrudan görsel/PDF yükleme |
| `/api/admin/people` | GET, POST, PUT, DELETE | Topluluk üye ve konuşmacı listesi yönetimi |
| `/api/admin/homepage-settings` | GET, PUT | Ana sayfa dinamik metinleri ve kahraman ayarları |
| `/api/admin/places-settings` | GET, PUT | Etkinlik mekanları ve yerleşim ayarları |
| `/api/admin/sponsors-settings` | GET, PUT | Sponsor listesi ve logoları yönetimi |
| `/api/admin/contact-settings` | GET, PUT | İletişim adresleri ve sosyal medya ayarları |
| `/api/admin/ulujam-settings` | GET, PUT | UluJam kuralları, sayaç ve maraton ayarları |
| `/api/admin/ulujam-archives` | GET, POST, PUT | Geçmiş UluJam yılları ve ödülleri yönetimi |
| `/api/admin/outbox/[jobId]/retry` | POST | Başarısız outbox arka plan görevini yeniden kuyruğa alma |
