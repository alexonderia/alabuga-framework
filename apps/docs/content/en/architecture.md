# Architecture

## Package boundaries

| Package | Responsibility | Dependencies |
| --- | --- | --- |
| framework | Schema, runtime, compositions, fitting, export | Zod; no editor |
| ai | Contracts, commands, generation, content review | Public framework APIs and Zod |
| editor | Gallery, canvas, properties, IndexedDB, AI UI | framework and ai |
| ai-server | HTTP, limits, Ollama, model initialization | Node.js and model configuration |
| docs | Manuals and interactive examples | framework |

One repository allows coordinated schema, editor and test changes in one PR. Packages are private and need no npm publication. Cross-package imports use public exports only. Shared model configuration lives outside the server implementation.

## Documents and rendering

The schema remains version 3. Documents contain sections, elements, positions, backgrounds, typography, actions and motion. Canvas, preview and export use the same runtime. The editor adds authoring controls and maintains change history in EditorModel. Schema imports need no DOM or CSS; rendering and slide measurement require a browser.

## Assets and export

IndexedDB stores images separately from document structure, referenced through stable `asset:` identifiers. The editor adapter resolves them before display and export. Library export also accepts an asynchronous `resolveAsset(id)` function and explicit standalone runtime CSS/JS. It never accesses IndexedDB.

Image processing belongs to framework; storage does not import editor export. The standalone runtime is an explicit build prerequisite consumed through public package entries. CSS, fonts and runtime script are embedded in exported HTML.

## Generation

Request → outline → semantic-slot content → commands → isolated draft → checks → application. AIProvider separates transport from generation. GenerationServices supplies browser slide fitting; the ai package does not import editor UI. Geometry validation is provided as a callback.

The AI panel loads dynamically. Draft changes do not replace the active project before application. Project documents do not include prompts, generation state or diagnostic reports.

## Decisions and limits

There is no server project database, account system or synchronization. The model Docker volume is not a project backup. The AI server executes one request at a time. Changing these constraints requires a separate architectural decision and migration tests, not an implicit extension of this refactor.
