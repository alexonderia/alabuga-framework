# Brand sources and assets

## Single owner

Framework owns design/figma-tokens.json, fonts/alabuga-sans.ttc, prepared src/fonts/*.woff2, assets/brand and docs/brand-sources. The original Figma link is restored in docs/brand-sources/figma.md. Original Colors, Visual rules, Typography hierarchy and Button examples PDFs and the Alabuga presentation PPTX retain their contents. Git LFS identifies originals by SHA-256; npm contains prepared resources only.

## Figma: saved project sources

Collect project data, screenshots and SVG assets once for the entire project. Subsequent changes use `design/figma/`, component rules in `design/*-rules.json` and assets in `src/icons/`. Do not reread Figma for each component or session. Refresh the design on the user's request; collect genuinely missing material once and save it immediately.

Archive index: `design/figma/README.md`; collection workflow: `docs/figma-workflow.md`; offline check: `npm run check:design`. The manifest records partial detailed coverage and missing material. Keep implementation screenshots separate from design references.

## Provenance

The presentation contains 28 slides, 67 media entries, 65 unique materials, five charts and one table. scripts/extract_brand.py writes original media to design/pptx-originals and derived assets to assets/brand. The [manifest](/assets/brand/manifest.json) records hashes, dimensions, transparency and slide numbers. Logos/backgrounds/photos/geometry come from the source; small raster lettering and screenshots remain reference-only. Charts are not imported as editable components.

SVG stays vector; portable copies remove scripts, external links and foreignObject without changing originals. Regeneration needs the LFS source and Python dependencies; consumers/builds use prepared files.

## Rules and implementation decisions

The af-dropcap, af-divider and af-divider--ornament styles are optional additions from the initial Framework implementation. Their source is not confirmed in the reviewed Figma or supplied PDFs, and they are not presented as official requirements or transferred components. The author guide and live examples explicitly identify them as extensions.

Sources confirm Alabuga Sans, large expanded headings, blue/white, geometric backgrounds, asymmetry and logo clear space. The PPTX also uses Muller Medium; the library standardizes on Alabuga Sans and normalized sizing. The 12-column grid, responsiveness, 28/64/96 px spacing, dark overlays and motion presets are implementation decisions, not extra official brand requirements.

Photos remain available to authors, while Framework samples use graphics/editable text without attributing corporate achievements to the product. Extraction/splitting grants no open license.

## Gallery

The gallery below uses the same background/logo manifest delivered to consumers. Project uploads and cropping are documented in [Constructor]({{CONSTRUCTOR_URL}}/docs/en/projects.html).
