# Kişisel veri haritası — Görev 27

Bu belge iç işletim yönergesidir; onaylanmış aydınlatma veya hukuki uygunluk beyanı değildir. Veri sorumlusu, iletişim, veri bölgesi, hukuki dayanak ve nihai saklama süreleri canlı başvuru açılmadan doğrulanmalıdır.

| Veri | Yer / amaç | Erişim | Süre / temizleme |
| --- | --- | --- | --- |
| Ad, e-posta, telefon, beceri ve form yanıtları | submissions/answers, applications/skills; etkinlik katılımı | Etkinlik kapsamlı applications.read/write/export | Başvurunun expires_at zamanı; worker yanıtı siler, bağlı kişiyi temizler |
| Rıza sürümü, amaç, zaman, geri çekilme | consents; verilen yanıtın kanıtı | Aynı etkinlik yetkisi | Başvuruyla birlikte silinir; hukuki kanıt süresi işletme/hukuk kararı gerektirir |
| Takım adı ve kişinin üyelik tarihçesi | teams/memberships; kadro onayı | Kapsamlı yönetici, mevcut takım oturumu | Süresi dolan kişinin tüm üyelikleri silinir; boş takım adı temizlenir ve erişimi kapatılır |
| Yayın adı ve yayın rızası | game_credits; isteğe bağlı oyun künyesi | Editoryal süreç ve kişinin onayı | Süresi dolan kişide yayın adı/rıza bağlantısı temizlenir, oyun yayından kaldırılır |
| Makbuz, takım ve QR erişimi | hash + gereken yerlerde şifreli token | Yetkili sunucu; özel bağlantı | Replay 24 saat; başvuru süresinde makbuz; temizlikte erişim iptal edilir |
| Wallet kişi/takım/QR | cards + harici Google Wallet nesnesi | Onaylı kart ve sunucu adapter | Yerel kart iptal/QR silme, outbox ile sağlayıcıya INACTIVE ve kişisel alanları temizleme isteği |
| Oturumlar, rate limit, idempotency | admin/team sessions, rate_limits, idempotency_records | Sunucu | Süresi dolan satırlar worker tarafından temizlenir |
| Denetim ve operasyon kanıtı | audit_logs, retention_runs, outbox | Yetkili işletim | Hak talebi audit yalnızca kimlik/sürüm/sayı; retention_runs 30 gün. UUID bağlantıları ve sağlayıcı teknik kimlikleri kişisel veriyle ilişkilendirilebilir, tam anonim sayılmaz |

Medya dosyaları hak talebi servisinin kapsamında otomatik yüz/kişi tanımasıyla aranmaz. Onaylı görsellerin aidiyeti ve S3/yedek silinmesi işletim kontrolü gerektirir. Yönetici hesapları ayrı kimlik yaşam döngüsündedir; katılımcı talebi başka yönetici veya katılımcının verisini dışa aktarmaz.

Hak talebinde personId etkinlik içindeki submissions.id değeridir; e-posta üzerinden farklı etkinlikleri birleştiren genel kişi dizini oluşturulmaz. Şifreler, hashler, özel bağlantılar, QR sırları, servis anahtarları ve diğer takım üyeleri veri teslimine dahil edilmez.
