# Contributing to Framework

[Русский](CONTRIBUTING.md)

Use one branch per task. Do not change document formats during mechanical extraction. Import public exports and commit dependency/lockfile changes together. Schema, DOM/CSS and renderer changes need old-document, negative, accessibility and published-consumer verification.

Run build, unit, package, consumer, docs and browser checks. Change token sources and generated layers together and compare visual changes against baselines. Update RU/EN together. Describe problem, final behavior, compatibility and evidence in PRs; never present mocked API output as real generation.

Before pushing, enable Git LFS, required review/Quality checks and main/tag protection. The repository owner is alexonderia; do not invent teams. Review staged files for secrets and large artifacts. Publish the tested tgz only and never overwrite a version. Deploy the registry and backup/recovery independently using infra/registry/README.md.

Do not alter original PPTX/PDF/Figma during refactoring or grant an open license to corporate materials. Prepared WOFF2/assets suffice for normal builds; regeneration uses Python/Pillow/fontTools and LFS sources. Do not commit local projects, models, tokens or complete evidence directories.

Framework must not import Constructor, storage, AI or server. Trusted GPU runners and author acceptance stay in Constructor. DOM/CSS semantics are part of SemVer; applications accept updates in independent PRs.
