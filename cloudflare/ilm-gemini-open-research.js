/* DĀR AL TAWḤĪD · test-only open-source research v1352.
   Gemini searches; only fetched and text-checked approved primary pages can
   become model evidence. Search snippets, AI citations and redirects alone do
   NOT certify an attribution or a hadith grading. */
import { composeIlmWithGemini } from "./ilm-gemini-bridge.js";
import { composeIlmWithGroqFree } from "./ilm-groq-free-bridge.js";
import { ILM_ALLOWED_SOURCE_DOMAINS } from "./ilm-science-policy.js";

const MODEL = "gemini-2.5-flash-lite"; // Google Search grounding has a limited Free Tier
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
const APPROVED = ILM_ALLOWED_SOURCE_DOMAINS;
const GOOGLE_REDIRECT = "vertexaisearch.cloud.google.com";

export function isApprovedIlmSource(input) {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && !url.username && !url.password &&
      APPROVED.some(domain => host === domain || host.endsWith("." + domain));
  } catch (_) { return false; }
}

function cleanText(input) {
  return String(input || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n,16),0x10ffff)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n),0x10ffff)))
    .replace(/&(?:nbsp|amp|quot|lt|gt|apos);/gi, c => ({ "&nbsp;":" ","&amp;":"&","&quot;":'"',"&lt;":"<","&gt;":">","&apos;":"'" })[c.toLowerCase()] || " ")
    .replace(/\s+/g, " ").trim();
}

async function fetchBounded(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, { redirect:"manual", signal:ctrl.signal, headers:{"Accept":"text/html, text/plain"} });
    if (!response.ok) return {status:response.status, location:response.headers.get("Location"), text:""};
    const mime = String(response.headers.get("Content-Type") || "").toLowerCase();
    if (mime && !/text\/html|text\/plain|application\/xhtml/.test(mime)) return {status:415,text:""};
    const reader = response.body?.getReader();
    if (!reader) return {status:204,text:""};
    const decoder = new TextDecoder();
    let bytes = 0, out = "";
    while (bytes < 135000) {
      const {done,value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      out += decoder.decode(value.slice(0,Math.max(0,135000-(bytes-value.byteLength))),{stream:true});
    }
    await reader.cancel().catch(() => {});
    return {status:response.status,text:out, location:response.headers.get("Location")};
  } catch (_) { return {status:0,text:""}; }
  finally { clearTimeout(timer); }
}

async function directAllowedUrl(groundingUrl) {
  // Do not follow arbitrary redirects to private network addresses.
  // Google grounding metadata often carries a Google-owned redirect link.
  try {
    const u = new URL(groundingUrl);
    if (isApprovedIlmSource(u.href)) return u.href;
    if (u.protocol !== "https:" || u.hostname !== GOOGLE_REDIRECT) return "";
    const response = await fetchBounded(u.href,2600);
    const target = response.location ? new URL(response.location,u.href).href : "";
    return isApprovedIlmSource(target) ? target : "";
  } catch (_) { return ""; }
}

function quoteAroundText(page, question) {
  const text = cleanText(page);
  if (text.length < 250) return "";
  const words = String(question).toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").split(/[^a-z0-9]+/)
    .filter(w => w.length >= 5 && !/^(welche|welcher|warum|wurde|haben|einen|einer|nicht|sollte|kannst|bitte|gesagt)$/.test(w));
  const normalized = text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  let position = -1;
  for(const word of words) {
    const found = normalized.indexOf(word);
    if (found >= 0) { position=found; break; }
  }
  // Arabic-only primary text may lack German lexical overlap. Keep an excerpt
  // for Gemini's cross-language evidence check, but never claim that this alone
  // proves the requested proposition.
  if (position < 0) position=0;
  const offset = Math.max(0,position-400);
  return text.slice(offset,offset+3700);
}

