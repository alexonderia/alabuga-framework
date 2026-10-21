# Library architecture

## Layers and boundaries

| Layer | Responsibility |
| --- | --- |
| src/tokens/core.css | Base colors, sizes, spacing and radii |
| src/tokens/semantic.css | Text, surfaces, borders and feedback |
| src/tokens/components.css | Component-specific tokens |
| styles.css, compositions.css | CSS components, states and responsiveness |
| schema.ts | Zod schema, types and normalization |
| components.ts, widgets.ts | Behavior and widget registry |
| runtime.ts | Rendering, updates, presentations and measurement |
| compositions.ts, layout-variants.ts | Pure factories, semantic slots and variants |
| slide-fit.ts | Bounded grid, typography and background fitting |
| assets.ts, export.ts | Image preparation and self-contained HTML |

Zod is the only runtime dependency. Framework never reads IndexedDB, editor localStorage, AI settings or neighboring checkouts. Consumers supply resolveAsset, and export receives explicit CSS/JS. Rendering/fitting require browser DOM; schema imports work in Node without DOM or CSS.

## Contracts

package.json exports, types, events, CSS variables and documented DOM hooks are public. DocumentController exposes update, synchronize in editing mode, getDocument, destroy, goToSlide, next, previous and checkOverflow. update validates before mutation, remount cleans the previous renderer, and destroy is idempotent.

Constructor owns its framework-adapter.ts for DOM editing hooks. Breaking those hooks requires a SemVer major. Document schemaVersion and the application's portable envelope have independent versions.

## Independent releases

Framework publishes one npm package; Constructor selects an exact published version in its own PR. Git/file dependencies and source aliases are not a distribution mechanism. Library publication never releases the application. Documentation is an independent static site with return links configured through CONSTRUCTOR_URL.

See [API](reference.md), [data](data.md) and [development](development.md).
