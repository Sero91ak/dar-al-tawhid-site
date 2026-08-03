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
  return String(env.ELEVENLABS_VOICE_ID || env.DAR_MALE_VOICE_ID || "")
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

export async function synthesizeDarVoice(env, text) {
  const key = elevenKey(env);
  const voiceId = darVoiceId(env);
  if (!key || !voiceId) {
    return {
      ok: false,
      setupRequired: true,
      reason: "ELEVENLABS_API_KEY und ELEVENLABS_VOICE_ID (feste DAR-Männerstimme) fehlen."
    };
  }
  const script = String(text || "").trim();
  if (!script) return { ok: false, reason: "Kein Sprachtext" };

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text: script,
      model_id: String(env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"),
      // Ruhig, würdevoll, nicht hektisch – exakt den vorgegebenen Text lesen
      voice_settings: {
        stability: 0.72,
        similarity_boost: 0.78,
        style: 0.08,
        use_speaker_boost: true
      }
    })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { ok: false, reason: `ElevenLabs HTTP ${res.status}: ${errText.slice(0, 180)}` };
  }
  const bytes = await res.arrayBuffer();
  return {
    ok: true,
    bytes,
    contentType: "audio/mpeg",
    voiceId,
    chars: script.length,
    estimatedCostEur: Number(((script.length / 1000) * 0.18).toFixed(4))
  };
}
