const ILM_ALLOW = [
  "islamweb.net",
  "shamela.ws",
  "dorar.net",
  "al-maktaba.org",
  "ketabonline.com",
  "waqfeya.net",
  "waqfeya.com",
  "archive.org",
  "app.turath.io",
  "turath.io"
];

function hostAllowed(hostname) {
  const h = String(hostname || "").replace(/^www\./, "").toLowerCase();
  return ILM_ALLOW.some((d) => h === d || h.endsWith("." + d));
}

export function publicIlmCors(request) {
  const origin = request.headers.get("Origin") || "";
  let allow = "https://dar-al-tawhid.de";
  try {
    if (origin) {
      const host = new URL(origin).hostname;
      if (
        host === "dar-al-tawhid.de" ||
        host === "www.dar-al-tawhid.de" ||
        host.endsWith(".pages.dev") ||
        host === "localhost" ||
        host === "127.0.0.1"
      ) {
        allow = origin;
      }
    }
  } catch (e) {}
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function tokensOf(query) {
  return String(query || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2)
    .slice(0, 8);
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetAround(plain, query) {
  const text = String(plain || "");
  const lower = text.toLowerCase();
  const tokens = tokensOf(query);
  let idx = -1;
  for (const t of tokens) {
    idx = lower.indexOf(t);
    if (idx >= 0) break;
  }
  if (idx < 0) return "";
  const start = Math.max(0, idx - 90);
  return text.slice(start, start + 240).trim();
}

function textFragmentUrl(url, snippet) {
  const words = String(snippet || "").split(/\s+/).filter(Boolean).slice(0, 7).join(" ");
  if (words.length < 10) return url;
  try {
    const u = new URL(url);
    u.hash = ":~:text=" + encodeURIComponent(words.slice(0, 70));
    return u.toString();
  } catch (e) {
    return url;
  }
}

function extractHrefs(html, base) {
  const out = [];
  const re = /href\s*=\s*["']([^"'#]+)["']/gi;
  let m;
  while ((m = re.exec(html)) && out.length < 12) {
    try {
      const u = new URL(m[1], base);
      if (!/^https?:$/.test(u.protocol)) continue;
      if (!hostAllowed(u.hostname)) continue;
      if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)(\?|$)/i.test(u.pathname)) continue;
      out.push(u.href.split("#")[0]);
    } catch (e) {}
  }
  return [...new Set(out)];
}

async function fetchUrl(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "DAR-AL-TAWHID-IlmResearch/1.0 (compatible; source-check)",
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,de,en;q=0.8"
      }
    });
    const finalUrl = res.url || url;
    const text = await res.text();
    return { ok: res.ok, status: res.status, url: finalUrl, text };
  } catch (e) {
    return { ok: false, status: 0, url, text: "", error: String(e && e.message ? e.message : e) };
  } finally {
    clearTimeout(timer);
  }
}

function searchSeeds(query) {
  const q = encodeURIComponent(query);
  return [
    { label: "Dorar", host: "dorar.net", url: `https://dorar.net/hadith/search?q=${q}` },
    { label: "Dorar Suche", host: "dorar.net", url: `https://www.dorar.net/search?q=${q}` },
    { label: "Shamela", host: "shamela.ws", url: `https://shamela.ws/search?term=${q}` },
    { label: "al-Maktaba", host: "al-maktaba.org", url: `https://al-maktaba.org/search?q=${q}` },
    { label: "Islamweb", host: "islamweb.net", url: `https://www.islamweb.net/ar/library/index.php?page=search&txt=${q}` },
    { label: "Ketab Online", host: "ketabonline.com", url: `https://ketabonline.com/ar/search?q=${q}` },
    { label: "Waqfeya", host: "waqfeya.net", url: `https://waqfeya.net/search.php?search=${q}` },
    { label: "Turāth", host: "turath.io", url: `https://app.turath.io/search?query=${q}` },
    { label: "Archive.org", host: "archive.org", url: `https://archive.org/advancedsearch.php?q=${q}+AND+mediatype:texts&fl[]=identifier,title,description&rows=4&page=1&output=json` }
  ];
}

