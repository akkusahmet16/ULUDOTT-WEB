# Yerel UluJam demosu

Bu kurulum yalnız `LOCAL_DEMO_MODE=true` ve loopback `APP_URL` ile çalışır. Canlı VDS veya herkese açık alan adında çalışmaz. Gerçek UluJam 2027 tarihi ve başvuruları etkilenmez.

Yerel PostgreSQL ve obje deposunu açın, veritabanı göçlerini çalıştırın ve `.env.local` içinde `APP_URL=http://127.0.0.1:3001` ile `LOCAL_DEMO_MODE=true` ayarlayın. Geçici panel şifresini yalnız komut ortamında `LOCAL_DEMO_PANEL_PASSWORD` olarak verip `demo:setup` çalıştırın. Kurulum tekrar çalıştırılabilir; mevcut DEMO takım ve başvuruları çoğaltmaz.

Panel `/admin`, örnek başvuru `/basvuru/demo-ulujam-yerel`, takım adresi ise `.local/demo-access.json` dosyasındadır. Panel şifresi `.local/admin-panel-password.txt` içinde tutulur. Her iki dosya da Git tarafından yok sayılır ve yalnız dosya sahibi tarafından okunabilir. Takım parolası, makbuz ve kart erişimleri de özel erişim dosyasındadır.

Formun yayın durumunu `/admin/formlar` üzerinden durdurup açabilirsiniz. Kart önce beklemededir; yönetim onayından sonra web kartı etkinleşir. Google Wallet demo sağlayıcı adımı yalnız kullanıcı tarafından başlatılır. Apple Wallet ertelenmiştir.
