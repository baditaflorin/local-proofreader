# Deploy Guide

Live site: https://baditaflorin.github.io/local-proofreader/

Repository: https://github.com/baditaflorin/local-proofreader

GitHub Pages is configured from `main` branch `/docs`. To publish manually:

```sh
make build
git add docs public/version.json
git commit -m "ops: publish pages build"
git push
```

Rollback is a normal git revert of the publishing commit:

```sh
git revert <commit>
git push
```

No custom domain is configured in v1. If one is added, create `docs/CNAME`, point DNS to GitHub Pages, and keep Vite `base` aligned with the final URL.

GitHub Pages does not support `_headers` or `_redirects`. The build copies `docs/index.html` to `docs/404.html` for SPA fallback behavior. Service worker scope must stay under `/local-proofreader/`.
