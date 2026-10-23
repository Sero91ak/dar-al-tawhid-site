/* DĀR Admin — optional local encrypted credential vault.
   Only user-entered values are encrypted on the device. Never commits or sends secrets. */
(function () {
  "use strict";
  const STORAGE_KEY = "darAdminEncryptedVaultV1";
  const ITERATIONS = 600000;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const session = { key: null, entries: null, timeout: null };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
  const bytesToBase64 = bytes => {
    let s = "";
    const a = new Uint8Array(bytes);
    for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  };
  const base64ToBytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const available = () => !!(window.isSecureContext && window.crypto && crypto.subtle && crypto.getRandomValues);
  const record = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (_) { return null; }
  };
  const refresh = () => {
    if (typeof window.renderShell === "function" && window.getAdminCurrentTab?.() === "kennwoerter") window.renderShell();
  };
  const clearSensitiveInputs = () => {
    const root = document.getElementById("darSecureVault");
    if (!root) return;
    root.querySelectorAll('input[type="password"],input[data-secret-field]').forEach(el => { el.value = ""; });
  };
  function lock() {
    if (session.timeout) clearTimeout(session.timeout);
    session.timeout = null;
    session.key = null;
    session.entries = null;
    clearSensitiveInputs();
    refresh();
  }
  function touch() {
    if (session.timeout) clearTimeout(session.timeout);
    session.timeout = setTimeout(lock, 5 * 60 * 1000);
  }
  async function derive(passphrase, salt, iterations) {
    const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }
  async function save() {
    if (!session.key || !session.entries) throw new Error("Tresor gesperrt.");
    const prior = record();
    if (!prior || prior.version !== 1) throw new Error("Tresor-Datensatz nicht verfügbar.");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = encoder.encode(JSON.stringify({ version: 1, entries: session.entries }));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, session.key, plain);
    const test = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, session.key, encrypted);
    if (decoder.decode(test) !== decoder.decode(plain)) throw new Error("Verschlüsselungsprüfung fehlgeschlagen.");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, kdf: "PBKDF2-SHA256", iterations: prior.iterations,
      salt: prior.salt, iv: bytesToBase64(iv), encrypted: bytesToBase64(encrypted)
    }));
    touch();
  }
  async function create(passphrase) {
    if (!available()) throw new Error("Dieser Browser unterstützt keinen sicheren Tresor.");
    if (record()) throw new Error("Ein Tresor besteht bereits.");
    if (passphrase.length < 14) throw new Error("Mindestens 14 Zeichen für das Tresor-Passwort.");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await derive(passphrase, salt, ITERATIONS);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv }, key,
      encoder.encode(JSON.stringify({ version: 1, entries: {} }))
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, kdf: "PBKDF2-SHA256", iterations: ITERATIONS,
      salt: bytesToBase64(salt), iv: bytesToBase64(iv), encrypted: bytesToBase64(encrypted)
    }));
    session.key = key;
    session.entries = {};
    touch();
    refresh();
  }
  async function unlock(passphrase) {
    const blob = record();
    if (!available() || !blob || blob.version !== 1 || blob.kdf !== "PBKDF2-SHA256"
       || !Number.isInteger(blob.iterations) || blob.iterations < ITERATIONS
       || blob.iterations > 2000000) throw new Error("Tresorformat oder Browser nicht unterstützt.");
    try {
      const key = await derive(passphrase, base64ToBytes(blob.salt), blob.iterations);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBytes(blob.iv) }, key, base64ToBytes(blob.encrypted)
      );
      const parsed = JSON.parse(decoder.decode(plain));
      if (parsed.version !== 1 || !parsed.entries || Array.isArray(parsed.entries)
          || typeof parsed.entries !== "object") throw new Error("Ungültiger Inhalt");
      session.key = key;
      session.entries = parsed.entries;
      touch();
      refresh();
    } catch (_) { throw new Error("Passwort falsch oder Tresordaten beschädigt."); }
  }
  async function store(id, label, value, overwrite) {
    if (!session.key || !session.entries) throw new Error("Tresor zuerst entsperren.");
    if (!id || !label || !value) throw new Error("Name und Schlüssel fehlen.");
    if (Object.prototype.hasOwnProperty.call(session.entries, id) && !overwrite)
      throw new Error("Eintrag existiert bereits. Zum Ersetzen ausdrücklich bestätigen.");
    const before = session.entries;
    session.entries = { ...session.entries, [id]: { label, value, updated: new Date().toISOString() } };
    try { await save(); } catch (e) { session.entries = before; throw e; }
    refresh();
  }
  async function erase(id) {
    if (!session.entries || !Object.prototype.hasOwnProperty.call(session.entries, id))
      throw new Error("Eintrag fehlt.");
    const before = session.entries;
    const next = { ...session.entries };
    delete next[id];
    session.entries = next;
    try { await save(); } catch (e) { session.entries = before; throw e; }
    refresh();
  }
  function render(catalog) {
    const yes = available();
    const blob = record();
    const unlocked = !!session.key;
    const names = (catalog || []).filter(x => !x.live || x.id === "worker-secret")
      .map(x => ({ id: x.id, label: (x.group || "") + " · " + (x.label || x.id) }));
    const optionTags = names.map(x =>
      '<option value="' + esc(x.id) + '">' + esc(x.label) + '</option>'
    ).join("");
    const list = unlocked ? Object.keys(session.entries).sort().map(id => {
      const e = session.entries[id] || {};
      return '<div class="kennwort-item" style="padding:10px 12px">' +
        '<b>' + esc(e.label || id) + '</b> <small style="color:var(--muted)">verschlüsselt auf diesem Gerät</small>' +
        '<div class="kennwort-tools" style="margin-top:8px">' +
        '<button class="btn" data-vault-copy="' + esc(id) + '" type="button">Kopieren</button>' +
        '<button class="btn" data-vault-remove="' + esc(id) + '" type="button">Löschen</button>' +
        '</div></div>';
    }).join("") : "";
    return '<section id="darSecureVault" class="kennwort-page" style="border:1px solid rgba(239,215,142,.32);padding:14px;border-radius:16px;margin-bottom:14px">' +
      '<div class="section-head"><h3>Verschlüsselter Tresor</h3><span>AES-256-GCM</span></div>' +
      '<p class="kennwort-intro">Eigener lokaler Tresor, geschützt mit einem separaten Passwort. Nur auf diesem Gerät; keine Cloud-Synchronisation. ' +
      'Geheimnisse aus dem Chat erst beim Anbieter erneuern und anschließend hier hinterlegen. ' +
      'Passwort nicht vergessen – ohne dieses ist eine Wiederherstellung nicht möglich.</p>' +
      (!yes ? '<p>Nur in HTTPS mit WebCrypto verfügbar.</p>' :
       !blob ? '<div class="kennwort-body" style="display:grid">' +
        '<input id="vaultCreatePass" class="field" type="password" autocomplete="new-password" placeholder="Neues Tresor-Passwort (min. 14 Zeichen)">' +
        '<input id="vaultCreateRepeat" class="field" type="password" autocomplete="new-password" placeholder="Tresor-Passwort wiederholen">' +
        '<button type="button" class="btn primary" id="vaultCreate">Tresor verschlüsselt anlegen</button></div>' :
       !unlocked ? '<div class="kennwort-body" style="display:grid">' +
        '<input class="field" id="vaultUnlockPass" type="password" autocomplete="off" placeholder="Tresor-Passwort">' +
        '<button type="button" class="btn primary" id="vaultUnlock">Entsperren</button></div>' :
       '<div class="kennwort-body" style="display:grid">' +
        '<p class="kennwort-intro">' + Object.keys(session.entries).length + ' Einträge verschlüsselt gespeichert · automatische Sperre nach 5 Minuten</p>' +
        '<select class="field" id="vaultSelectSlot"><option value="">Dienst auswählen</option>' + optionTags +
          '<option value="custom">Anderen Dienst selbst benennen</option></select>' +
        '<input class="field" id="vaultCustomLabel" placeholder="Optional: eigener eindeutiger Dienstname" autocomplete="off">' +
        '<input class="field" id="vaultNewSecret" type="password" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="Neuer, nicht veröffentlichter Schlüssel">' +
        '<label style="font-size:12px"><input id="vaultOverwrite" type="checkbox"> Bereits gespeicherten Schlüssel bewusst ersetzen</label>' +
        '<button type="button" class="btn primary" id="vaultSave">Schlüssel verschlüsselt speichern</button>' +
        '<button type="button" class="btn" id="vaultLock">Tresor sperren</button>' +
        '<div class="kennwort-list">' + (list || '<p class="kennwort-intro" style="padding:10px">Noch keine Einträge.</p>') + '</div>' +
        '</div>') +
      '<p id="vaultMessage" class="kennwort-intro" role="status" aria-live="polite"></p></section>';
  }
  function bind(catalog) {
    const root = document.getElementById("darSecureVault");
    if (!root) return;
    const byId = id => root.querySelector("#" + id);
    const message = msg => { const e = byId("vaultMessage"); if (e) e.textContent = msg; };
    const act = async task => {
      try { await task(); } catch (e) { message(String(e.message || e)); }
    };
    if (byId("vaultCreate")) byId("vaultCreate").onclick = () => act(async () => {
      const a = byId("vaultCreatePass").value, b = byId("vaultCreateRepeat").value;
      if (a !== b) throw new Error("Die beiden Passwörter stimmen nicht überein.");
      await create(a);
    });
    if (byId("vaultUnlock")) byId("vaultUnlock").onclick = () => act(async () => {
      const pass = byId("vaultUnlockPass").value;
      byId("vaultUnlockPass").value = "";
      await unlock(pass);
    });
    if (byId("vaultLock")) byId("vaultLock").onclick = lock;
    if (byId("vaultSave")) byId("vaultSave").onclick = () => act(async () => {
      const slot = byId("vaultSelectSlot").value;
      const custom = byId("vaultCustomLabel").value.trim();
      const chosen = (catalog || []).find(x => x.id === slot);
      const label = slot === "custom" ? custom : (chosen ? chosen.label : custom);
      const id = slot === "custom" ? "custom:" + custom.toLocaleLowerCase("de") : slot;
      const input = byId("vaultNewSecret");
      const value = input.value.trim();
      if (!slot) throw new Error("Bitte zuerst den Dienst auswählen.");
      if (!label) throw new Error("Bitte den Namen des Dienstes eingeben.");
      await store(id, label, value, byId("vaultOverwrite").checked);
      input.value = "";
    });
    root.querySelectorAll("[data-vault-copy]").forEach(el => el.onclick = () => act(async () => {
      const id = el.getAttribute("data-vault-copy");
      const value = session.entries?.[id]?.value;
      if (!value) throw new Error("Nicht gespeichert.");
      if (!navigator.clipboard?.writeText) throw new Error("Kopieren auf diesem Gerät nicht verfügbar.");
      await navigator.clipboard.writeText(value);
      touch();
      message("In Zwischenablage kopiert. Nach Verwendung Zwischenablage leeren.");
    }));
    root.querySelectorAll("[data-vault-remove]").forEach(el => el.onclick = () => act(async () => {
      const id = el.getAttribute("data-vault-remove");
      if (!confirm("Verschlüsselten Eintrag auf diesem Gerät endgültig entfernen?")) return;
      await erase(id);
    }));
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) lock(); });
  window.addEventListener("pagehide", lock);
  window.DARAdminSecureVault = { render, bind, lock };
})();