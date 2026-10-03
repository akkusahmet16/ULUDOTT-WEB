# Mimari karar kaydı

| Karar | Neden | Bedel / yeniden değerlendirme |
|---|---|---|
| Modüler Next + ayrı Node worker | Tek ilişkisel transaction ve taşınabilir dağıtım | İki süreç izlenir; ilk Google Save senkron provider eşitlemesi web gecikmesine/DB kilidine katkı verir, sonraki retry worker üzerinden |
| PostgreSQL17, Drizzle, FK/unique/trigger | Üyelik/kontenjan/sürüm doğruluğu DB'de korunur | Migration tek çalıştırıcı; sürüm uyumu incelenir |
| DB outbox ve atomik DB rate-limit | Başlangıçta Redis hizmeti gerektirmez | Gerçek VDS yükü DB darboğazı gösterirse ayrı limiter değerlendirilir |
| Özel S3, yerelde Garage | 40 GB VDS'de medya/yedek yığılmaz | Canlı maliyet/veri bölgesi henüz seçilmedi |
| Node24.21/pnpm11.19 sabit lockfile | Tekrar kurulabilir runtime | Paket yükseltmeleri ayrı doğrulama gerektirir |
| HTML dinamik, nonce CSP | Her yanıta bağımsız nonce | SSR maliyeti; yerel k6 üretim kapasitesinin yerine geçmez |
| Rol + eventScopes | system_admin otomatik kişi erişimi almaz | Çok rollü hesap açık atanır; uygulama servisinde tekrar kontrol |
| Geçmiş2026 yalnız üç verilen URL | Bilinmeyen kişi/oyun/takım üretilmez | Başlık/görsel/credits editoryal doğrulama bekler |
| Apple24 erteleme; Google demo ayrı | Kullanıcı ücretli Apple hesabı yok; Google erişimi var | Public Google ve gerçek cihaz testi açık |
| Yerel çalışma; VDS/domain sonra | Kullanıcının yayın kararı | İnternette erişilebilir canlı site iddiası yok |

[Plan](../design/2026-10-02-uygulama-plani.md), [rapor](../operations/progress.md), [VDS değerlendirmesi](../operations/vds-assessment.md). Botun boşta ölçümü tepe tüketim kanıtı değildir; VDS'de derleme yerine CI paketi önerilir. Trafik/SLO, RPO/RTO, bütçe/veri bölgesi onaylanmadan sağlayıcı kesinleştirilmez.
