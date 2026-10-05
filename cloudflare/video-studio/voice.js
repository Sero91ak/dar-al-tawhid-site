export function elevenKey(env) {
  let key = String(env.ELEVENLABS_API_KEY || env.ELEVEN_API_KEY || "").trim();
  // Paste-Fehler: Anführungszeichen, Bearer/xi-api-key-Prefix, Whitespace/Zeilenumbrüche
  key = key
    .replace(/^["']+|["']+$/g, "")
    .replace(/^Bearer\s+/i, "")
    .replace(/^xi-api-key\s*[:=]\s*/i, "")
    .replace(/\s+/g, "")
    .trim();
  return key;
}

export function darVoiceId(env) {
  return String(env.ELEVENLABS_VOICE_ID || env.DAR_MALE_VOICE_ID || "DkU7j9uO4ZEtLD2iRZSH")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, "");
}

export function isVoiceConfigured(env) {
  return Boolean(elevenKey(env) && darVoiceId(env));
}

export async function probeElevenAuth(env) {
  const key = elevenKey(env);
  const voiceId = darVoiceId(env);
  const fingerprint = {
    present: Boolean(key),
    voiceIdPresent: Boolean(voiceId),
    length: key ? key.length : 0,
    prefix: key ? key.slice(0, 5) : "",
    voiceIdLength: voiceId ? voiceId.length : 0
  };
  if (!key || !voiceId) {
    return { ok: false, ...fingerprint, reason: "Key oder Voice-ID fehlt" };
  }
  try {
    // Staging-Keys sind oft auf text_to_speech beschränkt (kein user_read/voices_read).
    // Deshalb prüfen wir direkt einen Mini-TTS-Call mit der festen DAR-Voice-ID.
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: "Test.",
        model_id: String(env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"),
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8
        }
      })
    });
    if (res.ok) {
      // Body verwerfen (Probe) – nur Auth/Voice prüfen
      try { await res.arrayBuffer(); } catch {}
      return { ok: true, ...fingerprint, httpStatus: res.status, method: "tts" };
    }
    const text = await res.text().catch(() => "");
    let detail = text.slice(0, 200);
    try {
      const parsed = JSON.parse(text);
      detail = String(parsed?.detail?.message || parsed?.detail || text).slice(0, 200);
    } catch {}
    return {
      ok: false,
      ...fingerprint,
      httpStatus: res.status,
      reason: detail || `HTTP ${res.status}`
    };
  } catch (error) {
    return { ok: false, ...fingerprint, reason: error.message || String(error) };
  }
}

