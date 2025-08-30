# Release checklist (url/router improvements)

1. Lint/build/typecheck — OK
2. Tests wtr (Chromium) — OK
3. Exports compatibility — no breaking changes
   - url: preserved `url` instance; added `configure`, `navigate`, query/hash helpers
   - router: `Router.configure(adapter, {withUrl})` backward-compatible (default true)
4. README updated — Quick Start for URL/Router
5. Semver: minor (new features, no breaking)
6. Changelog: describe new API and migration note from local state to SignalAdapter
7. Tag and publish: `npm run release:next` or `release:canary`
