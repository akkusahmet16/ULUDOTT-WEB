# Yönetim Paneli Yeniden Kurulum Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Çaycı 2ce görünürlüğünü düzeltmek, duyuruları kaldırmak ve mevcut yönetim işlevlerini yeni, tutarlı panelde sunmak.

**Architecture:** PostgreSQL yayın/izin servisleri korunur. Yeni modül modeli ortak menü/ana ekranı sürer; yeni shell tüm admin sayfalarını kapsar. Etkinlik editörü ve Hakkımızda düzenleyicisi ortak çalışma alanı bileşenlerini kullanır. Bağımsız form, medya ve genel sayfa hataları paralel, dosya sahipliği ayrılarak düzeltilir.

**Tech Stack:** Next.js 16.3.8, React 19.3.0, TypeScript, Drizzle/PostgreSQL, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-admin-rebuild-design.md`

## Global Constraints

- Mevcut kirli çalışma ağacı ve kullanıcı verileri korunur; toplu commit/reset/dağıtım yoktur.
- Yerel Next.js belgeleri esas alınır; ürün bağımlılığı eklenmez.
- Oturum, CSRF, izin, audit ve revision denetimleri korunur.
- Hakkımızda/Oyunlar/UluJam/İletişim kalır; yalnız duyuru paylaşımı kaldırılır.
- Klasörden medya seçimi kullanıcı gereksinimidir; depo yüklemesiyle sessizce değiştirilmez.

## Review Focus

1. Üyesiz video bölümü görünmeli, silinen kişi geri dönmemeli — kişi entegrasyon ve tarayıcı testi.
2. Eski duyuru yolları ve menüleri erişilebilir kalmamalı — tarayıcı HTTP/menü kontrolü.
3. Menü ve kısayollar yönetici rollerini aşmamalı — modül modeli testi ve mevcut izin testleri.
4. Yayın/silme yeni görünümde yanlış kayda uygulanmamalı — gerçek etkinlik oluştur/yayın/kaldır ve revision testleri.
5. Türkçe medya, seçenek kimlikleri ve yeni UluJam yılı korunmalı — ilgili entegrasyon testleri.

### 1. Görünürlük ve duyuru temizliği

Files: `src/modules/community/people-content.ts`, `src/app/page.tsx`, `src/components/layout/header.tsx`; duyuru admin/public/API route dosyaları; `tests/integration/people-content.test.ts`, `tests/e2e/admin-content.spec.ts`.

- [x] Üyesiz video bölümü regresyonunu RED çalıştır.
- [x] Video içeren bölümü koru; silinen kişi durumunu değiştirme.
- [x] Duyuru paylaşım/listeler/menü ve API yollarını kaldır; boş duyuru tablosunu doğrula.
- [x] Site görünürlüğü ve 404 testlerini çalıştır.

### 2. Ortak panel ve içerik editörleri

Files: new `src/modules/admin/ui/admin-workspace.tsx`, `admin-workspace.module.css`, `src/modules/admin/domain/modules.ts`; modify admin layout/navigation/dashboard/page, people editor, event editor/page, generic content editor; tests `tests/unit/admin-modules.test.ts`, `tests/e2e/admin-rebuild.spec.ts`.

- [x] Rol/modül modeli ve yeni panel kabul testlerini RED çalıştır.
- [x] Ortak kabuk, mobil menü ve yetkiye uygun kısayolları oluştur.
- [x] Yeni genel bakış, aranabilir etkinlik editörü ve bölüm odaklı Hakkımızda düzenini uygula.
- [x] UluJam yılı alanını kayıt/önizleme ile eşleştir; yıl çakışmasını test et.
- [x] Galeriyi arşiv yönetimine birleştir; form bağlantılarını gerçek yetkiye göre sun.
- [x] Etkinlik ve kişi tarayıcı akışlarını doğrula.

### 3. Site incelemesindeki bağımsız hatalar

Files: public events page/EventCard/UlujamArchive; forms page/form-service/form-builder; gallery/game media consumers; link editor.

- [x] Genel sayfada Coffee Talk kopyası ve iptal etiketini düzelt.
- [x] UluJam formu oluşturmayı aç; seçenek görünen adları düzenlenirken kimliklerini koru.
- [x] Yeni WebP varyantlarını galeri/oyun araçlarıyla uyumlu hale getir.
- [x] Bağlantı kategorisi değişirken girilen verinin kaybolmasını gider.
- [x] Odaklı testler ve ilgili regresyonları çalıştır.

### 4. Son denetim

- [x] Bulguları `docs/operations/2026-10-20-site-audit.md` içinde düzeltildi/veri gerekli olarak raporla.
- [x] Tüm Vitest, ilgili tarayıcı testleri, typecheck, lint, üretim derlemesi ve whitespace kontrolünü doğrula.
- [x] Mobil/masaüstü yeni paneli görsel olarak incele; bağımsız son incelemeyi tamamla.
- [x] Geçici Next üretim/test yollarını temizle; kullanıcı sunucusunu açık bırak.

## Uygulama sonucu

Tamamlandı. Kullanıcı Hakkımızda, Oyunlar, UluJam ve İletişim yönetimlerinin kalmasını doğruladı. Bağımsız son incelemede bulunan gecikmeli form/kategori seçimi ve Hakkımızda filtrelerinde taslak kaybı giderildi. Son doğrulama: 365 Vitest testi; 18 farklı tarayıcı senaryosu (geniş koşu 17/18, optimize görsel kontrolü güncellendikten sonra ilgili iki senaryo 2/2); TypeScript, lint ve üretim derlemesi başarılı. Bulgular ve içerik gereksinimleri `docs/operations/2026-10-20-site-audit.md` dosyasındadır.
