# Yeni geliştirici değişiklik rehberi

İlk işlem: uygulama planı ve ilerleme raporunu oku, çalışan yerel web/worker'ı çalışma dizinini doğrulayarak durdur. `node_modules/next/dist/docs/` ilgili rehberini oku. Aynı modülde domain→application→infrastructure→UI akışını izle; yalnız route'a kural eklemek yeterli değildir. Bitince doğrulayıp yerel web/worker'ı aç.

| Değişiklik | Nereden / nasıl | Kanıt |
|---|---|---|
| Form alanı | `/admin/formlar/[formId]`; `src/modules/forms/domain` tip kaydı, validation ve condition AST; `form-service.ts` yeni taslak snapshot. Yayınlanmış sürümü UPDATE etme; UluJam alanı `src/modules/applications/domain/ulujam-input.ts` | `form-conditions`, `form-versions`, `form-service`, `ulujam-input` testleri; builder E2E |
| Renk / odak / hareket | `src/styles/tokens.css`; module CSS token kullanır. Odak ve kontrastı tüm durumlarda koru | shell axe, navigation E2E, gerçek klavye+ekran okuyucu; otomasyon tek başına WCAG iddiası değil |
| Etkinlik / afiş | `/admin/etkinlikler`, `/admin/medya`; `src/modules/events`, publication ve media servisleri. Gerçek tarih/konum, alt metin; slug redirect, expectedRevision | publication/media integration, featured-event/coffee-talk E2E |
| Link / sıra | `/admin/linkler`; `src/modules/links`, `src/lib/security/url-policy.ts`. HTTPS veya izinli site path, verified_at, sıralama transaction'ı | links integration ve link-hub E2E; bilinmeyen URL yayımlama |
| Takım kuralı | `src/modules/teams/domain` ve application; `submit-ulujam.ts`, matching assignment; `src/db/schema/ulujam.ts` constraint/migration | team-capacity/ulujam-application/assignment/approvals; son koltuk yarışı ve izolasyon |
| Wallet metni / alanı | `src/modules/wallet/google/google-pass.ts`, google adapter/service; eligibility `cards/domain/card-eligibility.ts` | google-wallet/worker-retry/wallet-eligibility ve kart E2E; gerçek demo/public ayrı, rawkey image içine girmez |

Bu altı yol dosya ve mevcut çalışan testlerle izlenerek doğrulandı; rehber denemesi için üretim kuralları/değerleri rastgele değiştirilmedi. Şema değişiminde yeni migration üret/incele; seed ayrı. Önce ilgili regresyon testi, sonra `pnpm ci:check`; yük maliyeti etkilenirse `pnpm test:load`. Sır scan ve üretim E2E atlanmaz. Eski form yanıtı, cross-event yetki ve eski Wallet job revision gerilememelidir. [Son kabul](../operations/final-acceptance.md) açık sağlayıcı bağımlılıklarını korur.
