#!/usr/bin/env node
"use strict";
/* Staging: Client für optionale E-Mail / PIN-Reset mit simuliertem Supabase. */
const assert = require("node:assert/strict");
const nodeCrypto = require("node:crypto");
const fs = require("node:fs");
const M = require("../assets/dar-account-email-v1.js");

const webcrypto = nodeCrypto.webcrypto;
const calls = [];
const res = (status, body) => ({ status, json: async () => body });
const fakeFetch = async (url, init) => {
  const u = new URL(url); const body = JSON.parse(init.body || "{}"); const auth = init.headers.Authorization;
  calls.push({ path: u.pathname, auth, body });
  if (u.pathname === "/auth/v1/otp") return res(200, {});
  if (u.pathname === "/auth/v1/verify") return body.token === "123456" ? res(200, { access_token: "JWT1", refresh_token: "r" }) : res(403, {});
  if (u.pathname === "/rest/v1/rpc/acct_pin_reset_by_email") return auth === "Bearer JWT1" ? res(200, { ok: true }) : res(401, { message: "jwt" });
  if (u.pathname === "/rest/v1/rpc/acct_email_link") return auth === "Bearer JWT1" ? res(200, { ok: true }) : res(401, {});
  if (u.pathname === "/rest/v1/rpc/acct_email_status") return res(200, { ok: true, linked: false });
  return res(404, {});
};
(async () => {
  let t = 1e6;
  const api = M.create({ fetch: fakeFetch, url: "https://x.test", key: "KEY", crypto: webcrypto, now: () => t });
  assert.equal(M.normalizeEmail(" A@B.de "), "a@b.de");
  assert.deepEqual(await api.requestCode("nope"), { ok: false, error: "invalid_email" });
  assert.deepEqual(await api.requestCode("a@b.de"), { ok: true });
  assert.deepEqual(await api.requestCode("a@b.de"), { ok: false, error: "wait" });
  assert.deepEqual(await api.verifyCode("a@b.de", "999999"), { ok: false, error: "invalid_code" });
  const v = await api.verifyCode("a@b.de", "123 456");
  assert.deepEqual(v, { ok: true, jwt: "JWT1" });

  // PIN-Reset: Hash/Salt entsprechen exakt dem Registrierungsverfahren
  const r = await api.resetPin("  Serhat.Test ", "4821", v.jwt);
  assert.deepEqual(r, { ok: true });
  const c = calls[calls.length - 1];
  assert.equal(c.auth, "Bearer JWT1");
  assert.equal(c.body.p_username, "serhat.test");
  assert.match(c.body.p_pin_salt, /^[0-9a-f]{32}$/);
  assert.equal(c.body.p_pin_hash, nodeCrypto.createHash("sha256").update("serhat.test:4821:" + c.body.p_pin_salt + ":dar-al-tawhid-v1").digest("hex"));
  // Zwei Aufrufe -> unterschiedliche Salts
  await api.resetPin("serhat.test", "4821", v.jwt);
  assert.notEqual(calls[calls.length - 1].body.p_pin_salt, c.body.p_pin_salt);
  // Ungültige Eingaben lösen keine Anfrage aus und antworten einheitlich
  const n = calls.length;
  for (const [u, p] of [["a", "1234"], ["ok.user", "12"], ["ok.user", "abcd"], ["bad name", "1234"]]) assert.deepEqual(await api.resetPin(u, p, "JWT1"), { ok: false, error: "failed" });
  assert.equal(calls.length, n);
  // Ohne gültiges JWT: einheitlicher Fehler
  assert.deepEqual(await api.resetPin("ok.user", "1234", "BAD"), { ok: false, error: "failed" });
  assert.deepEqual(await api.linkEmail("a".repeat(64), "BAD"), { ok: false, error: "failed" });
  assert.deepEqual(await api.linkEmail("a".repeat(64), "JWT1"), { ok: true });
  assert.equal((await api.status("a".repeat(64))).linked, false);
  // Kompatibilität mit dem Client in index.html (gleiche Schema-Zeichenkette)
  const idx = fs.readFileSync("index.html", "utf8");
  assert.ok(idx.includes("`${username}:${pin}:${salt}:dar-al-tawhid-v1`"));
  const src = fs.readFileSync("assets/dar-account-email-v1.js", "utf8");
  assert.ok(!/service_role|sb_secret/i.test(src));
  console.log("account email v1: all tests passed");
})().catch(e => { console.error(e); process.exit(1); });
