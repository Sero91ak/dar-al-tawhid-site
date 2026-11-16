import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const gateSource = await readFile(new URL("../cloudflare/preview-gate.js", import.meta.url), "utf8");
const { gateHiddenSurfaces } = await import(
  "data:text/javascript;base64," + Buffer.from(gateSource).toString("base64")
);

const url = new URL("https://example.test/kids/private-preview");
const request = (authorization = "") => new Request(url, {
  headers: authorization ? { Authorization: authorization } : {}
});
const unauthorized = (req, env) => gateHiddenSurfaces(req, url, env, "live");

assert.equal(unauthorized(request(), {}).status, 401, "missing Secrets must fail closed");
assert.equal(
  unauthorized(request("Basic Og=="), {}).status,
  401,
  "an empty Basic-auth pair must not pass when Secrets are absent"
);
assert.equal(
  unauthorized(request("Basic " + Buffer.from("legacy-user:legacy-pass").toString("base64")), {
    KIDS_GATE_USER: "legacy-user",
    KIDS_GATE_PASS: "legacy-pass"
  }).status,
  401,
  "legacy environment aliases must not bypass the required Secrets"
);

const env = { PREVIEW_GATE_USER: "rotated-user", PREVIEW_GATE_PASS: "rotated-pass" };
const valid = request("Basic " + Buffer.from("rotated-user:rotated-pass").toString("base64"));
assert.equal(unauthorized(valid, env), null, "configured Cloudflare Secrets should authorize valid access");
assert.equal(
  unauthorized(request("Basic " + Buffer.from("wrong:rotated-pass").toString("base64")), env).status,
  401,
  "invalid credentials must remain denied"
);

console.log("Preview gate security tests passed.");
