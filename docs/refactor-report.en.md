# Alabuga Framework refactoring — acceptance report

Date: 7 October 2026. [Русский](refactor-report.ru.md).

## Changes

One private npm-workspaces monorepo contains `packages/framework`, `packages/ai`, `apps/editor`, `apps/ai-server` and `apps/docs`. Builds are independent, with one lockfile, TypeScript validation and boundary checks. Document schema version 3 and the IndexedDB structure remain unchanged.

Public library entries separate validation, rendering, compositions, slide fitting and export. Schema validation works in Node without the DOM. Export receives explicit CSS/JS and an asset resolver; the library never accesses IndexedDB. Storage no longer imports editor export. Generation receives fitting through GenerationServices without importing the editor UI. The AI panel loads on demand.

The editor controller now delegates save serialization, export, zoom and keyboard commands. Existing navigation, canvas, properties, persistence and draft modules are retained. The save queue acknowledges only completed writes and prevents an older write completion from replacing the state of a newer edit.

Release builds produce `dist/site`, separate application outputs and four standalone examples. The AI bundle can be imported in Node; library declarations are built. The original snapshot is `artifacts/refactor/source-before.zip`, with checksums in the adjacent source-before.json. Snapshots, weights and full evidence directories are excluded from Git.

## Verified results

| Check | Result |
| --- | --- |
| Full browser regression | 264/264, Chromium, Firefox, WebKit, one worker, 10.3 minutes |
| Reference regression after RU/EN links | 3/3 |
| Unit checks | 21 library/editor/contracts + 33 AI/API + 3 initialization checks = 57 |
| TypeScript, boundaries, release build | Passed |
| RU/EN parity and HTML links | Passed; eight matching topics, 16 pages and a live example |
| Clean source copy without dist, models or local settings | npm ci → build → built application → offline export passed |
| Samples | Ten-section website and eleven-slide deck opened with networking blocked |
| PDF | Eleven separate pages in Chromium; all pages visually reviewed |
| Viewports | Screenshots at 390, 768, 1440 and 1920 px; mobile entry and deck reviewed |
| npm audit --omit=dev | Zero known vulnerabilities at verification time |
| Docker without a model | web/API build and startup, health and editor available |
| Development Docker | A CSS change on the Windows bind mount updated the open browser without restarting; API proxy passed |

Regression includes migration, revisions, trash, failed writes, cropping, undo, export, 100 projects and 50 slides with 500 elements. Tests used separate browser profiles without clearing author storage.

The initial post-move run found three stale link selectors: editor labels are neutral editable elements, while exported links remain real anchors. The selector was corrected without removing export checks. Another test reloaded WebKit before asynchronous persistence completed; it now waits for persisted content.

Intermediate runs concurrent with Ollama image extraction were not accepted: available RAM fell below 400 MB, causing timeouts and loss of the test server. The successful full run was isolated. Vite ignores generated artifacts, build outputs and local models. Browser tests own a dedicated server on port 4275 and never reuse the author's running server.

## Docker and model

Multistage images contain only the built site or API, excluding weights, original PPTX/PDF/TTC and test tools. The `ai` profile adds Ollama 0.35.0 and a one-shot initializer. Model and digest are pinned in `config/model-lock.json`; mismatches disable generation. API liveness and model readiness are separate.

A real interrupted download resumed after stopping containers and Docker Desktop: restart continued from 73% of the saved layer. Wrong digests, interrupted responses and retry were also covered by a separate mock service. Those checks are not presented as real-model measurements.

The new native build passed real inference: after warm-up, the section took 6.129 seconds and the slide 7.122 seconds, followed by editing, application, reopening and offline export. Context was 4096; Ollama reported `size_vram === size`. Observed peak usage was 2967 MiB out of 4096, across 177 samples at 250 ms intervals. These are Windows/Vulkan results, not container evidence. Artifacts: `artifacts/refactor/native-rehearsal`.

The real first download exposed a mismatch between the mutable registry tag and the historical pin: downloaded digest `0689d44085e0…`, expected `324d162be6ca…`. The guard correctly disabled AI. The pin was not changed. The exact original manifest is now retained, and all four of its files remain available from the official registry by SHA-256. Initialization downloads those files, validates each and only then publishes the manifest. Existing mismatched models are never overwritten. Interrupted files resume using HTTP Range, with separate regression coverage. The conflicting test model was removed only from the Docker volume created during this verification; the native original was preserved.

Container acceptance passed on Windows with Docker Desktop/WSL2: after warm-up, the section took 5.079 seconds and the slide 5.562 seconds. Editing, application, reopening and standalone HTML all passed. Context was 4096, with `size_vram === size` and 100% GPU placement. Observed peak was 3059 MiB out of 4096 across 346 samples at 250 ms intervals. The first cold probe, including loading/warm-up, took 66.56 seconds, so explicit warm-up is required before presenting. Artifacts: `artifacts/refactor/docker-rehearsal`.

The pinned download resumed from 35% after interruption. Following a Docker restart, initialization with `AF_MODEL_REGISTRY=http://127.0.0.1:1` succeeded without downloading: volume persistence and registry-independent startup were verified. The initializer streams files under a 512 MiB RAM limit. The installed Docker Desktop CLI once exceeded a 90-second stop timeout; after shutdown completed, another `docker desktop start` restored the engine and containers without data loss. This is a host Docker Desktop lifecycle limitation, not validation on a separate physical Linux machine.

## Documentation and GitHub

RU/EN manuals cover overview, authors, architecture, development, API, operations, recovery and quality. Sources live in `apps/docs/content`; built entry points are `/docs/ru/start.html` and `/docs/en/start.html`. Editor UI translation was excluded. The legacy Russian interactive reference remains available, alongside a bilingual live example in the new manuals.

Bilingual README/CONTRIBUTING, issue/PR templates, CI, a manual trusted GPU workflow, ignore rules, line endings and Git LFS for PPTX/PDF/TTC are prepared. Local Git is initialized. No remote repository or push was performed; organization and name remain undecided. Assign actual CODEOWNERS teams and configure protected GPU execution when creating the private repository.

## Limits and rollback

This refactor does not improve model content quality. The historical free-generation benchmark accepted 12/20 outputs by content. A new 20-prompt benchmark and author study are outside this stage; automation is not user research. A separate physical Linux/NVIDIA host was not tested.

Download portable projects before changing application origin: IndexedDB belongs to the browser origin, not Docker volumes. The normal address remains `http://127.0.0.1:4176`. To roll back source, extract the snapshot into a separate directory and use its lockfile. To roll back containers, select retained AF_WEB_IMAGE/AF_API_IMAGE tags and run `docker compose up -d --no-build web api`, preserving origin and volumes. Do not use `down -v` for normal updates or rollback.
