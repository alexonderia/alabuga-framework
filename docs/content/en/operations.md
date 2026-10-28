# Framework publishing and operations

## Preparing the current version 1.3.1

The candidate version comes from `package.json`. It requires a nonempty `docs/releases/1.3.1.md`; `npm run check:docs` verifies this file before the browser run. When changing the package version, add its corresponding `docs/releases/<version>.md`.

After the build, full Chromium/Firefox/WebKit run, package and consumer verification, run `npm run prepare:release`. It assembles the candidate in `artifacts/release-1.3.1/` and copies the review page to `dist/docs/releases/1.3.1/`; it does not publish. See [version changes](/index.html#changes/release-1-3-1).

## Release 1.1.0

The release adds source-based Select/List, DatePicker/Calendar, component sizes/states, the icon catalogue and the local Figma archive. Built JS/CSS delivery, existing APIs and document formats are preserved. Renderer links use `af-link--inline` and callouts use `af-alert--accessible`; component examples retain the source palette.

Version 1.1.0 review materials are preserved in `artifacts/release-1.1.0/`. See [version changes](/index.html#changes/release-1-1-0).

Version 1.1.0 was published on 2026-10-22 to authenticated local Verdaccio at `http://127.0.0.1:4873/`, tagged `latest`. The canonical Linux archive was published without repacking; integrity and a fresh registry installation passed. Manual screen-reader acceptance was explicitly deferred by the user and has not been performed. The release page includes a publication receipt; preparing the review again preserves this status. Some icon types lack original artwork in the saved export. An external production HTTPS endpoint is not connected yet.

## npm distribution

One @alabuga/framework package contains built ESM, Alabuga IIFE, CSS, declarations, fonts and assets. Application sources, model config, reports, secrets and LFS originals are excluded. LICENSE/UNLICENSED grants no open-source license for corporate materials.

Configure ALABUGA_NPM_REGISTRY and publishConfig.registry with the real HTTPS endpoint. test:package creates a checked tgz; test:consumers installs that archive. Release workflow validates vVERSION, runs checks, publishes the tested archive and verifies installed dist.integrity. Never repack or overwrite a published version.

## SemVer and updates

Patch preserves contracts, minor adds compatible features, and major breaks API/types/DOM/CSS/formats. Document/envelope versions are independent. Release a fix and deprecate a bad version instead of deleting it. New majors require migration guides/converters and six months of critical fixes for the previous major.

Constructor accepts updates in its own exact-version/lockfile PR and may skip versions. Framework publication never releases/deploys it. Real GitHub Releases and production publication have not yet run.

## Private registry

infra/registry supplies independently deployed Verdaccio 6.x pinned by version/digest, Nginx/HTTPS, disabled registration and Web UI. Anonymous metadata/tarball reads fail. Only framework-publisher publishes; application accounts read. JWT lasts 30 days; rotate by day 25. Runtime applications need no registry. Publisher credentials stay in Framework's release environment; Docker uses BuildKit secrets.

Take encrypted, consistent snapshots of storage, htpasswd, configuration and signing secret daily and after releases; retain 30 days off-server. Targets are RPO ≤24 h, RTO ≤4 h and quarterly recovery tests. Local restore passed; production HTTPS, off-server backup and recovery still need setup/acceptance. Commands are in infra/registry/README.md.

## Independent documentation

docker compose up --build -d docs serves static reference content on 4391. Build-time CONSTRUCTOR_URL configures return links; Vite uses VITE_CONSTRUCTOR_URL. The docs image builds without Constructor, its read token or local registry. Static output is dist/docs. Open the [editor]({{CONSTRUCTOR_URL}}/builder/).

The root compose.yaml groups the site and npm registry: docker compose up --build -d starts both services after registry accounts have been created. The https profile adds the proxy; maintenance provides Certbot for one-off tasks. Port, URL and volume settings are listed in .env.example. The test Dockerfile remains separate. Previous Compose files reuse the same service definitions; stop older containers on the same ports before switching. The local package volume keeps the name alabuga-registry-local_storage.
