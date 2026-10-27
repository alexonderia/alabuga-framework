# Public API and DOM contract

## Entries

| Export | Capabilities |
| --- | --- |
| Package root | VERSION, schema, renderer, behavior, compositions, export |
| schema | AFDocument, Section, Widget, ResponsiveSize, validateDocument, isSafeUrl |
| runtime | renderDocument, DocumentController |
| components, dom, widgets | initComponents, DOM helpers, registry |
| compositions, layout-variants | compositionCatalog, makeComposition, changeComposition, semanticSlots, applyLayoutVariant |
| slide-fit | fitSlide, measureSlide, slideBackgrounds, option/result types |
| experience, element-style | Actions, motion, typography and appearance |
| assets, export | Image preparation, exportHTML, ExportOptions |
| brand, examples, demo-documents | Brand references and pure sample documents |
| tokens.css, styles.css, compositions.css | Explicit partial CSS imports |
| standalone.js, standalone.css | Self-contained IIFE and complete CSS |
| assets/*, tokens.json, slide-backgrounds.json | Static assets, snapshot and backgrounds |

JS exports resolve to built dist/esm and dist/types. /src and /dist are private. Import CSS separately; root/schema work in Node without DOM.

## Validation and lifecycle

```ts
import {validateDocument} from '@alabuga/framework/schema';
import {renderDocument} from '@alabuga/framework/runtime';
const result = validateDocument(input);
if (!result.success) throw new Error(result.issues.map(i => i.message).join('; '));
const controller = renderDocument(host, result.data, {editing: true, assetsBaseUrl: '/assets/'});
controller.update(result.data);
const issues = controller.checkOverflow();
controller.destroy();
```

synchronize updates data after inline DOM edits in editing mode only. Navigation uses goToSlide/next/previous. getDocument returns controller data. initComponents returns its own cleanup. Release the renderer before removing its host.

## Fitting and export

```ts
import {fitSlide} from '@alabuga/framework/slide-fit';
const result = await fitSlide(slide, {keepLayout: false, assetsBaseUrl: '/assets/', signal});
if (result.success) documentData.pages[index] = result.slide;
```

keepBackground/keepTypography preserve selected values; resolveAsset resolves asset:. Results include changes/issues/candidates and are never applied automatically. Export accepts runtime.css, runtime.script, assetsBaseUrl and async resolveAsset. See [formats/resources](data.md).

## DOM compatibility

Authoring hooks include data-section-id, data-widget-id, data-action-id, .af-page, .af-slide, .af-panel, .af-widget, its title/content, .af-prose, .af-heading, .af-slide__title, .af-section-background, .af-table-scroll, .af-title, .af-label, .af-caption, .af-metric__value, quote text/author and feature title/text. Prose/list/figcaption/row/cell/card order follows data. docs/public-contract.md records the full contract. Breaking these hooks requires a major release.

See [live API examples](/index.html#api), [compositions](author.md) and [brand](brand.md).

For isolated slide thumbnails, renderDocument accepts `slideOffset` (preceding slide count, default 0) and `slideCount` (total slide count). See [document data](data.md) for `page.chrome`. DOM anchors are `.af-eyebrow` and `.af-slide__number`; a hidden header uses visibility:hidden and aria-hidden.

Set page.chrome.number.background and page.chrome.number.color independently to style the page number.
