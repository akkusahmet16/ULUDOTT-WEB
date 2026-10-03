# Takım işletimi

UluJam dört mod, zorunlu telefon/skill1–5/çoklu beceri notu; [ürünformu](../product/ulujam-form.md). `/admin/takim-arayanlar` yalnız yetkili etkinlikte adaylar ve açıklamalı öneri; atama transaction/son koltuk/revision kontrolüyle yapılır. `/admin/takim-onaylari` kadro ve revisiononayı/ret. Geçüyede onay yeniden gerekir; team approved etiketi tek başına yeniüyeye Wallet vermez. Solo/seeking ayrı uygunluk kararı. `/takim/[token]` kontrollü kendi kadro/oyun taslağı; ham iletişim/parola listesi verilmez.

Erişim reseti `api/admin/teams/access` üzerinden yetkili işlem; eski link/oturum revoke olur. Check-in admin uç noktası mevcut yerel kapsamda testlidir; gelecekteki iOS liste/WalletQRsilme akışı bunun tamamlanmış karşılığı değildir. [Aşama3](phase-3-acceptance.md), [kart/Walletdurum](wallet-status.md). Test: team-access/team-capacity/approvals/assignment/check-in integration ve team-page/approvals/card-states E2E.