export async function verifiedPage(chunk, question) {
  const url = await directAllowedUrl(chunk?.web?.uri || "");
  if (!url) return null;
  let originalUrl = url, result;
  // Follow only a few redirects BETWEEN approved primary-source hosts.
  // Never allow redirects to arbitrary infrastructure or private networks.
  for (let hop=0; hop<3; hop++) {
    if (!isApprovedIlmSource(originalUrl)) return null;
    result = await fetchBounded(originalUrl,4200);
    if (result.status === 200) break;
    if (![301,302,303,307,308].includes(result.status) || !result.location) return null;
    const next = new URL(result.location,originalUrl).href;
    if (!isApprovedIlmSource(next)) return null;
    originalUrl = next;
  }
  if (result?.status !== 200) return null;
  const excerpt = quoteAroundText(result.text,question);
  if (excerpt.length < 250) return null;
  const titleMatch = String(result.text).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = cleanText(titleMatch?.[1] || chunk?.web?.title || "").slice(0,160);
  return {id:"research-"+originalUrl.slice(0,120),speaker:"",work:title||"Originalquelle",
    reference:originalUrl,statement:excerpt.slice(0,2700),excerpt,source_url:originalUrl,
    verification_status:"verified",authenticity:"nicht unabhängig eingestuft",
    notes:"Webseitenwortlaut abgerufen; Isnāḍ und Zuschreibung nicht automatisch verifiziert"};
}

