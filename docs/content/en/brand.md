# Brand sources and assets

## Single owner

Framework owns design/figma-tokens.json, fonts/alabuga-sans.ttc, prepared src/fonts/*.woff2, assets/brand and docs/brand-sources. The original Figma link is restored in docs/brand-sources/figma.md. Original Colors, Visual rules, Typography hierarchy and Button examples PDFs and the Alabuga presentation PPTX retain their contents. Git LFS identifies originals by SHA-256; npm contains prepared resources only.

## Provenance

The presentation contains 28 slides, 67 media entries, 65 unique materials, five charts and one table. scripts/extract_brand.py writes original media to design/pptx-originals and derived assets to assets/brand. The [manifest](/assets/brand/manifest.json) records hashes, dimensions, transparency and slide numbers. Logos/backgrounds/photos/geometry come from the source; small raster lettering and screenshots remain reference-only. Charts are not imported as editable components.

SVG stays vector; portable copies remove scripts, external links and foreignObject without changing originals. Regeneration needs the LFS source and Python dependencies; consumers/builds use prepared files.

## Rules and implementation decisions

Sources confirm Alabuga Sans, large expanded headings, blue/white, geometric backgrounds, asymmetry and logo clear space. The PPTX also uses Muller Medium; the library standardizes on Alabuga Sans and normalized sizing. The 12-column grid, responsiveness, 28/64/96 px spacing, dark overlays and motion presets are implementation decisions, not extra official brand requirements.

Photos remain available to authors, while Framework samples use graphics/editable text without attributing corporate achievements to the product. Extraction/splitting grants no open license.

## Gallery

The gallery below uses the same background/logo manifest delivered to consumers. Project uploads and cropping are documented in [Constructor]({{CONSTRUCTOR_URL}}/docs/en/projects.html).
