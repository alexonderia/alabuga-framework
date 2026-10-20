#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
: "${AGE_IDENTITY:?Set path to age private identity}"
archive="${1:?Usage: restore.sh BACKUP.tar.age}"
test -f "$archive"
docker compose stop registry
trap 'docker compose start registry >/dev/null' EXIT
# Restore to a new, empty storage volume; config/htpasswd are extracted for operator review.
test "${RESTORE_EMPTY_VOLUME:-}" = yes || { echo 'Set RESTORE_EMPTY_VOLUME=yes after selecting a fresh Compose project/volume' >&2; exit 1; }
mkdir -p secrets/restored
age -d -i "$AGE_IDENTITY" "$archive" | docker compose run --rm -T --no-deps --user 0 --entrypoint sh -v "$(pwd)/secrets/restored:/restore" registry -c 'test -z "$(ls -A /verdaccio/storage)" && tar -C /restore -xf - && cp -a /restore/storage/. /verdaccio/storage/ && chown -R 10001:65533 /verdaccio/storage'
echo 'Restore reviewed conf/config.yaml and conf/htpasswd from secrets/restored before starting registry.'
trap - EXIT
