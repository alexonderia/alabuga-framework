# Formats, resources and export

## Document compatibility

validateDocument reads schemas 1–4; normalization rules are described below; future schemas fail. Strict validation means new serialized properties need review against old readers and may require an explicit migration/new schema. npm SemVer does not replace schemaVersion.

The alabuga-project envelope, alabuga-workspace database, revisions, trash and AI drafts belong to Constructor. Framework accepts AFDocument and never opens IndexedDB. See [application compatibility]({{CONSTRUCTOR_URL}}/docs/en/data.html).

## Resolving resources

Per-operation assetsBaseUrl overrides defaults for rendering, fitting and export. ESM defaults to package assets; external IIFE resolves relative to its script URL. Bundler applications publish exported assets and supply their base. Legacy ../assets/brand/... URLs are recognized as built-ins. HTTP(S), data URLs and user-relative paths keep existing semantics.

The consumer resolves asset:<sha256>: renderer/fit use a synchronous URL callback; export uses asynchronous resolveAsset returning image data. Missing exported assets fail explicitly. Built-in/local images are prepared before embedding; external HTTP(S) images remain network-dependent.

## Self-contained HTML

```ts
import {exportHTML} from '@alabuga/framework/export';
const html = await exportHTML(documentData, {
  runtime: {css: standaloneCss, script: standaloneScript},
  assetsBaseUrl: '/assets/',
  resolveAsset: async id => loadImageDataUrl(id)
});
```

Pass CSS/script for the installed version explicitly. Complete CSS embeds fonts as data URLs. HTML needs no editor, Ollama or registry. Keep editable project JSON separately; HTML is final output. Print with backgrounds enabled to produce PDF.

See [public exports](reference.md) and [resource provenance](brand.md).

## Responsive block sizes

Framework 1.2 adds `widget.responsive`: `{tablet:{width:73,minHeight:320},mobile:{width:100,minHeight:240}}`. Width is an integer from 1 to 100 percent of the available row including proportional gaps; minimum height is 0–3200 CSS px. Fields are independent and absent values retain automatic sizing. Content may grow beyond the minimum height. Overrides apply only to flow website sections: tablet at 640–1023 px and mobile below 640 px, measured against the document container. Base grid geometry and slides remain intact. Existing tabletOrder/mobileOrder control both visual and DOM order.

Documents with responsive overrides normalize to schemaVersion 4; explicit version 4 is preserved. Legacy documents without overrides still normalize from versions 1–3 to 3. Framework 1.1 readers reject version 4; reopening requires Framework 1.2 or later. Constructor project envelopes remain version 3, a separate format.

## Slide header and page number

Framework 1.3 adds `page.chrome`: `header: {visible, text}` and `number: {visible, value, format, position}`. Empty text/value use the project title and automatic slide order. Number formats are `padded` (01), `plain` (1), and `total` (1 / 10); positions are `left`, `center`, and `right` along the bottom. Per-slide settings survive template changes, fitting and export. Header insets and 24 px type on the 1600?900 canvas are consistent across themes and background placements. Hiding the header preserves its space so content stays in place.

Documents using chrome normalize to schemaVersion 5; explicit version 5 is preserved. Opening them requires Framework 1.3 or later; documents without chrome keep their previous version 3/4 behavior.

Framework 1.3.1 adds independent number.background (transparent, white, ink, blue, light) and number.color (inherit, ink, blue, white, muted). Absent fields preserve a transparent background and themed text. Solid backgrounds add 2×8 px insets. These fields use schema 5 and require Framework 1.3.1 or later.
