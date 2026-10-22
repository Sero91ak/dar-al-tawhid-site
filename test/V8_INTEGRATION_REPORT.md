# DĀR AL TAWḤĪD V8 integration record

## Isolation

- Integration branch: `codex/v8-integrated-designlab-20261022`
- Clean base: `51819da661d094e1c5738f0685478e8683c0a6b7`
- Worktree created separately from all pre-existing dirty worktrees.
- No visitor, Kids, push, worker, service-worker, manifest or deployment files are part of this integration.

## Source snapshots

- Complete shell / Duo lab: `4e8049aa4f671a4296e534078730a0d9da62f657`
- Dashboard / nine-locale overhaul: `c29c3259ad952b37c5f7538ad70e64fac435dbee`
- Standalone Duo navigation: `c080a45b518c753cc96c8f695a0281524e0be3df`
- Historic rollback reference supplied by the owner: `18e42c4c21f48f3d16da2759c868c33c03659629`

## Consolidation decisions

- One active presentation module: `v8-integrated-shell-v1`.
- Reused the broad route hierarchy and reader-preservation markers from the complete shell.
- Reused density, reduced-motion, appearance and centralized locale integration concepts from the overhaul.
- Reused actual-viewport, keyboard and 760 px capacity checks from the Duo implementation.
- Alternative rails and shell modules are deliberately not linked from `test/index.html`; this prevents competing navigation and CSS engines.
- Dashboard personalization is local and explainable. It ranks real visited areas by frequency and recency, provides a reset, and does not invent recommendations or call an external API.

## Known source conflict

The nine-locale source branch contained a malformed `reviewStatus` object whose string had been spread into numeric character keys. It was normalized to one explicit status per registered locale. French and Spanish remain `draft-incomplete`; the other non-German languages remain marked as requiring linguistic review.

## Rollback

The integration can be removed without resetting the repository: revert the integration commit, or remove the two `darV8IntegratedShell` references from `test/index.html` together with the two integrated asset files. Never hard-reset a shared worktree.

## Verification completed

- `node --check test/assets/v8-integrated-shell-v1.js`
- `node test/tools/v8-integrated-shell-qa.cjs`
- JSON parsing for the V8 locale catalog and global scope lock
- `node scripts/change-scope-lock-guard.js`
- `git diff --check`
- Local HTTP delivery from `http://127.0.0.1:4173/test/` for HTML, integrated JavaScript, integrated CSS and nine-locale JSON
- Native `DarV8DesignLab` target (display name `DarDesignLab`) built successfully for iPhone 18 Pro, iPhone Duo and iPad Air 11-inch (M4) simulators.

## Verification still open

- Automated browser interaction is not claimed: Selenium is not installed in the isolated worktree and the sandboxed local Chrome invocation produced no DOM result.
- Real-device Fold/Galaxy, Android PWA, rotation, Dynamic Type, touch, account, GPS, audio, sharing and reader end-to-end checks still require an executable browser/device session.
- No Cloudflare deployment, TestFlight upload, visitor release or merge to `main` was performed.
