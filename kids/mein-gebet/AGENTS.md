# AGENTS.md — DĀR AL TAWḤĪD KIDS / Mein Gebet

These instructions **add to**, and never override, the repository root `AGENTS.md`. Scope: this prayer-learning feature and its isolated tests only.

## Mission
Complete the real children’s prayer-learning experience from the existing GitHub draft without inventing completion. Start with `AUTONOMOUS-AGENT-HANDOFF.md`, then consult `MASTERPLAN.md` and `rigging/PROJECT-STATUS-RELEASE-GATES.json` when relevant. Work through implementable defects and test each repair. Do not spend endless cycles producing validators instead of improving a working preview.

## Scope and approval boundary
- Repo: `Sero91ak/dar-al-tawhid-site`; existing protected draft PR **#825** / branch `feature/kids-mein-gebet-preview-20261008`. Base new working branches **on that feature branch**, not on main. Open follow-up PRs targeting the draft branch where supported; otherwise push only to this exact feature branch after checking its latest HEAD. Never modify unrelated adult apps.
- **Never merge into `main`, trigger a deployment, publish a public lesson, distribute push notifications, replace original figures, spend paid creative/audio credits, or alter protected production infrastructure** without fresh explicit user permission.
- Preserve the already approved reference images `kids/mein-gebet/assets/figur-junge-original.png`, `figur-maedchen-original.png`; no invented reconstruction marketed as the user's original.
- Boys: preserve original face, hairstyle, white thawb and white/gold kufi. Girls: original pink, complete hijab/khimar and prayer garments, **never exposed hair or neck**.
- Preserve existing provisional Qiyām and Takbīr animation clips unless a separately approved pose change is requested. No unauthorized renaming/removal of clips.

## Truth and safety gates
- The original boy V7.7 GLB SHA-256 is `353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa`; five-view turnaround PNG SHA-256 `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9`. Their authentic raw bytes were **not accessible** in recent work. Verify hashes of actual files before performing a new comparison. Never substitute fixtures or claim recovered bytes from a filename alone.
- Legacy V7.7 five-view silhouette IoUs: front 89.663%; nominal uncalibrated three-quarter 83.245%; right 87.264%; rear 88.963%; left 86.511%. All five below the ≥90% goal. These are historical v3 results, **not results** of the revised v4 measurement. Three-quarter camera needs independent calibration. IoU alone never certifies face/clothes identity.
- Structural, buffer, skeleton, geometric, automated animation and inverse-bind tests on synthetic data do not imply actual user-approved GLB, acceptable prayer movements, approved teaching, or real iPhone/iPad behavior.
- Follow `content/hanbali-review.json` and `HANBALI-QUELLENPRUEFUNG.md`: the stated Hanbali teaching variant is chosen as a **draft**, not pre-approved for animation, audio or teaching. Qurʾān/authentic Sunnah and sourced review before religious approval. Visually inspect Qiyām, shoulder-level Takbīr/Rafʿ al-Yadayn, Rukūʿ, rising, both Suǧūd, Jalsah, Tashahhud and Salām; do not fabricate scholarly approval.

## Engineering loop
1. Read current branch/PR state; preserve root repository restrictions. Identify a concrete defect, reproduce it and prioritize real usability/UI/animation/data improvements rather than just scaffolding.
2. Implement minimal targeted fix and regression test; run all existing native Kids rigging tests and relevant UI/browser/mobile accessibility tests as applicable. Verify GitHub Actions on the **exact** final SHA; a green intermediate SHA is insufficient.
3. Keep the profile-driven original 2D preview functional while original 3D models are missing. Do not swap in fake 3D and call it original. Respect a single small Home test-entry, no new permanent Kids navigation tab, and isolated rollback.
4. Keep `rigging/PROJECT-STATUS-RELEASE-GATES.json` honest: unavailable files, missing tests/approvals = false/null. Update the issue/PR with evidence, exact test runs and unresolved blockers.
5. Preserve work in commits on authorized draft branches. If blocked by missing original assets or actual device/theological sign-off, log the blocker precisely and continue with genuinely independent tasks; do **not** claim the project is done.
6. Only declare finished after BOTH user-approved original boy/girl meshes, validated original likeness, independently checked full prayer moves, required religious review, working isolated staging, real-device testing, and explicit user release authorization.

All follow-up agent outputs and tasks MUST point to the shared GitHub handoff/status files. No automatic, private ChatGPT conversation access is implied.
