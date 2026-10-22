# Alabuga Framework

Independent proprietary design system and document renderer. Repository: https://github.com/alexonderia/alabuga-framework.

Node.js 24.19.0 and npm 11.17.0. Run `npm ci`, `npm run tokens`, `npm run build`, `npm test`.
Run `npm run build:docs`, `npm run check:docs`, and `npm run dev` for the independent RU/EN reference.

Figma work uses the [local project archive](design/figma/README.md): collect project data, screenshots and assets once, then implement from saved sources. Follow [the collection workflow](docs/figma-workflow.md) and [AGENTS.md](AGENTS.md); do not reread Figma for each component or session. `npm run check:design` verifies the archive offline. Existing coverage and missing materials are explicit in its manifest.

The interactive reference keeps the original documentation layout, search and live component examples. Serve it independently with `docker compose up --build -d docs`, then open http://127.0.0.1:4391/. Set `CONSTRUCTOR_URL` when building the docs image to point its editor links to your Constructor deployment. For Vite development, set `VITE_CONSTRUCTOR_URL`. Neither command requires a Constructor checkout or its npm registry credentials. AI/workspace sections and legacy #ai/#workspace routes open the complete Constructor-owned guides. This site's nine RU/EN topics cover usage, architecture, public contracts, resources, brand sources, development, release and quality.

