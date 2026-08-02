export function elevenKey(env) {
  return String(env.ELEVENLABS_API_KEY || env.ELEVEN_API_KEY || "").trim();
}

export function darVoiceId(env) {
  return String(env.ELEVENLABS_VOICE_ID || env.DAR_MALE_VOICE_ID || "").trim();
}

export function isVoiceConfigured(env) {
  return Boolean(elevenKey(env) && darVoiceId(env));
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
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.8,
        style: 0.15,
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
