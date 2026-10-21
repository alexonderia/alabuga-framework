# Alabuga Framework

Independent proprietary design system and document renderer. Repository: https://github.com/alexonderia/alabuga-framework.

Node.js 24.19.0 and npm 11.17.0. Run `npm ci`, `npm run tokens`, `npm run build`, `npm test`.
Run `npm run build:docs`, `npm run check:docs`, and `npm run dev` for the independent RU/EN reference.

The interactive reference keeps the original documentation layout, search and live component examples. Serve it independently with `docker compose up --build -d docs`, then open http://127.0.0.1:4391/. Set `CONSTRUCTOR_URL` when building the docs image to point its editor links to your Constructor deployment. For Vite development, set `VITE_CONSTRUCTOR_URL`. Neither command requires a Constructor checkout or its npm registry credentials. AI/workspace sections and legacy #ai/#workspace routes open the complete Constructor-owned guides. This site's nine RU/EN topics cover usage, architecture, public contracts, resources, brand sources, development, release and quality.

Install the published package with your registry read credentials:

```sh
npm install --save-exact @alabuga/framework@1.0.2
```

```js
import '@alabuga/framework/standalone.css';
import {renderDocument} from '@alabuga/framework';
const controller = renderDocument(host, document, {assetsBaseUrl: '/assets/'});
// Update without remounting; release listeners on unmount.
controller.update(nextDocument);
controller.destroy();
```

Plain HTML can serve `standalone.js`, `standalone.css` and package `assets/`, then call `Alabuga.renderDocument`. Always apply the `af` root class for CSS components. ESM browser modules resolve built-in assets relative to the package; bundler applications copy exported assets to their static directory and pass `assetsBaseUrl`. Schema imports work in Node without a DOM. React integration is demonstrated and tested in `tests/consumers/react-document.mjs`; React owns the host and Framework owns its children.

`npm run test:package` verifies the actual archive. `npm run test:consumers` installs it into a temporary directory and checks Node, TypeScript NodeNext and React StrictMode. `npm run test:browser` checks the independent reference and component states. Use `AF_BROWSER_CHANNEL=chrome` for a locally installed Chrome; CI installs the Playwright browsers.

Public entries, DOM compatibility and release policy are documented in `docs/public-contract.md`. Documents 1–3 remain supported. The framework has no Constructor, IndexedDB, AI or server dependency.

The root `compose.yaml` groups documentation and the npm registry in one stack. After creating registry accounts as described in `infra/registry/README.md`, run `docker compose up --build -d` for both services: docs on http://127.0.0.1:4391/ and Verdaccio on http://127.0.0.1:4873/. `docker compose up --build -d docs` needs no registry accounts. Optional settings are in `.env.example`. The `https` profile adds the registry proxy; `maintenance` provides one-off Certbot commands. Test containers stay separate. The previous Compose files remain compatibility wrappers over the root service definitions; stop the old docs/registry containers before starting the combined stack on the same ports. The default storage volume remains `alabuga-registry-local_storage`.

Private registry deployment, accounts, backup and restore: `infra/registry/README.md`. Configure the real registry before release. A Framework release never deploys Constructor. The existing Constructor repository remains https://github.com/vldsmelov/alabugaframework.

No open-source license is granted for the code, fonts or corporate materials.

All four standalone samples are generated in dist/standalone: index.html, slides.html, landing.html and presentation.html. `node scripts/acceptance.mjs` creates responsive screenshots, all eleven showcase slide images and a PDF from the built site; set ALABUGA_PREVIEW_URL and AF_BROWSER_CHANNEL as needed. Original-source preservation is recorded in docs/split-preservation.ru.md; the unchanged Figma reference is in docs/brand-sources/figma.md.
