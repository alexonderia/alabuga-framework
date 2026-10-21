# Components, documents and compositions

## CSS components and behavior

Buttons, forms, alerts, badges and dialogs use public .af-* classes. State uses semantic HTML attributes, ARIA and data-*; color alone does not implement disabled. Ordinary markup requires an .af root and explicit CSS. initComponents enhances trusted markup and returns cleanup; repeated initialization must not accumulate listeners. See [live examples](/index.html#buttons).

## Documents and lifecycle

```ts
import '@alabuga/framework/standalone.css';
import {renderDocument} from '@alabuga/framework/runtime';
import {makeComposition} from '@alabuga/framework/compositions';
const documentData = {
  schemaVersion: 3, kind: 'page', title: 'Example',
  pages: [makeComposition('split', 'page')]
};
const controller = renderDocument(host, documentData, {assetsBaseUrl: '/assets/'});
controller.update(documentData);
controller.destroy();
```

Pages use responsive grids; presentations use a scaled 1600×900, 16:9 canvas. Keep section/widget IDs stable during updates. checkOverflow reports geometry issues; presentation navigation also controls reveal steps. Print and reduced-motion preserve all content.

## Compositions and fitting

makeComposition creates a section. changeComposition and applyLayoutVariant transfer content through semantic slots. Unsupported transformations must preserve the original. Layout variants define limits; manual formatting and locked values take precedence.

fitSlide/measureSlide need browser DOM, fonts and images. fitSlide returns a result rather than writing to an application. Supply signal, resolveAsset and assetsBaseUrl as needed. Do not apply failed results; content is never shortened. See [live fitting](/index.html#compositions) and [Constructor fitting controls]({{CONSTRUCTOR_URL}}/docs/en/slide-fit.html).

## React

React owns a host ref; Framework owns its descendants. Mount a controller in useEffect, update its document in a separate effect and destroy it in cleanup. StrictMode remounts must release listeners. tests/consumers/react-document.mjs is the checked example; no separate React package is published.

See [formats/resources](data.md), [brand provenance](brand.md) and the [editor]({{CONSTRUCTOR_URL}}/builder/).
