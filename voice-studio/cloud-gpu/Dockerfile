# DĀR Voice 2.9.93 – provider-neutral NVIDIA GPU runtime
# Build from repository root:
#   docker build -f voice-studio/cloud-gpu/Dockerfile -t dar-voice-gpu .
FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DAR_VOICE_APP_HOME=/app/runtime \
    DAR_VOICE_NETWORK_MODE=1 \
    DAR_VOICE_DEVICE=cuda \
    DAR_VOICE_PORT=8787 \
    SERHAT_VOICE_REF=/root/SerhatVoice/Serhat_Adobe_MASTER.wav \
    SERHAT_VOICE_REF_AR=/root/SerhatVoice/Serhat_AR_MASTER.wav

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libsndfile1 ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install chatterbox-tts

WORKDIR /app/runtime

COPY voice-studio/local-engine.py ./local-engine.py
COPY voice-studio/speech_flow.py ./speech_flow.py
COPY voice-studio/index.html ./studio.html
COPY voice-studio/mobile.html ./mobile.html
COPY voice-studio/content-studio.js ./content-studio.js
COPY voice-studio/mubashshirun-pack.js ./mubashshirun-pack.js
COPY voice-studio/alphabet-audio-studio.js ./alphabet-audio-studio.js
COPY voice-studio/voice-studio-icon.png ./voice-studio-icon.png

COPY kids/data/alphabet-audio.json ./alphabet-audio.json
COPY kids/data/quiz-kids.json ./quiz-kids.json
COPY kids/data/quiz-audio.json ./quiz-audio.json
COPY kids/data/owner-voice-audio.json ./owner-voice-audio.json
COPY kids/data/dua-kids.json ./dua-kids.json
COPY kids/data/stories-authentic.json ./stories-authentic.json
COPY kids/data/short-stories-voice.json ./short-stories-voice.json
COPY kids/data/verified-content.json ./verified-content.json
COPY kids/data/prophet-stories.json ./prophet-stories.json
COPY kids/data/mubashshirun-stories.json ./mubashshirun-stories.json
COPY content/kids/content-index.json ./kids-content-index.json

COPY data/pronunciation/pronunciation-rules.json ./pronunciation-rules.json
COPY data/pronunciation/story-reference-muhammad-2026-10-04.json ./story-reference-muhammad-2026-10-04.json
COPY data/pronunciation/DAR_AL_TAWHID_ElevenLabs_Aussprache_MAX_MASTER.pls ./DAR_AL_TAWHID_ElevenLabs_Aussprache_MAX_MASTER.pls
COPY data/pronunciation/voice-production-profile.json ./voice-production-profile.json
COPY data/pronunciation/islamic-master-library.json ./islamic-master-library.json
COPY data/pronunciation/voice-regression-fixtures.json ./voice-regression-fixtures.json

COPY voice-studio/cloud-gpu/start.sh /usr/local/bin/dar-voice-start
RUN chmod +x /usr/local/bin/dar-voice-start

VOLUME ["/root/SerhatVoice"]
EXPOSE 8787

HEALTHCHECK --interval=15s --timeout=5s --start-period=180s --retries=4 \
  CMD-SHELL python -c 'import os,urllib.request; p=os.environ.get("DAR_VOICE_PORT") or os.environ.get("PORT") or "8787"; urllib.request.urlopen("http://127.0.0.1:"+str(p)+"/health",timeout=3).read()' || exit 1

ENTRYPOINT ["/usr/local/bin/dar-voice-start"]
