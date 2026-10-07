# Development

## Clean installation

Clone the private repository, install the configured Node/npm versions and run `npm ci`. Dependency changes include the root package-lock.json. Do not create package-specific lockfiles. `npm run dev` builds the standalone runtime and starts Vite. Python is needed separately for selected evidence-generation scripts, not for ordinary application builds.

## Commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | Packages, applications, scripts and test types |
| `npm run check:boundaries` | Forbidden cross-package imports |
| `npm run build:framework` | Library and standalone runtime |
| `npm run build:ai` | Generation package |
| `npm run build:editor` | Editor and demonstration |
| `npm run build:docs` | Reference and RU/EN manuals |
| `npm run build:server` | API and initializer executables |
| `npm run build` | Complete release in dist/site |
| `npm test` / `npm run test:ai` | Unit checks |
| `npm run test:browser` | Three browsers on a dedicated server |

Editor and documentation builds prepare their library prerequisite automatically. They neither download nor start a model. Rebuild the standalone runtime after modifying the library; the complete build always performs this step.

Run `npm test -w @alabuga/framework`, `npm test -w @alabuga/ai`, `npm test -w @alabuga/editor` or `npm test -w @alabuga/ai-server` for the relevant unit group. After `npm run build:docs`, `npm test -w @alabuga/docs` checks documentation independently; the complete `npm run check:docs` additionally checks cross-application links. `npm run test:release` checks the built application without Ollama and saves offline examples, a PDF and screenshots. Optional asset/PDF scripts use `python -m pip install -r scripts/requirements-assets.txt`; generated WOFF2 assets are already included.

## Adding an element or composition

Define an element in the schema and shared renderer, then add editor properties and documentation examples. A composition defines semantic slots, supported components, grid variants and text limits. Test identifier preservation, layout switching, export and mobile order. Public APIs must not depend on editor internals.

A provider implements AIProvider, returns data matching the supplied schema and honours AbortSignal. Test malformed JSON, timeouts, cancellation and unavailable services. Measurement and layout remain constructor responsibilities.

## Pull requests

Use a small branch for one task. Describe the problem, resulting behaviour, compatibility and validation. Include screenshots for visual changes, old-document tests for schema changes and negative scenarios for APIs. Shared-library changes require consumer tests. Update Russian and English documentation together.

Do not commit model weights, local projects, secrets or complete test-artifact directories. Assign area owners after creating the repository; this preparation does not invent GitHub usernames.
