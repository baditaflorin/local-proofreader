# Phase 3 Stranger Test

Test date: 2026-05-09

Method:

1. Fresh-browser simulation with the rebuilt static app.
2. Imported a real fixture file, waited for analysis, exported a session, restored state, and checked the version/commit footer.
3. Re-ran the same path after the main fixes to see whether the same confusions remained.

## Initial Stranger Friction

1. There was no real file-import path, so the app felt like a demo editor instead of a tool.
2. There was no obvious way to take work back out except manual copy.
3. Reload continuity was weak enough that closing the tab felt risky.

## Fixes Applied Before Sign-Off

1. Added file import, drag-drop, clipboard read, session restore, and local last-session restore.
2. Added corrected-text export, analysis export, session export, and share URLs for smaller drafts.
3. Added persisted settings and explicit local draft restore.

## Final Stranger Pass

Path used:

1. Click `Start fresh`.
2. Click `Import files` and choose `rd02-hn-missing-space.txt`.
3. Wait for `Add a space after punctuation`.
4. Export `Session JSON`.
5. Copy `Share URL`.
6. Reload and confirm the last-session draft comes back.

Result:

1. The core end-to-end path is now understandable without asking for help.
2. The only immediate “where is it?” question left is remote URL import, and the app now explains why it is intentionally unsupported in Mode A.
3. The DuckDB report is useful but still reads as a compact local summary rather than a full reporting surface.
