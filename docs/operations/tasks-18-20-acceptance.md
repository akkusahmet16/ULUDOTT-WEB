# Görev 18–19–20 kabul raporu

2 Ekim 2026. Görevler sırayla uygulandı:18 takım/solo kararları,19 özel kart ve ayrı check-in,20 oyun/finalist/derece yayını ve yapımcı açık yayın adı onayı.

## Doğrulama

- Son birim/entegrasyon koşusu:30dosya,220/220 (.local/task20-final-tests.log).
- Son üretim TLS tarayıcı koşusu:45/46; tek kart akışı toplam60s sınırını yerel dev derlemesi sırasında aştı. Önizleme kapatıldıktan sonra kaynak değiştirilmeden card-states2/2 geçti (.local/task20-final-card-retry.log). Önceki başarısız loglar korunur.
- Oyun2/2,2026 arşiv3/3 ve genel erişilebilirlik kontrolleri son tarayıcı koşusunda başarılı. Yeni sorgu arası rıza yarışı ve tüm altı review bulgusu gerçek PostgreSQL regresyonlarıyla RED→GREEN.
- Typecheck/lint/production build/db:migrate0017/db:check/sır taraması temiz. Ana DB kişi/takım/yapımcı/kart0; üç2026 URL ve bilinmeyen NULL alanları korunur. Test DB ve medya nesnesi artığı0.
- Mobil390px oyun ve kart görselleri gözle incelendi; ilgili axe kontrolleri0 ve taşma yok.

## Son inceleme

Bağımsız salt okunur reviewer264773b..f5e447c: Critical0,Important6,Minor0. Tek düzeltme turu65b97fd: atomik public snapshot; kapanmış/expired davetten minimal geri çekme; tamamlanmış2026 ve gerçek finalist arşivi; ilk yayın sonrası kalıcı slug; public cursor sayfaları; takım/kapak sayfaları ve seçili takım üyeleri. Son220/220 süit bu düzeltmeleri içerir. İkinci reviewer çağrılmadı.

## Çalışma düzeni

Her işlemde plan ve ilerleme raporu okundu. Önizleme görev başlangıçlarında durduruldu ve görev sonunda tekrar açıldı. Kapanışta http://127.0.0.1:3000/ulujam ve /oyunlar kullanılabilir. Yerel Next preview açık bırakılır. Mevcut development/bootstrap dalı ve commitler korunur.

## Kararlar ve maliyetleri

Aşağıdaki kronolojik kayıt, geri alınan geçici varsayımları da içerir. HEIC test süresi denemesi geri alınmıştır; ürün20s sınırı korunmuştur. Gerçek üretim dağıtımı, worker21 ve Wallet22 kabulü bu teslimin iddiası değildir.

- Task18: Ruling: onay kararı da kadro revision'ını artırıp ayrı approval satırı yazar — eski onaylı üyelerin dayandığı karar kaydı değişmez ve eski karar ekranı çatışır — maliyet: revision sayacı yalnız üyelik değişikliklerini saymaz.

- Task18: Ruling: solo başvuruya revision eklenir; HTTP bütün kararlar için expectedRevision ister — eşzamanlı onay/ret eski ekrana göre işlenmez — maliyet: mevcut applications tablosuna additive migration gerekir.

- Görev18 debug: ilk PG testinin toplam akışı5s test bütçesini aştı; sonraki async fixture önceki kapanışla çakıştı.20s tek-worker tanı koşusu2/2 başarılı, gerçek uzunluğu21s idi. Test ortamı2worker/30s test-hook bütçesine sabitlendi; ürün timeout/kilitleri değiştirilmedi. Ruling: sınırlı PG altyapısında ağır integration testine30s bütçe — test timeout'undan async cleanup çakışmasını önler — maliyet: gerçek takılma bildirimi daha geç gelir.

- Task18: Ruling: host load10 ve eşzamanlı browser/PG çalışması 30s integration/5s browser assertion bütçelerini aştı; testleri serial, Vitest1worker60s, Playwright1worker60s/15s assertion ile çalıştır — ürün timeout değişmedi; tek-worker onay+medya13/13 geçti — maliyet: takılan test daha geç bildirilir. Full suite203pass+3resourcefail sonrası13/13 targeted; tamamlanma iddiası bağımsız tekrar sonucuna dayanacak.

- Görev18 preview: session11624/listener28136 ana sayfa/admin200. Görev19 başlangıcında cwd doğrulanmış28130 durduruldu. BASE63648fb. Ruling: ayrı check-in kimliği encrypted olarak saklanır, private kart token yalnız kişiye ve encrypted idempotent makbuza verilir; takım özetinde token/QR/Wallet yok — maliyet: check-in şifreleme anahtarı yedeklenmelidir.

- Task19: Ruling: önceki cards=0 testleri artık aktif olmayan pending kart ve Wallet kayıtlarının yokluğunu denetler; takım sayfasında yetkili oturumla üye adı+durum gösterilir —19 sözleşmesi sınırlı özeti ister — maliyet: takım ortak parolası olan kişi kadro isimlerini görebilir; e-posta/telefon/token/QR görünmez. Check-in resolve/rotate için CSRF ve event-scoped yetki kullanılır; basit panel ekranı bu iptal akışını erişilebilir kılar.

