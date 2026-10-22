# Library verification and acceptance

## Required levels

Check types, dependency boundaries, schema/resource/composition units, public exports and declarations. test:package verifies archive contents; test:consumers installs outside the workspace and checks Node without DOM, TypeScript NodeNext and React SSR/StrictMode mount/update/cleanup.

Browser checks cover reference search, keyboard, forms, dialogs, calendar/table, presentations, export, accessibility and 50 slides/500 widgets with preserved focus/DOM. CSS states use toHaveScreenshot for default, disabled, selected, hover, focus and pressed. Saving a screenshot alone is not regression comparison.

Playwright owns a separate server on 4277. Set AF_BROWSER_CHANNEL=chrome and --project=chromium for installed Chrome; install matching Chromium/Firefox/WebKit with npx playwright install for the full matrix. Never substitute the working application server.

## Resources and evidence

Verify custom assetsBaseUrl, legacy /assets paths, data/asset: and network images. Exported page/deck HTML must work with networking disabled, retaining the existing external HTTP(S) image limitation. Check PDF with backgrounds separately. Regenerate evidence; never commit models or complete artifact directories.

## 1.1.0 acceptance

The current full matrix covers Chromium, Firefox and WebKit, including offline HTML, export, forms and components. JSON results, PDF and screenshots are kept with the candidate report. `npm run check:design` verifies local Figma archive integrity without networking; CI runs it before building.

Source palettes in Feedback/Navigation have documented contrast limits. The full test admits only the exact source colors inside those previews, then audits `--accessible` variants with no exceptions. Other reference pages, rendered documents and demo forms are audited strictly. This does not certify AA for the source palette or replace manual screen-reader acceptance.

The release is published to local Verdaccio; a fresh installation and integrity passed. Manual screen-reader acceptance was deferred by the user and has not been performed. Sources, limits and saved manual scenarios are recorded in `docs/releases/1.1.0.md`. See the [release](/index.html#changes/release-1-1-0).

## Historical status

Local split acceptance previously recorded 16 Framework units, 15 Chromium scenarios, isolated consumers, visual baselines and reproducible Linux archives. Combined projects recorded 62 units/90 Chromium scenarios. This is a historical split record; the current three-browser matrix is described above. Cloud workflows were not executed during this local run. GPU and author studies belong to Constructor. Historical monorepo reports remain in Constructor docs/refactor-report.*.md.

See [development](development.md), [release](operations.md) and [Constructor acceptance]({{CONSTRUCTOR_URL}}/docs/en/quality.html).
