#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
registry_dir="$(pwd -P)"
[[ "$registry_dir" =~ ^/[a-zA-Z0-9_./-]+$ ]] || { echo 'Unsupported installation directory' >&2; exit 1; }
test -f /etc/alabuga-registry.env || { echo 'Create /etc/alabuga-registry.env with REGISTRY_DOMAIN first' >&2; exit 1; }
sed "s|@REGISTRY_DIR@|$registry_dir|g" alabuga-registry-renew.service.in > /etc/systemd/system/alabuga-registry-renew.service
install -m 644 alabuga-registry-renew.timer /etc/systemd/system/alabuga-registry-renew.timer
systemctl daemon-reload
systemctl enable --now alabuga-registry-renew.timer
