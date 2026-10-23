/* DĀR AL TAWḤĪD · owner-only standalone Social Redaktion.
 * No browser PIN, public fallback, or authentication via client-side JS.
 * Reuses the already established private Academy owner credentials when available.
 * Optional overrides: EDITORIAL_OWNER_PASSWORD and EDITORIAL_OWNER_SESSION_SECRET.
 * Missing credentials still fail closed: never leak private editorial assets.
 */
const ROOT="/redaktion", COOKIE="dar_editorial_owner_v1", TTL=6*60*60;
function route(path){
  return path===ROOT||path.startsWith(ROOT+"/");
}
function hdr(extra={}){
  return {"Cache-Control":"private, no-store, max-age=0","CDN-Cache-Control":"no-store",
    "Cloudflare-CDN-Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow, noarchive",
    "X-Frame-Options":"DENY","X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer",...extra};
}
function html(s,status=200){return new Response(s,{status,headers:hdr({"Content-Type":"text/html; charset=utf-8",
"Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"})});}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function loginPage(error="",status=200){
  return html(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>Private Redaktion · DĀR AL TAWḤĪD</title><style>
:root{color-scheme:dark}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:calc(28px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% -25%,#315242 0,transparent 61%),radial-gradient(circle at bottom right,#193126 0,transparent 49%),#08120f;color:#eee8da;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{width:min(100%,450px);padding:clamp(24px,6vw,41px);border:1px solid rgba(223,196,137,.48);border-radius:26px;background:linear-gradient(150deg,#1b352a,#0e201a 79%);box-shadow:0 28px 85px #0009,inset 0 1px #e8d6a222}
small{display:block;color:#e1cc9a;font-size:11px;font-weight:750;letter-spacing:.18em}
h1{margin:14px 0 10px;font:normal clamp(30px,6.5vw,39px)/1.18 Georgia,serif;letter-spacing:-.025em;color:#efd7a0}
p{font-size:14px;color:#c4d2c5;margin:9px 0 0}
label{display:block;color:#efdfb9;font-size:13px;font-weight:750;margin:25px 0 8px}
input{width:100%;min-height:54px;padding:12px 15px;border:1px solid #8b926e;border-radius:13px;background:#091a14;color:white;font:16px/1.5 system-ui,sans-serif}
input:focus-visible,button:focus-visible{outline:3px solid #ecd398;outline-offset:3px}
button{width:100%;min-height:54px;margin-top:14px;background:#e3c88c;color:#14261b;font:800 16px/1.2 system-ui,sans-serif;border:0;border-radius:13px;cursor:pointer}
button:active{transform:scale(.99)}
strong{color:#ffe1a9}
.line{width:80px;height:1px;margin:23px 0 5px;background:linear-gradient(90deg,transparent,#ddbf79,transparent)}
.note{margin-top:22px;padding-top:13px;border-top:1px solid #d8bd7e44;text-align:center;font-size:11px;color:#aebfae}
@media(max-width:550px){body{align-items:center}main{border-radius:22px;padding:27px 23px}}
</style></head><body><main><small>DĀR AL TAWḤĪD · NUR EIGENTÜMER</small><h1>Redaktionsatelier</h1><div class="line"></div><p>Neun Sprachen, Social-Media-Beiträge und Originalnachweise. Einmal anmelden. Danach ist dein privater Redaktionsbereich sechs Stunden lang ohne weitere Passworteingabe geöffnet.</p>${error?'<p role="alert"><strong>'+escape(error)+'</strong></p>':''}<form method="post" action="/redaktion/login"><label for="password">Privates Redaktionspasswort</label><input id="password" name="password" type="password" maxlength="256" autocomplete="current-password" required autofocus><button type="submit">Redaktion öffnen →</button></form><div class="note">DĀR AL TAWḤĪD · Privater Zugang · 6 Stunden</div></main></body></html>`,status);
}
function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
async function mac(secret,payload){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return b64(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload))));
}
async function equal(a,b){
 const [x,y]=await Promise.all([a,b].map(s=>crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(s)))));
 const aa=new Uint8Array(x),bb=new Uint8Array(y);let diff=0;
 for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;
}
async function session(request,secret){
 const raw=String(request.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
 if(!raw)return false;
 const v=raw.slice(COOKIE.length+1),parts=v.split(".");
 if(parts.length!==3||parts[0]!=="v1"||! /^\d{10,12}$/.test(parts[1]))return false;
 const expiry=Number(parts[1]),now=Math.floor(Date.now()/1000);
 if(expiry<=now||expiry>now+TTL||!Number.isSafeInteger(expiry))return false;
 return equal(parts[2],await mac(secret,"editorial-owner-v1|"+parts[1]));
}
function redirect(cookie){
 const headers=hdr({"Location":ROOT+"/"});
 if(cookie)headers["Set-Cookie"]=cookie;
 return new Response(null,{status:303,headers});
}
export async function editorialOwnerAccess(request,url,env){
 if(!route(url.pathname))return null;
 // Reuse the pre-existing server-side Academy owner credentials when available.
 // Editorial sessions remain separate and expire after six hours.
 const password=String(env&&(env.EDITORIAL_OWNER_PASSWORD||env.ACADEMY_OWNER_PASSWORD)||"");
 const signing=String(env&&(env.EDITORIAL_OWNER_SESSION_SECRET||env.ACADEMY_OWNER_SESSION_SECRET)||"");
 if(!password||!signing||signing.length<32)return loginPage("Privater Serverzugang ist noch nicht eingerichtet.",503);
 const p=url.pathname;
 if(p===ROOT+"/login"&&request.method==="POST"){
   if(request.headers.get("Origin")!==url.origin)return loginPage("Anmeldung nicht angenommen.",403);
   if(Number(request.headers.get("Content-Length")||0)>2048)return loginPage("Ungültige Anfrage.",413);
   const form=await request.formData().catch(()=>null);
   const supplied=String(form?.get("password")||"");
   if(supplied.length>256||!(await equal(supplied,password)))return loginPage("Passwort nicht erkannt.",401);
   const exp=Math.floor(Date.now()/1000)+TTL;
   const sig=await mac(signing,"editorial-owner-v1|"+exp);
   return redirect(COOKIE+"=v1."+exp+"."+sig+"; HttpOnly; Secure; SameSite=Strict; Path="+ROOT+"; Max-Age="+TTL);
 }
 if(p===ROOT+"/logout"&&request.method==="POST"){
   if(request.headers.get("Origin")!==url.origin)return loginPage("Abmeldung nicht angenommen.",403);
   return redirect(COOKIE+"=; HttpOnly; Secure; SameSite=Strict; Path="+ROOT+"; Max-Age=0");
 }
 if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Method Not Allowed",{status:405,headers:hdr({"Allow":"GET, HEAD"})});
 if(!(await session(request,signing)))return loginPage();
 if(p===ROOT+"/login"||p===ROOT+"/logout")return redirect();
 const allowed=new Set([ROOT,ROOT+"/",ROOT+"/index.html",ROOT+"/editor.js",ROOT+"/style.css"]);
 if(!allowed.has(p))return new Response("Not Found",{status:404,headers:hdr()});
 const target=new URL(url.toString());target.pathname=(p===ROOT||p===ROOT+"/index.html")?ROOT+"/":p;
 const asset=await env.ASSETS.fetch(new Request(target.toString(),{method:"GET"}));
 if(!asset.ok||asset.status>=300)return new Response("Redaktionsseite nicht verfügbar",{status:503,headers:hdr()});
 const headers=new Headers(asset.headers);
 for(const [k,v]of Object.entries(hdr()))headers.set(k,v);
 if(p===ROOT||p===ROOT+"/"||p===ROOT+"/index.html")headers.set("Content-Type","text/html; charset=utf-8");
 headers.set("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
 headers.delete("ETag");headers.delete("Content-Length");
 return new Response(request.method==="HEAD"?null:asset.body,{status:200,headers});
}