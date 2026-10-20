# Yönetim paneli içerik yenilemesi

Tarih: 20 Ekim 2026. Kullanıcının yedi maddelik talebi ilk üç işin uygulanması ve ardından kalan işlerin tamamlanması talimatları esas alınmıştır.

## Amaç ve kapsam

Site görünümünü koruyarak duyuruları, Hakkımızda kişilerini, oyunları, UluJam tanıtımını, başvurularını, yıllık arşivlerini ve iletişim bilgilerini panelden yönetmek. Yedi işin tamamı uygulanır.

## Ortak kurallar

- Next.js 16.3.8, React 19.3.0, mevcut PostgreSQL/Drizzle altyapısı kullanılır; yeni ürün bağımlılığı eklenmez. Yerel Next.js belgeleri esas alınır.
- Mevcut çalışma klasöründeki kullanıcı değişiklikleri ve etkinlik, takım, form, başvuru, oyun onayı akışları korunur.
- Panel mevcut koyu tema, tipografi ve vurgu renklerini kullanır. Telefon ekranlarında yatay taşma olmadan çalışır.
- Kişi ve oyun görselleri bilgisayardan yüklenmez; `public/community/03-hakkimizda/people/` ve `public/community/06-oyunlar/` altındaki dosyalar küçük önizlemelerle seçilir. Mevcut referans kişi medyası korunur. Klasör/dosya adlarında Türkçe karakter ve boşluk desteklenir. Sembolik bağlantılar ve kök dışına çıkan yollar kabul edilmez.
- Yazma işlemleri oturum, rol, CSRF, veri doğrulama, sürüm kontrolü ve aynı işlemde denetim kaydı gerektirir. Çakışma eski veriyi ezmez.
- Taslak, yayın ve silme/gizleme durumu açıkça belirtilir. Kişi düzenlemeleri mevcut davranışa uygun olarak kaydedilince görünür; kişi silme dosyayı silmez.

## 1. Duyurular

Mevcut duyuru servisleri ve ContentEditor genişletilir. `/admin/duyurular`, `/api/admin/announcements`, `/duyurular`, `/duyurular/[slug]` eklenir. Başlık, adres, kısa metin, içerik, afiş, isteğe bağlı etkinlik, bağlantı metni/adresi, yayın/kaldırma zamanı ve SEO alanları korunur. Başlıktan adres üretilebilir. Duyuru afişi aynı ekran üzerinden yüklenir, açıklama ve yayın hakkı onayı alınır; önizleme gerçek genel görünüm bileşenini kullanır. Taslak/yayın/arşiv ve yönlendirme davranışı mevcut servise dayanır. Duyurular ana sayfada da aynı kart bileşeniyle görünür; mevcut etkinlikler korunur.

## 2. Hakkımızda

Mevcut beş bölüm ve kişi verileri başlangıç içeriğidir. `people_overrides` tablosunda mevcut kişilerin alanları, bölüm ve sıra bilgisi; yeni kişi kayıtları ve silme işareti tutulur. Silinmiş başlangıç kişileri yeniden görünmez. Panelde kişi ekleme, düzenleme, bölüm değiştirme, sıra belirleme ve silme yapılır. İsim, görev, alıntı, satırlı bilgiler ve fotoğraf düzenlenir. Bölüm başlığı, görev, açılış videosu ve kapak mevcut editörde düzenlenmeye devam eder. Genel PeopleStory aynı kalır, veriyi dinamik alır; üyesi kalmayan bölüm gizlenir. Önceden yüklenmiş fotoğraf/video seçici ortak ve yalnız izinli köklere erişir.

## 3. Oyunlar

Oyunlar sayfasındaki mevcut iki editoryal kart başlangıç içeriği olarak panelde listelenir. Yeni `site_game_entries` tablosu bu kartların düzenlemelerini ve yeni kartları saklar; silme başlangıç kartlarını geri getirmez. Başlık, etiket, ekip/yapımcı metni, açıklama, itch.io adresi, yerel kapak, alternatif metin, sıra ve yayın durumu yönetilir. Taslak kart sitede görünmez. Genel kartlar mevcut `published-game-card` görünümünü ortak bileşen üzerinden kullanır; önizleme aynı bileşendir. Önceden yüklenmiş görsellerin seçimi sunucuda yeniden doğrulanır. Mevcut UluJam derece, finalist, takım ve yapımcı rızası yönetimi ayrı bölümde korunur; yeni editoryal kartlar bu rıza akışını taklit etmez veya değiştirmez.

## 4. Ana sayfa UluJam videosu

İzinli YouTube bağlantısı, kapak, başlık ve açıklama panelden düzenlenir. Mevcut açılır pencere korunur. Girilen URL doğrulanıp video kimliğinden güvenli gömme adresi üretilir; keyfi iframe HTML kabul edilmez.

## 5. UluJam başvuru yayını

Mevcut site içi form ve takım sistemi kullanılır. Panel güncel UluJam yılına form bağlar; açılış/kapanış, başlık, açıklama ve buton metnini yönetir. Ana sayfa kolonu ve UluJam sayfası aynı başvuru durumunu okur. Form kapanınca bağlantı gizlenir ve sunucu yeni başvuruyu da reddeder. Geçmiş başvurular saklama kurallarıyla korunur. Seçim geçmişi sunucuda tutulur; formu değiştirmek veya bağlantıyı kaldırmak önceki formu yeniden açmaz. Form soruları ve tarihleri mevcut Form oluşturucudan düzenlenir.

## 6. Çok yıllı UluJam arşivi

Yıl, tanıtım bilgisi, sıralı galeri ve derece oyunları panelden seçilir. Fotoğraflar `public/community/02-ulujam/` altından gelir. Her yıl aynı UlujamArchive bileşeniyle gösterilir; 2026 sabit metinleri ve görselleri yıl verisine dönüştürülür. Taslak ve yayından kaldırılan yıllar genel listeden çıkar.

## 7. İletişim ve alt bağlantılar

E-posta, telefon, giriş metni ve sıralı sosyal bağlantılar tek kaynaktan iletişim sayfası ile Footer'a bağlanır. Marka simgeleri korunur, eski sabit bağlantılar yeniden eklenmez. HTTPS, mailto ve tel ayrı doğrulanır; mevcut Bağlantı Merkezi içeriğiyle sosyal hesap ayarları ayrıştırılır.

## Kabul ve doğrulama

Tüm işler için: yerel dosya envanteri ve yol sınırı testleri, kişi ekleme/taşıma/silme ve sürüm yarışları, oyun taslak/yayın/gizleme ve varsayılan kartların korunması, duyuru oluşturma/yayın/kaldırma entegrasyon testleri; tarayıcıda panelden genel sayfaya akış, mobil görünüm ve önizleme kontrolü. Son olarak tüm Vitest testleri, typecheck, lint ve build çalıştırılır. Video URL güvenliği, form kapatma ve geçmiş seçimler, arşiv yayın/sıra ve 2026 eski yayın filtreleri, ortak iletişim bağlantılarının güncellenmesi/silinmesi de sınanır. Geçmeyen kontroller raporda açıkça belirtilir.
