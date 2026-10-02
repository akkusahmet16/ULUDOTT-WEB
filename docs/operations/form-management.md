# Form yönetimi — Görev 11

/admin/formlar yalnız kapsamlı etkinlik yöneticisinin formlarını listeler. Yeni form için etkinlik, başlık, benzersiz slug, teşekkür metni, tarihler ve saklama ayarı girilir. forms.write + event scope gerekir; içerik editörü/sistem yöneticisi adı tek başına izin vermez.

Alan ekle; tür, etiket, yardımcı metin, zorunluluk ve tür ayarlarını seç. Seçenekler satır satır; sayı/karakter/seçim sınırları ilgili türde görünür. Açık rıza gerçek metin/sürüm/amaç ister. Yukarı/aşağı/sil düğmeleri klavyeyle kullanılır. Görünürlük alan/operatör/değer kontrolleri tek yaprak koşulu düzenler; mevcut birleşik koşul korunur, yeni referans seçilirse tek koşula dönüşür. JSON motoru and/or destekler; bu UI birleşik koşul editörü sağlamaz. Dosya türü seçilemez.

Mobil/masaüstü önizleme yanıt kaydetmez. Alanlar önce kaydedilir; kirli alan varken ayar/yayın işlemi engellenir. Yayın geçerli alan ve başlangıç ister; geçmiş bitiş ve ters pencere reddedilir. Bitiş opsiyoneldir. Tarihler İstanbul girilir, UTC saklanır. Yayın / devam ettir, Duraklat ve Kapat ayrı işlemlerdir. Yayımlı slug korunur; alan değişikliği yeni draft version olur, geçmiş yanıtları değiştirmez. API scoped yetki/revision/parent kilidi/metadata audit/CSRF/no-store uygular.

0008_form_settings: JSON ayarlar, paused ve same-form composite draft/current FK. Ana DB form/yanıt seed yok. Gönderim Görev 12, başvuru yönetimi Görev 13; gerçek içerik/hukuk onayı verilmiş sayılmaz.
