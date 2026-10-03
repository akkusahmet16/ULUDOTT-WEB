# Rol ve erişim haritası

Kaynak `src/modules/admin/domain/permissions.ts`; bütün mutasyonlar sunucuda varsayılan ret ile korunur. Navigation görünürlüğü yetkilendirmenin yerine geçmez.

| Kimlik | Erişim | Sınır |
|---|---|---|
| Genel ziyaretçi | Yayımlanmış içerik ve açık form | Kişi/takım/admin veri yok |
| Başvuru capability | Kendi makbuz/kart/onay durumu | Token hash/encrypted; süre ve revoke; halka açık listede token yok |
| Takım oturumu | Kendi kadro özeti ve oyun taslağı | Başka takım/ham iletişim alanı yok; erişim reseti oturumu sonlandırır |
| content_editor | İçerik/yayın/link/medya ve oyun editoryali | Başvuru/takım kişisel veri yok |
| event_manager | Atanmış etkinliğin form/başvuru/export/takım/onay/kart/Wallet işlemleri | `eventScopes` zorunlu; global content/link/media/games.edit izinleri mevcut allowlist'e göre |
| system_admin | Admin/rol yönetimi, sistem/outbox sağlık ve izinli retry | Tek başına başvuru kişisel verisi okuyamaz |
| Worker | İşin referans verdiği minimum kayıt ve güncel uygunluk | Tarayıcı hesabı yok; aggregate→card→application→event bağı kontrol edilir |

Birleşik roller açık atamayla birleşir. Content publication global içerik editöründe; event manager için etkinlik kapsamı gerekir. Admin parola+TOTP, güvenli cookie, CSRF, süre/yenileme ve audit; [bootstrap](../operations/admin-bootstrap.md). Yetkisiz/cross-event/cross-team kontrolleri `tests/security/authorization.test.ts` ve integration dashboard/team/approvals testlerindedir.
