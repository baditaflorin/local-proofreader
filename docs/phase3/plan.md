# Phase 3 Plan

Ranked by real-user impact.

1. Add file import for `.txt`, `.md`, `.html`, and saved session `.json`.
2. Add drag-drop import for one or many files.
3. Add clipboard-read import with permission/error handling.
4. Add mobile-friendly file picker through standard file input.
5. Add restored last-session draft with explicit migration-safe session format.
6. Add one-click `Start fresh` that clears the live draft without wiping settings.
7. Add saved-session export with versioned JSON contract.
8. Add analysis JSON export with provenance.
9. Add corrected-text export as `.txt`.
10. Add copy-to-clipboard summary for current analysis.
11. Add shareable URL hash for reasonably small sessions.
12. Add explicit settings surface with real toggles only.
13. Persist settings locally and hydrate them on load.
14. Add custom-dictionary management, including removal and clear-all.
15. Add local history clearing so saved analyses do not become sticky clutter.
16. Add typed IndexedDB schema and migrations for settings and drafts.
17. Extract session import/export logic into its own module with schema validation.
18. Extract shared inline rules so the extension and app stop drifting.
19. Replace the placeholder integration test with real app-shell coverage.
20. Update smoke coverage for the new end-to-end stranger path.
21. Remove unused assets and dead persistence surfaces.
22. Update README and extension docs so claims match shipped behavior.

Explicit out-of-scope for Phase 3:

1. Remote URL import from arbitrary sites. A static Pages app cannot fetch most pages because of CORS; the app will explain this honestly instead of pretending.
2. Folder import. It adds UI and test surface without moving the main stranger path enough.
3. Print/PDF and automation snippets. Useful later, but weaker than import/export/state continuity right now.
