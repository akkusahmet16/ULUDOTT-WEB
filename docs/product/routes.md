# Ürün ve API rota haritası

3 Ekim 2026 kaynak envanteri. `[param]` dinamik; routegroup URL parçası değildir. Gizli tokenlı alanlar noindex/no-store.

| Rota | Katman | Erişim |
|---|---|---|
| `/kart/[token]` | sayfa | Capability/oturum + uygunluk; özel |
| `/takim/[token]` | sayfa | Capability/oturum + uygunluk; özel |
| `/yayin-onayi/[token]` | sayfa | Capability/oturum + uygunluk; özel |
| `/basvuru/[formSlug]` | sayfa | Yayımlanmış/açık kapsam |
| `/destek` | sayfa | Yayımlanmış/açık kapsam |
| `/duyurular/[slug]` | sayfa | Yayımlanmış/açık kapsam |
| `/duyurular` | sayfa | Yayımlanmış/açık kapsam |
| `/etkinlikler/[slug]` | sayfa | Yayımlanmış/açık kapsam |
| `/etkinlikler` | sayfa | Yayımlanmış/açık kapsam |
| `/hakkimizda` | sayfa | Yayımlanmış/açık kapsam |
| `/linkler` | sayfa | Yayımlanmış/açık kapsam |
| `/makbuz` | sayfa | Kendi makbuz capability erişimi; özel/no-store |
| `/oyunlar/[slug]` | sayfa | Yayımlanmış/açık kapsam |
| `/oyunlar` | sayfa | Yayımlanmış/açık kapsam |
| `/ulujam` | sayfa | Yayımlanmış/açık kapsam |
| `/admin/basvurular/[submissionId]` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/basvurular` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/check-in` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/duyurular` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/etkinlikler` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/formlar/[formId]` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/formlar` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/galeri` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/linkler` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/medya` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/oyunlar/[gameId]` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/oyunlar` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/sistem` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/takim-arayanlar` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/takim-onaylari` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/admin/ulujam-formu/[eventId]` | sayfa | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/` | sayfa | Yayımlanmış/açık kapsam |
| `/api/admin/announcements` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/approvals` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/assignments` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/check-in` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/csrf` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/events` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/forms/[formId]` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/forms` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/gallery` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/games/[gameId]` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/games` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/links` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/login` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/logout` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/media` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/outbox/[jobId]/retry` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/session/renew` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/session` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/submissions/[submissionId]` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/submissions/export` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/submissions` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/admin/teams/access` | HTTP | Admin MFA + işlem rolü/eventScope (login istisna) |
| `/api/cards/publication-consent` | HTTP | Capability/oturum + uygunluk; özel |
| `/api/forms/[formSlug]/submit` | HTTP | Açık özel sözleşme: CSRF/rate/idempotency gereken mutasyonda |
| `/api/forms/csrf` | HTTP | Açık özel sözleşme: CSRF/rate/idempotency gereken mutasyonda |
| `/api/links/[id]/qr` | HTTP | Açık özel sözleşme: CSRF/rate/idempotency gereken mutasyonda |
| `/api/submissions/receipt` | HTTP | Capability/oturum + uygunluk; özel |
| `/api/team/login` | HTTP | Capability/oturum + uygunluk; özel |
| `/api/team/logout` | HTTP | Capability/oturum + uygunluk; özel |
| `/api/ulujam/apply` | HTTP | Açık özel sözleşme: CSRF/rate/idempotency gereken mutasyonda |
| `/api/ulujam/teams` | HTTP | Açık özel sözleşme: CSRF/rate/idempotency gereken mutasyonda |
| `/api/wallet/google/[cardToken]` | HTTP | Capability/oturum + uygunluk; özel |
| `/api/wallet/status` | HTTP | Capability/oturum + uygunluk; özel |
| `/l/[id]` | HTTP | Yayımlanmış/açık kapsam |
| `/media/[variantId]` | HTTP | Yalnız yayımlanmış türev |

`/gizlilik`, `/aydinlatma`, `/cerezler` doğrulanmış hukuk metni gelmediğinden henüz uygulama rotası değildir; kapsam açık bağımlılık. Adminlogin/CSRF/session ve teamlogin için role/cookie kuralları işleyicidedir; route listesi tek başına güvenlik sözleşmesi sayılmaz. [Roller](roles.md), [veri hakları](../operations/data-rights.md), [son kabul](../operations/final-acceptance.md).
