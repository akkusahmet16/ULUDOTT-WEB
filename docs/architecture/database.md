# Veritabanı Mimarisi ve Şema Tasarımı

Güncelleme: Kasım 2026 (v0.2 Final Sürümü).  
Altyapı: PostgreSQL 17 / Drizzle ORM.  
Veritabanı bağlantı havuzu: `src/lib/database/index.ts` üzerinden `server-only` sınırıyla yönetilir.

---

## 1. Mimari Prensipler ve Tasarım Kararları

1. **Katmanlı İzolasyon ve Server-Only Sınırı:**
   Veritabanı modelleri ve sorguları yalnızca sunucu tarafında çalışır. İstemci bileşenleri hiçbir zaman veritabanı sürücüsünü içe aktaramaz.
2. **Transaction ve Audit Bütünlüğü:**
   İş kuralı mutasyonları `withTransaction` yardımcısı ile yürütülür. Her kritik işlem (onay, ret, durum değişikliği, ayar güncellemesi) aynı işlem bloğunda `audit_logs` tablosuna ve gerekiyorsa `outbox` kuyruğuna yazılır.
3. **No Cascade Delete:**
   İlişkili tablolarda sessiz silinmeleri (`ON DELETE CASCADE`) engellemek için doğrudan dış anahtarlar `NO ACTION` veya `RESTRICT` kurallarıyla korunur. Veri silme işlemleri kontrollü yazılımsal temizlik (soft-delete veya denetimli retention worker) ile yapılır.
4. **Idempotency ve Eşzamanlılık Koruması:**
   Aynı anahtarla gelen mükerrer istekler `idempotency_records` tablosunda atomik olarak kilitlenir. Eşzamanlı işlemlerde çifte kayıt veya kontenjan aşımı veritabanı kısıtlarıyla engellenir.
5. **JSONB ve Sürüm Kontrolü:**
   Form şemaları (`form_rules`, `form_fields`), dinamik CMS ayarları (`site_settings`), geliştirici künyeleri ve fanzin galeri öğeleri JSONB olarak saklanır ve her kayıtta artan pozitif `revision` alanı denetlenir (`CHECK (revision > 0)`).

---

## 2. Modüller ve Tablo Envanteri (13 Alan / 48 Tablo)

### A. Yönetici ve Yetkilendirme (Admin & Auth)
- `admins`: Yönetici kullanıcıları, normalize e-posta, parola karması (Argon2id), durum ve kilit zamanları.
- `admin_roles`: Yöneticilere atanan roller (superadmin, event_manager, reviewer vb.).
- `admin_sessions`: Oturum anahtarları (hashlenmiş), son erişim ve geçerlilik süreleri.
- `admin_event_scopes`: Yöneticinin işlem yetkisine sahip olduğu etkinlik kısıtları.
- `audit_logs`: Yönetici eylemleri, aktör ID, işlem türü, hedef kaynak, IP ve zaman damgası.

### B. Etkinlik ve Yayıncılık (Events & Content)
- `events`: Topluluk etkinlikleri, slug, durum (draft, published, cancelled, archived), başlama/bitiş tarihleri, konum ve kapasite.
- `event_categories`: Etkinlik kategorileri (Game Jam, Coffee Talk, Atölye vb.).
- `event_years`: UluJam ve etkinlik arşiv yılları.
- `announcements`: Etkinlik duyuruları, afiş referansları ve yayın durumları.
- `featured_slots`: Ana sayfada öne çıkan etkinlik yerleşimleri.
- `event_gallery`: Etkinliğe bağlı galeri görselleri ve sıralama.
- `content_redirects`: Değişen içerik slugları için kalıcı yönlendirme kayıtları.

### C. Medya Yönetimi (Media)
- `media_assets`: Orijinal yüklenen görseller, dosya boyutu, MIME türü, EXIF/hash bilgisi ve alt metin.
- `media_variants`: Farklı ekran boyutları için üretilmiş optimize WebP/AVIF türevleri.

