# Private npm registry

Service definitions live in the repository-root `compose.yaml`, together with the documentation site. From the repository root, `docker compose up --build -d` starts docs and the local registry; `docker compose up --build -d docs` starts only docs. Create `infra/registry/secrets/htpasswd` with `create-user.sh` before starting the registry. Optional configuration is documented in `.env.example` at the root. Stop the previous docs and registry containers before using their ports in the combined stack. Do not run two registry containers against the same storage volume.

For HTTPS in the combined stack, export `REGISTRY_DOMAIN`, `REGISTRY_PUBLIC_URL=https://YOUR_DOMAIN`, and `ACME_EMAIL`. When migrating an existing production registry, also set `REGISTRY_STORAGE_VOLUME=alabuga-registry_storage`; the combined stack otherwise reuses `alabuga-registry-local_storage`. Certificate and challenge volumes keep their previous production names. From the root run:

```sh
docker compose up -d --wait registry
docker compose --profile maintenance run --rm -p 80:80 certbot certonly --standalone --non-interactive --agree-tos --email "$ACME_EMAIL" -d "$REGISTRY_DOMAIN"
docker compose --profile https up --build -d
# Renewal after initial issuance:
docker compose --profile maintenance run --rm certbot renew --webroot -w /var/www/acme
docker compose --profile https exec -T proxy nginx -s reload
```

Local registry access remains bound to loopback in the combined stack. The compatibility files `compose.local.yaml` and `compose.yaml` in this directory extend the root services and retain the separate deployment names. The production wrapper also removes the loopback port mapping. Existing `bootstrap.sh`, backup/restore scripts and the renewal timer continue to use that production wrapper. To operate a combined production stack with those scripts, set `COMPOSE_PROJECT_NAME=alabuga-framework` and the same `REGISTRY_STORAGE_VOLUME`/certificate volume settings in their environment (including `/etc/alabuga-registry.env` for the timer). For isolated restores choose a fresh Compose project and storage volume; never reuse a combined stack's fixed storage name.

Production runs separately from Constructor on a Linux Docker Compose host. Set REGISTRY_DOMAIN and ACME_EMAIL, point DNS to the host, and permit 80/443. Port 4873 has no public mapping. The image is pinned by version and digest.

Install apache2-utils and age on the operations host. Run `sudo bash create-user.sh framework-publisher`, then create one account per developer/application (constructor-ci and dependency-bot for CI). Registration and the web UI are disabled; all known users can read @alabuga/*, only framework-publisher can publish, and unpublish is disabled. No upstream fallback exists. `sudo -E bash bootstrap.sh` obtains the first certificate and starts HTTPS. Configure a daily certbot renewal and nginx reload using the command printed by bootstrap. Test certificate renewal before cutover.

Log in using `npm login --auth-type=legacy --registry=https://YOUR_DOMAIN/`. API tokens are JWT with a 30-day expiry; rotate secrets by day 25. Store publisher credentials only in the Framework release environment, read credentials in application Actions/Dependabot secrets. Tokens are not claimed to have npmjs token scopes: permissions are enforced by Verdaccio account ACL. In an incident stop access and rotate the signing secret/active tokens when necessary.

Use `node scripts/configure-registry.mjs https://YOUR_DOMAIN/` in each application before npm ci. It relocates only Framework archive URLs and preserves version and integrity. Keep credentials in user npm config. This is registry relocation, never an automatic dependency update. Build Docker with a BuildKit npmrc secret and the same HTTPS registry URL.

Set BACKUP_RECIPIENT to an age public recipient and BACKUP_TARGET to an off-server SSH path. Run backup.sh daily and immediately after every published release. Backups briefly stop writes and include package storage, metadata/signing secret, config and htpasswd. Retain 30 daily copies off-server; RPO <=24h, RTO <=4h. Monitor registry health, disk space, authentication errors, failed publications, TLS expiry and backup success.

Quarterly recovery: choose an isolated Compose project and empty storage volume, set AGE_IDENTITY, and run RESTORE_EMPTY_VOLUME=yes bash restore.sh BACKUP.tar.age. Review and restore extracted conf/config.yaml and conf/htpasswd, then start the new instance. Check old package integrity, read access and denied publication before replacing the live registry. Never restore on top of a non-empty volume.

Local validation can use the combined stack or `docker compose -f compose.local.yaml up -d` from this directory; both bind only to 127.0.0.1:4873. Create bcrypt htpasswd entries first; keep passwords/tokens in ignored .local and secrets directories. Local HTTP is only for loopback testing. Required acceptance: metadata/tarball deny anonymous access, readers install but cannot publish, publisher publishes, registration fails, restart preserves packages, a fresh restored volume returns identical integrity.

GitHub setup: create the private repository under alexonderia, protect main and version tags, configure ALABUGA_NPM_REGISTRY, and set FRAMEWORK_PUBLISH_TOKEN only in environment framework-release. Deploy registry configuration independently. Do not trigger Constructor workflows from library release events.


Automatic operations: install the renewal timer with sudo bash install-timer.sh after writing REGISTRY_DOMAIN to /etc/alabuga-registry.env. For encrypted backups, enable REGISTRY_BACKUP_ENABLED=true in GitHub repository variables and configure the registry-operations environment with REGISTRY_BACKUP_SSH_HOST, REGISTRY_BACKUP_SSH_KEY and REGISTRY_KNOWN_HOSTS. The SSH key must be restricted by a server-side forced command that runs backup.sh with server-held BACKUP_RECIPIENT/BACKUP_TARGET. The reusable workflow runs daily at 00:00 UTC and after a successful package release. Production acceptance requires enabling backups and testing restore; local development does not require a remote server.
