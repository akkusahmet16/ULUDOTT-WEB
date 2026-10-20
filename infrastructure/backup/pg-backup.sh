#!/usr/bin/env bash
set -euo pipefail
umask 077

# TODO: sağlayıcı onayı bekliyor
# BACKUP_TARGET: operatörün hazırladığı, özel ve POSIX uyumlu hedef dizin/mount.
# Bu betik sağlayıcı seçmez, uzak bağlantı/upload veya hedef oluşturma yapmaz.
: "${BACKUP_TARGET:?BACKUP_TARGET mutlak hedef dizini gerekli}"
: "${BACKUP_RETENTION_DAYS:?Onaylanmış BACKUP_RETENTION_DAYS gerekli}"
[[ "$BACKUP_TARGET" == /* && -d "$BACKUP_TARGET" ]] || { echo 'Hedef mutlak, mevcut dizin olmalı.' >&2; exit 1; }
[[ "$BACKUP_RETENTION_DAYS" =~ ^[1-9][0-9]{0,3}$ ]] || { echo 'Saklama süresi 1–9999 tam gün olmalı.' >&2; exit 1; }
[[ -n "${PGSERVICE:-}" || -n "${PGDATABASE:-}" ]] || { echo 'PGSERVICE veya açık PGDATABASE gerekli.' >&2; exit 1; }
[[ "${PGDATABASE:-}" != *://* ]] || { echo 'PGDATABASE yalnızca DB adı olmalı; URI kullanmayın.' >&2; exit 1; }
for command in pg_dump pg_restore sha256sum find date mktemp flock; do
  command -v "$command" >/dev/null || { echo "Eksik araç: $command" >&2; exit 1; }
done
target=$(cd -- "$BACKUP_TARGET" && pwd -P)
[[ "$target" != / && -w "$target" ]] || { echo 'Kök dizin hedef olamaz; hedef yazılabilir olmalı.' >&2; exit 1; }

# Aynı hedefe eşzamanlı dump/retention çalışması yapılmaz.
exec 9>"$target/.uludott-pg-backup.lock"
flock -n 9 || { echo 'Bu hedefte başka yedekleme çalışıyor.' >&2; exit 1; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"
temporary=$(mktemp "$target/.uludott-pg-XXXXXX")
checksum_temporary=''
retention_list=''
cleanup() {
  [[ -z "$temporary" ]] || rm -f -- "$temporary"
  [[ -z "$checksum_temporary" ]] || rm -f -- "$checksum_temporary"
  [[ -z "$retention_list" ]] || rm -f -- "$retention_list"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

stamp=$(date -u +%Y%m%dT%H%M%SZ)
filename="uludott-pg-${stamp}-${temporary##*-}.dump"
archive="$target/$filename"
# Parola argv/log'a konmaz; libpq PGSERVICE/PGPASSFILE veya .pgpass kullanır.
pg_dump -Fc --no-password --lock-wait-timeout=10s --file="$temporary"
[[ -s "$temporary" ]] || { echo 'Dump boş; mevcut yedekler korunuyor.' >&2; exit 1; }
pg_restore --list "$temporary" >/dev/null
# Aynı dosya sistemi içinde atomik taşıma; var olan arşivi üzerine yazma.
mv -nT -- "$temporary" "$archive"
[[ ! -e "$temporary" ]] || { echo 'Arşiv adı çakıştı.' >&2; exit 1; }
temporary=''
checksum_temporary=$(mktemp "$target/.uludott-sha256-XXXXXX")
(cd -- "$target" && sha256sum -- "$filename") >"$checksum_temporary"
mv -nT -- "$checksum_temporary" "$archive.sha256"
[[ ! -e "$checksum_temporary" ]] || { echo 'Checksum adı çakıştı.' >&2; exit 1; }
checksum_temporary=''
(cd -- "$target" && sha256sum --check --status "$filename.sha256")

# Yalnızca başarılı yeni dump+SHA sonrasında, bu betiğin tam ad desenindeki
# eski normal dosya çiftleri temizlenir. Başka dosya, dizin veya symlink silinmez.
pruned=0
retention_list=$(mktemp "$target/.uludott-retention-XXXXXX")
find "$target" -mindepth 1 -maxdepth 1 -type f -name 'uludott-pg-*.dump' -mtime "+$BACKUP_RETENTION_DAYS" -print0 >"$retention_list"
while IFS= read -r -d '' candidate; do
  basename=${candidate##*/}
  [[ "$basename" =~ ^uludott-pg-[0-9]{8}T[0-9]{6}Z-[a-zA-Z0-9]{6}\.dump$ ]] || continue
  [[ "$candidate" != "$archive" && -f "$candidate.sha256" && ! -L "$candidate.sha256" ]] || continue
  rm -- "$candidate.sha256" "$candidate"
  pruned=$((pruned + 1))
done <"$retention_list"
printf 'Yedek ve SHA256 doğrulandı: %s; süresi dolan çift: %s\n' "$filename" "$pruned"
