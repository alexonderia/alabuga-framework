#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
account="${1:?Usage: create-user.sh ACCOUNT}"
[[ "$account" =~ ^[a-z][a-z0-9-]{2,63}$ ]] || { echo 'Invalid account name' >&2; exit 1; }
command -v htpasswd >/dev/null || { echo 'Install apache2-utils first' >&2; exit 1; }
mkdir -p secrets
test -f secrets/htpasswd || install -m 600 /dev/null secrets/htpasswd
htpasswd -B -C 10 secrets/htpasswd "$account"
# Verdaccio runs as uid 10001. The file is a read-only container mount.
chown 10001:65533 secrets/htpasswd
chmod 640 secrets/htpasswd
