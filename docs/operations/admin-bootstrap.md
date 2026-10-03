# İlk yönetici kurulumu

Boş migration varsayılan hesap/parola yaratmaz. Node24.21, güvenli runtime env ve tamamlanmış migration gerekir. Kişiye gerekli roller ve etkinlikUUIDleri ayrı atanır; system_admin tek başına kişisel etkinlik erişimi almaz.

```sh
pnpm admin:bootstrap --role system_admin
pnpm admin:bootstrap --role event_manager --event EVENT_UUID
```

Komut gerçek TTY gerektirir; eposta/parola tekrar ve TOTP kodunu etkileşimli alır. En az14 karakter parola argümana/env'e yazılmaz. Kişiye özel MFA adresi ve tek kullanımlık recovery kodları terminalde gösterilir: kaydı paylaşma, güvenli doğrulayıcı/çevrimdışı kasaya al. Başarılı kurulum kodu yeniden kullanılamaz, sonraki 30 saniyelik kod ile `/admin` girişini dene. Tek kişinin ek rolü açıkça atanır; gelişigüzel global yetki verme. Ayrıntı/oturum kilit/kurtarma: [admin-auth](admin-auth.md). Docker worker hedefinde `-it` ile aynı CLI çalışır; secrets read-only mount edilir.
