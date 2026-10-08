# MAJLIS AL-ʿILM · DĀR AL TAWḤĪD Kids

Status: **isolated prototype** (2026-10-08). The live app on main remains untouched. Do not enable audio/LLM endpoints based solely on the UI consent checkbox.

## Product contract
- Audience: existing Kids profiles aged **4–5, 6–8, 9–10**. Reuse existing profile gender/age, no extra profile system.
- Entry: one compact capsule below the four existing Kids home capsules. Existing navigation, hero, wordmark animation, profile switching and Glow must remain unchanged.
- Interaction: tap a proposed question, type a question, or tap microphone to record up to 15 seconds; review then send; receive brief friendly text and, once backend authorization is complete, press Play for the **Serhat Abu Malik – Master** voice.
- No unsolicited autoplay. No always-on microphone. Explicit close/stop. Separate text and audio accessibility paths.
- A few optional mini-quiz prompts encourage learning without streak pressure or addictive incentives.
- Acknowledge that a digital system is speaking; never pretend that the parent/person whose voice is cloned is live or listening.
- Kids should receive sources as one small source line, not an adult-sized scrolling list. Parent may open deeper app/website sources later.

## Source and safety contract
1. Retrieval from curated Kids content and verified Qurʾān/Sunnah/early scholarship, with internal authoritative source IDs. Public external sources restricted to the project's approved list; independently verify editions and references before publishing.
2. The answer must remain within the retrieved source span. If no source is verified, give a short "Ich bin nicht sicher; frag deine Eltern" answer; no invented citations or fabricated certainty.
3. Disallow personal takfīr, identifying who is a kāfir, fatāwā about individual children/families, hate, violence, extremist recruitment, sexuality/adult subjects, legal or medical advice. Offer age-appropriate neutral handoff to parents or a trusted adult. When child discloses immediate danger, direct them to trusted immediate help without interrogation.
4. No third-party links opened automatically by the child. Where a referenced resource is relevant, take the family to an approved source in the app or website.
5. Prevent child sharing address/phone/password/identity in prompts. No free-form unreviewed internet retrieval.
6. Do not expose original user voice samples, API secrets, parent credentials or child's private data to the browser.
7. Cap input length, audio length and answer length; apply server rate limits, abuse detection, prompt injection defenses and maximum voice credits.

## Backend interfaces — **IMPLEMENTED IN FEATURE BRANCH; ALL BILLABLE/SENSITIVE OPERATIONS DISABLED BY DEFAULT**
- `POST /kids/api/majlis/answer`: signed 20-minute parent-code pilot session -> sanitized child question (<=350 characters), age bucket -> twenty fixed, curated answers with conservative safety fallbacks, `{ok, answer, source, answerId, verified, mode:"curated_only"}`. **No generative AI or RAG is deployed yet.**
- `POST /kids/api/majlis/transcribe`: authenticated session and separately enabled `KIDS_MAJLIS_STT_ENABLED` flag, max 900k multipart audio and file signature checks; Cloudflare Whisper; recognized text is displayed for confirmation before it becomes a question. **Server-side duration validation beyond byte length is still missing**; keep disabled until implemented and tested.
- `POST /kids/api/majlis/speak`: submit HMAC-signed `answerId` bound to the active parent session, not arbitrary text. Backend resolves a fixed approved response, passes it to existing ElevenLabs `synthesizeDarVoice` using `eleven_v4`, explicitly configured server-side master voice ID and dictionary, then returns MP3. **Disabled until `KIDS_MAJLIS_TTS_ENABLED=true`; spoken Arabic/German quality remains untested.**
- A server-verified parent-code pilot is implemented using `KIDS_MAJLIS_PARENT_PASSCODE` (random >=24 chars) plus `KIDS_MAJLIS_SIGNING_KEY` (>=32 chars). Cookie is HttpOnly, Secure, SameSite=Strict with max 20-minute TTL. Parent code input is discarded after login. This **does not verify a guardian's legal identity, is not a multi-family auth system and has no per-family revocation**: not suitable as a general release. Full parent-account identity, revocation and consent records remain required.
- Child data: ephemeral in memory by default, no unnecessary collection, no cross-session audio history, documented retention and EU provider/contract assessment. Provide delete/export if persistent history is introduced.
- Voice latency: use a single authoritative answer text and speech response; audio must match visible text, not a separate improvising agent.
- Reuse the established source-aware adult ʿIlm architecture only for retrieval mechanics. Adult answer prompts and browsing freedom cannot be exposed directly to a child.
- Confirm third-party provider AVV, region, storage policies and age/child processing terms before enabling external STT/TTS/LLM. Article 8 GDPR parental consent rules may apply when consent is the chosen processing legal basis.