async function researchArchive(seed, query) {
  const got = await fetchUrl(seed.url, 9000);
  if (!got.ok || !got.text) {
    return [{
      label: seed.label,
      host: seed.host,
      url: seed.url,
      finalUrl: seed.url,
      markedUrl: seed.url,
      snippet: "",
      reachable: false,
      verification_status: "unverified",
      note: "Quelle nicht erreichbar"
    }];
  }
  let docs = [];
  try {
    const data = JSON.parse(got.text);
    docs = (data.response && data.response.docs) || [];
  } catch (e) {
    docs = [];
  }
  const out = [];
  for (const doc of docs.slice(0, 3)) {
    const id = doc.identifier;
    const page = `https://archive.org/details/${encodeURIComponent(id)}`;
    const desc = String(doc.description || doc.title || "");
    const snip = snippetAround(desc, query) || String(doc.title || "").slice(0, 180);
    out.push({
      label: seed.label,
      host: "archive.org",
      url: page,
      finalUrl: page,
      markedUrl: textFragmentUrl(page, snip),
      snippet: snip,
      reachable: true,
      verification_status: snip ? "partially_verified" : "unverified",
      note: snip ? "Archive.org-Treffer, Aussage im Katalogtext" : "Katalogtreffer ohne bestätigten Aussage-Ausschnitt"
    });
  }
  if (!out.length) {
    out.push({
      label: seed.label,
      host: seed.host,
      url: seed.url,
      finalUrl: got.url,
      markedUrl: got.url,
      snippet: "",
      reachable: true,
      verification_status: "unverified",
      note: "Suche erreichbar, keine bestätigte Aussage"
    });
  }
  return out;
}

async function researchHtmlSource(seed, query) {
  const search = await fetchUrl(seed.url, 8000);
  if (!search.ok) {
    return [{
      label: seed.label,
      host: seed.host,
      url: seed.url,
      finalUrl: seed.url,
      markedUrl: seed.url,
      snippet: "",
      reachable: false,
      verification_status: "unverified",
      note: "Suchseite nicht erreichbar"
    }];
  }
  const links = extractHrefs(search.text, search.url || seed.url)
    .filter((href) => href !== seed.url)
    .slice(0, 2);
  const results = [];
  for (const href of links) {
    const page = await fetchUrl(href, 8000);
    if (!page.ok || !hostAllowed(new URL(page.url || href).hostname)) continue;
    const plain = stripHtml(page.text).slice(0, 12000);
    const snip = snippetAround(plain, query);
    if (!snip) continue;
    results.push({
      label: seed.label,
      host: seed.host,
      url: href,
      finalUrl: page.url,
      markedUrl: textFragmentUrl(page.url, snip),
      snippet: snip,
      reachable: true,
      verification_status: "partially_verified",
      note: "Aussage auf erlaubter Quelle gefunden, bibliographische Feindetails prüfen"
    });
  }
  if (!results.length) {
    const searchPlain = stripHtml(search.text).slice(0, 8000);
    const snip = snippetAround(searchPlain, query);
    results.push({
      label: seed.label,
      host: seed.host,
      url: seed.url,
      finalUrl: search.url,
      markedUrl: snip ? textFragmentUrl(search.url, snip) : search.url,
      snippet: snip,
      reachable: true,
      verification_status: snip ? "partially_verified" : "unverified",
      note: snip ? "Treffer auf der Suchseite" : "Suchseite erreichbar, konkrete Aussage nicht bestätigt"
    });
  }
  return results;
}

export async function runIlmResearch(query, limit = 8) {
  const q = String(query || "").trim();
  if (q.length < 3) return { ok: false, error: "query fehlt", results: [] };
  const seeds = searchSeeds(q);
  const packed = await Promise.all(seeds.map((seed) => {
    if (seed.host === "archive.org") return researchArchive(seed, q);
    return researchHtmlSource(seed, q);
  }));
  const flat = packed.flat();
  const withText = flat.filter((r) => r.snippet);
  const rest = flat.filter((r) => !r.snippet);
  const results = withText.concat(rest).slice(0, Math.max(3, Number(limit) || 8));
  return { ok: true, query: q, results, allowlist: ILM_ALLOW };
}

export async function handleIlmResearch(request) {
  const cors = publicIlmCors(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  let query = "";
  let limit = 8;
  if (request.method === "GET") {
    const url = new URL(request.url);
    query = url.searchParams.get("q") || url.searchParams.get("query") || "";
    limit = Number(url.searchParams.get("limit") || 8);
  } else if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    query = body.query || body.q || "";
    limit = Number(body.limit || 8);
  } else {
    return new Response(JSON.stringify({ ok: false, error: "GET oder POST" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
    });
  }
  const data = await runIlmResearch(query, limit);
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
  });
}
