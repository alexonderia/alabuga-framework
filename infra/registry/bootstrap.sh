#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
: "${REGISTRY_DOMAIN:?Set REGISTRY_DOMAIN}"
: "${ACME_EMAIL:?Set ACME_EMAIL}"
test -s secrets/htpasswd || { echo 'Create publisher and reader accounts first' >&2; exit 1; }
docker compose up -d --wait registry
# First issuance uses the standalone ACME listener before the HTTPS proxy starts.
docker compose --profile maintenance run --rm --service-ports -p 80:80 certbot certonly --standalone --non-interactive --agree-tos --email "$ACME_EMAIL" -d "$REGISTRY_DOMAIN"
docker compose up -d proxy
echo 'Configure a daily timer: docker compose --profile maintenance run --rm certbot renew --webroot -w /var/www/acme; docker compose exec proxy nginx -s reload'