The working Figma alignment examples include [square/round icon buttons](http://127.0.0.1:4391/#buttons) and [the component type scale and branded lists](http://127.0.0.1:4391/#typography). These are CSS-only additions to the standalone distribution. Use `af-btn af-btn--icon` with optional `af-btn--round`, `--sm` or `--lg`, an accessible name and a size-matched icon. Use `ul.af-list[role=list]` with optional `af-list--outline` or `af-list--triangle`; 33 px Figma markers are included in CSS. `ol.af-list` retains native numbering. The RU/EN author guides document the full typography mapping and presentation exceptions.

The [blocks and surfaces reference](http://127.0.0.1:4391/#surfaces) provides CSS-only `af-card--outer` / `af-card--inner` geometry and separate `--filled`, `--outline`, `--outline-thick` and `--elevated` modifiers. These implement the visual block rules; existing renderer surface flags and document data stay compatible.

The [calendar reference](http://127.0.0.1:4391/#widgets) matches the supplied screenshot with a 250 px component, 32 px days and four examples: empty, immediate, confirmed and range selection. `Alabuga.renderCalendar(date, callback, options?)` works with standalone JS/CSS; `confirm`, `value`, `onCancel`, `min/max` and `mode:'range'` are optional. The existing AFDocument widget retains immediate single-date selection through `af:change` and schema years 0000–9999. Source/contrast/date decisions are recorded in `design/calendar-rules.json`.

The [DatePicker reference](http://127.0.0.1:4391/#forms/datepicker) enhances native `<input type="date" class="af-input af-input--lg af-datepicker">` through the existing `Alabuga.initComponents(host)`. It provides the Figma 48 px field, localized entry, confirmation/calendar and required/min/max while preserving ISO values, native events, FormData, reset and cleanup. No AFDocument properties or runtime dependencies are added. See `design/datepicker-rules.json` for source/state mapping.

DatePicker supports standard S/M/L fields through `af-input--sm`, no size modifier, and `af-input--lg` (32/40/48 px), with matching text/icons. S/M extend the saved L source at the user's request; size changes retain calendar drafts.

[Icon catalogue](http://127.0.0.1:4391/#icons): named CSS glyphs in 16/20/24 px, inherited color, source two-color loaders and button-size integration. Bare `af-icon` remains a 24 px wrapper. Available assets, scaling extensions and missing original variants are recorded in `design/icon-catalog.json`; current status for all 23 Figma families is in `design/component-status.json`.

P2 examples include [Option-btn and Multi-switch](http://127.0.0.1:4391/#forms/multi-switch), [Chip/Alert S/M/L](http://127.0.0.1:4391/#feedback), [compact Dialog slots](http://127.0.0.1:4391/#dialog/dialog-slots) and [Breadcrumbs/current links](http://127.0.0.1:4391/#navigation). Native controls own selection/form state; the existing initializer handles dismissal/dialogs. All visible variants were rechecked against the three supplied Figma screenshots; corrected dimensions, colors, glyphs and source limitations are recorded in `design/secondary-components-rules.json`. Defaults follow the source palette; `af-chip--accessible`, `af-alert--accessible` and `af-link--accessible` provide darker text.

The [calendar input example](http://127.0.0.1:4391/#widgets/calendar-input) shows the same DatePicker beside the calendar reference: type a date or open the calendar, then confirm the selection to update the field.

Published **1.1.0** to the authenticated local registry `http://127.0.0.1:4873/` on 2026-10-22, with the `latest` tag. A fresh registry installation verified the tested archive's integrity and JS/CSS bytes. Manual screen-reader acceptance was deferred at the user's explicit request; it has not been performed. Artifacts and acceptance results are available at [release review](http://127.0.0.1:4391/releases/1.1.0/). With your registry read credentials:

```sh
npm install --save-exact @alabuga/framework@1.1.0 --registry=http://127.0.0.1:4873/
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

Single selects are enhanced by the existing `initComponents` API. Plain HTML needs only the built JS and CSS files; select icons and fonts are embedded in the CSS:

```html
<link rel="stylesheet" href="alabuga.css">
<div class="af" id="controls">
  <div class="af-field">
    <label class="af-label" for="topic">Topic</label>
    <select class="af-select" id="topic" name="topic">
      <option value="">Choose a topic</option>
      <option value="cooperation">Cooperation</option>
      <option value="education">Education</option>
    </select>
  </div>
</div>
<script src="alabuga.iife.js"></script>
<script>const cleanup = Alabuga.initComponents(document.getElementById('controls'));</script>
```

The original select retains its identity, value, validation and form submission. `af-select--lg` / `af-select--sm` select 48 / 32 px controls; the default is 40 px. `data-af-readonly` prevents user changes while preserving the form value. Multiple selects, `size>1` and `data-af-select-native` keep the native UI. Without JavaScript, selects remain functional native controls. Call cleanup before removing the enhanced markup. See the RU/EN author guides for supported updates and keyboard behavior.

After building, open `demos/select.html` or `dist/standalone/select.html` directly from disk to try the JS/CSS-only form without a server.

Buttons preserve S/M/L sizes (32/40/48 px) in ordinary compositions. Each appearance has its own `aria-pressed="true"` styling; `aria-busy="true"` displays a centered Figma loader without changing width. Set `disabled` on busy native buttons. `initComponents` also blocks activation of busy or ARIA-disabled `.af-btn` buttons and links. Use `af-btn--inverse` for white CTAs on dark surfaces.

Native `input.af-checkbox` and `input.af-radio` use Figma styling with CSS alone. Default M is 20 px; `af-checkbox--sm` / `af-radio--sm` use 16 px, `--lg` uses 24 px. Wrap inputs in `label.af-check`; native form values, required, disabled, reset and keyboard behavior remain intact. Size-specific SVGs are embedded in CSS; no extra runtime files or dependencies are needed.

For local review, run `docker compose up --build -d docs` and open [buttons](http://127.0.0.1:4391/#buttons), [form controls](http://127.0.0.1:4391/#forms), or the [RU author guide](http://127.0.0.1:4391/docs/ru/author.html).

Input S/M/L modifiers also size `af-input-wrap`, label/helper text and embedded `af-input-hint` icons. Wrapper error/success/readonly/disabled styles follow the native input, including disabled fieldsets. `af-switch` uses the single 44×24 px Figma size with a 20 px thumb; native checkbox behavior requires CSS only. `af-textarea` follows the original 128 px variant; add an empty `span.af-field__counter[data-af-counter-for="textarea-id"]` and initialize components for a live maxlength counter. Dispatch `input` or `change` after programmatic textarea value updates.

`npm run test:package` verifies the actual archive. `npm run test:consumers` installs it into a temporary directory and checks Node, TypeScript NodeNext and React StrictMode. `npm run test:browser` checks the independent reference and component states. Use `AF_BROWSER_CHANNEL=chrome` for a locally installed Chrome; CI installs the Playwright browsers.

Public entries, DOM compatibility and release policy are documented in `docs/public-contract.md`. Documents 1–3 remain supported. The framework has no Constructor, IndexedDB, AI or server dependency.

The root `compose.yaml` groups documentation and the npm registry in one stack. After creating registry accounts as described in `infra/registry/README.md`, run `docker compose up --build -d` for both services: docs on http://127.0.0.1:4391/ and Verdaccio on http://127.0.0.1:4873/. `docker compose up --build -d docs` needs no registry accounts. Optional settings are in `.env.example`. The `https` profile adds the registry proxy; `maintenance` provides one-off Certbot commands. Test containers stay separate. The previous Compose files remain compatibility wrappers over the root service definitions; stop the old docs/registry containers before starting the combined stack on the same ports. The default storage volume remains `alabuga-registry-local_storage`.

Private registry deployment, accounts, backup and restore: `infra/registry/README.md`. Configure the real registry before release. A Framework release never deploys Constructor. The existing Constructor repository remains https://github.com/vldsmelov/alabugaframework.

No open-source license is granted for the code, fonts or corporate materials.

All four standalone samples are generated in dist/standalone: index.html, slides.html, landing.html and presentation.html. `node scripts/acceptance.mjs` creates responsive screenshots, all eleven showcase slide images and a PDF from the built site; set ALABUGA_PREVIEW_URL and AF_BROWSER_CHANNEL as needed. Original-source preservation is recorded in docs/split-preservation.ru.md; the unchanged Figma reference is in docs/brand-sources/figma.md.
