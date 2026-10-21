# Library verification and acceptance

## Required levels

Check types, dependency boundaries, schema/resource/composition units, public exports and declarations. test:package verifies archive contents; test:consumers installs outside the workspace and checks Node without DOM, TypeScript NodeNext and React SSR/StrictMode mount/update/cleanup.

Browser checks cover reference search, keyboard, forms, dialogs, calendar/table, presentations, export, accessibility and 50 slides/500 widgets with preserved focus/DOM. CSS states use toHaveScreenshot for default, disabled, selected, hover, focus and pressed. Saving a screenshot alone is not regression comparison.

Playwright owns a separate server on 4277. Set AF_BROWSER_CHANNEL=chrome and --project=chromium for installed Chrome; install matching Chromium/Firefox/WebKit with npx playwright install for the full matrix. Never substitute the working application server.

## Resources and evidence

Verify custom assetsBaseUrl, legacy /assets paths, data/asset: and network images. Exported page/deck HTML must work with networking disabled, retaining the existing external HTTP(S) image limitation. Check PDF with backgrounds separately. Regenerate evidence; never commit models or complete artifact directories.

## Recorded status

Local split acceptance previously recorded 16 Framework units, 15 Chromium scenarios, isolated consumers, visual baselines and reproducible Linux archives. Combined projects recorded 62 units/90 Chromium scenarios. This is not a complete current matrix: Firefox/WebKit and cloud workflows remain unverified. GPU and author studies belong to Constructor. Historical monorepo reports remain in Constructor docs/refactor-report.*.md.

See [development](development.md), [release](operations.md) and [Constructor acceptance]({{CONSTRUCTOR_URL}}/docs/en/quality.html).