## Delivery gates
- [x] Isolated new Home capsule, focusable and keyboard usable
- [x] Responsive dedicated Majlis dialogue, dark blue/gold restrained glow
- [x] Text question send + 12 fixed, sourced topic patterns and honest out-of-scope fallback
- [x] Profile age bucket read; short-form variant for ages 4–5
- [x] Boy/girl local profile drives affectionate Bruder/Schwester welcome and signed gender-specific answer text
- [x] Small knowledge-game step every third question
- [x] Mic capture (explicit start/stop, 15 s maximum) with iOS MIME-sensitive upload
- [x] No local permanent chat history and no browser synthesized voice substitute
- [x] Short signed parent-code *pilot* session, origin checks, no public credentials
- [ ] True per-family authenticated guardians, revocable consent
- [x] Deterministic, age-gated retrieval over 120 app-approved Duʿāʾ, 900 approved quiz explanations, 20 manually sourced topics and Quran reference indexes; no free-form religious generation
- [ ] Independent scholarly review of the 900 quiz items, multi-school Fiqh questions and Arabic pronunication before broad child-facing rollout
- [x] Opt-in-only protected STT/TTS routes implemented (both disabled by default)
- [ ] Verify hard 15-second recording duration on server and German/Arabic STT
- [ ] Confirm owner-voice identity and mixed-language quality on physical devices
- [x] Signed answer-id playback tied to active cookie session; arbitrary text cannot be synthesized
- [x] Direct Duʿāʾ reading, canonical German and Arabic V4 assets, slow clips and word-by-word audio with no new synthesis
- [x] Qāriʾ recitation of validated numeric Qurʾān references, selected sourced concepts, and clearly labelled Qurʾān-Duʿāʾ excerpts
- [ ] Tested word-level German/Arabic vocabulary and source metadata
- [ ] iOS Safari/PWA and tablet tests, keyboard/screenreader/back-swipe tests
- [ ] Production security, privacy, QA, rate limits and deploy
- [ ] Remove preview disclosure only when backend is genuinely activated

## Test scenarios before launch
- Age 4–5, 6–8, 9–10; girl and boy profiles; all global themes; portrait and landscape.
- Unknown source, ambiguous fiqh questions, opinions disputed among legal schools, child asks to judge a person's faith, medical/legal question, unsafe disclosure.
- Wrong language recognized, mixed German/Fuṣḥā in one message, microphone denied, iOS recording format, offline, network timeout, quota exhausted, pause and restart, pressing back.
- No hidden audio capture, zero browser exposure of API keys, no storing child identifiers in analytics/logs.
- Never ship a silent "fake voice" fallback that purports to be the owner's master voice.

**Status summary:** UI + guarded demo/pilot API + smoke tests in an open draft PR, no merge or production deploy. The production voice assistant is still **not live**.

## Secrets and cost controls
The Worker `cloudflare/wrangler.toml` now declares `KIDS_MAJLIS_LIMITER` at 10 requests/minute and `KIDS_MAJLIS_VOICE_LIMITER` at 2 syntheses/minute. This Cloudflare Rate Limiting API is eventually consistent, **not** a billing cap. ElevenLabs budget guard and a per-family daily quota are still needed. Set new secrets only after family privacy review and staging tests. Never include secrets in repo or browser.

