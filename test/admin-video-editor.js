/* DAR Touch-Videoeditor Phase 1 – client */
(function () {
  "use strict";
  const W = 1080;
  const H = 1920;
  const DRAFT_KEY = "darVideoEditorDraftV1";
  const WURL = "darAdminWorkerPublishUrlV1";
  const WSEC = "darAdminWorkerSecretV1";
  const DEFAULT_WORKER = "https://dar-admin-publisher.sero91ak.workers.dev";

  const el = (id) => document.getElementById(id);
  const state = {
    jobId: "",
    project: null,
    selectedId: null,
    playhead: 0,
    playing: false,
    dirty: false,
    history: [],
    historyIndex: -1,
    mode: "schnell",
    showGuides: true,
    showSafe: true,
    autosaveTimer: null,
    raf: 0
  };

  function workerBase() {
    return (localStorage.getItem(WURL) || DEFAULT_WORKER).replace(/\/$/, "");
  }
  function workerSecret() {
    return localStorage.getItem(WSEC) || "";
  }
  function headers() {
    const h = { Accept: "application/json", "Content-Type": "application/json" };
    const s = workerSecret();
    if (s) h["X-Admin-Secret"] = s;
    return h;
  }
  async function api(path, opt = {}) {
    const res = await fetch(workerBase() + "/api/admin/video-studio" + path, {
      cache: "no-store",
      credentials: "omit",
      ...opt,
      headers: { ...headers(), ...(opt.headers || {}) }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.reason || `HTTP ${res.status}`);
    return data;
  }
  function qs(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }
  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 8);
  }

  function pushHistory() {
    if (!state.project) return;
    const snap = JSON.stringify(state.project);
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snap);
    if (state.history.length > 100) state.history.shift();
    state.historyIndex = state.history.length - 1;
    state.dirty = true;
    scheduleAutosave();
  }
  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex -= 1;
    state.project = JSON.parse(state.history[state.historyIndex]);
    state.dirty = true;
    renderAll();
  }
  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex += 1;
    state.project = JSON.parse(state.history[state.historyIndex]);
    state.dirty = true;
    renderAll();
  }
  function scheduleAutosave() {
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = setTimeout(() => saveProject(true), 10000);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ jobId: state.jobId, project: state.project, at: Date.now() }));
    } catch (_) {}
  }

  async function saveProject(silent) {
    if (!state.project || !state.jobId) return;
    try {
      await api("/jobs/" + encodeURIComponent(state.jobId) + "/project", {
        method: "PUT",
        body: JSON.stringify({ project: state.project })
      });
      state.dirty = false;
      if (!silent) setNotice("Gespeichert", "ok");
      else el("saveChip").textContent = "auto";
    } catch (e) {
      if (!silent) setNotice(e.message, "bad");
    }
  }

  function setNotice(msg, kind) {
    const n = el("notice");
    n.className = "notice " + (kind || "");
    n.textContent = msg || "";
  }

  function stageScale() {
    const wrap = el("stageWrap");
    return wrap.clientWidth / W;
  }

  function selected() {
    return (state.project?.elements || []).find((e) => e.id === state.selectedId) || null;
  }

  function renderAll() {
    renderStage();
    renderTimeline();
    renderLayers();
    renderProps();
    el("projName").value = state.project?.name || "";
    el("modeChip").textContent = state.mode === "profi" ? "Profi" : "Schnell";
    el("durChip").textContent = (state.project?.duration || 15) + "s";
  }

  function renderStage() {
    const stage = el("stage");
    const bg = el("stageBg");
    const dim = el("stageDim");
    const p = state.project;
    if (!p) return;
    bg.style.backgroundImage = p.background?.assetUrl ? `url("${p.background.assetUrl}")` : "";
    const dimOn = state.playhead >= (p.background?.dimFrom ?? p.duration - 2.5);
    dim.style.opacity = dimOn ? String(p.background?.dimOpacity ?? 0.34) : "0";
    el("guides").classList.toggle("on", state.showGuides);
    el("safe").classList.toggle("on", state.showSafe);

    stage.querySelectorAll(".el").forEach((n) => n.remove());
    (p.elements || []).forEach((item) => {
      if (!item.visible) return;
      if (state.playhead < item.timing.start - 0.01 || state.playhead > item.timing.end + 0.01) return;
      const node = document.createElement("div");
      node.className = "el " + item.role + (item.id === state.selectedId ? " selected" : "");
      node.dataset.id = item.id;
      const s = stageScale();
      node.style.left = item.transform.x * s + "px";
      node.style.top = item.transform.y * s + "px";
      node.style.width = item.transform.width * s + "px";
      node.style.opacity = String(item.opacity ?? 1);
      node.style.transform = `rotate(${item.transform.rotation || 0}deg)`;

      if (item.role === "watermark") {
        const img = document.createElement("img");
        img.src = "/watermark-my-logo-full.png";
        img.alt = "DAR Logo";
        img.draggable = false;
        node.appendChild(img);
      } else {
        const box = document.createElement("div");
        box.className = "box";
        const st = item.style || {};
        box.style.fontFamily = `'${st.fontFamily || "Cormorant Garamond"}', Georgia, serif`;
        box.style.fontSize = ((st.fontSize || 42) * s) + "px";
        box.style.fontWeight = st.fontWeight || 600;
        box.style.fontStyle = st.fontStyle || "normal";
        box.style.color = st.color || "#fff8e8";
        box.style.textAlign = st.alignment || "center";
        box.style.lineHeight = String(st.lineHeight || 1.42);
        if (st.background?.mode === "none") {
          box.style.background = "transparent";
          box.style.border = "0";
        } else if (st.background?.color) {
          box.style.background = st.background.color;
        }
        if (item.role === "social" && item.social) {
          box.innerHTML = `<div>${esc(item.social.followLine || "")}</div>
            <div style="margin-top:8px;font-size:.72em;font-family:system-ui,sans-serif">✈ ${esc(item.social.telegram || "")}<br>🌐 ${esc(item.social.website || "")}<br>◎ ${esc(item.social.instagram || "")}</div>
            <div style="margin-top:8px;color:var(--gold);font-size:.7em">${esc(item.social.credit || "")}</div>`;
        } else {
          box.textContent = item.content || "";
        }
        node.appendChild(box);
      }
      const handle = document.createElement("div");
      handle.className = "handle";
      node.appendChild(handle);
      bindElementTouch(node, item, handle);
      stage.appendChild(node);
    });
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function bindElementTouch(node, item, handle) {
    let mode = null;
    let startX = 0, startY = 0, origX = 0, origY = 0, origW = 0, pinch0 = 0, size0 = 0;

    function clientDist(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    }

    node.addEventListener("pointerdown", (e) => {
      if (item.locked) return;
      if (e.target === handle) mode = "scale";
      else mode = "move";
      state.selectedId = item.id;
      startX = e.clientX;
      startY = e.clientY;
      origX = item.transform.x;
      origY = item.transform.y;
      origW = item.transform.width;
      node.setPointerCapture(e.pointerId);
      renderProps();
      renderLayers();
      e.preventDefault();
    });

    node.addEventListener("pointermove", (e) => {
      if (!mode || item.locked) return;
      const s = stageScale();
      const dx = (e.clientX - startX) / s;
      const dy = (e.clientY - startY) / s;
      if (mode === "move") {
        item.transform.x = Math.round(origX + dx);
        item.transform.y = Math.round(origY + dy);
        if (state.showGuides) {
          const cx = item.transform.x + item.transform.width / 2;
          if (Math.abs(cx - W / 2) < 12) item.transform.x = Math.round(W / 2 - item.transform.width / 2);
          if (Math.abs(item.transform.y + 40 - H / 2) < 12) item.transform.y = Math.round(H / 2 - 40);
        }
      } else if (mode === "scale") {
        item.transform.width = Math.max(200, Math.round(origW + dx));
        if (item.style) {
          const base = Number(item.style.fontSize || 42);
          item.style.fontSize = Math.max(18, Math.round(base * (item.transform.width / Math.max(1, origW))));
        }
      }
      state.dirty = true;
      renderStage();
      renderProps();
    });

    node.addEventListener("pointerup", () => {
      if (mode) {
        pushHistory();
        mode = null;
        renderTimeline();
      }
    });

    node.addEventListener("dblclick", () => openSheet("text"));
    let pressTimer = null;
    node.addEventListener("pointerdown", () => {
      pressTimer = setTimeout(() => openContext(item), 520);
    });
    node.addEventListener("pointerup", () => clearTimeout(pressTimer));
    node.addEventListener("pointermove", () => clearTimeout(pressTimer));

    node.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2 && item.style) {
        pinch0 = clientDist(e.touches[0], e.touches[1]);
        size0 = Number(item.style.fontSize || 42);
      }
    }, { passive: true });
    node.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && item.style && pinch0) {
        const d = clientDist(e.touches[0], e.touches[1]);
        item.style.fontSize = Math.max(16, Math.min(96, Math.round(size0 * (d / pinch0))));
        state.dirty = true;
        renderStage();
        renderProps();
        e.preventDefault();
      }
    }, { passive: false });
    node.addEventListener("touchend", () => {
      if (pinch0) {
        pinch0 = 0;
        pushHistory();
      }
    });
  }

  function renderTimeline() {
    const track = el("tlTrack");
    const p = state.project;
    if (!p) return;
    const pxPerSec = Math.max(28, Math.min(64, track.parentElement.clientWidth / Math.max(8, p.duration)));
    track.style.width = Math.max(track.parentElement.clientWidth - 8, p.duration * pxPerSec) + "px";
    track.innerHTML = "";
    const head = document.createElement("div");
    head.className = "tl-playhead";
    head.style.left = state.playhead * pxPerSec + "px";
    track.appendChild(head);
    (p.elements || []).forEach((item) => {
      const b = document.createElement("div");
      b.className = "tl-block" + (item.id === state.selectedId ? " active" : "");
      b.style.left = item.timing.start * pxPerSec + "px";
      b.style.width = Math.max(18, (item.timing.end - item.timing.start) * pxPerSec) + "px";
      b.textContent = (item.role || "").slice(0, 10);
      b.title = item.role + " " + item.timing.start.toFixed(1) + "–" + item.timing.end.toFixed(1);
      bindTimelineBlock(b, item, pxPerSec);
      track.appendChild(b);
    });
    el("tlTime").textContent = state.playhead.toFixed(1) + " / " + p.duration.toFixed(1) + "s";
  }

  function bindTimelineBlock(node, item, pxPerSec) {
    let mode = null, startX = 0, oStart = 0, oEnd = 0;
    node.addEventListener("pointerdown", (e) => {
      const rect = node.getBoundingClientRect();
      const edge = 14;
      mode = e.clientX > rect.right - edge ? "end" : e.clientX < rect.left + edge ? "start" : "move";
      startX = e.clientX;
      oStart = item.timing.start;
      oEnd = item.timing.end;
      state.selectedId = item.id;
      node.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });
    node.addEventListener("pointermove", (e) => {
      if (!mode) return;
      const dx = (e.clientX - startX) / pxPerSec;
      if (mode === "move") {
        const dur = oEnd - oStart;
        item.timing.start = Math.max(0, Number((oStart + dx).toFixed(2)));
        item.timing.end = Number((item.timing.start + dur).toFixed(2));
      } else if (mode === "start") {
        item.timing.start = Math.min(oEnd - 0.4, Math.max(0, Number((oStart + dx).toFixed(2))));
      } else {
        item.timing.end = Math.max(oStart + 0.4, Number((oEnd + dx).toFixed(2)));
      }
      item.timing.duration = item.timing.end - item.timing.start;
      state.dirty = true;
      renderTimeline();
      renderProps();
    });
    node.addEventListener("pointerup", () => {
      if (mode) {
        pushHistory();
        mode = null;
        renderStage();
      }
    });
  }

  function renderLayers() {
    const host = el("layers");
    if (!host || !state.project) return;
    host.innerHTML = "<h3 style='margin:4px 0 8px;color:var(--gold);font-family:var(--serif)'>Ebenen</h3>";
    [...state.project.elements].slice().reverse().forEach((item) => {
      const row = document.createElement("div");
      row.className = "layer-line" + (item.id === state.selectedId ? " active" : "");
      row.innerHTML = `<button type="button" data-vis="${item.id}">${item.visible ? "👁" : "–"}</button>
        <span style="flex:1">${esc(item.role)}</span>
        <button type="button" data-lock="${item.id}">${item.locked ? "🔒" : "🔓"}</button>`;
      row.addEventListener("click", (e) => {
        if (e.target.dataset.vis) {
          item.visible = !item.visible;
          pushHistory();
          renderAll();
          return;
        }
        if (e.target.dataset.lock) {
          item.locked = !item.locked;
          pushHistory();
          renderAll();
          return;
        }
        state.selectedId = item.id;
        renderAll();
      });
      host.appendChild(row);
    });
  }

  function renderProps() {
    const host = el("props");
    const item = selected();
    const html = propsHtml(item);
    if (host) host.innerHTML = html;
    el("sheetBody").innerHTML = html;
    bindPropControls(host);
    bindPropControls(el("sheetBody"));
  }

  function propsHtml(item) {
    if (!item) return "<p class='notice'>Element antippen.</p>";
    return `
      <h3>${esc(item.role)}</h3>
      <label>Text</label><textarea id="pText" rows="4">${esc(item.content || "")}</textarea>
      <div class="honor" id="honorRow"></div>
      <label>Schriftgröße (${item.style?.fontSize || 42}px)</label>
      <input type="range" id="pSize" min="16" max="96" value="${item.style?.fontSize || 42}">
      <label>Farbe</label>
      <select id="pColor">
        ${[["#fff8e8","Creme"],["#ffffff","Weiß"],["#efd78e","Gold"],["#0b1a33","Dunkelblau"],["#5a1d2a","Bordeaux"],["#111111","Schwarz"]].map(([v,l])=>`<option value="${v}" ${item.style?.color===v?"selected":""}>${l}</option>`).join("")}
      </select>
      <label>Schrift</label>
      <select id="pFont">
        ${["Cormorant Garamond","Playfair Display","EB Garamond","Great Vibes","Amiri","Noto Naskh Arabic"].map(f=>`<option ${item.style?.fontFamily===f?"selected":""}>${f}</option>`).join("")}
      </select>
      <label>Start (s)</label><input type="number" id="pStart" step="0.1" value="${item.timing.start}">
      <label>Ende (s)</label><input type="number" id="pEnd" step="0.1" value="${item.timing.end}">
      <label>Deckkraft</label><input type="range" id="pOp" min="0.05" max="1" step="0.01" value="${item.opacity ?? 1}">
      <label>X / Y / Breite</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        <input type="number" id="pX" value="${item.transform.x}">
        <input type="number" id="pY" value="${item.transform.y}">
        <input type="number" id="pW" value="${item.transform.width}">
      </div>
      ${item.role === "watermark" ? `<label>Logo-Skalierung</label><input type="range" id="pScale" min="0.2" max="0.7" step="0.01" value="${item.scale || 0.44}">` : ""}
    `;
  }

  function bindPropControls(root) {
    if (!root) return;
    const item = selected();
    if (!item) return;
    const honor = root.querySelector("#honorRow");
    if (honor && !honor.dataset.ready) {
      honor.dataset.ready = "1";
      ["ﷺ","رضي الله عنه","رضي الله عنها","رحمه الله","عليه السلام"].forEach((h) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = h;
        b.addEventListener("click", () => {
          item.content = (item.content || "") + " " + h;
          pushHistory();
          renderAll();
        });
        honor.appendChild(b);
      });
    }
    const map = [
      ["pText", (v) => { item.content = v; }],
      ["pSize", (v) => { item.style = item.style || {}; item.style.fontSize = Number(v); }],
      ["pColor", (v) => { item.style = item.style || {}; item.style.color = v; }],
      ["pFont", (v) => { item.style = item.style || {}; item.style.fontFamily = v; }],
      ["pStart", (v) => { item.timing.start = Number(v); item.timing.duration = item.timing.end - item.timing.start; }],
      ["pEnd", (v) => { item.timing.end = Number(v); item.timing.duration = item.timing.end - item.timing.start; }],
      ["pOp", (v) => { item.opacity = Number(v); }],
      ["pX", (v) => { item.transform.x = Number(v); }],
      ["pY", (v) => { item.transform.y = Number(v); }],
      ["pW", (v) => { item.transform.width = Number(v); }],
      ["pScale", (v) => { item.scale = Number(v); }]
    ];
    map.forEach(([id, fn]) => {
      const n = root.querySelector("#" + id);
      if (!n || n.dataset.bound) return;
      n.dataset.bound = "1";
      n.addEventListener("input", () => {
        fn(n.value);
        state.dirty = true;
        renderStage();
        renderTimeline();
      });
      n.addEventListener("change", () => pushHistory());
    });
  }

  function openSheet(kind) {
    el("backdrop").classList.add("open");
    el("sheet").classList.add("open");
    el("sheetTitle").textContent = kind === "text" ? "Text" : kind === "time" ? "Zeit & Dauer" : kind === "check" ? "Prüfen" : "Bearbeiten";
    if (kind === "time") {
      el("sheetBody").innerHTML = `
        <label>Gesamtdauer (Sekunden)</label>
        <input type="number" id="pDur" step="0.5" min="5" max="60" value="${state.project.duration}">
        <label><input type="checkbox" id="pProp" checked> Abschnitte proportional anpassen</label>
        <button type="button" class="primary" id="applyDur" style="width:100%;margin-top:10px">Dauer anwenden</button>`;
      el("applyDur").onclick = () => {
        const next = Number(el("pDur").value);
        const proportional = el("pProp").checked;
        const ratio = next / Math.max(0.1, state.project.duration);
        state.project.duration = next;
        state.project.elements.forEach((e) => {
          if (proportional) {
            e.timing.start = Number((e.timing.start * ratio).toFixed(2));
            e.timing.end = Number((e.timing.end * ratio).toFixed(2));
          } else {
            e.timing.end = Math.min(e.timing.end, next);
            e.timing.start = Math.min(e.timing.start, next);
          }
          e.timing.duration = e.timing.end - e.timing.start;
        });
        state.project.background.dimFrom = Math.max(0, next - 2.5);
        pushHistory();
        closeSheet();
        renderAll();
      };
      return;
    }
    if (kind === "check") {
      runCheck();
      return;
    }
    renderProps();
  }
  function closeSheet() {
    el("backdrop").classList.remove("open");
    el("sheet").classList.remove("open");
  }

  function openContext(item) {
    state.selectedId = item.id;
    openSheet("text");
  }

  async function runCheck() {
    try {
      const data = await api("/jobs/" + encodeURIComponent(state.jobId) + "/editor-export", {
        method: "POST",
        body: JSON.stringify({ project: state.project, previewOnly: true })
      });
      const v = data.validation || {};
      const entries = Object.entries(v.checks || {});
      const bad = entries.filter(([, ok]) => !ok);
      el("sheetBody").innerHTML = `<p class="notice ${bad.length ? "warn" : "ok"}">${entries.length - bad.length} Prüfungen bestanden · ${bad.length} Probleme</p>
        <ul style="padding-left:18px;font-size:12px;line-height:1.5">${(v.errors || bad.map(([k]) => k)).map((e) => `<li>${esc(e)}</li>`).join("") || "<li>Alles in Ordnung</li>"}</ul>`;
      el("backdrop").classList.add("open");
      el("sheet").classList.add("open");
      el("sheetTitle").textContent = "Video prüfen";
    } catch (e) {
      setNotice(e.message, "bad");
    }
  }

  async function exportProject() {
    if (!confirm("Export starten? (Production bevorzugt, ohne Fremdwasserzeichen)")) return;
    setNotice("Export läuft…", "warn");
    try {
      const data = await api("/jobs/" + encodeURIComponent(state.jobId) + "/editor-export", {
        method: "POST",
        body: JSON.stringify({ project: state.project })
      });
      setNotice(data.job?.message || "Export gestartet – zurück zum Studio für Vorschau", "ok");
      setTimeout(() => {
        location.href = "/admin/video-studio.html?job=" + encodeURIComponent(state.jobId);
      }, 900);
    } catch (e) {
      setNotice(e.message, "bad");
      if (e.message && /blockiert|Validierung/i.test(e.message)) runCheck();
    }
  }

  function tick() {
    if (!state.playing || !state.project) return;
    state.playhead = Math.min(state.project.duration, state.playhead + 1 / 30);
    if (state.playhead >= state.project.duration) {
      state.playing = false;
      el("btnPlay").textContent = "▶";
    }
    renderStage();
    renderTimeline();
    state.raf = requestAnimationFrame(tick);
  }

  async function boot() {
    state.jobId = qs("job");
    if (!workerSecret()) {
      setNotice("Worker-Secret in Video-Studio speichern, dann Editor öffnen.", "bad");
      return;
    }
    if (!state.jobId) {
      setNotice("Kein Auftrag – bitte aus dem Video-Studio öffnen.", "bad");
      return;
    }
    try {
      const data = await api("/jobs/" + encodeURIComponent(state.jobId) + "/project");
      state.project = data.project;
      state.mode = state.project.mode || "schnell";
      state.history = [JSON.stringify(state.project)];
      state.historyIndex = 0;
      renderAll();
      setNotice("Touch-Editor bereit · Automatisch erzeugtes Projekt geladen", "ok");
    } catch (e) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const d = JSON.parse(draft);
          if (d.jobId === state.jobId && d.project) {
            state.project = d.project;
            renderAll();
            setNotice("Lokaler Entwurf geladen (Server: " + e.message + ")", "warn");
            return;
          }
        } catch (_) {}
      }
      setNotice(e.message, "bad");
    }
  }

  // Wire UI
  el("btnBack").onclick = () => {
    if (state.dirty && !confirm("Ungespeicherte Änderungen – trotzdem zurück?")) return;
    location.href = "/admin/video-studio.html?job=" + encodeURIComponent(state.jobId);
  };
  el("projName").addEventListener("change", () => {
    if (!state.project) return;
    state.project.name = el("projName").value;
    pushHistory();
  });
  el("btnUndo").onclick = undo;
  el("btnRedo").onclick = redo;
  el("btnSave").onclick = () => saveProject(false);
  el("btnPreview").onclick = () => {
    state.playing = !state.playing;
    el("btnPlay").textContent = state.playing ? "⏸" : "▶";
    if (state.playing) tick();
  };
  el("btnPlay").onclick = el("btnPreview").onclick;
  el("btnCheck").onclick = () => openSheet("check");
  el("btnExport").onclick = exportProject;
  el("btnGuides").onclick = () => { state.showGuides = !state.showGuides; renderStage(); };
  el("btnSafe").onclick = () => { state.showSafe = !state.showSafe; renderStage(); };
  el("btnMode").onclick = () => {
    state.mode = state.mode === "schnell" ? "profi" : "schnell";
    if (state.project) state.project.mode = state.mode;
    renderAll();
  };
  el("btnTime").onclick = () => openSheet("time");
  el("btnText").onclick = () => openSheet("text");
  el("btnStyle").onclick = () => openSheet("text");
  el("sheetClose").onclick = closeSheet;
  el("backdrop").onclick = closeSheet;
  el("tlTrack").addEventListener("pointerdown", (e) => {
    if (!state.project) return;
    const rect = el("tlTrack").getBoundingClientRect();
    const pxPerSec = el("tlTrack").clientWidth / state.project.duration;
    state.playhead = Math.max(0, Math.min(state.project.duration, (e.clientX - rect.left) / pxPerSec));
    renderStage();
    renderTimeline();
  });
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveProject(false);
    }
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      el("btnPlay").click();
    }
  });
  window.addEventListener("resize", () => renderStage());

  boot();
})();
