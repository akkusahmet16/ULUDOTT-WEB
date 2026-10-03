# Form işletimi

`/admin/formlar` taslak ve sürüm, `/admin/formlar/[formId]` alan/koşul/önizleme/yayın/kapatma. 15 tür; dosya kapalı. Eski yayın snapshot'ı değişmez; etiket değişimi bile yeni sürümdür. [Tanım](form-definitions.md), [panel](form-management.md), [açık gönderim/makbuz](form-submission.md).

Kapasite/bekleme/tekrar/pencere DBtransaction'da yeniden kontrol edilir; CSRF ve idempotency zorunlu. UluJam normalize eposta/event tekil; genelCoffeeTalk takım/Wallet kurallarını almaz. `/admin/basvurular` scoped arama/filter/cursor/status; CSV/XLSX formül injection korumalı, kişisel export dosyasını yetkili kanal ve retention ile yönet. [Başvuru yönetimi](submissions.md), [veri hakları](data-rights.md), [saklama](../security/retention.md). Worker retention gerçek silme/revoke yapar; hukuk metni canlı incelemesi açık.
