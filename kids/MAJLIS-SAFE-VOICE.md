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

## Backend interfaces — **NOT LIVE / NOT IMPLEMENTED**
- `POST /kids/api/majlis/answer`: parent-authorized session -> sanitized child question (<=350 characters), profile age bucket, only relevant short conversation context -> vetted retrieval + constrained answer, `{id, answer, source_id, confidence, suggested_next}`.
- `POST /kids/api/majlis/transcribe`: authenticated parent-consented session; short recorded multipart audio. Check MIME + magic bytes/size/duration. STT via ElevenLabs Scribe or Cloudflare Whisper. Reject if server not authorized; no request bodies/transcripts in logs. Show transcription to the child for correction **before sending a question** in production.
- `POST /kids/api/majlis/speak`: submit signed `answer_id`, not arbitrary text. Backend resolves approved response text, uses ElevenLabs v4/v4 Turbo with server-secret `ELEVENLABS_VOICE_ID`, dictionary ID `Q8w3SxtoVo8NSjsnlJEd`, version `wSzgkGpAwEDiTak8DApc`, then streams audio (German and correctly vocalized Arabic). Do not allow unauthenticated general-purpose TTS.
- Parent sign-in and explicit revocable server-side authorization must be built using verified backend identity; localStorage/check box is insufficient. No vendor calls before signed authorization is available.
- Child data: ephemeral in memory by default, no unnecessary collection, no cross-session audio history, documented retention and EU provider/contract assessment. Provide delete/export if persistent history is introduced.
- Voice latency: use a single authoritative answer text and speech response; audio must match visible text, not a separate improvising agent.
- Reuse the established source-aware adult ʿIlm architecture only for retrieval mechanics. Adult answer prompts and browsing freedom cannot be exposed directly to a child.
- Confirm third-party provider AVV, region, storage policies and age/child processing terms before enabling external STT/TTS/LLM. Article 8 GDPR parental consent rules may apply when consent is the chosen processing legal basis.

## Delivery gates
- [x] Isolated new Home capsule, focusable and keyboard usable
- [x] Responsive dedicated Majlis dialogue, dark blue/gold restrained glow
- [x] Text question send + 12 fixed, sourced topic patterns and honest out-of-scope fallback
- [x] Profile age bucket read; short-form variant for ages 4–5
- [x] Small knowledge-game step every third question
- [x] Mic capture (explicit start/stop, 15 s maximum) with iOS MIME-sensitive upload
- [x] No local permanent chat history and no browser synthesized voice substitute
- [ ] Server-authenticated parent session and revocation
- [ ] Child-safe retrieval-based response service + Arabic/Fiqh specialist evaluation
- [ ] Protected speech-to-text and high-fidelity owner-voice TTS backend
- [ ] Signed/approved answer-id playback
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

This feature branch is the first safe UI slice, **not a claim of a working live voice assistant**.
