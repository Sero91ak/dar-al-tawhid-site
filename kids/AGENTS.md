# DĀR AL TAWḤĪD KIDS AKADEMI — scoped agent rules

These rules extend (never replace) the repository-root `AGENTS.md`. They apply to all files under `kids/**` and to scripts that operate exclusively on KIDS curricula.

**Mandatory single master brief:** Read `kids/docs/ACADEMY-MASTER-AUFTRAG-208.md` completely **before generating, editing or integrating any lessons**. Do not work from chat memories or write a competing brief. The source registry, 208-slot research ledger and roadmap named there are the project handoff; read their current versions, not outdated summaries.

**Fixed educational task:** 52 weeks × 4 new lessons = 208 independent lesson slots; 2 review days + 1 flexible day every week. Three independently authored age tracks (4–5, 6–8, 9–10). Never replace existing content with stubs or unlock a roadmap-only lesson. Historical IDs, ordering, per-child progress and stored completions must not change.

**Source integrity — a hard gate:** Qurʾān Arabic and verse numbering must be checked against a reliable exact text. For each ḥadīṯ verify Arabic wording, narrator, collection, number, authenticity and actual target URL. For historical aṯār verify attribution and grading; omit doubtful claims. For fiqh prioritize the Hanbali school and classical texts (e.g. Ibn Qudāmah's `al-Mughnī`), identify disputed matters and request qualified review rather than representing a contested ruling as consensus. Relevant early Qurʾān/Sunnah/Salaf interpretations take priority; do not import excluded theology or sectarian polemics into children's lessons. Source discovery is permitted on islamweb.net, shamela.ws, al-maktaba.org, ketabonline.com, dorar.net, archive.org, waqfeya.net and app.turath.io. A plausible URL or old `sourceAudit.verifiedDate` is **not** independent verification. An unverified record stays `not-reviewed`.

**Pedagogy and child safety:** Separate exact originals, explicitly marked sinngemäße German meaning and new teaching examples. No fabricated prophet quotes or images, no threats or fear-based storytelling, no pressure to obey unsafe adults, and no harmful shaming. For 4–5 use simple short content and 2 clear questions; 6–8 and 9–10 require 3+ varied age-appropriate prompts each. Allow children to seek help and set limits.

**Audio deferred:** NEVER generate, preview, spend credits, approve, insert or publish ElevenLabs audio now. Existing Serhat voice policy and queues are reference-only. Qurʾān tilāwah requires a genuine reviewed recitation, never a synthetic imitation.

**Protected interfaces:** No change to Service Worker, native build, manifests, themes, global floating tab bar, home screen, push, real child profiles or adult/Test app code without separately explicit authorization. CI treats KIDS and `test/**` as different lanes; use independent PRs. No live merge without the owner's explicit release instruction.

**Production method:** Start with repo status, `main`, PR #1089 and test-lane PR #1090. Pull, audit and batch-edit locally using filesystem tools; never perform dozens of uncoordinated contents-API writes or race concurrent agents. Process only open slots, checkpoint each batch and regenerate derived indexes atomically. Run every source, schema, 208-slot, grade, progress, offline reference, archive and CI test. Record blockers; do not silence tests merely to make them green.

**Status:** Follow `kids/docs/ACADEMY-208-PRODUKTIONSSTATUS.md`, updated after each accepted batch. Keep three counts distinct: (1) code-present, (2) independently source-reviewed/owner-approved, (3) actually live. All counts must be derived, not copied from this document.
