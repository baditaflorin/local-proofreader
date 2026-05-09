# Phase 3 Input Audit

Audit date: 2026-05-09

Legend:

- `green` works fully
- `yellow` works partially
- `red` claimed but broken or not built

| Pathway                        | Status | Evidence                                                              | Gap                                                        |
| ------------------------------ | ------ | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Sample draft on first load     | green  | `src/App.tsx` seeds `sampleText` into the editor                      | None                                                       |
| Direct typing in editor        | green  | `<textarea>` is the main input surface                                | None                                                       |
| Paste plain text into editor   | green  | Native textarea paste works                                           | No paste-specific guidance or normalization feedback       |
| Paste rich HTML into editor    | yellow | Browser strips to plain text in textarea                              | User gets no signal that formatting/links were flattened   |
| File upload                    | red    | No file picker or importer in app                                     | Real users cannot load `.txt`, `.md`, or saved state files |
| Drag and drop file input       | red    | No drop handlers or drop zone                                         | Real user flow is blocked for desktop drag-drop            |
| Clipboard read button          | red    | No `navigator.clipboard.readText()` flow                              | Users must manually focus and paste                        |
| URL input                      | red    | No URL entry surface                                                  | No honest guidance around Pages/CORS limitations           |
| Multi-file input               | red    | No batch import path                                                  | Impossible to compare or process several drafts            |
| Folder input                   | red    | No folder picker                                                      | Out of scope for v1 unless explicitly added                |
| Mobile picker                  | red    | No file input means no mobile files path                              | iOS Files / Android picker unsupported                     |
| Imported state file            | red    | No state import contract in UI                                        | Can’t resume work on another machine                       |
| Deep link / share state        | red    | No hash or query state support                                        | Collaboration and support are harder than needed           |
| Restored autosave              | yellow | Analysis snapshots persist, but not full draft text or UI state       | Reload can lose the working draft                          |
| Browser extension inline input | yellow | Extension supports textareas, text inputs, and contenteditable fields | It does not reuse the app inference engine or persistence  |

Summary:

- Green: 3
- Yellow: 3
- Red: 9

Top blockers:

1. There is no first-class “bring your own file” path.
2. There is no portable state import/export path.
3. Reload persistence is too thin for real work.
