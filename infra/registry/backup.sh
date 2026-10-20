#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
: "${BACKUP_RECIPIENT:?Set age public recipient}"
: "${BACKUP_TARGET:?Set remote user@host:/absolute/backup/path}"
command -v age >/dev/null
mkdir -p backups
archive="backups/registry-$(date -u +%Y%m%dT%H%M%SZ).tar.age"
docker compose stop registry
trap 'docker compose start registry >/dev/null' EXIT
docker compose run --rm --no-deps --entrypoint tar registry -C /verdaccio -cf - storage conf | age -r "$BACKUP_RECIPIENT" -o "$archive"
docker compose start registry
trap - EXIT
scp "$archive" "$BACKUP_TARGET/"
find backups -maxdepth 1 -type f -name 'registry-*.tar.age' -mtime +30 -delete
