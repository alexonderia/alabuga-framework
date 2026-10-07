# Alabuga Framework

[Refactoring and acceptance report](docs/refactor-report.en.md)

[Русский](README.md) · [English manuals](apps/docs/content/en/start.md) · [Architecture](apps/docs/content/en/architecture.md)

A private monorepo for a visual website and presentation editor: local projects, corporate compositions, element editing, standalone HTML and an optional Qwen3.5-2B assistant. The UI is Russian; documentation is Russian and English.

## Quick start

Requires Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/demo/`. Editor development does not require a model or GPU.

```sh
npm run build
npm run ai:server
```

Built application: `http://127.0.0.1:4176/demo/`. Manuals: `/docs/en/start.html` and `/docs/ru/start.html`.

## Docker

```sh
docker compose up --build -d
docker compose --profile ai up --build -d
```

Without the profile, the application starts without a model. The `ai` profile downloads Ollama and the pinned model on first use, preserving weights in a volume. GPU execution needs a configured NVIDIA runtime; see [operations](apps/docs/content/en/operations.md). For source editing use `docker compose -f compose.dev.yaml up --build`.

## Packages

- `packages/framework`: schema, renderer, compositions, fitting and export.
- `packages/ai`: contracts and generation without editor UI.
- `apps/editor`: gallery, editor, IndexedDB and demo.
- `apps/ai-server`: local API, Ollama and initialization.
- `apps/docs`: bilingual manuals and examples.

Use the shared `package-lock.json`. See [development](apps/docs/content/en/development.md) and [CONTRIBUTING](CONTRIBUTING.en.md).

## Validation

```sh
npm test
npm run test:ai
npm run test:bootstrap
npm run build
npm run check:docs
npx playwright install
npm run test:browser -- --workers=1
```

After preparing Ollama, run `npm run test:model` for real inference. Mocked API tests are separate evidence. See [quality](apps/docs/content/en/quality.md) for historical results and limits.

## Data and ownership

Projects live in browser storage, not Docker. Changing origin or port does not transfer IndexedDB. Download portable projects before changing environments. Corporate PPTX/PDF/TTC originals use Git LFS and are not required for ordinary builds. Model weights, reports and local configuration are excluded from Git.

This repository is intended for private team use. This release grants no open-source license to code, fonts or corporate assets. The remote repository and actual area owners are assigned separately.
