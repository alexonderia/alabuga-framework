# Changelog

## Unreleased

## 1.1.0 — 2026-10-22

Publish the compatible component/API release to authenticated local Verdaccio with unchanged standalone JS/CSS delivery and AFDocument format. Verify a fresh registry installation against the canonical Linux archive. Manual screen-reader acceptance is deferred at the user's request and remains unperformed. Keep document renderer callouts readable through af-alert--accessible and text links underlined through af-link--inline. Preserve source palette examples separately.

Add an offline CSS icon catalogue with 11 available glyphs/appearances in 16/20/24 px, inherited monochrome color, original two-color loaders and button-owned sizing. Preserve the legacy 24 px af-icon wrapper and existing component-specific icons. Record original SVG provenance, scaled-size extensions and missing family exports; refresh the implementation matrix for all 23 Figma families and RU/EN documentation.

Recheck all visible Option-btn/Multi-switch, Chip/Alert S/M/L, Dialog and navigation variants against three user-supplied Figma screenshots. Restore transparent option groups, Regular text, semantic colors/glyphs, small Chip close marks, Alert L 20 px leading / 24 px close slots, equal Dialog actions and source Link/Breadcrumbs states. Preserve darker text through explicit --accessible modifiers and inline links through af-link--inline. Archive measurements and screenshot provenance locally without new Figma calls.

Support DatePicker S/M/L through existing Field modifiers and synchronize live size changes without losing drafts. Continue P2 with native Option-btn/Multi-switch, Chip and Alert sizes/appearances, compact Dialog slots and Breadcrumbs/current links. Add keyboard-friendly chip/alert dismissal through the existing initializer. Preserve standalone JS/CSS and document schema; record incomplete visual-source coverage explicitly.

Add a compact calendar date-input example to the widgets reference using the existing DatePicker enhancement, with typed entry and confirmed calendar selection; link it from the RU/EN author guides.

Shorten DatePicker documentation in the interactive reference and RU/EN author guides; keep live examples and make example code expandable. Preserve collected Figma data and screenshots in a project archive with per-family coverage and SHA-256 checks. Record the project-wide one-time collection and subsequent local-source workflow in AGENTS.md and documentation; add offline check:design.

Add DatePicker enhancement through the existing initComponents for native date inputs: source L field/icons, localized typing, ISO/native form state, modal calendar with draft/confirm/cancel, min/max, validation, reset, readonly/disabled and reversible cleanup. Support browsers that expose date inputs as text; keep host custom validity and prevent stale values on invalid typing. Add inclusive optional bounds to Calendar and use original Figma navigation SVGs. Preserve standalone JS/CSS, native events and AFDocument fields; add meeting-form/state examples and RU/EN documentation.

Match Calendar to the supplied screenshot: 250 px frame, 32 px days, 16 px month title, source SVG arrows, trailing disabled dates, border/shadow and five-week heights 260/304 px. Expose renderCalendar in standalone/root exports with optional typed confirmation/range options; retain two-argument immediate selection and unchanged AFDocument fields. Add draft/commit/cancel, reverse/cross-month ranges and native keyboard selection. Remove the redundant calendar widget frame and show the four variants directly in the reference. Preserve real September dates and readable contrast; document screenshot provenance.

Fix Calendar navigation for years 0000–0099 and prevent leaving the schema's 0000–9999 range. Add Page Up/Down month and Shift+Page Up/Down year navigation with shorter-month clamping. Preserve live heading/control nodes, a single day Tab stop and same-month day focus. Finish selected DOM/focus updates before notifying hosts that may update/destroy synchronously. Add offline standalone regression coverage, working leap-year examples and RU/EN documentation.

Add opt-in af-card outer/inner geometry (32/16 px padding/radius, 16 px gap) and separate fill, 2/3 px outline and source shadow appearances from the visual rules. Retain explicit geometry on mobile and source values in design/surface-rules.json. Preserve legacy cards, renderer surface flags and document format. Add a live surfaces reference page and RU/EN documentation.

Center icon-button symbols and loaders from the button midpoint using a shared 50% anchor and half-size translate, preserving source SVGs and independent loading rotation. Split filled/outline/triangle/ordered typography examples into standard documentation blocks with separate descriptions, previews and HTML snippets; preserve earlier basic-list and extension links.

Replace icon-button placeholders with original size-specific information icons embedded in CSS. Show concrete meeting preparation lists and clarify that the existing drop-cap and divider styles are optional Framework extensions without a confirmed Figma/brand-source mapping. Update live examples and RU/EN author and source guides.

Add square/round icon-button S/M/L as af-btn modifiers, retaining shared native states, focus and loading guards. Preserve the source Secondary Round L 20 px icon exception. Add all three original 33 px Bullet markers; left-align unordered af-list content and preserve ordered numbering and list semantics. Complete the component typography scale with Title M, Body L–XXS and Label L–XS; restore zero heading tracking and document the separate page-mobile and fitted-slide rules. Extend live examples and RU/EN author guides without changing JS entry points or serialized documents.

Complete native Switch OFF/ON hover and disabled styles with the source 44×24 px track and 20 px thumb. Align Input S/M/L heights, labels, helpers, icon slots and wrapper states; embed original info/error/success SVGs. Match Textarea typography/padding and add opt-in counters through initComponents, including input/change, maxlength updates, reset and cleanup. Preserve standalone JS/CSS distribution and native form behavior.

Fix radio mark alignment at fractional zoom/pixel density, retain full Select value line height, and reduce the menu gap to 2 px while preserving the independent 8 px viewport margin. Match input/select/textarea/wrapped-field focus to the 1 px Figma border; retain system focus outlines in forced colors.

Keep unchanged Select value text nodes stable during focus synchronization so WebKit delivers the first click after programmatic value updates.

Match per-appearance button Selected/Pressed/Loading states, preserve loading width and accessible names, and block busy/ARIA-disabled activation through initComponents. Replace broad composition button overrides with explicit inverse CTAs; retain standard sizes outside fitted slide typography. Style native checkbox/radio controls in S/M/L with original Figma SVGs, native form/keyboard behavior and forced-colors fallback. Extend live examples and RU/EN author documentation.

Enhance native single selects through initComponents with Figma Select/List/ListItem, S/M/L sizes, keyboard navigation, form validation/reset and reversible cleanup. Preserve standalone JS/CSS distribution; embed the source Figma arrow assets in CSS without extra dependencies. Multiple selects and explicit native controls retain their existing UI.

## 1.0.2

Canonical Linux package, pinned npm and LF declarations for registry-independent integrity.

## 1.0.1

Preserve terminal CSS declarations; ship runtime artifacts only; verify isolated consumers and standalone resources.

## 1.0.0

Independent npm distribution extracted from b048bc2546a3e05131f4451a1115f7282b13523b. Document schemas 1–3 remain supported.
