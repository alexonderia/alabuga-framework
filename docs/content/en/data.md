# Formats, resources and export

## Document compatibility

validateDocument reads schemas 1, 2 and 3 and normalizes to 3; future schemas fail. Strict validation means new serialized properties need review against old readers and may require an explicit migration/new schema. npm SemVer does not replace schemaVersion.

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
