# Olay müdahale yönergesi

İç işletim belgesidir; bildirim süreleri ve muhataplar veri sorumlusu/hukuk tarafından canlı kabulde belirlenir. Mevcut olmayan irtibat veya hukuki onay uydurulmaz.

1. Olay saatini UTC, etkilenen ortamı ve bir vaka UUID'sini kaydet. İlgili erişim/audit/outbox kayıtlarını asgari metadata ile koru; özel bağlantı, anahtar, tam form yanıtı veya kimlik kopyasını genel rapora koyma.
2. Kapsamı sınırla: ilgili oturumları/tokenları iptal et, gerekli endpoint'i kapat, CDN/origin kuralını daralt. Delil korunmadan bütün logları silme. Hangi kişinin hangi etkinlik verisine erişildiğini kapsamlı yetkili incelemeyle belirle.
3. Sır sızıntısında ilgili servis anahtarını sağlayıcıda döndür; eski anahtarı iptal et, ortamı güvenli kanaldan güncelle ve istemci/build/git taramasını yeniden yap. Wallet iptalinde yeni revision oluştur, outbox sağlayıcı kabulünü bekle; yerel revoked sağlayıcı cihazından silinme kanıtı değildir.
4. Veri sorumlusu ve hukuk irtibatı etkiyi ve gerekli kişisel/kurumsal bildirimleri kararlaştırır. Talimat verilmeden mesaj gönderilmez. Sağlayıcı olay kayıtlarını ve veri bölgesini doğrula.
5. Temiz sürüm ve kontrollü geri yüklemeyle kurtar. Geri yüklenen başvurularda expiry temizliğini, token iptallerini ve Wallet reconcile işlemini dış erişimi açmadan tamamla. Bir yedek eski erişimi yeniden etkinleştirmemelidir.
6. Yetki/CSRF/cache ve ilgili regresyon testini geçir, sır taramasını kaydet, kapanışta olay sebebi, etki ve önleyici değişikliği yaz. Plan/ilerleme raporunu güncelle; gerçek kişi verisi veya sır ekleme.

İzleme: WORKER_UNAVAILABLE, tekrarlı provider hata kodları/dead outbox, olağandışı 403/429, başvuru temizliği gecikmesi ve yedek geri yükleme başarısızlığı. Alarm teslim/gerçek VDS/CDN tatbikatı Görev 28–29 canlı kabulüne aittir.