function decodeBase64Bytes(value) {
  const raw = String(value || "").replace(/\s+/g, "");
  if (!raw) return new Uint8Array();
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function synthesizeDarVoice(env, text, options = {}) {
  const key = elevenKey(env);
  const voiceId = darVoiceId(env);
  const profile = String(options?.profile || "").trim().toLowerCase();
  const withTimings = options?.timestamps === true;
  if (!key || !voiceId) {
    return {
      ok: false,
      setupRequired: true,
      reason: "ELEVENLABS_API_KEY und ELEVENLABS_VOICE_ID (feste DAR-Männerstimme) fehlen."
    };
  }
  const script = String(text || "").trim();
  if (!script) return { ok: false, reason: "Kein Sprachtext" };

  const endpoint = withTimings
    ? `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`
    : `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

  // Adam + Idrīs liegen als bestätigte Owner-Referenzen bei ~144–150 WPM.
  // Die Profile orientieren sich daran: Kids ruhig-flüssig, Duʿāʾ sanfter,
  // Quiz etwas direkter, ohne die Stimme hektisch zu machen.
  const voiceSettings = profile === "kids_intro"
    ? {
        stability: 0.50,
        similarity_boost: 0.86,
        style: 0.30,
        speed: 0.94,
        use_speaker_boost: true
      }
    : profile === "kids_alphabet"
      ? {
          stability: 0.78,
          similarity_boost: 0.88,
          style: 0.04,
          speed: 0.88,
          use_speaker_boost: true
        }
      : profile === "kids_story"
        ? {
            stability: 0.62,
            similarity_boost: 0.88,
            style: 0.16,
            speed: 0.91,
            use_speaker_boost: true
          }
        : profile === "kids_lesson"
          ? {
              stability: 0.68,
              similarity_boost: 0.88,
              style: 0.10,
              speed: 0.93,
              use_speaker_boost: true
            }
          : profile === "quiz"
            ? {
                stability: 0.58,
                similarity_boost: 0.88,
                style: 0.18,
                speed: 0.97,
                use_speaker_boost: true
              }
            : profile === "dua"
              ? {
                  stability: 0.80,
                  similarity_boost: 0.89,
                  style: 0.04,
                  speed: 0.86,
                  use_speaker_boost: true
                }
              : profile === "gentle"
                ? {
                    stability: 0.74,
                    similarity_boost: 0.87,
                    style: 0.06,
                    speed: 0.90,
                    use_speaker_boost: true
                  }
                : profile === "teaching"
                  ? {
                      stability: 0.70,
                      similarity_boost: 0.87,
                      style: 0.08,
                      speed: 0.93,
                      use_speaker_boost: true
                    }
                  : profile === "serious"
                    ? {
                        stability: 0.76,
                        similarity_boost: 0.87,
                        style: 0.05,
                        speed: 0.91,
                        use_speaker_boost: true
                      }
                    : {
                        stability: 0.72,
                        similarity_boost: 0.82,
                        style: 0.08,
                        speed: 0.92,
                        use_speaker_boost: true
                      };

  const dictionaryId = String(
    env.ELEVENLABS_PRONUNCIATION_DICTIONARY_ID ||
    env.DAR_VOICE_PRONUNCIATION_DICTIONARY_ID ||
    ""
  ).trim();
  const dictionaryVersionId = String(
    env.ELEVENLABS_PRONUNCIATION_DICTIONARY_VERSION_ID ||
    env.DAR_VOICE_PRONUNCIATION_DICTIONARY_VERSION_ID ||
    ""
  ).trim();
  const body = {
    text: script,
    model_id: String(env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"),
    voice_settings: voiceSettings
  };
  if (dictionaryId && dictionaryVersionId) {
    body.pronunciation_dictionary_locators = [{
      pronunciation_dictionary_id: dictionaryId,
      version_id: dictionaryVersionId
    }];
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: withTimings ? "application/json" : "audio/mpeg"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { ok: false, reason: `ElevenLabs HTTP ${res.status}: ${errText.slice(0, 180)}` };
  }
  if (withTimings) {
    const payload = await res.json().catch(() => null);
    const audioBase64 = String(payload?.audio_base64 || "").trim();
    if (!audioBase64) {
      return { ok: false, reason: "ElevenLabs lieferte keine Audio-Daten für die Timing-Erzeugung." };
    }
    const bytes = decodeBase64Bytes(audioBase64);
    if (!bytes.byteLength) {
      return { ok: false, reason: "ElevenLabs Timing-Audio konnte nicht dekodiert werden." };
    }
    return {
      ok: true,
      bytes,
      audioBase64,
      alignment: payload?.alignment || null,
      normalizedAlignment: payload?.normalized_alignment || null,
      contentType: "audio/mpeg",
      voiceId,
      chars: script.length,
      timestamps: true,
      estimatedCostEur: Number(((script.length / 1000) * 0.18).toFixed(4))
    };
  }

  const bytes = await res.arrayBuffer();
  return {
    ok: true,
    bytes,
    contentType: "audio/mpeg",
    voiceId,
    chars: script.length,
    timestamps: false,
    estimatedCostEur: Number(((script.length / 1000) * 0.18).toFixed(4))
  };
}