- Görev19 preview session24437/listener29534,home200/private invalid404; private probe token logda yok.20 başlangıcında cwd doğrulanmış29528 durduruldu. BASEabf7c1e. Task20: Ruling: yeni tam oyun yayını başlık/açıklama/onaylı takım/onaylı yapımcı yayın adı ister; yapımcı adına yönetici rıza üretemez. Ayrı private yayın-onayı davetiyle sahibinin açık adı/rızası alınır, isim değişikliği rızayı sıfırlar — maliyet: yöneticinin davet bağlantısını gerçek sahibine güvenli iletmesi gerekir; sistem dışına otomatik mesaj gönderilmez. 2026 için doğrulanmış editoryal takım adı gerçek team/application kaydı uydurmadan saklanabilir; bu istisna yalnız bilinen2026 üç kaydındadır.

- Task20: Ruling: pure event_manager oyun düzenleme/davet okumada kendi event scope'u ile sınırlandırılır; content_editor editoryal oyun içeriğini yönetir fakat scoped games.publish olmadan yayımlayamaz — maliyet: iki rolün birlikte verilmesi editoryal global okuma hakkı sağlar. Davet kimliği başka application'a taşınırken veya external arşiv kişisi değiştirilirken token yenilenir; eski davet yeni kişi adına kullanılamaz. RED eski token lookup404 yerine yeni kişi pending403 dönüyordu; aktif iki üyeyle GREEN tekrar doğrulanacak.

- Task20: Ruling: yayın rızasını geri çekmek aktif katılım/etkinlik veya güncel form revision'ı gerektirmez; aynı geçerli davet kimliğiyle geri çekme daima adı NULL yapar, oyunu yayından indirir — maliyet: eski açık sahip sayfası yeni onayı geri çekebilir, ancak başkasına aktarılmış token geçersizdir. REDwithdrawn katılımcı403; GREEN tekrar koşusunda doğrulanacak.

- Task20: Ruling: full suite HEIC testinin kendi30s override süresi host load12 altında31s doldu; ortak60s integration bütçesine iki ağır HEIC testi de alınır — ürün işleme timeout değişmez — maliyet: takılan codec testi30s daha geç raporlanabilir. Fail koşusu saklandı; tekrar gerçek decoder testini doğrular.

- Task20: Ruling: kaynak uygulama bitmişken bağımsız son inceleme salt okunur olarak uzun regresyon koşusuyla paralel başlatılır — testler ayrı kaynak/DB kullanır, son tamamlanma tüm doğrulamalardan sonra kaydedilir — maliyet: testte yeni kaynak düzeltmesi çıkarsa aynı incelemenin görmediği değişiklik yalnız TDD ile denetlenir.

- Final: Ruling: yayın sonrası slug değişikliği engellenir; redirect alias yerine kalıcı ilk yayın adresi korunur — eski paylaşılan adres başka oyuna geçirilemez — maliyet: isim/adres değişiminde yeni slug için ayrıca yönlendirme tasarımı gerekir. Doğrulanmış2026 derece+URL, tam kişisel yayın geri çekilse de kaynak faktı olarak arşivde kalır; kişisel adlar yalnız tam published DTO üzerinden gelir — maliyet: tam oyun yayını kapatmak tarihî derece gerçeğini kaldırmaz.

- Final: Ruling: worker stale revision uygulaması21 ve gerçek Wallet sağlayıcı üretimi22 kapsamında kalır — bu tur revision/job ve aktif uygunluk temeli denetlenir — maliyet: worker/sağlayıcı kabulüne kadar cihaz kartı teslimi yok.

- Final: Ruling: canlı proxy/CDN log redaction, WAF ve VDS kapasite kabulü dağıtımda yapılır; KVKK retention süresi işletme/hukuk tarafından seçilir — yerel test canlı sistem/hukuk kanıtı değildir — maliyet: gerçek kişisel veri ve üretim açılışından önce bu dış kabul gerekir.

- Final: Ruling: private consent bearer davetinin gerçek kişiye güvenli teslimi manuel yönetici sorumluluğudur; panel rıza üretmez fakat token sahibinin kimliğini ayrıca kanıtlamaz — plan dışı kimlik sağlayıcısı eklenmez — maliyet: yanlış teslim/ayrıcalıklı yöneticinin token kullanması teknik olarak engellenmez.

- Final: Ruling: takımsız solo tam oyun yayını eklenmez —20 tam yayın onaylı takım ister — maliyet: solo oyun yayımlaması için yeni ürün akışı gerekir.

- Final: Ruling: approval geçmişi uygulama yolunda append-only; DBA müdahalesine ek immutability trigger eklenmez. Migration backfill ana DB kişisel kayıt0 varsayımını korur — ayrıcalıklı SQL/önceden kişisel veri kapsam dışında — maliyet: DBA geçmişi değiştirebilir; dolu başka üretim için backfill tasarlanmalıdır.

- Final: Ruling: private kart kurtarma ve kapsamlı üretim abuse katmanı bu tur eklenmez — minimum erişim/CSRF/scoped rate kontrolü korunur — maliyet: kayıp private bağlantı geri alınamaz ve üretim abuse kabulü ayrıca gerekir.

- Final: Ruling: değişmemiş2027 sayaç E2E dahil tekrar koşulur; son local preview/mobil kanıtı yürütücü tarafından yapılır. Generated snapshot JSON mekanik sayılır, SQL/journal/schema alignment incelenir — maliyet: eski kodun ve tüm snapshot satırlarının yeni derin denetimi yok.

Ertelenen minor bulgu: yok.
