# OWASP ASVS 5.0.0 kapsam ve kanıt matrisi

Kaynak: [OWASP sürüm 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0). 345 gereksinim kimliği envantere alınmıştır. Bu belge sertifika veya bütün ASVS maddelerinin geçtiği iddiası değildir. Aile kanıtları, ilgili kod/test sınırını gösterir; bir maddenin bütün alt koşullarını doğruladığı anlamına gelmez. Her madde için manuel eşleştirme/görev28 testi veya VDS kabulü bekleyen durum açıkça korunur. L3 maddeleri mevcut yerel kapsamın üstündedir.

Uygulama kanıtlarının final komutları görev26–27 kabul kaydında tutulur. Yerel WAF politika testleri CDN üzerinde canlı saldırı veya origin firewall testi değildir. Doğrulanmış hukuki metin ve sunucu girdileri olmadan ilgili operasyon/hukuk maddeleri kapanmaz.

| Kimlik | ASVS seviye | Durum / kapsam | Aile kanıtı / takip |
|---|---|---|---|
| V1.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.3 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.4 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.5 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.6 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.7 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.8 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.9 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.2.10 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.6 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.7 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.8 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.9 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.10 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.11 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.3.12 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.4.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.4.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.5.1 | 1 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.5.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V1.5.3 | 3 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/injection.test.ts; tests/security/xss.test.ts; tests/security/export-injection.test.ts |
| V2.1.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.1.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.3.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.4.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V2.4.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/form-submit.test.ts; tests/integration/team-capacity.test.ts; tests/security/turnstile.test.ts |
| V3.1.1 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.2.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.3.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.6 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.7 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.4.8 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.3 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.7 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.5.8 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.6.1 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.7.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.7.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.7.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.7.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V3.7.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/security/csrf.test.ts; tests/e2e/security-hardening.spec.ts |
| V4.1.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.1.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.1.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.1.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.2.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.2.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.2.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.2.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.2.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.3.1 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.3.2 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.4.1 | 1 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.4.2 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V4.4.4 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.2.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.2.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.2.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.3.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.3.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.4.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.4.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V5.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/uploads.test.ts; tests/integration/media.test.ts |
| V6.1.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.1.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.3 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.4 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.5 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.6 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.7 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.8 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.9 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.10 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.11 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.2.12 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.7 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.3.8 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.4.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.4.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.4.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.4.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.4.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.7 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.5.8 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.6.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.6.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.6.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.6.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.7.1 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.7.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.8.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.8.2 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.8.3 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V6.8.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.1.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.2.3 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.2.4 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.3.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.4.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.4.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.4.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.4.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.5.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.5.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.5.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.6.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V7.6.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/team-access.test.ts |
| V8.1.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.1.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.1.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.2.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.2.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.3.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.3.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.4.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V8.4.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/authorization.test.ts; tests/integration/dashboard-scope.test.ts; tests/integration/submission-admin.test.ts |
| V9.1.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V9.1.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V9.1.3 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V9.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V9.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V9.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V9.2.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; tests/integration/wallet-eligibility.test.ts |
| V10.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.2.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.2.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.3.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.3.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.3 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.4 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.5 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.6 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.7 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.8 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.9 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.10 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.11 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.12 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.13 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.14 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.15 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.4.16 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.5.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.5.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.5.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.5.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.5.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.6.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.6.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.7.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.7.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V10.7.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/google-wallet.test.ts; docs/operations/google-wallet-live-acceptance.md |
| V11.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.1.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.1.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.2.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.2.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.2.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.3.2 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.3.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.3.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.4.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.4.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.4.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.5.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.5.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.6.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.6.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.7.1 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V11.7.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/form-submit.test.ts |
| V12.1.1 | 1 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.1.3 | 2 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.1.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.1.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.2.1 | 1 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.2.2 | 1 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.3.1 | 2 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.3.2 | 2 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.3.3 | 2 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.3.4 | 2 | Bekliyor: VDS/alan adı/TLS kabulü; yerel TLS kanıtı kısmi | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V12.3.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; tests/e2e/security-hardening.spec.ts |
| V13.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.1.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.1.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.1.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.2.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.2.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.2.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.2.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.3.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.3.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.3.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V13.4.7 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/secrets.test.ts; .local/task26-audit.json; docs/security/waf-rules.md |
| V14.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.6 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.7 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.2.8 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V14.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/security/cache.test.ts; docs/security/threat-model.md |
| V15.1.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.1.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.1.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.1.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.1.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.2.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.2.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.2.5 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.1 | 1 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.6 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.3.7 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.4.1 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.4.2 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.4.3 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V15.4.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/data-retention.test.ts; docs/security/privacy-data-map.md |
| V16.1.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.2.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.2.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.2.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.2.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.2.5 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.3.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.3.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.3.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.3.4 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.4.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.4.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.4.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.5.1 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.5.2 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.5.3 | 2 | Kısmi uygulama kanıtı; madde bazlı manuel doğrulama görev28/29 | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V16.5.4 | 3 | Bekliyor: L3 / bağımsız inceleme kapsamı | tests/integration/admin-auth.test.ts; tests/integration/data-retention.test.ts; docs/security/incident-response.md |
| V17.1.1 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.1.2 | 3 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.1 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.2 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.3 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.4 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.5 | 3 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.6 | 3 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.7 | 3 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.2.8 | 3 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.3.1 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
| V17.3.2 | 2 | Uygulanamaz: bu mekanizma uygulamada yok | WebRTC yok |
