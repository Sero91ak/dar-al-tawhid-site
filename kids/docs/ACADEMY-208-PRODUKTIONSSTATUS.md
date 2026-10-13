# DĀR AL TAWḤĪD KIDS AKADEMI — Produktionsstatus

> **Scope:** ONLY written classroom lessons + research/verification. Audio later. This document is an audit log, not a claim of public release.

## Status captured on 13 October 2026

- **208** planned independent new-lesson slots / **52** teaching weeks. Weekly pattern: Mon/Tue/Thu/Fri new, Wed/Sat review, Sun voluntary/flexible.
- **66/208** lesson slots on `main` at the last observed main fetch. Check again before proceeding.
- **90/208** lesson slots mapped to code on feature branch `kids/lessons-67-70-20261012`, **118** editorial slots (91–208) still open at last observed fetch. **Code-present != religiously verified != reviewer approved != live.**
- Working PR: **#1089** (KIDS). Separate Test-app PR: **#1090**. Both remained **open** when this status was written.
- Archive snapshot: **89 curriculum modules + separate Ṣidq module = 90**; latest locally read archive also reports **118** planned units.
- No authorization to publish `main`, enable new audio or push notifications. Existing voice references and pending text lists remain unapproved and must not incur ElevenLabs credits.

## Research source-of-truth sequence

1. `AGENTS.md` and `kids/AGENTS.md`: scope, app-lane, deployment and child privacy.
2. `kids/docs/ACADEMY-MASTER-AUFTRAG-208.md`: **single authoritative** brief.
3. `kids/data/academy-year-52weeks-v1.json`: all 208 slots and stable IDs.
4. `kids/data/academy-expansion-roadmap-v23.json`: open topics, pillars, situations, three age outcomes.
5. `kids/data/academy-source-register-208-v1.json` and `kids/research/academy-208-research-ledger-v1.json`: **per-slot source assertions and review flags**; always distinguish unverifiable inherited `sourceAudit` claims.
6. `kids/research/academy-118-quran-candidates-v1.json`: thematic Qurʾān *suggestions*, not certified evidence.
7. `kids/data/academy-source-bank-researched-v1.json`: narrow verified sample seeds; their approval does not transfer to unrelated lessons.
8. Compare the actual JS module objects, archive snapshot, locked learner progression and test expectations before adding new code.

## Newly rechecked examples (13 October 2026)

These examples are **individual reference checks**, not approval of complete units or a waiver of Hanbali fiqh review:

- Ṣaḥīḥ al-Buḫārī **1**, ʿUmar / intention: `https://dorar.net/hadith/sharh/3429`. Match the specific Arabic passage; classroom examples are newly written application.
- Ṣaḥīḥ al-Buḫārī **6312**, Ḥuḏayfah / bedtime and waking: `https://dorar.net/hadith/sharh/1652`. Separate the two prescribed Arabic formulae and preserve their literal order.
- Ṣaḥīḥ al-Buḫārī **135**, Abū Hurayrah / ablution after ḥadaṯ: `https://dorar.net/hadith/sharh/6252`. Verify separately in the collection because the Dorar explanation page shows another secondary compiler in its page heading. Do not falsely attribute Ibn Ḥazm's page label to al-Buḫārī.
- Ṣaḥīḥ al-Buḫārī **5017**, ʿĀʾishah / recitation of the Muʿawwiḏāt before sleep: `https://dorar.net/hadith/sharh/151175`. A real reciter must separately approve tilāwah audio.
- Ibn Qudāmah, **al-Mughnī**, Book of Purification, section on intention: `https://www.islamweb.net/ar/library/content/15/121/` (short section permalink; confirm target before placing in a released page). A classical Hanbali fiqh reference for that specific issue, not a blanket fatwā for all lessons.

## Blocking issues and release conditions

- **Kids PR #1089 CI:** old independent `test/kids/akademie/test-voice-audit-v20.cjs` in the target/main lane expected **58**, but kids feature branch reports **90**. Test-lane updates must be done separately; do not mix `test/` with `kids/` files in one PR or bypass the test.
- **Test PR #1090 CI:** a stale app-script cache-buster assertion in `scripts/test-kids-academy-v9.js` was still red in a recorded run. Reproduce against the PR's actual base and change only the inaccurate test expectation, preserving the validated behavior.
- **Voice Studio 2 Validate** on #1089 was also red in the latest observed run; inspect exact logs before fixes.
- A green source/sequence QA check **does not certify** every one of 90 historical curriculum source claims; independent source review and owner approval still remain.

## Batch log template (append only after real work)

### Batch YYYY-MM-DD / slot range

- Branch/PR, base commit:
- Previously present, newly added (slot numbers and IDs):
- Source references checked individually (original, narrator, collection, grading, URL):
- 4–5 / 6–8 / 9–10 independently reviewed:
- Hanbali fiqh review (when relevant):
- Safety and theological review:
- Changes to catalog, roadmap, school sequence and archive:
- Automated tests run, passes, failures and log IDs:
- Voice generated/approved: **NO / NO**
- Visitor publication: **NO**
- Next unfilled slot, known blocker:
