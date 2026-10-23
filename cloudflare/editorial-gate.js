/* DĀR AL TAWḤĪD · owner-only standalone Social Redaktion.
 * No browser PIN, public fallback, or authentication via client-side JS.
 * Requires two PRIVATE Cloudflare Worker secrets:
 *   EDITORIAL_OWNER_PASSWORD, EDITORIAL_OWNER_SESSION_SECRET.
 * Missing either secret => fail closed (503); never leak the protected HTML.
 */
const ROOT="/redaktion", COOKIE="dar_editorial_owner_v1", TTL=14*86400;
function route(path){
  return path===ROOT||path===ROOT+"/"||path===ROOT+"/index.html"||
         path===ROOT+"/login"||path===ROOT+"/logout";
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
  return html(\`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>Private Redaktion · DĀR AL TAWḤĪD</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{min-height:100dvh;margin:0;padding:30px 16px;display:grid;place-items:center;background:radial-gradient(ellipse at 55% -10%,#254238,transparent 70%),#08120f;color:#f0e8d6;font:15px/1.7 system-ui,sans-serif}main{width:min(100%,430px);border:1px solid #74633f;border-radius:23px;padding:clamp(22px,5vw,39px);background:#12221e;box-shadow:0 30px 90px #0008}small{font-size:11px;letter-spacing:.18em;color:#e0c184}h1{font:normal 32px Georgia,serif;color:#e1c98e;margin:8px 0}p{color:#c8d2c5}label{display:block;margin:22px 0 7px}input,button{width:100%;min-height:50px;border-radius:13px;font:inherit}input{background:#0b1714;color:#fff;border:1px solid #7d826e;padding:12px}button{border:0;background:#d8c18b;color:#17261e;font-weight:850;margin-top:12px}strong{color:#ffdbad}.line{width:75px;height:1px;background:#ae9566;margin:20px 0}
</style></head><body><main><small>DĀR AL TAWḤĪD · NUR EIGENTÜMER</small><h1>Redaktionsatelier</h1><div class="line"></div><p>Neun Sprachen, Social-Media-Beiträge und Originalnachweise. Einmal anmelden – danach bleibt diese Browsersitzung gespeichert.</p>\${error?'<p role="alert"><strong>'+escape(error)+'</strong></p>':''}<form method="post" action="/redaktion/login"><label for="password">Privates Redaktionspasswort</label><input id="password" name="password" type="password" maxlength="256" autocomplete="current-password" required autofocus><button type="submit">Redaktion öffnen →</button></form><p><small>Serverseitig geschützter Zugang · keine öffentliche Beiträge-Seite</small></p></main></body></html>\`,status);
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
 const password=String(env&&env.EDITORIAL_OWNER_PASSWORD||"");
 const signing=String(env&&env.EDITORIAL_OWNER_SESSION_SECRET||"");
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
 const target=new URL(url.toString());target.pathname=ROOT+"/index.html";
 const asset=await env.ASSETS.fetch(new Request(target.toString(),{method:"GET"}));
 if(!asset.ok||asset.status>=300)return new Response("Redaktionsseite nicht verfügbar",{status:503,headers:hdr()});
 const headers=new Headers(asset.headers);
 for(const [k,v]of Object.entries(hdr()))headers.set(k,v);
 headers.set("Content-Type","text/html; charset=utf-8");
 headers.set("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
 headers.delete("ETag");headers.delete("Content-Length");
 return new Response(request.method==="HEAD"?null:asset.body,{status:200,headers});
}