# Görev 26–27 kabul kaydı — 3 Ekim 2026

Görevler kullanıcı isteğiyle sırayla uygulandı. Görev26 d700d33 commit'inde; Görev27 bu kabul kaydıyla ayrı commit edilir. Başlangıç ae2e79c. Uygulama ve ilerleme raporu işlem öncesinde okundu; her görev başında yerel web/worker durduruldu.

| Kontrol | Sonuç / yerel kanıt |
| --- | --- |
| Tüm birim/entegrasyon testleri | 44 dosya, 266/266; .local/task27-full-final.log |
| Üretim TLS tarayıcı kabulü | 50/50; .local/task27-e2e-final.log; nonce hydration ve HTML içi XSS engeli dahil |
| Veri hakları/Wallet/şema hedef testleri | 39/39; .local/task27-review-green.log |
| Lint, typecheck, production build | Temiz; task27-lint-final/types-final/build-final.log |
| Migration tutarlılığı ve yerel uygulama | db:check geçti; 0020–0021 seed olmadan uygulandı |
| Worker başlangıç/tek tur | worker --once başarıyla kapandı |
| Gerçek anahtar/derleme taraması | 2759 dosya; secretHits 0, forbiddenFiles 0; task27-wallet-scan.log |
| Kaynak/stage sır taraması | secretFileHits, forbiddenBuildFiles, stagedSecretHits tümü 0 |
| Üretim bağımlılık denetimi | Görev26 pnpm audit --prod: tüm önem seviyelerinde 0; bağımlılık değişmedi |

Tek bağımsız birleşik incelemede iki önemli bulgu düzeltildi: tarihî üyelik temizliği dolu takım kararını/kadrosunu değiştirmez; gizlilik nedeniyle oyun yayından alınması ilgili takım kartlarının derece sürümünü yeniler. Audit'teki yanlış değişen alan listesi yerine nötr sürüm kaydı kullanılır. Sağlayıcının kişisel alanları koruyan iptal cevabı kabul edilmez. İlgili başarısız davranışlar RED→GREEN ölçüldü. İlk suite şema listesi, rıza testindeki zorunluluk ve takım fixture seçim hataları raporda ayrı kaydedildi.

Yerel son kontrol: /ulujam ve /admin HTTP200; web ve worker yeniden başlatıldı. Ana DB kişi/takım/kart/pass/künye0, test DB0, test medya0; 2026 arşivi korundu (.local/task27-main-audit-final.log).

## Açık dış bağımlılıklar

- CDN/WAF sağlayıcı hesabı, gerçek alan adı/origin firewall ve canlı Turnstile anahtarları yerel testin dışında; gereken kurallar waf-rules.md içinde. Turnstile required yapılandırmada eksik token/anahtar fail closed, yerelde açık disabled durumdadır.
- ASVS 5.0.0 matrisi 345 kimlik için durum/kanıt ve bekleyen manuel kontrolleri gösterir; tamamı doğrulanmış sertifika iddiası değildir. Yük, yetkili pentest ve canlı kabul Görev28–29'dadır.
- Onaylı hukuk metni, veri sorumlusu/iletişim, kesin saklama süreleri ve veri bölgesi bekler; hukuki sayfa yayımlanmadı.
- Veri hakları servisleri sunucu içindir; insan işletmen talebi mevcut kanal/yüz yüze doğrular. Otomatik halka açık doğrulama/teslim endpoint'i eklenmedi.
- Teknik UUID/sağlayıcı iptal kayıtları tutulur; tam anonimleştirme, yedekten anında silme ve Wallet cihazından silinme iddiası yoktur. Google kişisel alan temizliği sahte protokolde ölçüldü; gerçek sağlayıcı/cihaz kabulü ayrıca gerekir. Apple24 ertelenmiştir.
- iOS “Geldi” ve katılım sonrası Wallet QR kaldırma talebi ilerleme raporunun en altında son inceleme için korunur; bu göreve eklenmedi.
