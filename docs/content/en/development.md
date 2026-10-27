# Framework development

## Environment and commands

Node.js 24.19.0/npm 11.17.0 are pinned. npm ci uses this repository's independent lockfile. No Constructor checkout is required.

| Command | Purpose |
| --- | --- |
| npm run tokens / check:tokens | Generate layers, detect drift/missing references |
| npm run build | ESM, IIFE, CSS, declarations, resources and types |
| npm test | Schemas, API, resources and tokens |
| npm run test:package | Actual npm archive and exports |
| npm run test:consumers | Isolated Node, NodeNext and React consumers |
| npm run build:docs / check:docs | Reference, RU/EN, links and resources |
| npm run check:design | Local Figma archive and component index integrity |
| npm run prepare:release | Assemble the verified local candidate without publishing |
| npm run test:browser | CSS states, runtime, examples and snapshots |

## Documentation styling

The live reference and RU/EN guides use the ready-made `standalone.css`: Alabuga Sans, component typography, buttons, the search field and cards. The shared shell lives in `docs/app/site.css`; colors, spacing and radii use `--af-*` tokens. Shell styles preserve component states inside live examples.

`scripts/build-docs.ts` loads the same framework CSS and copies the shell stylesheet for every guide. After changing the appearance, run `npm run build:docs` and `npm run check:docs`; check the live reference, both languages and a narrow viewport. Guide tables of contents are generated from section headings at build time.

The sidebar groups topics by purpose: setup, colors and grids, components, documents, Constructor and API. Navigation links use `af-btn af-btn--clear` (Clean, without a persistent outline); the current page uses the primary `af-btn` and `aria-current="page"`. Groups have headings and separators and scroll horizontally on narrow screens. RU/EN guides separately group setup and components, API and formats, and development and releases.

The “Changes and decisions” section groups detailed descriptions by version, newest first. Preserve features, fixes, dimensions, states, compatibility and release verification details; place related decisions and explanations under their version without separate operational sections. Do not reduce the history to broad summaries. History data lives in `docs/app/release-history.ts`; future plans remain outside the version history.

## Tokens and original assets

design/figma-tokens.json is the original snapshot. design/token-layers.json records effective mappings and explicit accessibility fixes. Generation produces core/semantic/component CSS, preserving existing --af-* names and computed values. Change sources and generated layers together; check contrast and visual baselines.

Prepared WOFF2 are in src/fonts; TTC is in fonts. PDF/PPTX and the Figma link are in docs/brand-sources. Regeneration needs git lfs pull, Python and python -m pip install -r scripts/requirements-assets.txt, followed by scripts/fonts.py or scripts/extract_brand.py. Normal builds need neither Python nor LFS originals. Do not modify brand-book originals during refactoring.

## Public changes

New elements need schema, renderer, CSS states, examples and lifecycle documentation. Compositions define semantic slots, grids and limits; verify ID/action/content preservation during transformations. Check DOM/CSS changes with consumers and Constructor through the published package, never by adding its checkout here.

Update RU/EN together. PRs describe the problem, final behavior, compatibility and evidence; visual changes require comparisons, schema changes require old-document and negative cases. Never commit secrets, artifacts or local projects. See [releases](operations.md).
