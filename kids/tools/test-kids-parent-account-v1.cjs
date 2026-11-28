#!/usr/bin/env node
"use strict";
/* Elternkonto V1 (staging): Client-Vertrag mit simuliertem Supabase Auth/PostgREST. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const M = require("../kids-parent-account-v1.js");

function jwt(sub){ return "h."+Buffer.from(JSON.stringify({sub})).toString("base64url")+".s"; }
function mem(){ const m = {}; return { getItem:k=>(k in m?m[k]:null), setItem:(k,v)=>{m[k]=String(v)}, removeItem:k=>{delete m[k]}, _m:m }; }
function server(){
  const st = { calls: [], children: [], codes: {}, uid: "11111111-1111-4111-8111-111111111111", deleted: false };
  const res = (status, body)=>({ status, json: async()=>{ if (body===undefined) throw new Error("no body"); return body; } });
  st.fetch = async (url, init) => {
    const u = new URL(url); const body = init.body ? JSON.parse(init.body) : null;
    const auth = init.headers.Authorization;
    st.calls.push({ method: init.method, path: u.pathname + u.search, auth, body });
    if (u.pathname === "/auth/v1/otp") {
      if (st.rateLimit) return res(429, { msg: "rate" });
      if (st.down) throw new Error("offline");
      st.codes[body.email] = "123456"; // neutral: gleiche Antwort für neue und bekannte Adressen
      return res(200, {});
    }
    if (u.pathname === "/auth/v1/verify") {
      if (body.type === "email" && st.codes[body.email] === body.token)
        return res(200, { access_token: jwt(st.uid), refresh_token: "r1", expires_in: 3600, user: { email: body.email } });
      return res(403, { msg: "invalid" });
    }
    if (u.pathname === "/auth/v1/token") return res(200, { access_token: jwt(st.uid), refresh_token: "r2", expires_in: 3600, user: { email: "x@y.de" } });
    if (u.pathname === "/auth/v1/logout") return res(204);
    if (!auth || auth === "Bearer KEY") return res(401, { message: "JWT" });
    if (u.pathname === "/rest/v1/kids_children") {
      if (init.method === "GET") return res(200, st.children);
      if (init.method === "POST") {
        if (body.parent_id !== st.uid) return res(403, { message: "rls" });
        if (st.children.length >= 8) return res(400, { message: "child_limit" });
        if (st.children.some(c => c.display_name.toLowerCase() === body.display_name.toLowerCase())) return res(409, { message: "duplicate key" });
        const row = Object.assign({ id: "22222222-2222-4222-8222-22222222222"+st.children.length, created_at: "x" }, body);
        st.children.push(row); return res(201, [row]);
      }
      if (init.method === "DELETE") { const id = u.searchParams.get("id").replace("eq.", ""); st.children = st.children.filter(c => c.id !== id); return res(204); }
    }
    if (u.pathname === "/rest/v1/rpc/kids_delete_my_account") { st.deleted = true; st.children = []; return res(200, { ok: true }); }
    return res(404, {});
  };
  return st;
}

(async () => {
  // Host-Schalter: nur Test-Hosts
  assert.equal(M.isEnabledHost("dar-al-tawhid-kids-creator.sero91ak.workers.dev"), true);
  assert.equal(M.isEnabledHost("localhost"), true);
  for (const h of ["dar-al-tawhid.de", "www.dar-al-tawhid.de", "evil.com", "workers.dev.evil.com", ""]) assert.equal(M.isEnabledHost(h), false, h);
  assert.equal(M.normalizeEmail(" Eltern@Example.DE "), "eltern@example.de");
  for (const bad of ["", "a", "a@b", "a b@c.de", "<x>@c.de", "a@@c.de", "a@c"]) assert.equal(M.normalizeEmail(bad), "", bad);

  const st = server(); const storage = mem(); let t = 1e6;
  const api = M.create({ fetch: st.fetch, storage, url: "https://x.test", key: "KEY", now: () => t });
  assert.equal(api.isLoggedIn(), false);
  assert.deepEqual(await api.listChildren(), { ok: false, error: "session" });
  assert.deepEqual(await api.requestCode("kein-email"), { ok: false, error: "invalid_email" });
  assert.equal(st.calls.length, 0, "ungültige Adresse löst keine Anfrage aus");

  // Code anfordern: neutral + Client-Abkühlzeit
  assert.deepEqual(await api.requestCode("Eltern@Example.de"), { ok: true });
  assert.equal(st.calls[0].body.email, "eltern@example.de");
  assert.deepEqual(await api.requestCode("eltern@example.de"), { ok: false, error: "wait" });
  t += 46000;
  st.rateLimit = true; assert.deepEqual(await api.requestCode("eltern@example.de"), { ok: false, error: "rate_limited" }); st.rateLimit = false;
  t += 46000; st.down = true; assert.deepEqual(await api.requestCode("eltern@example.de"), { ok: false, error: "network" }); st.down = false;

  // Falscher/ungültiger Code
  assert.deepEqual(await api.verifyCode("eltern@example.de", "abc"), { ok: false, error: "invalid_code" });
  assert.deepEqual(await api.verifyCode("eltern@example.de", "000000"), { ok: false, error: "invalid_code" });
  assert.equal(api.isLoggedIn(), false);
  assert.deepEqual(await api.verifyCode("eltern@example.de", "123 456"), { ok: true });
  assert.equal(api.isLoggedIn(), true);
  assert.equal(api.email(), "eltern@example.de");
  assert.ok(JSON.parse(storage._m["dar-kids-parent-session-v1"]).access_token);

  // Kinder
  assert.deepEqual(await api.addChild({ display_name: "  Yusuf  ", avatar: "moon", age_band: "7-9" }), { ok: true, child: (await api.listChildren()).children[0] });
  assert.equal(st.children[0].display_name, "Yusuf");
  assert.equal(st.children[0].parent_id, st.uid, "parent_id kommt aus dem Token");
  assert.deepEqual(await api.addChild({ display_name: "yusuf" }), { ok: false, error: "duplicate" });
  assert.deepEqual(await api.addChild({ display_name: "   " }), { ok: false, error: "invalid_name" });
  assert.deepEqual(await api.addChild({ display_name: "x".repeat(25) }), { ok: false, error: "invalid_name" });
  assert.equal((await api.addChild({ display_name: "Z", avatar: "evil", age_band: "99" })).ok, true);
  assert.equal(st.children[1].avatar, "star"); assert.equal(st.children[1].age_band, "7-9");
  for (let i = 0; i < 6; i++) assert.equal((await api.addChild({ display_name: "k" + i })).ok, true);
  assert.deepEqual(await api.addChild({ display_name: "neun" }), { ok: false, error: "limit" });
  assert.deepEqual(await api.deleteChild("../../etc"), { ok: false, error: "invalid" });
  assert.deepEqual(await api.deleteChild(st.children[0].id), { ok: true });
  assert.equal(st.children.length, 7);

  // Token-Erneuerung bei Ablauf
  t += 3600 * 1000 + 1;
  assert.equal((await api.listChildren()).ok, true);
  assert.ok(st.calls.some(c => c.path.startsWith("/auth/v1/token")));

  // Abmelden + Wiederanmelden-Pflicht
  await api.signOut();
  assert.equal(api.isLoggedIn(), false);
  assert.equal(storage.getItem("dar-kids-parent-session-v1"), null);
  assert.deepEqual(await api.listChildren(), { ok: false, error: "session" });

  // Konto löschen
  t += 46000; await api.requestCode("eltern@example.de"); await api.verifyCode("eltern@example.de", "123456");
  assert.deepEqual(await api.deleteAccount(), { ok: true });
  assert.equal(st.deleted, true); assert.equal(api.isLoggedIn(), false);
  assert.equal(storage.getItem("dar-kids-parent-session-v1"), null);

  // Kein Passwort, keine Geheimnisse, kein Service-Role-Schlüssel im Client
  const src = fs.readFileSync(require.resolve("../kids-parent-account-v1.js"), "utf8");
  assert.ok(!/service_role|sb_secret|password/i.test(src));
  const keyPayload = JSON.parse(Buffer.from(src.match(/SUPABASE_KEY = "[^.]+\.([^."]+)\./)[1], "base64url").toString());
  assert.equal(keyPayload.role, "anon");

  // Store-Vertrag: die Kids-Hüllen laden das Modul nicht und enthalten keine Server-Aufrufe
  for (const f of ["kids/start.html", "kids/index.html", "kids/shell.html"]) {
    const html = fs.readFileSync(f, "utf8");
    assert.ok(!html.includes("kids-parent-account") && !html.includes("eltern-konto"), f + " darf das Elternkonto nicht einbinden");
  }
  // Seite: Skripte parsen, Gate vorhanden, kein innerHTML mit Nutzerdaten
  const page = fs.readFileSync("kids/eltern-konto.html", "utf8");
  for (const b of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) if (!/\bsrc=/.test(b[1])) new vm.Script(b[2]);
  assert.match(page, /isEnabledHost\(location\.hostname\)/);
  assert.ok(!/innerHTML/.test(page));
  assert.match(page, /noindex/);
  console.log("kids parent account v1: all tests passed");
})().catch(e => { console.error(e); process.exit(1); });
