# Getting started with Framework

Alabuga Framework is an independent design system, CSS component library and website/presentation renderer. The editor, projects, IndexedDB, AI and model server belong to Alabuga Constructor. Consumers do not install Constructor.

## Install the published package

Configure the @alabuga HTTPS registry and a read token in user npm config, then pin a version:

```sh
npm install --save-exact @alabuga/framework@1.0.2
```

Local acceptance uses authenticated Verdaccio on 127.0.0.1:4873. Production hosting is not yet connected. Built applications do not contact the registry at runtime.

## CSS and JavaScript

```ts
import '@alabuga/framework/standalone.css';
import {initComponents} from '@alabuga/framework';
const cleanup = initComponents(document.querySelector('.af')!);
// Before removing the UI:
cleanup();
```

Import CSS explicitly and wrap ordinary CSS components in .af. Render documents with renderDocument; its controller owns child markup and releases listeners through destroy. See [components and compositions](author.md).

## Plain HTML

standalone.js exports dist/alabuga.iife.js; standalone.css provides the complete CSS with embedded fonts. Serve these files and assets/ yourself; the global is Alabuga. IIFE built-in resources resolve relative to its script URL unless assetsBaseUrl is supplied. See [resources and formats](data.md).

## Development and reference

Use Node.js 24.19.0/npm 11.17.0, npm ci, npm run build:docs and npm run dev in this repository. To serve the independent reference, run docker compose up --build -d docs and open 127.0.0.1:4391. Original fonts and PDF/PPTX are needed only for regeneration; normal builds use prepared files.

[Interactive examples](/index.html). [Editor]({{CONSTRUCTOR_URL}}/builder/). [Constructor guide]({{CONSTRUCTOR_URL}}/docs/en/start.html).
