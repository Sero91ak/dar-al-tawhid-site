# DARNext Heritage Synchronization — 2026-10-24

## Isolated branch

- Base: codex/darnext-apple-heritage-master-v1-20261024
- Base commit: 59830126b81aac19bde78854acb387a49b604ee8
- Isolated result: codex/darnext-apple-heritage-sync-20261024
- Source synchronization commit: 909f73e4e9cb04dc7a8ec5aff82fa1bd86584599

## Controlled comparison

The local DARNext blob inventory was compared path-by-path with Apple Heritage before creating the tree:

- 300 files identical
- 15 files changed locally and overlaid
- 10 files present locally and added
- Native branch matched the local blob inventory exactly
- Existing Apple Heritage files outside these DARNext paths were preserved through the base tree

The overlay includes implemented DARNext Swift sources, design tokens, reader, media bindings, content synchronization, resources and unit/UI tests.

## Lossless local backup

- Archive: /private/tmp/DARNext-Xcode-workspace-backup-20261024-203142.tar.gz
- Size: 387 MB
- SHA-256: a0bdf485359b6a7d3666ac19a939f854ca5bcdd0859f33e493c8605af7369047

## Protected scope

Widgets, WidgetBundles, App Groups, entitlements, productive app targets, website, workers and push delivery files were not modified or overlaid. No push notification or release action was performed.

## Verification

- xcodebuild clean: succeeded
- DARNext BuildProject(buildForTesting: true): succeeded, 0 errors
- DARNext test plan: 7 passed, 0 failed, 0 skipped
- Device verification was performed previously on iPhone Duo.

Push configuration remains preparation-only.