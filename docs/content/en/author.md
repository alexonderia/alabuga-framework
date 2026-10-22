# Components, documents and compositions

## CSS components and behavior

Buttons, forms, alerts, badges and dialogs use public .af-* classes. State uses semantic HTML attributes, ARIA and data-*; color alone does not implement disabled. Ordinary markup requires an .af root and explicit CSS. initComponents enhances trusted markup and returns cleanup; repeated initialization must not accumulate listeners. See [live examples](/index.html#buttons).

## Buttons: sizes and states

Icon buttons reuse af-btn: add af-btn--icon, af-btn--round for a circle, and af-btn--sm/af-btn--lg for S/L. Buttons measure 32/40/48 px with an 8 px square radius; af-btn__icon slots measure 16/20/24 px. The source Secondary Round L uses a 20 px icon and loader. af-btn__icon--info displays the size-matched original Figma information icon, embedded in CSS and colored by the button. Custom SVG icons retain their intrinsic dimensions inside the slot. af-btn__icon--placeholder remains available for an optional empty slot; live examples use an actual icon.

```html
<button class="af-btn af-btn--icon af-btn--round" type="button" aria-label="More information">
  <span class="af-btn__icon af-btn__icon--info" aria-hidden="true"></span>
</button>
```

Set the accessible name on the button through aria-label or af-sr-only. Selected, hover, pressed, disabled, loading and focus reuse ordinary af-btn behavior. Loading preserves dimensions and naming. Use native disabled buttons; ARIA-disabled anchors also need the existing initComponents activation guard. [Sizes and states](/index.html#buttons).

## Component typography

Combine modifiers with their base class. The Figma component scale maps as follows:

| Style | CSS classes | Size / line height | Weight |
| --- | --- | --- | --- |
| Display L | af-display | 44 / 100% | 800 |
| Heading H1 | af-heading | 32 / 100% | 800 |
| Heading H2 | af-heading af-heading--2 | 28 / 120% | 700 |
| Heading H3 | af-heading af-heading--3 | 24 / 120% | 700 |
| Title L | af-title | 22 / 120% | 500 |
| Title M | af-title af-title--md | 16 / 150% | 400 |
| Body L | af-body | 16 / 135% | 400 |
| Body M | af-body af-body--md | 14 / 140% | 400 |
| Body S | af-body af-body--sm | 12 / 135% | 400 |
| Body XS | af-body af-body--xs | 10 / 135% | 400 |
| Body XXS | af-body af-body--xxs | 8 / 135% | 400 |
| Label L | af-label af-label--lg | 16 / 130% | 500 |
| Label M | af-label | 14 / 130% | 500 |
| Label S | af-label af-label--sm | 12 / 130% | 500 |
| Label XS | af-label af-label--xs | 10 / 130% | 500 |

Headings use Alabuga Heading; other text uses Alabuga Sans. Component letter spacing is zero. Body/Label retain full line boxes without clipping; af-caption remains a 12 px secondary-color caption. XS/XXS serve auxiliary labels; main copy stays 14–16 px. af-field controls its label sizing. Compositions and fitted presentations retain their own contextual scales. Page documents reduce Display to 36 px below 768 px; standalone Display remains 44 px at every width. [Live scale](/index.html#typography).

## Branded unordered lists

Use ul.af-list with role="list": the default is a filled diamond, af-list--outline selects an outlined diamond, and af-list--triangle selects the triangle. Original 33×33 px Bullet markers are included in CSS with a 12 px text gap. The marker centers on the first text line and wrapped lines align with the text. Unordered lists align left even inside centered content. role="list" preserves Safari semantics when native markers are suppressed; the renderer adds it automatically.

```html
<ul class="af-list af-list--triangle" role="list">
  <li>Check the projector and audio before the meeting.</li>
  <li>Prepare badges and lay out materials for participants.</li>
</ul>
<ol class="af-list">
  <li>Agree on the meeting agenda.</li>
  <li>Discuss the questions and record decisions.</li>
  <li>Assign owners and deadlines.</li>
</ol>
```

ol.af-list retains native numbering, start/value and nested lists. For an isolated decorative marker use span.af-bullet with aria-hidden="true", optionally af-bullet--outline or af-bullet--triangle. These styles add no serialized fields or JS initialization.

Each kind has its own reference block with a description, preview and HTML: [filled diamond](/index.html#typography/example-2), [outlined diamond](/index.html#typography/list-outline), [triangle](/index.html#typography/list-triangle), [ordered list](/index.html#typography/list-ordered).

## Additional styles: drop cap and dividers

af-dropcap, af-divider and af-divider--ornament existed in the initial Framework implementation and are already present in commit 57cc037 dated October 20, 2026. Their source has not been confirmed in the reviewed Figma, PDFs or brand materials. They are optional Framework extensions rather than transferred design-system components: ::first-letter draws the drop cap, af-divider draws a plain rule, and af-divider--ornament draws a decorative CSS shape. Existing document compatibility is preserved. [Example with provenance](/index.html#typography/example-3).

## Ordinary buttons

af-btn, af-btn--secondary, af-btn--ghost and af-btn--clear provide the four appearances. Default M is 40 px; af-btn--sm is 32 px; af-btn--lg is 48 px. Ordinary compositions preserve these sizes; presentation af-slide-type still uses fitted slide typography.

aria-pressed="true" selects the appearance: Primary/Clear use blue backgrounds, Secondary light blue, Ghost white with blue text. The application owns aria-pressed. Hover/Pressed use CSS, keyboard focus remains visible, and text roles retain Framework contrast corrections.

aria-busy="true" centers the original 16/20/24 px Figma loading SVG. The text remains in the DOM as the accessible name and preserves width while hidden visually. Also set disabled on native busy buttons. Loading takes visual priority over disabled. initComponents blocks click/auxclick on .af-btn with aria-busy="true" or aria-disabled="true", including links; cleanup releases listeners. Without JS, native buttons need disabled and unavailable links must omit href.

```html
<button class="af-btn af-btn--secondary" aria-pressed="true">Selected</button>
<button class="af-btn" aria-busy="true" disabled>Save</button>
```

af-btn--inverse explicitly provides a white CTA on dark surfaces. The renderer adds it to plain button widgets in accent/contrast/image sections; white card surfaces retain the ordinary appearance. Add it yourself in standalone HTML. See [all states](/index.html#buttons).

## Input and textarea: Field sizes and states

Default input.af-input is M: 40 px with 14 px / 140% text. af-input--sm uses 32 px, 12 px / 135% text and a 6 px radius; af-input--lg uses 48 px and 16 px / 135% text. M/L radii are 8 px; horizontal padding is 12 px at every size. af-field sizes label/helper text to S 10/8 px, M 12/10 px, L 14/12 px. Entered text retains its full line height.

Use af-input-wrap for icons. Set the size on the input: the wrapper's total height, including its border, follows 32/40/48 px. af-placeholder-icon and af-input-hint use 16/20/24 px icons and 8/10/12 px gaps. The optional leading square is the Figma placeholder slot; remove it or supply an application icon of the correct size. Original info/error/success SVGs are embedded in CSS. af-input-hint is decorative; connect meaningful helper text with aria-describedby.

```html
<div class="af-field">
  <label class="af-label" for="title">Title</label>
  <div class="af-input-wrap">
    <input class="af-input af-input--sm" id="title" name="title" required aria-describedby="title-help">
    <span class="af-input-hint" aria-hidden="true"></span>
  </div>
  <p class="af-help" id="title-help">Enter a title</p>
</div>
```

aria-invalid="true" sets Error; af-input--success and af-textarea--success set Success. Wrapper borders, backgrounds and icons follow the input. Disabled takes priority over error/success/focus; error takes priority over success. A disabled ancestor fieldset is supported, including label/helper/icon colors. Readonly retains FormData values and allows text selection. Error/success borders use original Figma signal colors; error text retains the Framework contrast correction. Focus uses one 1 px border, with a separate system outline in forced colors.

Textarea follows the original 128 px Figma variant with 16 px / 135% text and 12 px padding; vertical resizing remains native. af-field__meta places helper text and a counter on opposite sides. Use data-af-counter-for with the existing initComponents API:

```html
<div class="af-field">
  <label class="af-label" for="comment">Comment</label>
  <textarea class="af-textarea" id="comment" name="comment" maxlength="1000" aria-describedby="comment-help comment-count"></textarea>
  <div class="af-field__meta">
    <p class="af-help" id="comment-help">Up to 1000 characters</p>
    <span class="af-field__counter" id="comment-count" data-af-counter-for="comment"></span>
  </div>
</div>
```

The counter reads the current value and updates on input/change, reset and maxlength changes. It counts UTF-16 units, matching maxlength; without a limit it shows length only. Dispatch input or change after programmatic value updates. A canceled reset preserves value and count. Reinitialization releases prior listeners; cleanup stops updates/observation and keeps the last displayed count. Without JS, native input and maxlength work and the empty counter does not display a stale value. See [live examples](/index.html#forms).

## Switch: native toggle

Use input.af-switch type="checkbox" role="switch" inside label.af-check. Figma defines one L size: 44×24 px with a 20 px thumb, 2 px inset, 16 px label and 12 px gap. No S/M variants are introduced. OFF/ON, hover and disabled have distinct styles. Disabled retains thumb position and uses its own colors instead of fading the entire element.

```html
<label class="af-check">
  <input class="af-switch" type="checkbox" role="switch" name="autosave" value="yes" checked>
  Autosave
</label>
```

Switch requires CSS only. Tab/Space, label clicks, checked, required, disabled fieldsets, FormData and reset remain native. Forced colors use system colors and visible focus; reduced motion disables thumb movement.

## Checkbox and radio: native inputs with CSS

af-checkbox and af-radio style native inputs without replacing DOM or requiring JS initialization. Default M icons are 20 px; --sm and --lg modifiers select 16 and 24 px. Wrap the input and label text in af-check: text is 12/14/16 px, gap is 6 px for S and 8 px for M/L, and the hit area is at least 32 px high. Checkboxes use a 4 px radius; radios are circular. Original SVGs for each size are embedded in the CSS.

```html
<label class="af-check">
  <input class="af-checkbox af-checkbox--sm" type="checkbox" name="consent" required>
  Accept the terms
</label>
<fieldset>
  <legend>Format</legend>
  <label class="af-check"><input class="af-radio" type="radio" name="format" value="page" checked> Page</label>
  <label class="af-check"><input class="af-radio" type="radio" name="format" value="slides"> Slides</label>
</fieldset>
```

:checked, :hover, :active and :disabled drive appearance, including a disabled ancestor fieldset. Required, FormData, reset, Tab/Space and radio arrow navigation remain native. Set input.indeterminate = true for mixed selection: this is an HTML extension, not Figma Loading. Forced colors restore native rendering. See [live examples](/index.html#forms).

Selected radios paint the inner circle and background on the same input layer to retain alignment at fractional zoom and pixel density. Original size-specific SVGs remain unchanged.

## Select with JS and CSS files

Load alabuga.css and alabuga.iife.js and call Alabuga.initComponents(root) for an .af root. ESM uses the same initComponents API with an explicit standalone.css import. No extra library, renderer or document format is required.

```html
<div class="af-field">
  <label class="af-label" for="topic">Topic</label>
  <select class="af-select" id="topic" name="topic" required aria-describedby="topic-help">
    <option value="" selected disabled hidden>Choose a topic</option>
    <option value="cooperation">Cooperation</option>
    <option value="education">Education</option>
  </select>
  <p class="af-help" id="topic-help">Choose one option</p>
</div>
```

Default M is 40 px; af-select--lg is 48 px; af-select--sm is 32 px. Label, helper, arrow and menu rows follow the size. S uses a 6 px radius, M/L use 8 px. Framework contrast adjustments remain in place. The base configuration has no leading icon.

The value retains its full line height and clips only horizontally with an ellipsis. The menu gap is 2 px, adjusted for the web implementation following review (Figma uses 8 px). The independent viewport margin remains 8 px. Input/select/textarea and af-input-wrap focus use a single 1 px blue border without a separate outer ring; forced colors retain a system focus outline. Buttons and checkbox/radio keep their separate keyboard outlines.

The original select retains its identity and participates in FormData, required validation and reset. User selection emits input and change from that select. Assigning value, selectedIndex or option.selected synchronizes the UI without emitting user events; option/attribute mutations are observed. Existing application-owned accessors are preserved; dispatch change after updates through those accessors.

Enter/Space open and commit, arrows and Home/End move the active item, and typing searches by text. Escape cancels an uncommitted choice; Tab closes and continues navigation. Disabled options and optgroups are skipped; hidden options have no visible row. data-af-readonly or aria-readonly="true" prevents user changes while keeping the form value.

Reinitializing the same root releases the previous enhancement. cleanup removes the generated UI, restores the native control and releases listeners and instance property mirrors. Initialize the relevant root again after adding new selects. multiple, size greater than 1 and data-af-select-native retain the native UI. Without JS the native select remains usable.

The standard Popover API avoids clipping; older browsers use a fixed menu in body or the current dialog. Existing form[data-af-validate] and data-af-error-for forward validation and focus to the visible control. New CSS parts are .af-select-box, .af-select__control, .af-select__value, .af-select__arrow, .af-select-list and .af-select-option. They are separate from the prose .af-list. See [live examples](/index.html#forms).

## Blocks and surfaces

Named af-card modifiers implement the [outer/inner block rules in Figma](https://www.figma.com/design/ObAoKiDwraibmQrxUNvGWI/Design-System?node-id=270-203) and the supplied visual-rules PDF. Class names are Framework API choices; the reviewed file has no separate Card component family.

| Geometry | Padding | Radius | Gap |
| --- | --- | --- | --- |
| af-card af-card--outer | 32 px | 32 px | 16 px |
| af-card af-card--inner | 16 px | 16 px | 16 px |

Both variants stack children vertically and retain these dimensions on phones. Direct child headings, paragraphs and lists have their vertical margins reset so gap controls the 16 px spacing. Long words and links wrap.

```html
<section class="af-card af-card--outer af-card--outline" aria-labelledby="materials">
  <h2 class="af-title" id="materials">Meeting materials</h2>
  <p class="af-body">Prepare the agenda and questions for discussion.</p>
  <div class="af-card af-card--inner">
    <h3 class="af-title af-title--md">Agenda</h3>
    <p class="af-body">Introductions, discussion and next steps.</p>
  </div>
</section>
```

Choose one emphasis per object:

| Modifier | Appearance |
| --- | --- |
| af-card--filled | Blue fill and inherited white text, no border or shadow |
| af-card--outline | White surface with a 2 px blue border, no shadow |
| af-card--outline-thick | White surface with a 3 px blue border, no shadow |
| af-card--elevated | White surface with the 0 2px 3px 0 neutral/300 shadow, no border |

Fill, 2–3 px outlines and a y=2 shadow come from the rules; blur=3 and neutral/300 come from the Figma illustration. Nested controls retain their own colors and dimensions. A white nested af-card--inner resets to primary text; a white CTA on blue explicitly uses af-btn--inverse. Forced colors replace fill/elevation with a system border, Canvas/CanvasText and no shadow. Filled surfaces set print-color-adjust:exact.

Legacy af-card without --outer/--inner retains its block layout, neutral 1 px border and 20 px mobile padding/radius. Those are existing Framework decisions, rather than new Figma variants. af-surface--plain/card remain renderer flags. Document format, widgets and fitted presentation styles are unchanged; this CSS works without initComponents. [Live examples](/index.html#surfaces).

## DatePicker input and calendar

Add `af-datepicker` to a date input and call `initComponents`:

```html
<div class="af-field">
  <label class="af-label" for="meeting-date">Meeting date</label>
  <input class="af-input af-input--lg af-datepicker" type="date"
    id="meeting-date" name="meetingDate" min="2026-10-01" max="2026-12-31">
</div>
```

```js
const dispose = Alabuga.initComponents(host);
// Before removing the markup: dispose();
```

Field sizes: `af-input--sm` — S (32 px), no modifier — M (40 px), `af-input--lg` — L (48 px). Icons and labels follow the field; the calendar stays 250 px wide. S/M extend the original L DatePicker at the user's request.

Enter DD.MM.YYYY; `input.value` and `FormData` retain YYYY-MM-DD. The button or Arrow Down opens the calendar. Confirm applies the date; Cancel and Escape retain the previous value.

Supports `required`, `min/max`, `disabled`, `readonly` and form reset. Use `aria-invalid="true"` for errors and `af-input--success` for success. Dispatch `input` or `change` after setting `value` programmatically. Add `data-af-date-native` to keep the browser calendar.

[Form and states](/index.html#forms/datepicker) · [Calendar with date input](/index.html#widgets/calendar-input). Range selection is covered below under Calendar.

## Calendar navigation and selection

The calendar widget accepts a YYYY-MM-DD date. Arrow keys move by day/week; Home/End reach Monday/Sunday. Page Up/Down move by month, with Shift by year. Shorter months use their last day. Keyboard commands follow [WAI APG Date Picker](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/#kbd_label).

Navigation changes focus without selecting. Enter, Space or a click selects a day. Only one day participates in Tab navigation; the month heading stays mounted as an aria-live region. Navigation stays within the schema's years 0000–9999, including years below 100. The corresponding month button is disabled at either boundary.

Calendar now follows the supplied screenshot: 250 px width, 32×32 px days, no column gaps, 4 px row gaps, a 16 px title, 1 px border, 8 px radius and shadow. Five-week months measure 260 px high, or 304 px with actions. Adjacent dates are disabled. Real month lengths are retained: the reference incorrectly includes September 31. Weekday labels and range-start text use darker colors for readable contrast.

The standalone JS/CSS distribution and ESM expose the same component:

```js
const calendar = Alabuga.renderCalendar('2026-09-10', date => {
  console.log('Confirmed:', date);
}, {confirm: true, value: null});
document.querySelector('#calendar-example').append(calendar);
```

The existing two-argument call still selects immediately. With confirm:true, day activation changes a draft; Confirm commits, while Cancel/Escape restore the latest committed value. value:null starts empty; confirming without choosing accepts the focused date. onCancel runs after resetting and can close a host popover. Navigation does not emit a selection.

```js
const calendar = Alabuga.renderCalendar('2026-09-10', range => {
  console.log(range.start, range.end);
}, {
  mode: 'range', confirm: true,
  value: {start: '2026-09-10', end: '2026-09-17'}
});
host.append(calendar);
```

Two activations define an ordered range, including reverse and cross-month selection. Hover/keyboard navigation previews the second endpoint; Confirm stays disabled until both endpoints are chosen. Without confirm:true, the second activation calls back immediately. Adjacent dates are disabled; use month navigation to extend the range. data-range=start/middle/end/single controls continuous borders across weeks. The returned HTMLElement owns its internal DOM until removal; no external listeners or dispose are required. Options provide initial state; recreate the calendar for an external value replacement.

The AFDocument calendar widget retains immediate single selection and af:change:

```js
const host = document.querySelector('#calendar-example');
const controller = Alabuga.renderDocument(host, documentData);
host.addEventListener('af:change', event => {
  // detail: {widgetId, value: '2024-02-29'}
  // The selected DOM day and getDocument() have already been updated.
  console.log(event.detail, controller.getDocument());
});
```

Handlers may synchronously update/destroy the document: the calendar finishes DOM and focus work before dispatch/callback. Document fields, CSS hooks and standalone JS/CSS delivery are preserved. Range/draft values do not add AFDocument fields. [Working examples and code](/index.html#widgets) include confirmation, ranges and January 31 to February 29.

Calendar follows the supplied screenshot. DatePicker now reuses it for its input/popup. Optional min/max restrict Calendar dates and navigation; existing calls without bounds retain their behavior.

## Selection controls, chips and navigation

| Component | Markup and sizes |
| --- | --- |
| Option-btn | `label.af-option` with `input.af-option__input` and `span.af-option__label`; checkbox for multiple values, same-name radio inputs for one |
| Multi-switch | `fieldset.af-multi-switch` with Option-btn children; `--sm` / no modifier / `--lg` — 32/40/48 px |
| Chip | `af-chip`, matching modifiers — 16/20/24 px; `--default`, `--info`, `--success`, `--warning`, `--error` appearances |
| Alert | `af-alert`, sizes 32/40/48 px, the same appearances as Chip; legacy `--danger` remains supported |
| Dialog | `af-dialog af-dialog--compact`: up to 350 px, 16 px padding; `af-dialog__header`, `__title`, `__body`, `__actions`, `__close` slots |
| Breadcrumbs | Named `nav.af-breadcrumbs` with an `ol`; current item uses `aria-current="page"` |

Option-btn/Multi-switch selection follows `checked`; keyboard behavior, FormData, disabled, required and reset remain native. Use `af-chip__remove[data-af-dismiss]` or `af-alert__close[data-af-dismiss]` buttons and the existing `initComponents` for dismissal. Use `role="status"` for dynamic results and `role="alert"` for urgent errors. Label dialogs with `aria-labelledby`; `aria-describedby` connects descriptions. Use `af-link[aria-current="page"]` for the current link.

[Export formats](/index.html#forms/option-button) · [Multi-switch](/index.html#forms/multi-switch) · [Chip](/index.html#feedback/chips) · [Alert](/index.html#feedback/alert-sizes) · [Dialog](/index.html#dialog/dialog-slots) · [Navigation](/index.html#navigation).

Option-btn and Multi-switch now follow the supplied reference: Regular text and transparent unselected states; the group has no shared track or border and keeps 4 px padding/gaps. Chip/Alert restore source colors, semantic glyphs and close-mark sizes. Alert L uses a 20 px leading icon and 24 px close slot. Dialog has 16 px section gaps and equal actions filling the row. Links are gray by default, black when current and blue on hover, without permanent underlines.

Some source colors do not provide AA text contrast. Add `af-chip--accessible` / `af-alert--accessible` for darker text, or `af-link--accessible` for links. Use `af-link--inline` for blue underlined inline links. Sources and dimensions are recorded in `design/secondary-components-rules.json`; no repeated Figma requests are needed. Existing `af-badge` and standard dialogs remain available.

## Icons

[Catalogue and examples](/index.html#icons). Use `af-icon af-icon--info` (M, 20 px by default), `af-icon--sm` for 16 px and `af-icon--lg` for 24 px. Available names: `info`, `success`, `error`, `expand`, `collapse`, `previous`, `next`, `calendar`, `close`, `loading`, `loading-white`. Monochrome glyphs inherit text color; loaders retain their original colors and respect reduced motion.

Inside buttons, add `af-btn__icon`: the button owns the size, including Secondary Round L's 20 px exception. Decorative glyphs need `aria-hidden="true"`; meaningful standalone glyphs need `role="img" aria-label="…"`. Icon-only buttons need an accessible name.

Bare `af-icon` preserves the legacy 24 px wrapper for custom SVGs. Original SVGs are embedded in CSS; no new JS call is required. Previous/Next reuse 20 px originals and Calendar/Close reuse 24 px originals; other sizes scale those files. The full 49-node Figma family is not exported: missing Help/CancelRound/Check/Radio/Default artwork is not substituted. Provenance and geometry: `design/icon-catalog.json`.

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
