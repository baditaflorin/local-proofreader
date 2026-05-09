# Browser Extension

Build the content script:

```sh
npm run build:extension
```

Load `extension/` as an unpacked extension in Chromium-based browsers. The content script adds a small local-proofread button near focused textareas and contenteditable fields, then applies a shared lightweight inline ruleset without sending text to a server. It intentionally stays narrower than the full GitHub Pages app: no worker-driven report, no saved sessions, and no DuckDB history panel.
