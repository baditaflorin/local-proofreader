# Browser Extension

Build the content script:

```sh
npm run build:extension
```

Load `extension/` as an unpacked extension in Chromium-based browsers. The v1 content script adds a small local-proofread button near focused textareas and contenteditable fields, then applies lightweight inline suggestions without sending text to a server.