Feature flags: `KIDS_MAJLIS_PARENT_AUTH_ENABLED`, `KIDS_MAJLIS_STT_ENABLED` and `KIDS_MAJLIS_TTS_ENABLED` all default to off. This intentionally fails closed in production. The stand-alone development branch runs locally as a type-and-quiz preview, with parent checkbox; network transcription or speech never works without configured signed server sessions.

CI file: `.github/workflows/kids-majlis-check.yml` triggers `node scripts/verify-kids-majlis.mjs` and a dry-run Wrangler build on PR updates, with no deployment or paid voice calls.

## Kids approved topics extension
Eight additional short source-linked explanations have been aligned to the six existing `kids/data/deen-lessons.json` headings and verified Kids hadith examples: Īmān, Allah's Names, ʿIbādah, Adab, Āḫirah, neighbor rights, Qiblah, and Niyyah. This is still a small *editorial answer bank*, not an AI that can safely answer all open-ended Fiqh questions. All references require final source-by-source review before public launch.

## Source hierarchy, epistemic restraint and user experience (October 2026)
- Sources can include Qurʾān (direct verse reference), reliably graded Sunnah, Ṣaḥābah and Tābiʿīn reports, Salaf, and later qualified scholarly works. **Do not** treat a later commentary as Qurʾānic text or attribute a statement to an early authority without a precise verified reference; disagreements must be labelled rather than concealed. The current corpus consists of the reviewed Kids data; it **does not** yet represent a scholarly verified survey of the later schools or every salafī narration.
- The retrieval engine is strictly extractive: source-bearing, approved child-oriented answer snippets only. High-confidence matches produce a short explanation and original source; unsupported / disputed questions produce **„Allāhu aʿlam – Allah weiß es am besten“** and an adult handoff. In particular, the service does **not** pretend to know that Qurʾān and all prior scholars are silent on a question: it only says the **available verified Kids corpus** has no decisive source.
- The public proof-of-concept is capable of safe client-side (no question upload) selection of precise 120 Duʿāʾ metadata and numbered Qurʾān verses. Other 900 quiz explanations require the parent-authenticated server search. The public proof-of-concept does **not** synthesize arbitrary spoken child answers or transmit recorded children's speech.
- The new index `kids/data/majlis-knowledge-v1.json` is derived from `kids/data/dua-kids.json`, `kids/data/quiz-kids.json` and the existing `assets/dar-quran-audio-pack.js` recitation offsets: 120 verified Dua records, 900 published and app-approved quiz records and 114 Sūrah āyah counts. It references only existing same-origin Master Fuṣḥā/German/slow/word audio paths. **The 900 approval markers are inherited project statuses, not a claim of fresh independent scholarly audit.**
- A read/hear/slow/word-by-word choice is attached to the selected Duʿāʾ in the chat. Quran recitation uses the existing `ar.alafasy` qāriʾ pack, never a TTS reading falsely passed off as a Qurʾān recitation. For verses sourced only as a Duʿāʾ phrase, display that phrase labelled *excerpt*, not a fabricated full verse.
- The audio-generating API does not speak data sent by the client; it resolves a short-lived signed answer reference to its canonical approved text. The selected boy/girl gender is included only for correct phrasing and signed along with the answer reference, not used to grant authorization.
- For Qurʾān full-text search outside curated excerpts, add a carefully verified full Arabic/German verse corpus with ayah IDs and recitation alignment **before** representing the search as complete. For nuanced early/late scholar opinions and contested Fiqh, require source granularity (author, Arabic quotation, book, volume/page, grade and provenance), human audit and clear limits before considering model-generated conversational rewrites.
- Age buckets prevent direct answers from material not approved for that entire bucket; individual registered child ages require a separately verified parent account. Personal data and child distress are screened out locally, with a same-process trusted adult handoff.
- No claim of fully conversational real-time AI, final Fuṣḥā quality, deploy completion or all-child-data compliance is authorized by this experimental branch.
