/* KIDS_OWNER_ISOLATED_WORKER_V1
 * Entire Kids web app on an independent workers.dev origin, never /test/kids
 * and never production /kids. Mandatory high-entropy secrets, fail closed.
 * Static GET/HEAD only: production account writes and push sends are prohibited.
 */
const OWNER_HOST = "dar-al-tawhid-kids-owner-test.sero91ak.workers.dev";
const TEXT_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Kids-Environment": "owner-test",
  // Never connect a test browser to live Supabase, push or other production APIs.
  "Content-Security-Policy": "connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
};
function respond(message, status, extras = {}) {
  return new Response(message, {status, headers:{...TEXT_HEADERS,...extras}});
}
function gate() {
  return respond("Ersteller-Testzugang: Bitte anmelden.",401,{
    "WWW-Authenticate": 'Basic realm="TAWHID KIDS OWNER TEST", charset="UTF-8"'
  });
}
async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));
}
async function equalSecret(provided,expected) {
  const a=await digest(provided),b=await digest(expected);
  let different=0;
  for(let i=0;i<a.length;i++)different|=a[i]^b[i];
  return different===0;
}
async function authorized(request,env) {
  const user=env.KIDS_OWNER_TEST_USERNAME;
  const pass=env.KIDS_OWNER_TEST_PASSWORD;
  if(typeof user!=="string"||typeof pass!=="string"||!user||pass.length<24)return false;
  const match=(request.headers.get("Authorization")||"").match(/^Basic\s+([a-zA-Z0-9+/=]+)$/);
  if(!match)return false;
  let pair;
  try{pair=atob(match[1]);}catch{return false;}
  const sep=pair.indexOf(":");
  if(sep<1)return false;
  const [okUser,okPass]=await Promise.all([
    equalSecret(pair.slice(0,sep),user),equalSecret(pair.slice(sep+1),pass)
  ]);
  return okUser&&okPass;
}
function allowAsset(path) {
  return path==="/kids"||path.startsWith("/kids/")||
    path.startsWith("/quran-audio/")||
    path.startsWith("/desktop-preview/assets/kids-academy-")||
    path.startsWith("/assets/kids-")||
    path.startsWith("/data/kids-");
}
function assetPath(path) {
  if(path==="/kids"||path==="/kids/"||path==="/kids/start")return "/kids/start.html";
  if(path==="/kids/akademie"||path==="/kids/akademie/")return "/kids/akademie/index.html";
  return path;
}
function htmlWithOwnerTools(html,path){
  // The public shell embeds a production Supabase RPC endpoint. Never expose it
  // as a working endpoint in owner test: a separate test DB is required first.
  html=html.replace(/var API="https:\/\/[^"]+\\.supabase\\.co\/rest\/v1\/rpc\/";/,
                    'var API="/kids/owner-test/blocked-rpc/";');
  html=html.replace(/var APIKEY="sb_publishable_[^"]*";/,'var APIKEY="";');
  // Bootstrap happens before page scripts. Storage is isolated by this origin.
  const boot='<script id="kidsOwnerTestBootstrap">window.__DAR_KIDS_OWNER_TEST__=true;try{if(!localStorage.getItem("kids.owner.test.initialized")){localStorage.setItem("kids.guest.gender.v1","boy");localStorage.setItem("kids.age","4-5");localStorage.setItem("kids.owner.test.initialized","1");}}catch(e){}</script>';
  if(html.includes("</head>"))html=html.replace("</head>",boot+"</head>");
  if(path==="/kids/akademie/index.html"){
    const school=/(<script\s+src="\/kids\/akademie\/school-progress-v11\.js[^"]*"\s*><\/script>)/;
    if(!school.test(html))return null; // never silently bypass a changed layout
    html=html.replace(school,'$1<script src="/kids/owner-test/academy-unlock.js"></script>');
  }
  const panel='<script src="/kids/owner-test/owner-studio.js" defer></script>';
  return html.includes("</body>")?html.replace("</body>",panel+"</body>"):html+panel;
}
export default {
 async fetch(request,env) {
  const u=new URL(request.url);
  if(u.hostname!==OWNER_HOST)return respond("Unknown test host",421);
  if(!env.KIDS_OWNER_TEST_USERNAME||!env.KIDS_OWNER_TEST_PASSWORD||
     String(env.KIDS_OWNER_TEST_PASSWORD).length<24){
    return respond("Ersteller-Test nicht eingerichtet: Zugangsdaten fehlen.",503);
  }
  if(!await authorized(request,env))return gate();
  if(request.method!=="GET"&&request.method!=="HEAD")return respond("Testzugang: schreibende APIs gesperrt.",405,{"Allow":"GET, HEAD"});
  if(u.pathname==="/"||u.pathname==="/test/kids"||u.pathname==="/test/kids/"){
    return Response.redirect("https://"+OWNER_HOST+"/kids/start",302);
  }
  if(!allowAsset(u.pathname))return respond("Nicht Teil der Kinder-Test-App.",404);
  const path=assetPath(u.pathname);
  const dest=new URL(u);
  dest.pathname=path;
  const asset=await env.ASSETS.fetch(new Request(dest,request));
  if(!asset||!asset.ok)return respond("Test-Asset nicht gefunden.",asset?.status===404?404:502);
  const headers=new Headers(asset.headers);
  Object.entries(TEXT_HEADERS).forEach(([key,value])=>headers.set(key,value));
  headers.delete("ETag");
  if(request.method==="HEAD")return new Response(null,{status:200,headers});
  if(path==="/kids/start.html"||path==="/kids/akademie/index.html"||path==="/kids/index.html"||path==="/kids/shell.html"){
    const raw=await asset.text(),withTools=htmlWithOwnerTools(raw,path);
    if(withTools===null)return respond("Testfreigabe blockiert: Akademie-Version nicht kompatibel.",503);
    headers.set("Content-Type","text/html; charset=utf-8");
    headers.delete("Content-Length");
    return new Response(withTools,{status:200,headers});
  }
  return new Response(asset.body,{status:asset.status,headers});
 }
};