export async function researchIlmWithGemini(request,env,question,mode) {
  if (!env?.GEMINI_API_KEY) return {ok:false,reason:"gemini_not_configured"};
  if (!env.ILM_GEMINI_GLOBAL_LIMIT || !env.ILM_GEMINI_USER_LIMIT) return {ok:false,reason:"guard_not_configured"};
  try {
    const ip = String(request.headers.get("CF-Connecting-IP") || "unknown").slice(0,70);
    const [global,user] = await Promise.all([
      env.ILM_GEMINI_GLOBAL_LIMIT.limit({key:"ilm-gemini-open-research"}),
      env.ILM_GEMINI_USER_LIMIT.limit({key:"ilm-open:"+ip})
    ]);
    if (!global?.success || !user?.success) return {ok:false,limited:true,reason:"rate_limited"};
  } catch (_) { return {ok:false,reason:"guard_failed"}; }

  // On a provider quota error, use a short shared circuit breaker to avoid
  // flooding Google with requests that cannot succeed. No user data is cached.
  let quotaCache=null, quotaKey=null;
  try {
    if(typeof caches !== "undefined" && caches.default) {
      quotaCache=caches.default;
      quotaKey=new Request(new URL("/__ilm_search_provider_429",request.url).href);
      if(await quotaCache.match(quotaKey)) return {ok:false,limited:true,reason:"gemini_quota_exhausted"};
    }
  } catch(_) { quotaCache=null; quotaKey=null; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(),13000);
  let grounded;
  try {
    const response = await fetch(ENDPOINT,{
      method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json","x-goog-api-key":String(env.GEMINI_API_KEY)},
      body:JSON.stringify({
        tools:[{"google_search":{}}],
        systemInstruction:{parts:[{text:
          "Du suchst Belegstellen für den islamwissenschaftlichen Majlis al-ʿIlm. Führe Google Search durch. "+
          "Bevorzuge ausschließlich islamweb.net, shamela.ws, dorar.net, al-maktaba.org, ketabonline.com, waqfeya.net, archive.org und app.turath.io. "+
          "Suche auch in arabischen Originalbegriffen. Gib keine Fatwa und erfinde keine Bücher, Zitate, Isnād-Urteile oder Einigkeit. "+
          "Wenn du nichts Gesichertes findest, gib dies offen an."
        }]},
        contents:[{role:"user",parts:[{text:"Finde belegbare, direkt aufrufbare Primärquellen zu dieser Frage: "+String(question).slice(0,500)}]}],
        generationConfig:{maxOutputTokens:800,temperature:0.05,topP:0.8}
      })
    });
    if (!response.ok) {
      if(response.status === 429) {
        try {
          if(quotaCache && quotaKey) await quotaCache.put(quotaKey,new Response("quota",{
            headers:{"Cache-Control":"public,max-age=300"}
          }));
        } catch(_) {}
        return {ok:false,limited:true,reason:"gemini_quota_exhausted"};
      }
      const providerError = await response.json().catch(()=>null);
      const providerCode = String(providerError?.error?.status||"").replace(/[^A-Z_]/g,"").slice(0,32);
      return {ok:false,reason:"search_provider_http_"+response.status+(providerCode?"_"+providerCode:"")};
    }
    grounded = await response.json();
  } catch (_) {return {ok:false,reason:"search_provider_unavailable"};}
  finally {clearTimeout(timer);}

  const candidate = grounded?.candidates?.[0];
  const meta = candidate?.groundingMetadata;
  if (!Array.isArray(meta?.webSearchQueries) || !meta.webSearchQueries.length ||
      !Array.isArray(meta?.groundingChunks) || !meta.groundingChunks.length ||
      !Array.isArray(meta?.groundingSupports) || !meta.groundingSupports.length) {
    return {ok:false,reason:"ungrounded_search"};
  }
  const supported = new Set(meta.groundingSupports.flatMap(s => Array.isArray(s.groundingChunkIndices)?s.groundingChunkIndices:[]));
  const chunks = meta.groundingChunks.filter((_,i)=>supported.has(i)).slice(0,8);
  const pages = (await Promise.all(chunks.map(c=>verifiedPage(c,question)))).filter(Boolean);
  const unique = [], seen = new Set();
  for(const page of pages) if(!seen.has(page.reference)) {seen.add(page.reference);unique.push(page);}
  const sources = unique.slice(0,3);
  if (!sources.length) return {ok:false,reason:"no_approved_source_text"};
  const linkedSources = sources.map(s=>({
    id:s.id,work:s.work,reference:s.reference,url:s.reference,
    excerpt:s.statement,verification_status:"verified",authenticity:s.authenticity,
    note:s.notes
  }));
  // For an explicit proof/source request, deliver the original pages directly.
  // Do not spend a second Gemini completion on paraphrasing sources the user asked to inspect.
  if (mode === "sources") return {
    ok:true,answer:"Hier sind abgerufene Originalquellen mit ihrem Fundstellenstatus. Die Echtheit einzelner Überlieferungswege muss gesondert geprüft werden. [1]",
    sources:linkedSources,provider:"gemini",researchMode:"verified_primary_pages",searched:true
  };

  // Second Gemini call is strictly bounded to pages actually read on approved
  // domains. A grounded search summary is NOT used as the final answer.
  const modelSources = sources.map((s,i)=>({
    number:i+1,work:s.work,reference:s.reference,
    verification_status:"verified",authenticity:"not independently graded",
    excerpt:s.excerpt
  }));
  const gemini = await composeIlmWithGemini(request,env,question,modelSources,mode);
  // Discovery must come from Google's grounded search and allowlisted source
  // pages. Groq may ONLY compose from those already-fetched texts, and only
  // if its strictly opt-in Free Plan gate and rate limits are active.
  const composed = gemini.ok ? gemini
    : await composeIlmWithGroqFree(request,env,question,modelSources,mode);
  if (!composed.ok) return {
    ok:false,reason:gemini.reason||composed.reason||"evidence_compose_unavailable",
    limited:!!gemini.limited||!!composed.limited
  };
  if (/kein(?:en)? ausreichenden? (?:beleg|nachweis)|keine ausreichend|nicht belegbar|nicht beantworten/i.test(composed.answer))
    return {ok:false,reason:"insufficient_original_evidence"};
  return {
    ok:true,answer:composed.answer,sources:linkedSources,
    provider:composed.provider,researchMode:"verified_primary_pages",searched:true
  };
}
