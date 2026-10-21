# DĀR AL TAWḤĪD · Turkish OpenAI → DAR TEST (review lane)
Status: **development branch only; not deployed for visitors** (21 October 2026).

## Implemented
- A real paid OpenAI pilot artifact from GitHub Actions run **39655625273** is preserved under the canonical post ID at `desktop-preview/i18n-core-v1/translations/tr/post/hasan-al-basri-selbstpruefung-20261021-481-9b9306807c.json`. Cost usage already incurred: 927 tokens, **no new model calls for this commit**.
- Previous manually written Turkish placeholder with duplicate ID is removed **only from this feature branch**.
- German source `content/posts/hasan-al-basri-selbstpruefung-20261021-481.md` stays untouched.
- `/test/tr-review/`: test-only comparison of German source and explicitly **unapproved** Turkish draft; no review UI can mark content approved.
- `/test/assets/dar-adult-localized-content.js`: read-only locale resolver that accepts only revision-identical, explicitly approved language-pack records. Missing/draft/stale records visibly fall back to German.
- `test/assets/dar-home-v3-compact.js`, `test/assets/dar-more-v15.js` and `test/assets/dar-setup-hub.js` expose Turkish locale controls and translate only a **limited, reviewed subset** of UI labels; hardcoded app routes and unreviewed posts remain in German.
- New translation-worklist logic marks **stale drafts** as stale after German edits; the generator checks existing canonical files before calling the provider, even if its inventory is old.
- `.github/workflows/dar-test-tr-new-post-drafts.yml`: Test-branch-only, one changed canonical German post per run, at most one paid request, no paid reruns, review-only draft PR. This workflow does **not** publish translated content or run bulk translations.
- `.github/workflows/dar-test-turkish-content-integrity.yml`: offline tests (0 API calls) for revision matching, duplicate gating, keeping draft out of approved language packs, JS syntax.

## Editorial review requirements
1. Compare German text and Turkish translation line by line, including all attribution and uncertainty qualifiers.
2. Verify cited Qurʾān, Sunnah and Athar sources and any Hadith grading against originals; a model translation itself provides no source authentication.
3. Keep canonical ID, sourceHash, original language, Arabic original, citation references, speaker and answer keys intact.
4. Do not change `status` to `approved` without recording actual `reviewer.linguistic`, `reviewer.religious`, `reviewer.arabicOriginalChecked`, `reviewer.sourcesChecked`, and `reviewedAt`.
5. Re-run worklist + pack builder after approval, confirm `tr.json` includes only approved and up-to-date records, test all relevant routes, then request a separate production release decision.

## Explicit remaining work
**Not a complete Turkish app.** Full UI labels for all routes, Q source pages, Ḥadīṯ, Duʿāʾs, books, search, learning, quiz and adult native/iOS integration still need structured adapters, separate translations, and approvals. Do not auto-translate religious manuscripts at page load. No kid content, Qurʾān originals, PDFs, visitor pages, push, widgets or tvOS changed on this branch.

## Local checks
```bash
node desktop-preview/i18n-core-v1/test-translation-worklist.cjs
node desktop-preview/i18n-core-v1/test-tr-approved-reader.cjs
node desktop-preview/i18n-core-v1/translation-worklist.cjs --out /tmp/dar-tr-worklist.json
node desktop-preview/i18n-core-v1/build-language-packs.cjs --inventory /tmp/dar-tr-worklist.json --output /tmp/dar-tr-approved-packs
```