### D. Formlar ve Başvurular (Forms & Submissions)
- `forms`: Dinamik form şablonları, slug, durum ve başvuru pencereleri.
- `form_versions`: Değişmez (immutable) form sürüm anlık görüntüleri (snapshot).
- `form_fields`: Sürüme bağlı form alanları (metin, sayı, radyo, seçim, dosya vb.).
- `form_rules`: Alanlar arası görünürlük koşulları ve doğrulama kuralları.
- `submissions`: Form başvuruları, benzersiz başvuru kodu, onay/ret statüsü.
- `submission_answers`: Başvurulan alanlara verilen cevaplar ve dosya referansları.
- `submission_status_history`: Başvuru durumu değişiklik geçmişi ve gerekçesi.
- `consents`: KVKK ve açık rıza onay kayıtları.

### E. UluJam ve Eşleştirme Sistemi (UluJam & Matching)
- `applications`: UluJam katılımcı başvuruları, mod tercihi (solo, team, team-seeker, solo-open).
- `application_skills`: Katılımcının yetenek seviyeleri (1–5 arası yazılım, tasarım, ses, müzik, hikaye).
- `teams`: UluJam takımları, takım adı, kontenjanı, durumu.
- `memberships`: Takım üyelikleri, lider/üye rolleri, ayrılma zamanları.
- `team_approvals`: Takım kadro revizyonu onay kararları.
- `team_access`: Takım yönetim portalı için hashlenmiş erişim anahtarları.
- `team_sessions`: Takım lideri aktif oturumları.

### F. Oyun Kataloğu ve Dereceler (Games & Awards)
- `games`: UluJam ve topluluk oyunları, başlık, açıklama, itch.io URL, kapak görseli.
- `game_credits`: Oyunda emeği geçen geliştiricilerin ad ve rıza durumları.
- `awards`: Yarışma dereceleri (1., 2., 3. ve özel kategori ödülleri).
- `finalists`: Jüri değerlendirmesine kalan finalist oyunlar.
- `site_game_entries`: Ana sayfa ve harici vitrin için öne çıkarılan oyun kayıtları.

### G. Katılımcı Kartları ve Dijital Cüzdan (Cards & Wallet)
- `cards`: Katılımcı için üretilen benzersiz dijital kimlik kartı ve check-in durumu.
- `wallet_passes`: Google Wallet (ve ileride Apple Wallet) kart nesnesi ve durumu.
- `apple_devices`, `apple_registrations`: Apple Wallet cihaz kayıtları ve bildirim anahtarları.

### H. Link Merkezi (Link Hub)
- `link_groups`: Link kategorileri ve sıralama düzeni.
- `links`: Kısa linkler, hedef doğrulanmış URL, QR kod anahtarı, tıklama sayacı.

### I. Fanzin ve Çevrimiçi Okuyucu (Fanzin & Flipbook)
- `fanzin_issues`: Fanzin sayıları, başlık, yayın sezonu, yıl, PDF dosya yolu ve kapak görseli.
- `fanzin_pages`: Fanzin sayılarına ait sayfa detayları, sayfa tipi, HTML içerik, yazar ve galeri öğeleri.

### J. Site İçerikleri ve CMS Ayarları (Site Settings & People)
- `site_settings`: Ana sayfa, hakkımızda, iletişim, mekanlar ve sponsorlar için dinamik JSON ayarları.
- `people_overrides`: Topluluk üyeleri ve konuşmacı slotları için özel içerik güncellemeleri.

### K. Analitik ve Ziyaretçi İstatistikleri (Analytics)
- `site_page_views`: Anonimleştirilmiş sayfa görüntülemeleri, referer analizi ve ziyaretçi karması.

### L. Operasyon ve Kuyruk Motoru (Operations & Outbox)
- `outbox`: Transactional outbox kuyruğu, bekleyen e-posta ve harici bildirim işleri, retry sayaçları ve kilitler.
- `idempotency_records`: API istek idempotency anahtarları ve yanıt önbelleği.
- `rate_limits`: IP/kullanıcı bazlı istek frekans takip tabloları.
- `retention_runs`: Veri saklama ve otomatik KVKK anonimleştirme çalıştırma kayıtları.

---

## 3. Migration ve Veritabanı Komutları

```sh
# Drizzle schema değişikliklerinden yeni migration dosyaları üretir
pnpm db:generate

# Migration dosyalarının metadata tutarlılığını doğrular
pnpm db:check

# Bekleyen migration'ları hedef veritabanına uygular
pnpm db:migrate

# 2026 yılı tarihî oyun ve derece verilerini idempotent olarak ekler
pnpm db:seed:2026

# UluJam taslak başlangıç verilerini ekler
pnpm db:seed:ulujam
```
