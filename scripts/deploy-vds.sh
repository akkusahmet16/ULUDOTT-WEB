#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo "  ULUDOTT WEB - VDS Canlı Dağıtım Betiği"
echo "=================================================="

# 1. Proje dizini tespiti
DEPLOY_DIR="/srv/uludott"
if [ -d "/srv/uludott/current" ]; then
  DEPLOY_DIR="/srv/uludott/current"
fi

echo "==> Dağıtım dizini: $DEPLOY_DIR"
cd "$DEPLOY_DIR"

# 2. Git güncellemelerini çek
echo "==> 'uludott-web-final' dalından son sürüm çekiliyor..."
git fetch origin uludott-web-final
git checkout uludott-web-final
git pull origin uludott-web-final

# Ortam değişkenleri
if [ -f "/etc/uludott/runtime.env" ]; then
  echo "==> /etc/uludott/runtime.env yükleniyor..."
  set -a
  # shellcheck source=/dev/null
  source /etc/uludott/runtime.env
  set +a
  if [ ! -f ".env.local" ] && [ ! -L ".env.local" ]; then
    ln -sf /etc/uludott/runtime.env .env.local
  fi
fi

# 3. Bağımlılıkları güncelle
echo "==> Bağımlılıklar yükleniyor (pnpm install)..."
pnpm install --frozen-lockfile

# 4. Veritabanı şema geçişleri
echo "==> Veritabanı şeması güncelleniyor (pnpm db:migrate)..."
pnpm db:migrate

echo "==> SKS Topluluk Üye verileri senkronize ediliyor (pnpm db:sync:sks)..."
pnpm db:sync:sks || echo "    (Uyarı: Canlı SKS bağlantısı yapılamadı, mevcut veriler korundu)"

# 5. Üretim derlemesi
echo "==> Next.js üretim derlemesi alınıyor (pnpm build)..."
pnpm build

if [ -d ".next/standalone" ]; then
  echo "==> Standalone statik varlıklar güncelleniyor..."
  mkdir -p .next/standalone/.next
  rm -rf .next/standalone/.next/static .next/standalone/public
  cp -R .next/static .next/standalone/.next/static
  cp -R public .next/standalone/public
fi

# 6. Servisleri yeniden başlat
echo "==> Servisler yeniden başlatılıyor..."
if systemctl is-active --quiet uludott-web; then
  systemctl restart uludott-web
  echo "    ✓ uludott-web yeniden başlatıldı."
elif systemctl is-active --quiet uludott; then
  systemctl restart uludott
  echo "    ✓ uludott yeniden başlatıldı."
fi

if systemctl is-active --quiet uludott-worker; then
  systemctl restart uludott-worker
  echo "    ✓ uludott-worker yeniden başlatıldı."
fi

# 7. Sağlık kontrolü
echo "==> Sağlık kontrolü yapılıyor..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://127.0.0.1:3000/ || curl -s -o /dev/null -w "%{http_code}" -k https://localhost/ || echo "000")
echo "==> HTTP Yanıt Kodu: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
  echo "=================================================="
  echo "  ✓ TEBRİKLER! Dağıtım başarıyla tamamlandı."
  echo "=================================================="
else
  echo "Uyarı: Servis yanıt kodu: $HTTP_CODE. Lütfen 'journalctl -u uludott-web -n 50' ile logları inceleyin."
fi
