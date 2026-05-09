# Phase 2 State Taxonomy

| State                | Meaning                                                     | User exit                                              |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| idle-empty           | No draft text exists.                                       | Paste/type text.                                       |
| idle-ready           | Draft text exists and no analysis is running.               | Analyze, edit, clear.                                  |
| analyzing-small      | Local worker is analyzing a normal document.                | Cancel, edit after completion.                         |
| analyzing-large      | Local worker is analyzing a large document.                 | Cancel.                                                |
| loaded-empty         | Empty input was intentionally analyzed.                     | Paste/type text.                                       |
| loaded-some          | Suggestions were produced and are below grouping threshold. | Apply, add word, edit, analyze again.                  |
| loaded-many          | Many suggestions were grouped.                              | Filter, apply representative fix, edit, analyze again. |
| loaded-no-issues     | Prose was analyzed and no issues were found.                | Edit, analyze again.                                   |
| error-recoverable    | Analysis failed but draft text is intact.                   | Retry, edit, cancel.                                   |
| error-fatal          | Worker cannot be recreated.                                 | Reload page; draft remains in the editor.              |
| cancelled            | User stopped analysis; previous result remains visible.     | Analyze again, edit.                                   |
| stale-result-ignored | A previous run finished after a newer run.                  | No visible action; current run wins.                   |

No state should leave the user without an action. Long-running analysis must have a cancel path.
