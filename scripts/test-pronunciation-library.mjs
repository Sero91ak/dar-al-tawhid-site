import assert from "node:assert/strict";
import { DAR_PRONUNCIATION_RULE_COUNT, applyDarPronunciationAliases, prepareDarSpeech } from "../cloudflare/voice/pronunciation.js";

assert.ok(DAR_PRONUNCIATION_RULE_COUNT >= 3700, "master rules missing");
assert.equal(applyDarPronunciationAliases("DĀR AL TAWḤĪD"), "Daar at-Tauhiid");
assert.equal(applyDarPronunciationAliases("Mūsā"), "Muusaa");
assert.equal(applyDarPronunciationAliases("Tawḥīd"), "Tauhiid");
assert.ok(applyDarPronunciationAliases("Mūsā ʿalayhi s-salām").includes("Muusaa"));
assert.equal(prepareDarSpeech({}, "Mūsā").mode, "local-alias-fallback");
assert.equal(prepareDarSpeech({ ELEVENLABS_PRONUNCIATION_DICTIONARY_ID: "dict", ELEVENLABS_PRONUNCIATION_DICTIONARY_VERSION_ID: "v1" }, "Mūsā").mode, "elevenlabs-dictionary");
console.log("pronunciation library ok", DAR_PRONUNCIATION_RULE_COUNT);
