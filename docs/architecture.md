# Architecture

Live site: https://baditaflorin.github.io/local-proofreader/

Repository: https://github.com/baditaflorin/local-proofreader

## Context

```mermaid
C4Context
  title Local Proofreader Context
  Person(writer, "Writer", "Uses private grammar and style help")
  System_Boundary(browser, "User Browser") {
    System(app, "GitHub Pages App", "Static React app and local worker")
    System_Ext(extension, "Browser Extension", "Inline editor overlay")
    SystemDb(idb, "IndexedDB", "Local drafts, dictionary terms, history")
  }
  System_Ext(pages, "GitHub Pages", "Serves static assets only")
  Rel(writer, app, "Writes and checks text locally")
  Rel(writer, extension, "Uses inline suggestions on websites")
  Rel(app, idb, "Stores local-only data")
  Rel(extension, idb, "Stores accepted words and preferences")
  Rel(pages, app, "Serves HTML, JS, CSS, dictionaries")
```

## Containers

```mermaid
C4Container
  title Local Proofreader Containers
  Person(writer, "Writer")
  Container_Boundary(pagesBoundary, "GitHub Pages Boundary") {
    Container(staticApp, "Static web app", "React + Vite", "Editor, suggestions UI, version display")
    Container(staticAssets, "Static assets", "JSON + dictionaries", "Version metadata and local dictionaries")
  }
  Container_Boundary(browserBoundary, "Browser Runtime") {
    Container(worker, "Proofreader worker", "TypeScript worker + Comlink", "Grammar, spelling, style, rewrite analysis")
    ContainerDb(localStore, "IndexedDB", "Browser storage", "Local drafts and analysis history")
    Container(extensionRuntime, "Extension runtime", "Manifest V3", "Injects inline overlays in editable fields")
  }
  Rel(writer, staticApp, "Edits text")
  Rel(staticApp, worker, "Sends text in-memory")
  Rel(worker, staticAssets, "Fetches static dictionaries")
  Rel(staticApp, localStore, "Persists locally")
  Rel(extensionRuntime, worker, "Reuses local checking semantics")
```

## Boundaries

User text never crosses the browser boundary. GitHub Pages serves application files only and receives normal static-asset requests. The app includes visible links to https://github.com/baditaflorin/local-proofreader and https://www.paypal.com/paypalme/florinbadita.
