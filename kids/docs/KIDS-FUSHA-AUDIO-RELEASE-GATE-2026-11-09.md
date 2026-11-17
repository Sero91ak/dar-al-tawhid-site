# TAWḤĪD KIDS 1.0 – Fuṣḥā Audio Production Gate (2026-11-09)

Status: **PREPARED / NOT GENERATED / NOT PUBLICLY APPROVED**. Scope: KIDS only. No production app changes.

## Locked voice contract
- Speaker: existing Serhat Abu Malik Master; voice ID `DkU7j9uO4ZEtLD2iRZSH`; model `eleven_v4`; profile `kids_story`.
- Pronunciation dictionary `Q8w3SxtoVo8NSjsnlJEd`, version `wSzgkGpAwEDiTak8DApc`; verify exact live dictionary version before production.
- Reuse existing approved reference examples for Ādam, Idrīs and Muḥammad.
- Preserve exact existing settings in `kids/data/academy-voice-policy-v10.json`.
- German instruction may contain verified Fuṣḥā terminology. **Arabic Qurʾān recitation must be an authenticated human recitation; never generate it using TTS.**

## Preflight – mandatory before first billable batch
1. Regenerate and commit `kids/data/academy-voice-plan-v22.json` from current curricula; the previous snapshot is stale. Require all CI jobs green.
2. Compare every final spoken phrase against existing verified owner-voice assets by exact normalized text + voice ID + model + settings. Text-archive matches are not audio evidence.
3. Inspect existing dictionary entries and pronunciation reference clips for each Arabic term. Do not invent phonetic overrides or transliterations.
4. Verify all spoken prompts, choices and age-tier teaching text for the final 4–5, 6–8, 9–10 versions. No recording/writing prompts to children.
5. Verify 3 Arabic text fragments separately; source check precedes pronunciation approval.
6. Owner must approve the final phrase list and explicit billable generation batch before paid requests.

## First pilot (maximum four new clips, maximum 1,200 prepared characters)
Select only exact final phrases from the current manifest after deduplication. Prioritize a short German greeting with Salām, one instructional sentence containing a Fuṣḥā term, one question, and one feedback line. If a verified matching clip already exists, reuse it instead of generating. Never substitute an old abbreviated Salām.
For every generated clip record: exact text, language, source lesson and age, voice ID, model, dictionary ID/version, settings hash, audio SHA-256, duration, credit usage, technical QA, pronunciation QA, and owner listening decision. Stage only; do not update public playback manifests.

## Release blockers
- No owner-approved V4 exact-text Academy coverage yet.
- No human-approved pilot of current texts yet.
- V22 generated audio-plan snapshot currently differs from repository fixture.
- Device E2E and App Store/TestFlight release verification outstanding.

## Rollout
After pilot listening approval, generate in small deduplicated batches within existing limits; human approve before public publication. No auto-generation on app open or quiz interaction. Never publish staged/deprecated clips.
