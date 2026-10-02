# UluJam özel form — Görev 15

Etkinlik yöneticisi Form yönetimi listesinden etkinliğin özel form önizlemesini açar. Oturum, forms.write ve etkinlik kapsamı sunucuda zorunludur. Genel etkinlikler bu ekranı açamaz. Ekran başvuru kaydetmez, takım parolasını doğrulamaz ve makbuz üretmez; Görev16 atomik kayıt servisini ekler. Gerçek 2027 tarihi boş ve etkinlik taslak kalır.

`buildUlujamFormDefinition(eventId, teams = [])` ortak FormVersion şeması ve güvenli koşul motoruna uygun tanım üretir. Alan kimlikleri sürüm kapsamında sabittir. Ad soyad, e-posta ve E.164 telefon zorunludur. Beş alan yazılım, oyun tasarımı, görsel sanat, ses-müzik ve anlatıdır. Seçilen her alan için tamsayı1–5 seviye, iki veya daha fazla alanda beceri açıklaması gerekir. Gizlenen alan yanıtları ortak renderer tarafından temizlenir. Oyuncu adı/takma ad yoktur.

Modlar: solo (tek başına), seeking (takım arıyor), new (takım adı ve kendisi dahil beklenen toplam kişi sayısı), existing (aynı etkinlikten takım seçimi ve parola). `validateUlujamInput(raw)` strict discriminated union kullanır; başka modun alanları, bilinmeyen alanlar, geçersiz/tekrarlı beceriler reddedilir. Yapısal kişi sayısı1–100 tamsayıdır; etkinliğin gerçek takım üst sınırı, e-posta tekilliği, takım kapasitesi/uygunluğu ve parola kontrolü Görev16 transaction'ında zorunludur.

Parola genel alan/answers, immutable snapshot veya export içine eklenmez. Özel geçici credential'dır; mod veya takım seçimi değişince temizlenir. Önizleme onu ağa göndermez ve tarayıcı storage'ına yazmaz. Görev16 password'ü yalnız takım erişim kontrolünde tüketmeli, audit/receipt/submission answer'a kopyalamamalıdır.

Önizleme gerçek DB'den aynı etkinliğin pending/approved/changes_requested takımlarının yalnız id ve adını okur; en çok50 seçenek, ad/id sırası. Liste boşsa sahte takım yerine boş durum gösterilir. Büyük takım listeleri için sayfalı seçim Görev16 entegrasyonunda ele alınmalıdır. Genel Coffee Talk formu bu özel doğrulayıcıyı çağırmaz.

Testteki DEMO kişiler/takım yalnız geçici fixture DB'sindedir. Canlı veri veya katılım onayı değildir.
