# Form şeması ve sürümler — Görev 10

Bu adım genel form veri sözleşmesini ve sunucu doğrulamasını sağlar. Yönetim paneli, actor yetkisi/audit, form durumunu yayınlama, HTTP başvuru kabulü ve makbuz akışları sonraki görevlerdedir. Repository çağrısı form status'ünü değiştirmez veya başvuru CTA'sı açmaz. Ana veritabanına form ya da örnek yanıt seed edilmez.

`validateFormDefinition(input)` normalize edilmiş `{schemaVersion:1,fields:[...]}` döndürür. Alanlar `{id,type,label,required,...config,condition?}` taşır; required varsayılan false. ID küçük harfli UUID'dir; düzenleyici aynı mantıksal alanın ID'sini sonraki sürüme aynen taşır. Etiket veya tip değişmesi geçmiş cevapların sürüm bağlantısını değiştirmez. Yeni mantıksal alan yeni UUID alır.

| Tür | Yanıt / yapılandırma |
| --- | --- |
| short_text / long_text | String; varsayılan 200 / 5000 karakter, maxLength en çok 5000 |
| email | Geçerli e-posta string'i; en fazla 254 karakter |
| phone | E.164 string'i; + ve 8–15 rakam |
| number | Sonlu JSON number; isteğe bağlı min/max |
| date | Gerçek takvim tarihi YYYY-MM-DD; artık yıl doğrulanır |
| single_choice / dropdown / radio | options içindeki value string'i |
| multiple_choice | Tekrarsız value string dizisi; minSelections/maxSelections |
| checkbox | Boolean; required ise true |
| rating | Tamsayı; varsayılan 1–5, yapılandırma sınırı 1–10 |
| info / section | Yanıt kabul etmez, required olamaz; info content gerektirir |
| consent | Boolean; content, consentVersion ve purpose gerekir; required ise true |

Seçenekler `{value,label}`; alan başına 1–50 benzersiz value. Rıza metni onaylı gerçek sürümle sonradan hazırlanır; motor metin üretmez ve consents kaydı yazmaz. Dosya türü desteklenmez. Bir tipe ait olmayan config, ek anahtarlar ve bilinmeyen türler reddedilir. Tanım 1–100 alan, JSON 100.000 UTF-8 byte / 10.000 düğüm / 16 yapısal derinlik sınırındadır.

Koşul yalnız JSON verisidir:

```json
{ "op": "eq", "fieldId": "10000000-0000-4000-8000-000000000001", "value": true }
```

`and` / `or` en çok 10 alt koşul alır. Yapraklar eq/neq (scalar), gt/gte/lt/lte (sayı/rating), contains (metin veya çoklu seçenek), in (en çok 50 aynı tür scalar), is_empty (value alamaz). Her referans yanıt veren mevcut alanı göstermelidir; yanlış tür/seçenek, self-reference ve döngü reddedilir. Referans alan gizliyse yaprak false olur; eksik/boş değerlerde sadece is_empty true olabilir. Böylece gizli alana gönderilen değer başka alanı açamaz. JavaScript, eval, Function ve üretilmiş SQL değerlendirmesi yoktur.

`evaluateVisibility(definition,answers)` görünür UUID'leri tanım sırasıyla döndürür. `validateSubmission(version,answers)` tanımı tekrar doğrular; sayı/boolean string coercion yapmaz. Bilinmeyen anahtar, yanlış tip/değer, bilgi alanı yanıtı veya gizli alanın gönderilmiş herhangi bir değeri hata verir. Görünür zorunlu alanlar denetlenir; yalnız boşluk metni zorunlu cevap sayılmaz. Opsiyonel e-posta/tarih gibi alan boşsa anahtar gönderilmez; gönderilen değer kendi tipine uymalıdır. Dönen cevaplar yalnız doğrulanmış UUID anahtarlarını içerir. Preview taslağı da doğrulanabilir; canlı kabul servisinin yayımlı/açık sürümü seçmesi Görev 12'nin sorumluluğudur.

`createDraftVersion(db,formId,definition)` forms parent'ını kilitler, yeni numaralı snapshot/field/rule satırlarını tek transaction'da kurar. `publishStoredVersion(db,versionId)` version'ı kilitleyip field/rule kayıtlarıyla tutarlılığı doğrular, sonra published_at mühürler. `readFormVersion` geçmiş tanımı snapshot'tan okur. Repository server-only iç katmandır; dış çağrılar Görev 11 actor servisinden geçer.

0007_form_versioning custom Drizzle migration iki fonksiyon/üç trigger içerir. Yayınlanan snapshot UPDATE/DELETE ve field/rule INSERT/UPDATE/DELETE reddedilir (SQLSTATE 23514). Taşınan çocuğun eski ve yeni version parent'ları UUID sırasıyla kilitlenir. Yayın ve alan yazısı aynı parent kilidiyle seri hale gelir; her iki yarış sırası gerçek PG testinde doğrulanır. Düzeltmeler ayrı sürümle yapılır, eski submission_answers version+field FK'si aynı kalır. DB owner'ın trigger devre dışı bırakma yetkisi uygulama akışı değildir; migration/deploy hesabı ayrımı canlı işletme kabulündedir.

Testler: 15 tür, bütün operatörler, hata/limit/required/gizli değer sınırları; gerçek PG'de v1/v2 geçmiş cevap/etiket koruma, immutable mutasyonlar, paralel sürüm numarası, tutarsız aynaların yayın reddi ve iki parent-lock yarışı. Son komut kanıtları ilerleme raporundadır.
